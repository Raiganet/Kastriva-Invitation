import type { DraftContent, InvitationEvent } from './types.ts';
import {isInvitationMusic} from './music-library.ts';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const ORDER_STATUSES = ['new', 'contacted', 'processing', 'cancelled'] as const;
export const STATUS_LABEL: Record<string, string> = { new: 'Permintaan baru', contacted: 'Sudah dihubungi', processing: 'Sedang disiapkan', cancelled: 'Dibatalkan' };
export const blankContent: DraftContent = {
  groom: '', bride: '', groomParents: '', brideParents: '', eventDate: '', eventTime: '08:00', endTime: '14:00',
  timezone: 'Asia/Jakarta', venue: '', address: '', mapUrl: '', opening: 'Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir di hari istimewa kami.', story: '', photoPaths: [],
};
export class ValidationError extends Error { constructor(message: string) { super(message); this.name = 'ValidationError'; } }
export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('Format data tidak valid.');
  return value as Record<string, unknown>;
}
export function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string') throw new ValidationError(`${label} harus berupa teks.`);
  const result = value.trim();
  if (result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(result)) throw new ValidationError(`${label} terlalu panjang atau tidak valid.`);
  return result;
}
export function safeNext(value: unknown): string {
  if (typeof value !== 'string' || value.length > 1000 || /[\\\r\n\u0000]/.test(value)) return '/dashboard';
  if (!/^\/(dashboard|admin)(?:\/|\?|$)/.test(value)) return '/dashboard';
  try {
    const u = new URL(value, 'https://internal.invalid');
    if (u.origin !== 'https://internal.invalid' || !/^\/(dashboard|admin)(?:\/|$)/.test(u.pathname)) return '/dashboard';
    return u.pathname + u.search;
  } catch { return '/dashboard'; }
}
export function httpsUrl(value: unknown, label = 'Tautan'): string {
  if (value === '') return '';
  const str = text(value, label, 1000);
  try {
    const u = new URL(str);
    if (u.protocol !== 'https:' || u.username || u.password) throw new Error();
    return u.toString();
  } catch { throw new ValidationError(`${label} harus URL https yang valid.`); }
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value && Number(value.slice(0,4)) >= 2020;
}
export function parseDraft(value: unknown, ownerId: string, editing = false): DraftContent {
  const x = asRecord(value);
  if (Object.keys(x).some(k => !Object.hasOwn(blankContent,k) && !['events','music','gifts'].includes(k))) throw new ValidationError('Kolom draft tidak dikenal.');
  if (x.music !== undefined && !isInvitationMusic(x.music)) throw new ValidationError('Pilihan musik tidak dikenal.');
  const gifts = x.gifts === undefined ? undefined : parseGifts(x.gifts);
  const eventDate = text(x.eventDate, 'Tanggal', 10);
  if (!editing && eventDate && !validDate(eventDate)) throw new ValidationError('Tanggal acara tidak valid.');
  const eventTime = text(x.eventTime, 'Jam mulai', 5), endTime = text(x.endTime, 'Jam selesai', 5);
  if (!editing && ![eventTime,endTime].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) throw new ValidationError('Jam acara tidak valid.');
  if (!editing && endTime <= eventTime) throw new ValidationError('Jam selesai harus setelah jam mulai pada tanggal yang sama.');
  if (!['Asia/Jakarta','Asia/Makassar','Asia/Jayapura'].includes(String(x.timezone))) throw new ValidationError('Zona waktu tidak valid.');
  if (!Array.isArray(x.photoPaths) || x.photoPaths.length > 6) throw new ValidationError('Maksimal 6 foto pada fondasi ini.');
  const photoPaths = x.photoPaths.map(p => {
    if (typeof p !== 'string' || !isOwnedPhoto(p, ownerId)) throw new ValidationError('Foto bukan milik akun ini.');
    return p;
  });
  if (new Set(photoPaths).size !== photoPaths.length) throw new ValidationError('Foto yang sama tidak boleh ditambahkan dua kali.');
  const events = x.events === undefined ? undefined : parseEvents(x.events, editing);
  const content: DraftContent = {
    groom: text(x.groom, 'Nama mempelai pria', 100), bride: text(x.bride,'Nama mempelai wanita',100),
    groomParents: text(x.groomParents,'Keluarga pria',200), brideParents: text(x.brideParents,'Keluarga wanita',200),
    eventDate, eventTime, endTime, timezone: x.timezone as DraftContent['timezone'],
    venue: text(x.venue,'Nama tempat',200), address: text(x.address,'Alamat',500), mapUrl: editing ? text(x.mapUrl,'Lokasi',1000) : httpsUrl(x.mapUrl,'Lokasi'),
    opening: text(x.opening,'Pembuka',1000), story: text(x.story,'Cerita',4000), photoPaths, ...(events ? {events} : {}),
    ...(x.music !== undefined ? {music:x.music as DraftContent['music']} : {}), ...(gifts ? {gifts} : {}),
  };
  if (events && EVENT_FIELDS.some(key => content[key] !== events[0][key])) throw new ValidationError('Ringkasan acara harus sesuai acara pertama.');
  return content;
}

