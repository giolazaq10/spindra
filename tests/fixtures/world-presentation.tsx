import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import AdvancedSlots from "../../src/components/AdvancedSlots";
import PremiumSlots from "../../src/components/PremiumSlots";
import { originals } from "../../src/lib/catalog";
import { newCashRound } from "../../src/lib/cashEngine";
const params = new URLSearchParams(location.search),
  slug = params.get("game") || "coral-cove",
  mode = params.get("mode") || "idle";
const game = originals.find((g) => g.slug === slug)!;
let requests = 0,
  finishes = 0,
  originalRect: DOMRect;
export function Fixture() {
  const [bet, setBet] = useState(20),
    [balance, setBalance] = useState(100000),
    [busy, setBusy] = useState(false);
  const controls = {
    bet,
    setBet,
    balance,
    busy,
    stakes: [20, 50, 100, 200],
    message: "",
    rules: false,
    poker: false,
    modeLabel: "USD",
    toggleRules: () => {},
    setMessage: () => {},
    setLeaveReturn: () => {},
    canStart: true,
    start: () => {
      setBusy(true);
      setBalance((v) => v - bet);
      return true;
    },
    finish: (returned: number) => {
      finishes++;
      setBusy(false);
      setBalance((v) => v + returned);
    },
  };
  const Component = game.slot!.premium ? PremiumSlots : AdvancedSlots;
  return (
    <div className="spindra-extension">
      <div className="compact-slot-page">
        <Component
          game={game}
          controls={controls}
          serverSpin={async (stake: number) => {
            requests++;
            let seed = 12345,
              cell = 0;
            const random = (n: number) => {
              if (mode === "bonus" && !game.slot!.premium && cell++ < 3)
                return game
                  .slot!.weights.slice(0, game.slot!.scatter!.symbol)
                  .reduce((a, b) => a + b, 0);
              seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
              return seed % n;
            };
            let result = newCashRound(slug, { bet: stake }, random);
            let attempts = 0;
            while (
              mode === "win" &&
              (result.returned_minor <= stake || result.data.bonus) &&
              attempts++ < 1000
            )
              result = newCashRound(slug, { bet: stake }, random);
            if (mode === "pending") await new Promise(() => {});
            else await new Promise((r) => setTimeout(r, 180));
            return {
              ...result.data,
              returned_minor: result.returned_minor,
            } as never;
          }}
        />
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function run() {
  await wait(500);
  const spin = () =>
    document.querySelector<HTMLButtonElement>(".spin-control")!;
  originalRect = spin().getBoundingClientRect();
  if (mode !== "idle") {
    spin().click();
    await wait(60);
    if (mode !== "pending") spin().click();
  }
  await wait(1200);
  // Finish finite compositor animations for stable snapshots, not in production code.
  for (const animation of document.getAnimations())
    if (animation.effect?.getTiming().iterations !== Infinity)
      try {
        animation.finish();
      } catch {
        /* Some browser-generated transitions cannot be finished manually. */
      }
  const current = spin().getBoundingClientRect();
  const report = {
    game: slug,
    mode,
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    requests,
    finishes,
    stable:
      Math.abs(originalRect.x - current.x) < 1 &&
      Math.abs(originalRect.y - current.y) < 1,
    stakeNextToSpin: !!spin().parentElement?.querySelector(
      ".slot-stake-control",
    ),
    bonus: !!document.querySelector(".scatter-celebration"),
    assets: [
      ...document.querySelectorAll<HTMLImageElement>(
        ".rig-preload,.directed-environment-art,.world-symbol-preload",
      ),
    ].map((i) => ({
      src: i.getAttribute("src"),
      loaded: i.complete && i.naturalWidth > 0,
    })),
    actor: document
      .querySelector(".world-character")
      ?.getAttribute("data-actor-state"),
  };
  const output = document.createElement("pre");
  output.id = "qa-report";
  output.textContent = JSON.stringify(report);
  output.style.cssText =
    "display:none;position:fixed;bottom:0;left:0;font-size:9px;background:#102030;color:white;max-width:100%;z-index:9999;white-space:pre-wrap";
  document.body.append(output);
  if (parent !== window)
    parent.postMessage({ type: "world-fixture-report", report }, "*");
}
run();
