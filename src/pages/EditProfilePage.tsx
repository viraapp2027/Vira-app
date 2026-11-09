import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ProfileForm } from '../features/profile/ProfileForm';
import { useProfile } from '../features/profile/ProfileContext';

export function EditProfilePage() {
  const { profile, loading, saveProfile } = useProfile();
  const navigate = useNavigate();
  if (loading) return <LoadingScreen message="Carregando suas informações…" />;
  if (!profile) return null;

  return (
    <AppShell>
      <section className="app-page-heading"><div><span className="eyebrow">Você no controle</span><h1>Editar perfil</h1><p>Sua data de nascimento não é exibida. A localização é apresentada de forma aproximada, por cidade e estado.</p></div></section>
      <ProfileForm profile={profile} submitLabel="Salvar alterações" onCancel={() => navigate('/perfil')} onSubmit={async (update) => { await saveProfile(update); navigate('/perfil'); }} />
    </AppShell>
  );
}
