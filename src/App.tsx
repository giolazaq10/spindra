import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import GamesPage from '@/pages/GamesPage';
import GameDetailPage from '@/pages/GameDetailPage';
import PromotionsPage from '@/pages/PromotionsPage';
import ProvidersPage from '@/pages/ProvidersPage';
import AboutPage from '@/pages/AboutPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0a14] text-white">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/:categorySlug" element={<GamesPage />} />
            <Route path="/game/:slug" element={<GameDetailPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
