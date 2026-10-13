import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Play, ChevronRight, Sparkles, TrendingUp } from "lucide-react";

const heroImages = [
  "https://images.pexels.com/photos/14213317/pexels-photo-14213317.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "https://images.pexels.com/photos/27600353/pexels-photo-27600353.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "https://images.pexels.com/photos/12260050/pexels-photo-12260050.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
];

export default function Hero() {
  const [jackpot, setJackpot] = useState(1287450);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const jInt = setInterval(() => {
      setJackpot((j) => j + Math.floor(Math.random() * 50 + 10));
    }, 1500);
    const iInt = setInterval(() => {
      setImgIndex((i) => (i + 1) % heroImages.length);
    }, 5000);
    return () => {
      clearInterval(jInt);
      clearInterval(iInt);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === imgIndex ? 0.35 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0a0a14]/85 to-[#1a0a2e]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-[#0a0a14]/60" />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl animate-pulse-glow" />
      <div
        className="absolute bottom-1/4 right-10 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl animate-pulse-glow"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-pulse-glow"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-[slide-in-right_0.6s_ease]">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-gray-200 tracking-wide">
                Spindra Original Games · Play Now
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-6">
              <span className="block text-white">Where Luck</span>
              <span className="block text-gradient-gold">Meets Excitement</span>
            </h1>

            <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Explore 16 original slots, blackjack, poker, and roulette on
              Spindra — all playable with free practice credits.
            </p>

            {/* Jackpot counter */}
            <div className="glass-strong rounded-2xl p-6 mb-8 max-w-md mx-auto lg:mx-0 glow-gold">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400 tracking-widest uppercase">
                  Jackpot
                </span>
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-gradient-gold tabular-nums tracking-tight">
                ${jackpot.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Illustrative counter
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/games"
                className="group px-8 py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 rounded-xl font-bold text-black text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform duration-300 glow-gold"
              >
                <Play className="w-5 h-5 fill-black" />
                Play Now
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/games"
                className="px-8 py-4 glass rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-2 hover:border-amber-400/40 transition-all duration-300"
              >
                Explore Games
              </Link>
            </div>
          </div>

          {/* Right visual */}
          <div className="hidden lg:flex items-center justify-center perspective-1000">
            <div className="relative w-full max-w-md aspect-square">
              {/* Roulette wheel decorative */}
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-spin-slow" />
              <div
                className="absolute inset-8 rounded-full border-2 border-pink-500/20 animate-spin-slow"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "15s",
                }}
              />
              <div
                className="absolute inset-16 rounded-full border-2 border-cyan-400/20 animate-spin-slow"
                style={{ animationDuration: "10s" }}
              />

              {/* Center card */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass-strong rounded-3xl p-8 w-72 glow-pink animate-float">
                  <div className="text-center">
                    <div className="text-5xl font-extrabold text-gradient-gold mb-2">
                      19
                    </div>
                    <div className="text-sm text-gray-400 mb-4">
                      Original games to explore
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["🎰", "🃏", "🎰"].map((emoji, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-lg bg-white/5 flex items-center justify-center text-2xl border border-white/10"
                        >
                          {emoji}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating chips */}
              <div
                className="absolute top-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg animate-float shadow-xl"
                style={{ animationDelay: "0.5s" }}
              >
                100
              </div>
              <div
                className="absolute bottom-8 left-0 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm animate-float shadow-xl"
                style={{ animationDelay: "1.5s" }}
              >
                25
              </div>
              <div
                className="absolute top-1/2 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-bold text-xs animate-float shadow-xl"
                style={{ animationDelay: "1s" }}
              >
                500
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
    </section>
  );
}
