import { useEffect, useRef, useState } from "react";
import { miniRules, plinkoPays, type MiniResult } from "@/lib/minigames";
import type { Controls } from "./OriginalGame";
import GameControls from "./GameControls";
type Job = {
  id: number;
  stake: number;
  input: Record<string, unknown>;
  play: (input: Record<string, unknown>) => Promise<MiniResult>;
};
type Ball = { id: number; result: MiniResult; step: number };
const MAX_QUEUE = 8;
export default function RapidMiniGames({
  type,
  controls: c,
  serverPlay,
}: {
  type: "dice" | "plinko";
  controls: Controls;
  serverPlay: Job["play"];
}) {
  const [chance, setChance] = useState(50),
    [over, setOver] = useState(false),
    [count, setCount] = useState(0),
    [reserved, setReserved] = useState(0),
    [results, setResults] = useState<(MiniResult & { id: number })[]>([]),
    [balls, setBalls] = useState<Ball[]>([]);
  const queue = useRef<Job[]>([]),
    running = useRef(false),
    alive = useRef(true),
    sequence = useRef(0),
    confirmedBalance = useRef(c.balance),
    timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    alive.current = true;
    const scheduled = timers.current;
    const jobs = queue.current;
    return () => {
      alive.current = false;
      jobs.length = 0;
      scheduled.forEach(clearTimeout);
      scheduled.clear();
    };
  }, []);
  useEffect(() => {
    if (!running.current) confirmedBalance.current = c.balance;
  }, [c.balance]);
  function syncQueue() {
    setCount(queue.current.length);
    setReserved(queue.current.reduce((sum, j) => sum + j.stake, 0));
  }
  function after(ms: number, fn: () => void) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      if (alive.current) fn();
    }, ms);
    timers.current.add(timer);
  }
  function animate(id: number, result: MiniResult) {
    if (type !== "plinko") return;
    setBalls((old) => [...old, { id, result, step: 0 }]);
    for (let step = 1; step <= 8; step++)
      after(step * 95, () => {
        setBalls((old) =>
          old.map((ball) => (ball.id === id ? { ...ball, step } : ball)),
        );
      });
    after(1100, () => setBalls((old) => old.filter((ball) => ball.id !== id)));
  }
  async function pump() {
    if (running.current) return;
    running.current = true;
    try {
      while (alive.current && queue.current.length) {
        const job = queue.current[0];
        if (confirmedBalance.current < job.stake) {
          queue.current.length = 0;
          syncQueue();
          c.setMessage("Queued bets stopped: insufficient cash balance.");
          break;
        }
        try {
          const result = await job.play(job.input);
          if (!alive.current) return;
          if (
            !Number.isSafeInteger(result.balance_minor) ||
            result.balance_minor! < 0
          )
            throw new Error("Unable to confirm wallet balance");
          confirmedBalance.current = result.balance_minor!;
          queue.current.shift();
          syncQueue();
          setResults((old) => [{ ...result, id: job.id }, ...old].slice(0, 12));
          animate(job.id, result);
        } catch (e) {
          if (!alive.current) return;
          const cancelled = Math.max(0, queue.current.length - 1);
          queue.current.length = 0;
          syncQueue();
          c.setMessage(
            (e instanceof Error ? e.message : "Bet could not be confirmed") +
              (cancelled ? ". Remaining queued bets were not submitted." : ""),
          );
          break;
        }
      }
    } finally {
      running.current = false;
    }
  }
  function enqueue() {
    if (c.canStart === false || queue.current.length >= MAX_QUEUE) return;
    const held = queue.current.reduce((sum, j) => sum + j.stake, 0);
    if (confirmedBalance.current - held < c.bet) return;
    queue.current.push({
      id: ++sequence.current,
      stake: c.bet,
      input: { bet: c.bet, threshold: Math.round(chance * 100), over },
      play: serverPlay,
    });
    syncQueue();
    void pump();
  }
  const latest = results[0],
    available = Math.max(0, c.balance - reserved);
  return (
    <div className={"mini-cabinet mini-" + type + " rapid-mini"}>
      <div className="mini-stage">
        <div className="mini-stars" aria-hidden="true">
          ✦ · ✧ · ✦ · ✧ · ✦
        </div>
        {type === "dice" ? (
          <>
            <div
              className={"prism-die " + (count ? "die-rolling" : "")}
              aria-hidden="true"
            >
              ⚄
            </div>
            <output className="dice-roll" aria-label="Last dice roll">
              {latest?.roll !== undefined
                ? (latest.roll / 100).toFixed(2)
                : "00.00"}
            </output>
            <div className="dice-track">
              <i style={{ left: (latest?.roll ?? 0) / 100 + "%" }} />
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
                  onChange={(e) => setChance(Number(e.target.value))}
                />
              </label>
              <button
                className="button secondary"
                onClick={() => setOver((v) => !v)}
              >
                {over ? "Over" : "Under"} {over ? 100 - chance : chance}
              </button>
              <b>{(97 / chance).toFixed(3)}× return before rounding</b>
            </div>
          </>
        ) : (
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
              {balls.map((ball) => {
                const path = ball.result.path!.slice(0, ball.step),
                  x = 50 + path.reduce((sum, d) => sum + (d ? 5.4 : -5.4), 0);
                return (
                  <span
                    key={ball.id}
                    className="plinko-ball ball-falling"
                    data-bet={ball.id}
                    style={{ left: x + "%", top: 9 + path.length * 9 + "%" }}
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                );
              })}
            </div>
            <div className="plinko-bins">
              {plinkoPays.map((pay, i) => (
                <span
                  key={i}
                  className={
                    balls.some((b) => b.step === 8 && b.result.bin === i)
                      ? "bin-hit"
                      : ""
                  }
                >
                  {pay / 100}×
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mini-console">
        <div aria-live="polite">
          <small>LAST RETURN</small>
          <b>
            {latest
              ? (latest.returned_minor / 100).toFixed(2) +
                " · " +
                latest.multiplier.toFixed(2) +
                "×"
              : "—"}
          </b>
        </div>
        <button
          className="button primary mini-play"
          disabled={
            c.canStart === false || count >= MAX_QUEUE || available < c.bet
          }
          onClick={enqueue}
        >
          {type === "dice" ? "Roll dice" : "Drop meteor"}
        </button>
      </div>
      <p className="rapid-queue" role="status">
        {count
          ? count +
            " bet" +
            (count === 1 ? "" : "s") +
            " pending · click again to queue"
          : "Ready for the next bet"}{" "}
        · ${(available / 100).toFixed(2)} available after pending stakes
      </p>
      <div className="rapid-results" aria-label="Recent bet results">
        {results.map((r) => (
          <span
            key={r.id}
            className={r.multiplier >= 1 ? "return-positive" : "return-low"}
          >
            #{r.id}{" "}
            {type === "dice" ? (r.roll! / 100).toFixed(2) : r.multiplier + "×"}{" "}
            · ${(r.returned_minor / 100).toFixed(2)}
          </span>
        ))}
      </div>
      <GameControls controls={{ ...c, busy: false }} />
      <details className="mini-rules">
        <summary>Rules & payouts</summary>
        <p>{miniRules(type)}</p>
        <p>
          Every click queues one bet with the stake and settings shown at that
          click. Up to eight pending bets. Bets submit in order without waiting
          for animations. Unsubmitted bets cancel when you leave or a request
          fails; a submitted bet retains its recovery ID.
        </p>
      </details>
    </div>
  );
}
