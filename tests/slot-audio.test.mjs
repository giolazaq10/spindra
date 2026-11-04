import test from "node:test";
import assert from "node:assert/strict";
import {
  SlotAudio,
  slotAudioTheme,
  readSlotAudioPreferences,
} from "../src/lib/slotAudio.ts";
import { originals } from "../src/lib/catalog.ts";

function context() {
  const oscillators = [],
    gains = [];
  const parameter = () => ({
    value: 0,
    setTargetAtTime(value) {
      this.value = value;
    },
    setValueAtTime(value) {
      this.value = value;
    },
    linearRampToValueAtTime(value) {
      this.value = value;
    },
    exponentialRampToValueAtTime(value) {
      this.value = value;
    },
  });
  return {
    currentTime: 0,
    destination: {},
    resumes: 0,
    suspends: 0,
    closes: 0,
    oscillators,
    gains,
    createGain() {
      const node = { gain: parameter(), connect() {}, disconnect() {} };
      gains.push(node);
      return node;
    },
    createOscillator() {
      const node = {
        frequency: parameter(),
        type: "sine",
        connect() {},
        disconnect() {},
        start(at) {
          this.started = at;
        },
        stop(at) {
          this.stopped = at;
        },
      };
      oscillators.push(node);
      return node;
    },
    async resume() {
      this.resumes++;
    },
    async suspend() {
      this.suspends++;
    },
    async close() {
      this.closes++;
    },
  };
}

test("all 25 slots have a distinct composed music profile and sound palette", () => {
  const slots = originals.filter((g) => g.slot);
  const profiles = slots.map((g) => slotAudioTheme(g.slug));
  assert.equal(profiles.length, 25);
  assert.equal(new Set(profiles.map((p) => p.slug)).size, 25);
  assert.equal(
    new Set(
      profiles.map(({ root, bpm, voice, melody }) =>
        JSON.stringify({ root, bpm, voice, melody }),
      ),
    ).size,
    25,
  );
  for (const profile of profiles)
    assert.ok(profile.melody.length >= 8 && profile.bpm > 0);
});

test("audio never opens before interaction, independent mute buses silence immediately, and dispose cancels music", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const ctx = context();
  let created = 0;
  const audio = new SlotAudio("solar-vault", () => {
    created++;
    return ctx;
  });
  audio.configure({ sound: true, music: true, volume: 0.3 });
  audio.play("spin");
  assert.equal(created, 0);
  audio.unlock();
  await Promise.resolve();
  assert.equal(created, 1);
  assert.ok(ctx.oscillators.length > 0, "music begins after interaction");
  audio.play("win", 25);
  const notes = ctx.oscillators.length;
  audio.configure({ sound: false, music: false, volume: 0.3 });
  assert.equal(ctx.gains[0].gain.value, 0);
  assert.equal(ctx.gains[1].gain.value, 0);
  audio.play("win", 100);
  t.mock.timers.tick(1000);
  assert.equal(ctx.oscillators.length, notes);
  audio.configure({ sound: true, music: false, volume: 0.5 });
  audio.play("reel", 2);
  assert.equal(ctx.oscillators.length, notes + 1);
  assert.equal(ctx.gains[0].gain.value, 0);
  assert.ok(ctx.gains[1].gain.value > 0);
  audio.dispose();
  t.mock.timers.tick(10000);
  audio.play("bonus");
  audio.unlock();
  await Promise.resolve();
  assert.equal(ctx.oscillators.length, notes + 1);
  assert.equal(ctx.closes, 1);
  assert.ok(ctx.oscillators.every((o) => o.stopped > o.started));
});

test("unsupported audio and corrupt preferences do not affect playing; volume stays bounded", () => {
  const audio = new SlotAudio("nitro-sevens", () => {
    throw new Error("Audio unavailable");
  });
  assert.doesNotThrow(() => {
    audio.unlock();
    audio.play("spin");
    audio.dispose();
  });
  assert.deepEqual(readSlotAudioPreferences("invalid"), {
    sound: true,
    music: true,
    volume: 0.3,
  });
  assert.equal(
    readSlotAudioPreferences('{"sound":false,"music":true,"volume":9}').volume,
    1,
  );
  assert.equal(
    readSlotAudioPreferences('{"sound":true,"music":false,"volume":-5}').volume,
    0,
  );
});

test("effect frequencies differ by theme and paused/disposed audio cannot keep scheduling", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const a = context(),
    b = context();
  const first = new SlotAudio("solar-vault", () => a),
    second = new SlotAudio("lunar-tides", () => b);
  for (const audio of [first, second]) {
    audio.configure({ sound: true, music: false, volume: 0.3 });
    audio.unlock();
    audio.play("spin");
  }
  assert.notEqual(
    a.oscillators[0].frequency.value,
    b.oscillators[0].frequency.value,
  );
  first.pause();
  const count = a.oscillators.length;
  first.play("bonus");
  t.mock.timers.tick(1000);
  assert.equal(a.oscillators.length, count);
  first.dispose();
  second.dispose();
  await Promise.resolve();
});
