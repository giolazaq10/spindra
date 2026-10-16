import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  miniPlay,
  miniRules,
  plinkoPays,
  wheelPays,
  type MiniKind,
  type MiniResult,
} from "@/lib/minigames";
import type { Controls } from "./OriginalGame";
import GameControls from "./GameControls";
export default function MiniGames({
  type,
  controls: c,
  serverPlay,
}: {
  type: MiniKind;
  controls: Controls;
  serverPlay?: (input: Record<string, unknown>) => Promise<MiniResult>;
}) {
  const [chance, setChance] = useState(50),
    [over, setOver] = useState(false),
    [result, setResult] = useState<MiniResult | null>(null),
    [busy, setBusy] = useState(false),
    [turn, setTurn] = useState(0),
    [step, setStep] = useState(-1);
  const lock = useRef(false),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const scheduled = timers.current;
    return () => {
      mounted.current = false;
      scheduled.forEach(clearTimeout);
    };
  }, []);
  async function play() {
    if (lock.current || !c.start()) return;
    lock.current = true;
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    setBusy(true);
    setStep(-1);
    setResult(null);
    const stake = c.bet;
    try {
      const input = { threshold: Math.round(chance * 100), over };
      const next = serverPlay
        ? await serverPlay(input)
        : miniPlay(type, stake, input);
      if (!mounted.current) return;
      if (type === "wheel")
        setTurn(
          (old) =>
            Math.ceil(old / 360) * 360 + 1800 - (next.sector! + 0.5) * 18,
        );
      if (type === "plinko")
        for (let i = 0; i < 8; i++)
          timers.current.push(
            setTimeout(
              () => {
                setStep(i);
                setResult(next);
              },
              150 + i * 210,
            ),
          );
      timers.current.push(
        setTimeout(
          () => {
            setResult(next);
            setBusy(false);
            lock.current = false;
            c.finish(next.returned_minor);
          },
          type === "wheel" ? 3200 : type === "plinko" ? 2000 : 1200,
        ),
      );
    } catch (e) {
      if (mounted.current) {
        setBusy(false);
        lock.current = false;
        c.finish(0);
        c.setMessage(e instanceof Error ? e.message : "Round unavailable");
      }
    }
  }
  const path = result?.path?.slice(0, step + 1) || [],
    ballX = 50 + path.reduce((sum, d) => sum + (d ? 5.4 : -5.4), 0),
    ballY = 9 + path.length * 9;
  return (
    <div className={"mini-cabinet mini-" + type}>
      <div className="mini-stage">
        <div className="mini-stars" aria-hidden="true">
          ✦ · ✧ · ✦ · ✧ · ✦
        </div>
        {type === "dice" ? (
          <>
            <div
              className={"prism-die " + (busy ? "die-rolling" : "")}
              aria-hidden="true"
            >
              ⚄
            </div>
            <output className="dice-roll">
              {busy
                ? "ROLLING"
                : result?.roll !== undefined
                  ? (result.roll / 100).toFixed(2)
                  : "00.00"}
            </output>
            <div className="dice-track">
              <i style={{ left: (result?.roll ?? 0) / 100 + "%" }} />
              <span
                style={{
                  width: chance + "%",
                  left: over ? 100 - chance + "%" : 0,
                }}
              />
            </div>
            <div className="mini-options">
              <label>
                Win chance {chance}%
                <input
                  aria-label="Win chance"
                  type="range"
                  min="5"
                  max="95"
                  value={chance}
                  disabled={busy || c.busy}
                  onChange={(e) => setChance(Number(e.target.value))}
                />
              </label>
              <button
                className="button secondary"
                disabled={busy || c.busy}
                onClick={() => setOver((v) => !v)}
              >
                {over ? "Over" : "Under"} {over ? 100 - chance : chance}
              </button>
              <b>{(97 / chance).toFixed(3)}× return before rounding</b>
            </div>
          </>
        ) : type === "plinko" ? (
          <>
            <div className="plinko-board" aria-label="Eight-row Plinko board">
              {Array.from({ length: 8 }, (_, row) =>
                Array.from({ length: row + 2 }, (_, col) => (
                  <i
                    key={row + ":" + col}
                    className="plinko-peg"
                    style={{
                      left: 50 - (row + 1) * 5.4 + col * 10.8 + "%",
                      top: 14 + row * 9 + "%",
                    }}
                  />
                )),
              )}
              <span
                className={"plinko-ball " + (busy ? "ball-falling" : "")}
                style={{ left: ballX + "%", top: ballY + "%" }}
                aria-hidden="true"
              >
                ✦
              </span>
            </div>
            <div className="plinko-bins">
              {plinkoPays.map((pay, i) => (
                <span
                  key={i}
                  className={!busy && result?.bin === i ? "bin-hit" : ""}
                >
                  {pay / 100}×
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="festival-pointer" aria-hidden="true">
              ▼
            </div>
            <div
              className="festival-wheel"
              style={{ transform: `rotate(${turn}deg)` }}
            >
              {wheelPays.map((pay, i) => (
                <span key={i} style={{ "--sector": i } as CSSProperties}>
                  {pay / 100}×
                </span>
              ))}
              <b>SPINDRA</b>
            </div>
          </>
        )}
      </div>
      <div className="mini-console">
        <div aria-live="polite">
          <small>LAST RETURN</small>
          <b>
            {!busy && result
              ? (result.returned_minor / 100).toFixed(2) +
                " · " +
                result.multiplier.toFixed(2) +
                "×"
              : "—"}
          </b>
        </div>
        <button
          className="button primary mini-play"
          disabled={busy || c.busy}
          onClick={() => void play()}
        >
          {busy
            ? "Playing…"
            : type === "dice"
              ? "Roll dice"
              : type === "plinko"
                ? "Drop meteor"
                : "Spin wheel"}
        </button>
      </div>
      <GameControls controls={{ ...c, busy: busy || c.busy }} />
      <details className="mini-rules">
        <summary>Rules & payouts</summary>
        <p>{miniRules(type)}</p>
        <p>
          One stake per round. Returns include stake. Cash outcomes and
          settlement are processed by the server; visual timing does not affect
          the result.
        </p>
      </details>
    </div>
  );
}
