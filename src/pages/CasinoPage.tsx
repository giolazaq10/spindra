import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { originals } from "@/lib/catalog";
import { categories } from "@/lib/legacyCatalog";
import GameCard from "@/components/GameCard";
export default function CasinoPage() {
  const { categorySlug } = useParams(),
    [params, setParams] = useSearchParams(),
    [sort, setSort] = useState("featured");
  const query = params.get("q") || "",
    category = categories.find((c) => c.slug === categorySlug);
  const games = originals
    .filter(
      (g) =>
        (!categorySlug || g.kind === categorySlug) &&
        g.name.toLowerCase().includes(query.toLowerCase()) &&
        (params.get("provider") === null ||
          ["spindra", "originals"].includes(params.get("provider")!)),
    )
    .sort((a, b) => (sort === "az" ? a.name.localeCompare(b.name) : 0));
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Casino</span>
          {category && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-amber-400">{category.name}</span>
            </>
          )}
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2">
            {category ? (
              <>
                <span className="text-gradient-gold">{category.name}</span>{" "}
                Games
              </>
            ) : (
              <>
                All <span className="text-gradient-gold">Games</span>
              </>
            )}
          </h1>
          <p className="text-gray-400">
            {games.length} original games available · Demo credits only
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Game categories">
          {[{ slug: "", name: "All Games" }, ...categories].map((c) => (
            <Link
              key={c.slug}
              to={"/games" + (c.slug ? "/" + c.slug : "")}
              className={
                "px-4 py-2 rounded-lg text-sm font-medium transition-all " +
                ((categorySlug || "") === c.slug
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                  : "glass text-gray-400 hover:text-white")
              }
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <label className="flex items-center gap-3 glass rounded-xl px-4 py-3 flex-1">
            <Search className="w-5 h-5 text-amber-400" />
            <input
              className="bg-transparent text-white outline-none w-full"
              aria-label="Search games"
              placeholder="Search games..."
              value={query}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.value) next.set("q", e.target.value);
                else next.delete("q");
                setParams(next, { replace: true });
              }}
            />
          </label>
          <select
            aria-label="Sort games"
            className="glass rounded-xl px-4 py-3 text-gray-300"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option className="bg-[#0a0a14]" value="featured">
              Featured
            </option>
            <option className="bg-[#0a0a14]" value="az">
              A–Z
            </option>
          </select>
        </div>
        {games.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {games.map((g) => (
              <GameCard game={g} index={originals.indexOf(g)} key={g.slug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              No games found in this category yet.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {categorySlug === "live-casino"
                ? "Live dealer games require a connected provider."
                : categorySlug === "jackpots"
                  ? "Progressive jackpot games are not connected yet."
                  : "Try another game name or category."}
            </p>
            <Link to="/games" className="inline-block mt-6 text-amber-400">
              Browse all games
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
