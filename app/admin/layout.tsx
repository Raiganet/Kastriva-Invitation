import {requireAdmin} from '@/lib/server-auth';import AdminNav from '@/components/cms/AdminNav';
export const dynamic='force-dynamic';export const metadata={robots:{index:false,follow:false}};
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireAdmin();return <><AdminNav/>{children}</>;}
