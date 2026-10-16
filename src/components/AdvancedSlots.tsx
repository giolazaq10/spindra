import { useEffect, useRef, useState, type CSSProperties } from "react";
import { RotateCw, Trophy } from "lucide-react";
import type { Original } from "../lib/catalog";
import { type SlotWin } from "../lib/slotModels";
import AnimatedCredits from "./AnimatedCredits";
import { credits } from "../lib/money";
import type { Controls } from "./OriginalGame";
import GameControls from "./GameControls";
import { SlotScenery, SlotSymbol } from "./SlotArt";
export default function AdvancedSlots({
  game,
  controls: c,
  serverSpin,
  initialResult,
}: {
  game: Original;
  controls: Controls;
  serverSpin: (stake: number) => Promise<{
    grid: number[][];
    wins: SlotWin[];
    rate: number;
    returned_minor: number;
  }>;
  initialResult?: { grid: number[][]; wins: SlotWin[]; returned_minor: number };
}) {
  const s = game.slot!;
  const [grid, setGrid] = useState(
    () =>
      initialResult?.grid ||
      Array.from({ length: s.reels }, (_, col) =>
        Array.from({ length: s.rows }, (_, row) => (col + row) % 7),
      ),
  );
  const [moving, setMoving] = useState<boolean[]>(Array(s.reels).fill(false)),
    [wins, setWins] = useState<SlotWin[]>(initialResult?.wins || []),
    [returned, setReturned] = useState(initialResult?.returned_minor || 0),
    [round, setRound] = useState(0),
    [lastStake, setLastStake] = useState(c.bet);
  const lock = useRef(false),
    mounted = useRef(true),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    mounted.current = true;
    const scheduled = timers.current;
    return () => {
      mounted.current = false;
      scheduled.forEach(clearTimeout);
    };
  }, []);
  const spinning = moving.some(Boolean);
  async function spin() {
    if (lock.current || !c.start()) return;
    lock.current = true;
    const startedAt = performance.now();
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    setWins([]);
    setReturned(0);
    setMoving(Array(s.reels).fill(true));
    setRound((n) => n + 1);
    setLastStake(c.bet);
    let result: Awaited<ReturnType<typeof serverSpin>>;
    const stake = c.bet;
    try {
      result = await serverSpin(stake);
    } catch (e) {
      if (!mounted.current) return;
      lock.current = false;
      setMoving(Array(s.reels).fill(false));
      c.finish(0);
      c.setMessage(
        e instanceof Error
          ? e.message
          : "Unable to confirm spin. Recover the pending request before playing again.",
      );
      return;
    }
    if (!mounted.current) return;
    // Network settlement and reel motion run together, not one after another.
    const elapsed = performance.now() - startedAt;
    result.grid.forEach((column, col) =>
      timers.current.push(
        setTimeout(
          () => {
            setGrid((g) => g.map((old, i) => (i === col ? column : old)));
            setMoving((m) => m.map((old, i) => (i === col ? false : old)));
            if (col === s.reels - 1) {
              const payout = result.returned_minor;
              setWins(result.wins);
              setReturned(payout);
              lock.current = false;
              c.finish(payout);
            }
          },
          Math.max(0, 550 + col * 90 - elapsed),
        ),
      ),
    );
  }
  const pattern =
    s.mode === "ways" ? s.rows ** s.reels + " WAYS" : s.lines.length + " LINES";
  return (
    <div
      className={"advanced-slot distinct-slot scene-" + s.scene}
      style={
        { "--slot-reels": s.reels, "--slot-rows": s.rows } as CSSProperties
      }
    >
      <SlotScenery scene={s.scene} />
      <div className="scene-overlay" />
      <div className="scene-particles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} style={{ "--particle": i } as CSSProperties} />
        ))}
      </div>
      <div className="cabinet-heading">
        <span className="cabinet-mark">{game.emblem}</span>
        <div>
          <small>SPINDRA ORIGINALS</small>
          <h2>{game.name}</h2>
        </div>
        <span className="cabinet-badge">
          {s.reels} × {s.rows}
          <br />
          <b>{pattern}</b>
        </span>
      </div>
      <div className="mechanic-banner">
        <b>{s.feature}</b>
        <span>
          {s.direction === "right" ? "RIGHT → LEFT" : "LEFT → RIGHT"} ·{" "}
          {s.minimum}+ MATCH
        </span>
      </div>
      <div className="slot-marquee" role="status">
        {spinning
          ? "REELS IN MOTION"
          : wins.length
            ? returned > lastStake
              ? "WINNING SPIN · " + credits(returned)
              : "RETURN · " + credits(returned)
            : s.description}
      </div>
      <div className={"reel-cabinet " + (wins.length ? "cabinet-winner" : "")}>
        <div
          className="advanced-reels"
          aria-label={s.reels + " reels with " + s.rows + " rows"}
        >
          {grid.map((column, col) => (
            <div
              className={
                "advanced-reel " +
                (moving[col] ? "reel-moving" : "reel-stopped")
              }
              key={col}
            >
              <div
                className={
                  moving[col] ? "reel-strip strip-running" : "reel-strip"
                }
              >
                {(moving[col]
                  ? Array.from(
                      { length: s.rows * 3 },
                      (_, i) => (i + col * 2 + round) % (s.scatter ? 8 : 7),
                    )
                  : column
                ).map((symbol, row) => {
                  const winning = wins.some((w) =>
                    w.cells.some(([x, y]) => col === x && row === y),
                  );
                  return (
                    <div
                      key={row + ":" + (moving[col] ? "motion" : round)}
                      className={
                        "symbol-cell " + (winning ? "symbol-winning" : "")
                      }
                    >
                      <SlotSymbol spec={s} index={symbol} />
                      {winning && (
                        <span className="symbol-spark" aria-hidden="true">
                          ✦
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <svg
            className="winning-lines"
            viewBox={"0 0 " + s.reels * 100 + " " + s.rows * 100}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {wins
              .filter((w) => w.line !== undefined)
              .map((w, i) => (
                <polyline
                  key={w.line}
                  points={w.cells
                    .map(
                      ([col, row]) => col * 100 + 50 + "," + (row * 100 + 50),
                    )
                    .join(" ")}
                  fill="none"
                  stroke={["#ffe087", "#75e9ff", "#e999ff"][i % 3]}
                  strokeWidth="3"
                />
              ))}
          </svg>
        </div>
        {wins.length > 0 && (
          <div
            key={round}
            className={
              "win-celebration " + (returned >= lastStake * 5 ? "big-win" : "")
            }
            aria-hidden="true"
          >
            <strong>
              {returned >= lastStake * 10
                ? "SPECTACULAR WIN"
                : returned >= lastStake * 5
                  ? "BIG WIN"
                  : returned > lastStake
                    ? "YOU WIN"
                    : "REEL RETURN"}
            </strong>
            <span>
              <AnimatedCredits amount={returned} />
            </span>
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} style={{ "--coin": i } as CSSProperties}>
                ✦
              </i>
            ))}
          </div>
        )}
      </div>
      <div className="slot-console">
        <div>
          <small>ACTIVE PATTERNS</small>
          <b>{pattern}</b>
        </div>
        <div className={returned ? "last-win has-win" : "last-win"}>
          <small>
            <Trophy size={12} /> LAST RETURN
          </small>
          <b>
            <AnimatedCredits amount={returned} />
          </b>
        </div>
        <button
          className="spin-control"
          onClick={spin}
          disabled={spinning || c.busy || c.canStart === false}
          aria-label={spinning ? "Spinning reels" : "Spin reels"}
        >
          <RotateCw size={30} />
          <span>{spinning ? "SPINNING" : "SPIN"}</span>
        </button>
      </div>
      <GameControls controls={c} />
      <div className="line-results" aria-live="polite">
        {wins.length ? (
          wins.map((w, i) => (
            <span key={i}>
              {w.scatter
                ? s.scatter!.name
                : w.line !== undefined
                  ? "Line " + (w.line + 1)
                  : w.ways + " ways"}{" "}
              ·{" "}
              {w.scatter
                ? ""
                : s.symbolNames[w.symbol] + " × " + w.count + " · "}
              {credits((lastStake / 100) * w.rate)}
            </span>
          ))
        ) : (
          <span>
            {s.scatter ? s.scatter.name + " awards anywhere · " : ""}Open Rules
            & payouts for this cabinet’s complete specification
          </span>
        )}
      </div>
    </div>
  );
}
