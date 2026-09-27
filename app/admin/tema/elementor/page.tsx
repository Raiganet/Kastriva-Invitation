import {requireAdmin} from '@/lib/server-auth';
import ElementorTrialStudio from '@/components/ElementorTrialStudio';
import {publicSite} from '@/lib/cms-server';
export const dynamic='force-dynamic';
export const metadata={title:'Percobaan template Elementor',robots:{index:false,follow:false}};
export default async function ElementorTrial(){await requireAdmin();const site=await publicSite();return <ElementorTrialStudio available={site.catalog.some(t=>t.slug==='elementor-luxury-1'&&t.active)}/>;}
