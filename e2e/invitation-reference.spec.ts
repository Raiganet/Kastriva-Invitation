import {test,expect} from '@playwright/test';

for(const theme of ['elegant-rose','modern-minimalist','tropical-paradise','adat-minang']){
 test(`reference composition preserves long names, authored chapters and photos: ${theme}`,async({page})=>{
  await page.setViewportSize({width:320,height:740});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`/test-fixtures/invitation?theme=${theme}`);
  const fits=()=>page.locator('.invitation').evaluate(e=>e.scrollWidth<=e.clientWidth+1);
  await expect(page.getByRole('heading',{level:1})).toHaveAttribute('aria-label','Muhammad Arif Firmansyah & Nadia Puspitasari');
  expect(await fits()).toBe(true);
  await page.getByRole('button',{name:/Buka undangan/}).click();
  await expect(page.getByRole('img',{name:'Foto Muhammad Arif Firmansyah',exact:true})).toBeAttached();
  await expect(page.getByRole('img',{name:'Foto Nadia Puspitasari',exact:true})).toBeAttached();
  const story=page.locator('.inv-section').filter({has:page.getByRole('heading',{name:'Cerita kami',exact:true})});
  await story.scrollIntoViewIfNeeded();
  await expect(story.getByRole('heading',{name:'Pertemuan pertama',exact:true})).toBeVisible();
  await expect(story.getByRole('heading',{name:'Hari bahagia',exact:true})).toBeVisible();
  expect(await story.innerText()).not.toContain('###');
  const last=story.locator('li').last();
  await last.scrollIntoViewIfNeeded();
  expect(await fits()).toBe(true);
  const gallery=page.getByRole('region',{name:'Galeri kenangan bergulir'});
  await gallery.scrollIntoViewIfNeeded();
  await gallery.getByRole('button',{name:'Tampilkan foto 3',exact:true}).click();
  await expect(gallery.getByRole('button',{name:'Tampilkan foto 3',exact:true})).toHaveAttribute('aria-pressed','true');
  const opener=gallery.getByRole('button',{name:'Perbesar foto 3',exact:true});
  await opener.click();
  const dialog=page.getByRole('dialog',{name:'Galeri kenangan'});
  await expect(dialog).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByText('Foto 4 dari 4',{exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  expect(await fits()).toBe(true);
 });
}

test('long story chapters reveal individually and gallery honors a live motion preference change',async({page})=>{
 await page.clock.install();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/test-fixtures/invitation');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 const story=page.locator('.inv-story-timeline');
 const ornaments=page.locator('.inv-section').filter({has:story}).locator('.inv-ornament-corner');
 await expect(ornaments.first()).toHaveCSS('animation-play-state','paused');
 await story.locator('li').first().evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(story.locator('li').first()).toHaveCSS('opacity','1');
 await expect(ornaments.first()).toHaveCSS('animation-play-state','running');
 await expect(story.locator('li').last()).toHaveClass(/inv-reveal-pending/);
 await story.locator('li').last().evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(story.locator('li').last()).toHaveCSS('opacity','1');
 const gallery=page.getByRole('region',{name:'Galeri kenangan bergulir'});
 await gallery.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(gallery).toHaveCSS('opacity','1');
 await page.mouse.move(0,0);
 // Wait for the real first advance: IntersectionObserver starts the timer asynchronously.
 await expect(gallery.locator('.elegant-gallery-count')).toHaveText('02 / 04',{timeout:12000});
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.inv-reveal-pending')).toHaveCount(0);
 // Advancing the browser clock proves the already-started timer was cancelled.
 const current=await gallery.locator('.elegant-gallery-count').innerText();
 await page.clock.fastForward(18000);
 await expect(gallery.locator('.elegant-gallery-count')).toHaveText(current);
});

test('embedded invitations keep their card layout without adding a navigation dock',async({page})=>{
 await page.setViewportSize({width:320,height:740});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/test-fixtures/invitation?theme=botanical-blush&embedded=true');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-bottom-nav')).toHaveCount(0);
 expect(await page.locator('.invitation').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});
