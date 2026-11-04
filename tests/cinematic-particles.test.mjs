import test from "node:test";
import assert from "node:assert/strict";
import {
  cinemaDuration,
  cinemaParticles,
  cinemaPose,
} from "../src/lib/cinematicParticles.ts";

test("all cinematic effects have finite geometry and bounded desktop/mobile particle budgets", () => {
  for (const cue of [
    "spin",
    "bonus",
    "win",
    "big",
    "mega",
    "epic",
    "retrigger",
  ]) {
    for (const compact of [false, true]) {
      const particles = cinemaParticles(cue, 600, 360, 417, compact);
      assert.ok(
        particles.length > 0 && particles.length <= (compact ? 80 : 196),
      );
      assert.ok(cinemaDuration(cue) > 0 && cinemaDuration(cue) <= 5200);
      for (const particle of particles) {
        assert.ok(particle.size > 0 && particle.life > 0);
        for (const time of [-1, 0, 0.1, 1, 2, 4, 20]) {
          const pose = cinemaPose(particle, time, cue, 600, 360);
          if (!pose) continue;
          assert.ok(Object.values(pose).every(Number.isFinite));
          assert.ok(pose.alpha >= 0 && pose.alpha <= 1);
          assert.ok(pose.stretch > 0);
        }
        if (cue !== "spin") {
          assert.equal(
            cinemaPose(particle, particle.delay - 0.01, cue, 600, 360),
            null,
          );
          assert.equal(
            cinemaPose(
              particle,
              particle.delay + particle.life + 0.01,
              cue,
              600,
              360,
            ),
            null,
          );
        }
      }
    }
  }
});

test("cinematic randomness is reproducible and isolated from production/global randomness", (t) => {
  t.mock.method(Math, "random", () => {
    throw Error("Global RNG must not be touched");
  });
  const first = cinemaParticles("bonus", 600, 360, 42);
  assert.deepEqual(first, cinemaParticles("bonus", 600, 360, 42));
  assert.notDeepEqual(first, cinemaParticles("bonus", 600, 360, 43));
});
