import {test,expect} from '@playwright/test';

async function openTour(page:import('@playwright/test').Page,url='/demo/modern-minimalist'){
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(url);
 await page.getByRole('button',{name:/Buka undangan/}).click();
 await page.getByRole('button',{name:'Jeda gulir',exact:true}).click();
}
const enter=(card:import('@playwright/test').Locator)=>card.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));

for(const theme of ['modern-minimalist','elegant-rose','tropical-paradise'])test(`album cards flip on entry and re-arm only after leaving the reading area: ${theme}`,async({page})=>{
 await openTour(page,`/demo/${theme}`);
 const story=page.locator('[data-inv-card-kind=story]').first();
 await expect(story).toHaveAttribute('data-inv-card-state','waiting');
 await expect.poll(()=>story.evaluate(e=>Math.abs(new DOMMatrix(getComputedStyle(e).transform).m13))).toBeGreaterThan(.1);
 const event=page.locator('[data-inv-card-kind=event]').first();
 await expect.poll(()=>event.evaluate(e=>Math.abs(new DOMMatrix(getComputedStyle(e).transform).m23))).toBeGreaterThan(.1);
 const portraits=page.locator('[data-inv-card-kind=portrait]');
 await expect(portraits).toHaveCount(2);
 expect(await portraits.evaluateAll(items=>items.map(e=>getComputedStyle(e).getPropertyValue('--card-side').trim()))).toEqual(['1','-1']);
 await enter(story);
 await expect(story).toHaveAttribute('data-inv-card-state','shown');
 await expect(story).toHaveCSS('opacity','1');
 await expect.poll(()=>story.evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return Math.abs(m.m13)+Math.abs(m.m23)+Math.abs(m.m42)<.001;})).toBe(true);
 await story.evaluate(e=>window.scrollTo({top:window.scrollY+e.getBoundingClientRect().top+e.getBoundingClientRect().height/2,behavior:'instant'}));
 await expect(story).toHaveAttribute('data-inv-card-state','shown');
 await page.locator('.inv-hero').evaluate(e=>e.scrollIntoView({behavior:'instant'}));
 await expect(story).toHaveAttribute('data-inv-card-state','waiting');
 await enter(story);
 await expect(story).toHaveAttribute('data-inv-card-state','shown');
 await expect(story).toHaveCSS('opacity','1');
 await expect(story.locator('.inv-story-image')).toHaveCSS('object-fit','contain');
});

test('card hover is subtle, clears on exit and yields to controls and motion preferences',async({page,isMobile})=>{
 await openTour(page);
 const card=page.locator('[data-inv-card-kind=story]').first();await enter(card);
 await expect(card).toHaveCSS('opacity','1');
 await expect.poll(()=>card.evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return Math.abs(m.m13)+Math.abs(m.m23)+Math.abs(m.m42)<.001;})).toBe(true);
 if(isMobile){
  await card.tap();await expect(card).not.toHaveAttribute('data-inv-tilt','true');
 }else{
  await card.hover({position:{x:30,y:40}});
  await expect(card).toHaveAttribute('data-inv-tilt','true');
  const tilt=await card.evaluate(e=>({x:parseFloat(e.style.getPropertyValue('--card-hover-x')),y:parseFloat(e.style.getPropertyValue('--card-hover-y'))}));
  expect(Math.abs(tilt.x)).toBeLessThanOrEqual(2);expect(Math.abs(tilt.y)).toBeLessThanOrEqual(3);
  expect(Math.abs(tilt.x)+Math.abs(tilt.y)).toBeGreaterThan(0);
  await page.mouse.move(1,1);await expect(card).not.toHaveAttribute('data-inv-tilt','true');
 }
 const event=page.locator('[data-inv-card-kind=event]').first();await enter(event);
 await event.getByRole('button',{name:'Salin alamat',exact:true}).focus();
 await expect(event).toHaveAttribute('data-inv-card-state','shown');
 await expect(event).not.toHaveAttribute('data-inv-tilt','true');
 await expect(event).toHaveCSS('transform','none');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.inv-card-reveal.inv-reveal-pending')).toHaveCount(0);
 await expect.poll(()=>card.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).isIdentity)).toBe(true);
 await page.emulateMedia({media:'print'});
 await expect(card).toHaveCSS('opacity','1');
});

test('long chapters remain readable and keyboard focus reveals a waiting card',async({page})=>{
 await openTour(page,'/test-fixtures/invitation?theme=modern-minimalist');
 const card=page.locator('[data-inv-card-kind=story]').first();
 await expect(card).toHaveClass(/inv-card-long/);
 await enter(card);await expect(card).toHaveCSS('opacity','1');
 expect(await card.evaluate(e=>getComputedStyle(e).getPropertyValue('--card-enter-y').trim())).toBe('0deg');
 await card.evaluate(e=>window.scrollTo({top:window.scrollY+e.getBoundingClientRect().top+window.innerHeight,behavior:'instant'}));
 await expect(card).toHaveAttribute('data-inv-card-state','shown');
 await page.locator('.inv-closing').evaluate(e=>e.scrollIntoView({behavior:'instant'}));
 const event=page.locator('[data-inv-card-kind=event]').first();
 await expect(event).toHaveAttribute('data-inv-card-state','waiting');
 await event.getByRole('button',{name:'Simpan tanggal',exact:true}).focus();
 await expect(event).toHaveAttribute('data-inv-card-state','shown');
 await expect(event).toHaveCSS('opacity','1');
 await expect(event).toHaveCSS('transform','none');
});
