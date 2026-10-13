import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/Auth";
import { useWallet } from "@/context/Wallet";
import { credits } from "@/context/Demo";
import DepositModal from "./DepositModal";
import { Menu, X, Dices, Search, Wallet as WalletIcon, Plus } from "lucide-react";

const navLinks = [
  { label: "Casino", to: "/games" },
  { label: "Providers", to: "/providers" },
  { label: "Promotions", to: "/promotions" },
  { label: "About", to: "/about" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { balance, mode, currency } = useWallet();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isActive = (to: string) =>
    location.pathname === to ||
    (to === "/games" && location.pathname.startsWith("/game"));

  return (
    <>
      <header
        onClick={(e) => {
          if ((e.target as Element).closest("a")) setMobileOpen(false);
        }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || location.pathname !== "/"
            ? "glass-strong py-2 shadow-lg shadow-black/40"
            : "py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center glow-gold transition-transform duration-300 group-hover:scale-110">
              <Dices className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-gradient-gold">Spin</span>
                <span className="text-white">dra</span>
              </span>
              <span className="text-[10px] text-gray-400 tracking-widest font-medium">
                CASINO
              </span>
            </div>
          </Link>

          {/* Center: Nav + Balance (desktop) */}
          <div className="hidden lg:flex items-center gap-8">
            <nav className="flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors duration-200 relative group ${
                    isActive(link.to)
                      ? "text-amber-400"
                      : "text-gray-300 hover:text-amber-400"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-pink-500 transition-all duration-300 ${isActive(link.to) ? "w-full" : "w-0 group-hover:w-full"}`}
                  />
                </Link>
              ))}
            </nav>

            {/* Balance display - center top when signed in */}
            {user && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass">
                <div className="flex items-center gap-2">
                  <WalletIcon className="w-4 h-4 text-amber-400" />
                  <div className="flex flex-col leading-none">
                    <span className="text-[9px] text-gray-500 tracking-widest uppercase">
                      {mode === "real" ? "Real" : "Practice"}
                    </span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {credits(balance)}
                      {mode === "real" ? ` ${currency}` : ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDepositOpen(true)}
                  className="w-7 h-7 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-black hover:scale-110 transition-transform"
                  aria-label="Deposit"
                  title="Deposit crypto"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Actions (desktop) */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <Link
              to="/games"
              aria-label="Search games"
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white hover:border-amber-400/40 transition-all duration-200"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link
              to={user ? "/account" : "/sign-in"}
              className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              {user ? "My Account" : "Sign In"}
            </Link>
            <Link
              to={user ? "/responsible-gaming" : "/register"}
              className="px-5 py-2.5 text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-amber-500/40 transition-all duration-300 hover:scale-105"
            >
              {user ? "Play Limits" : "Register"}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden w-10 h-10 rounded-xl glass flex items-center justify-center text-white"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile balance bar when signed in */}
        {user && mobileOpen && (
          <div className="lg:hidden px-4 pt-3">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl glass">
              <div className="flex items-center gap-2">
                <WalletIcon className="w-4 h-4 text-amber-400" />
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] text-gray-500 tracking-widest uppercase">
                    {mode === "real" ? "Real" : "Practice"}
                  </span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {credits(balance)}
                    {mode === "real" ? ` ${currency}` : ""}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setDepositOpen(true);
                  setMobileOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Deposit
              </button>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden glass-strong border-t border-white/10 mt-2 animate-[count-up_0.3s_ease]">
            <nav className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                    isActive(link.to)
                      ? "text-amber-400 bg-white/5"
                      : "text-gray-300 hover:bg-white/5 hover:text-amber-400"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 pt-3 border-t border-white/10 mt-2">
                <Link
                  to={user ? "/account" : "/sign-in"}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-300 glass text-center"
                >
                  {user ? "My Account" : "Sign In"}
                </Link>
                <Link
                  to={user ? "/responsible-gaming" : "/register"}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 text-center"
                >
                  {user ? "Play Limits" : "Register"}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
      />
    </>
  );
}
