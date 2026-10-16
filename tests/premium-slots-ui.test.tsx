import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { JSDOM } from "jsdom";
import { originals } from "../src/lib/catalog";
import { newCashRound, publicCash } from "../src/lib/cashEngine";
import PremiumSlots, {
  type PremiumResult,
} from "../src/components/PremiumSlots";
import type { Controls } from "../src/components/OriginalGame";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://fixture.invalid",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
});
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
const { render, screen, fireEvent, act, cleanup } =
  await import("@testing-library/react");
for (const [slug, cells, label] of [
  ["astra-cascade", 30, "Six by five crystal board"],
  ["copper-lock", 9, "Nine locking coin sockets"],
  ["nitro-sevens", 3, "Three chrome slot drums"],
] as const)
  test(
    slug +
      " presents its own cabinet and skips only confirmed animations without a second settlement",
    async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      t.mock.method(performance, "now", () => 0);
      const game = originals.find((g) => g.slug === slug)!,
        state = newCashRound(slug, { bet: 20 }, () => 0),
        data = publicCash(state).result as PremiumResult;
      let finish = 0,
        starts = 0,
        resolve!: (r: PremiumResult) => void;
      const response = new Promise<PremiumResult>((r) => {
        resolve = r;
      });
      const c: Controls = {
        bet: 20,
        start: () => {
          starts++;
          return true;
        },
        finish: (paid) => {
          finish++;
          assert.equal(paid, state.returned_minor);
        },
        setMessage: () => {},
        balance: 10000,
        busy: false,
        setBet: () => {},
        stakes: [20, 50, 100],
        message: "",
        rules: false,
        toggleRules: () => {},
        poker: false,
        setLeaveReturn: () => {},
        modeLabel: "USD",
        canStart: true,
      };
      const app = render(
        <PremiumSlots
          game={game}
          controls={c}
          serverSpin={() => {
            assert.ok(
              document.querySelector(".premium-spinning"),
              "motion is committed before the request starts",
            );
            return response;
          }}
        />,
      );
      assert.equal(screen.getByLabelText(label).children.length, cells);
      const spin = screen.getByRole("button", {
          name: "Spin reels",
          exact: true,
        }),
        consoleNode = spin.parentElement;
      fireEvent.click(spin);
      assert.equal(starts, 1);
      assert.ok(app.container.querySelector(".premium-spinning"));
      assert.equal(app.container.querySelector(".signature-motion"), null);
      assert.equal(
        (
          screen.getByRole("button", {
            name: "Skip confirmed animation",
          }) as HTMLButtonElement
        ).disabled,
        true,
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Spinning reels", exact: true }),
      );
      assert.equal(starts, 1);
      await act(async () => {
        resolve({ ...data, returned_minor: state.returned_minor });
      });
      await act(async () => {
        t.mock.timers.tick(210);
      });
      const skip = screen.getByRole("button", {
        name: "Skip confirmed animation",
      });
      assert.equal((skip as HTMLButtonElement).disabled, false);
      fireEvent.click(skip);
      assert.equal(finish, 1);
      assert.equal(
        screen.getByRole("button", { name: "Spin reels", exact: true })
          .parentElement,
        consoleNode,
      );
      await act(async () => {
        t.mock.timers.tick(10000);
      });
      assert.equal(finish, 1);
      assert.ok(app.container.querySelector(".signature-award"));
      cleanup();
    },
  );
test("Premium slot navigation before response cancels presentation but never invents a return", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const game = originals.find((g) => g.slug === "astra-cascade")!,
    state = newCashRound(game.slug, { bet: 20 }, () => 0),
    data = publicCash(state).result as PremiumResult;
  let finish = 0,
    resolve!: (r: PremiumResult) => void;
  const response = new Promise<PremiumResult>((r) => {
    resolve = r;
  });
  const c: Controls = {
    bet: 20,
    start: () => true,
    finish: () => {
      finish++;
    },
    setMessage: () => {},
    balance: 10000,
    busy: false,
    setBet: () => {},
    stakes: [20],
    message: "",
    rules: false,
    toggleRules: () => {},
    poker: false,
    setLeaveReturn: () => {},
    modeLabel: "USD",
  };
  const app = render(
    <PremiumSlots game={game} controls={c} serverSpin={() => response} />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Spin reels", exact: true }),
  );
  app.unmount();
  await act(async () => {
    resolve({ ...data, returned_minor: state.returned_minor });
  });
  await act(async () => {
    t.mock.timers.tick(10000);
  });
  assert.equal(finish, 0);
  cleanup();
});
