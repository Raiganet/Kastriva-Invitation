import {test,expect} from '@playwright/test';

for(const theme of ['modern-minimalist','elegant-rose','tropical-paradise'])test(`story photos preserve the complete frame in every orientation: ${theme}`,async({page,isMobile})=>{
 if(isMobile)await page.setViewportSize({width:320,height:740});
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const aspect of ['portrait','landscape','square']){
  await page.goto(`/test-fixtures/invitation?theme=${theme}&aspect=${aspect}`);
  await page.getByRole('button',{name:/Buka undangan/}).click();
  const photo=page.locator('.inv-story-image').first();
  await photo.scrollIntoViewIfNeeded();await photo.evaluate((image:HTMLImageElement)=>image.decode());
  await expect(photo).toHaveAttribute('alt',/^Foto cerita/);
  // In contain mode the complete source, including its top and bottom edge, fits the mat.
  const inspect=()=>photo.evaluate((image:HTMLImageElement)=>{
   const style=getComputedStyle(image),box=image.getBoundingClientRect(),mat=image.parentElement!.getBoundingClientRect();
   const scale=Math.min(box.width/image.naturalWidth,box.height/image.naturalHeight);
   return {fit:style.objectFit,fullWidth:image.naturalWidth*scale<=mat.width,fullHeight:image.naturalHeight*scale<=mat.height,inside:box.top>=mat.top&&box.bottom<=mat.bottom&&box.left>=mat.left&&box.right<=mat.right,scale:new DOMMatrix(style.transform).a,individualScale:style.scale};
  });
  expect(await inspect()).toMatchObject({fit:'contain',fullWidth:true,fullHeight:true,inside:true,scale:1,individualScale:'none'});
  if(!isMobile){await photo.hover();expect(await inspect()).toMatchObject({fit:'contain',scale:1,individualScale:'none'});}
  expect(await page.locator('.invitation').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 }
});

test('ornament motion follows visibility and live reduced-motion preferences',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/demo/tropical-paradise?view=full');
 const cover=page.locator('.inv-cover');
 await expect(cover).toHaveClass(/inv-motion-visible/);
 await expect(cover.locator('.inv-ornament-start').first()).toHaveCSS('animation-play-state','running');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await page.getByRole('navigation',{name:'Bagian undangan'}).getByRole('button',{name:'Cerita',exact:true}).click();
 const story=page.locator('.inv-section').filter({has:page.getByRole('heading',{name:'Cerita kami',exact:true})});
 const ornament=story.locator('.inv-ornament-start');
 await expect(story).toHaveClass(/inv-motion-visible/);
 await expect(ornament).toHaveCSS('animation-name','edition-leaves');
 await expect(ornament).toHaveCSS('animation-play-state','running');
 const progress=()=>ornament.evaluate(e=>Number(e.getAnimations()[0]?.currentTime??0));
 const start=await progress();await expect.poll(progress).toBeGreaterThan(start+100);
 await page.locator('.inv-closing').evaluate(e=>e.scrollIntoView({behavior:'instant'}));
 await expect(story).not.toHaveClass(/inv-motion-visible/);
 await expect(ornament).toHaveCSS('animation-play-state','paused');
 await story.evaluate(e=>e.scrollIntoView({behavior:'instant'}));
 await expect(ornament).toHaveCSS('animation-play-state','running');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(ornament).toHaveCSS('animation-play-state','paused');
 await page.evaluate(()=>{delete (document as unknown as {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await expect(ornament).toHaveCSS('animation-play-state','running');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(ornament).toHaveCSS('animation-name','none');
 await expect(page.locator('.inv-motion-visible')).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await expect(ornament).toHaveCSS('animation-play-state','running');
});
