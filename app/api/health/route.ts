import {json} from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(){return json({app:'Kastriva Invitation',version:'1.7.3',stage:7,status:'running',backendConnectionVerified:false,productionReadinessVerified:false});}
