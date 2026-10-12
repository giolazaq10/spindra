import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Play, Users, Flame, ArrowLeft, Building2, Tag, Percent, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Game, GameCategory } from '@/lib/types';

const tagColors: Record<string, string> = {
  HOT: 'bg-red-500',
  NEW: 'bg-cyan-400 text-black',
  TOP: 'bg-violet-500',
  JACKPOT: 'bg-gradient-to-r from-amber-400 to-orange-500 text-black',
  LIVE: 'bg-red-600 animate-pulse',
};

const accentByText: Record<string, string> = {
  gold: 'text-amber-400',
  cyan: 'text-cyan-400',
  pink: 'text-pink-400',
  green: 'text-emerald-400',
};

export default function GamesPage() {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const providerFilter = searchParams.get('provider');
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<GameCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(categorySlug || null);

  useEffect(() => {
    setActiveCategory(categorySlug || null);
  }, [categorySlug]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: cats }, { data: g }] = await Promise.all([
        supabase.from('game_categories').select('*').order('sort_order'),
        supabase.from('games').select('*, provider(*), category(*)').eq('status', 'active').order('sort_order'),
      ]);
      setCategories(cats || []);

      let filtered = g || [];
      if (activeCategory) {
        const cat = (cats || []).find((c) => c.slug === activeCategory);
        if (cat) filtered = filtered.filter((game) => game.category_id === cat.id);
      }
      if (providerFilter) {
        filtered = filtered.filter((game) => game.provider?.slug === providerFilter);
      }
      setGames(filtered);
      setLoading(false);
    })();
  }, [activeCategory, providerFilter]);

  const activeCat = categories.find((c) => c.slug === activeCategory);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Casino</span>
          {activeCat && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-amber-400">{activeCat.name}</span>
            </>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2">
            {activeCat ? (
              <><span className="text-gradient-gold">{activeCat.name}</span> Games</>
            ) : (
              <>All <span className="text-gradient-gold">Games</span></>
            )}
          </h1>
          <p className="text-gray-400">
            {loading ? 'Loading games...' : `${games.length} games available`}
          </p>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to="/games"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !activeCategory ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black' : 'glass text-gray-400 hover:text-white'
            }`}
          >
            All Games
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/games/${cat.slug}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat.slug ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black' : 'glass text-gray-400 hover:text-white'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Games grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No games found in this category yet.</p>
            <p className="text-gray-600 text-sm mt-2">New games are added regularly — check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {games.map((game, i) => {
              const accent = game.tag === 'JACKPOT' ? 'gold' : game.tag === 'LIVE' ? 'cyan' : game.tag === 'HOT' ? 'pink' : 'green';
              return (
                <Link
                  key={game.id}
                  to={`/game/${game.slug}`}
                  className="group relative rounded-2xl overflow-hidden glass hover:border-amber-400/40 transition-all duration-300 hover:scale-[1.03] animate-[count-up_0.5s_ease_backwards]"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {game.image_url ? (
                      <img src={game.image_url} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent" />
                    {game.tag && (
                      <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide ${tagColors[game.tag] || 'bg-white/20'}`}>
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
                    <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors">{game.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className={accentByText[accent] || 'text-amber-400'}>{game.category?.name || 'Game'}</span>
                      {game.rtp && <span>RTP {game.rtp}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {game.players_online.toLocaleString()} playing
                      </span>
                      {game.provider && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Building2 className="w-3 h-3" />
                          {game.provider.name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
