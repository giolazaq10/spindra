import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { JSDOM } from "jsdom";
import { originals } from "../src/lib/catalog";
import { livingWorlds, livingWorld } from "../src/lib/livingWorlds";
import LivingWorld from "../src/components/LivingWorld";
import WorldActor from "../src/components/WorldActor";
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
const { render, cleanup } = await import("@testing-library/react");

test("all 25 slots have an explicit distinct illustrated world and two scene actors", () => {
  const slots = originals.filter((g) => g.slot);
  assert.equal(slots.length, 25);
  assert.deepEqual(
    new Set(slots.map((g) => g.slot!.scene)),
    new Set(Object.keys(livingWorlds)),
  );
  assert.equal(
    new Set(slots.map((g) => JSON.stringify(livingWorld(g.slot!.scene)))).size,
    25,
  );
  for (const game of slots) {
    const profile = livingWorld(game.slot!.scene);
    assert.notEqual(profile.actors[0], profile.actors[1]);
    const app = render(<LivingWorld scene={game.slot!.scene} phase="idle" />);
    assert.equal(
      app.container.querySelector(".living-world")?.getAttribute("data-world"),
      game.slot!.scene,
    );
    assert.equal(
      app.container.querySelectorAll(".world-scene-actor .world-actor").length,
      2,
    );
    assert.ok(app.container.querySelector(".world-landscape"));
    assert.equal(
      app.container.querySelectorAll("script,image,foreignObject").length,
      0,
    );
    assert.ok(!app.container.innerHTML.includes("NaN"));
    app.unmount();
  }
  cleanup();
});

test("actor anatomy includes moving wings, wheels, tail strokes, and a connected pendulum", () => {
  for (const [kind, selector, count] of [
    ["bee", ".world-wing", 2],
    ["train", ".world-wheel", 2],
    ["fish", ".world-tail", 1],
    ["piston", ".world-piston-head", 1],
  ] as const) {
    const app = render(<WorldActor kind={kind} />);
    assert.equal(app.container.querySelectorAll(selector).length, count);
    app.unmount();
  }
  const clock = render(<WorldActor kind="clock" />);
  assert.ok(clock.container.querySelector(".world-pendulum path"));
  assert.ok(clock.container.querySelector(".world-pendulum circle"));
  cleanup();
});

function pointerFixture(t: import("node:test").TestContext, reduced = false) {
  let id = 0;
  const frames = new Map<number, FrameRequestCallback>();
  Object.assign(globalThis, {
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++id, callback);
      return id;
    },
    cancelAnimationFrame: (key: number) => {
      frames.delete(key);
    },
  });
  Object.defineProperty(dom.window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("pointer") ? true : reduced,
    }),
  });
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  t.mock.method(
    dom.window.HTMLElement.prototype,
    "getBoundingClientRect",
    () => new dom.window.DOMRect(0, 0, 800, 600),
  );
  t.after(() => {
    cleanup();
    delete (document as unknown as { hidden?: boolean }).hidden;
  });
  return frames;
}

test("parallax coalesces pointer events, clamps motion, retains actors on phase changes and cleans up", (t) => {
  const frames = pointerFixture(t);
  const app = render(
    <div className="slot-polished">
      <LivingWorld scene="reef" phase="idle" />
    </div>,
  );
  const cabinet = app.container.firstElementChild!,
    world = app.container.querySelector(".living-world") as HTMLElement;
  const actor = app.container.querySelector(".world-actor-fish");
  cabinet.dispatchEvent(
    new dom.window.MouseEvent("pointermove", { clientX: 400, clientY: 300 }),
  );
  cabinet.dispatchEvent(
    new dom.window.MouseEvent("pointermove", { clientX: 9000, clientY: -100 }),
  );
  assert.equal(frames.size, 1);
  const pending = [...frames.values()][0];
  frames.clear();
  pending(16);
  assert.equal(world.style.getPropertyValue("--world-look-x"), "1");
  assert.equal(world.style.getPropertyValue("--world-look-y"), "-1");
  app.rerender(
    <div className="slot-polished">
      <LivingWorld scene="reef" phase="bonus" />
    </div>,
  );
  assert.equal(app.container.querySelector(".world-actor-fish"), actor);
  assert.equal(world.dataset.phase, "bonus");
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  document.dispatchEvent(new dom.window.Event("visibilitychange"));
  assert.equal(world.dataset.worldPaused, "true");
  cabinet.dispatchEvent(
    new dom.window.MouseEvent("pointermove", { clientX: 300, clientY: 200 }),
  );
  assert.equal(frames.size, 0);
  cabinet.dispatchEvent(new dom.window.Event("pointerleave"));
  assert.equal(frames.size, 0);
  assert.equal(world.style.getPropertyValue("--world-look-x"), "0");
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  document.dispatchEvent(new dom.window.Event("visibilitychange"));
  cabinet.dispatchEvent(
    new dom.window.MouseEvent("pointermove", { clientX: 500, clientY: 400 }),
  );
  const stale = [...frames.values()][0];
  app.unmount();
  assert.equal(frames.size, 0);
  stale(32);
  cabinet.dispatchEvent(
    new dom.window.MouseEvent("pointermove", { clientX: 700, clientY: 400 }),
  );
  assert.equal(frames.size, 0);
});

test("reduced motion retains the illustrated scene without scheduling parallax", (t) => {
  const frames = pointerFixture(t, true);
  const app = render(
    <div className="slot-polished">
      <LivingWorld scene="dragon" phase="bonus" />
    </div>,
  );
  app.container.firstElementChild!.dispatchEvent(
    new dom.window.MouseEvent("pointermove", { clientX: 600, clientY: 300 }),
  );
  assert.equal(frames.size, 0);
  assert.ok(app.container.querySelector(".world-actor-dragon"));
});
