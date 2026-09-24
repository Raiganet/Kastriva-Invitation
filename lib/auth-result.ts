import { UUID } from './domain.ts';
import { HttpError } from './http-errors.ts';

const SESSION_CODES = new Set([
  'bad_jwt', 'no_authorization', 'session_not_found', 'session_expired',
  'refresh_token_not_found', 'refresh_token_already_used', 'user_not_found', 'user_banned',
]);
const TRANSIENT_NAMES = new Set(['AuthRetryableFetchError', 'AuthUnknownError', 'AbortError', 'TimeoutError']);
export const AUTH_UNAVAILABLE = 'Layanan akun belum dapat diperiksa. Coba lagi tanpa menghapus sesi atau mengulang perubahan.';

/** Only classify errors obtained from the Auth SDK, never a browser-supplied identity.
 * Unknown responses fail closed as unavailable, not as a successful login or a forced logout.
 * An HTTP 401/403 alone can also mean a wrong API key or proxy configuration.
 */
export function authFailureKind(error: unknown): 'session' | 'unavailable' {
  if (!error || typeof error !== 'object') return 'unavailable';
  const x = error as { name?: unknown; code?: unknown; status?: unknown };
  if (TRANSIENT_NAMES.has(String(x.name)) || x.status === 0 || x.status === 408 || x.status === 429 ||
      (typeof x.status === 'number' && x.status >= 500)) return 'unavailable';
  if (x.name === 'AuthSessionMissingError') return 'session';
  if (typeof x.code === 'string' && SESSION_CODES.has(x.code)) return 'session';
  return 'unavailable';
}

export type AuthReply<T> = { data: { user: T | null }; error: unknown };
/** Invokes the real getUser boundary supplied by the caller; never uses getSession metadata. */
export async function verifiedUser<T extends { id: string }>(getUser: () => Promise<AuthReply<T>>): Promise<T> {
  let reply: AuthReply<T>;
  try { reply = await getUser(); }
  catch (error) {
    if (authFailureKind(error) === 'session') throw new HttpError(401, 'Silakan login kembali.');
    throw new HttpError(503, AUTH_UNAVAILABLE);
  }
  if (!reply || typeof reply !== 'object' || !('error' in reply) || !reply.data ||
      typeof reply.data !== 'object' || !('user' in reply.data)) throw new HttpError(503, AUTH_UNAVAILABLE);
  if (reply.error !== null) {
    if (authFailureKind(reply.error) === 'session') throw new HttpError(401, 'Silakan login kembali.');
    throw new HttpError(503, AUTH_UNAVAILABLE);
  }
  if (reply.data.user === null) throw new HttpError(401, 'Silakan login kembali.');
  const user = reply.data.user;
  if (!user || typeof user !== 'object' || typeof user.id !== 'string' || !UUID.test(user.id)) {
    throw new HttpError(503, AUTH_UNAVAILABLE);
  }
  return user;
}

/** A failed RPC must not masquerade as a definitive role revocation. */
export function requireAdminDecision(data: unknown, error: unknown): void {
  if (error !== null || typeof data !== 'boolean') {
    throw new HttpError(503, 'Hak akses admin belum dapat diperiksa. Coba lagi setelah layanan tersedia.');
  }
  if (!data) throw new HttpError(403, 'Akses admin diperlukan.');
}
