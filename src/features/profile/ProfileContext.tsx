import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase/client';
import type { Profile, ProfileUpdate } from '../../types/profile';

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveProfile: (update: ProfileUpdate) => Promise<Profile>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      setLoading(false);
      setLoadedUserId(null);
      return;
    }

    setLoading(true);
    setError(null);
    setProfile(null);
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (queryError) {
      setError('Não foi possível carregar seu perfil. Tente novamente.');
      setProfile(null);
    } else {
      setProfile((data as Profile | null) ?? null);
    }
    setLoadedUserId(user.id);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveProfile = useCallback(async (update: ProfileUpdate) => {
    if (!supabase || !user) throw new Error('Entre na sua conta para salvar o perfil.');
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)
      .select('*')
      .single();

    if (updateError) throw updateError;
    const nextProfile = data as Profile;
    setProfile(nextProfile);
    return nextProfile;
  }, [user]);

  const value = useMemo(() => ({
    profile,
    loading: Boolean(user && (loading || loadedUserId !== user.id)),
    error,
    refresh,
    saveProfile,
  }), [profile, loading, loadedUserId, error, refresh, saveProfile, user]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile deve ser usado dentro de ProfileProvider.');
  return context;
}
