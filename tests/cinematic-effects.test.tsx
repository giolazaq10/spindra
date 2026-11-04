import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://fixture.invalid",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});
const { render, cleanup } = await import("@testing-library/react");
const { default: CinematicEffects } =
  await import("../src/components/CinematicEffects");

function renderer(t: import("node:test").TestContext, reduced = false) {
  let clock = 0,
    next = 0,
    fills = 0,
    clears = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const observers: { disconnected: boolean }[] = [];
  const ctx = {
    setTransform() {},
    clearRect() {
      clears++;
    },
    beginPath() {},
    ellipse() {},
    stroke() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill() {
      fills++;
    },
  };
  Object.defineProperty(dom.window, "CanvasRenderingContext2D", {
    configurable: true,
    value: class {},
  });
  Object.defineProperty(dom.window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: reduced }),
  });
  Object.defineProperty(dom.window, "devicePixelRatio", {
    configurable: true,
    value: 4,
  });
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  t.mock.method(performance, "now", () => clock);
  t.mock.method(
    dom.window.HTMLCanvasElement.prototype,
    "getContext",
    () => ctx as unknown as CanvasRenderingContext2D,
  );
  t.mock.method(
    dom.window.HTMLCanvasElement.prototype,
    "getBoundingClientRect",
    () => ({
      x: 0,
      y: 0,
      width: 640,
      height: 360,
      top: 0,
      left: 0,
      bottom: 360,
      right: 640,
      toJSON() {},
    }),
  );
  Object.assign(globalThis, {
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++next, callback);
      return next;
    },
    cancelAnimationFrame: (id: number) => {
      frames.delete(id);
    },
    ResizeObserver: class {
      disconnected = false;
      constructor() {
        observers.push(this);
      }
      observe() {}
      disconnect() {
        this.disconnected = true;
      }
    },
  });
  t.after(() => {
    cleanup();
    delete (document as unknown as { hidden?: boolean }).hidden;
  });
  function advance(ms: number) {
    clock += ms;
    const pending = [...frames.entries()];
    frames.clear();
    pending.forEach(([, callback]) => callback(clock));
  }
  return {
    frames,
    observers,
    advance,
    fills: () => fills,
    clears: () => clears,
  };
}

test("cinematic canvas draws, caps resolution, pauses while hidden, and releases frames on unmount", (t) => {
  const r = renderer(t),
    app = render(<CinematicEffects cue="bonus" />);
  const canvas = app.container.querySelector("canvas")!;
  assert.equal(canvas.width, 960, "device scale is capped at 1.5");
  assert.equal(canvas.height, 540);
  r.advance(400);
  assert.ok(r.fills() > 0);
  assert.equal(r.frames.size, 1);
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  document.dispatchEvent(new dom.window.Event("visibilitychange"));
  assert.equal(r.frames.size, 0);
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  document.dispatchEvent(new dom.window.Event("visibilitychange"));
  assert.equal(r.frames.size, 1);
  const stale = [...r.frames.values()][0];
  app.unmount();
  const cleared = r.clears();
  assert.equal(r.frames.size, 0);
  assert.ok(r.observers.every((o) => o.disconnected));
  stale(800);
  assert.equal(r.clears(), cleared);
});

test("cinematic renderer terminates on its duration budget and reduced motion schedules no frames", (t) => {
  const r = renderer(t),
    app = render(<CinematicEffects cue="epic" />);
  r.advance(4100);
  assert.equal(r.frames.size, 0);
  app.unmount();
  const reduced = renderer(t, true);
  render(<CinematicEffects cue="bonus" />);
  assert.equal(reduced.frames.size, 0);
});
