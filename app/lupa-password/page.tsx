import AuthForm from '@/components/AuthForm';
import { publicBackend } from '@/lib/config';
export const metadata={title:'Lupa Kata Sandi',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{next?:string;error?:string}>}){const p=await searchParams;return <main><AuthForm mode="forgot" nextPath={p.next} enabled={!!publicBackend()} errorLink={p.error==='link'}/></main>;}
