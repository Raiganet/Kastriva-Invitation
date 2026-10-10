import {test,expect} from '@playwright/test';
import {ALL_THEME_SLUGS} from '../lib/theme-registry';

test('all collection themes use lightweight phone artwork with complete photos',async({page,isMobile})=>{
 if(isMobile)await page.setViewportSize({width:320,height:800});
 await page.goto('/tema');
 const cards=page.locator('.theme-card');
 await expect(cards).toHaveCount(ALL_THEME_SLUGS.length);
 await expect(cards.locator('iframe')).toHaveCount(0);
 for(const card of await cards.all()){
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('.phone-frame')).toBeVisible();
  const photo=card.locator('.art-preview-photo');
  await expect(photo).toHaveJSProperty('complete',true);
  expect(await photo.evaluate((image:HTMLImageElement)=>image.naturalWidth)).toBeGreaterThan(0);
  await expect(photo).toHaveCSS('object-fit','contain');
  const fits=await card.locator('.phone-screen').evaluate(screen=>{
   const bounds=screen.getBoundingClientRect(),button=screen.querySelector('.art-preview-open')!.getBoundingClientRect();
   return button.bottom<=bounds.bottom-7&&button.left>=bounds.left&&button.right<=bounds.right;
  });
  expect(fits).toBe(true);
 }
 const bali=cards.filter({has:page.getByRole('heading',{name:'Adat Bali',exact:true})});
 await expect(bali.locator('img')).toHaveAttribute('src','/images/demo/adat-bali-couple.webp');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('demo plays music, scrolls its own screen, opens photos and leads to ordering',async({page,isMobile})=>{
 await page.addInitScript(()=>{
  const meters:AnalyserNode[]=[];
  Object.assign(window,{phoneAudioMeters:meters});
  const Native=window.AudioContext;
  window.AudioContext=class extends Native{
   createGain(){
    const gain=super.createGain(),connect=gain.connect.bind(gain);
    gain.connect=((...args:unknown[])=>{
     if(args[0]===this.destination){const meter=this.createAnalyser();meter.fftSize=2048;meters.push(meter);connect(meter);return meter.connect(this.destination);}
     return Reflect.apply(connect,gain,args);
    }) as GainNode['connect'];
    return gain;
   }
  };
 });
 await page.goto('/demo/adat-bali?to=Keluarga%20Nadia');
 const demo=page.frameLocator('.demo-device-content');
 await expect(demo.getByText('Keluarga Nadia',{exact:true})).toBeVisible();
 await demo.getByRole('button',{name:/Buka undangan/}).click();
 await expect(demo.locator('.inv-auto-scroll')).toHaveAttribute('data-scroll-state','running');
 await expect(demo.locator('.music-toggle')).toHaveAttribute('aria-pressed','true');
 const outerScroll=await page.evaluate(()=>scrollY);
 const innerScroll=await demo.locator('html').evaluate(()=>scrollY);
 await expect.poll(()=>demo.locator('html').evaluate(()=>scrollY)).toBeGreaterThan(innerScroll+5);
 expect(await page.evaluate(()=>scrollY)).toBe(outerScroll);
 await expect.poll(()=>demo.locator('html').evaluate(()=>{
  const meter=(window as unknown as {phoneAudioMeters:AnalyserNode[]}).phoneAudioMeters.at(-1);
  if(!meter)return 0;
  const samples=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(samples);
  return Math.max(...samples.map(Math.abs));
 })).toBeGreaterThan(.00001);
 await demo.getByRole('button',{name:'Jeda gulir',exact:true}).click();
 const gallery=demo.getByRole('region',{name:'Galeri kenangan bergulir'});
 await gallery.scrollIntoViewIfNeeded();
 await gallery.locator('.elegant-gallery-main').click();
 await expect(demo.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(demo.getByRole('dialog')).not.toBeVisible();
 if(isMobile)await page.setViewportSize({width:320,height:740});
 expect(await demo.locator('html').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.getByRole('link',{name:'Pilih tema ↗',exact:true}).click();
 await expect(page).toHaveURL(/\/order\/adat-bali$/);
 await expect(page.getByRole('link',{name:'Lanjutkan ke draft ↗'})).toHaveAttribute('href','/dashboard/baru?template=adat-bali');
});

test('desktop demo can open directly and keeps the guest name',async({page,isMobile})=>{
 test.skip(isMobile,'The optional direct link belongs to the desktop preview toolbar.');
 await page.goto('/demo/adat-sunda?to=Keluarga%20Nadia');
 await page.getByRole('link',{name:'Buka langsung ↗'}).click();
 await expect(page.locator('.demo-device-content')).toHaveCount(0);
 await expect(page.locator('.invitation')).toBeVisible();
 await expect(page.getByText('Keluarga Nadia',{exact:true})).toBeVisible();
});
