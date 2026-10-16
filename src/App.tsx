import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/Auth";
import { WalletProvider } from "@/context/Wallet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import "./extension.css";
import "./components/cash-game.css";
import "./components/minigames.css";
import RouteBoundary from "@/components/RouteBoundary";
import CasinoPage from "@/pages/CasinoPage";
import AuthPage from "@/pages/AuthPage";
import AdminPage from "@/pages/AdminPage";
import AccountPage from "@/pages/AccountPage";
import { ResponsiblePage, InfoPage } from "@/pages/InfoPages";
import ProvidersPage from "@/pages/ProvidersPage";
import AboutPage from "@/pages/AboutPage";
import PromotionsPage from "@/pages/PromotionsPage";
import OriginalGame from "@/components/OriginalGame";
import { originals } from "@/lib/catalog";
import type { ReactNode } from "react";
function Styled({ children }: { children: ReactNode }) {
  return <div className="spindra-extension">{children}</div>;
}
function AccountRoute() {
  const { user } = useAuth();
  return <AccountPage key={user?.id || "guest"} />;
}
function AdminRoute() {
  const { user } = useAuth();
  return <AdminPage key={user?.id || "guest"} />;
}
function GameRoute() {
  const { slug } = useParams();
  const game = originals.find((g) => g.slug === slug);
  return game ? <OriginalGame key={game.slug} game={game} /> : <Missing />;
}
function Missing() {
  return (
    <section className="page empty-state">
      <span className="eyebrow">404</span>
      <h1>A little off course.</h1>
      <p>This page or game isn't in the collection.</p>
      <Link className="button primary" to="/games">
        Back to casino
      </Link>
    </section>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <RouteBoundary>
            <Header />
            <main id="main">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/games" element={<CasinoPage />} />
                <Route path="/games/:categorySlug" element={<CasinoPage />} />
                <Route
                  path="/game/:slug"
                  element={
                    <Styled>
                      <GameRoute />
                    </Styled>
                  }
                />
                <Route
                  path="/sign-in"
                  element={
                    <Styled>
                      <AuthPage key="login" mode="login" />
                    </Styled>
                  }
                />
                <Route
                  path="/login"
                  element={<Navigate to="/sign-in" replace />}
                />
                <Route
                  path="/register"
                  element={
                    <Styled>
                      <AuthPage key="register" mode="register" />
                    </Styled>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <Styled>
                      <AuthPage key="forgot" mode="forgot" />
                    </Styled>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <Styled>
                      <AuthPage key="reset" mode="reset" />
                    </Styled>
                  }
                />
                <Route
                  path="/auth/callback"
                  element={<Navigate to="/account" replace />}
                />
                <Route
                  path="/admin"
                  element={
                    <Styled>
                      <AdminRoute />
                    </Styled>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <Styled>
                      <AccountRoute />
                    </Styled>
                  }
                />
                <Route
                  path="/responsible-gaming"
                  element={
                    <Styled>
                      <ResponsiblePage />
                    </Styled>
                  }
                />
                <Route path="/providers" element={<ProvidersPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/promotions" element={<PromotionsPage />} />
                {(["terms", "privacy", "support"] as const).map((kind) => (
                  <Route
                    key={kind}
                    path={"/" + kind}
                    element={
                      <Styled>
                        <InfoPage kind={kind} />
                      </Styled>
                    }
                  />
                ))}
                <Route
                  path="*"
                  element={
                    <Styled>
                      <Missing />
                    </Styled>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </RouteBoundary>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
