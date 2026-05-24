import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { EntradasPage } from './pages/EntradasPage';
import { FixosPage } from './pages/FixosPage';
import { DiarioPage } from './pages/DiarioPage';
import { EconomiasPage } from './pages/EconomiasPage';
import { PerfilPage } from './pages/PerfilPage';
import { isSupabaseConfigured } from './lib/supabase';
import { ToastProvider } from './components/ui/Toast';

function LoadingScreen() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <span className="text-4xl">💰</span>
        <p className="text-slate-400 text-sm mt-3">Carregando...</p>
      </div>
    </div>
  );
}

// Guard: só deixa passar se o usuário estiver autenticado.
// Sem Supabase configurado, sempre passa.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (!isSupabaseConfigured()) return <>{children}</>;
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Guard: só deixa acessar /app após o onboarding estar completo.
function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { isOnboarded, dataLoaded } = useApp();
  if (!dataLoaded) return <LoadingScreen />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

// Guard: redireciona usuário já autenticado para fora da landing/auth.
function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (!isSupabaseConfigured()) return <>{children}</>;
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RedirectIfAuthed><LandingPage /></RedirectIfAuthed>} />
      <Route path="/login" element={<RedirectIfAuthed><AuthPage mode="login" /></RedirectIfAuthed>} />
      <Route path="/register" element={<RedirectIfAuthed><AuthPage mode="register" /></RedirectIfAuthed>} />

      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <AppLayout />
            </RequireOnboarded>
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="entradas" element={<EntradasPage />} />
        <Route path="fixos" element={<FixosPage />} />
        <Route path="diario" element={<DiarioPage />} />
        <Route path="economias" element={<EconomiasPage />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}
