import OrderDetailPage from '@/components/commerce/OrderDetailPage';
export const dynamic='force-dynamic';export const metadata={title:'Verifikasi pesanan',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){return <OrderDetailPage id={(await params).id} admin/>;}
