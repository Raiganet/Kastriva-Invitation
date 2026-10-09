import {test,expect,type Page} from '@playwright/test';
import templates from '../data/templates.json';

async function fixture(page:Page,theme:string,extra=''){
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(`/test-fixtures/invitation?theme=${theme}&cover=photo&names=extended${extra}`);
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
}
async function open(page:Page){
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
}
async function fullFrame(image:ReturnType<Page['locator']>){
 await image.scrollIntoViewIfNeeded();
 await expect.poll(()=>image.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
 await expect(image).toHaveCSS('object-fit','contain');
 await expect(image).toBeVisible();
}

for(const theme of templates.filter(t=>t.active))test(`portrait edition preserves complete photos and extended names: ${theme.slug}`,async({page,isMobile})=>{
 if(isMobile)await page.setViewportSize({width:320,height:740});
 await fixture(page,theme.slug,'&aspect=landscape');
 const root=page.locator('.invitation');
 const fits=()=>root.evaluate(e=>e.scrollWidth<=e.clientWidth+1);
 const heading=page.locator('.inv-cover h1');
 await expect(heading).toContainText('MuhammadAbdurrahmanFirmansyahPratamaWiratama');
 expect(await heading.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await fullFrame(page.locator('.inv-cover img.inv-framed-photo'));
 expect(await fits()).toBe(true);
 await open(page);
 await fullFrame(page.locator('.inv-hero img.inv-framed-photo'));
 if(theme.category==='pernikahan'){
  const portraits=page.locator('.inv-portrait img, .elegant-portrait-frame img');
  await expect(portraits).toHaveCount(2);
  for(const photo of await portraits.all()){
   await fullFrame(photo);
   // A previous arch-shaped mask clipped the top corners despite object-fit.
   await expect(photo).toHaveCSS('border-top-left-radius','4px');
  }
  const names=page.locator('[data-name-long=true] h3');
  await expect(names).toHaveCount(2);
  for(const name of await names.all())expect(await name.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 }
 expect(await fits()).toBe(true);
});

for(const aspect of ['portrait','square'])test(`portrait edition keeps the whole ${aspect} image on a small phone`,async({page})=>{
 await page.setViewportSize({width:320,height:640});
 await fixture(page,'elegant-rose',`&aspect=${aspect}`);
 await fullFrame(page.locator('.inv-cover img.inv-framed-photo'));
 await open(page);
 for(const photo of await page.locator('.elegant-portrait-frame img').all())await fullFrame(photo);
});

for(const theme of ['modern-minimalist','galaxy-night'])test(`portrait edition keeps the opening button within reach on a standard phone: ${theme}`,async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(`/demo/${theme}`);await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
 await expect(page.getByRole('button',{name:/Buka undangan/})).toBeInViewport({ratio:1});
});

for(const theme of ['elegant-rose','modern-minimalist','botanical-blush','elementor-luxury-1','aurora-modern','galaxy-night'])test(`portrait edition replaces unavailable photos with labelled initials: ${theme}`,async({page})=>{
 await page.setViewportSize({width:320,height:740});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(`/test-fixtures/invitation?theme=${theme}&cover=broken&broken=true`);
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await expect(page.locator('.inv-cover .inv-photo-fallback')).toHaveAttribute('aria-label',/belum tersedia/);
 await expect(page.locator('.inv-cover .inv-photo-fallback')).toHaveCSS('display','grid');
 await expect(page.locator('.inv-cover img.inv-framed-photo')).toHaveCount(0);
 await open(page);
 await expect(page.locator('.inv-hero .inv-photo-fallback')).toBeVisible();
 // Lazy loading begins when the groom's frame reaches the viewport.
 await page.locator('.couple-grid > div, .elegant-couple-person').filter({hasText:'Muhammad Arif Firmansyah'}).scrollIntoViewIfNeeded();
 await expect(page.getByRole('img',{name:'Foto Muhammad Arif Firmansyah belum tersedia',exact:true})).toBeAttached();
 await page.goto(`/test-fixtures/invitation?theme=${theme}&photos=empty&mode=draft`);
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await expect(page.locator('.inv-cover .inv-photo-fallback')).toBeVisible();
 await open(page);
 await expect(page.locator('.inv-portrait .inv-photo-fallback, .elegant-portrait-frame .inv-photo-fallback')).toHaveCount(2);
});
