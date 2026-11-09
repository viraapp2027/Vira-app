import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase/client';
import type { Profile, ProfileUpdate } from '../../types/profile';

const AVATAR_BUCKET = 'vira-avatars';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function detectedImageType(file: File): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

interface ProfileContextValue {
  profile: Profile | null;
  avatarUrl: string | null;
  avatarImportNotice: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveProfile: (update: ProfileUpdate) => Promise<Profile>;
  uploadAvatar: (file: File) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

function hasSocialIdentity(user: User): boolean {
  const providers = new Set<string>();
  const appProvider = user.app_metadata?.provider;
  if (typeof appProvider === 'string') providers.add(appProvider);
  const linkedProviders = user.app_metadata?.providers;
  if (Array.isArray(linkedProviders)) linkedProviders.forEach((provider) => typeof provider === 'string' && providers.add(provider));
  user.identities?.forEach((identity) => providers.add(identity.provider));
  return providers.has('google') || providers.has('facebook');
}

async function signedAvatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!supabase || !path) return null;
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 600);
  return error ? null : data.signedUrl;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userRef = useRef<User | null>(user);
  userRef.current = user;
  const refreshRequestId = useRef(0);
  const attemptedImportFor = useRef<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarImportNotice, setAvatarImportNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const profileRef = useRef<Profile | null>(profile);
  profileRef.current = profile;

  const refresh = useCallback(async () => {
    const requestId = ++refreshRequestId.current;
    if (!supabase || !user) {
      setProfile(null);
      setAvatarUrl(null);
      setAvatarImportNotice(null);
      setError(null);
      setLoading(false);
      setLoadedUserId(null);
      return;
    }

    setLoading(true);
    setError(null);
    setAvatarImportNotice(null);
    setProfile(null);
    setAvatarUrl(null);
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (requestId !== refreshRequestId.current || userRef.current?.id !== user.id) return;
    if (queryError) {
      setError('Não foi possível carregar seu perfil. Tente novamente.');
      setProfile(null);
    } else {
      let nextProfile = (data as Profile | null) ?? null;
      if (!nextProfile) {
        const { data: repairedProfile, error: repairError } = await supabase.rpc('ensure_my_profile');
        if (repairError) {
          setError('Não foi possível preparar seu perfil. Tente novamente.');
          setProfile(null);
          setLoadedUserId(user.id);
          setLoading(false);
          return;
        }
        nextProfile = (repairedProfile as Profile | null) ?? null;
      }
      const nextAvatarUrl = await signedAvatarUrl(nextProfile?.avatar_path);
      if (requestId !== refreshRequestId.current || userRef.current?.id !== user.id) return;
      setProfile(nextProfile);
      setAvatarUrl(nextAvatarUrl);
    }
    setLoadedUserId(user.id);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const refreshAvatarUrl = useCallback(async (path: string, ownerId: string) => {
    const nextUrl = await signedAvatarUrl(path);
    if (userRef.current?.id === ownerId && profileRef.current?.avatar_path === path) setAvatarUrl(nextUrl);
  }, []);

  useEffect(() => {
    if (!user || !profile?.avatar_path) return;
    const path = profile.avatar_path;
    const ownerId = user.id;
    const renewIfVisible = () => {
      if (document.visibilityState === 'visible') void refreshAvatarUrl(path, ownerId);
    };
    const interval = window.setInterval(renewIfVisible, 8 * 60 * 1000);
    window.addEventListener('focus', renewIfVisible);
    document.addEventListener('visibilitychange', renewIfVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', renewIfVisible);
      document.removeEventListener('visibilitychange', renewIfVisible);
    };
  }, [user?.id, profile?.avatar_path, refreshAvatarUrl]);

  useEffect(() => {
    if (!user) {
      attemptedImportFor.current = null;
      setAvatarImportNotice(null);
      return;
    }
    if (loadedUserId !== user.id) return;
    if (!supabase || !profile || !profile.onboarding_completed || !profile.adult_attested || !profile.adult_attested_at || !profile.date_of_birth || profile.avatar_path || !hasSocialIdentity(user)) return;
    if (attemptedImportFor.current === user.id) return;

    attemptedImportFor.current = user.id;
    let active = true;
    void supabase.functions.invoke('import-provider-avatar').then(async ({ data, error: functionError }) => {
      if (!active) return;
      if (functionError) {
        setAvatarImportNotice('Não conseguimos importar automaticamente a foto do provedor. Você pode escolher uma imagem em Editar perfil.');
        return;
      }
      if (data?.avatar_path) {
        setAvatarImportNotice(null);
        await refresh();
      } else if (data?.reason !== 'photo_already_selected') {
        setAvatarImportNotice('O provedor não disponibilizou uma foto válida. Se quiser, escolha uma imagem em Editar perfil.');
      }
    }).catch(() => {
      if (active) setAvatarImportNotice('Não conseguimos importar automaticamente a foto do provedor. Você pode escolher uma imagem em Editar perfil.');
    });
    return () => { active = false; };
  }, [user, profile, loadedUserId, refresh]);

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
    if (userRef.current?.id === user.id) setProfile(nextProfile);
    return nextProfile;
  }, [user]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!supabase || !user) throw new Error('Entre na sua conta para enviar uma foto.');
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) throw new Error('Escolha uma imagem JPEG, PNG ou WebP.');
    if (file.size > MAX_AVATAR_BYTES) throw new Error('A imagem deve ter no máximo 5 MB.');
    if (await detectedImageType(file) !== file.type) throw new Error('O conteúdo do arquivo não corresponde a uma imagem JPEG, PNG ou WebP.');

    const formData = new FormData();
    formData.append('file', file, file.name || 'avatar');
    const { data, error: uploadError } = await supabase.functions.invoke('upload-profile-avatar', { body: formData });
    if (uploadError || !data?.avatar_path) throw new Error('Não foi possível enviar a foto. Confira sua conexão e tente novamente.');
    if (userRef.current?.id === user.id) {
      setAvatarImportNotice(null);
      await refresh();
    }
  }, [refresh, user]);

  const visibleProfile = user && loadedUserId === user.id ? profile : null;
  const visibleAvatarUrl = user && loadedUserId === user.id ? avatarUrl : null;
  const value = useMemo(() => ({
    profile: visibleProfile,
    avatarUrl: visibleAvatarUrl,
    avatarImportNotice: user && loadedUserId === user.id ? avatarImportNotice : null,
    loading: Boolean(user && (loading || loadedUserId !== user.id)),
    error,
    refresh,
    saveProfile,
    uploadAvatar,
  }), [visibleProfile, visibleAvatarUrl, avatarImportNotice, loading, loadedUserId, error, refresh, saveProfile, uploadAvatar, user]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile deve ser usado dentro de ProfileProvider.');
  return context;
}
