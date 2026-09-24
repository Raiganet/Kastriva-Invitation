import type {Metadata} from 'next';
import MarketingHome from '@/components/cms/MarketingHome';
import {publicSite} from '@/lib/cms-server';
export const dynamic='force-dynamic';
export const revalidate=0;
export async function generateMetadata():Promise<Metadata>{const s=await publicSite();return{title:{absolute:s.content.seoTitle},description:s.content.seoDescription,robots:{index:s.source==='database'&&s.content.allowIndex,follow:s.source==='database'&&s.content.allowIndex}};}
export default async function Home(){const s=await publicSite();return <MarketingHome content={s.content} catalog={s.catalog} source={s.source}/>;}
