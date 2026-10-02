import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const view=read('components/InvitationView.tsx');
const couple=read('components/ElegantRoseCouple.tsx');
const story=read('components/InvitationStory.tsx');
const gallery=read('components/InvitationGallery.tsx');
const css=read('app/invitation-elegant-reference.css');
const layout=read('app/layout.tsx');
const templates=read('lib/templates.ts');

test('Elegant Rose renderer owns portrait couple, story timeline and thumbnail gallery variants',()=>{
 assert.ok(view.includes("ElegantRoseCouple"));
 assert.ok(view.includes("elegantRose?'elegant-rose':'default'"));
 assert.ok(couple.includes('elegant-couple-stack'));
 assert.ok(story.includes('elegant-story-timeline'));
 assert.ok(gallery.includes('elegant-gallery-thumbs'));
});
test('Elegant Rose portrait enhancement requires no new draft schema fields',()=>{
 assert.ok(couple.includes('photos[0]'));
 assert.ok(couple.includes('photos[1]'));
 assert.ok(!couple.includes('portraitUrl'));
 assert.ok(!couple.includes('instagram'));
});
test('Elegant Rose gallery keeps dialog accessibility and adds reduced-motion-aware autoplay',()=>{
 for(const term of ["aria-haspopup=\"dialog\"","prefers-reduced-motion: reduce","role=\"tablist\"","aria-selected"])assert.ok(gallery.includes(term),term);
});
test('reference composition CSS includes floral card, circular portraits, story connection and responsive gallery',()=>{
 for(const term of ['elegant-portrait-frame','elegant-story-timeline::before','elegant-gallery-main','elegant-gallery-thumb.is-active','.inv-closing','@media(max-width:600px)','@media(prefers-reduced-motion:reduce)'])assert.ok(css.includes(term),term);
});
test('Elegant Rose stylesheet loads after the shared reference motion layer',()=>{
 assert.ok(layout.indexOf('invitation-reference-motion.css')<layout.indexOf('invitation-elegant-reference.css'));
});
test('Elegant Rose demo gets multiple story chapters and showcases existing music/gift flow',()=>{
 assert.ok(templates.includes("template.slug==='elegant-rose'"));
 assert.ok(templates.includes('Pertemuan pertama'));
});
test('implementation does not embed Wevitation assets or URLs',()=>{
 assert.ok(!/wevitation\.com|\/themes\/elegant-rose\/img/i.test(couple+story+gallery+css));
});
