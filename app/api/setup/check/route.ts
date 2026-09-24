import { publicBackend } from '@/lib/config';
import { checkOrigin, failure, json } from '@/lib/http';
import { probeBackend } from '@/lib/readiness';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try { checkOrigin(request); return json(await probeBackend(publicBackend())); }
  catch (error) { return failure(error); }
}
