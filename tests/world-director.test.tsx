import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { JSDOM } from "jsdom";
import {
  actorState,
  worldDirections,
  motionTier,
  idleDelay,
  type WorldEvent,
} from "../src/lib/worldDirector";
import { WorldParticlePool, fishPose } from "../src/lib/worldMotion";
import { originals } from "../src/lib/catalog";
import WorldCharacter from "../src/components/WorldCharacter";
import WorldEnvironment from "../src/components/WorldEnvironment";
import SlotWinCelebration from "../src/components/SlotWinCelebration";
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
  configurable: true,
  value: dom.window.navigator,
});
const { render, act, cleanup } = await import("@testing-library/react");
const event = (
  type: WorldEvent["type"],
  returned = 0,
  stake = 100,
  id = 1,
): WorldEvent => ({ type, returned, stake, id });

test("director uses confirmed net return and configured tier thresholds, never uncertain outcomes", () => {
  for (const [input, expected] of [
    [event("idle"), "idle"],
    [event("spin", 999999), "anticipation"],
    [event("error", 999999), "idle"],
    [event("bonus"), "bonus"],
    [event("settled", 0), "disappointed"],
    [event("settled", 99), "disappointed"],
    [event("settled", 100), "neutral"],
    [event("settled", 101), "delighted"],
    [event("settled", 499), "delighted"],
    [event("settled", 500), "cheer"],
    [event("settled", 999), "cheer"],
    [event("settled", 1000), "celebrate"],
    [event("settled", 2500), "triumph"],
    [event("settled", 5000), "triumph"],
  ] as const)
    assert.equal(actorState(input), expected);
});
test("all 25 worlds have explicit original art directions and six shared character rigs", () => {
  assert.deepEqual(
    new Set(originals.filter((g) => g.slot).map((g) => g.slot!.scene)),
    new Set(Object.keys(worldDirections)),
  );
  assert.equal(
    new Set(Object.values(worldDirections).map((d) => d.name)).size,
    25,
  );
  assert.equal(
    new Set(Object.values(worldDirections).map((d) => d.character)).size,
    6,
  );
  assert.equal(
    new Set(Object.values(worldDirections).map((d) => d.focus)).size,
    25,
  );
});
test("pooled particles remain bounded and reuse storage across effects", () => {
  const pool = new WorldParticlePool(500);
  assert.equal(pool.particles.length, 96);
  const original = pool.particles[0];
  assert.equal(pool.burst(10000, 800, 600, 12), 96);
  assert.equal(pool.burst(10, 800, 600, 99), 0);
  for (let i = 0; i < 400; i++) pool.step(0.016);
  assert.equal(pool.particles.filter((p) => p.active).length, 0);
  assert.equal(pool.burst(16, 800, 600, 3), 16);
  assert.equal(pool.particles[0], original);
  pool.step(50000);
  assert.ok(
    pool.particles.every(
      (p) =>
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        (!p.active || p.age <= 0.05),
    ),
  );
  pool.clear();
  assert.equal(pool.particles.filter((p) => p.active).length, 0);
});
test("quality budgets and natural idle timing remain bounded", () => {
  assert.equal(motionTier(true, 16, 16, 1400), "still");
  assert.equal(motionTier(false, 4, 8, 1400), "low");
  assert.equal(motionTier(false, 8, 8, 390), "low");
  assert.equal(motionTier(false, 8, 8, 1400), "full");
  assert.equal(
    idleDelay(() => 0),
    2800,
  );
  assert.equal(
    idleDelay(() => 1),
    8000,
  );
  const left = fishPose(0, 0, 1000, 600),
    right = fishPose(13, 0, 1000, 600);
  assert.notEqual(left.flip, right.flip);
  for (let t = 0; t < 100; t++)
    assert.ok(Math.abs(fishPose(t, 2, 1000, 600).x) <= 1081);
  assert.ok(
    fishPose(0.7, 0, 1000, 600).y < 600 * 0.2,
    "occasional breach rises above the water surface",
  );
  assert.ok(
    fishPose(1.8, 0, 1000, 600).splash > 0,
    "return to water emits a bounded ripple",
  );
});
test("rig reacts to event changes, pauses when hidden, honors reduced motion, cancels on exit", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const animations: {
    cancelled: boolean;
    options: KeyframeAnimationOptions;
    frames: Keyframe[];
  }[] = [];
  const previous = dom.window.HTMLElement.prototype.animate;
  dom.window.HTMLElement.prototype.animate = function (frames, options) {
    const item = {
      cancelled: false,
      options: options as KeyframeAnimationOptions,
      frames: frames as Keyframe[],
    };
    animations.push(item);
    return {
      cancel() {
        item.cancelled = true;
      },
      onfinish: null,
    } as unknown as Animation;
  };
  let reduced = false;
  const listeners = new Set<() => void>();
  Object.assign(window, {
    matchMedia: () => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_n: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_n: string, fn: () => void) => listeners.delete(fn),
    }),
  });
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  const app = render(<WorldCharacter scene="reef" event={event("spin")} />);
  assert.equal(
    app.container.firstElementChild?.getAttribute("data-actor-state"),
    "anticipation",
  );
  assert.ok(animations.some((a) => a.options.iterations === Infinity));
  const before = animations.length;
  app.rerender(
    <WorldCharacter scene="reef" event={event("settled", 1000, 100, 2)} />,
  );
  assert.ok(animations.slice(0, before).every((a) => a.cancelled));
  assert.equal(
    app.container.firstElementChild?.getAttribute("data-actor-state"),
    "celebrate",
  );
  act(() => t.mock.timers.tick(2800));
  assert.equal(
    app.container.firstElementChild?.getAttribute("data-actor-state"),
    "idle",
  );
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  act(() => document.dispatchEvent(new dom.window.Event("visibilitychange")));
  assert.ok(animations.every((a) => a.cancelled));
  const hiddenCount = animations.length;
  act(() => t.mock.timers.tick(20000));
  assert.equal(animations.length, hiddenCount);
  reduced = true;
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  act(() => listeners.forEach((fn) => fn()));
  assert.equal(animations.length, hiddenCount);
  app.unmount();
  assert.equal(listeners.size, 0);
  act(() => t.mock.timers.tick(20000));
  assert.equal(animations.length, hiddenCount);
  dom.window.HTMLElement.prototype.animate = previous;
  delete (document as unknown as { hidden?: boolean }).hidden;
  t.mock.timers.reset();
  cleanup();
});
test("environment stops RAF and disconnects observers when hidden or unmounted", () => {
  const frames = new Map<number, FrameRequestCallback>();
  let sequence = 0,
    disconnected = 0;
  Object.assign(globalThis, {
    requestAnimationFrame: (fn: FrameRequestCallback) => {
      frames.set(++sequence, fn);
      return sequence;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    ResizeObserver: class {
      observe() {}
      disconnect() {
        disconnected++;
      }
    },
  });
  Object.assign(window, {
    CanvasRenderingContext2D: function () {},
    matchMedia: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  const context = new Proxy({}, { get: () => () => {}, set: () => true });
  const previous = dom.window.HTMLCanvasElement.prototype.getContext;
  dom.window.HTMLCanvasElement.prototype.getContext = (() =>
    context) as unknown as typeof previous;
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  const app = render(
    <div className="slot-polished">
      <WorldEnvironment scene="reef" event={event("spin")} />
    </div>,
  );
  assert.equal(frames.size, 1);
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  act(() => document.dispatchEvent(new dom.window.Event("visibilitychange")));
  assert.equal(frames.size, 0);
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  act(() => document.dispatchEvent(new dom.window.Event("visibilitychange")));
  assert.equal(frames.size, 1);
  app.unmount();
  assert.equal(frames.size, 0);
  assert.equal(disconnected, 1);
  dom.window.HTMLCanvasElement.prototype.getContext = previous;
  delete (document as unknown as { hidden?: boolean }).hidden;
  cleanup();
});
test("a bonus return below stake is labelled return and has no profit celebration", () => {
  const app = render(<SlotWinCelebration returned={50} stake={100} bonus />);
  assert.match(app.container.textContent!, /BONUS RETURN/);
  assert.equal(
    app.container.querySelectorAll(
      ".cinematic-effects,.slot-win-particles,.slot-award-crown",
    ).length,
    0,
  );
  cleanup();
});
