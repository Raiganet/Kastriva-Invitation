import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('app/invitation-depth-effects.css');
const boot=read('components/PremiumMotionBoot.tsx');
const layout=read('app/layout.tsx');

test('stage4 depth layer loads after stage3 polish',()=>{
 assert.ok(layout.indexOf("invitation-theme-polish.css")<layout.indexOf("invitation-depth-effects.css"));
});
test('stage4 pointer depth is fine-pointer and reduced-motion aware',()=>{
 assert.ok(boot.includes("matchMedia('(hover:hover) and (pointer:fine)')"));
 assert.ok(boot.includes("prefers-reduced-motion: reduce"));
 assert.ok(css.includes('@media(hover:hover) and (pointer:fine)'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});
test('stage4 enhances depth cards without changing content contracts',()=>{
 for(const term of ['pm-depth-card','--pm-card-x','--pm-card-y','--pm-ambient-x','--pm-ambient-y'])assert.ok(boot.includes(term)||css.includes(term),term);
});
test('stage4 covers dividers, gifts, wishes, forms, nav and gallery',()=>{
 for(const term of ['pm-divider-draw','gift-disclosure[open]','.general-wishes .wish-card',':focus-within','.inv-bottom-nav button[aria-current]','.gallery-control'])assert.ok(css.includes(term),term);
});
test('stage4 contains no external asset dependency',()=>{
 assert.ok(!/https?:\/\//.test(css));
 assert.ok(!/javascript:/i.test(css));
});
