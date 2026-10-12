import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useParams,
} from "react-router-dom";
import { AuthProvider } from "@/context/Auth";
import { DemoProvider } from "@/context/Demo";
import { Header, Footer } from "@/components/Shell";
import ErrorBoundary from "@/components/ErrorBoundary";
import CasinoPage from "@/pages/CasinoPage";
import AuthPage from "@/pages/AuthPage";
import AccountPage from "@/pages/AccountPage";
import { ResponsiblePage, ProvidersPage, InfoPage } from "@/pages/InfoPages";
import OriginalGame from "@/components/OriginalGame";
import { originals } from "@/lib/catalog";
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
      <p>This page or game isn’t in the collection.</p>
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
        <DemoProvider>
          <ErrorBoundary>
            <Header />
            <main id="main">
              <Routes>
                <Route path="/" element={<CasinoPage home />} />
                <Route path="/games" element={<CasinoPage />} />
                <Route path="/games/:categorySlug" element={<CasinoPage />} />
                <Route path="/game/:slug" element={<GameRoute />} />
                <Route
                  path="/sign-in"
                  element={<AuthPage key="login" mode="login" />}
                />
                <Route
                  path="/login"
                  element={<Navigate to="/sign-in" replace />}
                />
                <Route
                  path="/register"
                  element={<AuthPage key="register" mode="register" />}
                />
                <Route
                  path="/forgot-password"
                  element={<AuthPage key="forgot" mode="forgot" />}
                />
                <Route
                  path="/reset-password"
                  element={<AuthPage key="reset" mode="reset" />}
                />
                <Route
                  path="/auth/callback"
                  element={<Navigate to="/account" replace />}
                />
                <Route path="/account" element={<AccountPage />} />
                <Route
                  path="/responsible-gaming"
                  element={<ResponsiblePage />}
                />
                <Route path="/providers" element={<ProvidersPage />} />
                {(
                  [
                    "terms",
                    "privacy",
                    "support",
                    "about",
                    "promotions",
                  ] as const
                ).map((kind) => (
                  <Route
                    key={kind}
                    path={"/" + kind}
                    element={<InfoPage kind={kind} />}
                  />
                ))}
                <Route path="*" element={<Missing />} />
              </Routes>
            </main>
            <Footer />
          </ErrorBoundary>
        </DemoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
