import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
import type { Original } from "../lib/catalog";
import { type SlotWin, type SlotBonus } from "../lib/slotModels";
import SlotWinCelebration from "./SlotWinCelebration";
import { credits } from "../lib/money";
import type { Controls } from "./OriginalGame";
import SlotConsole from "./SlotConsole";
import { slotLook, slotThemeVars } from "../lib/slotPresentation";
import { SlotScenery, SlotSymbol } from "./SlotArt";
import { reelMotion } from "./reelMotion";
import { useSlotPlayback } from "./useSlotPlayback";
import { useSlotAudio } from "./useSlotAudio";
import SlotPlaybackControls from "./SlotPlaybackControls";
import SlotAtmosphere from "./SlotAtmosphere";
import ScatterCelebration from "./ScatterCelebration";
import CinematicEffects from "./CinematicEffects";
import WorldActor from "./WorldActor";
import { livingWorld } from "../lib/livingWorlds";
const ReelSymbol = memo(SlotSymbol);
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
    base_rate?: number;
    bonus?: SlotBonus;
  }>;
  initialResult?: {
    grid: number[][];
    wins: SlotWin[];
    returned_minor: number;
    stake_minor?: number;
    base_rate?: number;
    bonus?: SlotBonus;
  };
}) {
  const s = game.slot!;
  const [grid, setGrid] = useState(
    () =>
      initialResult?.bonus?.frames[initialResult.bonus.frames.length - 1]
        ?.grid ||
      initialResult?.grid ||
      Array.from({ length: s.reels }, (_, col) =>
        Array.from({ length: s.rows }, (_, row) => (col + row) % 7),
      ),
  );
  const [moving, setMoving] = useState<boolean[]>(Array(s.reels).fill(false)),
    [landing, setLanding] = useState<boolean[]>(Array(s.reels).fill(false)),
    [wins, setWins] = useState<SlotWin[]>(
      initialResult?.bonus?.frames[initialResult.bonus.frames.length - 1]
        ?.wins ||
        initialResult?.wins ||
        [],
    ),
    [returned, setReturned] = useState(initialResult?.returned_minor || 0),
    [round, setRound] = useState(0),
    [lastStake, setLastStake] = useState(initialResult?.stake_minor || c.bet);
  const [bonus, setBonus] = useState<{
    phase: "intro" | "playing" | "complete";
    played: number;
    remaining: number;
    added: number;
    won: number;
  } | null>(() =>
    initialResult?.bonus
      ? {
          phase: "complete",
          played: initialResult.bonus.frames.length,
          remaining: 0,
          added: 0,
          won:
            initialResult.returned_minor -
            Math.floor(
              ((initialResult.stake_minor || c.bet) *
                (initialResult.base_rate || 0)) /
                100,
            ),
        }
      : null,
  );
  const confirmed = useRef<Awaited<ReturnType<typeof serverSpin>> | null>(null);
  const sound = useSlotAudio(game.slug);
  const cabinet = useRef<HTMLDivElement>(null);
  const spinHandler = useRef<(fast: boolean) => Promise<boolean>>(
    async () => false,
  );
  const [quick, setQuick] = useState(false);
  const [waitingStop, setWaitingStop] = useState(false);
  const stopRequested = useRef(false),
    basePresented = useRef(false),
    spinStake = useRef(c.bet);
  const bonusStarted = useRef(false);
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
  const spinning = moving.some(Boolean) || landing.some(Boolean);
  const bonusActive = bonus?.phase === "intro" || bonus?.phase === "playing";
  const playback = useSlotPlayback({
    busy: spinning || !!bonusActive || c.busy,
    canStart: !bonusActive && c.canStart !== false && c.balance >= c.bet,
    spin: spinHandler,
    root: cabinet,
    unlock: () => sound.audio.unlock(),
  });
  function revealReels(
    target: number[][],
    elapsed: number,
    finish: () => void,
    fast = false,
  ) {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
    const plan = reelMotion(s.reels, elapsed, reduced, fast);
    target.forEach((column, col) => {
      timers.current.push(
        setTimeout(() => {
          if (!mounted.current || !lock.current) return;
          setGrid((g) => g.map((old, i) => (i === col ? column : old)));
          setMoving((m) => m.map((old, i) => (i === col ? false : old)));
          setLanding((m) => m.map((old, i) => (i === col ? true : old)));
          sound.audio.play("reel", col);
        }, plan[col].stop),
      );
      timers.current.push(
        setTimeout(() => {
          if (!mounted.current || !lock.current) return;
          setLanding((m) => m.map((old, i) => (i === col ? false : old)));
          if (col === s.reels - 1) finish();
        }, plan[col].stop + plan[col].land),
      );
    });
  }
  async function spin(fast = false) {
    if (lock.current || !c.start()) return false;
    lock.current = true;
    stopRequested.current = false;
    basePresented.current = false;
    spinStake.current = c.bet;
    playback.accepted();
    sound.audio.play("spin");
    const startedAt = performance.now();
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    flushSync(() => {
      setQuick(fast);
      setWaitingStop(false);
      setBonus(null);
      confirmed.current = null;
      bonusStarted.current = false;
      setWins([]);
      setReturned(0);
      setMoving(Array(s.reels).fill(true));
      setLanding(Array(s.reels).fill(false));
      setRound((n) => n + 1);
      setLastStake(c.bet);
    });
    let result: Awaited<ReturnType<typeof serverSpin>>;
    const stake = c.bet;
    try {
      result = await serverSpin(stake);
    } catch (e) {
      if (!mounted.current) return false;
      lock.current = false;
      setWaitingStop(false);
      setMoving(Array(s.reels).fill(false));
      setLanding(Array(s.reels).fill(false));
      c.finish(0);
      playback.completed();
      playback.stop(
        "Stopped: spin could not be confirmed. Recover the pending request before continuing.",
      );
      c.setMessage(
        e instanceof Error
          ? e.message
          : "Unable to confirm spin. Recover the pending request before playing again.",
      );
      return false;
    }
    if (!mounted.current) return false;
    confirmed.current = result;
    if (stopRequested.current) {
      finishBase(result, stake);
      return true;
    }
    // Network settlement and reel motion run together, not one after another.
    const elapsed = performance.now() - startedAt;
    revealReels(result.grid, elapsed, () => finishBase(result, stake), fast);
    return true;
  }
  function finishBase(
    result: Awaited<ReturnType<typeof serverSpin>>,
    stake: number,
  ) {
    if (!mounted.current || basePresented.current) return;
    basePresented.current = true;
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    setGrid(result.grid);
    setMoving(Array(s.reels).fill(false));
    setLanding(Array(s.reels).fill(false));
    setWaitingStop(false);
    const payout = result.bonus
      ? Math.floor((stake * (result.base_rate || 0)) / 100)
      : result.returned_minor;
    setWins(result.wins);
    setReturned(payout);
    if (result.bonus) {
      playback.stop("Free spins awarded. Repeated paid spins stopped.");
      sound.audio.play("bonus");
      setBonus({
        phase: "intro",
        played: 0,
        remaining: result.bonus.initial,
        added: 0,
        won: 0,
      });
    } else {
      lock.current = false;
      c.finish(payout);
      playback.completed();
      sound.audio.play(
        payout > stake ? "win" : payout < stake ? "loss" : "reel",
        payout / stake,
      );
    }
  }
  function stopSpin() {
    playback.stop("Repeated spins stopped.");
    if (!lock.current) return;
    if (bonus?.phase === "playing") {
      completeBonus();
      return;
    }
    if (bonus?.phase === "intro") return;
    stopRequested.current = true;
    if (confirmed.current) finishBase(confirmed.current, spinStake.current);
    else setWaitingStop(true);
  }
  function completeBonus() {
    const result = confirmed.current;
    if (!result?.bonus || !mounted.current || !lock.current) return;
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    const last = result.bonus.frames[result.bonus.frames.length - 1];
    setGrid(last.grid);
    setMoving(Array(s.reels).fill(false));
    setLanding(Array(s.reels).fill(false));
    setWins(last.wins);
    setReturned(result.returned_minor);
    setRound((n) => n + 1);
    setBonus({
      phase: "complete",
      played: result.bonus.frames.length,
      remaining: 0,
      added: 0,
      won:
        result.returned_minor -
        Math.floor((lastStake * (result.base_rate || 0)) / 100),
    });
    lock.current = false;
    c.finish(result.returned_minor);
    playback.completed();
    sound.audio.play("win", result.returned_minor / lastStake);
  }
  function playBonus(index = 0, accumulatedRate = 0) {
    const result = confirmed.current;
    if (!result?.bonus || !mounted.current || !lock.current) return;
    const frame = result.bonus.frames[index];
    if (!frame) {
      completeBonus();
      return;
    }
    setMoving(Array(s.reels).fill(true));
    setLanding(Array(s.reels).fill(false));
    setWins([]);
    setBonus({
      phase: "playing",
      played: index,
      remaining: index
        ? result.bonus.frames[index - 1].remaining
        : result.bonus.initial,
      added: 0,
      won: Math.floor((lastStake * accumulatedRate) / 100),
    });
    const nextRate = accumulatedRate + frame.rate;
    revealReels(frame.grid, 0, () => {
      setWins(frame.wins);
      setReturned(
        Math.floor((lastStake * ((result.base_rate || 0) + nextRate)) / 100),
      );
      setBonus({
        phase: "playing",
        played: index + 1,
        remaining: frame.remaining,
        added: frame.added,
        won: Math.floor((lastStake * nextRate) / 100),
      });
      timers.current.push(
        setTimeout(() => playBonus(index + 1, nextRate), 500),
      );
    });
  }
  useLayoutEffect(() => {
    spinHandler.current = spin;
  });
  const pattern =
    s.mode === "ways" ? s.rows ** s.reels + " WAYS" : s.lines.length + " LINES";
  return (
    <div
      className={
        "advanced-slot distinct-slot slot-polished family-" +
        slotLook(s.scene).family +
        " scene-" +
        s.scene +
        (spinning ? " slot-in-motion" : "") +
        (quick ? " slot-quick" : "") +
        (bonusActive ? " slot-in-bonus" : "")
      }
      ref={cabinet}
      data-slot-rows={s.rows}
      style={
        {
          ...slotThemeVars(s.scene),
          "--slot-reels": s.reels,
          "--slot-rows": s.rows,
        } as CSSProperties
      }
    >
      <SlotScenery scene={s.scene} />
      <div className="scene-overlay" />
      <SlotAtmosphere
        scene={s.scene}
        phase={
          bonusActive
            ? "bonus"
            : spinning
              ? "spin"
              : returned > lastStake
                ? "win"
                : "idle"
        }
      />
      <div className="scene-particles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} style={{ "--particle": i } as CSSProperties} />
        ))}
      </div>
      <div className="cabinet-heading">
        <span className="cabinet-mark world-badge-avatar" aria-hidden="true">
          <WorldActor kind={livingWorld(s.scene).actors[0]} />
        </span>
        <div>
          <small>SPINDRA ORIGINALS · {slotLook(s.scene).label}</small>
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
      <div className="slot-specials">
        <span>WILD · REEL {(s.wild?.reel ?? 0) + 1}</span>
        <span>3+ SCATTERS · 10 FREE SPINS</span>
      </div>
      <div
        className={
          "slot-bonus-bar " +
          (bonus ? "bonus-visible " : "") +
          (bonus?.added ? "bonus-retrigger" : "")
        }
        aria-live="polite"
      >
        {bonus ? (
          <>
            <div>
              <strong key={bonus.played}>
                {bonus.phase === "intro"
                  ? "10 FREE SPINS AWARDED"
                  : bonus.phase === "complete"
                    ? "FREE SPINS COMPLETE"
                    : "FREE SPINS · " + bonus.remaining + " LEFT"}
              </strong>
              <span>
                {bonus.added > 0 ? "+" + bonus.added + " EXTRA SPINS · " : ""}
                {bonus.phase === "intro"
                  ? "Same stake · no additional charge"
                  : "Bonus return " + credits(bonus.won)}
              </span>
            </div>
            {bonus.phase === "playing" && (
              <button onClick={completeBonus}>Skip bonus animations</button>
            )}
          </>
        ) : (
          <span>
            Three scatters unlock 10 free spins · retrigger +5 · maximum 50
          </span>
        )}
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
      <div
        className={
          "reel-cabinet " +
          (wins.length ? "cabinet-winner " : "") +
          (bonus?.phase === "intro"
            ? "camera-bonus"
            : spinning
              ? "camera-spin"
              : returned > lastStake
                ? "camera-win"
                : "")
        }
      >
        {spinning && <CinematicEffects cue="spin" />}
        <div
          className="advanced-reels"
          aria-label={s.reels + " reels with " + s.rows + " rows"}
        >
          {grid.map((column, col) => (
            <div
              className={
                "advanced-reel " +
                (moving[col]
                  ? "reel-moving"
                  : landing[col]
                    ? "reel-landing"
                    : "reel-stopped")
              }
              key={col}
              data-reel={col + 1}
            >
              <div
                className={
                  moving[col] ? "reel-strip strip-running" : "reel-strip"
                }
              >
                {Array.from(
                  { length: s.rows * 2 },
                  (_, row) => column[row % s.rows],
                ).map((symbol, row) => {
                  const winning =
                    !moving[col] &&
                    row < s.rows &&
                    wins.some((w) =>
                      w.cells.some(([x, y]) => col === x && row === y),
                    );
                  return (
                    <div
                      key={row}
                      aria-hidden={row >= s.rows || undefined}
                      className={
                        "symbol-cell " +
                        (winning ? "symbol-winning " : "") +
                        (symbol === s.scatter?.symbol &&
                        row < s.rows &&
                        !moving[col] &&
                        (bonus?.phase === "intro" || !!bonus?.added)
                          ? "scatter-charged"
                          : "")
                      }
                    >
                      <ReelSymbol spec={s} index={symbol} />
                      {symbol === s.scatter?.symbol &&
                        row < s.rows &&
                        !moving[col] &&
                        (bonus?.phase === "intro" || !!bonus?.added) && (
                          <span
                            className="scatter-cell-orbit"
                            aria-hidden="true"
                          >
                            <i />
                            <i />
                            <i />
                          </span>
                        )}
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
        {bonus?.phase === "intro" && (
          <ScatterCelebration
            onStart={() => {
              if (bonusStarted.current) return;
              bonusStarted.current = true;
              playBonus();
            }}
            onSkip={completeBonus}
          />
        )}
        {bonus?.phase === "playing" && bonus.added > 0 && (
          <CinematicEffects key={"retrigger-" + bonus.played} cue="retrigger" />
        )}
        {bonus?.phase === "playing" && bonus.added > 0 && (
          <div
            className="scatter-retrigger-ribbon"
            key={bonus.played}
            role="status"
          >
            <span aria-hidden="true">✦</span> +{bonus.added} FREE SPINS{" "}
            <span aria-hidden="true">✦</span>
          </div>
        )}
        {!bonusActive && returned > 0 && (
          <SlotWinCelebration
            key={round}
            returned={returned}
            stake={lastStake}
            scatter={wins.some((w) => w.scatter)}
            bonus={bonus?.phase === "complete"}
          />
        )}
      </div>
      <SlotConsole
        controls={{
          ...c,
          busy: c.busy || spinning || !!bonusActive || playback.mode !== "idle",
        }}
        returned={returned}
        running={
          spinning || bonus?.phase === "playing" || playback.mode !== "idle"
        }
        waiting={waitingStop}
        disabled={
          bonus?.phase === "intro" ||
          (!(
            spinning ||
            bonus?.phase === "playing" ||
            playback.mode !== "idle"
          ) &&
            (c.busy || c.canStart === false))
        }
        onPress={
          spinning || bonus?.phase === "playing" || playback.mode !== "idle"
            ? stopSpin
            : playback.manual
        }
      />
      <SlotPlaybackControls
        {...playback}
        busy={spinning || !!bonusActive || c.busy}
        canStart={c.canStart !== false && c.balance >= c.bet}
        stake={c.bet}
        preferences={sound.preferences}
        configure={sound.configure}
      />
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
              {credits(Math.floor((lastStake * w.rate) / 100))}
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
