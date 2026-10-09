import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test.use({timezoneId:'America/Los_Angeles'});
async function openSchedule(page:Page,query=''){
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(`/test-fixtures/invitation?theme=modern-minimalist${query}`);
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-hydrated','true');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.inv-content')).toBeFocused();
 const timer=page.getByRole('timer');
 await timer.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
 return timer;
}

test('schedule edition preserves three dates, timezones and calendar downloads on a narrow screen',async({page})=>{
 await page.setViewportSize({width:320,height:740});
 await openSchedule(page,'&schedule=multi');
 const cards=page.locator('.inv-event-card');await expect(cards).toHaveCount(3);
 for(const [index,weekday,zone,start] of [[0,'Jumat','WIB','20261225T010000Z'],[1,'Sabtu','WITA','20261226T030000Z'],[2,'Minggu','WIT','20261227T090000Z']] as const){
  const card=cards.nth(index);await card.scrollIntoViewIfNeeded();
  await expect(card.locator('.inv-event-date b')).toHaveText(weekday);
  await expect(card.locator('abbr')).toHaveText(zone);
  const download=page.waitForEvent('download');
  await card.getByRole('button',{name:'Simpan tanggal',exact:true}).click();
  const result=await download;expect(result.suggestedFilename()).toBe('undangan-kastriva.ics');
  const text=await readFile((await result.path())!,'utf8');
  expect(text).toContain(`DTSTART:${start}`);
  expect(text.replace(/\r\n /g,'')).toContain(await card.locator('.location-heading h4').innerText());
  await expect(card.locator('.inv-event-status')).toHaveText('File kalender siap ditambahkan.');
  await expect(card.getByRole('link',{name:/Buka Google Maps/})).toHaveAttribute('href','https://www.google.com/maps/search/?api=1&query=Monumen+Nasional+Jakarta');
  expect(await page.locator('.invitation').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 }
});

test('schedule edition flips only changed digits and catches up after offscreen or background time',async({page})=>{
 await page.clock.install({time:new Date('2026-12-24T01:02:00Z')});
 await page.clock.pauseAt(new Date('2026-12-24T01:02:03Z'));
 const timer=await openSchedule(page),numbers=timer.locator('strong');
 await expect(timer).toHaveAttribute('data-countdown-running','true');
 await expect(numbers).toHaveText(['00','23','57','57']);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await expect(timer).toHaveAttribute('data-countdown-motion','true');
 await page.clock.runFor(1000);
 await expect(numbers).toHaveText(['00','23','57','56']);
 await expect(timer.locator('[data-countdown-unit=Detik] .inv-flap-old')).toHaveCSS('animation-name','invitation-flap-close');
 await expect(timer.locator('[data-countdown-unit]:not([data-countdown-unit=Detik]) .inv-flap-motion')).toHaveCount(0);
 await expect(timer).toHaveAttribute('aria-live','off');
 await page.locator('.inv-closing').evaluate(e=>e.scrollIntoView({behavior:'instant'}));
 await expect(timer).toHaveAttribute('data-countdown-running','false');
 const paused=await numbers.allTextContents();
 await page.clock.runFor(65000);await expect(numbers).toHaveText(paused);
 await timer.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
 await expect(timer).toHaveAttribute('data-countdown-running','true');
 await expect(numbers).toHaveText(['00','23','56','51']);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(timer).toHaveAttribute('data-countdown-running','false');
 await page.clock.runFor(65000);await expect(numbers).toHaveText(['00','23','56','51']);
 await page.evaluate(()=>{delete (document as unknown as {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await expect(numbers).toHaveText(['00','23','55','46']);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(timer.locator('.inv-flap-motion')).toHaveCount(0);
 await page.clock.runFor(1000);await expect(numbers).toHaveText(['00','23','55','45']);
});

test('schedule edition stops at zero and explains incomplete dates without inventing a schedule',async({page})=>{
 await page.clock.install({time:new Date('2026-12-25T00:59:50Z')});
 await page.clock.pauseAt(new Date('2026-12-25T00:59:58Z'));
 let timer=await openSchedule(page);
 await expect(timer.locator('strong')).toHaveText(['00','00','00','02']);
 await page.clock.runFor(3000);
 await expect(timer.locator('strong')).toHaveText(['00','00','00','00']);
 await expect(timer).toHaveAttribute('data-countdown-running','false');
 await expect(page.locator('.inv-countdown-note')).toHaveText('Hari istimewa telah tiba. Sampai berjumpa!');
 timer=await openSchedule(page,'&schedule=incomplete&mode=draft');
 await expect(timer.locator('strong')).toHaveText(['--','--','--','--']);
 await expect(page.locator('.inv-countdown-note')).toHaveText('Tanggal dan jam acara belum lengkap.');
 await expect(page.getByRole('button',{name:'Simpan tanggal',exact:true})).toBeDisabled();
 await expect(page.locator('.inv-location a')).toHaveCount(0);
 await expect(page.locator('.location-note')).toHaveText('Tautan peta belum ditambahkan.');
});

test('schedule edition keeps failed calendar preparation feedback beside the relevant event',async({page})=>{
 const downloads:string[]=[];page.on('download',download=>downloads.push(download.suggestedFilename()));
 await openSchedule(page,'&schedule=invalid-time');
 const card=page.locator('.inv-event-card');
 await card.getByRole('button',{name:'Simpan tanggal',exact:true}).click();
 await expect(card.locator('.inv-event-status')).toHaveText('Lengkapi tanggal dan jam acara terlebih dahulu.');
 expect(downloads).toEqual([]);
 await expect(card.getByRole('button',{name:'Simpan tanggal',exact:true})).toBeFocused();
});

test('schedule edition copies the selected venue and offers readable fallback when copying is unavailable',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{Object.assign(window,{__copiedAddress:text});}}}));
 await openSchedule(page,'&schedule=multi');
 const card=page.locator('.inv-event-card').nth(1);
 await card.getByRole('button',{name:'Salin alamat',exact:true}).click();
 await expect(card.locator('.location-status')).toHaveText('Alamat disalin.');
 expect(await page.evaluate(()=>(window as Window&{__copiedAddress?:string}).__copiedAddress)).toBe('Taman Kenangan (contoh)\nJalan Kenangan Nomor 26, Denpasar. Alamat sintetis untuk pengujian.');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Permission denied');}}}));
 await card.getByRole('button',{name:'Salin alamat',exact:true}).click();
 await expect(card.locator('.location-status')).toHaveText('Pilih teks alamat lalu salin secara manual.');
 await expect(card.locator('.location-address')).toBeVisible();
 await expect(page.locator('.inv-event-card').first().locator('.location-status')).toBeEmpty();
});
