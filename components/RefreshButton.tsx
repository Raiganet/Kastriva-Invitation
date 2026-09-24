'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
export default function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? 'Memeriksa…' : 'Periksa ulang'}</button>;
}
