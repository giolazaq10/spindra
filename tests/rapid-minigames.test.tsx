import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { JSDOM } from "jsdom";
import RapidMiniGames from "../src/components/RapidMiniGames";
import type { Controls } from "../src/components/OriginalGame";
import { miniPlay, type MiniResult } from "../src/lib/minigames";
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
function controls(balance = 1000): Controls {
  return {
    bet: 100,
    start: () => true,
    finish: () => {},
    setMessage: () => {},
    balance,
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
}
for (const type of ["dice", "plinko"] as const)
  test(
    type +
      " accepts repeated clicks, snapshots settings, submits in order and does not wait for animations",
    async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      const calls: Record<string, unknown>[] = [],
        waiting: ((r: MiniResult) => void)[] = [];
      const serverPlay = (input: Record<string, unknown>) => {
        calls.push(input);
        return new Promise<MiniResult>((resolve) => waiting.push(resolve));
      };
      const c = controls();
      const app = render(
        <RapidMiniGames type={type} controls={c} serverPlay={serverPlay} />,
      );
      const label = type === "dice" ? "Roll dice" : "Drop meteor";
      fireEvent.click(screen.getByRole("button", { name: label }));
      app.rerender(
        <RapidMiniGames
          type={type}
          controls={{ ...c, bet: 200, busy: true }}
          serverPlay={serverPlay}
        />,
      );
      if (type === "dice")
        fireEvent.change(screen.getByRole("slider", { name: "Win chance" }), {
          target: { value: "25" },
        });
      fireEvent.click(screen.getByRole("button", { name: label }));
      fireEvent.click(screen.getByRole("button", { name: label }));
      assert.equal(calls.length, 1);
      assert.ok(screen.getByText(/3 bets pending/));
      let balance = 1000;
      for (let i = 0; i < 3; i++) {
        const stake = i === 0 ? 100 : 200;
        assert.equal(calls[i].bet, stake);
        if (type === "dice")
          assert.equal(calls[i].threshold, i === 0 ? 5000 : 2500);
        const result = miniPlay(type, stake, calls[i], (n) => n - 1);
        balance += result.returned_minor - stake;
        await act(async () => {
          waiting[i]({ ...result, balance_minor: balance });
        });
        assert.equal(calls.length, Math.min(3, i + 2));
      }
      assert.ok(screen.getByText(/Ready for the next bet/));
      assert.equal(
        screen.getByLabelText("Recent bet results").children.length,
        3,
      );
      if (type === "plinko")
        assert.equal(app.container.querySelectorAll(".plinko-ball").length, 3);
      await act(async () => {
        t.mock.timers.tick(2000);
      });
      assert.equal(app.container.querySelectorAll(".plinko-ball").length, 0);
      cleanup();
    },
  );
test("Queue capacity and pending stakes prevent queuing more than the known wallet can fund", async () => {
  let calls = 0;
  const serverPlay = () => {
    calls++;
    return new Promise<MiniResult>(() => {});
  };
  render(
    <RapidMiniGames
      type="dice"
      controls={controls(300)}
      serverPlay={serverPlay}
    />,
  );
  for (let i = 0; i < 10; i++)
    fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
  assert.equal(calls, 1);
  assert.ok(screen.getByText(/3 bets pending/));
  assert.equal(
    (screen.getByRole("button", { name: "Roll dice" }) as HTMLButtonElement)
      .disabled,
    true,
  );
  cleanup();
});
test("A failed response cancels unsubmitted queued bets and never retries automatically", async () => {
  let calls = 0,
    reject!: (e: Error) => void;
  const messages: string[] = [];
  const serverPlay = () => {
    calls++;
    return new Promise<MiniResult>((_, r) => {
      reject = r;
    });
  };
  render(
    <RapidMiniGames
      type="dice"
      controls={{ ...controls(), setMessage: (m) => messages.push(m) }}
      serverPlay={serverPlay}
    />,
  );
  for (let i = 0; i < 3; i++)
    fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
  await act(async () => {
    reject(new Error("Network interrupted"));
  });
  assert.equal(calls, 1);
  assert.ok(
    messages.at(-1)?.includes("Remaining queued bets were not submitted"),
  );
  cleanup();
});
test("Leaving cancels queued bets without submitting them after an in-flight response arrives", async () => {
  let calls = 0,
    resolve!: (r: MiniResult) => void;
  const serverPlay = () => {
    calls++;
    return new Promise<MiniResult>((r) => {
      resolve = r;
    });
  };
  const app = render(
    <RapidMiniGames
      type="plinko"
      controls={controls()}
      serverPlay={serverPlay}
    />,
  );
  for (let i = 0; i < 3; i++)
    fireEvent.click(screen.getByRole("button", { name: "Drop meteor" }));
  app.unmount();
  await act(async () => {
    resolve({ ...miniPlay("plinko", 100, {}, () => 0), balance_minor: 1900 });
  });
  assert.equal(calls, 1);
  cleanup();
});

test("The rapid queue is bounded to eight explicit clicks even with ample funds", () => {
  let calls = 0;
  const serverPlay = () => {
    calls++;
    return new Promise<MiniResult>(() => {});
  };
  render(
    <RapidMiniGames
      type="dice"
      controls={controls(100000)}
      serverPlay={serverPlay}
    />,
  );
  for (let i = 0; i < 20; i++)
    fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
  assert.equal(calls, 1);
  assert.ok(screen.getByText(/8 bets pending/));
  cleanup();
});
