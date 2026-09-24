/** Same-origin logout: only a complete JSON acknowledgement confirms success.
 * No redirect, HTML200, truncated response or timeout is treated as signed out.
 * Does not persist credentials or automatically repeat a mutating request.
 */
export async function requestLogout(fetcher: typeof fetch = fetch, timeoutMs = 18000): Promise<void> {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw new Error('INVALID_LOGOUT_TIMEOUT');
  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let finished = false;
  let rejectTimeout: (error: Error) => void = () => {};
  const message = 'Logout belum dapat dipastikan. Coba lagi; jangan anggap sesi sudah tertutup.';
  const timeout = new Promise<never>((_, reject) => { rejectTimeout = reject; });
  const timer = setTimeout(() => {
    finished = true; rejectTimeout(new Error(message)); controller.abort();
    if (reader) void reader.cancel().catch(() => {});
  }, timeoutMs);
  try {
    await Promise.race([timeout, (async () => {
      const response = await fetcher('/api/logout', {method:'POST',credentials:'same-origin',cache:'no-store',
        redirect:'error',headers:{Accept:'application/json'},signal:controller.signal});
      if (finished) { void response.body?.cancel().catch(() => {}); throw new Error(message); }
      if (response.status !== 200 || response.redirected ||
          response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json' || !response.body) {
        void response.body?.cancel().catch(() => {}); throw new Error(message);
      }
      const declared = response.headers.get('content-length');
      if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 2048)) {
        void response.body.cancel().catch(() => {}); throw new Error(message);
      }
      reader = response.body.getReader();
      const chunks: Uint8Array[] = []; let count = 0;
      while (true) {
        const {value,done} = await reader.read();
        if (finished) throw new Error(message);
        if (done) break;
        if (value.byteLength > 2048-count) throw new Error(message);
        chunks.push(value); count += value.byteLength;
      }
      const bytes = new Uint8Array(count); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
      const data: unknown = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
      if (!data || typeof data !== 'object' || Array.isArray(data) ||
          Object.keys(data).length !== 1 || (data as {ok?:unknown}).ok !== true) throw new Error(message);
    })()]);
  } catch { throw new Error(message); }
  finally {
    clearTimeout(timer); finished = true; controller.abort();
    if (reader) { void reader.cancel().catch(() => {}); try { reader.releaseLock(); } catch { /* Pending read. */ } }
  }
}
