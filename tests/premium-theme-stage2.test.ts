import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALL_THEME_SLUGS} from '../lib/theme-registry.ts';
const css=readFileSync(new URL('../app/invitation-theme-premium.css',import.meta.url),'utf8');
const layout=readFileSync(new URL('../app/layout.tsx',import.meta.url),'utf8');
test('premium stage2 stylesheet covers every registered theme',()=>{
 assert.equal(ALL_THEME_SLUGS.length,16);
 for(const slug of ALL_THEME_SLUGS)assert.ok(css.includes(`.theme-${slug}`),slug);
});
test('premium theme layer is loaded after shared premium motion',()=>{
 const motion=layout.indexOf("./invitation-premium-motion.css"),theme=layout.indexOf("./invitation-theme-premium.css");
 assert.ok(motion>=0&&theme>motion);
});
test('stage2 keeps reduced-motion and mobile safeguards',()=>{
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.ok(css.includes('.event-box'));
 assert.ok(css.includes('.gift-account'));
 assert.ok(css.includes('.wish-card'));
 assert.ok(css.includes('.inv-bottom-nav'));
});
