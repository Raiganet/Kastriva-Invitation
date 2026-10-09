import {test,expect} from '@playwright/test';
test('built-in music creates actual Web Audio only after opening and closes on pause',async({page})=>{
 await page.addInitScript(()=>{
  const Native=window.AudioContext;
  const contexts:AudioContext[]=[];
  Object.assign(window,{__kiAudioContexts:contexts});
  window.AudioContext=class extends Native{constructor(options?:AudioContextOptions){super(options);contexts.push(this);}};
 });
 await page.goto('/demo/galaxy-night?view=full');
 const states=()=>page.evaluate(()=>{
  const contexts=(window as Window&{__kiAudioContexts?:AudioContext[]}).__kiAudioContexts;
  if(!contexts)throw new Error('Audio test instrumentation was not initialized.');
  return contexts.map(c=>c.state);
 });
 expect(await states()).toEqual([]);
 await page.getByRole('button',{name:/Buka undangan/}).click();
 const pause=page.locator('.inv-music').getByRole('button',{name:/^Jeda /});
 await expect(pause).toBeVisible();
 await expect.poll(states).toContain('running');
 await pause.click();
 await expect(page.locator('.inv-music').getByRole('button',{name:/^Putar /})).toHaveAttribute('aria-pressed','false');
 await expect.poll(states).toEqual(['closed']);
});
test('gift disclosure uses only the labelled demo account',async({page})=>{
 await page.goto('/demo/botanical-blush?view=full');
 await page.getByRole('button',{name:/Buka undangan/}).click();
 const details=page.locator('.gift-disclosure');
 await details.scrollIntoViewIfNeeded();
 await expect(details.locator('.gift-number')).not.toBeVisible();
 await details.locator('summary').click();
 await expect(details.locator('.gift-number')).toHaveText('0000000000');
 await expect(page.getByText('Contoh tampilan. Nomor di bawah bukan rekening untuk menerima hadiah.',{exact:true})).toBeVisible();
 await details.locator('summary').click();
 await expect(details.locator('.gift-number')).not.toBeVisible();
});
test('actual gallery dialog navigates, Escape closes and focus returns',async({page})=>{
 await page.goto('/test-fixtures/gallery');
 const opener=page.getByRole('button',{name:'Perbesar foto 1',exact:true});
 await opener.click();
 const dialog=page.getByRole('dialog',{name:'Galeri kenangan',exact:true});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByText('Foto 1 dari 2',{exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Foto berikutnya',exact:true}).click();
 await expect(dialog.getByText('Foto 2 dari 2',{exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(dialog).not.toBeVisible();
 await expect(opener).toBeFocused();
});
