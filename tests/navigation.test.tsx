import RouteBoundary from "../src/components/RouteBoundary";
import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { StrictMode } from "react";
import { createMemoryRouter, RouterProvider, Link, Outlet } from "react-router-dom";
import { DemoProvider, useDemo } from "../src/context/Demo";
import OriginalGame from "../src/components/OriginalGame";
import { originals } from "../src/lib/catalog";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
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
const { render, screen, fireEvent, act, cleanup, within } =
  await import("@testing-library/react");
function Probe() {
  const demo = useDemo();
  return (
    <>
      <output data-testid="balance">{demo.balance}</output>
      <output data-testid="rounds">{demo.rounds.length}</output>
    </>
  );
}
function setup(slug: string) {
  const game = originals.find((g) => g.slug === slug)!;
  const router = createMemoryRouter(
    [
      {
        path: "/games",
        element: (
          <>
            <h1>LOBBY</h1>
            <Link to={"/game/" + slug}>Open game</Link>
          </>
        ),
      },
      { path: "/game/" + slug, element: <OriginalGame game={game} /> },
    ],
    { initialEntries: ["/games"] },
  );
  const app = render(
    <StrictMode>
      <DemoProvider>
        <RouterProvider router={router} />
        <Probe />
      </DemoProvider>
    </StrictMode>,
  );
  fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  return { app, router };
}
test("browser Back during a spin cancels timers, settles once, and allows a new game under Strict Mode", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { router } = setup("solar-vault");
  fireEvent.click(
    screen.getByRole("button", { name: "Spin reels", exact: true }),
  );
  assert.equal(screen.getByTestId("balance").textContent, "99900");
  await act(async () => {
    void router.navigate(-1);
  });
  assert.ok(screen.getByRole("heading", { name: "LOBBY" }));
  await act(async () => {
    t.mock.timers.tick(10000);
  });
  assert.equal(screen.getByTestId("rounds").textContent, "1");
  assert.equal(screen.getByTestId("balance").textContent, "99900");
  fireEvent.click(screen.getByRole("link", { name: "Open game" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Spin reels", exact: true }),
  );
  await act(async () => {
    t.mock.timers.tick(10000);
  });
  assert.equal(screen.getByTestId("rounds").textContent, "2");
  assert.ok(screen.getByRole("button", { name: "Spin reels", exact: true }));
  cleanup();
});
test("Texas Hold’em always shows two player cards and Back refunds uncommitted chips once", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { router } = setup("royal-draw");
  fireEvent.click(screen.getByRole("button", { name: "Join & deal" }));
  const cards = screen.getByLabelText("Your private cards");
  assert.equal(within(cards).getAllByRole("img").length, 2);
  assert.ok(
    within(cards)
      .getAllByRole("img")
      .every((card) => card.getAttribute("aria-label") !== "Face-down card"),
  );
  fireEvent.click(screen.getByRole("button", { name: /^Call / }));
  await act(async () => {
    void router.navigate(-1);
  });
  await act(async () => {
    t.mock.timers.tick(10000);
  });
  assert.ok(screen.getByRole("heading", { name: "LOBBY" }));
  assert.equal(screen.getByTestId("balance").textContent, "99500");
  assert.equal(screen.getByTestId("rounds").textContent, "1");
  cleanup();
});
test("stakes and complete rules are embedded in the cabinet", () => {
  const { app } = setup("neon-drift");
  const stake = screen.getByRole("combobox", { name: "Total stake" });
  assert.ok(stake.closest(".advanced-slot"));
  assert.equal(app.container.querySelectorAll(".game-bottom").length, 0);
  fireEvent.change(stake, { target: { value: "500" } });
  assert.equal((stake as HTMLSelectElement).value, "500");
  fireEvent.click(screen.getByRole("button", { name: "Rules & payouts" }));
  assert.equal(screen.getAllByText(/Twenty neon routes/).length, 2);
  assert.ok(
    app.container.querySelector(".embedded-rules")?.closest(".game-surface"),
  );
  assert.equal(app.container.querySelectorAll(".payline-guide>div").length, 20);
  cleanup();
});
test("browser Back recovers from a failed route instead of retaining the previous error screen", async (t) => {
  t.mock.method(console, "error", () => {});
  function Crash() {
    throw new Error("Test route failure");
  }
  const router = createMemoryRouter(
    [
      {
        element: (
          <RouteBoundary>
            <Outlet />
          </RouteBoundary>
        ),
        children: [
          { path: "/games", element: <h1>RECOVERED LOBBY</h1> },
          { path: "/broken", element: <Crash /> },
        ],
      },
    ],
    { initialEntries: ["/games", "/broken"] },
  );
  render(<RouterProvider router={router} />);
  assert.ok(screen.getByRole("alert"));
  await act(async () => {
    void router.navigate(-1);
  });
  assert.ok(screen.getByRole("heading", { name: "RECOVERED LOBBY" }));
  assert.equal(screen.queryByRole("alert"), null);
  cleanup();
});
