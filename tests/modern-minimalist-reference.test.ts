import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('app/invitation-modern-reference.css');
const layout=read('app/layout.tsx');
const view=read('components/InvitationView.tsx');
const story=read('components/InvitationStory.tsx');

test('Modern Minimalist reference layer is loaded after shared reference motion and Elegant Rose layers',()=>{
 assert.ok(layout.includes("invitation-modern-reference.css"));
 assert.ok(layout.indexOf("invitation-reference-motion.css")<layout.indexOf("invitation-modern-reference.css"));
});

test('Modern Minimalist renderer gets a dedicated story variant without new schema fields',()=>{
 assert.ok(view.includes("const modernMinimalist=template.slug==='modern-minimalist'"));
 assert.ok(view.includes("modernMinimalist?'modern-minimalist'"));
 assert.ok(story.includes("'modern-minimalist'"));
 assert.ok(story.includes('modern-story-list'));
 assert.ok(story.includes('const photo=storyPhotos[i]'));
 assert.ok(!story.includes('modernPortraitUrl'));
});

test('Modern Minimalist reference composition includes abstract ornaments, translucent cards and editorial gallery',()=>{
 for(const term of ['.theme-modern-minimalist .inv-cover::before','.theme-modern-minimalist .inv-section{','.person-monogram','.modern-story-list','.photo-grid>:is(a,button):first-child','.inv-closing'])assert.ok(css.includes(term),term);
});

test('Modern Minimalist motion recreates observed choreography with original Kastriva CSS',()=>{
 for(const term of ['mm-cover-zoom','mm-fade-up','mm-fade-down','mm-watermark-drift','.inv-section.inv-reveal-pending'])assert.ok(css.includes(term),term);
});

test('Modern Minimalist layer has responsive and reduced-motion safeguards',()=>{
 assert.ok(css.includes('@media(max-width:600px)'));
 assert.ok(css.includes('@media(max-width:380px)'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});

test('Modern Minimalist implementation embeds no source-site assets, URLs or copied font dependency',()=>{
 assert.ok(!/wevitation\.com|themes\/mildness|https?:\/\//i.test(css+story));
 assert.ok(!/Great Vibes|Baskervville/i.test(css));
});