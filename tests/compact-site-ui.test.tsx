import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { JSDOM } from "jsdom";
import { supabase } from "../src/lib/supabase";
import { originals } from "../src/lib/catalog";
import { slotStages, slotStageVars } from "../src/lib/slotStages";
import { SlotSymbol } from "../src/components/SlotArt";
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
void supabase;
const { render, screen, fireEvent, cleanup } =
  await import("@testing-library/react");
const { MemoryRouter, Routes, Route } = await import("react-router-dom");
const { default: CasinoPage } = await import("../src/pages/CasinoPage");
const { default: Hero } = await import("../src/components/Hero");

test("compact catalog keeps search, sorting, and category navigation accessible", () => {
  const app = render(
    <MemoryRouter initialEntries={["/games"]}>
      <Routes>
        <Route path="/games" element={<CasinoPage />} />
        <Route path="/games/:categorySlug" element={<CasinoPage />} />
      </Routes>
    </MemoryRouter>,
  );
  assert.match(screen.getByRole("status").textContent!, /31 games available/);
  fireEvent.change(screen.getByRole("textbox", { name: "Search games" }), {
    target: { value: "solar" },
  });
  assert.match(screen.getByRole("status").textContent!, /1 game available/);
  assert.equal(app.container.querySelectorAll(".catalog-card").length, 1);
  fireEvent.change(screen.getByRole("textbox", { name: "Search games" }), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Sort games" }), {
    target: { value: "az" },
  });
  const names = [...app.container.querySelectorAll(".catalog-card h3")].map(
    (n) => n.textContent!,
  );
  assert.deepEqual(
    names,
    [...names].sort((a, b) => a.localeCompare(b)),
  );
  fireEvent.click(screen.getByRole("link", { name: "Slots" }));
  assert.match(screen.getByRole("status").textContent!, /25 games available/);
  assert.equal(
    screen.getByRole("link", { name: "Slots" }).getAttribute("aria-current"),
    "page",
  );
  cleanup();
});
test("home shortcuts show actual catalog counts", () => {
  const app = render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>,
  );
  assert.match(
    app.container.querySelector(".home-catalog-shortcuts")!.textContent!,
    /25/,
  );
  assert.ok(
    app.container.querySelector(
      '.home-catalog-shortcuts a[href="/games/slots"]',
    ),
  );
  assert.ok(!/progressive jackpot/i.test(app.container.textContent!));
  cleanup();
});
test("every slot has an explicit unique environment palette and unframed accessible objects", () => {
  const slots = originals.filter((g) => g.slot);
  assert.deepEqual(
    new Set(slots.map((g) => g.slot!.scene)),
    new Set(Object.keys(slotStages)),
  );
  assert.equal(
    new Set(Object.values(slotStages).map((p) => p.join())).size,
    25,
  );
  for (const game of slots.filter((g) => !g.slot!.premium)) {
    const spec = game.slot!;
    for (let index = 0; index < spec.weights.length; index++) {
      const app = render(<SlotSymbol spec={spec} index={index} />);
      const image = app.getByRole("img");
      assert.ok(image.getAttribute("aria-label"));
      assert.ok(app.container.querySelector(".slot-object"));
      assert.equal(
        app.container.querySelectorAll(".lucide,script,image,foreignObject")
          .length,
        0,
      );
      assert.ok(!app.container.innerHTML.includes("NaN"));
      assert.ok(slotStageVars(spec.scene)["--slot-reel-top"]);
      app.unmount();
    }
  }
  cleanup();
});
