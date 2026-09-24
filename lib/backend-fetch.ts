import { HttpError } from './http-errors.ts';

export type BackendFetchOptions = {
  origin: string;
  timeoutMs?: number;
  maxBytes?: number;
  fetcher?: typeof fetch;
};

/** Server SDK adapter: one deadline covers headers AND body, even with a caller signal.
 * Buffers at most maxBytes of decoded response data before the SDK can create a Blob/JSON.
 * Does not follow redirects or forward credentials to a different origin.
 */
export function createBoundedBackendFetch(options: BackendFetchOptions): typeof fetch {
  const base = new URL(options.origin);
  if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('INVALID_BACKEND_ORIGIN');
  }
  const timeoutMs = options.timeoutMs ?? 15000;
  const maxBytes = options.maxBytes ?? 5 * 1024 * 1024;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000 ||
      !Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > 8 * 1024 * 1024) {
    throw new Error('INVALID_BACKEND_FETCH_POLICY');
  }
  const upstream = options.fetcher ?? fetch;
  return async (input, init) => {
    const target = new URL(input instanceof Request ? input.url : String(input));
    if (target.origin !== base.origin || target.username || target.password || target.hash) {
      throw new HttpError(503, 'Tujuan layanan backend tidak diizinkan.');
    }
    const controller = new AbortController();
    const caller = init?.signal ?? (input instanceof Request ? input.signal : null);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let stopped = false;
    let rejectAbort: (reason: unknown) => void = () => {};
    const interrupted = new Promise<never>((_, reject) => { rejectAbort = reject; });
    const stop = (message: string) => {
      if (stopped) return;
      stopped = true;
      // Reject first: a network implementation may ignore AbortSignal or cancel().
      rejectAbort(new HttpError(503, message));
      controller.abort();
      if (reader) void reader.cancel().catch(() => {});
    };
    const onAbort = () => stop('Permintaan backend dibatalkan. Status penulisan mungkin belum pasti.');
    caller?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => stop('Backend melewati batas waktu. Status penulisan mungkin belum pasti.'), timeoutMs);
    if (caller?.aborted) onAbort();

    try {
      return await Promise.race([
        interrupted,
        (async () => {
          if (stopped) throw new HttpError(503, 'Permintaan backend dibatalkan.');
          const response = await upstream(input, { ...init, cache: 'no-store', redirect: 'error', signal: controller.signal });
          if (stopped) { void response.body?.cancel().catch(() => {}); throw new HttpError(503, 'Permintaan backend telah berakhir.'); }
          if (response.redirected || (response.status >= 300 && response.status < 400) ||
              (response.url && new URL(response.url).origin !== base.origin)) {
            void response.body?.cancel().catch(() => {});
            throw new HttpError(503, 'Pengalihan backend tidak diizinkan.');
          }
          const declared = response.headers.get('content-length');
          if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)) || Number(declared) > maxBytes)) {
            void response.body?.cancel().catch(() => {});
            throw new HttpError(503, 'Ukuran balasan backend tidak sesuai batas.');
          }
          if (!response.body) return response;
          reader = response.body.getReader();
          const parts: Uint8Array[] = [];
          let size = 0;
          while (!stopped) {
            const { value, done } = await reader.read();
            if (stopped) throw new HttpError(503, 'Permintaan backend telah berakhir.');
            if (done) break;
            if (value.byteLength > maxBytes - size) throw new HttpError(503, 'Balasan backend melebihi batas ukuran.');
            size += value.byteLength;
            parts.push(value);
          }
          const body = new Uint8Array(size);
          let offset = 0;
          for (const part of parts) { body.set(part, offset); offset += part.byteLength; }
          const headers = new Headers(response.headers);
          // Fetch already decodes content-encoding; reconstructed body must not advertise compression.
          headers.delete('content-encoding'); headers.delete('transfer-encoding');
          headers.set('content-length', String(size));
          return new Response(body, { status: response.status, statusText: response.statusText, headers });
        })(),
      ]);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      // Never include a URL, access key or upstream response text in an error.
      throw new HttpError(503, 'Layanan backend belum dapat dihubungi. Status penulisan mungkin belum pasti.');
    } finally {
      clearTimeout(timer);
      caller?.removeEventListener('abort', onAbort);
      stopped = true;
      controller.abort();
      if (reader) { void reader.cancel().catch(() => {}); try { reader.releaseLock(); } catch { /* Pending read/cancel. */ } }
    }
  };
}
