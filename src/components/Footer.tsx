import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Phone,
  Mail,
  MessageCircle,
  Dices,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";

const socials = [
  { icon: Facebook, label: "Facebook" },
  { icon: Twitter, label: "Twitter" },
  { icon: Instagram, label: "Instagram" },
  { icon: Youtube, label: "YouTube" },
];

export default function Footer() {
  return (
    <footer
      id="about"
      className="relative pt-20 px-4 sm:px-6 lg:px-8 border-t border-white/5"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

      <div className="max-w-7xl mx-auto">
        {/* CTA banner */}
        <div className="relative rounded-3xl overflow-hidden mb-16">
          <div className="absolute inset-0 animated-gradient opacity-90" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative px-8 py-12 sm:px-12 sm:py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Win Big?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Create your account and explore Spindra originals with free
              practice credits.
            </p>
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-300 inline-flex items-center gap-2"
            >
              <Dices className="w-5 h-5" />
              Play Now
            </Link>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center glow-gold">
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
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              The premier online casino destination. Play responsibly and enjoy
              premium gaming entertainment 24/7.
            </p>

            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Support contact coming soon</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Phone support coming soon</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-400" />
                <span>Live chat coming soon</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">Casino</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/games"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  All Games
                </Link>
              </li>
              <li>
                <Link
                  to="/games/slots"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Slots
                </Link>
              </li>
              <li>
                <Link
                  to="/games/live-casino"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Live Casino
                </Link>
              </li>
              <li>
                <Link
                  to="/games/roulette"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Roulette
                </Link>
              </li>
              <li>
                <Link
                  to="/games/blackjack"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Blackjack
                </Link>
              </li>
              <li>
                <Link
                  to="/games/jackpots"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Jackpots
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/providers"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Providers
                </Link>
              </li>
              <li>
                <Link
                  to="/promotions"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Promotions
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Affiliates
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/support"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Live Chat
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/responsible-gaming"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Responsible Gaming
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/responsible-gaming"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Fair Play
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Licensing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social */}
        <div className="flex items-center justify-between flex-wrap gap-4 py-6 border-t border-white/5">
          <div className="flex gap-3">
            {socials.map((social) => {
              const Icon = social.icon;
              return (
                <button
                  key={social.label}
                  disabled
                  title="Social channels coming soon"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-400/40 transition-all duration-200 hover:scale-110"
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-400 font-medium">
                Account Protection
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-400 font-medium">
                Crypto deposits enabled
              </span>
            </div>
          </div>
        </div>

        {/* Responsible gaming + copyright */}
        <div className="py-8 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">
              18+ Only
            </span>
            <span className="text-xs text-gray-500">
              Gambling can be addictive. Please play responsibly.
            </span>
          </div>
          <p className="text-xs text-gray-600">
            © 2026 Spindra Casino. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
