import {test,expect} from '@playwright/test';

for(const theme of ['elegant-rose','modern-minimalist','corporate-event','adat-jawa','aqiqah-blessing','aurora-modern'])test(`ornament ink reveals with its chapter and respects motion preferences: ${theme}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(`/demo/${theme}`);
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 await page.getByRole('button',{name:'Jeda gulir',exact:true}).click();
 const chapter=page.locator('.inv-section').filter({has:page.getByRole('heading',{name:'Waktu & tempat',exact:true})});
 await page.getByRole('navigation',{name:'Bagian undangan'}).getByRole('button',{name:'Acara',exact:true}).click();
 await expect(chapter).toHaveClass(/inv-motion-visible/);
 const ink=chapter.locator('.inv-ornament-start .inv-ornament-ink');
 await expect(ink).toHaveCSS('animation-name','signature-ink');
 await expect.poll(()=>ink.evaluate(e=>Number(e.getAnimations()[0]?.currentTime??0))).toBeGreaterThan(100);
 // Allow the real animation to finish even when parallel browser rendering is throttled.
 await expect(ink).toHaveCSS('stroke-dashoffset','0px',{timeout:15000});
 await page.locator('.inv-closing').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(chapter).not.toHaveClass(/inv-motion-visible/);
 expect(await ink.evaluate(e=>e.getAnimations().length)).toBe(0);
 await chapter.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(chapter).toHaveClass(/inv-motion-visible/);
 await expect(ink).toHaveCSS('animation-name','signature-ink');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(ink).toHaveCSS('animation-play-state','paused');
 await page.evaluate(()=>{delete (document as unknown as {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(ink).toHaveCSS('animation-name','none');
 await expect(ink).toHaveCSS('stroke-dashoffset','0px');
 await expect(ink).toBeVisible();
});

test('ornament art remains complete before JavaScript enhancement',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,javaScriptEnabled:false,viewport:{width:320,height:740}});
 try{
  const page=await context.newPage();await page.goto('/demo/modern-minimalist');
  const ink=page.locator('.inv-cover .inv-ornament-start .inv-ornament-ink');
  await expect(ink).toBeVisible();await expect(ink).toHaveCSS('stroke-dashoffset','0px');
  await expect(ink).toHaveCSS('animation-name','none');
 }finally{await context.close();}
});
