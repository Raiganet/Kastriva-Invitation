import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALL_THEME_SLUGS} from '../lib/theme-registry.ts';

const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('app/invitation-theme-polish.css');
const layout=read('app/layout.tsx');

test('stage3 polish layer is loaded after stage2 premium layer',()=>{
 assert.ok(layout.indexOf("invitation-theme-premium.css")<layout.indexOf("invitation-theme-polish.css"));
});
test('stage3 polish covers all registered themes',()=>{
 for(const slug of ALL_THEME_SLUGS)assert.ok(css.includes(`.theme-${slug}`),slug);
 assert.equal(ALL_THEME_SLUGS.length,16);
});
test('stage3 refines headings, overlines, guest card, nav and music controls',()=>{
 for(const term of ['.inv-section>.overline','.inv-section>h2','.guest-card','.inv-bottom-nav button[aria-current]','.music-toggle[aria-pressed=true]'])assert.ok(css.includes(term),term);
});
test('stage3 has mobile and reduced-motion safeguards',()=>{
 assert.ok(css.includes('@media(max-width:600px)'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});
test('stage3 does not fetch external assets or embed javascript',()=>{
 assert.ok(!/https?:\/\//.test(css));
 assert.ok(!/javascript:/i.test(css));
});
