import {test,expect} from '@playwright/test';

for(const theme of ['modern-minimalist','elegant-rose','aurora-modern'])test(`legacy decoration sleeps outside the viewport and in background tabs: ${theme}`,async({page,isMobile})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(`/demo/${theme}`);
 const root=page.locator('.invitation');
 await expect(root).toHaveAttribute('data-inv-motion-observed','true');
 // Regression: production CSS minification must preserve the unprefixed override.
 if(isMobile)await expect(page.locator('.cover-frame')).toHaveCSS('backdrop-filter','none');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 await page.getByRole('button',{name:'Jeda gulir',exact:true}).click();
 if(isMobile)await expect(page.locator('.inv-controls')).toHaveCSS('backdrop-filter','none');
 const nav=page.getByRole('navigation',{name:'Bagian undangan'});
 await nav.getByRole('button',{name:'Acara',exact:true}).click();
 await expect(page.locator('.inv-hero')).not.toHaveClass(/inv-motion-visible/);
 // Includes old SVG motifs, portrait flowers, background ribbons and pseudo-elements.
 await expect.poll(()=>root.evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>{
  const target=(animation.effect as KeyframeEffect)?.target;
  const chapter=target instanceof Element?target.closest('.inv-cover,.inv-hero,.inv-section,.inv-closing'):null;
  return animation.playState==='running'&&animation.effect?.getTiming().iterations===Infinity&&chapter&&!chapter.classList.contains('inv-motion-visible');
 }).length)).toBe(0);
 await nav.getByRole('button',{name:'Awal',exact:true}).click();
 await expect(page.locator('.inv-hero')).toHaveClass(/inv-motion-visible/);
 await expect(page.locator('.inv-hero .inv-ornament-start')).toHaveCSS('animation-play-state','running');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect.poll(()=>root.evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length)).toBe(0);
 await page.evaluate(()=>{delete (document as unknown as {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('.inv-hero .inv-ornament-start')).toHaveCSS('animation-play-state','running');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.inv-hero .inv-ornament-start')).toHaveCSS('animation-name','none');
});

test('invitations remain readable without the visibility observer',async({page})=>{
 await page.addInitScript(()=>{delete (window as unknown as {IntersectionObserver?:unknown}).IntersectionObserver;});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/demo/elegant-rose');
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-motion-observed','false');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 await page.getByRole('navigation',{name:'Bagian undangan'}).getByRole('button',{name:'Cerita',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Cerita kami',exact:true})).toBeInViewport();
 await expect(page.locator('.inv-reveal-pending')).toHaveCount(0);
 await expect(page.locator('.elegant-story-card').first()).toHaveCSS('opacity','1');
});
