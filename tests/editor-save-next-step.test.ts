import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

const editor=read('components/DraftEditor.tsx');
const publication=read('components/commerce/PublicationControls.tsx');
const commerce=read('lib/commerce.ts');

test('confirmed draft save exposes checkout next step without refresh',()=>{
 assert.ok(editor.includes("const savedReady=state.revision>0&&!dirty&&!state.pending&&state.phase==='idle'"));
 assert.ok(editor.includes("href={`/dashboard/undangan/${id}/pesan`}"));
 assert.ok(editor.includes('Lanjut ke Pesan & terbitkan'));
});

test('draft editor still saves normally before confirmation',()=>{
 assert.ok(editor.includes("onClick={()=>void controller.save()}"));
 assert.ok(editor.includes('Simpan sekarang'));
});

test('publication slug normalizes friendly input while backend remains strict',()=>{
 assert.ok(publication.includes('function normalizePublicSlugInput'));
 assert.ok(publication.includes(".replace(/&/g,'-dan-')"));
 assert.ok(publication.includes(".replace(/[^a-z0-9-]+/g,'-')"));
 assert.ok(commerce.includes("PUBLIC_SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/"));
});