import { apiUser, readBody, json, failure, dbFailure } from '@/lib/http';
import { parseDeleteDraft } from '@/lib/account-flow';
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { db } = await apiUser(request);
    const { id } = await context.params;
    const value = parseDeleteDraft(id, await readBody(request));
    const { data, error } = await db.rpc('ki_delete_draft', { p_id: value.id, p_expected_revision: value.expected_revision });
    if (error) dbFailure(error);
    if (data?.deleted !== true) return json({ error: 'Penghapusan belum dapat dipastikan. Coba kembali.' }, 503);
    return json({ deleted: true });
  } catch (error) { return failure(error); }
}
