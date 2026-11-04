import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { JSDOM } from "jsdom";
import AdvancedSlots from "../src/components/AdvancedSlots";
import { originals } from "../src/lib/catalog";
import { newCashRound } from "../src/lib/cashEngine";
import type { SlotBonus, SlotWin } from "../src/lib/slotModels";
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

for (const skip of [false, true])
  test(
    "confirmed free spins " +
      (skip ? "skip safely" : "play every saved frame") +
      " without another wallet request",
    async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      t.mock.method(performance, "now", () => 0);
      const game = originals.find((g) => g.slug === "solar-vault")!;
      let cell = 0,
        starts = 0,
        requests = 0,
        finishes = 0,
        paid = 0;
      const state = newCashRound(game.slug, { bet: 20 }, () =>
        cell++ < 3
          ? game
              .slot!.weights.slice(0, game.slot!.scatter!.symbol)
              .reduce((a, b) => a + b, 0)
          : 0,
      );
      const result = {
        ...state.data,
        returned_minor: state.returned_minor,
      } as {
        grid: number[][];
        wins: SlotWin[];
        rate: number;
        base_rate: number;
        bonus: SlotBonus;
        returned_minor: number;
      };
      const controls: Controls = {
        bet: 20,
        start: () => {
          starts++;
          return true;
        },
        finish: (amount) => {
          finishes++;
          paid = amount;
        },
        setMessage: () => {},
        balance: 1000,
        busy: false,
        setBet: () => {},
        stakes: [20, 50],
        message: "",
        rules: false,
        toggleRules: () => {},
        poker: false,
        setLeaveReturn: () => {},
        modeLabel: "USD",
        canStart: true,
      };
      let resolve!: (r: typeof result) => void;
      const response = new Promise<typeof result>((r) => {
        resolve = r;
      });
      const app = render(
        <AdvancedSlots
          game={game}
          controls={controls}
          serverSpin={() => {
            requests++;
            return response;
          }}
        />,
      );
      try {
        const consoleBefore = app.container.querySelector(".slot-console");
        fireEvent.click(
          screen.getByRole("button", { name: "Spin reels", exact: true }),
        );
        assert.equal(screen.queryByText("10 FREE SPINS AWARDED"), null);
        await act(async () => {
          resolve(result);
        });
        await act(async () => {
          t.mock.timers.tick(550);
        });
        assert.ok(screen.getByText("10 FREE SPINS AWARDED"));
        assert.equal(finishes, 0);
        assert.equal(
          (screen.getByLabelText("Total stake") as HTMLSelectElement).disabled,
          true,
        );
        fireEvent.click(
          screen.getByRole("button", { name: "Start free spins" }),
        );
        await act(async () => {
          t.mock.timers.tick(530);
        });
        assert.ok(screen.getByText("FREE SPINS · 9 LEFT"));
        if (skip)
          fireEvent.click(
            screen.getByRole("button", { name: "Skip bonus animations" }),
          );
        else
          for (let i = 0; i < 10; i++) {
            await act(async () => {
              t.mock.timers.tick(500);
            });
            if (i < 9)
              await act(async () => {
                t.mock.timers.tick(530);
              });
          }
        assert.ok(screen.getByText("FREE SPINS COMPLETE"));
        assert.equal(paid, state.returned_minor);
        assert.equal(finishes, 1);
        assert.equal(starts, 1);
        assert.equal(requests, 1);
        assert.equal(
          app.container.querySelector(".slot-console"),
          consoleBefore,
        );
        await act(async () => {
          t.mock.timers.tick(10000);
        });
        assert.equal(finishes, 1);
        app.unmount();
        // A refreshed cabinet shows the saved bonus as complete; it cannot debit or claim it again.
        render(
          <AdvancedSlots
            game={game}
            controls={controls}
            initialResult={{ ...result, stake_minor: 20 }}
            serverSpin={async () => {
              throw Error("Unexpected request");
            }}
          />,
        );
        assert.ok(screen.getByText("FREE SPINS COMPLETE"));
        assert.equal(
          screen.queryByRole("button", { name: "Start free spins" }),
          null,
        );
        assert.equal(finishes, 1);
      } finally {
        cleanup();
      }
    },
  );
