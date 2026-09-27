'use client';
import Link from 'next/link';import {usePathname} from 'next/navigation';
const links=[['/admin/ringkasan','Ringkasan'],['/admin','Pesanan'],['/admin/pelanggan','Pelanggan'],['/admin/cms','CMS website'],['/admin/transaksi','Transaksi'],['/admin/tamu','Tamu & RSVP'],['/admin/sistem','Sistem'],['/admin/rilis','Kesiapan rilis'],['/admin/panduan','Panduan']] as const;
export default function AdminNav(){const path=usePathname();if(path.endsWith('/preview'))return null;return <div className="admin-navigation"><nav className="container" aria-label="Menu admin">{links.map(([href,label])=><Link key={href} className={(href==='/admin'?path===href:path.startsWith(href))?'active':''} href={href}>{label}</Link>)}</nav></div>;}
