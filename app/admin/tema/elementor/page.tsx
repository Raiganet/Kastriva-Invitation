import {requireAdmin} from '@/lib/server-auth';
import ElementorTrialStudio from '@/components/ElementorTrialStudio';
import './elementor-trial.css';
export const dynamic='force-dynamic';
export const metadata={title:'Percobaan template Elementor',robots:{index:false,follow:false}};
export default async function ElementorTrial(){await requireAdmin();return <ElementorTrialStudio/>;}
