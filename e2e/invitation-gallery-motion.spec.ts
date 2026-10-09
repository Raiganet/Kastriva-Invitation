import {test,expect,type Page} from '@playwright/test';
import path from 'node:path';

async function openGallery(page:Page,{motion=false,fixture=false}={}){
 await page.emulateMedia({reducedMotion:motion?'no-preference':'reduce'});
 await page.goto(fixture?'/test-fixtures/invitation?theme=modern-minimalist':'/demo/modern-minimalist?view=full',{waitUntil:'domcontentloaded'});
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 // Finish the cover's finite entrance animations and font layout before a pointer click.
 // These tests isolate gallery behavior, including intentionally pending image requests.
 await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
 await page.locator('.inv-cover').evaluate(element=>Promise.allSettled(element.getAnimations({subtree:true}).filter(animation=>animation.effect?.getTiming().iterations!==Infinity).map(animation=>animation.finished)));
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 if(motion)await page.getByRole('button',{name:'Jeda gulir',exact:true}).click();
 const gallery=page.getByRole('region',{name:'Galeri kenangan bergulir'});
 await gallery.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(gallery).toHaveCSS('opacity','1');
 await expect(gallery.locator('.elegant-gallery-main')).toBeEnabled();
 return gallery;
}

test('gallery edition retains the decoded photo while loading and ignores stale selections',async({page})=>{
 let release!:()=>void;
 const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/images/demo/wedding-walk.webp',async route=>{
  await gate;
  await route.fulfill({path:path.resolve('public/images/demo/wedding-walk.webp'),contentType:'image/webp'});
 });
 try{
  const gallery=await openGallery(page),main=gallery.locator('.elegant-gallery-main');
  await gallery.getByRole('button',{name:'Tampilkan foto 2',exact:true}).click();
  await expect(main).toHaveAttribute('aria-busy','true');
  await expect(gallery.locator('.elegant-gallery-count')).toHaveText('01 / 05');
  await expect(main.getByRole('img')).toHaveAttribute('src',/wedding-couple/);
  // A faster third selection must win, even if the older request finishes later.
  await gallery.getByRole('button',{name:'Tampilkan foto 3',exact:true}).click();
  await expect(main).toHaveAttribute('aria-busy','false');
  await expect(gallery.locator('.elegant-gallery-count')).toHaveText('03 / 05');
  release();
  await expect(gallery.getByRole('button',{name:'Tampilkan foto 2',exact:true}).locator('img')).toHaveJSProperty('complete',true);
  await page.waitForTimeout(850);
  await expect(gallery.locator('.elegant-gallery-count')).toHaveText('03 / 05');
  await expect(main.locator('img')).toHaveCount(1);
  await expect(main.getByRole('img')).toHaveCSS('object-fit','contain');
 }finally{release();}
});

test('gallery edition recovers from a failed next photo without removing the current frame',async({page})=>{
 await page.route('**/images/demo/wedding-walk.webp',route=>route.abort());
 const gallery=await openGallery(page),main=gallery.locator('.elegant-gallery-main');
 await gallery.getByRole('button',{name:'Tampilkan foto 2',exact:true}).click();
 await expect(gallery.getByRole('status')).toHaveText('Foto 2 belum dapat dimuat. Silakan pilih foto lain.');
 await expect(main).toBeEnabled();
 await expect(main).toHaveAttribute('aria-label','Perbesar foto 1');
 await main.click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByRole('dialog').getByText('Foto 1 dari 5')).toBeVisible();
 await page.keyboard.press('Escape');
 await gallery.getByRole('button',{name:'Tampilkan foto 3',exact:true}).click();
 await expect(main).toHaveAttribute('aria-label','Perbesar foto 3');
 await expect(gallery.getByRole('status')).toBeEmpty();
 // An unavailable first image must still leave the thumbnail controls usable.
 await page.goto('/test-fixtures/invitation?theme=modern-minimalist&broken=true&mode=public');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 await gallery.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(main).toBeDisabled();
 await expect(gallery.getByRole('status')).toContainText('Foto 1 belum dapat dimuat');
 await gallery.getByRole('button',{name:'Tampilkan foto 2',exact:true}).click();
 await expect(main).toBeEnabled();
 await expect(main).toHaveAttribute('aria-label','Perbesar foto 2');
});

