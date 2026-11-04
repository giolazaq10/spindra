export type SlotAudioPreferences = {
  sound: boolean;
  music: boolean;
  volume: number;
};
export const defaultSlotAudio: SlotAudioPreferences = {
  sound: true,
  music: true,
  volume: 0.3,
};
const themes: [string, number, number, OscillatorType, number[]][] = [
  ["astra-cascade", 60, 84, "sine", [0, 7, 12, 14, 10, 7, 3, 5]],
  ["copper-lock", 45, 96, "triangle", [0, 3, 7, 10, 7, 5, 3, 2]],
  ["nitro-sevens", 52, 144, "triangle", [0, 0, 7, 10, 12, 7, 3, 5]],
  ["solar-vault", 62, 108, "sine", [0, 4, 7, 12, 9, 7, 4, 2]],
  ["neon-drift", 49, 132, "triangle", [0, 7, 3, 10, 14, 12, 7, 5]],
  ["jade-temple", 65, 82, "sine", [0, 2, 7, 9, 12, 9, 7, 2]],
  ["lunar-tides", 57, 72, "sine", [0, 3, 7, 14, 12, 10, 7, 3]],
  ["ember-crown", 50, 112, "triangle", [0, 3, 7, 8, 12, 10, 7, 5]],
  ["velvet-orbit", 64, 92, "sine", [0, 7, 11, 14, 12, 7, 4, 11]],
  ["coral-cove", 67, 104, "sine", [0, 4, 9, 7, 12, 14, 9, 4]],
  ["midnight-express", 48, 124, "triangle", [0, 7, 0, 10, 3, 7, 12, 5]],
  ["saffron-sky", 63, 88, "triangle", [0, 1, 7, 8, 12, 8, 7, 1]],
  ["frost-bloom", 71, 76, "sine", [0, 7, 14, 12, 4, 11, 7, 2]],
  ["obsidian-echo", 43, 80, "sine", [0, 7, 3, 0, 10, 7, 5, 3]],
  ["electric-garden", 59, 126, "triangle", [0, 4, 7, 11, 14, 9, 7, 4]],
  ["ruby-rebellion", 55, 116, "triangle", [0, 3, 10, 7, 12, 15, 10, 5]],
  ["copper-canyon", 53, 100, "triangle", [0, 4, 7, 9, 7, 2, 4, 0]],
  ["aurora-arcade", 69, 140, "triangle", [0, 7, 12, 7, 3, 10, 14, 10]],
  ["atlas-of-gold", 58, 98, "sine", [0, 5, 7, 12, 14, 12, 7, 5]],
  ["thunder-aerie", 46, 120, "triangle", [0, 7, 10, 3, 12, 7, 5, 10]],
  ["sugar-parade", 72, 138, "sine", [0, 4, 7, 9, 12, 9, 14, 7]],
  ["corsair-pearls", 51, 110, "triangle", [0, 3, 5, 7, 12, 10, 7, 3]],
  ["amber-apiary", 66, 114, "sine", [0, 4, 9, 12, 7, 9, 4, 2]],
  ["clockwork-aurora", 61, 102, "triangle", [0, 7, 2, 9, 4, 11, 7, 14]],
  ["dragon-atelier", 47, 118, "triangle", [0, 3, 7, 12, 8, 7, 10, 5]],
];
export function slotAudioTheme(slug: string) {
  const theme = themes.find(([name]) => name === slug) || themes[0];
  return {
    slug: theme[0],
    root: theme[1],
    bpm: theme[2],
    voice: theme[3],
    melody: theme[4],
  };
}
export function readSlotAudioPreferences(
  value: string | null,
): SlotAudioPreferences {
  try {
    const v = JSON.parse(value || "null");
    return v &&
      typeof v.sound === "boolean" &&
      typeof v.music === "boolean" &&
      typeof v.volume === "number" &&
      Number.isFinite(v.volume)
      ? {
          sound: v.sound,
          music: v.music,
          volume: Math.max(0, Math.min(1, v.volume)),
        }
      : { ...defaultSlotAudio };
  } catch {
    return { ...defaultSlotAudio };
  }
}
/** Original synthesized themes. No media downloads or audio work in the wager path. */
export class SlotAudio {
  private context: AudioContext | null = null;
  private music: GainNode | null = null;
  private effects: GainNode | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private preferences = { ...defaultSlotAudio };
  private disposed = false;
  private active = false;
  private step = 0;
  private nextBeat = 0;
  readonly theme;
  constructor(
    slug: string,
    private factory: () => AudioContext | null = () =>
      typeof window !== "undefined" && window.AudioContext
        ? new window.AudioContext()
        : null,
  ) {
    this.theme = slotAudioTheme(slug);
  }
  configure(preferences: SlotAudioPreferences) {
    this.preferences = preferences;
    this.levels();
    if (!preferences.music || !preferences.volume) this.clearTimer();
    else if (this.active && this.context) this.schedule();
  }
  unlock() {
    if (this.disposed) return;
    if (
      (!this.preferences.music && !this.preferences.sound) ||
      !this.preferences.volume
    )
      return;
    try {
      if (!this.context) {
        this.context = this.factory();
        if (!this.context) return;
        this.music = this.context.createGain();
        this.effects = this.context.createGain();
        this.music.connect(this.context.destination);
        this.effects.connect(this.context.destination);
        this.levels();
      }
      this.active = true;
      void this.context
        .resume()
        .then(() => {
          if (this.active && !this.disposed) this.schedule();
        })
        .catch(() => {});
    } catch {
      /* Unsupported or denied audio never blocks a spin. */
    }
  }
  private levels() {
    const v = this.preferences.volume;
    this.music?.gain.setTargetAtTime(
      this.preferences.music ? v * 0.15 : 0,
      this.context!.currentTime,
      0.015,
    );
    this.effects?.gain.setTargetAtTime(
      this.preferences.sound ? v * 0.35 : 0,
      this.context!.currentTime,
      0.01,
    );
  }
  private note(
    midi: number,
    at: number,
    duration: number,
    bus: GainNode,
    level: number,
    voice = this.theme.voice,
  ) {
    const ctx = this.context!;
    const oscillator = ctx.createOscillator(),
      envelope = ctx.createGain();
    oscillator.type = voice;
    oscillator.frequency.setValueAtTime(440 * 2 ** ((midi - 69) / 12), at);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(level, at + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(bus);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }
  private schedule() {
    if (
      this.timer ||
      !this.context ||
      !this.active ||
      this.disposed ||
      !this.preferences.music ||
      !this.preferences.volume
    )
      return;
    const ctx = this.context,
      beat = 30 / this.theme.bpm;
    this.nextBeat = Math.max(this.nextBeat, ctx.currentTime + 0.02);
    while (this.nextBeat < ctx.currentTime + 0.25) {
      const step = this.step++,
        melody = this.theme.melody;
      this.note(
        this.theme.root + melody[step % melody.length],
        this.nextBeat,
        beat * 1.8,
        this.music!,
        0.3,
      );
      if (step % 4 === 0)
        this.note(
          this.theme.root - 24 + (Math.floor(step / 8) % 2 ? 7 : 0),
          this.nextBeat,
          beat * 3.5,
          this.music!,
          0.22,
          "sine",
        );
      this.nextBeat += beat;
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      this.schedule();
    }, 100);
  }
  play(event: "spin" | "reel" | "win" | "loss" | "bonus", value = 0) {
    if (
      !this.context ||
      !this.active ||
      this.disposed ||
      !this.preferences.sound ||
      !this.preferences.volume
    )
      return;
    try {
      const notes =
        event === "spin"
          ? [7, 3, 0]
          : event === "reel"
            ? [value % 5]
            : event === "loss"
              ? [3, 0]
              : event === "bonus"
                ? [0, 4, 7, 12, 16, 19]
                : value >= 10
                  ? [0, 4, 7, 12, 19]
                  : [0, 4, 7];
      const at = this.context.currentTime + 0.005;
      notes.forEach((note, i) =>
        this.note(
          this.theme.root + 12 + note,
          at + i * (event === "spin" ? 0.025 : 0.065),
          event === "reel" ? 0.055 : 0.22,
          this.effects!,
          event === "loss" ? 0.1 : 0.3,
        ),
      );
    } catch {
      /* Audio is optional presentation. */
    }
  }
  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
  pause() {
    this.active = false;
    this.clearTimer();
    if (this.context) void this.context.suspend().catch(() => {});
  }
  dispose() {
    this.disposed = true;
    this.pause();
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
    this.music = this.effects = null;
  }
  activate() {
    this.disposed = false;
  }
  resume() {
    if (this.context) this.unlock();
  }
}
