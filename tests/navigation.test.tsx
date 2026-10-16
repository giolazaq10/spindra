import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React from "react";
import { createMemoryRouter, RouterProvider, Link } from "react-router-dom";
import { AuthContext } from "../src/context/authState";
import { WalletProvider, useWallet } from "../src/context/Wallet";
import { supabase } from "../src/lib/supabase";
import { originals } from "../src/lib/catalog";
import { newCashRound, nextCashRound, publicCash } from "../src/lib/cashEngine";
import OriginalGame from "../src/components/OriginalGame";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://fixture.invalid",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  sessionStorage: dom.window.sessionStorage,
});
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
const { render, screen, fireEvent, act, cleanup } =
  await import("@testing-library/react");
const uid = "11111111-1111-4111-8111-111111111111";
function Balance() {
  const w = useWallet();
  return <output data-testid="cash-balance">{w.balance}</output>;
}
function setup(t, invoke, user = true, slug = "prism-dice") {
  t.mock.method(supabase.auth, "getSession", async () => ({
    data: { session: { access_token: "fixture-token" } },
    error: null,
  }));
  t.mock.method(
    Object.getPrototypeOf(supabase.functions),
    "invoke",
    async (name, options) => {
      assert.equal(name, "cash-games");
      assert.equal(options.headers.Authorization, "Bearer fixture-token");
      return invoke(options.body);
    },
  );
  const router = createMemoryRouter(
    [
      {
        path: "/games",
        element: (
          <>
            <h1>LOBBY</h1>
            <Link to={"/game/" + slug}>Open game</Link>
          </>
        ),
      },
      {
        path: "/game/" + slug,
        element: (
          <OriginalGame game={originals.find((g) => g.slug === slug)!} />
        ),
      },
    ],
    { initialEntries: ["/games"] },
  );
  render(
    <AuthContext.Provider
      value={{
        user: user
          ? ({ id: uid } as import("@supabase/supabase-js").User)
          : null,
        loading: false,
      }}
    >
      <WalletProvider>
        <Balance />
        <RouterProvider router={router} />
      </WalletProvider>
    </AuthContext.Provider>,
  );
  return router;
}
test("Guest game routes require sign-in and expose no practice balance or mode selector", async (t) => {
  let calls = 0;
  setup(
    t,
    async () => {
      calls++;
      return { data: {}, error: null };
    },
    false,
  );
  fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  assert.ok(screen.getByRole("heading", { name: "Sign in to play" }));
  assert.equal(screen.queryByText(/practice/i), null);
  assert.equal(screen.getByTestId("cash-balance").textContent, "0");
  assert.equal(calls, 0);
  cleanup();
});
test("Cash-only game route hydrates the server wallet and accepts only a server-settled return", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let starts = 0;
  const state = newCashRound("prism-dice", { bet: 100 }, () => 0),
    response = {
      id: crypto.randomUUID(),
      revision: 0,
      game: "prism-dice",
      state: "settled",
      balance_minor: 10000 - 100 + state.returned_minor,
      view: publicCash(state),
    };
  setup(t, async (body) => {
    if (body.action === "start") {
      starts++;
      assert.equal(body.input.bet, 100);
      return { data: response, error: null };
    }
    return {
      data: { enabled: true, balance_minor: 10000, active: null, reason: null },
      error: null,
    };
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  });
  assert.equal(screen.getByTestId("cash-balance").textContent, "10000");
  assert.equal(screen.queryByText(/practice/i), null);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
  });
  assert.equal(
    screen.getByTestId("cash-balance").textContent,
    String(response.balance_minor),
  );
  assert.equal(
    (screen.getByRole("combobox", { name: "Total stake" }) as HTMLSelectElement)
      .disabled,
    true,
  );
  await act(async () => {
    t.mock.timers.tick(5000);
  });
  assert.equal(starts, 1);
  assert.equal(sessionStorage.length, 0);
  cleanup();
});
test("A lost cash response is recovered after Back without a second bet or a reset wallet", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let starts = 0,
    recovered = 0,
    saved: Record<string, unknown> = {};
  const state = newCashRound("prism-dice", { bet: 100 }, () => 0),
    response = {
      id: crypto.randomUUID(),
      revision: 0,
      game: "prism-dice",
      state: "settled",
      balance_minor: 10094,
      view: publicCash(state),
    };
  const router = setup(t, async (body) => {
    if (body.action === "start") {
      starts++;
      saved = body;
      return { data: null, error: new Error("Network interrupted") };
    }
    if (body.action === "recover") {
      recovered++;
      assert.equal(body.request_key, saved.request_key);
      return { data: { round: response }, error: null };
    }
    return {
      data: {
        enabled: true,
        balance_minor: starts ? response.balance_minor : 10000,
        active: null,
        reason: null,
      },
      error: null,
    };
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
  });
  assert.equal(sessionStorage.length, 1);
  assert.ok(screen.getByText(/An unconfirmed request is saved/));
  await act(async () => {
    void router.navigate(-1);
  });
  assert.ok(screen.getByRole("heading", { name: "LOBBY" }));
  await act(async () => {
    fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  });
  assert.equal(starts, 1);
  assert.equal(recovered, 1);
  assert.equal(sessionStorage.length, 0);
  assert.equal(screen.getByTestId("cash-balance").textContent, "10094");
  cleanup();
});
test("Paused cash play shows the actual server reason and never falls back to practice", async (t) => {
  setup(t, async () => ({
    data: {
      enabled: false,
      balance_minor: 10000,
      active: null,
      reason: "Verified adult account required",
    },
    error: null,
  }));
  await act(async () => {
    fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  });
  assert.ok(screen.getByText("Verified adult account required"));
  assert.equal(screen.queryByRole("button", { name: "Roll dice" }), null);
  assert.equal(screen.queryByText(/practice/i), null);
  cleanup();
});
test("Insufficient real balance disables wagering while stake selection remains available", async (t) => {
  setup(t, async () => ({
    data: { enabled: true, balance_minor: 50, active: null, reason: null },
    error: null,
  }));
  await act(async () => {
    fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  });
  assert.equal(
    (screen.getByRole("button", { name: "Roll dice" }) as HTMLButtonElement)
      .disabled,
    true,
  );
  assert.equal(
    (screen.getByRole("combobox", { name: "Total stake" }) as HTMLSelectElement)
      .disabled,
    false,
  );
  cleanup();
});

