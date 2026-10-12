import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Game, GameCategory, Promotion } from '@/lib/types';
import Hero from '@/components/Hero';
import StatsBar from '@/components/StatsBar';
import Categories from '@/components/Categories';
import GameGrid from '@/components/GameGrid';
import Promotions from '@/components/Promotions';
import WinnersTicker from '@/components/WinnersTicker';

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<GameCategory[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: g }, { data: c }, { data: p }] = await Promise.all([
        supabase.from('games').select('*, provider(*), category(*)').eq('status', 'active').order('sort_order').limit(8),
        supabase.from('game_categories').select('*').order('sort_order'),
        supabase.from('promotions').select('*').eq('status', 'active').order('sort_order'),
      ]);
      setGames(g || []);
      setCategories(c || []);
      setPromotions(p || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Hero />
      <StatsBar />
      <Categories categories={categories} games={games} />
      <GameGrid games={games} categories={categories} />
      <Promotions promotions={promotions} />
      <WinnersTicker />
    </>
  );
}
