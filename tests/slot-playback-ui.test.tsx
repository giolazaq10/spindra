import test from "node:test";
import assert from "node:assert/strict";
import React, { useState } from "react";
import { JSDOM } from "jsdom";
import type { PremiumResult } from "../src/components/PremiumSlots";
import { originals } from "../src/lib/catalog";
import { newCashRound } from "../src/lib/cashEngine";
import { supabase } from "../src/lib/supabase";
import { credits } from "../src/lib/money";
import type { SlotBonus } from "../src/lib/slotModels";
import type { Controls } from "../src/components/OriginalGame";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://fixture.invalid",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  sessionStorage: dom.window.sessionStorage,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
});
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
const { render, screen, fireEvent, act, cleanup } =
  await import("@testing-library/react");
const { default: AdvancedSlots } =
  await import("../src/components/AdvancedSlots");
const { default: PremiumSlots } =
  await import("../src/components/PremiumSlots");
type Result = PremiumResult & { bonus?: SlotBonus; base_rate?: number };
function cabinet(slug = "solar-vault", bonus = false) {
  const game = originals.find((g) => g.slug === slug)!;
  let cell = 0;
  const state = newCashRound(slug, { bet: 20 }, () =>
    bonus && cell++ < 3
      ? game
          .slot!.weights.slice(0, game.slot!.scatter!.symbol)
          .reduce((a, b) => a + b, 0)
      : 0,
  );
  const result = {
    ...state.data,
    returned_minor: state.returned_minor,
  } as Result;
  const requests: {
    stake: number;
    resolve: (r: Result) => void;
    reject: (e: Error) => void;
  }[] = [];
  let finishes = 0,
    starts = 0,
    setBalance!: (v: number) => void;
  function Harness() {
    const [bet, setBet] = useState(20);
    const [busy, setBusy] = useState(false),
      [balance, updateBalance] = useState(10000);
    setBalance = updateBalance;
    const c: Controls = {
      bet,
      start: () => {
        starts++;
        setBusy(true);
        return true;
      },
      finish: () => {
        finishes++;
        setBusy(false);
      },
      balance,
      busy,
      canStart: balance >= bet,
      setBet,
      stakes: [20, 50],
      setMessage: () => {},
      message: "",
      rules: false,
      toggleRules: () => {},
      poker: false,
      setLeaveReturn: () => {},
      modeLabel: "USD",
    };
    const Cabinet = game.slot!.premium ? PremiumSlots : AdvancedSlots;
    return (
      <Cabinet
        game={game}
        controls={c}
        serverSpin={(stake) =>
          new Promise<Result>((resolve, reject) => {
            requests.push({ stake, resolve, reject });
          })
        }
      />
    );
  }
  const app = render(<Harness />);
  return {
    app,
    requests,
    result,
    finishes: () => finishes,
    starts: () => starts,
    setBalance: (v: number) => setBalance(v),
  };
}
async function tick(ms: number) {
  await act(async () => {
    mockTick(ms);
  });
}
let mockTick: (ms: number) => void = () => {};
function setup(t: import("node:test").TestContext) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(performance, "now", () => 0);
  mockTick = (ms) => t.mock.timers.tick(ms);
  t.after(() => {
    cleanup();
    dom.window.localStorage.clear();
  });
}
for (const slug of [
  "solar-vault",
  "astra-cascade",
  "copper-lock",
  "nitro-sevens",
]) {
  for (const pending of [true, false])
    test(
      slug +
        " Stop reveals one authoritative result " +
        (pending ? "after pending confirmation" : "during confirmed animation"),
      async (t) => {
        setup(t);
        const h = cabinet(slug);
        fireEvent.click(
          screen.getByRole("button", { name: "Spin reels", exact: true }),
        );
        if (!pending)
          await act(async () => {
            h.requests[0].resolve(h.result);
          });
        fireEvent.click(
          screen.getByRole("button", { name: "Stop spin", exact: true }),
        );
        if (pending) {
          assert.equal(h.finishes(), 0);
          const waiting = screen.getByRole("button", {
            name: "Waiting for spin result",
          });
          assert.equal((waiting as HTMLButtonElement).disabled, true);
          fireEvent.click(waiting);
          assert.equal(h.requests.length, 1);
          await act(async () => {
            h.requests[0].resolve(h.result);
          });
        }
        assert.equal(h.finishes(), 1);
        assert.equal(
          h.app.container.querySelector(".deck-return strong")?.textContent,
          credits(h.result.returned_minor),
        );
        assert.ok(
          screen.getByRole("button", { name: "Spin reels", exact: true }),
        );
        await tick(10000);
        assert.equal(h.finishes(), 1);
        assert.equal(h.starts(), 1);
        assert.equal(h.requests.length, 1);
      },
    );
  test(
    slug + " keeps one working stake selector directly beside Spin",
    async (t) => {
      setup(t);
      const h = cabinet(slug);
      const selector = screen.getByRole("combobox", { name: "Total stake" });
      const action = selector.closest(".slot-wager-action")!;
      assert.ok(
        action.contains(
          screen.getByRole("button", { name: "Spin reels", exact: true }),
        ),
      );
      assert.equal(
        h.app.container.querySelectorAll(".slot-stake-control").length,
        1,
      );
      fireEvent.click(screen.getByRole("button", { name: "Increase stake" }));
      assert.equal((selector as HTMLSelectElement).value, "50");
      fireEvent.click(
        screen.getByRole("button", { name: "Spin reels", exact: true }),
      );
      assert.equal(h.requests[0].stake, 50);
      assert.equal((selector as HTMLSelectElement).disabled, true);
    },
  );
}
test("pressing primary Stop ends autoplay without submitting its next stake", async (t) => {
  setup(t);
  const h = cabinet();
  fireEvent.click(screen.getByRole("button", { name: "Start autoplay" }));
  await tick(20);
  fireEvent.click(
    screen.getByRole("button", { name: "Stop spin", exact: true }),
  );
  await act(async () => {
    h.requests[0].resolve(h.result);
  });
  await tick(10000);
  assert.equal(h.requests.length, 1);
  assert.equal(h.finishes(), 1);
});
test("stopping the base animation preserves an awarded free-spins bonus and its full return", async (t) => {
  setup(t);
  const h = cabinet("solar-vault", true);
  fireEvent.click(
    screen.getByRole("button", { name: "Spin reels", exact: true }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Stop spin", exact: true }),
  );
  await act(async () => {
    h.requests[0].resolve(h.result);
  });
  assert.ok(
    screen.getByRole("region", { name: "Scatter free-spins celebration" }),
  );
  assert.equal(h.finishes(), 0);
  fireEvent.click(
    screen.getByRole("button", { name: "Skip bonus animations" }),
  );
  assert.equal(h.finishes(), 1);
  assert.equal(
    h.app.container.querySelector(".deck-return strong")?.textContent,
    credits(h.result.returned_minor),
  );
  await tick(10000);
  assert.equal(h.requests.length, 1);
  assert.equal(h.finishes(), 1);
});
for (const slug of [
  "solar-vault",
  "astra-cascade",
  "copper-lock",
  "nitro-sevens",
])
  test(
    slug +
      " runs exactly the chosen number of auto spins with one confirmed request at a time",
    async (t) => {
      setup(t);
      const h = cabinet(slug);
      fireEvent.click(screen.getByLabelText("Quick spin"));
      fireEvent.change(screen.getByLabelText("Number of auto spins"), {
        target: { value: "3" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Start autoplay" }));
      await tick(20);
      assert.equal(h.requests.length, 1);
      await tick(5000);
      assert.equal(
        h.requests.length,
        1,
        "network wait cannot submit overlapping bets",
      );
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          h.requests[i].resolve(h.result);
        });
        await tick(600);
        assert.equal(h.finishes(), i + 1);
        await tick(20);
        assert.equal(h.requests.length, Math.min(3, i + 2));
      }
      await tick(10000);
      assert.equal(h.starts(), 3);
      assert.equal(h.requests.length, 3);
      assert.ok(screen.getByText("Autoplay complete."));
    },
  );

test("holding Space repeats quick confirmed spins; key repeat never overlaps and releasing stops the next bet", async (t) => {
  setup(t);
  const h = cabinet();
  fireEvent.keyDown(window, { code: "Space" });
  await tick(20);
  assert.equal(h.requests.length, 1);
  fireEvent.keyDown(window, { code: "Space", repeat: true });
  await tick(5000);
  assert.equal(h.requests.length, 1);
  await act(async () => {
    h.requests[0].resolve(h.result);
  });
  await tick(220);
  assert.equal(h.finishes(), 1, "hold-to-spin uses the quick presentation");
  await tick(20);
  assert.equal(h.requests.length, 2);
  fireEvent.keyUp(window, { code: "Space" });
  await act(async () => {
    h.requests[1].resolve(h.result);
  });
  await tick(1000);
  assert.equal(h.finishes(), 2);
  assert.equal(h.requests.length, 2);
});

for (const reason of [
  "stop",
  "blur",
  "hidden",
  "dialog",
  "leave",
  "error",
  "balance",
  "bonus",
] as const)
  test(
    "repeating play stops on " + reason + " without another paid request",
    async (t) => {
      setup(t);
      const h = cabinet("solar-vault", reason === "bonus");
      fireEvent.change(screen.getByLabelText("Number of auto spins"), {
        target: { value: "10" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Start autoplay" }));
      await tick(20);
      assert.equal(h.requests.length, 1);
      if (reason === "stop")
        fireEvent.click(screen.getByRole("button", { name: "Stop repeats" }));
      if (reason === "blur") fireEvent.blur(window);
      if (reason === "hidden") {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: true,
        });
        t.after(() => {
          delete (document as unknown as { hidden?: boolean }).hidden;
        });
        fireEvent(document, new dom.window.Event("visibilitychange"));
      }
      if (reason === "dialog") {
        const dialog = document.createElement("div");
        dialog.setAttribute("role", "dialog");
        document.body.append(dialog);
        t.after(() => dialog.remove());
      }
      if (reason === "leave") h.app.unmount();
      if (reason === "balance")
        await act(async () => {
          h.setBalance(0);
        });
      await act(async () => {
        if (reason === "error")
          h.requests[0].reject(new Error("Connection lost"));
        else h.requests[0].resolve(h.result);
      });
      await tick(600);
      if (reason === "bonus") {
        assert.ok(screen.getByText("10 FREE SPINS AWARDED"));
        fireEvent.click(
          screen.getByRole("button", { name: "Skip bonus animations" }),
        );
      }
      await tick(10000);
      assert.equal(h.requests.length, 1);
      assert.equal(h.starts(), 1);
    },
  );

test("Space in form controls does not bet and invalid autoplay counts cannot start", async (t) => {
  setup(t);
  const h = cabinet();
  const count = screen.getByLabelText("Number of auto spins");
  fireEvent.keyDown(count, { code: "Space" });
  await tick(1000);
  assert.equal(h.requests.length, 0);
  for (const value of ["0", "1001", "2.5", ""]) {
    fireEvent.change(count, { target: { value } });
    assert.equal(
      (
        screen.getByRole("button", {
          name: "Start autoplay",
        }) as HTMLButtonElement
      ).disabled,
      true,
    );
  }
});

test("sound and music can be muted separately and volume preferences survive remounting", async (t) => {
  setup(t);
  const h = cabinet();
  fireEvent.click(
    screen.getByRole("button", { name: "Sound on", exact: true }),
  );
  assert.equal(
    screen
      .getByRole("button", { name: "Sound off", exact: true })
      .getAttribute("aria-pressed"),
    "false",
  );
  assert.equal(
    screen
      .getByRole("button", { name: "Music on", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Music on", exact: true }),
  );
  fireEvent.change(screen.getByLabelText("Slot audio volume"), {
    target: { value: "15" },
  });
  assert.deepEqual(
    JSON.parse(dom.window.localStorage.getItem("spindra:slot-audio:v1")!),
    {
      sound: false,
      music: false,
      volume: 0.15,
    },
  );
  h.app.unmount();
  cabinet("nitro-sevens");
  assert.ok(screen.getByRole("button", { name: "Sound off", exact: true }));
  assert.ok(screen.getByRole("button", { name: "Music off", exact: true }));
  assert.equal(
    (screen.getByLabelText("Slot audio volume") as HTMLInputElement).value,
    "15",
  );
});

test("autoplay uses authenticated cash requests with distinct IDs and stops at the confirmed empty wallet", async (t) => {
  setup(t);
  const { MemoryRouter } = await import("react-router-dom");
  const { AuthContext } = await import("../src/context/authState");
  const { WalletProvider } = await import("../src/context/Wallet");
  t.after(async () => {
    await supabase.auth.stopAutoRefresh();
  });
  const { default: CashGame } = await import("../src/components/CashGame");
  const { publicCash } = await import("../src/lib/cashEngine");
  const game = originals.find((g) => g.slug === "solar-vault")!;
  let seed = 417;
  const rng = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  let loss = newCashRound(game.slug, { bet: 20 }, rng);
  while (loss.returned_minor !== 0)
    loss = newCashRound(game.slug, { bet: 20 }, rng);
  const starts: { request_key: string; input: { bet: number } }[] = [];
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
      if (options.body.action === "status")
        return {
          data: {
            enabled: true,
            reason: null,
            active: null,
            balance_minor: 40,
          },
          error: null,
        };
      assert.equal(options.body.action, "start");
      starts.push(options.body);
      return {
        data: {
          id: options.body.request_key,
          revision: 0,
          game: game.slug,
          state: "settled",
          balance_minor: 40 - starts.length * 20,
          view: publicCash(loss),
        },
        error: null,
      };
    },
  );
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
            <CashGame game={game} />
          </WalletProvider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
  });
  fireEvent.click(screen.getByLabelText("Quick spin"));
  fireEvent.change(screen.getByLabelText("Number of auto spins"), {
    target: { value: "3" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Start autoplay" }));
  for (let i = 0; i < 3; i++) {
    await tick(20);
    await tick(600);
  }
  assert.equal(starts.length, 2);
  assert.equal(new Set(starts.map((s) => s.request_key)).size, 2);
  assert.ok(starts.every((s) => s.input.bet === 20));
  await tick(10000);
  assert.equal(starts.length, 2);
  assert.equal(sessionStorage.length, 0);
});
