import type {GiftAccount} from './types.ts';

export function completeGift(gift:GiftAccount):boolean {
 return !!gift.bank.trim() && !!gift.holder.trim() && /^[0-9]{5,30}$/.test(gift.account);
}

/** Blank lines delimit chapters; a year is shown only when supplied by the author. */
export function storyChapters(story:string) {
 return story.trim().split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=>{
  const match=/^(\d{4})\s*(?:[—–-]\s*|\n)([\s\S]+)$/.exec(paragraph.trim());
  return {label:match?.[1]||String(index+1).padStart(2,'0'),text:match?.[2]||paragraph.trim()};
 });
}
