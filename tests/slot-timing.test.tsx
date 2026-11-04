import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { JSDOM } from "jsdom";
import AdvancedSlots from "../src/components/AdvancedSlots";
import { originals } from "../src/lib/catalog";
import { newCashRound, publicCash } from "../src/lib/cashEngine";
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
for (const { delay, reduced } of [
  { delay: 0, reduced: false },
  { delay: 1500, reduced: false },
  { delay: 0, reduced: true },
])
  test(
    "Slot reels start before a " +
      delay +
      "ms response" +
      (reduced
        ? " and honor reduced motion"
        : " and land separately even after a delayed confirmation"),
    async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      Object.defineProperty(dom.window, "matchMedia", {
        configurable: true,
        value: () => ({ matches: reduced }),
      });
      t.after(() => {
        delete (dom.window as unknown as { matchMedia?: unknown }).matchMedia;
      });
      let now = 0,
        finished = 0,
        starts = 0;
      t.mock.method(performance, "now", () => now);
      const game = originals.find((g) => g.slug === "dragon-atelier")!;
      const state = newCashRound(game.slug, { bet: 100 }, () => 0),
        result = publicCash(state).result as {
          grid: number[][];
          wins: [];
          rate: number;
        };
      let resolve!: (r: typeof result & { returned_minor: number }) => void;
      const response = new Promise<typeof result & { returned_minor: number }>(
        (r) => {
          resolve = r;
        },
      );
      const controls: Controls = {
        bet: 100,
        start: () => {
          starts++;
          return true;
        },
        finish: () => {
          finished++;
        },
        setMessage: () => {},
        balance: 10000,
        busy: false,
        setBet: () => {},
        stakes: [100, 200],
        message: "",
        rules: false,
        toggleRules: () => {},
        poker: false,
        setLeaveReturn: () => {},
        modeLabel: "USD",
        canStart: true,
      };
      const app = render(
        <AdvancedSlots
          game={game}
          controls={controls}
          serverSpin={() => {
            assert.ok(
              document.querySelector(".reel-moving"),
              "motion is committed before the request starts",
            );
            return response;
          }}
        />,
      );
      const firstSymbol = app.container.querySelector(".symbol-cell svg");
      const symbolCount = app.container.querySelectorAll(".symbol-cell").length;
      fireEvent.click(
        screen.getByRole("button", { name: "Spin reels", exact: true }),
      );
      assert.equal(app.container.querySelectorAll(".reel-moving").length, 6);
      assert.equal(
        app.container.querySelector(".symbol-cell svg"),
        firstSymbol,
      );
      assert.equal(
        app.container.querySelectorAll(".symbol-cell").length,
        symbolCount,
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Spinning reels", exact: true }),
      );
      assert.equal(starts, 1);
      await act(async () => {
        now = delay;
        t.mock.timers.tick(delay);
      });
      assert.equal(finished, 0);
      assert.equal(app.container.querySelector(".slot-win-overlay"), null);
      await act(async () => {
        resolve({ ...result, returned_minor: state.returned_minor });
      });
      if (reduced) {
        await act(async () => {
          t.mock.timers.tick(0);
        });
        assert.equal(
          app.container.querySelectorAll(".reel-moving, .reel-landing").length,
          0,
        );
      } else {
        await act(async () => {
          now += delay ? 0 : 180;
          t.mock.timers.tick(delay ? 0 : 180);
        });
        assert.equal(app.container.querySelectorAll(".reel-moving").length, 5);
        assert.equal(app.container.querySelectorAll(".reel-landing").length, 1);
        for (let col = 1; col < 6; col++) {
          await act(async () => {
            now += 60;
            t.mock.timers.tick(60);
          });
          assert.equal(
            app.container.querySelectorAll(".reel-moving").length,
            5 - col,
          );
          assert.ok(
            app.container.querySelector(
              '[data-reel="' + (col + 1) + '"].reel-landing',
            ),
          );
          assert.equal(finished, 0, "result waits for the last reel to land");
        }
        assert.equal(
          (
            screen.getByRole("button", {
              name: "Spinning reels",
              exact: true,
            }) as HTMLButtonElement
          ).disabled,
          true,
        );
        await act(async () => {
          now += 110;
          t.mock.timers.tick(110);
        });
      }
      assert.equal(finished, 1);
      assert.ok(app.container.querySelector(".slot-win-overlay"));
      fireEvent.click(
        screen.getByRole("button", { name: "Dismiss win celebration" }),
      );
      assert.equal(app.container.querySelector(".slot-win-overlay"), null);
      assert.equal(finished, 1);
      assert.equal(starts, 1);
      assert.equal(app.container.querySelectorAll(".reel-moving").length, 0);
      assert.equal(
        (
          screen.getByRole("button", {
            name: "Spin reels",
            exact: true,
          }) as HTMLButtonElement
        ).disabled,
        false,
      );
      cleanup();
    },
  );
test("Leaving a slot before the server returns cannot schedule animations or finish a different game", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let finished = 0;
  const game = originals.find((g) => g.slug === "solar-vault")!;
  const state = newCashRound(game.slug, { bet: 100 }, () => 0),
    result = publicCash(state).result as {
      grid: number[][];
      wins: [];
      rate: number;
    };
  let resolve!: (r: typeof result & { returned_minor: number }) => void;
  const response = new Promise<typeof result & { returned_minor: number }>(
    (r) => {
      resolve = r;
    },
  );
  const controls: Controls = {
    bet: 100,
    start: () => true,
    finish: () => {
      finished++;
    },
    setMessage: () => {},
    balance: 10000,
    busy: false,
    setBet: () => {},
    stakes: [100],
    message: "",
    rules: false,
    toggleRules: () => {},
    poker: false,
    setLeaveReturn: () => {},
    modeLabel: "USD",
  };
  const app = render(
    <AdvancedSlots
      game={game}
      controls={controls}
      serverSpin={() => response}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Spin reels", exact: true }),
  );
  app.unmount();
  await act(async () => {
    resolve({ ...result, returned_minor: state.returned_minor });
  });
  await act(async () => {
    t.mock.timers.tick(10000);
  });
  assert.equal(finished, 0);
  cleanup();
});
