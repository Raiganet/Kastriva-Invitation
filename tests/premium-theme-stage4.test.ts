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
test('stage4/stage5 keeps depth classes and ambient motion without content-contract changes',()=>{
 for(const term of ['pm-depth-card','--pm-ambient-x','--pm-ambient-y'])assert.ok(boot.includes(term)||css.includes(term),term);
 assert.ok(boot.includes('--pm-ambient-inverse-x'));
 assert.ok(boot.includes('--pm-ambient-inverse-y'));
});
test('stage4/stage5 covers dividers, gifts, forms, nav and gallery with collision-safe depth',()=>{
 for(const term of ['pm-divider-draw','gift-disclosure[open]',':focus-within','.inv-bottom-nav button[aria-current]','.gallery-control'])assert.ok(css.includes(term),term);
 assert.ok(!css.includes('.pm-depth-card::before'));
 assert.ok(!css.includes('.pm-depth-card::after'));
});
test('stage4/stage5 contains no external asset dependency',()=>{
 assert.ok(!/https?:\/\//.test(css));
 assert.ok(!/javascript:/i.test(css));
});
