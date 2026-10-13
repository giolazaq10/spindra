import RouteBoundary from "../src/components/RouteBoundary";
import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { StrictMode } from "react";
import {
  createMemoryRouter,
  RouterProvider,
  Link,
  Outlet,
} from "react-router-dom";
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
  assert.ok(screen.getByText("Dealing & moving chips"));
  assert.equal(screen.queryByRole("button", { name: /^Call / }), null);
  await act(async () => {
    t.mock.timers.tick(3200);
  });
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

test("blackjack deals one card at a time, locks actions, and cancels its sequence on Back", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { app, router } = setup("noir-blackjack");
  fireEvent.click(screen.getByRole("button", { name: "Deal cards" }));
  const cards = () =>
    app.container.querySelectorAll(".blackjack .playing-card").length;
  assert.equal(cards(), 0);
  assert.equal(
    (screen.getByRole("button", { name: "Hit" }) as HTMLButtonElement).disabled,
    true,
  );
  await act(async () => {
    t.mock.timers.tick(200);
  });
  assert.equal(cards(), 1);
  await act(async () => {
    t.mock.timers.tick(650);
  });
  assert.equal(cards(), 2);
  await act(async () => {
    t.mock.timers.tick(650);
  });
  assert.equal(cards(), 3);
  await act(async () => {
    void router.navigate(-1);
  });
  await act(async () => {
    t.mock.timers.tick(15000);
  });
  assert.equal(screen.getByTestId("rounds").textContent, "1");
  assert.equal(screen.getByTestId("balance").textContent, "99900");
  cleanup();
});

test("blackjack reveals the hole card, draws at intervals, and settles after the final card lands", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const ordered = Array.from({ length: 416 }, (_, i) => i),
    draws = [8, 1, 5, 3, 4, 18],
    randoms: number[] = [];
  for (let i = 415; i > 0; i--) {
    const j = 415 - i < draws.length ? ordered.indexOf(draws[415 - i]) : i;
    randoms.push(j);
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }
  t.mock.method(crypto, "getRandomValues", (buffer: Uint32Array) => {
    buffer.fill(randoms.shift()!);
    return buffer;
  });
  const { app } = setup("noir-blackjack");
  fireEvent.click(screen.getByRole("button", { name: "Deal cards" }));
  await act(async () => {
    t.mock.timers.tick(2800);
  });
  assert.equal(
    (screen.getByRole("button", { name: "Stand" }) as HTMLButtonElement)
      .disabled,
    false,
  );
  fireEvent.click(screen.getByRole("button", { name: "Stand" }));
  await act(async () => {
    t.mock.timers.tick(450);
  });
  const dealer = () => app.container.querySelector(".bj-dealer .cards-row")!;
  assert.equal(dealer().querySelectorAll(".playing-card").length, 2);
  assert.ok(dealer().querySelector(".card-back"));
  await act(async () => {
    t.mock.timers.tick(400);
  });
  assert.equal(dealer().querySelector(".card-back"), null);
  assert.equal(screen.getByTestId("rounds").textContent, "0");
  await act(async () => {
    t.mock.timers.tick(1100);
  });
  assert.equal(dealer().querySelectorAll(".playing-card").length, 3);
  await act(async () => {
    t.mock.timers.tick(1100);
  });
  assert.equal(dealer().querySelectorAll(".playing-card").length, 4);
  assert.equal(screen.getByTestId("rounds").textContent, "0");
  await act(async () => {
    t.mock.timers.tick(1100);
  });
  assert.equal(screen.getByTestId("rounds").textContent, "1");
  assert.ok(screen.getByRole("button", { name: "Deal cards" }));
  cleanup();
});

test("five blackjack main bets and side bets reserve atomically; Back retains a resolved pair award once", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const draws = [0, 1, 6, 3, 4, 8, 14, 15, 19, 17, 18, 5],
    remaining = Array.from({ length: 416 }, (_, i) => i),
    randoms: number[] = [];
  for (let i = 415; i > 0; i--) {
    const j = 415 - i < draws.length ? remaining.indexOf(draws[415 - i]) : i;
    randoms.push(j);
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  t.mock.method(crypto, "getRandomValues", (buffer: Uint32Array) => {
    buffer.fill(randoms.shift()!);
    return buffer;
  });
  const { router } = setup("noir-blackjack");
  for (const i of [1, 2, 4, 5])
    fireEvent.click(
      screen.getByRole("button", { name: "Main bet for hand " + i }),
    );
  fireEvent.click(screen.getByRole("button", { name: "21+3 bet for hand 3" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Perfect Pair bet for hand 3" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Deal cards" }));
  assert.equal(screen.getByTestId("balance").textContent, "99300");
  await act(async () => {
    t.mock.timers.tick(8000);
  });
  assert.equal(
    (screen.getByRole("button", { name: "Stand" }) as HTMLButtonElement)
      .disabled,
    false,
  );
  assert.ok(screen.getByText("PP: Mixed pair · 6.00"));
  await act(async () => {
    void router.navigate(-1);
  });
  await act(async () => {
    t.mock.timers.tick(30000);
  });
  assert.equal(screen.getByTestId("balance").textContent, "99900");
  assert.equal(screen.getByTestId("rounds").textContent, "1");
  cleanup();
});

test("blackjack insurance reserves only selected half-stakes and dealer blackjack settles exactly once", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const draws = [8, 12, 7, 11],
    remaining = Array.from({ length: 416 }, (_, i) => i),
    randoms: number[] = [];
  for (let i = 415; i > 0; i--) {
    const j = 415 - i < draws.length ? remaining.indexOf(draws[415 - i]) : i;
    randoms.push(j);
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  t.mock.method(crypto, "getRandomValues", (buffer: Uint32Array) => {
    buffer.fill(randoms.shift()!);
    return buffer;
  });
  setup("noir-blackjack");
  fireEvent.click(screen.getByRole("button", { name: "Deal cards" }));
  await act(async () => {
    t.mock.timers.tick(2800);
  });
  assert.ok(screen.getByRole("region", { name: "Insurance offer" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Hand 3 · 0.50" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Insure selected · 0.50" }),
  );
  assert.equal(screen.getByTestId("balance").textContent, "99850");
  await act(async () => {
    t.mock.timers.tick(2000);
  });
  assert.equal(screen.getByTestId("balance").textContent, "100000");
  assert.equal(screen.getByTestId("rounds").textContent, "1");
  await act(async () => {
    t.mock.timers.tick(20000);
  });
  assert.equal(screen.getByTestId("rounds").textContent, "1");
  cleanup();
});
