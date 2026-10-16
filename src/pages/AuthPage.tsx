import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { authConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/context/Auth";
type Mode = "login" | "register" | "forgot" | "reset";
export default function AuthPage({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [dob, setDob] = useState(""),
    [country, setCountry] = useState(""),
    [accepted, setAccepted] = useState(false),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const { user } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const title = {
    login: "Welcome back.",
    register: "Your next chapter starts here.",
    forgot: "Forgot your password?",
    reset: "Choose a new password.",
  }[mode];
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!authConfigured) {
      setError(
        "Account services are unavailable. Please try signing in again later.",
      );
      return;
    }
    if (mode === "register") {
      const birthday = new Date(dob + "T00:00:00"),
        adult = new Date();
      adult.setFullYear(adult.getFullYear() - 18);
      if (!dob || !Number.isFinite(birthday.getTime()) || birthday > adult) {
        setError(
          "You must be at least 18 to create an account. Local age requirements are checked before real-money play.",
        );
        return;
      }
      if (!accepted) {
        setError("Please review and accept the terms and privacy notice.");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        const dest = (location.state as { from?: string } | null)?.from;
        navigate(
          dest?.startsWith("/") && !dest.startsWith("//") ? dest : "/account",
          { replace: true },
        );
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback",
            data: {
              display_name: name.trim(),
              date_of_birth: dob,
              country,
              terms_version: "prelaunch-v1",
              terms_accepted_at: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;
        if (data.session) navigate("/account");
        else
          setMessage("Check your email to confirm your account, then sign in.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: window.location.origin + "/reset-password" },
        );
        if (error) throw error;
        setMessage(
          "If an account exists, a password reset link will arrive by email.",
        );
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage("Password updated. You can return to your account.");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Account request failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-layout">
      <aside className="auth-story">
        <span className="eyebrow">THE SPINDRA EXPERIENCE</span>
        <h1>
          One account.
          <br />A world of
          <br />
          <em>possibilities.</em>
        </h1>
        <div className="auth-emblem">✦</div>
        <p>
          Discover original worlds and classic tables. Your account, your pace.
        </p>
        <span className="quiet">
          <ShieldCheck size={16} /> 18+ · Play with care
        </span>
      </aside>
      <div className="auth-form panel">
        <span className="eyebrow">SPINDRA / ACCOUNT</span>
        <h2>{title}</h2>
        <p className="muted">
          {mode === "register"
            ? "Create your account. Identity verification is required before money play."
            : mode === "login"
              ? "Sign in to manage your account."
              : "We’ll help you get back to your account."}
        </p>
        {!authConfigured && (
          <div className="notice">
            Prelaunch preview. Authentication requires the operator’s Supabase
            configuration.
          </div>
        )}
        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                Display name
                <input
                  required
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="nickname"
                />
              </label>
              <div className="form-row">
                <label>
                  Date of birth
                  <input
                    required
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    autoComplete="bday"
                  />
                </label>
                <label>
                  Country of residence
                  <select
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="">Select country</option>
                    {[
                      "Georgia",
                      "United Kingdom",
                      "Germany",
                      "Canada",
                      "Other",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
          {mode !== "reset" && (
            <label>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Password
              <div className="password-input">
                <input
                  required
                  minLength={mode === "login" ? 1 : 12}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder={
                    mode === "login"
                      ? "Your password"
                      : "At least 12 characters"
                  }
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}
          {mode === "login" && (
            <Link className="text-link" to="/forgot-password">
              Forgot password?
            </Link>
          )}
          {mode === "register" && (
            <label className="check">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />{" "}
              <span>
                I am 18 or older and accept the <Link to="/terms">terms</Link>{" "}
                and <Link to="/privacy">privacy notice</Link>.
              </span>
            </label>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="success">
              {message}
            </p>
          )}
          <button
            className="button primary wide"
            disabled={busy || (mode === "reset" && !user)}
          >
            {busy
              ? "Please wait…"
              : {
                  login: "Sign in",
                  register: "Create account",
                  forgot: "Send reset link",
                  reset: "Update password",
                }[mode]}
            <ArrowRight size={18} />
          </button>
          {mode === "reset" && !user && (
            <p className="muted">
              Open the recovery link from your email first.
            </p>
          )}
        </form>
        <p className="muted auth-bottom">
          {mode === "login" ? (
            <>
              New to Spindra? <Link to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/sign-in">Sign in</Link>
            </>
          )}
        </p>
        <Link className="text-link" to="/games">
          Explore games first →
        </Link>
      </div>
    </section>
  );
}
