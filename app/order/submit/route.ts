import { json } from '@/lib/http';
export async function POST() { return json({error:'Alur lama dinonaktifkan. Gunakan katalog, login, lalu simpan draft.'},410); }
