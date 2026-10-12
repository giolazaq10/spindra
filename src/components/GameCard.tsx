import { Link } from "react-router-dom";
import { Play, Building2 } from "lucide-react";
import { games } from "@/lib/legacyCatalog";
import type { Original } from "@/lib/catalog";
export default function GameCard({
  game,
  index = 0,
}: {
  game: Original;
  index?: number;
}) {
  const g = games.find((g) => g.slug === game.slug)!;
  return (
    <Link
      to={"/game/" + g.slug}
      className="group relative rounded-2xl overflow-hidden glass hover:border-amber-400/40 transition-all duration-300 hover:scale-[1.03] animate-[count-up_0.5s_ease_backwards]"
      style={{ animationDelay: index * 0.04 + "s" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={g.image_url!}
          alt={g.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent" />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide bg-cyan-400 text-black">
          DEMO
        </span>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center glow-gold">
            <Play className="w-6 h-6 text-black fill-black" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors">
          {g.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="text-emerald-400">{g.category?.name}</span>
          {g.rtp && <span>RTP {g.rtp}</span>}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Free demo play</span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Spindra
          </span>
        </div>
      </div>
    </Link>
  );
}
