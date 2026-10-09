import {test,expect,type Page} from '@playwright/test';
import templates from '../data/templates.json';

async function openKeepsakes(page:Page,theme='botanical-blush',extra=''){
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(`/test-fixtures/invitation?theme=${theme}&gifts=multi${extra}`);
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 const gifts=page.locator('.inv-gifts');
 await gifts.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 return gifts;
}

for(const theme of templates.filter(t=>t.active))test(`keepsake edition fits long account details and message cards: ${theme.slug}`,async({page})=>{
 await page.setViewportSize({width:320,height:740});
 const gifts=await openKeepsakes(page,theme.slug),summary=gifts.locator('summary');
 await expect(gifts.locator('.gift-number')).toHaveCount(2);
 await expect(gifts.locator('.gift-number').first()).not.toBeVisible();
 await summary.click();
 await expect(summary).toContainText('Tutup rekening');
 for(const card of await gifts.locator('.gift-account').all()){
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('.gift-number')).toBeVisible();
  expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 }
 await expect(gifts.locator('.gift-number').nth(1)).toHaveText('000000000000000000000000000000');
 const wishes=page.locator('[data-demo-wish]');await expect(wishes).toHaveCount(3);
 await wishes.first().scrollIntoViewIfNeeded();
 await expect(wishes.first()).toHaveCSS('opacity','1');
 expect(await page.locator('.invitation').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 const form=page.locator('.rsvp-form');await form.scrollIntoViewIfNeeded();
 await form.locator('input[name=name]').focus();
 await expect(form.locator('input[name=name]')).toHaveCSS('font-size','16px');
 expect(await form.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await summary.click();await expect(gifts.locator('.gift-number').first()).not.toBeVisible();
});

test('keepsake edition copies only the selected account and keeps success or failure beside its card',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value:string)=>new Promise<void>(resolve=>{Object.assign(window,{__giftCopy:value,__finishGiftCopy:resolve});})}}));
 const gifts=await openKeepsakes(page);
 await gifts.locator('summary').click();
 const cards=gifts.locator('.gift-account'),button=cards.nth(1).getByRole('button');
 await button.click();await expect(button).toBeDisabled();
 expect(await page.evaluate(()=>(window as Window&{__giftCopy?:string}).__giftCopy)).toBe('000000000000000000000000000000');
 await page.evaluate(()=>(window as Window&{__finishGiftCopy?:()=>void}).__finishGiftCopy?.());
 await expect(cards.nth(1).getByRole('status')).toHaveText('Nomor contoh disalin. Jangan digunakan untuk transfer.');
 await expect(cards.first().getByRole('status')).toBeEmpty();
 await expect(button).toBeEnabled();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}}}));
 await cards.first().getByRole('button').click();
 await expect(cards.first().getByRole('status')).toContainText('Salin nomor secara manual');
 await expect(cards.first().locator('.gift-number')).toHaveCSS('user-select','all');
});

test('keepsake edition opens by keyboard, replays the envelope and respects live reduced motion',async({page})=>{
 const gifts=await openKeepsakes(page),summary=gifts.locator('summary');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await summary.focus();await page.keyboard.press('Enter');
 await expect(gifts.locator('details')).toHaveAttribute('open','');
 const surface=gifts.locator('.gift-account-surface').first();
 await expect(surface).toHaveCSS('animation-name','invitation-gift-unfold');
 await expect(gifts.locator('.gift-envelope-flap')).not.toHaveCSS('transform','none');
 await page.keyboard.press('Tab');await expect(gifts.locator('.gift-account').first().getByRole('button')).toBeFocused();
 await expect(surface).toHaveCSS('animation-name','none');
 await summary.focus();await page.keyboard.press('Space');
 await expect(gifts.locator('.gift-number').first()).not.toBeVisible();
 await page.keyboard.press('Enter');await expect(surface).toHaveCSS('animation-name','invitation-gift-unfold');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(surface).toHaveCSS('animation-name','none');
 await expect(gifts.locator('.gift-envelope-letter')).toHaveCSS('transition-duration','0s');
});

test('keepsake edition does not invent accounts for an incomplete customer draft',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/test-fixtures/invitation?theme=botanical-blush&gifts=empty&mode=draft');
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 await expect(page.locator('.inv-gifts')).toHaveCount(0);
 await expect(page.locator('[data-demo-wish]')).toHaveCount(0);
});
