import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RequireOnboarding } from './RequireOnboarding';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const LandingPage = lazy(() => import('../pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })));
const OAuthCallbackPage = lazy(() => import('../pages/OAuthCallbackPage').then((module) => ({ default: module.OAuthCallbackPage })));
const OnboardingPage = lazy(() => import('../pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })));
const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const EditProfilePage = lazy(() => import('../pages/EditProfilePage').then((module) => ({ default: module.EditProfilePage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

export function App() {
  return (
    <Suspense fallback={<LoadingScreen message="Abrindo o VIRA…" />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/app" element={<ProtectedRoute><RequireOnboarding><HomePage /></RequireOnboarding></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><RequireOnboarding><ProfilePage /></RequireOnboarding></ProtectedRoute>} />
        <Route path="/perfil/editar" element={<ProtectedRoute><RequireOnboarding><EditProfilePage /></RequireOnboarding></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><RequireOnboarding><SettingsPage /></RequireOnboarding></ProtectedRoute>} />
        <Route path="/inicio" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