export function parseGifts(value:unknown): NonNullable<DraftContent['gifts']> {
 if (!Array.isArray(value) || value.length > 3) throw new ValidationError('Maksimal 3 rekening hadiah.');
 return value.map(raw=>{
  const row=asRecord(raw);
  if (Object.keys(row).length!==3 || Object.keys(row).some(k=>!['bank','account','holder'].includes(k))) throw new ValidationError('Kolom rekening hadiah tidak sesuai.');
  const bank=text(row.bank,'Bank / dompet digital',60),account=text(row.account,'Nomor rekening hadiah',30),holder=text(row.holder,'Pemilik rekening hadiah',100);
  if (/[\u0000-\u001f\u007f]/.test(bank+holder)) throw new ValidationError('Nama bank dan pemilik rekening harus satu baris.');
  if (!/^[0-9]{0,30}$/.test(account)) throw new ValidationError('Nomor rekening hadiah hanya boleh berisi angka, termasuk awalan nol.');
  return {bank,account,holder};
 });
}

export const EVENT_FIELDS = ['eventDate','eventTime','endTime','timezone','venue','address','mapUrl'] as const;
export function parseEvents(value: unknown, editing = false): InvitationEvent[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) throw new ValidationError('Isi 1 sampai 3 acara.');
  const ids = new Set<string>();
  return value.map((raw, index) => {
    const x = asRecord(raw);
    const allowed: string[] = ['id','label',...EVENT_FIELDS];
    if (Object.keys(x).length !== allowed.length || Object.keys(x).some(key => !allowed.includes(key))) throw new ValidationError('Kolom acara tidak dikenal atau belum lengkap.');
    const id = text(x.id, 'ID acara', 64);
    if (!/^[a-z0-9-]{1,64}$/.test(id) || ids.has(id)) throw new ValidationError('ID acara harus unik dan valid.');
    ids.add(id);
    const eventDate = text(x.eventDate, 'Tanggal acara', 10);
    const eventTime = text(x.eventTime, 'Jam mulai', 5), endTime = text(x.endTime, 'Jam selesai', 5);
    if (!editing && eventDate && !validDate(eventDate)) throw new ValidationError(`Tanggal acara ${index + 1} tidak valid.`);
    if (!editing && (![eventTime,endTime].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) || endTime <= eventTime)) throw new ValidationError(`Jam selesai acara ${index + 1} harus setelah jam mulai pada hari yang sama.`);
    if (!['Asia/Jakarta','Asia/Makassar','Asia/Jayapura'].includes(String(x.timezone))) throw new ValidationError('Zona waktu acara tidak valid.');
    return {id, label: text(x.label,'Nama acara',80), eventDate,eventTime,endTime,timezone:x.timezone as InvitationEvent['timezone'],venue:text(x.venue,'Tempat',200),address:text(x.address,'Alamat',500),mapUrl: editing ? text(x.mapUrl,'Lokasi',1000) : httpsUrl(x.mapUrl,'Lokasi')};
  });
}
/** Backwards-compatible projection; does not mutate or persist an old draft on read. */
export function invitationEvents(content: DraftContent): InvitationEvent[] {
  if (content.events?.length) return content.events;
  return [{ id: 'main-event', label: 'Akad & resepsi', ...Object.fromEntries(EVENT_FIELDS.map(key => [key,content[key]])) } as InvitationEvent];
}
export function withEvents(content: DraftContent, events: InvitationEvent[]): DraftContent {
  if (!events.length || events.length > 3) throw new ValidationError('Isi 1 sampai 3 acara.');
  return {...content,...Object.fromEntries(EVENT_FIELDS.map(key => [key,events[0][key]])), events:events.map(event => ({...event}))};
}
export function eventDateLabel(value: string): string {
  return validDate(value) ? new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z')) : 'Tanggal belum lengkap';
}
export function safeMapHref(value: string): string {
  try { return httpsUrl(value); } catch { return ''; }
}

