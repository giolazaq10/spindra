import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Provider, Game } from '@/lib/types';

const statusConfig = {
  active: { label: 'Active', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  pending: { label: 'Coming Soon', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  inactive: { label: 'Inactive', icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [gameCounts, setGameCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: provs }, { data: games }] = await Promise.all([
        supabase.from('providers').select('*').order('name'),
        supabase.from('games').select('provider_id, status').eq('status', 'active'),
      ]);

      setProviders(provs || []);

      const counts: Record<string, number> = {};
      (games || []).forEach((g) => {
        if (g.provider_id) counts[g.provider_id] = (counts[g.provider_id] || 0) + 1;
      });
      setGameCounts(counts);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Providers</span>
        </div>

        <div className="mb-10">
          <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Partners</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">
            Game <span className="text-gradient-cyan">Providers</span>
          </h1>
          <p className="text-gray-400 mt-3 max-w-xl">
            We partner with the world's leading game studios to bring you premium casino entertainment.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider, i) => {
              const status = statusConfig[provider.status];
              const StatusIcon = status.icon;
              const count = gameCounts[provider.id] || 0;

              return (
                <div
                  key={provider.id}
                  className="group glass rounded-2xl p-6 hover:border-amber-400/30 transition-all duration-300 hover:scale-[1.02] animate-[count-up_0.4s_ease_backwards]"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-amber-400" />
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${status.bg} ${status.border} border ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{provider.name}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-3">{provider.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs text-gray-500">
                      {count > 0 ? `${count} game${count !== 1 ? 's' : ''}` : 'No games yet'}
                    </span>
                    {provider.status === 'active' && count > 0 ? (
                      <Link
                        to={`/games?provider=${provider.slug}`}
                        className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:gap-2 transition-all"
                      >
                        View Games
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-600">Stay tuned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Partner CTA */}
        <div className="mt-16 glass rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-white mb-3">Want to Become a Provider?</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            We're always looking to partner with innovative game studios. Get your games in front of thousands of players.
          </p>
          <button className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-xl font-bold hover:scale-105 transition-transform duration-300 inline-flex items-center gap-2">
            Contact Partnerships
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
