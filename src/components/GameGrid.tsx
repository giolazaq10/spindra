import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Users, TrendingUp, Flame } from "lucide-react";
import type { Game, GameCategory } from "@/lib/types";

const tagColors: Record<string, string> = {
  HOT: "bg-red-500",
  NEW: "bg-cyan-400 text-black",
  TOP: "bg-violet-500",
  JACKPOT: "bg-gradient-to-r from-amber-400 to-orange-500 text-black",
  LIVE: "bg-red-600 animate-pulse",
  ORIGINAL: "bg-violet-500",
};

const accentByText: Record<string, string> = {
  gold: "text-amber-400",
  cyan: "text-cyan-400",
  pink: "text-pink-400",
  green: "text-emerald-400",
};

type Props = {
  games: Game[];
  categories: GameCategory[];
};

export default function GameGrid({ games, categories }: Props) {
  const [filter, setFilter] = useState("All");

  const filters = ["All", ...categories.map((c) => c.name)];
  const filtered =
    filter === "All" ? games : games.filter((g) => g.category?.name === filter);

  return (
    <section id="games" className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              Featured
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-2">
              Popular <span className="text-gradient-gold">Games</span>
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                    : "glass text-gray-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((game, i) => {
            const accent =
              game.tag === "JACKPOT"
                ? "gold"
                : game.tag === "LIVE"
                  ? "cyan"
                  : game.tag === "HOT"
                    ? "pink"
                    : "green";
            return (
              <Link
                key={game.id}
                to={`/game/${game.slug}`}
                className={`group relative rounded-2xl overflow-hidden glass hover:border-amber-400/40 transition-all duration-300 hover:scale-[1.03] animate-[count-up_0.5s_ease_backwards]`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {game.image_url ? (
                    <img
                      src={game.image_url}
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent" />
                  {game.tag && (
                    <div
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide ${tagColors[game.tag] || "bg-white/20"}`}
                    >
                      {game.tag}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center scale-50 group-hover:scale-100 transition-transform duration-300 glow-gold">
                      <Play className="w-6 h-6 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors">
                    {game.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span
                      className={`font-semibold ${accentByText[accent] || "text-amber-400"}`}
                    >
                      {game.category?.name || "Game"}
                    </span>
                    {game.rtp && <span>RTP {game.rtp}</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>Available now</span>
                    {game.players_online > 3000 && (
                      <Flame className="w-3 h-3 text-orange-400 ml-1" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/games"
            className="px-8 py-3.5 glass rounded-xl font-semibold text-white hover:border-amber-400/40 transition-all duration-300 inline-flex items-center gap-2"
          >
            View All Games
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
