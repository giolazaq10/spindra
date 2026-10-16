import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { type Original, rtpLabel } from "@/lib/catalog";
import { useAuth } from "@/context/Auth";
import CashGame from "./CashGame";
export type Controls = {
  canStart?: boolean;
  bet: number;
  start: (extra?: number) => boolean;
  finish: (returned: number) => void;
  setMessage: (message: string) => void;
  balance: number;
  busy: boolean;
  setBet: (bet: number) => void;
  stakes: number[];
  message: string;
  rules: boolean;
  toggleRules: () => void;
  poker: boolean;
  setLeaveReturn: (returned: number) => void;
  modeLabel: string;
};

export default function OriginalGame({ game }: { game: Original }) {
  const { user, loading } = useAuth();
  return (
    <section className="page game-page">
      <Link className="text-link" to="/games">
        <ArrowLeft size={16} /> Back to casino
      </Link>
      <div className="section-heading">
        <div>
          <span className="eyebrow">SPINDRA ORIGINAL</span>
          <h1>{game.name}</h1>
          <p className="muted">{game.tagline}</p>
        </div>
      </div>
      <div
        className={"game-surface " + game.animation}
        style={
          { "--theme": game.color, "--accent": game.accent } as CSSProperties
        }
      >
        <div className="game-top">
          <span className="pill">REAL BALANCE · USD</span>
          <span>{rtpLabel(game)}</span>
        </div>
        {loading ? (
          <p role="status">Checking your account…</p>
        ) : user ? (
          <CashGame key={user.id + ":" + game.slug} game={game} />
        ) : (
          <div className="panel">
            <h2>Sign in to play</h2>
            <p>
              Games use your real USD wallet. Sign in or create an account to
              continue.
            </p>
            <Link className="button primary" to="/sign-in">
              Sign in
            </Link>{" "}
            <Link className="button secondary" to="/register">
              Register
            </Link>
          </div>
        )}
      </div>
      <div className="notice">
        <Link to="/responsible-gaming">Set your play limits</Link> or{" "}
        <Link to="/account">view account status</Link>.
      </div>
    </section>
  );
}
