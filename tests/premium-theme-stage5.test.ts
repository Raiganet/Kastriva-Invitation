import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('app/invitation-depth-effects.css');
const boot=read('components/PremiumMotionBoot.tsx');

test('stage5 does not steal card pseudo-elements from legacy themes',()=>{
 assert.ok(!css.includes('.pm-depth-card::before'));
 assert.ok(!css.includes('.pm-depth-card::after'));
});
test('stage5 does not overwrite section background-image',()=>{
 assert.ok(!css.includes('.pm-section-live{'));
 assert.ok(!/background-image\s*:/.test(css));
});
test('stage5 uses browser-safe inverse ambient variables instead of calc multiplication',()=>{
 assert.ok(boot.includes('--pm-ambient-inverse-x'));
 assert.ok(boot.includes('--pm-ambient-inverse-y'));
 assert.ok(css.includes('var(--pm-ambient-inverse-x)'));
 assert.ok(!css.includes('var(--pm-ambient-x) *'));
});
test('pointerout resets only when leaving an invitation root',()=>{
 assert.ok(boot.includes('event.relatedTarget'));
 assert.ok(boot.includes('if(!from||from===to)return'));
});
test('final depth retains interaction, mobile and accessibility safeguards',()=>{
 for(const term of ['pm-depth-card','gift-disclosure[open]',':focus-within','.inv-bottom-nav button[aria-current]','.gallery-control','@media(max-width:600px)','@media(prefers-reduced-motion:reduce)'])assert.ok(css.includes(term),term);
});
