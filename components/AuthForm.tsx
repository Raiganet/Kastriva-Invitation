'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { browserDb } from '@/lib/supabase/client';
import { safeNext } from '@/lib/domain';
import { authConfirmationUrl, validateNewPassword } from '@/lib/account-flow';
import { siteUrl } from '@/lib/config';
type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'resend';
const labels: Record<Mode, string> = { login: 'Masuk ke akun Anda', register: 'Mulai cerita Anda', forgot: 'Pulihkan akses akun', reset: 'Buat kata sandi baru', resend: 'Kirim ulang konfirmasi' };
const actions: Record<Mode, string> = { login: 'Masuk', register: 'Buat akun', forgot: 'Kirim tautan pemulihan', reset: 'Simpan kata sandi', resend: 'Kirim email konfirmasi' };
export default function AuthForm({ mode, nextPath = '/dashboard', enabled, errorLink = false }: { mode: Mode; nextPath?: string; enabled: boolean; errorLink?: boolean }) {
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(errorLink ? 'Tautan tidak valid atau kedaluwarsa. Minta tautan baru.' : ''), [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false), [cooldown, setCooldown] = useState(0); const lock = useRef(false);
  const hasPassword = ['login','register','reset'].includes(mode);
  const newPassword = mode === 'register' || mode === 'reset';
  useEffect(() => { if (cooldown <= 0) return; const timer = setTimeout(() => setCooldown(value => Math.max(0,value-1)),1000); return () => clearTimeout(timer); }, [cooldown]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current || !enabled || cooldown > 0) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email') || '').trim(); const password = String(values.get('password') || '');
    setNotice(''); setSuccess(false);
    if (newPassword) { const error = validateNewPassword(password, String(values.get('confirmation') || '')); if (error) { setNotice(error); return; } }
    lock.current = true; setBusy(true);
    try {
      const db = browserDb(); const redirectTo = authConfirmationUrl(siteUrl(), 'email', nextPath);
      if (mode === 'login') {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Login belum berhasil. Periksa email, kata sandi, dan konfirmasi email Anda.');
        window.location.assign(safeNext(nextPath)); return;
      }
      if (mode === 'register') {
        const { data, error } = await db.auth.signUp({ email, password, options: { data: { display_name: String(values.get('name') || '').trim().slice(0,100) }, emailRedirectTo: redirectTo } });
        if (error) throw new Error('Pendaftaran belum berhasil. Periksa data atau coba kembali setelah beberapa saat.');
        if (data.session) { window.location.assign(safeNext(nextPath)); return; }
        setSuccess(true); setCooldown(60);
        setNotice('Permintaan pendaftaran diproses. Periksa email untuk konfirmasi; akun yang sudah terdaftar dapat langsung masuk.');
      }
      if (mode === 'resend') {
        const { error } = await db.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
        if (error) throw new Error('Permintaan email belum dapat diproses. Coba kembali setelah beberapa saat.');
        setSuccess(true); setCooldown(60);
        setNotice('Jika akun memerlukan konfirmasi dan pengiriman email tersedia, tautan konfirmasi akan dikirim. Periksa folder spam.');
      }
      if (mode === 'forgot') {
        const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: authConfirmationUrl(siteUrl(),'recovery') });
        if (error) throw new Error('Permintaan pemulihan belum dapat diproses. Coba kembali setelah beberapa saat.');
        setSuccess(true); setCooldown(60);
        setNotice('Jika alamat terdaftar dan pengiriman email tersedia, tautan pemulihan akan dikirim. Periksa folder spam.');
      }
      if (mode === 'reset') {
        const { data: identity, error: userError } = await db.auth.getUser();
        if (userError || !identity.user) throw new Error('Buka kembali tautan pemulihan dari email sebelum mengubah kata sandi.');
        const { error } = await db.auth.updateUser({ password });
        if (error) throw new Error('Kata sandi belum berhasil diubah. Minta tautan pemulihan baru.');
        setSuccess(true); setNotice('Kata sandi berhasil diubah. Anda dapat membuka dashboard.');
      }
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : 'Permintaan gagal. Silakan coba kembali.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="auth-shell container"><div className="auth-intro"><span className="eyebrow">RUANG UNTUK CERITA ANDA</span><h1>Undangan yang terasa<br/><em>begitu personal.</em></h1><p>Simpan draft, pilih desain, dan rangkai informasi acara dalam satu tempat.</p><div className="intro-art" aria-hidden><span>♡</span><p>Every story<br/>deserves a beautiful beginning.</p></div></div>
    <section className="auth-card"><span className="eyebrow">KASTRIVA INVITATION</span><h2>{labels[mode]}</h2><p>{mode === 'login' ? 'Lanjutkan draft undangan yang sudah Anda simpan.' : mode === 'register' ? 'Demo bisa dilihat tanpa akun. Akun diperlukan untuk menyimpan draft.' : mode === 'reset' ? 'Gunakan kata sandi baru yang berbeda dari akun lain.' : 'Gunakan email yang terhubung dengan akun Anda.'}</p>
    {!enabled && <div className="notice">Backend belum dihubungkan. Form belum aktif dan tidak menerima data. <Link href="/setup">Lihat petunjuk setup.</Link></div>}
    <form onSubmit={submit}><fieldset disabled={busy || !enabled}>
      {mode === 'register' && <label>Nama Anda<input name="name" autoComplete="name" minLength={2} maxLength={100} required/></label>}
      {mode !== 'reset' && <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required/></label>}
      {hasPassword && <><label>Kata sandi<input name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={newPassword ? 12 : 1} maxLength={128} required/>{newPassword && <small>Minimal 12 karakter. Jangan gunakan password akun lain.</small>}</label>
      {newPassword && <label>Ulangi kata sandi<input name="confirmation" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={128} required/></label>}
      <button type="button" className="text-button" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}</button></>}
      {mode === 'register' && <label className="checkbox"><input type="checkbox" required/><span>Saya telah membaca <Link href="/privasi">informasi penggunaan data</Link>.</span></label>}
      <button className="button full" type="submit" disabled={cooldown > 0}>{busy ? 'Memproses…' : cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : actions[mode]}</button>
    </fieldset></form>
    {notice && <p className={`notice ${success ? 'success' : 'error'}`} role="status">{notice}</p>}{success && mode === 'reset' && <Link className="button" href="/dashboard">Buka dashboard</Link>}
    <div className="auth-links">{mode === 'login' ? <><Link href={'/daftar?next=' + encodeURIComponent(safeNext(nextPath))}>Belum punya akun? Daftar</Link><Link href="/lupa-password">Lupa kata sandi?</Link></> : <Link href={'/login?next=' + encodeURIComponent(safeNext(nextPath))}>Kembali ke halaman masuk</Link>}
      {(mode === 'login' || mode === 'register') && <Link href={'/kirim-konfirmasi?next=' + encodeURIComponent(safeNext(nextPath))}>Belum menerima email konfirmasi?</Link>}
    </div></section></div>;
}
