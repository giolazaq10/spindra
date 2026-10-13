import { Link } from "react-router-dom";
import {
  Dices,
  Shield,
  Zap,
  Trophy,
  Users,
  Globe,
  ChevronRight,
  Target,
  Award,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Account Protection",
    desc: "Supabase account authentication and private player data, with live operation being prepared.",
  },
  {
    icon: Zap,
    title: "Playable Originals",
    desc: "Explore original slots, blackjack, Texas Hold’em and roulette with free demo credits.",
  },
  {
    icon: Trophy,
    title: "Original Slot Worlds",
    desc: "Sixteen slot themes with different names, symbols and animations.",
  },
  {
    icon: Users,
    title: "Your Account",
    desc: "Dedicated registration, sign-in, recovery and account pages.",
  },
  {
    icon: Globe,
    title: "Responsible Play",
    desc: "Set limits, review your session and take time away from play.",
  },
  {
    icon: Award,
    title: "Future Providers",
    desc: "External provider games will be added after verified integrations.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">About</span>
        </div>

        {/* Hero */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Dices className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-gray-200 tracking-wide">
              Est. 2026
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
            About <span className="text-gradient-gold">Spindra</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Spindra Casino was founded with one mission: to bring the thrill and
            glamour of a world-class casino straight to your screen. We combine
            cutting-edge technology with a passion for entertainment to deliver
            an unforgettable gaming experience.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass rounded-2xl p-6 hover:border-amber-400/30 transition-colors duration-300 animate-[count-up_0.4s_ease_backwards]"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mission section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="glass rounded-3xl p-8">
            <Target className="w-10 h-10 text-cyan-400 mb-4" />
            <h2 className="text-2xl font-extrabold text-white mb-4">
              Our Mission
            </h2>
            <p className="text-gray-400 leading-relaxed">
              To create the most entertaining, fair, and accessible online
              casino in the world. We believe gaming should be fun, transparent,
              and rewarding — which is why we invest heavily in game quality,
              security infrastructure, and customer satisfaction.
            </p>
          </div>
          <div className="glass rounded-3xl p-8">
            <Shield className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-2xl font-extrabold text-white mb-4">
              Responsible Gaming
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              We are committed to promoting responsible gaming. Our platform
              includes demo session loss limits, self-exclusion options, and
              resources for those who need support.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Self-Exclusion",
                "Session Loss Limits",
                "Session History",
                "Responsible Play",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 animated-gradient opacity-90" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative px-8 py-12 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              Ready to Join the Fun?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Explore 19 playable Spindra originals with free demo credits.
            </p>
            <Link
              to="/games"
              className="px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-300 inline-flex items-center gap-2"
            >
              Browse Games
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
