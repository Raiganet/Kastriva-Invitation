import {test,expect,type Page} from '@playwright/test';
import {WEDDING_THEME_SLUGS} from '../lib/theme-registry';
import {demoMusic} from '../lib/invitation-demo';
import {musicLabel} from '../lib/music-library';

async function observeAudio(page:Page){
 await page.addInitScript(()=>{
  const contexts:AudioContext[]=[],meters:AnalyserNode[]=[];
  Object.assign(window,{musicTest:{contexts,meters}});
  const Native=window.AudioContext;
  window.AudioContext=class extends Native{
   constructor(options?:AudioContextOptions){super(options);contexts.push(this);}
   createGain(){
    const gain=super.createGain(),connect=gain.connect.bind(gain);
    gain.connect=((...args:unknown[])=>{
     const destination=args[0];
     if(destination===this.destination){
      const meter=this.createAnalyser();meter.fftSize=2048;meters.push(meter);connect(meter);return meter.connect(this.destination);
     }
     return Reflect.apply(connect,gain,args);
    }) as GainNode['connect'];
    return gain;
   }
  };
 });
}
async function peak(page:Page){return page.evaluate(()=>{
 const meter=(window as unknown as {musicTest:{meters:AnalyserNode[]}}).musicTest.meters.at(-1);
 if(!meter)return 0;
 const samples=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(samples);
 return Math.max(...samples.map(Math.abs));
});}

for(const theme of WEDDING_THEME_SLUGS)test('wedding demo plays the paired instrumental: '+theme,async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await observeAudio(page);
 await page.goto('/demo/'+theme);
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {musicTest:{contexts:AudioContext[]}}).musicTest.contexts.length)).toBe(0);
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.music-toggle')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.inv-music')).toContainText(musicLabel(demoMusic(theme)));
 await expect.poll(()=>peak(page),{timeout:6000}).toBeGreaterThan(.0001);
 await page.locator('.music-toggle').click();
 await expect(page.locator('.music-toggle')).toHaveAttribute('aria-pressed','false');
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {musicTest:{contexts:AudioContext[]}}).musicTest.contexts.every(context=>context.state==='closed'))).toBe(true);
 expect(errors).toEqual([]);
});

test('wedding editor follows the theme, previews volume, and preserves manual music',async({page,baseURL})=>{
 test.skip(!baseURL?.includes('127.0.0.1'),'Uses isolated local editor; does not create customer orders.');
 await observeAudio(page);
 const payloads:any[]=[];
 await page.route('**/api/drafts',async route=>{
  const payload=route.request().postDataJSON();payloads.push(payload);
  await route.fulfill({json:{draft:{id:payload.id,revision:payload.expected_revision+1,updated_at:new Date().toISOString()}}});
 });
 await page.goto('/test-fixtures/editor?theme=adat-sunda#extras');
 await page.getByRole('checkbox',{name:/Simpan otomatis/}).uncheck();
 const picker=page.getByRole('region',{name:'Pilihan musik undangan'}),select=picker.getByLabel('Musik latar');
 await expect(select).toHaveValue('theme');
 await expect(picker.locator('.music-selection-card')).toContainText('Embun Priangan');
 await picker.getByRole('button',{name:'▶ Preview musik',exact:true}).click();
 await expect.poll(()=>peak(page)).toBeGreaterThan(.0001);
 await picker.getByRole('slider',{name:'Volume musik'}).press('Home');
 await expect.poll(()=>peak(page)).toBeLessThan(.00001);
 for(let i=0;i<9;i++)await picker.getByRole('slider',{name:'Volume musik'}).press('ArrowRight');
 await expect.poll(()=>peak(page)).toBeGreaterThan(.0001);
 await page.getByRole('button',{name:'06 Tema & review',exact:true}).click();
 await page.getByLabel('Desain undangan').selectOption('adat-jawa');
 await page.getByRole('button',{name:'05 Musik & hadiah',exact:true}).click();
 await expect(select).toHaveValue('theme');
 await expect(picker.locator('.music-selection-card')).toContainText('Lerem Pendopo');
 await page.getByRole('button',{name:'Simpan sekarang',exact:true}).first().click();
 await expect(page.locator('.save-indicator')).toHaveText('Tersimpan di server');
 expect(payloads.at(-1).content.music).toBe('theme');expect(payloads.at(-1).theme_slug).toBe('adat-jawa');
 await select.selectOption('moonlight');
 await page.getByRole('button',{name:'06 Tema & review',exact:true}).click();
 await page.getByLabel('Desain undangan').selectOption('adat-bali');
 await page.getByRole('button',{name:'05 Musik & hadiah',exact:true}).click();
 await expect(select).toHaveValue('moonlight');
 await picker.getByRole('button',{name:'Gunakan musik sesuai tema'}).click();
 await expect(select).toHaveValue('theme');await expect(picker.locator('.music-selection-card')).toContainText('Fajar Bali');
 await select.selectOption('none');
 await expect(picker.getByRole('button',{name:'▶ Preview musik',exact:true})).toHaveCount(0);
});
