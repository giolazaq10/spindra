import { useEffect, useRef, useState, type CSSProperties } from "react";
import { RotateCw, Trophy } from "lucide-react";
import type { Original } from "../lib/catalog";
import { modelSpin, type SlotWin } from "../lib/slotModels";
import { credits } from "../context/Demo";
import type { Controls } from "./OriginalGame";
import GameControls from "./GameControls";
import { SlotScenery, SlotSymbol } from "./SlotArt";
export default function AdvancedSlots({
  game,
  controls: c,
}: {
  game: Original;
  controls: Controls;
}) {
  const s = game.slot!;
  const [grid, setGrid] = useState(() =>
    Array.from({ length: s.reels }, (_, col) =>
      Array.from({ length: s.rows }, (_, row) => (col + row) % 7),
    ),
  );
  const [moving, setMoving] = useState<boolean[]>(Array(s.reels).fill(false)),
    [wins, setWins] = useState<SlotWin[]>([]),
    [returned, setReturned] = useState(0),
    [round, setRound] = useState(0),
    [lastStake, setLastStake] = useState(c.bet);
  const lock = useRef(false),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const spinning = moving.some(Boolean);
  function spin() {
    if (lock.current || !c.start()) return;
    lock.current = true;
    timers.current.forEach(clearTimeout);
    setWins([]);
    setReturned(0);
    setMoving(Array(s.reels).fill(true));
    setRound((n) => n + 1);
    setLastStake(c.bet);
    const result = modelSpin(s),
      stake = c.bet;
    result.grid.forEach((column, col) =>
      timers.current.push(
        setTimeout(
          () => {
            setGrid((g) => g.map((old, i) => (i === col ? column : old)));
            setMoving((m) => m.map((old, i) => (i === col ? false : old)));
            if (col === s.reels - 1) {
              const payout = (stake / 100) * result.rate;
              setWins(result.wins);
              setReturned(payout);
              lock.current = false;
              c.finish(payout);
            }
          },
          520 +
            col *
              (s.scene === "train" ? 230 : s.scene === "arcade" ? 115 : 170),
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
              {column.map((symbol, row) => {
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
          <b>{credits(returned)}</b>
        </div>
        <button
          className="spin-control"
          onClick={spin}
          disabled={spinning}
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
