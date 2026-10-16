import { useState } from "react";
import { Link } from "react-router-dom";
import { Layers, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/Auth";
import { supabase } from "@/lib/supabase";
export function ResponsiblePage() {
  const { user } = useAuth();
  const [cashLimit, setCashLimit] = useState("100"),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function accountAction(action: "limit" | "exclude") {
    if (!user) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc(
      action === "limit" ? "lower_loss_limit" : "self_exclude",
      action === "limit"
        ? { p_limit: Math.round(Number(cashLimit) * 100) }
        : {},
    );
    if (error) setError(error.message);
    else
      setMessage(
        action === "limit"
          ? "Cash loss limit lowered."
          : "Account excluded for at least 30 days. This cannot be undone in the app.",
      );
    setBusy(false);
  }
  return (
    <section className="page reading-page">
      <span className="eyebrow">YOUR PLAY, YOUR PACE</span>
      <h1>Keep it comfortable.</h1>
      <p className="lead">
        Set a budget, take breaks, and never play to recover losses.
      </p>
      {user ? (
        <article className="panel">
          <h2>Account protection</h2>
          <p>
            Daily cash loss limits can only be lowered here. Exclusion lasts at
            least 30 days and blocks new wagers on every game. Existing rounds
            can still settle.
          </p>
          <label>
            Daily loss limit (USD)
            <input
              type="number"
              min="1"
              step="1"
              value={cashLimit}
              onChange={(e) => setCashLimit(e.target.value)}
            />
          </label>
          <button
            className="button secondary"
            disabled={
              busy ||
              !Number.isFinite(Number(cashLimit)) ||
              Number(cashLimit) < 1
            }
            onClick={() => void accountAction("limit")}
          >
            Lower cash limit
          </button>
          <details>
            <summary>Exclude my account for 30 days</summary>
            <p>This action cannot be reversed through the app.</p>
            <button
              className="button danger"
              disabled={busy}
              onClick={() => void accountAction("exclude")}
            >
              Confirm 30-day account exclusion
            </button>
          </details>
        </article>
      ) : (
        <Link className="button primary" to="/sign-in">
          Sign in to manage account limits
        </Link>
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      <article className="panel">
        <h2>A few good habits</h2>
        <ul>
          <li>Decide how much time and money you can afford before playing.</li>
          <li>
            Theoretical RTP is a long-run average, not a promise of winnings.
          </li>
          <li>
            Keep gambling separate from bills, savings and borrowed money.
          </li>
          <li>
            If play stops feeling enjoyable, step away and seek local
            gambling-support services.
          </li>
        </ul>
      </article>
    </section>
  );
}
export function ProvidersPage() {
  return (
    <section className="page reading-page">
      <span className="eyebrow">THE NEXT CHAPTER</span>
      <h1>A home for great games.</h1>
      <p className="lead">
        Spindra originals are available to explore now. External provider games
        will appear here when an integration is verified and enabled.
      </p>
      <div className="panel provider-empty">
        <Layers size={40} />
        <h2>Provider collection coming soon.</h2>
        <p>
          No external providers are connected. Live dealer and multiplayer games
          are not currently available.
        </p>
        <Link className="button primary" to="/games">
          Explore Spindra originals <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
export function InfoPage({
  kind,
}: {
  kind: "terms" | "privacy" | "support" | "about" | "promotions";
}) {
  const content = {
    terms: {
      title: "Terms of service",
      intro:
        "Spindra provides original games and crypto deposits for real-money play.",
      sections: [
        [
          "Real-balance play",
          "Games use your real USD wallet. Stakes are reserved and returns are settled by the server. Returns include stake. Unfinished hands follow the published timeout and settlement rules.",
        ],
        [
          "Accounts",
          "Account registration requires age and country information, acceptance of this notice, and email confirmation when configured. Do not share login details.",
        ],
        [
          "Cash operation",
          "Crypto deposits are processed through NowPayments. Deposits are credited after network confirmations. Withdrawals follow the published procedure.",
        ],
        [
          "Age and eligibility",
          "Registration is for adults aged 18 or older. Country-specific minimum ages and eligibility must be verified before cash operation.",
        ],
      ],
    },
    privacy: {
      title: "Your privacy",
      intro:
        "This is the prelaunch privacy notice. A final notice identifying the data controller and applicable rights is required before launch.",
      sections: [
        [
          "Account information",
          "When configured, Supabase Auth handles email and password authentication. Spindra stores display name, date of birth, country, consent metadata and account protection settings. Passwords are never stored in the Spindra database or browser application.",
        ],
        [
          "Browser storage",
          "Supabase stores session credentials in browser storage for sign-in continuity. Cash balances and round history are stored on the server and persist when you reload. Pending request IDs are stored in session storage for recovery.",
        ],
        [
          "Identity documents",
          "This version does not request or upload identity documents. Identity verification will require a separately configured provider and published privacy disclosures.",
        ],
        [
          "Contact and rights",
          "The operator must publish a verified privacy contact, data retention periods and applicable rights before accepting live customers.",
        ],
      ],
    },
    support: {
      title: "A little help.",
      intro: "Answers for the current Spindra preview.",
      sections: [
        [
          "How do I deposit?",
          "Crypto deposits are available through the Deposit button in the header or account page. Choose from BTC, ETH, USDT, or USDC.",
        ],
        [
          "How do I recover my account?",
          "Use the password recovery page. A configured Supabase project and email delivery service are required.",
        ],
        [
          "Why has my balance changed?",
          "Your USD wallet reflects deposits, withdrawals, game stakes and settled returns. View cash transactions and game history on your account page.",
        ],
        [
          "How can I contact support?",
          "A verified operator support contact has not yet been published. Do not send funds or identity documents through unofficial channels.",
        ],
      ],
    },
    about: {
      title: "Entirely Spindra.",
      intro:
        "A collection of original game worlds and classic tables, designed for thoughtful play.",
      sections: [
        [
          "The originals",
          "Twenty-five original slot cabinets each publish distinct rules, paytables, reel layouts and artwork. Blackjack, Texas Hold’em and roulette round out the collection.",
        ],
        [
          "A platform in preparation",
          "Accounts use Supabase. Provider, payment and verification services remain gated until integrated and verified. No licensing or certification claims are made by this preview.",
        ],
      ],
    },
    promotions: {
      title: "Good things take time.",
      intro: "No cash promotions are active during platform preparation.",
      sections: [
        [
          "Try the originals",
          "Sign in and fund your real USD wallet to play eligible original games. Account verification, location and play limits apply.",
        ],
        [
          "Future offers",
          "Any live offer will require published eligibility, expiry, wagering terms and withdrawal conditions before activation.",
        ],
      ],
    },
  }[kind];
  return (
    <section className="page reading-page">
      <span className="eyebrow">SPINDRA / {kind.toUpperCase()}</span>
      <h1>{content.title}</h1>
      <p className="lead">{content.intro}</p>
      {content.sections.map(([title, text]) => (
        <article className="panel" key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
        </article>
      ))}
      {kind === "support" && (
        <Link className="button primary" to="/forgot-password">
          Reset password <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}
