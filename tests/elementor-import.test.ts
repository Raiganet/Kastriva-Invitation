import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectElementor} from '../lib/elementor-import.ts';
const template=(content:unknown[])=>({title:'LUXURY 1',type:'page',version:'0.4',content});
test('Elementor metadata extracts design without executable HTML or external calls',()=>{
 const result=inspectElementor(template([{id:'cover',elType:'section',settings:{background_color:'#002420',_element_id:'undangan'},elements:[{widgetType:'heading',settings:{title_color:'#efa947',typography_font_family:'Great Vibes',title:'<script>alert(1)</script>'},elements:[]},{widgetType:'html',settings:{html:'<script>fetch("https://example.com")</script>'},elements:[]}]}]));
 assert.equal(result.nodeCount,3);assert.equal(result.palette.background,'#002420');assert.equal(result.palette.accent,'#EFA947');assert.equal(result.headingFont,'Great Vibes');assert.deepEqual(result.unsupportedWidgets,['html']);assert.ok(!JSON.stringify(result).includes('fetch('));
});
test('Elementor inspection never treats arbitrary font, CSS, or link values as renderable settings',()=>{
 const result=inspectElementor(template([{widgetType:'heading',settings:{title_color:'red;url(https://example.com)',typography_font_family:'url(https://example.com)',image:{url:'javascript:alert(1)'},a:{url:'https://user:password@example.com/a.png'},b:{url:'https://example.com/a.png'},c:{url:'https://example.com/a.svg'},d:{url:'https://example.com/a.png'}}}]));
 assert.equal(result.headingFont,'Georgia');assert.equal(result.palette.accent,'#EFA947');assert.deepEqual(result.assetUrls,['https://example.com/a.png']);
});
test('Malformed, incompatible and overly deep Elementor documents fail explicitly',()=>{
 for(const value of [null,[],{}, {...template([]),version:'99'},template([null]),template([{elements:{}}])])assert.throws(()=>inspectElementor(value));
 let node:unknown={elements:[]};for(let i=0;i<26;i++)node={elements:[node]};assert.throws(()=>inspectElementor(template([node])),/terlalu dalam/);
 assert.throws(()=>inspectElementor(template(Array.from({length:2001},()=>({elements:[]})))),/2.000/);
});
test('Prototype-shaped widget names remain inert report data',()=>{
 const result=inspectElementor(template([{widgetType:'__proto__'},{widgetType:'constructor'}]));assert.equal(result.widgets.__proto__,1);assert.equal(result.widgets.constructor,1);assert.equal(Object.getPrototypeOf(result.widgets),null);
});
test('Import provenance is retained and the published renderer has the agreed catalog price',()=>{
 const report=JSON.parse(readFileSync(new URL('../data/imported/luxury-1.json',import.meta.url),'utf8'));
 assert.equal(report.source,'LUXURY 1.json');assert.match(report.sha256,/^[a-f0-9]{64}$/);assert.equal(report.nodeCount,77);assert.equal(report.sections.length,7);assert.equal(report.assetUrls.length,24);
 const catalog=JSON.parse(readFileSync(new URL('../data/templates.json',import.meta.url),'utf8'));const luxury=catalog.find((t:{slug:string})=>t.slug==='elementor-luxury-1');assert.equal(luxury.price,200000);assert.equal(luxury.active,true);assert.equal(luxury.category,'pernikahan');
 const route=readFileSync(new URL('../app/admin/tema/elementor/page.tsx',import.meta.url),'utf8');assert.match(route,/await requireAdmin\(\)/);
});
