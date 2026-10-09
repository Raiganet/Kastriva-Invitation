import {test,expect,type Page} from '@playwright/test';

for(const [theme,style] of [['modern-minimalist','slide'],['elegant-rose','album'],['aurora-modern','light']]){
 test(`opening choreography reveals the real invitation and starts its tour: ${theme}`,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`/demo/${theme}?view=full`);
  const root=page.locator('.invitation');
  await expect(root).toHaveAttribute('data-inv-hydrated','true');
  await expect(root).toHaveAttribute('data-inv-opening-style',style);
  await expect(page.locator('.inv-content')).toHaveCount(0);
  // Isolate the door choreography from font loading and the cover's entrance.
  // The separate fallback tests exercise opening without a CSS completion event.
  await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
  await page.locator('.inv-cover').evaluate(element=>Promise.allSettled(element.getAnimations({subtree:true}).filter(animation=>animation.effect?.getTiming().iterations!==Infinity).map(animation=>animation.finished)));
  await page.evaluate(()=>{
   const root=document.querySelector('.invitation')!;
   document.addEventListener('animationend',event=>{
    if((event.target as HTMLElement).dataset.invDoor==='end')root.setAttribute('data-tested-animation',(event as AnimationEvent).animationName);
   },true);
  });
  await page.getByRole('button',{name:/Buka undangan/}).click();
  await expect(root).toHaveAttribute('data-inv-opening-state','open');
  await expect(root).toHaveAttribute('data-tested-animation',`invitation-door-${style}`);
  await expect(page.locator('.inv-cover')).toHaveCount(0);
  await expect(page.locator('.inv-content')).toBeFocused();
  await expect(page.locator('.inv-content')).not.toHaveAttribute('inert');
  await expect(page.locator('.inv-hero h1')).toHaveCSS('opacity','1');
  await expect(page.locator('.inv-auto-scroll')).toHaveAttribute('data-scroll-state','running');
  await expect(page.locator('.music-toggle')).toHaveAttribute('aria-pressed','true');
  expect(await root.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  expect(errors).toEqual([]);
 });
}

async function holdOpening(page:Page){
 await page.clock.install();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/demo/modern-minimalist?view=full');
 // Stop CSS completion and the timeout independently, then exercise each exit path.
 await page.addStyleTag({content:'.invitation .is-opening .inv-cover-leaf{animation-play-state:paused!important}'});
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+5000));
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-opening-state','opening');
 await expect(page.locator('.inv-content')).toHaveAttribute('inert','');
 await expect(page.locator('.inv-content')).toHaveAttribute('aria-hidden','true');
 await expect(page.getByRole('button',{name:/Membuka undangan/})).toBeDisabled();
 await expect(page.locator('.inv-auto-scroll')).toHaveCount(0);
}

test('opening fallback unlocks content even when CSS completion is unavailable',async({page})=>{
 await holdOpening(page);
 await page.clock.runFor(3000);
 await expect(page.locator('.inv-content')).toBeFocused();
 await expect(page.locator('.inv-cover')).toHaveCount(0);
 await expect(page.locator('.inv-content')).not.toHaveAttribute('inert');
});

test('opening yields immediately to a live reduced-motion preference',async({page})=>{
 await holdOpening(page);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.inv-content')).toBeFocused();
 await expect(page.locator('.inv-cover')).toHaveCount(0);
 await expect(page.locator('.inv-auto-scroll')).toHaveAttribute('data-scroll-state','paused');
 await expect(page.locator('.inv-hero h1')).toHaveCSS('animation-name','none');
});

test('chapter divider unfurls with its heading without hiding focused content',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/demo/modern-minimalist?view=full');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await page.getByRole('button',{name:'Jeda gulir',exact:true}).click();
 const section=page.locator('.inv-section').filter({has:page.getByRole('heading',{name:'Cerita kami',exact:true})});
 const divider=section.locator('.inv-section-divider'),line=divider.locator('span').first();
 await expect(divider).toHaveClass(/inv-reveal-pending/);
 await expect.poll(()=>line.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m11)).toBe(0);
 await section.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(section.getByRole('heading',{name:'Cerita kami',exact:true})).toHaveCSS('opacity','1');
 await expect.poll(()=>line.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m11)).toBe(1);
 await expect(divider.locator('.theme-motif')).toHaveCSS('opacity','1');
 await section.focus();await expect(section).toHaveCSS('opacity','1');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.inv-reveal-pending')).toHaveCount(0);
});
