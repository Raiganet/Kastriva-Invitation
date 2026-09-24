import AuthForm from '@/components/AuthForm';
import { publicBackend } from '@/lib/config';
export const metadata = { title: 'Kirim Ulang Konfirmasi', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <main><AuthForm mode="resend" nextPath={next} enabled={!!publicBackend()}/></main>;
}
