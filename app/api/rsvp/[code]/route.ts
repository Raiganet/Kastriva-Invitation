import { json } from '@/lib/http';
export async function GET() { return json({error:'RSVP publik belum diaktifkan pada tahap ini.'},410); }
export async function POST() { return GET(); }
