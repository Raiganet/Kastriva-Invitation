'use client';
import { useRef, useState } from 'react';
import { requestLogout } from '@/lib/logout-transport';
export default function LogoutButton() {
  const lock = useRef(false);
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  async function logout() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await requestLogout(); window.location.assign('/login'); }
    catch { setError('Logout belum dapat dipastikan. Coba lagi; jangan anggap sesi sudah tertutup.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div><button className="button ghost small" disabled={busy} onClick={logout}>
    {busy ? 'Keluar…' : 'Keluar'}</button>{error && <span role="alert">{error}</span>}</div>;
}
