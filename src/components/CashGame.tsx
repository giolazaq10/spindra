import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/Auth";
import { useWallet } from "@/context/Wallet";
import { cashApi } from "@/lib/walletApi";
import type { Original } from "@/lib/catalog";
import type { Card } from "@/lib/engine";
import type { SlotWin } from "@/lib/slotModels";
import type { Controls } from "./OriginalGame";
import AdvancedSlots from "./AdvancedSlots";
import MiniGames from "./MiniGames";
import type { MiniResult } from "@/lib/minigames";
import { miniRules } from "@/lib/minigames";
import PlayingCard from "./PlayingCard";
import BlackjackRules from "./BlackjackRules";
import SlotRules from "./SlotRules";

type BJHand = { id: string; seat: number; cards: Card[]; bet: number };
type Table = {
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
  }[];
  board?: Card[];
  street?: string;
  log?: string[];
};
type Result = {
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
  const [round, setRound] = useState<CashRound | null>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [busy, setBusy] = useState(false),
    [initialized, setInitialized] = useState(false),
    [message, setMessage] = useState("Server-authorized cash play. USD."),
    [bet, setBet] = useState(game.kind === "poker" ? 1000 : 100),
    [rules, setRules] = useState(false),
    [kind, setKind] = useState("red"),
    [straight, setStraight] = useState(0),
    [spots, setSpots] = useState(1),
    [side, setSide] = useState(0),
    [raise, setRaise] = useState(0);
  const alive = useRef(true),
    lock = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    alive.current = true;
    let active = true;
    (async () => {
      try {
        const status = await cashApi<{
          active: CashRound | null;
          reason: string | null;
        }>("status");
        if (!active) return;
        if (status.active) setRound(status.active);
        if (status.reason) setMessage(status.reason);
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const p = JSON.parse(saved) as Pending;
          const recovered = await cashApi<{ round: CashRound | null }>(
            "recover",
            { request_key: p.body.request_key },
          );
          if (!active) return;
          if (recovered.round) {
            setRound(recovered.round);
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
      clearTimeout(timer.current);
    };
  }, [storageKey]);
  function store(p: Pending | null) {
    if (p) sessionStorage.setItem(storageKey, JSON.stringify(p));
    else sessionStorage.removeItem(storageKey);
    setPending(p);
  }
  async function send(p: Pending) {
    if (lock.current) throw new Error("Request already in progress");
    lock.current = true;
    setBusy(true);
    store(p);
    try {
      const response = await cashApi<CashRound>(p.action, p.body);
      store(null);
      if (alive.current) {
        setRound(response);
        wallet.refresh();
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
        const cards =
          game.kind === "blackjack" ? 8 : game.kind === "poker" ? 6 : 1;
        timer.current = setTimeout(
          () => {
            if (alive.current) setBusy(false);
          },
          game.kind === "slots" ? 0 : cards * 450,
        );
      }
    }
  }
  async function start() {
    if (pending) throw new Error("Recover the pending request first");
    return send({
      action: "start",
      body: {
        request_key: crypto.randomUUID(),
        game: game.slug,
        input: {
          bet,
          kind,
          straight,
          bets: Array.from({ length: 5 }, (_, i) => ({
            main: i < spots ? bet : 0,
            three: i < spots ? side : 0,
            pair: i < spots ? side : 0,
          })),
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
      if (busy || pending) return false;
      setBusy(true);
      return true;
    },
    finish: () => {
      setBusy(false);
      wallet.refresh();
    },
    setMessage,
    balance: wallet.realBalance,
    busy,
    setLeaveReturn: () => {},
    stakes: [100, 200, 500, 1000, 2000],
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
  if (!initialized) return <p role="status">Loading saved cash round…</p>;
  return (
    <div className="cash-game">
      <p role="status">{message}</p>
      <p>
        Cash balance <strong>{money(wallet.realBalance)}</strong>
      </p>
      {pending && (
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
                input: { ...input, bet },
              },
            });
            return {
              ...r.view.result,
              returned_minor: r.view.returned_minor,
            } as unknown as MiniResult;
          }}
        />
      ) : game.kind === "slots" ? (
        <AdvancedSlots
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
          <div className="cash-table">
            <span className="eyebrow">SERVER DEALT · USD</span>
            {game.kind === "roulette" ? (
              <>
                <h2>European roulette</h2>
                <div
                  className={
                    "cash-pocket " + (busy ? "cash-pocket-moving" : "")
                  }
                >
                  {round?.view.result?.pocket ?? "—"}
                </div>
                <label>
                  Bet type
                  <select
                    disabled={busy}
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    {["red", "black", "even", "odd", "straight"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                {kind === "straight" && (
                  <label>
                    Pocket
                    <input
                      type="number"
                      min="0"
                      max="36"
                      value={straight}
                      onChange={(e) => setStraight(Number(e.target.value))}
                    />
                  </label>
                )}
              </>
            ) : game.kind === "blackjack" ? (
              <>
                <h2>Multihand blackjack</h2>
                {!active && (
                  <div className="cash-fields">
                    <label>
                      Hands
                      <select
                        value={spots}
                        onChange={(e) => setSpots(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Each side bet (21+3 and Perfect Pair)
                      <select
                        value={side}
                        onChange={(e) => setSide(Number(e.target.value))}
                      >
                        {[0, 100, 200, 500]
                          .filter((n) => n <= bet)
                          .map((n) => (
                            <option value={n} key={n}>
                              {money(n)}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                )}
                {table?.dealer && (
                  <>
                    <h3>Dealer</h3>
                    <div className="cash-cards">
                      {table.dealer.map((card, i) => (
                        <PlayingCard
                          key={i + ":" + (card?.rank ?? "hidden")}
                          card={card || undefined}
                          hidden={!card}
                          delay={i * 550}
                        />
                      ))}
                    </div>
                  </>
                )}
                {table?.hands?.map((h, i) => (
                  <article
                    key={h.id}
                    className={
                      "cash-hand " +
                      (table.active === i && active ? "cash-active" : "")
                    }
                  >
                    <h3>
                      Hand {h.seat + 1} · {money(h.bet)}
                    </h3>
                    <div className="cash-cards">
                      {h.cards.map((card, j) => (
                        <PlayingCard key={j} card={card} delay={j * 550} />
                      ))}
                    </div>
                  </article>
                ))}
                {active && table?.phase === "insurance" ? (
                  <>
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
                      disabled={busy || !!pending}
                      onClick={() =>
                        void takeAction("insurance", {
                          seats: [
                            ...new Set(table.hands?.map((h) => h.seat) || []),
                          ],
                        })
                      }
                    >
                      Insure all occupied hands
                    </button>
                  </>
                ) : (
                  active &&
                  ["hit", "stand", "double", "split", "surrender"].map((a) => (
                    <button
                      key={a}
                      className="button secondary"
                      disabled={busy || !!pending || !allowed[a]}
                      onClick={() => {
                        // eslint-disable-next-line react-hooks/refs -- This request ref is accessed only by the click handler, never during render.
                        void takeAction(a);
                      }}
                    >
                      {a}
                    </button>
                  ))
                )}
              </>
            ) : (
              <>
                <h2>Texas Hold’em</h2>
                <p>
                  Computer opponents use their own cards and public information.
                  No rake.
                </p>
                <div className="cash-cards">
                  {table?.board?.map((card, i) => (
                    <PlayingCard key={i} card={card} delay={i * 550} />
                  ))}
                </div>
                {table?.players?.map((p, i) => (
                  <article className="cash-hand" key={i}>
                    <h3>
                      {p.name} · {money(p.stack)} {p.folded ? "· Folded" : ""}
                    </h3>
                    <div className="cash-cards">
                      {p.hole.map((card, j) => (
                        <PlayingCard
                          key={j + ":" + (card?.rank ?? "hidden")}
                          card={card || undefined}
                          hidden={!card}
                          delay={j * 550}
                        />
                      ))}
                    </div>
                    <small>{p.action}</small>
                  </article>
                ))}
                {active && (
                  <>
                    <p>
                      {table?.street} · To call{" "}
                      {money(Number(allowed.toCall || 0))}
                    </p>
                    {["fold", "check", "call"].map((a) => (
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
                        {a}
                      </button>
                    ))}
                    <label>
                      Raise to (USD)
                      <input
                        type="number"
                        min={Number(allowed.minTo) / 100}
                        max={Number(allowed.maxTo) / 100}
                        step="0.01"
                        value={raise / 100}
                        onChange={(e) =>
                          setRaise(Math.round(Number(e.target.value) * 100))
                        }
                      />
                    </label>
                    <button
                      className="button secondary"
                      disabled={busy || !!pending || !allowed.canRaise}
                      onClick={() => void takeAction("raise", { to: raise })}
                    >
                      Raise
                    </button>
                  </>
                )}
                {table?.log?.slice(-4).map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </>
            )}
          </div>
          {!active && (
            <div className="cash-toolbar">
              <label>
                {game.kind === "poker"
                  ? "Hand buy-in (USD)"
                  : "Main stake (USD)"}
                <select
                  disabled={busy || !!pending}
                  value={bet}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setBet(next);
                    setSide((current) => Math.min(current, next));
                  }}
                >
                  {(game.kind === "poker"
                    ? [1000, 2000, 5000, 10000, 20000]
                    : [100, 200, 500, 1000, 2000]
                  ).map((n) => (
                    <option key={n} value={n}>
                      {money(n)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button primary"
                disabled={
                  busy ||
                  !!pending ||
                  (game.kind === "blackjack" &&
                    spots * (bet + 2 * side) > 20000)
                }
                onClick={() => void start().catch(() => {})}
              >
                {busy
                  ? "Dealing…"
                  : game.kind === "roulette"
                    ? "Spin wheel"
                    : "Deal cards"}
              </button>
              {game.kind === "blackjack" && (
                <p>
                  Total opening stake: {money(spots * (bet + 2 * side))}.
                  Maximum $200 per round, including later doubles, splits and
                  insurance.
                </p>
              )}
            </div>
          )}
          {active && (
            <button
              className="button secondary"
              disabled={busy || !!pending}
              onClick={() => void takeAction("abandon")}
            >
              {game.kind === "poker"
                ? "Leave hand: fold and return uncommitted chips"
                : "Finish hand: stand and let dealer complete"}
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
