import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('premium motion is globally bootstrapped but scoped to invitation roots',()=>{
 const layout=read('app/layout.tsx'),boot=read('components/PremiumMotionBoot.tsx');
 assert.match(layout,/PremiumMotionBoot/);
 assert.match(layout,/invitation-premium-motion\.css/);
 assert.match(boot,/querySelectorAll<HTMLElement>\('\.invitation'\)/);
 assert.match(boot,/inv-premium-motion/);
});

test('premium motion supports alternating reveals, staggered cards and interaction classes',()=>{
 const boot=read('components/PremiumMotionBoot.tsx'),css=read('app/invitation-premium-motion.css');
 for(const term of ['pm-rise','pm-left','pm-right','pm-scale','pm-stagger','pm-interactive','pm-floating-control'])assert.ok(boot.includes(term),term);
 for(const term of ['pm-heading-in','pm-stagger-in','pm-dock-in','@media(hover:hover)','photo-grid','inv-bottom-nav'])assert.ok(css.includes(term),term);
});

test('premium motion preserves accessibility and reduced-motion behavior',()=>{
 const boot=read('components/PremiumMotionBoot.tsx'),css=read('app/invitation-premium-motion.css');
 assert.ok(boot.includes("prefers-reduced-motion: reduce"));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('.inv-reveal-pending'));
 assert.ok(css.includes('@media print'));
});