test("An existing cash hand can settle at zero balance while new wagering is paused", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const state = newCashRound("royal-draw", { bet: 1000 }, (n) => n - 1),
    id = crypto.randomUUID();
  let acted = 0;
  const round = {
    id,
    revision: 0,
    game: "royal-draw",
    state: "open",
    view: publicCash(state),
  };
  setup(
    t,
    async (body) => {
      if (body.action === "act") {
        acted++;
        const settled = nextCashRound(state, { action: "abandon" }, () => 0);
        return {
          data: {
            ...round,
            revision: 1,
            state: "settled",
            balance_minor: settled.returned_minor,
            view: publicCash(settled),
          },
          error: null,
        };
      }
      return {
        data: {
          enabled: false,
          reason: "Cash wagering is not enabled",
          balance_minor: 0,
          active: round,
        },
        error: null,
      };
    },
    true,
    "royal-draw",
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  });
  assert.equal(screen.getByTestId("cash-balance").textContent, "0");
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Leave hand: fold and return uncommitted chips",
      }),
    );
  });
  assert.equal(acted, 1);
  assert.ok(Number(screen.getByTestId("cash-balance").textContent) >= 0);
  cleanup();
});

test("Normal in-flight bets persist safely without displaying recovery confirmation", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const state = newCashRound("prism-dice", { bet: 100 }, () => 0),
    response = {
      id: crypto.randomUUID(),
      revision: 0,
      game: "prism-dice",
      state: "settled",
      balance_minor: 10094,
      view: publicCash(state),
    };
  let resolve!: (r: { data: typeof response; error: null }) => void;
  let starts = 0;
  const request = new Promise<{ data: typeof response; error: null }>((r) => {
    resolve = r;
  });
  setup(t, async (body) => {
    if (body.action === "start") {
      starts++;
      return request;
    }
    return {
      data: { enabled: true, balance_minor: 10000, active: null, reason: null },
      error: null,
    };
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
  });
  assert.equal(sessionStorage.length, 1);
  assert.equal(starts, 1);
  assert.equal(screen.queryByText(/An unconfirmed request is saved/), null);
  assert.equal(screen.queryByRole("button", { name: "Recover result" }), null);
  assert.equal(
    screen.queryByRole("button", { name: "Retry same request" }),
    null,
  );
  await act(async () => {
    t.mock.timers.tick(1000);
  });
  assert.equal(screen.queryByText(/An unconfirmed request is saved/), null);
  await act(async () => {
    resolve({ data: response, error: null });
  });
  assert.equal(sessionStorage.length, 0);
  assert.equal(screen.getByTestId("cash-balance").textContent, "10094");
  assert.equal(starts, 1);
  cleanup();
});