export function isOwnedPhoto(path: string, ownerId: string): boolean {
  const [owner,filename,...rest] = path.split('/');
  if (!UUID.test(ownerId) || owner !== ownerId || rest.length || !filename) return false;
  const match = /^(.+)\.(webp|jpg|png)$/.exec(filename);
  return !!match && UUID.test(match[1]);
}
export function parseSave(value: unknown, ownerId: string) {
  const x = asRecord(value);
  if (Object.keys(x).some(k => !['id','theme_slug','content','expected_revision','request_id'].includes(k))) throw new ValidationError('Kolom permintaan tidak dikenal.');
  if (!UUID.test(String(x.id)) || !UUID.test(String(x.request_id))) throw new ValidationError('ID tidak valid.');
  if (!Number.isSafeInteger(x.expected_revision) || Number(x.expected_revision) < 0) throw new ValidationError('Versi draft tidak valid.');
  if (typeof x.theme_slug !== 'string' || !/^[a-z0-9-]{1,60}$/.test(x.theme_slug)) throw new ValidationError('Tema tidak valid.');
  return { id: x.id as string, theme_slug: x.theme_slug, content: parseDraft(x.content,ownerId), expected_revision: x.expected_revision as number, request_id: x.request_id as string };
}
export function parseOrder(value: unknown) {
  const x = asRecord(value);
  if (Object.keys(x).some(k => !['invitation_id','customer_name','customer_phone','consent'].includes(k))) throw new ValidationError('Kolom pesanan tidak dikenal; harga dan status ditentukan server.');
  if (!UUID.test(String(x.invitation_id))) throw new ValidationError('Undangan tidak valid.');
  const name = text(x.customer_name,'Nama pelanggan',100);
  const phone = text(x.customer_phone,'Nomor WhatsApp',20).replace(/[\s+-]/g,'').replace(/^0/,'62');
  if (name.length < 2 || !/^62\d{8,13}$/.test(phone)) throw new ValidationError('Nama atau nomor WhatsApp tidak valid.');
  if (x.consent !== true) throw new ValidationError('Persetujuan pemrosesan data diperlukan.');
  return { invitation_id: String(x.invitation_id), customer_name: name, customer_phone: phone };
}
export function eventInstant(content: Pick<DraftContent,'eventDate'|'eventTime'|'timezone'>): number {
  if (!validDate(content.eventDate)) return NaN;
  const offsets: Record<string,string> = { 'Asia/Jakarta': '+07:00', 'Asia/Makassar': '+08:00', 'Asia/Jayapura': '+09:00' };
  return Date.parse(`${content.eventDate}T${content.eventTime}:00${offsets[content.timezone] ?? '+07:00'}`);
}
export function countdown(target: number, now: number) {
  const diff = Number.isFinite(target) ? Math.max(0, Math.floor((target-now)/1000)) : 0;
  return [Math.floor(diff/86400), Math.floor(diff%86400/3600), Math.floor(diff%3600/60), diff%60];
}
export function currency(value: number) { return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value); }
export function safeGuest(value: unknown): string { return typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g,'').trim().slice(0,100) || 'Tamu Undangan' : 'Tamu Undangan'; }
export function calendarFile(content: DraftContent, uid: string): string {
  const start = eventInstant(content), end = eventInstant({...content,eventTime: content.endTime});
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new ValidationError('Tanggal/jam belum lengkap.');
  const dt = (value: number) => new Date(value).toISOString().replace(/[-:]/g,'').replace('.000','');
  const escape = (s: string) => s.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kastriva//Invitation//ID','BEGIN:VEVENT',`UID:${escape(uid)}@kastriva`, `DTSTAMP:${dt(Date.now())}`,`DTSTART:${dt(start)}`,`DTEND:${dt(end)}`,`SUMMARY:${escape([content.groom,content.bride].filter(Boolean).join(' & '))}`,`LOCATION:${escape(content.venue+' '+content.address)}`,'END:VEVENT','END:VCALENDAR'];
  // RFC 5545: fold at 75 octets, never splitting a UTF-8 code point.
  return lines.map(line => { let out='',length=0; for (const ch of line) { const bytes = new TextEncoder().encode(ch).length; if(length+bytes>75){out+='\r\n ';length=1;}out+=ch;length+=bytes;}return out; }).join('\r\n')+'\r\n';
}
