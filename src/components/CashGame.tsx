import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/Auth";
import { useWallet } from "@/context/Wallet";
import { cashApi } from "@/lib/walletApi";
import type { Original } from "@/lib/catalog";
import type { Card } from "@/lib/engine";
import { redNumbers } from "@/lib/engine";
import CashPokerSeat from "./CashPokerSeat";
import RouletteBets from "./RouletteBets";
import { pokerMotion } from "./pokerMotion";
import type { SlotWin } from "@/lib/slotModels";
import type { Controls } from "./OriginalGame";
import AdvancedSlots from "./AdvancedSlots";
import PremiumSlots from "./PremiumSlots";
import type { PremiumFrame } from "@/lib/premiumSlots";
import MiniGames from "./MiniGames";
import type { MiniResult } from "@/lib/minigames";
import { miniRules } from "@/lib/minigames";
import PlayingCard from "./PlayingCard";
import BlackjackScore from "./BlackjackScore";
import BlackjackBetting from "./BlackjackBetting";
import type { SeatBet, SideResult } from "@/lib/blackjack";
import BlackjackRules from "./BlackjackRules";
import BlackjackResults from "./BlackjackResults";
import { blackjackMotion } from "./blackjackMotion";
import SlotRules from "./SlotRules";

type BJHand = {
  id: string;
  seat: number;
  cards: Card[];
  bet: number;
  split?: boolean;
  surrendered?: boolean;
};
type Table = {
  bets?: SeatBet[];
  sideResults?: { three: SideResult; pair: SideResult }[];
  insurance?: number[];
  phase?: string;
  dealer?: (Card | null)[];
  hands?: BJHand[];
  active?: number;
  players?: {
    name: string;
    hole: (Card | null)[];
    stack: number;
    action: string;
    folded: boolean;
    contributed?: number;
    streetBet?: number;
  }[];
  board?: Card[];
  street?: string;
  log?: string[];
};
type Result = {
  frames?: PremiumFrame[];
  grid: number[][];
  wins: SlotWin[];
  rate: number;
  pocket?: number;
};
export type CashRound = {
  id: string;
  revision: number;
  game: string;
  state: string;
  balance_minor: number;
  view: {
    kind: string;
    stake_minor: number;
    returned_minor: number;
    phase: string;
    result?: Result;
    table?: Table;
    allowed?: Record<string, number | boolean>;
  };
};
type Pending = { action: string; body: Record<string, unknown> };
const money = (n: number) => "$" + (n / 100).toFixed(2);
export default function CashGame({ game }: { game: Original }) {
  const { user } = useAuth(),
    wallet = useWallet();
  const storageKey = "spindra-cash-pending:" + user?.id;
  const { acceptServerBalance } = wallet;
  const [round, setRound] = useState<CashRound | null>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [uncertain, setUncertain] = useState(false),
    [busy, setBusy] = useState(false),
    [initialized, setInitialized] = useState(false),
    [eligible, setEligible] = useState(false),
    [message, setMessage] = useState("Server-authorized cash play. USD."),
    [bet, setBet] = useState(game.kind === "poker" ? 1000 : 20),
    [rules, setRules] = useState(false),
    [kind, setKind] = useState("red"),
    [straight, setStraight] = useState(0),
    [blackjackBets, setBlackjackBets] = useState<SeatBet[]>(() =>
      Array.from({ length: 5 }, (_, i) => ({
        main: i === 0 ? 20 : 0,
        three: 0,
        pair: 0,
      })),
    ),
    [previousBlackjackBets, setPreviousBlackjackBets] = useState<
      SeatBet[] | null
    >(null),
    [raise, setRaise] = useState(0);
  const dealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const alive = useRef(true),
    lock = useRef(false);
  useEffect(() => {
    alive.current = true;
    let active = true;
    (async () => {
      try {
        const status = await cashApi<{
          active: CashRound | null;
          reason: string | null;
          enabled: boolean;
          balance_minor: number;
        }>("status");
        if (!active) return;
        setEligible(status.enabled === true);
        acceptServerBalance(status.balance_minor);
        if (status.active) setRound(status.active);
        if (status.reason) setMessage(status.reason);
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const p = JSON.parse(saved) as Pending;
          setPending(p);
          setUncertain(true);
          const recovered = await cashApi<{ round: CashRound | null }>(
            "recover",
            { request_key: p.body.request_key },
          );
          if (!active) return;
          if (recovered.round) {
            setRound(recovered.round);
            setPending(null);
            setUncertain(false);
            sessionStorage.removeItem(storageKey);
          } else setPending(p);
        }
      } catch (e) {
        if (active)
          setMessage(e instanceof Error ? e.message : "Cash game unavailable");
      } finally {
        if (active) setInitialized(true);
      }
    })();
    return () => {
      active = false;
      alive.current = false;
      dealTimers.current.forEach(clearTimeout);
    };
  }, [storageKey, acceptServerBalance]);
  function store(p: Pending | null) {
    if (p) sessionStorage.setItem(storageKey, JSON.stringify(p));
    else sessionStorage.removeItem(storageKey);
    setPending(p);
    if (!p) setUncertain(false);
  }
  async function send(p: Pending) {
    if (lock.current) throw new Error("Request already in progress");
    lock.current = true;
    setBusy(true);
    setUncertain(false);
    store(p);
    let presenting = false;
    try {
      const response = await cashApi<CashRound>(p.action, p.body);
      store(null);
      if (alive.current) {
        if (game.kind === "blackjack" || game.kind === "poker") {
          const frames =
            game.kind === "blackjack"
              ? blackjackMotion(round, response)
              : pokerMotion(round, response);
          dealTimers.current.forEach(clearTimeout);
          dealTimers.current = [];
          if (frames.length > 1) {
            presenting = true;
            setRound(frames[0].round);
            frames.slice(1).forEach((frame, i) =>
              dealTimers.current.push(
                setTimeout(() => {
                  if (!alive.current) return;
                  setRound(frame.round);
                  if (i === frames.length - 2) setBusy(false);
                }, frame.at),
              ),
            );
          } else setRound(response);
        } else setRound(response);
        acceptServerBalance(response.balance_minor);
        setMessage(
          response.state === "settled"
            ? `Round settled. Stake ${money(response.view.stake_minor)}; returned ${money(response.view.returned_minor)} (includes stake).`
            : "Round is open. Complete your next action.",
        );
      }
      return response;
    } catch (e) {
      const text =
        e instanceof Error ? e.message : "Request could not be confirmed";
      const definitive =
        /Insufficient cash balance|Daily loss limit exceeded|Cash wagering is not enabled|Verified adult account required|Cash play is unavailable|Account is self-excluded|Stake must|Invalid blackjack bets|Action unavailable/.test(
          text,
        );
      if (definitive) store(null);
      else if (alive.current) setUncertain(true);
      if (alive.current)
        setMessage(
          text +
            (definitive
              ? ""
              : ". Recover or retry this request before starting another."),
        );
      throw e;
    } finally {
      lock.current = false;
      if (alive.current) {
        if (!presenting) setBusy(false);
      }
    }
  }
  async function start() {
    if (pending) throw new Error("Recover the pending request first");
    if (game.kind === "blackjack")
      setPreviousBlackjackBets(blackjackBets.map((b) => ({ ...b })));
    return send({
      action: "start",
      body: {
        request_key: crypto.randomUUID(),
        game: game.slug,
        input: {
          bet,
          kind,
          straight,
          bets: blackjackBets.map((b) => ({ ...b })),
        },
      },
    });
  }
  async function takeAction(
    action: string,
    extra: Record<string, unknown> = {},
  ) {
    if (!round || round.state !== "open" || pending) return;
    try {
      await send({
        action: "act",
        body: {
          request_key: crypto.randomUUID(),
          round_id: round.id,
          revision: round.revision,
          command: { action, ...extra },
        },
      });
    } catch {
      /* Persistent pending request supplies recovery. */
    }
  }
  async function recover() {
    if (!pending) return;
    setBusy(true);
    try {
      const r = await cashApi<{ round: CashRound | null }>("recover", {
        request_key: pending.body.request_key,
      });
      if (r.round) {
        setRound(r.round);
        store(null);
        acceptServerBalance(r.round.balance_minor);
        wallet.refresh();
        setMessage("Confirmed saved round recovered.");
      } else
        setMessage(
          "No committed result found. Retry the same request; it cannot debit twice.",
        );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Recovery failed");
    } finally {
      setBusy(false);
    }
  }
  const c: Controls = {
    bet,
    setBet,
    start: () => {
      if (busy || pending || !eligible || wallet.realBalance < bet)
        return false;
      setBusy(true);
      return true;
    },
    finish: () => {
      setBusy(false);
    },
    setMessage,
    balance: wallet.realBalance,
    busy: busy || !!pending,
    canStart: eligible && wallet.realBalance >= bet && !(pending && uncertain),
    setLeaveReturn: () => {},
    stakes: [20, 50, 100, 200, 500, 1000, 2000],
    message,
    rules,
    toggleRules: () => setRules((v) => !v),
    poker: false,
    modeLabel: "CASH USD",
  };
  const active = round?.state === "open",
    same = round?.game === game.slug,
    table = round?.view.table,
    allowed = round?.view.allowed || {};
  const blackjackStake = blackjackBets.reduce(
    (sum, b) => sum + b.main + b.three + b.pair,
    0,
  );
  const insuranceTotal =
    table?.bets?.reduce((sum, b) => sum + b.main / 2, 0) || 0;
  const actionStake = table?.hands?.[table.active ?? 0]?.bet || 0;
  const pokerPlayers =
    table?.players ||
    ["You", "Computer 1", "Computer 2"].map((name) => ({
      name,
      hole: [] as (Card | null)[],
      stack: 0,
      streetBet: 0,
      folded: false,
      action: "Ready to deal",
    }));
  const raiseMax = Number(allowed.maxTo) || 0;
  const raiseMin = Math.min(Number(allowed.minTo) || 0, raiseMax);
  const raiseTo = Math.max(raiseMin, Math.min(raise, raiseMax));
  const potSize =
    table?.players?.reduce((sum, p) => sum + (p.contributed || 0), 0) || 0;
  const callSize = Number(allowed.toCall) || 0;
  const currentStreetBet = table?.players?.[0]?.streetBet || 0;
  const dealButton = (
    <button
      className="button primary"
      disabled={
        busy ||
        !!pending ||
        !eligible ||
        wallet.realBalance <
          (game.kind === "blackjack" ? blackjackStake : bet) ||
        (game.kind === "blackjack" &&
          (blackjackStake === 0 || blackjackStake > 20000))
      }
      onClick={() => void start().catch(() => {})}
    >
      {busy
        ? game.kind === "roulette"
          ? "Spinning…"
          : "Dealing…"
        : game.kind === "roulette"
          ? "Spin wheel"
          : "Deal cards"}
    </button>
  );
  const SlotCabinet = game.slot?.premium ? PremiumSlots : AdvancedSlots;
  if (!initialized) return <p role="status">Loading saved cash round…</p>;
  if (!eligible && !active && !pending)
    return (
      <div className="panel">
        <h2>Cash play unavailable</h2>
        <p role="status">{message}</p>
        <Link className="button secondary" to="/account">
          View account status
        </Link>
      </div>
    );
  return (
    <div className="cash-game">
      {wallet.realBalance < bet && !active && !pending && (
        <p className="notice">
          Your balance is below this stake.{" "}
          <Link to="/account">Deposit or manage your wallet</Link>.
        </p>
      )}
      <p
        className={
          game.kind === "blackjack" &&
          /^(Server-authorized|Round settled|Round is open)/.test(message)
            ? "sr-only"
            : ""
        }
        role="status"
      >
        {message}
      </p>
      <p>
        Cash balance <strong>{money(wallet.realBalance)}</strong>
      </p>
      {pending && uncertain && (
        <div className="cash-recovery">
          <p>
            An unconfirmed request is saved. Its request ID prevents duplicate
            bets.
          </p>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => void recover()}
          >
            Recover result
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => void send(pending).catch(() => {})}
          >
            Retry same request
          </button>
        </div>
      )}
      {active && !same ? (
        <p>
          Finish your open round in{" "}
          <a href={"/game/" + round.game}>{round.game}</a>.
        </p>
      ) : game.mini ? (
        <MiniGames
          type={game.mini}
          controls={c}
          serverPlay={async (input) => {
            const r = await send({
              action: "start",
              body: {
                request_key: crypto.randomUUID(),
                game: game.slug,
                input: { ...input, bet: input.bet ?? bet },
              },
            });
            return {
              ...r.view.result,
              returned_minor: r.view.returned_minor,
              balance_minor: r.balance_minor,
            } as unknown as MiniResult;
          }}
        />
      ) : game.kind === "slots" ? (
        <SlotCabinet
          game={game}
          controls={c}
          initialResult={
            round?.view.result?.grid
              ? {
                  ...round.view.result,
                  returned_minor: round.view.returned_minor,
                }
              : undefined
          }
          serverSpin={async () => {
            const r = await start();
            return { ...r.view.result!, returned_minor: r.view.returned_minor };
          }}
        />
      ) : (
        <>
          <div className={"cash-table cash-" + game.kind}>
            <span className="eyebrow">SERVER DEALT · USD</span>
            {game.kind === "roulette" ? (
              <>
                <h2>European roulette</h2>
                <section
                  className="roulette-result"
                  aria-label="Roulette result"
                >
                  <span className="table-caption">
                    {busy ? "Wheel spinning…" : "Winning number"}
                  </span>
                  <div
                    className={
                      "cash-pocket pocket-" +
                      (round?.view.result?.pocket === undefined
                        ? "empty"
                        : round.view.result.pocket === 0
                          ? "green"
                          : redNumbers.includes(round.view.result.pocket)
                            ? "red"
                            : "black")
                    }
                  >
                    {busy ? "…" : (round?.view.result?.pocket ?? "—")}
                  </div>
                  <b>
                    {busy
                      ? "Waiting for result"
                      : round?.view.result?.pocket === undefined
                        ? "Place your first bet"
                        : round.view.result.pocket === 0
                          ? "Green · Zero"
                          : (redNumbers.includes(round.view.result.pocket)
                              ? "Red"
                              : "Black") +
                            " · " +
                            (round.view.result.pocket % 2 ? "Odd" : "Even")}
                  </b>
                </section>
                <div
                  className="table-metrics"
                  aria-label="Selected roulette bet"
                >
                  <div>
                    <span>Your selection</span>
                    <strong>
                      {kind === "straight"
                        ? "Number " + straight
                        : kind[0].toUpperCase() + kind.slice(1)}
                    </strong>
                  </div>
                  <div>
                    <span>Stake</span>
                    <strong>{money(bet)}</strong>
                  </div>
                  <div>
                    <span>Win pays</span>
                    <strong>{kind === "straight" ? "35:1" : "1:1"}</strong>
                  </div>
                </div>
                <RouletteBets
                  kind={kind}
                  number={straight}
                  disabled={busy || !!pending}
                  onSelect={(next, n) => {
                    setKind(next);
                    if (n !== undefined) setStraight(n);
                  }}
                />
              </>
            ) : game.kind === "blackjack" ? (
              <>
                <h2>Multihand blackjack</h2>
                <p className="blackjack-table-rules">
                  Blackjack 3:2 · Dealer hits soft 17 · Insurance 2:1
                </p>
                <section className="blackjack-dealer" aria-label="Dealer hand">
                  <BlackjackScore label="Dealer" cards={table?.dealer || []} />
                  <div className="cash-cards">
                    {table?.dealer?.map((card, i) => (
                      <PlayingCard
                        key={i + ":" + (card?.rank ?? "hidden")}
                        card={card || undefined}
                        hidden={!card}
                        delay={0}
                      />
                    ))}
                  </div>
                </section>
                <BlackjackBetting
                  bets={active ? table?.bets || blackjackBets : blackjackBets}
                  previous={previousBlackjackBets}
                  onChange={setBlackjackBets}
                  balance={wallet.realBalance}
                  disabled={busy || !!pending || active}
                  activeSeat={
                    active ? table?.hands?.[table.active ?? 0]?.seat : undefined
                  }
                  renderHand={(seat) => (
                    <div className="blackjack-seat-cards">
                      {table?.hands
                        ?.filter((h) => h.seat === seat)
                        .map((h) => (
                          <article
                            key={h.id}
                            className={
                              "cash-hand " +
                              (table.hands?.[table.active ?? 0]?.id === h.id &&
                              active
                                ? "cash-active"
                                : "")
                            }
                          >
                            <h3>
                              Your hand {h.seat + 1}
                              {h.split
                                ? " · Split " +
                                  (table
                                    .hands!.filter(
                                      (other) => other.seat === h.seat,
                                    )
                                    .indexOf(h) +
                                    1)
                                : ""}{" "}
                              · Bet {money(h.bet)}
                            </h3>
                            <BlackjackScore
                              label={
                                "Your hand " +
                                (h.seat + 1) +
                                (h.split
                                  ? " · Split " +
                                    (table
                                      .hands!.filter(
                                        (other) => other.seat === h.seat,
                                      )
                                      .indexOf(h) +
                                      1)
                                  : "")
                              }
                              cards={h.cards}
                              split={h.split}
                              surrendered={h.surrendered}
                              active={
                                table.hands?.[table.active ?? 0]?.id === h.id &&
                                active &&
                                table.phase === "playing"
                              }
                            />
                            <div className="cash-cards">
                              {h.cards.map((card, j) => (
                                <PlayingCard key={j} card={card} delay={0} />
                              ))}
                            </div>
                          </article>
                        ))}
                    </div>
                  )}
                />
                <div className="blackjack-action-bar">
                  {!active && dealButton}
                  {table?.sideResults &&
                    table.bets?.some((b) => b.three || b.pair) && (
                      <details
                        className="blackjack-side-results"
                        aria-label="Side bet results"
                      >
                        <summary>Side bet results</summary>
                        {table.sideResults.map((result, seat) => (
                          <div key={seat}>
                            {(["three", "pair"] as const)
                              .filter(
                                (kind) => (table.bets?.[seat]?.[kind] || 0) > 0,
                              )
                              .map((kind) => (
                                <p key={kind}>
                                  <b>
                                    Hand {seat + 1} ·{" "}
                                    {kind === "three" ? "21+3" : "Perfect Pair"}
                                  </b>
                                  <span>
                                    {result[kind].name} ·{" "}
                                    {result[kind].returned
                                      ? "Return " + money(result[kind].returned)
                                      : "No win"}
                                    {active && result[kind].returned > 0
                                      ? " · paid at round end"
                                      : ""}
                                  </span>
                                </p>
                              ))}
                          </div>
                        ))}
                      </details>
                    )}
                  {active && table?.phase === "insurance" ? (
                    <>
                      <p className="table-help">
                        Insurance costs half the selected main bet and pays 2:1
                        if the dealer has blackjack. Choose a hand, insure all,
                        or decline.
                      </p>
                      {table.bets?.map(
                        (b, seat) =>
                          b.main > 0 && (
                            <button
                              key={seat}
                              className="button secondary"
                              disabled={
                                busy ||
                                !!pending ||
                                wallet.realBalance < b.main / 2 ||
                                (round?.view.stake_minor || 0) + b.main / 2 >
                                  20000
                              }
                              onClick={() =>
                                void takeAction("insurance", { seats: [seat] })
                              }
                            >
                              Insure hand {seat + 1} · {money(b.main / 2)}
                            </button>
                          ),
                      )}
                      <button
                        className="button secondary"
                        disabled={busy || !!pending}
                        onClick={() =>
                          void takeAction("insurance", { seats: [] })
                        }
                      >
                        Decline insurance
                      </button>
                      <button
                        className="button secondary"
                        disabled={
                          busy ||
                          !!pending ||
                          wallet.realBalance < insuranceTotal ||
                          (round?.view.stake_minor || 0) + insuranceTotal >
                            20000
                        }
                        onClick={() =>
                          void takeAction("insurance", {
                            seats: [
                              ...new Set(table.hands?.map((h) => h.seat) || []),
                            ],
                          })
                        }
                      >
                        Insure all · {money(insuranceTotal)}
                      </button>
                    </>
                  ) : (
                    active &&
                    ["hit", "stand", "double", "split", "surrender"].map(
                      (a) => (
                        <button
                          key={a}
                          className="button secondary"
                          disabled={
                            busy ||
                            !!pending ||
                            !allowed[a] ||
                            ((a === "double" || a === "split") &&
                              (wallet.realBalance < actionStake ||
                                (round?.view.stake_minor || 0) + actionStake >
                                  20000))
                          }
                          onClick={() => {
                            // eslint-disable-next-line react-hooks/refs -- This request ref is accessed only by the click handler, never during render.
                            void takeAction(a);
                          }}
                        >
                          {a === "double"
                            ? "Double +" +
                              money(table?.hands?.[table.active ?? 0]?.bet || 0)
                            : a === "split"
                              ? "Split +" +
                                money(
                                  table?.hands?.[table.active ?? 0]?.bet || 0,
                                )
                              : a === "surrender"
                                ? "Surrender"
                                : a === "hit"
                                  ? "Hit"
                                  : "Stand"}
                        </button>
                      ),
                    )
                  )}
                </div>
              </>
            ) : (
              <>
                <h2>Texas Hold’em</h2>

                <div className="table-metrics" aria-label="Poker table totals">
                  <div>
                    <span>Stage</span>
                    <strong>
                      {table?.street === "done"
                        ? "Hand complete"
                        : table?.street || "Ready to deal"}
                    </strong>
                  </div>
                  <div>
                    <span>{active ? "Pot" : "Final pot"}</span>
                    <strong>
                      {money(
                        table?.players?.reduce(
                          (sum, p) => sum + (p.contributed || 0),
                          0,
                        ) || 0,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Your chips</span>
                    <strong>{money(table?.players?.[0]?.stack ?? bet)}</strong>
                  </div>
                </div>
                <div className="poker-opponents">
                  {pokerPlayers.slice(1).map((p, i) => (
                    <CashPokerSeat
                      key={i}
                      player={p}
                      board={table?.board || []}
                    />
                  ))}
                </div>
                <section
                  className="poker-community"
                  aria-label="Community cards"
                >
                  <h3>Community cards · Shared by all players</h3>
                  <div className="cash-cards">
                    {Array.from({ length: 5 }, (_, i) =>
                      table?.board?.[i] ? (
                        <PlayingCard key={i} card={table.board[i]} delay={0} />
                      ) : (
                        <div key={i} className="community-placeholder">
                          <span>
                            {i < 3 ? "Flop" : i === 3 ? "Turn" : "River"}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </section>
                <CashPokerSeat
                  player={pokerPlayers[0]}
                  board={table?.board || []}
                  self
                />
                {active && (
                  <div className="poker-controls">
                    <div className="poker-turn-banner" role="status">
                      <b>{busy ? "Dealing…" : "Your turn"}</b>
                      <span>
                        To call{" "}
                        <strong>
                          {money(
                            Math.min(
                              Number(allowed.toCall || 0),
                              table?.players?.[0]?.stack || 0,
                            ),
                          )}
                        </strong>
                      </span>
                    </div>
                    {[
                      "fold",
                      Number(allowed.toCall) > 0 ? "call" : "check",
                    ].map((a) => (
                      <button
                        key={a}
                        className="button secondary"
                        disabled={
                          busy ||
                          !!pending ||
                          (a === "check" && Number(allowed.toCall) > 0)
                        }
                        onClick={() => {
                          void takeAction(a);
                        }}
                      >
                        {a === "call"
                          ? "Call " +
                            money(
                              Math.min(
                                Number(allowed.toCall || 0),
                                table?.players?.[0]?.stack || 0,
                              ),
                            )
                          : a[0].toUpperCase() + a.slice(1)}
                      </button>
                    ))}
                    <div className="poker-raise-controls">
                      <label>
                        Raise to {money(raiseTo)}
                        <input
                          type="range"
                          aria-label="Raise amount"
                          disabled={busy || !!pending || !allowed.canRaise}
                          min={raiseMin}
                          max={raiseMax}
                          step={1}
                          value={raiseTo}
                          onChange={(e) => setRaise(Number(e.target.value))}
                        />
                      </label>
                      <div className="poker-raise-presets">
                        {[
                          ["Min", raiseMin],
                          [
                            "Half pot",
                            currentStreetBet +
                              callSize +
                              Math.floor((potSize + callSize) / 2),
                          ],
                          [
                            "Pot",
                            currentStreetBet + callSize + potSize + callSize,
                          ],
                          ["All-in", raiseMax],
                        ].map(([label, value]) => (
                          <button
                            key={String(label)}
                            disabled={busy || !!pending || !allowed.canRaise}
                            onClick={() =>
                              setRaise(
                                Math.max(
                                  raiseMin,
                                  Math.min(Number(value), raiseMax),
                                ),
                              )
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <button
                        className="button secondary"
                        disabled={
                          busy || !!pending || !allowed.canRaise || raiseTo <= 0
                        }
                        onClick={() =>
                          void takeAction("raise", { to: raiseTo })
                        }
                      >
                        Raise {money(raiseTo)}
                      </button>
                    </div>
                  </div>
                )}
                {table?.log && (
                  <details
                    className="poker-action-log"
                    aria-label="Recent table actions"
                  >
                    <summary>Recent actions</summary>
                    {table.log.slice(-4).map((l, i) => (
                      <p key={i}>{l}</p>
                    ))}
                  </details>
                )}
              </>
            )}
            {!active && game.kind !== "blackjack" && (
              <div className="cash-toolbar">
                <div
                  className="table-stake-chips"
                  aria-label={game.kind === "poker" ? "Hand buy-in" : "Stake"}
                >
                  {(game.kind === "poker"
                    ? [20, 100, 200, 1000, 2000, 5000, 10000, 20000]
                    : [20, 50, 100, 200, 500, 1000, 2000]
                  ).map((n) => (
                    <button
                      key={n}
                      disabled={busy || !!pending}
                      aria-pressed={bet === n}
                      onClick={() => setBet(n)}
                    >
                      {money(n)}
                    </button>
                  ))}
                </div>
                {dealButton}
              </div>
            )}
            {round?.state === "settled" && !busy && (
              <BlackjackResults
                compact
                key={round.id + ":" + round.revision}
                round={{
                  totalStake: round.view.stake_minor,
                  returned: round.view.returned_minor,
                }}
              />
            )}
          </div>
          {active && (
            <button
              className="button secondary"
              disabled={busy || !!pending}
              aria-label={
                game.kind === "poker"
                  ? "Leave hand: fold and return uncommitted chips"
                  : "End round: stand all hands and complete dealer"
              }
              onClick={() => void takeAction("abandon")}
            >
              {game.kind === "poker" ? "Fold & leave" : "End round · stand all"}
            </button>
          )}
        </>
      )}
      <button className="button secondary" onClick={() => setRules((v) => !v)}>
        Cash rules
      </button>
      {rules && (
        <div className="panel">
          <p>
            All outcomes and cash movements are determined by the server.
            Returns include stake. Unconfirmed requests retain the same ID on
            retry. Open hands resume after refresh; after 15 minutes blackjack
            stands and completes, while poker folds and returns uncommitted
            chips. Daily account loss limits apply to all cash games.
          </p>
          {game.mini ? (
            <p>{miniRules(game.mini)}</p>
          ) : game.kind === "slots" ? (
            <SlotRules game={game} />
          ) : game.kind === "blackjack" ? (
            <BlackjackRules />
          ) : (
            <p>
              {game.kind === "poker"
                ? "Standard no-limit Texas Hold’em against two computer opponents; blinds are 1/20 and 1/10 of buy-in. Best five of seven, standard hand rankings, side pots and split pots."
                : "European single-zero roulette. Outside bets return 2× stake; straight bets return 36× stake. Zero loses outside bets."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
