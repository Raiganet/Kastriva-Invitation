import {test,expect,type Page} from '@playwright/test';
import {ALL_THEME_SLUGS} from '../lib/theme-registry';

async function open(page:Page,url='/demo/elegant-rose'){
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(url);
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
}

for(const theme of ALL_THEME_SLUGS)test(`reading dock keeps every chapter reachable: ${theme}`,async({page,isMobile})=>{
 if(isMobile)await page.setViewportSize({width:320,height:740});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await open(page,`/demo/${theme}`);
 const dock=page.locator('.inv-controls'),nav=dock.getByRole('navigation',{name:'Bagian undangan'});
 await expect(dock).toBeInViewport({ratio:1});
 await expect(dock.locator('.music-track-label')).toBeVisible();
 const buttons=await nav.getByRole('button').all();
 for(const button of buttons){const box=await button.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(55);expect(box!.height).toBeGreaterThanOrEqual(44);}
 const playback=await dock.locator('.inv-auto-scroll button').boundingBox(),music=await dock.locator('.music-toggle').boundingBox();
 expect(playback!.x+playback!.width).toBeLessThanOrEqual(music!.x);
 const last=buttons.at(-1)!;
 await last.click();
 await expect(last).toHaveAttribute('aria-current','location');
 await expect(last).toBeInViewport({ratio:1});
 await expect(page.locator(`[id="${await last.getAttribute('aria-controls')}"]`)).toBeFocused();
 await buttons[0].click();
 await expect(buttons[0]).toHaveAttribute('aria-current','location');
 await expect(buttons[0]).toBeInViewport({ratio:1});
 expect(await page.locator('.invitation').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 expect(errors).toEqual([]);
});

test('reading dock yields to forms and the photo viewer, then restores itself',async({page})=>{
 await page.setViewportSize({width:320,height:740});await open(page);
 const dock=page.locator('.inv-controls'),input=page.locator('.rsvp-form input[name=name]');
 await input.fill('Tamu pengujian');
 await expect(dock).not.toBeVisible();
 await expect(input).toBeFocused();await expect(input).toHaveCSS('font-size','16px');
 await input.blur();await expect(dock).toBeVisible();
 const photo=page.locator('.inv-gallery').getByRole('button',{name:'Perbesar foto 1',exact:true});
 await photo.click();await expect(page.getByRole('dialog')).toBeVisible();
 await expect(dock).not.toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:/Tutup/}).click();
 await expect(dock).toBeVisible();await expect(photo).toBeFocused();
 await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 const closing=await page.locator('.inv-closing').boundingBox(),controls=await dock.boundingBox();
 expect(closing!.y+closing!.height).toBeLessThanOrEqual(controls!.y);
});

test('reading dock keeps the active chapter visible after rotation and keyboard navigation',async({page})=>{
 await page.setViewportSize({width:740,height:390});await open(page);
 const nav=page.getByRole('navigation',{name:'Bagian undangan'}),last=nav.getByRole('button').last();
 await last.click();await expect(last).toHaveAttribute('aria-current','location');
 const heading=await page.locator('.inv-gifts h2').boundingBox(),dock=await page.locator('.inv-controls').boundingBox();
 expect(heading!.y+heading!.height).toBeLessThan(dock!.y);
 const position=await page.evaluate(()=>window.scrollY);
 await page.setViewportSize({width:320,height:740});
 await expect(last).toBeInViewport({ratio:1});
 // Keyboard focus can reach hidden tabs; activating one focuses its content.
 await nav.getByRole('button').first().focus();
 await page.keyboard.press('Tab');
 const next=nav.getByRole('button').nth(1);await expect(next).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.locator(`[id="${await next.getAttribute('aria-controls')}"]`)).toBeFocused();
 await expect(next).toHaveAttribute('aria-current','location');
 expect(await page.evaluate(()=>window.scrollY)).toBeLessThan(position);
});

test('reading dock allows music to pause and reports playback failure without overflow',async({page})=>{
 await page.setViewportSize({width:320,height:740});await open(page);
 const music=page.locator('.music-toggle');await expect(music).toHaveAttribute('aria-pressed','true');
 await music.click();await expect(music).toHaveAttribute('aria-pressed','false');
 await music.click();await expect(music).toHaveAttribute('aria-pressed','true');
 await page.addInitScript(()=>{Object.defineProperty(window,'AudioContext',{value:class{constructor(){throw new Error('Unavailable audio for this fixture');}}});});
 await open(page,'/test-fixtures/invitation?music=on');
 const error=page.locator('.inv-music [role=status]');
 await expect(error).toContainText('Musik belum dapat diputar');await expect(error).toBeInViewport({ratio:1});
 expect(await error.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await expect(page.locator('.music-toggle')).toHaveAttribute('aria-pressed','false');
});

test('reading dock supports silent invitations and leaves embedded previews independent',async({page})=>{
 await page.setViewportSize({width:320,height:740});
 await open(page,'/test-fixtures/invitation?mode=public');
 await expect(page.locator('.inv-controls')).toBeInViewport({ratio:1});
 await expect(page.locator('.inv-music')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Lanjut gulir',exact:true})).toBeVisible();
 await open(page,'/test-fixtures/invitation?embedded=true&music=on');
 await expect(page.locator('.inv-controls')).toHaveCount(0);
 await expect(page.locator('.inv-bottom-nav')).toHaveCount(0);
 await expect(page.locator('.inv-auto-scroll')).toHaveCount(0);
 await expect(page.locator('.music-toggle')).toBeVisible();
 await expect(page.locator('.inv-music')).toHaveCSS('position','sticky');
});
