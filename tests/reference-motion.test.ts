import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('app/invitation-reference-motion.css');
const boot=read('components/PremiumMotionBoot.tsx');
const layout=read('app/layout.tsx');

test('reference motion stylesheet loads after prior premium/depth layers',()=>{
 assert.ok(layout.indexOf("invitation-depth-effects.css")<layout.indexOf("invitation-reference-motion.css"));
});
test('reference motion boot adds the dedicated root class and broader stagger targets',()=>{
 assert.ok(boot.includes("'inv-premium-motion','inv-reference-motion'"));
 for(const term of [".inv-timeline>li",".story-text",".gift-account",".rsvp-form"])assert.ok(boot.includes(term),term);
});
test('countdown text changes replay a local 3D flip without changing countdown data',()=>{
 assert.ok(boot.includes("characterData:true"));
 assert.ok(boot.includes("restartDigit"));
 assert.ok(boot.includes("rm-digit-flip"));
 assert.ok(css.includes("@keyframes rm-digit-flip"));
});
test('reference choreography includes dominant fade-up, cover fade-down, closing zoom and CTA pulse',()=>{
 for(const term of ["translate3d(0,30px,0)","rm-fade-down","rm-closing-zoom","rm-open-pulse"])assert.ok(css.includes(term),term);
});
test('reference layer has floral/media ambience plus mobile and reduced-motion safeguards',()=>{
 for(const term of ["rm-floral-breathe","rm-photo-breathe","@media(max-width:600px)","@media(prefers-reduced-motion:reduce)"])assert.ok(css.includes(term),term);
});
test('reference layer does not fetch or embed the source website/assets',()=>{
 assert.ok(!css.includes('wevitation.com'));
 assert.ok(!css.includes('http://'));
 assert.ok(!css.includes('https://'));
});
