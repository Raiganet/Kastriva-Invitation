import { apiUser, readBody, json, failure, dbFailure } from '@/lib/http';
import { parseSave } from '@/lib/domain';
import { getTemplate } from '@/lib/templates';
export async function POST(request: Request) {
  try {
    const {db,user} = await apiUser(request);
    const value = parseSave(await readBody(request),user.id);
    if (getTemplate(value.theme_slug)?.category !== 'pernikahan') return json({error:'Editor versi ini difokuskan untuk tema pernikahan.'},400);
    const {data,error} = await db.rpc('ki_save_draft', {p_id:value.id,p_theme:value.theme_slug,p_content:value.content,p_expected_revision:value.expected_revision,p_request_id:value.request_id});
    if(error) dbFailure(error);
    return json({draft:data});
  } catch(error) { return failure(error); }
}
