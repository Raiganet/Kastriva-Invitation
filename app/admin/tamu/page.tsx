import Link from 'next/link';
import {requireAdmin} from '@/lib/server-auth';
import {parsePlatform} from '@/lib/guests';
import {rsvpAppEnabled} from '@/lib/guest-server';
import {publishingAppEnabled} from '@/lib/commerce-server';
import GuestPlatformControl from '@/components/guests/GuestPlatformControl';
export const dynamic='force-dynamic';export const metadata={title:'Admin Tamu & RSVP',robots:{index:false,follow:false}};
export default async function GuestAdmin(){const {db,user}=await requireAdmin();const {data,error}=await db.rpc('ki_guest_platform_read');
 return <main className="container workspace prose"><div className="workspace-heading"><div><span className="eyebrow">KASTRIVA · PENGATURAN LAYANAN</span><h1>Tamu & RSVP.</h1><p>Aktivasi platform tanpa membuka daftar tamu privat pelanggan.</p></div><Link className="button ghost" href="/admin">← Admin</Link></div>
  {error||!data?<p className="notice error">Pengaturan belum dapat dibaca. Periksa migrasi 005 dan akses admin. Jangan menganggap fitur sudah aktif.</p>:<GuestPlatformControl owner={user.id} initial={parsePlatform(data)} appEnabled={rsvpAppEnabled()&&publishingAppEnabled()}/>}
  <section className="panel"><h2>Sebelum diaktifkan</h2><p>Uji dua akun pemilik, satu tautan tamu, pergantian kunci, moderasi ucapan, pembatasan kapasitas, retry jaringan, dan undangan yang ditarik. Matikan layanan pada database untuk penutupan global.</p><p>Pemilik mengatur daftar tamu melalui Dashboard → Tamu & RSVP. Peran admin tidak diberikan hak membaca daftar tamu undangan orang lain melalui fitur ini.</p><Link className="text-link" href="/panduan#tamu-rsvp">Panduan tamu & RSVP →</Link></section>
 </main>;
}
