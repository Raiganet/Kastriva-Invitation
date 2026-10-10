import {test,expect} from '@playwright/test';

test('desktop themes have distinct, readable side and center compositions',async({page,isMobile})=>{
 test.skip(isMobile,'Desktop composition; phone behavior is covered separately.');
 await page.setViewportSize({width:1440,height:1000});
 for(const [slug,layout] of [['adat-bali','split'],['elegant-rose','center']]){
  await page.goto(`/demo/${slug}`);
  await expect(page.locator('.demo-desktop-layout')).toHaveAttribute('data-demo-layout',layout);
  await expect(page.locator('.demo-hero-photo')).toBeVisible();
  if(layout==='split')await expect(page.locator('.demo-hero-caption')).toHaveCSS('color','rgb(255, 255, 255)');
  const reader=await page.locator('.demo-reader').boundingBox();
  expect(reader!.width).toBeGreaterThanOrEqual(560);
  expect(reader!.height).toBe(928);
  if(layout==='split')expect(reader!.x+reader!.width).toBeCloseTo(1440,0);
  else expect(reader!.x+reader!.width/2).toBeCloseTo(720,0);
  const demo=page.frameLocator('.demo-device-content');
  await demo.getByRole('button',{name:/Buka undangan/}).click();
  await expect(demo.locator('.inv-content')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 }
});

test('changing desktop composition preserves the open invitation, music and scroll',async({page,isMobile})=>{
 test.skip(isMobile,'Composition buttons are only shown on desktop.');
 await page.goto('/demo/adat-bali?to=Keluarga%20Nadia');
 const demo=page.frameLocator('.demo-device-content');
 await demo.getByRole('button',{name:/Buka undangan/}).click();
 await expect(demo.getByRole('button',{name:'Jeda gulir',exact:true})).toBeVisible();
 await demo.getByRole('button',{name:'Jeda gulir',exact:true}).click();
 await demo.locator('html').evaluate(()=>{Object.assign(window,{demoContinuityMarker:'same-window'});window.scrollTo(0,900);});
 await page.getByRole('button',{name:'Tengah',exact:true}).click();
 await expect(page.getByRole('button',{name:'Tengah',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(demo.locator('.inv-content')).toBeVisible();
 await expect(demo.locator('.music-toggle')).toHaveAttribute('aria-pressed','true');
 expect(await demo.locator('html').evaluate(()=>(window as unknown as {demoContinuityMarker:string}).demoContinuityMarker)).toBe('same-window');
 expect(await demo.locator('html').evaluate(()=>scrollY)).toBeGreaterThan(500);
 await page.getByRole('button',{name:'Samping',exact:true}).click();
 await expect(page.locator('.demo-desktop-layout')).toHaveAttribute('data-demo-layout','split');
 await expect(demo.locator('.music-toggle')).toHaveAttribute('aria-pressed','true');
});

test('mobile and tablet previews fill the viewport without desktop scenery or overflow',async({page})=>{
 await page.goto('/demo/elegant-rose');
 for(const width of [320,390,768,900]){
  await page.setViewportSize({width,height:844});
  await expect(page.getByRole('group',{name:'Komposisi desktop'})).toBeHidden();
  await expect(page.locator('.demo-desktop-hero')).toBeHidden();
  const frame=await page.locator('.demo-device-content').boundingBox();
  expect(frame!.x).toBe(0);expect(frame!.width).toBe(width);expect(frame!.height).toBe(792);
  const demo=page.frameLocator('.demo-device-content');
  expect(await demo.locator('html').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 }
});
