import { Link } from "react-router-dom";
import {
  Coins,
  Radio,
  Disc3,
  Spade,
  Diamond,
  Trophy,
  ChevronRight,
} from "lucide-react";
import type { Game, GameCategory } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Coins,
  Radio,
  Disc3,
  Spade,
  Diamond,
  Trophy,
};

const gradients = [
  "from-amber-500 to-orange-600",
  "from-cyan-400 to-blue-600",
  "from-pink-500 to-rose-600",
  "from-emerald-400 to-teal-600",
  "from-violet-400 to-purple-600",
  "from-yellow-400 to-amber-600",
];

type Props = {
  categories: GameCategory[];
  games: Game[];
};

export default function Categories({ categories, games }: Props) {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
            Browse
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2">
            Game <span className="text-gradient-cyan">Categories</span>
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Find your favorite type of game — original slots and classic table
            games
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => {
            const Icon = iconMap[cat.icon] || Coins;
            const count = games.filter((g) => g.category_id === cat.id).length;
            const gradient = gradients[i % gradients.length];
            return (
              <Link
                key={cat.id}
                to={`/games/${cat.slug}`}
                className="group relative glass rounded-2xl p-6 text-center hover:scale-105 transition-all duration-300 hover:border-white/20 animate-[count-up_0.4s_ease_backwards]"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
                <div
                  className={`relative w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="relative font-semibold text-white text-sm">
                  {cat.name}
                </div>
                <div className="relative text-xs text-gray-500 mt-1">
                  {count} games
                </div>
                <ChevronRight className="relative w-4 h-4 text-gray-600 mx-auto mt-2 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