test('gallery edition supports touch swipes or arrow keys without accidentally opening the viewer',async({page,isMobile})=>{
 const gallery=await openGallery(page,{fixture:true}),main=gallery.locator('.elegant-gallery-main');
 if(isMobile){
  const box=(await main.boundingBox())!;
  const cdp=await page.context().newCDPSession(page);
  const y=box.y+box.height*.45,x=box.x+box.width*.75;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(const dx of [25,50,80,110])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-dx,y:y+2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(gallery.locator('.elegant-gallery-count')).toHaveText('02 / 04');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  // Vertical movement over the photo still scrolls the invitation normally.
  const before=await page.evaluate(()=>scrollY);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(const dy of [30,60,100])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-dy}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+20);
  await expect(gallery.locator('.elegant-gallery-count')).toHaveText('02 / 04');
  await cdp.detach();
 }else{
  await main.focus();await page.keyboard.press('ArrowRight');
  await expect(gallery.locator('.elegant-gallery-count')).toHaveText('02 / 04');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByText('Foto 2 dari 4')).toBeVisible();
  await page.keyboard.press('Escape');await expect(main).toBeFocused();
 }
 await expect(gallery.getByRole('button',{name:/Putar slideshow/})).toHaveAttribute('aria-pressed','false');
 await page.emulateMedia({reducedMotion:'no-preference'});
 // Explicit Play resumes even while the initiating button retains keyboard/touch focus.
 await gallery.getByRole('button',{name:/Putar slideshow/}).click();
 // Clicking the footer control can scroll the photo out of view. Restore the
 // visible gallery and move the pointer away (hover pauses it), retaining focus.
 await gallery.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await page.mouse.move(0,0);
 await expect(gallery.getByRole('button',{name:/Jeda slideshow/})).toBeFocused();
 await expect(gallery).toHaveAttribute('data-gallery-running','true');
 await gallery.getByRole('button',{name:/Jeda slideshow/}).click();
 await expect(gallery).toHaveAttribute('data-gallery-running','false');
});

test('gallery edition runs its progress only while visible and obeys reduced motion',async({page})=>{
 const gallery=await openGallery(page,{motion:true,fixture:true});
 await page.mouse.move(0,0);
 await expect(gallery).toHaveAttribute('data-gallery-running','true');
 await expect(gallery.locator('.inv-gallery-progress i')).toHaveCSS('animation-name','invitation-photo-progress');
 await expect(gallery.locator('.elegant-gallery-count')).toHaveText('02 / 04',{timeout:12000});
 await expect(gallery.locator('.is-entering')).toHaveCSS('animation-name','invitation-photo-enter');
 await page.locator('.inv-closing').evaluate(e=>e.scrollIntoView({behavior:'instant'}));
 await expect(gallery).toHaveAttribute('data-gallery-running','false');
 await gallery.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(gallery).toHaveAttribute('data-gallery-running','true');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(gallery).toHaveAttribute('data-gallery-running','false');
 await expect(gallery.locator('.is-entering')).toHaveCSS('animation-name','none');
 await expect(gallery.locator('.inv-gallery-progress')).toHaveCSS('opacity','0');
});

test('gallery edition farewell and wishes reveal in order and fit narrow screens',async({page})=>{
 await page.setViewportSize({width:320,height:740});
 await openGallery(page,{motion:true});
 const wishes=page.locator('.inv-demo-wish-list .wish-card');
 await expect(wishes.first()).toHaveClass(/inv-reveal-pending/);
 for(let i=0;i<await wishes.count();i++){
  await wishes.nth(i).evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
  await expect(wishes.nth(i)).toHaveCSS('opacity','1');
 }
 const closing=page.locator('.inv-closing');
 await closing.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(closing.locator('.inv-closing-seal')).toHaveCSS('opacity','1');
 await expect(closing.getByRole('heading')).toHaveCSS('opacity','1');
 const themeLink=closing.getByRole('link',{name:/Gunakan tema ini/});
 await themeLink.focus();await expect(themeLink).toBeVisible();
 await expect(themeLink).toHaveAttribute('href','/order/modern-minimalist');
 await expect(closing.locator('.overline')).toHaveCSS('color',await closing.evaluate(e=>getComputedStyle(e).color));
 expect(await page.locator('.invitation').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(closing.locator('.inv-closing-seal')).toHaveCSS('transform','none');
});
