import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Search,
  ArrowRight,
  ChevronRight,
  SlidersHorizontal,
  Compass,
  Spade,
  Disc3,
  Star,
} from "lucide-react";
import { originals } from "@/lib/catalog";
import GameCard from "@/components/GameCard";
export default function CasinoPage({ home = false }: { home?: boolean }) {
  const { categorySlug } = useParams(),
    [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || ""),
    [sort, setSort] = useState("featured");
  const category = categorySlug || "all";
  const games = originals
    .filter(
      (g) =>
        (category === "all" ||
          category === "originals" ||
          g.kind === category) &&
        g.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => (sort === "az" ? a.name.localeCompare(b.name) : 0));
  function search(value: string) {
    setQuery(value);
    setParams(value ? { q: value } : {}, { replace: true });
  }
  return (
    <div className="page casino-page">
      {home && (
        <>
          <div className="intro-line">
            <span>
              <span className="status-dot" /> THE ORIGINALS COLLECTION
            </span>
            <Link to="/responsible-gaming">
              Your play. Your pace. <ChevronRight size={14} />
            </Link>
          </div>
          <section className="casino-hero">
            <div className="hero-copy">
              <span className="eyebrow">A DIFFERENT KIND OF CASINO</span>
              <h1>
                Find your
                <br />
                <em>next world.</em>
              </h1>
              <p>
                Sixteen original slots. Three classic tables.
                <br />A little escape, entirely Spindra.
              </p>
              <div className="hero-actions">
                <Link className="button primary" to="/games">
                  Explore the collection <ArrowRight size={17} />
                </Link>
                <Link className="text-link" to="/register">
                  Create an account
                </Link>
              </div>
              <div className="hero-meta">
                <span>19 original games</span>
                <span>Free demo play</span>
                <span>18+</span>
              </div>
            </div>
            <Link
              className="hero-art"
              to="/game/solar-vault"
              aria-label="Explore Solar Vault"
            >
              <div className="sun-ring ring-one" />
              <div className="sun-ring ring-two" />
              <div className="sun-ring ring-three" />
              <div className="sun-core">☀</div>
              <span className="hero-art-label">SPINDRA ORIGINAL No. 01</span>
              <span className="hero-art-title">
                SOLAR
                <br />
                VAULT
              </span>
              <span className="hero-art-cta">STEP INTO THE LIGHT ↗</span>
            </Link>
          </section>
          <div className="feature-strip">
            <span>
              <Compass size={17} /> Built to explore
            </span>
            <span>
              <Star size={17} /> Spindra originals
            </span>
            <span>
              <Spade size={17} /> Classic table rules
            </span>
            <span>
              <Disc3 size={17} /> Demo credits only
            </span>
          </div>
        </>
      )}
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {home ? "THE COLLECTION" : "SPINDRA CASINO"}
          </span>
          <h1>
            {home ? "Made for your kind of play." : "Discover your game."}
          </h1>
        </div>
        <span className="muted">{games.length} games to explore</span>
      </div>
      <div className="catalog-tools">
        <nav className="category-tabs" aria-label="Game categories">
          {[
            ["all", "All games"],
            ["slots", "Slots"],
            ["blackjack", "Blackjack"],
            ["poker", "Video poker"],
            ["roulette", "Roulette"],
          ].map(([slug, name]) => (
            <Link
              key={slug}
              className={category === slug ? "active" : ""}
              to={slug === "all" ? "/games" : "/games/" + slug}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="catalog-filters">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search games"
              placeholder="Find a game…"
              value={query}
              onChange={(e) => search(e.target.value)}
            />
          </label>
          <label className="sort-field">
            <SlidersHorizontal size={17} />
            <select
              aria-label="Sort games"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="az">A–Z</option>
            </select>
          </label>
        </div>
      </div>
      <div className="game-grid">
        {games.map((g) => (
          <GameCard game={g} index={originals.indexOf(g)} key={g.slug} />
        ))}
      </div>
      {games.length === 0 && (
        <div className="empty-state">
          <Search size={30} />
          <h2>No games found.</h2>
          <p>Try another name or explore a different category.</p>
          <button className="button secondary" onClick={() => search("")}>
            Clear search
          </button>
        </div>
      )}
      <section className="bottom-banner">
        <div>
          <span className="eyebrow">YOUR ACCOUNT, YOUR PACE</span>
          <h2>Make yourself at home.</h2>
          <p>Create an account to prepare for the next chapter of Spindra.</p>
        </div>
        <Link className="button primary" to="/register">
          Join Spindra <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
