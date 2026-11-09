// @ts-nocheck -- arquivo Deno; a verificação efetiva ocorre no runtime Supabase, não no LSP TypeScript do app.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';

const BUCKET = 'vira-avatars';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_ORIGINS = new Set([
  'https://8328-imfejuxl072isgpvi2r95-708c8afa.us5.manus.computer',
  'https://vira-cr5vxix7.manus.space',
  'https://vira-app-9ajn.onrender.com',
  'https://vira.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.has(origin);
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  });
  const origin = request.headers.get('Origin');
  if (origin && isAllowedOrigin(origin)) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function json(request: Request, body: Record<string, unknown>, status = 200): Response {
  const headers = corsHeaders(request);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { status, headers });
}

function isTrustedImageHost(url: URL): boolean {
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return host === 'graph.facebook.com'
    || host === 'googleusercontent.com'
    || host.endsWith('.googleusercontent.com')
    || host === 'fbcdn.net'
    || host.endsWith('.fbcdn.net')
    || host === 'fbsbx.com'
    || host.endsWith('.fbsbx.com');
}

function imageUrlFromValue(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.url === 'string') return record.url;
    const data = record.data;
    if (data && typeof data === 'object' && typeof (data as Record<string, unknown>).url === 'string') {
      return (data as Record<string, string>).url;
    }
  }
  return null;
}

function providerAvatarUrl(user: Record<string, unknown>): string | null {
  const metadata = (user.user_metadata && typeof user.user_metadata === 'object')
    ? user.user_metadata as Record<string, unknown>
    : {};
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const candidates: unknown[] = [metadata.avatar_url, metadata.picture, metadata.photo_url];
  for (const identity of identities) {
    if (!identity || typeof identity !== 'object') continue;
    const identityData = (identity as Record<string, unknown>).identity_data;
    if (!identityData || typeof identityData !== 'object') continue;
    const values = identityData as Record<string, unknown>;
    candidates.push(values.avatar_url, values.picture, values.photo_url);
  }
  return candidates.map(imageUrlFromValue).find((candidate) => candidate !== null) ?? null;
}

function hasGoogleOrFacebookIdentity(user: Record<string, unknown>): boolean {
  const providers = new Set<string>();
  const appMetadata = user.app_metadata && typeof user.app_metadata === 'object'
    ? user.app_metadata as Record<string, unknown>
    : {};
  if (typeof appMetadata.provider === 'string') providers.add(appMetadata.provider);
  if (Array.isArray(appMetadata.providers)) appMetadata.providers.forEach((value) => typeof value === 'string' && providers.add(value));
  if (Array.isArray(user.identities)) {
    user.identities.forEach((value) => {
      if (value && typeof value === 'object' && typeof (value as Record<string, unknown>).provider === 'string') {
        providers.add((value as Record<string, string>).provider);
      }
    });
  }
  return providers.has('google') || providers.has('facebook');
}

async function readImageResponse(startUrl: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  let currentUrl = new URL(startUrl);

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    if (!isTrustedImageHost(currentUrl)) throw new Error('untrusted_image_host');
    const response = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: { Accept: 'image/jpeg,image/png,image/webp' },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      await response.body?.cancel();
      if (!location || redirectCount === 3) throw new Error('invalid_image_redirect');
      currentUrl = new URL(location, currentUrl);
      continue;
    }
    if (!response.ok || !response.body) throw new Error('image_download_failed');

    const headerLength = Number(response.headers.get('Content-Length') ?? 0);
    if (headerLength > MAX_BYTES) {
      await response.body.cancel();
      throw new Error('image_too_large');
    }
    const responseType = (response.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(responseType)) {
      await response.body.cancel();
      throw new Error('unsupported_image_type');
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error('image_too_large');
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { bytes, contentType: responseType };
  }

  throw new Error('too_many_redirects');
}

function verifiedImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

const userHandler = withSupabase({ auth: 'user' }, async (request, context) => {
  if (request.method !== 'POST') return json(request, { error: 'method_not_allowed' }, 405);

  const { data: authData, error: authError } = await context.supabase.auth.getUser();
  if (authError || !authData.user) return json(request, { error: 'unauthorized' }, 401);
  const user = authData.user as unknown as Record<string, unknown>;
  if (!hasGoogleOrFacebookIdentity(user)) return json(request, { error: 'social_provider_required' }, 403);

  const { data: profile, error: profileError } = await context.supabase
    .from('profiles')
    .select('avatar_path, date_of_birth, onboarding_completed, adult_attested, adult_attested_at')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileError) return json(request, { error: 'profile_lookup_failed' }, 500);
  if (!profile) return json(request, { error: 'profile_not_found' }, 404);
  if (!profile.onboarding_completed || !profile.adult_attested || !profile.adult_attested_at || !profile.date_of_birth) {
    return json(request, { imported: false, reason: 'adult_onboarding_required' }, 409);
  }
  if (profile.avatar_path) return json(request, { imported: false, reason: 'photo_already_selected', avatar_path: profile.avatar_path });

  const candidateUrl = providerAvatarUrl(user);
  if (!candidateUrl) return json(request, { imported: false, reason: 'no_provider_photo' });

  let image: { bytes: Uint8Array; contentType: string };
  try {
    image = await readImageResponse(candidateUrl);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'image_download_failed';
    const status = reason === 'image_too_large' ? 413 : reason === 'unsupported_image_type' ? 415 : 422;
    return json(request, { imported: false, reason }, status);
  }

  const detectedType = verifiedImageType(image.bytes);
  if (!detectedType || detectedType !== image.contentType) {
    return json(request, { imported: false, reason: 'image_content_mismatch' }, 415);
  }

  const path = `${authData.user.id}/provider-${crypto.randomUUID()}`;
  const { error: uploadError } = await context.supabase.storage.from(BUCKET).upload(path, image.bytes, {
    cacheControl: '60',
    contentType: detectedType,
    upsert: false,
  });
  if (uploadError) return json(request, { imported: false, reason: 'storage_upload_failed' }, 500);

  const { data: updatedProfile, error: updateError } = await context.supabase
    .from('profiles')
    .update({ avatar_path: path })
    .eq('id', authData.user.id)
    .is('avatar_path', null)
    .select('avatar_path')
    .maybeSingle();
  if (updateError || !updatedProfile) {
    await context.supabase.storage.from(BUCKET).remove([path]);
    if (updateError) return json(request, { imported: false, reason: 'profile_update_failed' }, 500);
    return json(request, { imported: false, reason: 'photo_already_selected' });
  }

  return json(request, { imported: true, avatar_path: updatedProfile.avatar_path });
});

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  if (origin && !isAllowedOrigin(origin)) return new Response('Origin not allowed', { status: 403 });
  if (request.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders(request) });

  try {
    const response = await userHandler(request);
    const headers = new Headers(response.headers);
    corsHeaders(request).forEach((value, key) => headers.set(key, value));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch {
    return json(request, { error: 'avatar_import_failed' }, 500);
  }
});
