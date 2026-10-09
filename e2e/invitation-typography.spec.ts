import {test,expect,type Locator} from '@playwright/test';
import templates from '../data/templates.json';

async function readablePair(heading:Locator){
 await expect(heading).toHaveAccessibleName('Diky Hermansyah & Wawat Nurlatipah');
 for(const name of await heading.locator('.inv-name-first, .inv-name-second').all()){
  const box=await name.evaluate(element=>({height:element.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(element).lineHeight),fits:element.scrollWidth<=element.clientWidth+1}));
  // Ordinary full names should each fit a line, rather than making four large
  // lines and pushing the rest of the cover far below the opening viewport.
  expect(box.height).toBeLessThan(box.lineHeight*1.5);
  expect(box.fits).toBe(true);
 }
}

for(const theme of templates.filter(t=>t.active&&t.category==='pernikahan'))test(`full names stay balanced throughout the invitation: ${theme.slug}`,async({page,isMobile})=>{
 if(isMobile)await page.setViewportSize({width:320,height:740});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(`/test-fixtures/invitation?theme=${theme.slug}&names=multiword&cover=photo`);
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
 await readablePair(page.locator('.inv-cover h1'));
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 await readablePair(page.locator('.inv-hero h1'));
 await page.locator('.inv-closing').scrollIntoViewIfNeeded();
 await readablePair(page.locator('.inv-closing h2'));
 expect(await page.locator('.invitation').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});

test('embedded cover uses its card width on a wide desktop',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/test-fixtures/invitation?theme=elegant-rose&names=multiword&embedded=true&cover=photo');
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
 await readablePair(page.locator('.inv-cover h1'));
});
