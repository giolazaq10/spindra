import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Users, Flame, ArrowLeft, Building2, Tag, Percent, ChevronRight, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Game } from '@/lib/types';

const tagColors: Record<string, string> = {
  HOT: 'bg-red-500',
  NEW: 'bg-cyan-400 text-black',
  TOP: 'bg-violet-500',
  JACKPOT: 'bg-gradient-to-r from-amber-400 to-orange-500 text-black',
  LIVE: 'bg-red-600 animate-pulse',
};

export default function GameDetailPage() {
  const { slug } = useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [related, setRelated] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('games')
        .select('*, provider(*), category(*)')
        .eq('slug', slug)
        .maybeSingle();

      setGame(data);

      if (data?.category_id) {
        const { data: rel } = await supabase
          .from('games')
          .select('*, provider(*), category(*)')
          .eq('category_id', data.category_id)
          .eq('status', 'active')
          .neq('id', data.id)
          .limit(4);
        setRelated(rel || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-12 h-12 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 px-4">
        <h1 className="text-3xl font-extrabold text-white mb-4">Game Not Found</h1>
        <p className="text-gray-400 mb-6">This game doesn't exist or may have been removed.</p>
        <Link to="/games" className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold hover:scale-105 transition-transform">
          Browse All Games
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/games" className="hover:text-amber-400 transition-colors">Casino</Link>
          {game.category && (
            <>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/games/${game.category.slug}`} className="hover:text-amber-400 transition-colors">{game.category.name}</Link>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-amber-400">{game.title}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Game image / play area */}
          <div className="relative rounded-3xl overflow-hidden glass aspect-[4/3] group">
            {game.image_url ? (
              <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Play className="w-16 h-16 text-gray-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {game.tag && (
              <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-md text-xs font-bold tracking-wide ${tagColors[game.tag] || 'bg-white/20'}`}>
                {game.tag}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center glow-gold hover:scale-110 transition-transform duration-300">
                <Play className="w-8 h-8 text-black fill-black ml-1" />
              </button>
            </div>
          </div>

          {/* Game info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full glass text-xs font-semibold text-amber-400">{game.category?.name || 'Game'}</span>
              {game.tag && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${tagColors[game.tag] || 'bg-white/20'}`}>{game.tag}</span>
              )}
            </div>

            <h1 className="text-4xl font-extrabold mb-3">{game.title}</h1>

            {game.provider && (
              <Link to={`/providers`} className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors mb-6">
                <Building2 className="w-4 h-4" />
                <span>by {game.provider.name}</span>
              </Link>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {game.rtp && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Percent className="w-3.5 h-3.5" /> RTP
                  </div>
                  <div className="text-xl font-bold text-emerald-400">{game.rtp}</div>
                </div>
              )}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Users className="w-3.5 h-3.5" /> Players Online
                </div>
                <div className="text-xl font-bold text-cyan-400">{game.players_online.toLocaleString()}</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Star className="w-3.5 h-3.5" /> Rating
                </div>
                <div className="text-xl font-bold text-amber-400">4.{Math.floor(Math.random() * 9) + 1}/5</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Flame className="w-3.5 h-3.5" /> Volatility
                </div>
                <div className="text-xl font-bold text-pink-400">{game.players_online > 3000 ? 'High' : 'Medium'}</div>
              </div>
            </div>

            {/* Provider info */}
            {game.provider?.description && (
              <div className="glass rounded-xl p-5 mb-6">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" /> About {game.provider.name}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{game.provider.description}</p>
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-4 mt-auto">
              <button className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 rounded-xl font-bold text-black text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform duration-300 glow-gold">
                <Play className="w-5 h-5 fill-black" /> Play Now
              </button>
              <button className="px-6 py-4 glass rounded-xl font-semibold text-white hover:border-amber-400/40 transition-all">
                Demo
              </button>
            </div>
          </div>
        </div>

        {/* Related games */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-extrabold mb-6">More <span className="text-gradient-gold">{game.category?.name}</span> Games</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((rg) => (
                <Link key={rg.id} to={`/game/${rg.slug}`} className="group relative rounded-2xl overflow-hidden glass hover:border-amber-400/40 transition-all duration-300 hover:scale-[1.03]">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {rg.image_url ? (
                      <img src={rg.image_url} alt={rg.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm group-hover:text-amber-400 transition-colors">{rg.title}</h3>
                    {rg.rtp && <span className="text-xs text-gray-500">RTP {rg.rtp}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
