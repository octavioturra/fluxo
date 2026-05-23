import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
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

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="entradas" element={<EntradasPage />} />
              <Route path="fixos" element={<FixosPage />} />
              <Route path="diario" element={<DiarioPage />} />
              <Route path="economias" element={<EconomiasPage />} />
              <Route path="perfil" element={<PerfilPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
