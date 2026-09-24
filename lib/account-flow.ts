import { safeNext, UUID, ValidationError } from './domain.ts';
export function authConfirmationUrl(origin: string, type: 'email' | 'recovery', nextPath: unknown = '/dashboard') {
  const url = new URL('/auth/confirm', origin);
  url.searchParams.set('type', type);
  if (type === 'email') url.searchParams.set('next', safeNext(nextPath));
  return url.toString();
}
export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 12 || password.length > 128) return 'Gunakan kata sandi 12–128 karakter.';
  if (password !== confirmation) return 'Konfirmasi kata sandi belum sama.';
  return null;
}
export function parseDeleteDraft(id: string, body: unknown) {
  if (!UUID.test(id) || !body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Referensi draft tidak valid.');
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(key => key !== 'expected_revision') || !Number.isSafeInteger(value.expected_revision) || Number(value.expected_revision) < 1) throw new ValidationError('Versi draft tidak valid. Muat ulang halaman.');
  return { id, expected_revision: value.expected_revision as number };
}
