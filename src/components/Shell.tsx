import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/Auth";
export function Header() {
  const { user } = useAuth(),
    [open, setOpen] = useState(false),
    location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-icon">✦</span>spindra
          <span className="brand-dot">.</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink to="/games">Casino</NavLink>
          <NavLink to="/providers">Providers</NavLink>
          <NavLink to="/responsible-gaming">Play responsibly</NavLink>
        </nav>
        <div className="header-actions">
          {user ? (
            <Link className="button primary" to="/account">
              My account <ArrowUpRight size={16} />
            </Link>
          ) : (
            <>
              <Link className="signin-link" to="/sign-in">
                Sign in
              </Link>
              <Link className="button primary" to="/register">
                Create account <ArrowUpRight size={16} />
              </Link>
            </>
          )}
          <button
            className="menu-button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <Link to="/games">Casino</Link>
          <Link to="/providers">Providers</Link>
          <Link to="/responsible-gaming">Play responsibly</Link>
          <Link to={user ? "/account" : "/sign-in"}>
            {user ? "My account" : "Sign in"}
          </Link>
        </nav>
      )}
      <div className="prelaunch-bar">
        PRELAUNCH COLLECTION <span>·</span> Original games use demo credits.
        Deposits and cash wagering are unavailable.
      </div>
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="brand" to="/">
          <span className="brand-icon">✦</span>spindra
          <span className="brand-dot">.</span>
        </Link>
        <p>
          Original worlds. Classic tables.
          <br />
          Entertainment at your own pace.
        </p>
        <nav aria-label="Footer navigation">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/responsible-gaming">Responsible gaming</Link>
          <Link to="/support">Help</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Spindra · Prelaunch platform</span>
        <span>
          <b className="age-badge">18+</b> Demo credits have no cash value.
        </span>
      </div>
    </footer>
  );
}
