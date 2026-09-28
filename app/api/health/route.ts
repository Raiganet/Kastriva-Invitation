import {json} from '@/lib/http';
import {APP_VERSION} from '@/lib/release';
export const dynamic='force-dynamic';
export async function GET(){return json({app:'Kastriva Invitation',version:APP_VERSION,stage:7,status:'running',backendConnectionVerified:false,productionReadinessVerified:false});}
