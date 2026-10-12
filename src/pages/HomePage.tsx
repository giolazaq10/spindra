import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import Categories from "@/components/Categories";
import GameGrid from "@/components/GameGrid";
import Promotions from "@/components/Promotions";
import WinnersTicker from "@/components/WinnersTicker";
import { games, categories, promotions } from "@/lib/legacyCatalog";
export default function HomePage() {
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
