import { useDemo, credits } from "@/context/Demo";
import { Trophy, TrendingUp } from "lucide-react";

const avatarColors = [
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-pink-500 to-rose-500",
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500",
  "from-red-400 to-pink-500",
  "from-yellow-400 to-amber-500",
  "from-blue-400 to-indigo-500",
];

export default function WinnersTicker() {
  const { rounds } = useDemo();
  const winners = rounds
    .filter((r) => r.returned > r.bet)
    .map((r) => ({
      id: r.id,
      player: "Your demo session",
      game: r.game,
      amount: credits(r.returned) + " credits",
      avatar: "D",
    }));
  const doubled = [...winners, ...winners];

  return (
    <section
      id="winners"
      className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-gray-200 tracking-wide">
              Demo Session Feed
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Your Session, <span className="text-gradient-gold">Demo Wins</span>
          </h2>
        </div>
      </div>

      {winners.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          Your demo wins will appear here after you play.
        </p>
      )}
      {/* Ticker */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a14] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a14] to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 animate-ticker w-max">
          {doubled.map((winner, i) => (
            <div
              key={`${winner.id}-${i}`}
              className="flex items-center gap-3 glass rounded-2xl px-5 py-3 min-w-[280px] flex-shrink-0"
            >
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center font-bold text-white text-sm`}
              >
                {winner.avatar}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  {winner.player}
                </div>
                <div className="text-xs text-gray-500">{winner.game}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-gradient-gold tabular-nums">
                  {winner.amount}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  WON
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
