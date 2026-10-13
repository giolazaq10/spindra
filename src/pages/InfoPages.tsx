import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Shield, Pause, Layers, ArrowRight } from "lucide-react";
import { credits, useDemo } from "@/context/Demo";
import { useAuth } from "@/context/Auth";
import { supabase } from "@/lib/supabase";
import { DemoHistory } from "./AccountPage";
export function ResponsiblePage() {
  const demo = useDemo(),
    { user } = useAuth();
  const [limit, setLimit] = useState(String(demo.limit / 100)),
    [confirm, setConfirm] = useState(false),
    [cashLimit, setCashLimit] = useState("100"),
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
  function save(event: FormEvent) {
    event.preventDefault();
    demo.setLimit(Math.round(Number(limit) * 100));
    setMessage("Demo session loss limit updated.");
  }
  return (
    <section className="page reading-page">
      <span className="eyebrow">YOUR PLAY, YOUR PACE</span>
      <h1>Keep it comfortable.</h1>
      <p className="lead">
        Games should be entertainment. Set a budget, take breaks, and never play
        to recover losses.
      </p>
      <div className="account-grid">
        <article className="panel">
          <Shield />
          <h2>Demo loss limit</h2>
          <p>
            Stops new stakes when your session’s net loss plus the next stake
            would exceed the limit. Cash limits are separate.
          </p>
          <p className="muted">
            Net loss: {credits(demo.loss)} / {credits(demo.limit)} credits
          </p>
          <form onSubmit={save}>
            <label>
              Limit in demo credits
              <input
                required
                type="number"
                min="1"
                max="1000000"
                step="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </label>
            <button className="button secondary" disabled={demo.blocked}>
              Save demo limit
            </button>
          </form>
        </article>
        <article className="panel">
          <Pause />
          <h2>Time away</h2>
          <p>
            Pause demo play for this browser session. Reloading starts a new
            demo session; this is separate from account self-exclusion.
          </p>
          {demo.blocked ? (
            <p className="success">Demo play is paused.</p>
          ) : (
            <>
              <label className="check">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                />
                <span>Pause all demo games for this session.</span>
              </label>
              <button
                className="button secondary"
                disabled={!confirm}
                onClick={demo.exclude}
              >
                Pause demo play
              </button>
            </>
          )}
        </article>
      </div>
      {user && (
        <article className="panel">
          <h2>Account protection</h2>
          <p>
            Account loss limits can only be lowered here. Account exclusion
            lasts at least 30 days, closes provider sessions and blocks further
            cash wagering.
          </p>
          <label>
            Cash daily loss limit (account currency)
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
            onClick={() => accountAction("limit")}
          >
            Lower cash limit
          </button>
          <details>
            <summary>Exclude my account for 30 days</summary>
            <p>This action cannot be reversed through the app.</p>
            <button
              className="button danger"
              disabled={busy}
              onClick={() => accountAction("exclude")}
            >
              Confirm 30-day account exclusion
            </button>
          </details>
        </article>
      )}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <article className="panel">
        <h2>A few good habits</h2>
        <ul>
          <li>Decide how much time and money you can afford before playing.</li>
          <li>
            A game’s theoretical RTP is a long-run average, not a promise of
            winnings.
          </li>
          <li>
            Keep gambling separate from bills, savings and borrowed money.
          </li>
          <li>
            If play stops feeling enjoyable, step away and seek support from a
            local gambling-support service.
          </li>
        </ul>
      </article>
      <DemoHistory />
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
      title: "Prelaunch terms",
      intro:
        "Spindra is currently a demonstration and platform preparation site.",
      sections: [
        [
          "Demo play",
          "Demo credits have no monetary value. They cannot be bought, sold, redeemed or withdrawn. Leaving an unfinished game forfeits its demo stake.",
        ],
        [
          "Accounts",
          "Account registration requires age and country information, acceptance of this notice, and email confirmation when configured. Do not share login details.",
        ],
        [
          "Cash operation",
          "No deposits, withdrawals or cash wagering are available. Operator identity, licensing, eligible countries, dispute procedures, full promotional terms and contractual rules must be published before money play is enabled.",
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
          "Supabase stores session credentials in browser storage for sign-in continuity. Demo credits and demo history exist only in application memory and reset when you reload.",
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
          "Why can’t I deposit?",
          "Cash services are disabled until the operator has connected and verified the required services.",
        ],
        [
          "How do I recover my account?",
          "Use the password recovery page. A configured Supabase project and email delivery service are required.",
        ],
        [
          "Why did my demo balance reset?",
          "Demo play is session-only. Reloading the website creates a new demo wallet.",
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
          "Sixteen original slot cabinets each publish distinct rules, paytables, reel layouts and artwork. Blackjack, Texas Hold’em and roulette round out the collection.",
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
          "Explore every original game with free demo credits. There are no deposits or wagering requirements in the preview.",
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
