'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function DeleteDraftButton({ id, revision }: { id: string; revision: number }) {
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const router = useRouter(); const lock = useRef(false);
  async function remove() {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/drafts/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expected_revision: revision }) });
      const result = await response.json();
      if (!response.ok || result.deleted !== true) throw new Error(result.error || 'Penghapusan belum dapat dipastikan. Coba kembali.');
      setConfirm(false); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Penghapusan belum berhasil.'); }
    finally { setBusy(false); lock.current = false; }
  }
  if (!confirm) return <button type="button" className="button ghost small danger-text" onClick={() => { setError(''); setConfirm(true); }}>Hapus draft</button>;
  return <div className="delete-confirm" role="group" aria-label="Konfirmasi hapus draft"><strong>Hapus draft ini?</strong><p>Data draft tidak bisa dipulihkan. Foto di Storage tidak ikut dihapus. Draft yang sudah diajukan untuk pengerjaan tidak dapat dihapus.</p>
    <div className="button-row"><button type="button" className="button small" disabled={busy} onClick={remove}>{busy ? 'Menghapus…' : 'Ya, hapus draft'}</button><button type="button" className="button ghost small" disabled={busy} onClick={() => setConfirm(false)}>Batal</button></div>{error && <p className="notice error" role="status">{error}</p>}</div>;
}
