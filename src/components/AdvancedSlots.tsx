import { useEffect, useId, useRef, useState } from "react";
import { RotateCw, Trophy } from "lucide-react";
import type { Original } from "@/lib/catalog";
import { evaluateLines, fiveReelSpin, slotLines } from "@/lib/engine";
import { credits } from "@/context/Demo";
import type { Controls } from "./OriginalGame";

function SymbolArt({ symbol, index }: { symbol: string; index: number }) {
  const id = useId().replace(/:/g, "");
  const colors = [
    "#56d9ff",
    "#e28dff",
    "#ff7798",
    "#71f3af",
    "#ffa84c",
    "#ffe479",
    "#faf0ce",
  ];
  const shapes = [
    "50,7 85,25 93,64 50,94 7,64 15,25",
    "50,5 94,50 50,95 6,50",
    "22,10 78,10 96,45 74,90 26,90 4,45",
    "50,5 93,30 93,70 50,95 7,70 7,30",
    "50,4 63,32 95,36 72,58 78,91 50,76 22,91 28,58 5,36 37,32",
    "20,15 80,15 96,48 50,93 4,48",
    "12,25 28,40 50,8 72,40 88,25 82,83 18,83",
  ];
  return (
    <svg
      viewBox="0 0 100 100"
      className="symbol-art"
      role="img"
      aria-label={symbol}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" />
          <stop offset=".25" stopColor={colors[index]} />
          <stop offset="1" stopColor="#292449" />
        </linearGradient>
        <linearGradient id={id + "edge"} x2="0" y2="1">
          <stop stopColor="#fff6c1" />
          <stop offset=".5" stopColor="#ab7940" />
          <stop offset="1" stopColor="#ffe8a4" />
        </linearGradient>
      </defs>
      <polygon
        points={shapes[index]}
        fill={"url(#" + id + ")"}
        stroke={"url(#" + id + "edge)"}
        strokeWidth="3"
      />
      <polygon
        points={shapes[index]}
        transform="translate(10 10) scale(.8)"
        fill="none"
        stroke="#fff"
        strokeOpacity=".3"
      />
      <path d="M20 29L50 15L80 29L50 46Z" fill="#fff" opacity=".18" />
      <text
        x="50"
        y="61"
        textAnchor="middle"
        fontSize="36"
        fontWeight="800"
        fill="#fff"
        stroke="#352331"
        strokeWidth=".5"
      >
        {symbol}
      </text>
    </svg>
  );
}

export default function AdvancedSlots({
  game,
  controls: c,
}: {
  game: Original;
  controls: Controls;
}) {
  const [grid, setGrid] = useState(() =>
    Array.from({ length: 5 }, (_, col) =>
      Array.from({ length: 3 }, (_, row) => (col + row) % 7),
    ),
  );
  const [moving, setMoving] = useState<boolean[]>(Array(5).fill(false));
  const [wins, setWins] = useState<ReturnType<typeof evaluateLines>>([]);
  const [returned, setReturned] = useState(0);
  const [round, setRound] = useState(0);
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
    setMoving(Array(5).fill(true));
    setRound((n) => n + 1);
    const result = fiveReelSpin(game.math),
      stake = c.bet;
    result.grid.forEach((column, col) => {
      timers.current.push(
        setTimeout(
          () => {
            setGrid((g) => g.map((old, i) => (i === col ? column : old)));
            setMoving((m) => m.map((old, i) => (i === col ? false : old)));
            if (col === 4) {
              // Each line stake is an integer number of minor credits.
              const payout = result.wins.reduce(
                (sum, w) => sum + (stake / slotLines.length) * w.multiplier,
                0,
              );
              setWins(result.wins);
              setReturned(payout);
              c.finish(payout);
              lock.current = false;
            }
          },
          650 + col * 190,
        ),
      );
    });
  }
  return (
    <div className={"advanced-slot theme-" + game.animation}>
      <div className="cabinet-ambient" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="cabinet-heading">
        <span className="cabinet-mark">{game.emblem}</span>
        <div>
          <small>SPINDRA ORIGINALS</small>
          <h2>{game.name}</h2>
        </div>
        <span className="cabinet-badge">
          5 × 3<br />
          <b>10 LINES</b>
        </span>
      </div>
      <div className="slot-marquee" role="status">
        {spinning
          ? "REELS IN MOTION"
          : wins.length
            ? wins.length + " WINNING LINE" + (wins.length > 1 ? "S" : "")
            : "MATCH 3, 4 OR 5 SYMBOLS FROM THE LEFT"}
      </div>
      <div className={"reel-cabinet " + (wins.length ? "cabinet-winner" : "")}>
        <div className="line-numbers" aria-hidden="true">
          <b>2</b>
          <b>1</b>
          <b>3</b>
        </div>
        <div className="advanced-reels" aria-label="Five reels with three rows">
          {grid.map((column, col) => (
            <div
              key={col}
              className={
                "advanced-reel " +
                (moving[col] ? "reel-moving" : "reel-stopped")
              }
            >
              {column.map((symbol, row) => {
                const winning = wins.some(
                  (w) => col < w.count && w.rows[col] === row,
                );
                return (
                  <div
                    key={row + ":" + (moving[col] ? "motion" : round)}
                    className={
                      "symbol-cell " + (winning ? "symbol-winning" : "")
                    }
                  >
                    <SymbolArt symbol={game.symbols[symbol]} index={symbol} />
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
            viewBox="0 0 500 300"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {wins.map((w, i) => (
              <polyline
                key={w.line}
                points={w.rows
                  .slice(0, w.count)
                  .map((row, col) => `${col * 100 + 50},${row * 100 + 50}`)
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
          <small>LINES</small>
          <b>10 FIXED</b>
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
        <div>
          <small>LINE STAKE</small>
          <b>{credits(c.bet / 10)}</b>
        </div>
      </div>
      <div className="line-results" aria-live="polite">
        {wins.length ? (
          wins.map((w) => (
            <span key={w.line}>
              Line {w.line + 1} · {game.symbols[w.symbol]} × {w.count} ·{" "}
              {credits((c.bet / 10) * w.multiplier)}
            </span>
          ))
        ) : (
          <span>
            Ten paylines active · View Rules & payouts for every line award
          </span>
        )}
      </div>
    </div>
  );
}
