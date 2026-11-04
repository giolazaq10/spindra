import { useState } from "react";
import type { SlotAudioPreferences } from "../lib/slotAudio";
import { credits } from "../lib/money";
type Props = {
  mode: "idle" | "hold" | "auto";
  left: number;
  turbo: boolean;
  busy: boolean;
  canStart: boolean;
  stake: number;
  notice: string;
  setTurbo: (value: boolean) => void;
  startAuto: (count: number) => void;
  stop: () => void;
  preferences: SlotAudioPreferences;
  configure: (value: SlotAudioPreferences) => void;
};
export default function SlotPlaybackControls(p: Props) {
  const [count, setCount] = useState("10");
  const value = Number(count),
    valid = Number.isInteger(value) && value >= 1 && value <= 1000;
  const running = p.mode !== "idle";
  return (
    <section
      className="slot-playback-controls"
      aria-label="Spin and audio controls"
    >
      <div className="slot-repeat-controls">
        <label className="slot-turbo">
          <input
            type="checkbox"
            checked={p.turbo}
            onChange={(e) => p.setTurbo(e.target.checked)}
          />{" "}
          Quick spin
        </label>
        <label>
          Auto spins
          <input
            type="number"
            min="1"
            max="1000"
            step="1"
            inputMode="numeric"
            aria-label="Number of auto spins"
            value={count}
            disabled={running || p.busy}
            onChange={(e) => setCount(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={running || p.busy || !p.canStart || !valid}
          onClick={() => p.startAuto(value)}
        >
          Start autoplay
        </button>
        <button
          type="button"
          className="slot-stop-repeat"
          disabled={!running}
          onClick={() => p.stop()}
        >
          Stop repeats
        </button>
        <span>
          {p.mode === "hold"
            ? "SPACE HELD · QUICK SPINS"
            : p.mode === "auto"
              ? p.left
                ? p.left + " paid spins remaining"
                : "Finishing final auto spin"
              : valid
                ? "Up to " + credits(value * p.stake) + " USD in paid stakes"
                : "Choose 1–1,000 spins"}
        </span>
      </div>
      <div className="slot-audio-controls">
        <button
          type="button"
          aria-pressed={p.preferences.sound}
          onClick={() =>
            p.configure({ ...p.preferences, sound: !p.preferences.sound })
          }
        >
          Sound {p.preferences.sound ? "on" : "off"}
        </button>
        <button
          type="button"
          aria-pressed={p.preferences.music}
          onClick={() =>
            p.configure({ ...p.preferences, music: !p.preferences.music })
          }
        >
          Music {p.preferences.music ? "on" : "off"}
        </button>
        <label>
          Volume
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            aria-label="Slot audio volume"
            value={Math.round(p.preferences.volume * 100)}
            onChange={(e) =>
              p.configure({
                ...p.preferences,
                volume: Number(e.target.value) / 100,
              })
            }
          />
        </label>
      </div>
      <p role="status">
        {p.notice ||
          "Hold Space for quick repeats · release to stop. Audio starts after interaction."}
      </p>
    </section>
  );
}
