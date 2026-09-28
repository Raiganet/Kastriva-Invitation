import {test,expect} from '@playwright/test';
// Actual React/Next fixture with intercepted HTTP. NOT Supabase integration or bank transactions.
const slug='ki-general-wishes-fixture';
const feed=(accepting=true)=>({ok:true,result:{accepting,showing:true,items:[],next:null}});
test('general link shows independent form; receipt and consent are explicit',async({page})=>{
 await page.route(`**/api/public/${slug}/open-wishes`,route=>route.fulfill({json:feed()}));
 let sent:Record<string,unknown>|undefined;
 await page.route(`**/api/public/${slug}/open-wishes/submit`,async route=>{
  const body=route.request().postDataJSON() as Record<string,unknown>;sent=body;
  await route.fulfill({json:{ok:true,result:{id:body.id,received:true}}});
 });
 await page.goto('/test-fixtures/wishes');
 await expect(page.getByRole('heading',{name:'Ucapan & doa',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Kirim ucapan',exact:true})).toBeEnabled();
 await expect(page.getByText('Jumlah orang',{exact:true})).toHaveCount(0);
 const consent=page.getByRole('checkbox');await expect(consent).not.toBeChecked();
 await page.getByLabel('Nama Anda').fill('Tamu Uji');
 await page.locator('textarea[name="wishMessage"]').fill('Selamat, pesan uji tanpa RSVP.');
 await page.getByRole('button',{name:'Kirim ucapan',exact:true}).click();
 await expect(page.getByText('Penerimaan dikonfirmasi.',{exact:false})).toBeVisible();
 expect(sent).toBeDefined();expect(sent?.consent).toBe(false);
 expect(sent).not.toHaveProperty('attendance');expect(sent).not.toHaveProperty('token');
 expect(sent?.receipt).toMatch(/^[a-f0-9]{64}$/);
 await page.getByText('Simpan kode penghapusan ucapan Anda',{exact:true}).click();
 await page.getByRole('button',{name:'Tampilkan kode',exact:true}).click();
 await expect(page.getByLabel('Kode penghapusan privat')).toHaveValue(`${slug}.${sent?.id}.${sent?.receipt}`);
 await expect(page.locator('.wish-card')).toHaveCount(0); // consent=false remains private
 await expect(page.getByLabel('Nama Anda')).toHaveValue('');
});
test('uncertain response retries the same ID, receipt and text',async({page})=>{
 await page.route(`**/api/public/${slug}/open-wishes`,route=>route.fulfill({json:feed()}));
 const sent:unknown[]=[];
 await page.route(`**/api/public/${slug}/open-wishes/submit`,async route=>{
  const body=route.request().postDataJSON() as Record<string,unknown>;sent.push(body);
  if(sent.length===1)await route.fulfill({status:503,json:{ok:false,message:'Server sementara tidak tersedia.'}});
  else await route.fulfill({json:{ok:true,result:{id:body.id,received:true}}});
 });
 await page.goto('/test-fixtures/wishes');
 await page.getByLabel('Nama Anda').fill('Uji retry');
 await page.locator('textarea[name="wishMessage"]').fill('Tidak boleh digandakan.');
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Kirim ucapan',exact:true}).click();
 await expect(page.getByRole('button',{name:'Coba ulang pengiriman yang sama',exact:true})).toBeEnabled();
 await expect(page.getByLabel('Nama Anda')).toBeDisabled();
 await page.getByRole('button',{name:'Coba ulang pengiriman yang sama',exact:true}).click();
 await expect.poll(()=>sent.length).toBe(2);expect(sent[1]).toEqual(sent[0]);
 await expect(page.getByText('Penerimaan dikonfirmasi.',{exact:false})).toBeVisible();
});
test('closed intake remains explained and does not submit',async({page})=>{
 await page.route(`**/api/public/${slug}/open-wishes`,route=>route.fulfill({json:feed(false)}));
 let writes=0;await page.route(`**/api/public/${slug}/open-wishes/submit`,route=>{writes++;return route.abort();});
 await page.goto('/test-fixtures/wishes');await expect(page.getByRole('button',{name:'Kirim ucapan',exact:true})).toBeDisabled();
 await expect(page.getByText('Tuan rumah belum membuka atau telah menutup penerimaan ucapan.',{exact:false})).toBeVisible();expect(writes).toBe(0);
});
