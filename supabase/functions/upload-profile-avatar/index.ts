// @ts-nocheck -- arquivo Deno; compilação/verificação é feita pelo runtime Supabase.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';

const BUCKET = 'vira-avatars';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_IMAGE_BYTES + 256 * 1024;
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

function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  });
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function json(request: Request, body: Record<string, unknown>, status = 200): Response {
  const headers = corsHeaders(request);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { status, headers });
}

function detectedImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

function isAdult(dateOfBirth: string): boolean {
  const birth = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (!Number.isFinite(birth.getTime())) return false;
  const today = new Date();
  let years = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < birth.getUTCDate())) years -= 1;
  return years >= 18;
}

class BodyLimitError extends Error {
  constructor() { super('request_too_large'); }
}

async function readBoundedBody(request: Request): Promise<Uint8Array> {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_MULTIPART_BYTES) {
        await reader.cancel();
        throw new BodyLimitError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

const userHandler = withSupabase({ auth: 'user' }, async (request, context) => {
  if (request.method !== 'POST') return json(request, { error: 'method_not_allowed' }, 405);
  const contentEncoding = request.headers.get('Content-Encoding');
  if (contentEncoding && contentEncoding.toLowerCase() !== 'identity') return json(request, { error: 'unsupported_content_encoding' }, 415);

  const contentLengthHeader = request.headers.get('Content-Length');
  if (contentLengthHeader !== null) {
    if (!/^\d+$/.test(contentLengthHeader)) return json(request, { error: 'invalid_content_length' }, 400);
    const contentLength = Number(contentLengthHeader);
    if (!Number.isSafeInteger(contentLength)) return json(request, { error: 'invalid_content_length' }, 400);
    if (contentLength > MAX_MULTIPART_BYTES) return json(request, { error: 'request_too_large' }, 413);
  }
  if (!(request.headers.get('Content-Type') ?? '').toLowerCase().startsWith('multipart/form-data;')) {
    return json(request, { error: 'multipart_form_required' }, 415);
  }

  const { data: authData, error: authError } = await context.supabase.auth.getUser();
  if (authError || !authData.user) return json(request, { error: 'unauthorized' }, 401);

  const { data: profile, error: profileError } = await context.supabase
    .from('profiles')
    .select('avatar_path, date_of_birth, onboarding_completed, adult_attested, adult_attested_at')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileError) return json(request, { error: 'profile_lookup_failed' }, 500);
  if (!profile) return json(request, { error: 'profile_not_found' }, 404);
  if (!profile.onboarding_completed || !profile.adult_attested || !profile.adult_attested_at || !profile.date_of_birth || !isAdult(profile.date_of_birth)) {
    return json(request, { error: 'adult_onboarding_and_attestation_required' }, 403);
  }

  let form: FormData;
  try {
    const body = await readBoundedBody(request);
    if (body.byteLength === 0) return json(request, { error: 'image_file_required' }, 400);
    const headers = new Headers(request.headers);
    headers.delete('Content-Length');
    headers.delete('Transfer-Encoding');
    const parserRequest = new Request(request.url, { method: 'POST', headers, body });
    form = await parserRequest.formData();
  } catch (error) {
    if (error instanceof BodyLimitError) return json(request, { error: 'request_too_large' }, 413);
    return json(request, { error: 'multipart_form_invalid' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return json(request, { error: 'image_file_required' }, 400);
  if (file.size < 1) return json(request, { error: 'empty_image' }, 400);
  if (file.size > MAX_IMAGE_BYTES) return json(request, { error: 'image_too_large' }, 413);
  if (!ALLOWED_TYPES.has(file.type)) return json(request, { error: 'unsupported_image_type' }, 415);

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return json(request, { error: 'image_read_failed' }, 400);
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) return json(request, { error: 'image_too_large' }, 413);
  const detectedType = detectedImageType(bytes);
  if (!detectedType || detectedType !== file.type) return json(request, { error: 'image_content_mismatch' }, 415);

  const path = `${authData.user.id}/manual-${crypto.randomUUID()}`;
  const { error: uploadError } = await context.supabase.storage.from(BUCKET).upload(path, bytes, {
    cacheControl: '60',
    contentType: detectedType,
    upsert: false,
  });
  if (uploadError) return json(request, { error: 'storage_upload_failed' }, 500);

  let updateQuery = context.supabase
    .from('profiles')
    .update({ avatar_path: path })
    .eq('id', authData.user.id);
  updateQuery = profile.avatar_path
    ? updateQuery.eq('avatar_path', profile.avatar_path)
    : updateQuery.is('avatar_path', null);
  const { data: updatedProfile, error: updateError } = await updateQuery
    .select('avatar_path')
    .maybeSingle();

  if (updateError || !updatedProfile) {
    await context.supabase.storage.from(BUCKET).remove([path]);
    if (updateError) return json(request, { error: 'profile_update_failed' }, 500);
    return json(request, { error: 'avatar_changed_during_upload' }, 409);
  }

  if (profile.avatar_path) await context.supabase.storage.from(BUCKET).remove([profile.avatar_path]);
  return json(request, { avatar_path: updatedProfile.avatar_path });
});

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response('Origin not allowed', { status: 403 });
  if (request.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders(request) });

  try {
    const response = await userHandler(request);
    const headers = new Headers(response.headers);
    corsHeaders(request).forEach((value, key) => headers.set(key, value));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch {
    return json(request, { error: 'avatar_upload_failed' }, 500);
  }
});
