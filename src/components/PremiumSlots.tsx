import { useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { RotateCw, FastForward, LockKeyhole } from "lucide-react";
import type { Original } from "@/lib/catalog";
import type { SlotWin } from "@/lib/slotModels";
import type { PremiumFrame } from "@/lib/premiumSlots";
import { vaultCoinPays } from "@/lib/premiumSlots";
import type { Controls } from "./OriginalGame";
import { PremiumBackdrop, PremiumSymbol } from "./PremiumSlotArt";
import GameControls from "./GameControls";
import { credits } from "@/lib/money";
import AnimatedCredits from "./AnimatedCredits";
export type PremiumResult = {
  grid: number[][];
  wins: SlotWin[];
  rate: number;
  frames?: PremiumFrame[];
  returned_minor: number;
};
export default function PremiumSlots({
  game,
  controls: c,
  serverSpin,
  initialResult,
}: {
  game: Original;
  controls: Controls;
  serverSpin: (stake: number) => Promise<PremiumResult>;
  initialResult?: {
    grid: number[][];
    wins: SlotWin[];
    returned_minor: number;
    frames?: PremiumFrame[];
  };
}) {
  const s = game.slot!,
    kind = s.premium!;
  const empty = () =>
    Array.from({ length: s.reels }, (_, x) =>
      Array.from({ length: s.rows }, (_, y) =>
        kind === "vault" ? 0 : (x + y) % 7,
      ),
    );
  const [frame, setFrame] = useState<PremiumFrame>({
      grid: initialResult?.grid || empty(),
      wins: initialResult?.wins || [],
      rate: 0,
      multiplier: 1,
      remaining: 3,
      label: "Ready to play",
    }),
    [playing, setPlaying] = useState(false),
    [stage, setStage] = useState(0),
    [returned, setReturned] = useState(initialResult?.returned_minor || 0),
    [spinCount, setSpinCount] = useState(0),
    [paid, setPaid] = useState(false);
  const locked = useRef(false),
    alive = useRef(true),
    timers = useRef(new Set<ReturnType<typeof setTimeout>>()),
    confirmed = useRef<PremiumResult | null>(null);
  useEffect(() => {
    alive.current = true;
    const scheduled = timers.current;
    return () => {
      alive.current = false;
      scheduled.forEach(clearTimeout);
      scheduled.clear();
    };
  }, []);
  function clear() {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }
  function after(ms: number, fn: () => void) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      if (alive.current) fn();
    }, ms);
    timers.current.add(timer);
  }
  function finish(result: PremiumResult) {
    if (!locked.current) return;
    clear();
    const last = result.frames?.[result.frames.length - 1];
    setFrame(
      last || {
        grid: result.grid,
        wins: result.wins,
        rate: result.rate,
        multiplier: 1,
        label: "Round settled",
      },
    );
    setReturned(result.returned_minor);
    setPaid(true);
    setPlaying(false);
    locked.current = false;
    c.finish(result.returned_minor);
  }
  async function spin() {
    if (locked.current || !c.start()) return;
    locked.current = true;
    confirmed.current = null;
    clear();
    flushSync(() => {
      setPlaying(true);
      setPaid(false);
      setStage(0);
      setSpinCount((n) => n + 1);
      setReturned(0);
      setFrame({
        grid: empty(),
        wins: [],
        rate: 0,
        multiplier: 1,
        remaining: 3,
        label: "Reels in motion…",
      });
    });
    const began = performance.now();
    try {
      const result = await serverSpin(c.bet);
      if (!alive.current) return;
      confirmed.current = result;
      const frames = result.frames || [],
        elapsed = performance.now() - began;
      frames.forEach((f, i) =>
        after(
          Math.max(
            0,
            200 +
              i * (kind === "cascade" ? 240 : kind === "vault" ? 160 : 200) -
              elapsed,
          ),
          () => {
            setFrame(f);
            setStage(i + 1);
          },
        ),
      );
      after(
        Math.max(
          0,
          350 +
            Math.max(0, frames.length - 1) *
              (kind === "cascade" ? 240 : kind === "vault" ? 160 : 200) -
            elapsed,
        ),
        () => finish(result),
      );
    } catch (e) {
      if (!alive.current) return;
      locked.current = false;
      setPlaying(false);
      c.finish(0);
      c.setMessage(e instanceof Error ? e.message : "Unable to confirm spin");
    }
  }
  const cells = frame.grid
      .flatMap((col, x) => col.map((symbol, y) => ({ symbol, x, y })))
      .sort((a, b) => a.y - b.y || a.x - b.x),
    lockedCount = cells.filter((cell) => cell.symbol > 0).length;
  return (
    <div
      className={
        "premium-slot premium-" +
        kind +
        (playing ? " premium-playing" : "") +
        (playing && stage === 0 ? " premium-spinning" : "")
      }
    >
      <PremiumBackdrop kind={kind} />
      <header className="premium-heading">
        <div>
          <span>
            SIGNATURE SERIES /{" "}
            {kind === "cascade"
              ? "CELESTIAL LAB"
              : kind === "vault"
                ? "LOCKWORKS No. 09"
                : "MIDNIGHT MOTOR CO."}
          </span>
          <h2>{game.name}</h2>
        </div>
        <span className="signature-seal">
          {kind === "cascade"
            ? "6 × 5"
            : kind === "vault"
              ? "9 SOCKETS"
              : "3 DRUMS"}
        </span>
      </header>
      <div className="premium-feature-bar">
        <b>{s.feature}</b>
        <span>
          {kind === "cascade"
            ? "8+ ANYWHERE"
            : kind === "vault"
              ? "HOLD & RESPIN"
              : "ONE PAYLINE"}
        </span>
      </div>
      <div className="signature-stage">
        {kind === "cascade" && (
          <aside className="cascade-rail">
            <small>PORTAL CHARGE</small>
            {[1, 2, 3].map((m) => (
              <b
                key={m}
                className={frame.multiplier === m ? "charge-active" : ""}
              >
                {m}×
              </b>
            ))}
            <span>Three stages maximum</span>
          </aside>
        )}
        <div className="signature-cabinet">
          {kind === "vault" && (
            <div className="vault-counter">
              <span>
                <LockKeyhole size={15} /> {lockedCount} / 9 locked
              </span>
              <b>{frame.remaining ?? 3} CHANCES</b>
              <span>Draw {stage} / 8</span>
            </div>
          )}
          {kind === "nitro" && (
            <div className="nitro-dashboard">
              <div className="nitro-gauge">
                <i
                  style={{
                    transform: `rotate(${frame.multiplier === 5 ? 70 : frame.multiplier === 2 ? 15 : -65}deg)`,
                  }}
                />
                <b>{frame.multiplier}×</b>
              </div>
              <span>WILD GEAR TURBO</span>
              <small>1× 85% · 2× 10% · 5× 5%</small>
            </div>
          )}
          <div
            className="signature-grid"
            style={
              {
                "--premium-cols": s.reels,
                "--premium-rows": s.rows,
              } as CSSProperties
            }
            aria-label={
              kind === "cascade"
                ? "Six by five crystal board"
                : kind === "vault"
                  ? "Nine locking coin sockets"
                  : "Three chrome slot drums"
            }
          >
            {cells.map(({ symbol, x, y }) => {
              const winning = frame.wins.some((w) =>
                w.cells.some(([a, b]) => a === x && b === y),
              );
              return (
                <div
                  key={
                    x +
                    ":" +
                    y +
                    ":" +
                    (kind === "cascade"
                      ? stage
                      : kind === "nitro"
                        ? spinCount
                        : 0)
                  }
                  className={
                    "signature-cell " +
                    (winning ? "signature-hit " : "") +
                    (kind === "vault" && symbol ? "coin-locked " : "") +
                    (kind === "vault" ? "" : "signature-draw")
                  }
                  style={{ "--cell-order": x + y } as CSSProperties}
                >
                  <PremiumSymbol kind={kind} index={symbol} />
                  {kind === "vault" && symbol > 0 && (
                    <span className="lock-glint" />
                  )}
                </div>
              );
            })}
          </div>
          {paid && returned > 0 && (
            <div className="signature-award" key={spinCount}>
              <small>
                {kind === "vault" && lockedCount === 9
                  ? "VAULT COMPLETE"
                  : returned > c.bet
                    ? "YOU WIN"
                    : "RETURN"}
              </small>
              <strong>
                <AnimatedCredits amount={returned} />
              </strong>
            </div>
          )}
        </div>
        {kind === "vault" && (
          <aside className="vault-ledger">
            <small>COIN VALUES</small>
            {vaultCoinPays.map((pay, i) => (
              <span key={i}>
                <i />
                {pay / 100}×
              </span>
            ))}
            <b>Full grid +2×</b>
          </aside>
        )}
      </div>
      <div className="signature-status" role="status">
        <span>{playing && stage === 0 ? "Reels in motion…" : frame.label}</span>
        <b>
          {kind === "cascade"
            ? "STAGE " + stage + " / 3"
            : kind === "vault"
              ? "LOCK PROGRESS " + lockedCount + "/9"
              : "BOOST " + frame.multiplier + "×"}
        </b>
      </div>
      <div className="signature-console">
        <div>
          <small>LAST RETURN · USD</small>
          <strong>{credits(returned)}</strong>
        </div>
        <button
          className="signature-skip"
          aria-label="Skip confirmed animation"
          disabled={!playing || stage === 0}
          onClick={() => {
            if (confirmed.current) finish(confirmed.current);
          }}
        >
          <FastForward size={20} />
          <span>Skip</span>
        </button>
        <button
          className="spin-control"
          aria-label={playing ? "Spinning reels" : "Spin reels"}
          disabled={playing || c.busy || c.canStart === false}
          onClick={() => void spin()}
        >
          <RotateCw size={28} />
          <span>{playing ? "SPINNING" : "SPIN"}</span>
        </button>
      </div>
      <GameControls controls={{ ...c, busy: c.busy || playing }} />
    </div>
  );
}
