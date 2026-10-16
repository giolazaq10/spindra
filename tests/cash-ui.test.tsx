import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../src/context/authState";
import { WalletProvider } from "../src/context/Wallet";
import { supabase } from "../src/lib/supabase";
import { originals } from "../src/lib/catalog";
import { newCashRound, publicCash } from "../src/lib/cashEngine";
import CashGame from "../src/components/CashGame";
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
test("Cash poker requests an authenticated server round and renders player cards while hiding opponents", async (t) => {
  const calls = [];
  const state = newCashRound("royal-draw", { bet: 1000 }, (n) => n - 1);
  const fixture = {
    id: crypto.randomUUID(),
    revision: 0,
    game: "royal-draw",
    state: state.phase,
    balance_minor: 9000,
    view: publicCash(state),
  };
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
      calls.push(options.body);
      return {
        data:
          options.body.action === "status"
            ? {
                enabled: true,
                reason: null,
                active: null,
                balance_minor: 10000,
              }
            : fixture,
        error: null,
      };
    },
  );
  try {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider
            value={{
              user: {
                id: "11111111-1111-4111-8111-111111111111",
              } as import("@supabase/supabase-js").User,
              loading: false,
            }}
          >
            <WalletProvider>
              <CashGame
                game={originals.find((g) => g.slug === "royal-draw")!}
              />
            </WalletProvider>
          </AuthContext.Provider>
        </MemoryRouter>,
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Deal cards" }));
    });
    const start = calls.find((c) => c.action === "start");
    assert.ok(start);
    assert.equal(start.input.bet, 1000);
    assert.equal(start.userId, undefined);
    assert.equal(start.returned_minor, undefined);
    assert.match(start.request_key, /^[0-9a-f-]{36}$/);
    assert.equal(screen.getAllByLabelText("Face-down card").length, 4);
    assert.ok(screen.getByRole("heading", { name: /You/ }));
    assert.ok(screen.getByLabelText("Community cards"));
    assert.ok(screen.getByLabelText("Poker table totals"));
    assert.ok(screen.getByText("Your chips"));
    assert.ok(screen.getByText("Your private cards"));
    assert.equal(screen.getAllByText("Cards hidden").length, 2);
    assert.equal(sessionStorage.length, 0);
  } finally {
    cleanup();
    sessionStorage.clear();
  }
});

for (const [slug, label] of [
  ["prism-dice", "Roll dice"],
  ["meteor-plinko", "Drop meteor"],
  ["festival-wheel", "Spin wheel"],
]) {
  test(
    slug +
      " sends only input to the authenticated cash endpoint and uses its saved return",
    async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      const calls = [];
      const state = newCashRound(slug, { bet: 20 }, () => 0);
      const fixture = {
        id: crypto.randomUUID(),
        revision: 0,
        game: slug,
        state: "settled",
        balance_minor: 10000 - 20 + state.returned_minor,
        view: publicCash(state),
      };
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
          calls.push(options.body);
          return {
            data:
              options.body.action === "status"
                ? {
                    enabled: true,
                    reason: null,
                    active: null,
                    balance_minor: 10000,
                  }
                : fixture,
            error: null,
          };
        },
      );
      try {
        await act(async () => {
          render(
            <MemoryRouter>
              <AuthContext.Provider
                value={{
                  user: {
                    id: "11111111-1111-4111-8111-111111111111",
                  } as import("@supabase/supabase-js").User,
                  loading: false,
                }}
              >
                {" "}
                <WalletProvider>
                  <CashGame game={originals.find((g) => g.slug === slug)!} />
                </WalletProvider>
              </AuthContext.Provider>
            </MemoryRouter>,
          );
        });
        await act(async () => {
          fireEvent.click(
            screen.getByRole("button", { name: label, exact: true }),
          );
        });
        const start = calls.find((c) => c.action === "start");
        assert.equal(start.game, slug);
        assert.equal(start.input.bet, 20);
        assert.deepEqual(Object.keys(start.input).sort(), [
          "bet",
          "over",
          "threshold",
        ]);
        assert.match(start.request_key, /^[0-9a-f-]{36}$/);
        await act(async () => {
          t.mock.timers.tick(4000);
        });
        assert.ok(
          screen.getByText(
            (state.returned_minor / 100).toFixed(2) +
              " · " +
              (state.returned_minor / state.stake_minor).toFixed(2) +
              "×",
          ),
        );
        assert.equal(sessionStorage.length, 0);
      } finally {
        cleanup();
        sessionStorage.clear();
      }
    },
  );
}

for (const slug of ["astra-cascade", "copper-lock", "nitro-sevens"])
  test(
    slug +
      " launches through the authenticated cash endpoint with one twenty-cent stake for every included stage",
    async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      const calls = [];
      const state = newCashRound(slug, { bet: 20 }, () => 0),
        fixture = {
          id: crypto.randomUUID(),
          revision: 0,
          game: slug,
          state: "settled",
          balance_minor: 9980 + state.returned_minor,
          view: publicCash(state),
        };
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
          calls.push(options.body);
          return {
            data:
              options.body.action === "status"
                ? {
                    enabled: true,
                    reason: null,
                    active: null,
                    balance_minor: 10000,
                  }
                : fixture,
            error: null,
          };
        },
      );
      try {
        await act(async () => {
          render(
            <MemoryRouter>
              <AuthContext.Provider
                value={{
                  user: {
                    id: "11111111-1111-4111-8111-111111111111",
                  } as import("@supabase/supabase-js").User,
                  loading: false,
                }}
              >
                <WalletProvider>
                  <CashGame game={originals.find((g) => g.slug === slug)!} />
                </WalletProvider>
              </AuthContext.Provider>
            </MemoryRouter>,
          );
        });
        await act(async () => {
          fireEvent.click(
            screen.getByRole("button", { name: "Spin reels", exact: true }),
          );
        });
        await act(async () => {
          t.mock.timers.tick(10000);
        });
        const starts = calls.filter((c) => c.action === "start");
        assert.equal(starts.length, 1);
        assert.equal(starts[0].input.bet, 20);
        assert.equal(starts[0].input.returned_minor, undefined);
        assert.equal(sessionStorage.length, 0);
        assert.ok(
          screen.getByRole("button", { name: "Spin reels", exact: true }),
        );
      } finally {
        cleanup();
        sessionStorage.clear();
      }
    },
  );
