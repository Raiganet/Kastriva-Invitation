import {test,expect} from '@playwright/test';
import {ALL_THEME_SLUGS} from '../lib/theme-registry';
import {categoryForTheme,fieldsForCategory} from '../lib/invitation-category';

test('all nine non-wedding demos lead to ordering and preserve the selected theme',async({page})=>{
 test.setTimeout(180000);
 for(const slug of ALL_THEME_SLUGS.filter(s=>categoryForTheme(s)!=='pernikahan')){
  await page.goto('/demo/'+slug);
  const choose=page.locator('.inv-toolbar').getByRole('link',{name:'Pilih tema ↗'});
  await expect(choose).toHaveAttribute('href','/order/'+slug);
  await choose.click();
  await expect(page.getByRole('link',{name:'Lanjutkan ke draft ↗'})).toHaveAttribute('href','/dashboard/baru?template='+slug);
  await expect(page.getByRole('link',{name:'Buat akun',exact:true})).toHaveAttribute('href','/daftar?next='+encodeURIComponent('/dashboard/baru?template='+slug));
  await expect(page.getByText('Editor dan pemesanan kategori non-pernikahan',{exact:false})).toHaveCount(0);
 }
});

for(const slug of ['jubilee-carousel','nur-eden','nocturne-gala','elegant-rose'])test('category editor saves and previews '+slug,async({page,isMobile,baseURL})=>{
 test.skip(!baseURL?.includes('127.0.0.1'),'Local isolated fixture only; never create production test orders.');
 if(isMobile)await page.setViewportSize({width:390,height:844});
 const category=categoryForTheme(slug)!, fields=fieldsForCategory(category),errors:string[]=[],payloads:any[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/drafts',async route=>{
  const payload=route.request().postDataJSON();payloads.push(payload);
  await route.fulfill({json:{draft:{id:payload.id,revision:payload.expected_revision+1,updated_at:new Date().toISOString()}}});
 });
 await page.goto('/test-fixtures/editor?theme='+slug);
 const form=page.locator('.studio-form');
 await page.getByRole('checkbox',{name:/Simpan otomatis/}).uncheck();
 await form.getByLabel(fields.name,{exact:true}).fill('Nama Contoh');
 await form.getByLabel(fields.host,{exact:true}).fill('Keluarga atau Penyelenggara Contoh');
 if(category==='pernikahan')await form.getByLabel('Nama mempelai wanita',{exact:true}).fill('Pasangan Contoh');
 else await expect(form.getByLabel('Nama mempelai wanita',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'02 Acara & lokasi',exact:true}).click();
 await expect(form.getByLabel('Nama acara',{exact:true})).toHaveValue(fields.event);
 await form.getByLabel('Tanggal acara',{exact:true}).fill('2027-12-25');
 await form.getByLabel('Nama gedung / tempat').fill('Tempat Contoh');
 await form.getByLabel('Alamat lengkap',{exact:true}).fill('Alamat Contoh');
 await page.getByRole('button',{name:'06 Tema & review',exact:true}).click();
 const options=await form.getByLabel('Desain undangan').locator('option').evaluateAll(nodes=>nodes.map(n=>(n as HTMLOptionElement).value));
 expect(options.every(t=>categoryForTheme(t)===category)).toBe(true);
 expect(options.length).toBe(category==='pernikahan'?15:3);
 await page.getByRole('button',{name:'Simpan sekarang',exact:true}).first().click();
 await expect(page.locator('.save-indicator')).toHaveText('Tersimpan di server');
 expect(payloads).toHaveLength(1);expect(payloads[0].theme_slug).toBe(slug);
 expect(payloads[0].content.bride).toBe(category==='pernikahan'?'Pasangan Contoh':'');
 expect(payloads[0].content.events[0].label).toBe(fields.event);
 await expect(page.getByRole('link',{name:'Lanjut ke Pesan & terbitkan →'})).toHaveAttribute('href',/\/pesan$/);
 if(isMobile)await page.getByRole('button',{name:'Preview langsung',exact:true}).click();
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await expect(page.locator('.invitation')).toHaveAttribute('data-inv-opening-state','open');
 if(category!=='pernikahan')await expect(page.locator('.inv-host')).toHaveText('Keluarga atau Penyelenggara Contoh');
 expect(await page.locator('.invitation').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 expect(errors).toEqual([]);
});
