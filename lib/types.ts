export type Template = {
  slug: string; name: string; category: string; description: string; price: number;
  thumbnail: string; colors: [string, string, string]; features: string[]; active: boolean;
};
export type InvitationEvent = {
  id: string; label: string; eventDate: string; eventTime: string; endTime: string;
  timezone: 'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura';
  venue: string; address: string; mapUrl: string;
};
export type DraftContent = {
  groom: string; bride: string; groomParents: string; brideParents: string;
  eventDate: string; eventTime: string; endTime: string;
  timezone: 'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura';
  venue: string; address: string; mapUrl: string; opening: string; story: string; photoPaths: string[];
  /** Optional for drafts created before stage 3. First event mirrors the legacy fields. */
  events?: InvitationEvent[];
  music?: 'none' | 'serenade';
  gifts?: GiftAccount[];
};
export type GiftAccount = { bank: string; account: string; holder: string };
export type Invitation = {
  id: string; owner_id: string; theme_slug: string; content: DraftContent;
  revision: number; last_request_id: string; created_at: string; updated_at: string;
};
export type Order = {
  id: string; owner_id: string; invitation_id: string; order_code: string;
  theme_slug: string; customer_email: string; customer_name: string; customer_phone: string;
  total_price: number; status: 'new' | 'contacted' | 'processing' | 'cancelled';
  snapshot: DraftContent; created_at: string;
};
