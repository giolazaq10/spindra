import test from "node:test";
import assert from "node:assert/strict";
import { originals } from "../src/lib/catalog.ts";
import { modelRtp } from "../src/lib/slotModels.ts";

test("every published slot stays below the 96% RTP review limit, including free spins and signature features", () => {
  const slots = originals.filter((game) => game.slot);
  assert.equal(slots.length, 25);
  for (const game of slots) {
    const rtp = modelRtp(game.slot);
    assert.ok(
      Number.isFinite(rtp) && rtp > 0 && rtp <= 0.96,
      game.slug + ": exact full-round RTP " + rtp + " requires review",
    );
  }
});
