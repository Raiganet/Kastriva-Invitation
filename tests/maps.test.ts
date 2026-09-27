import test from 'node:test';
import assert from 'node:assert/strict';
import {googleMapsSearch,mapLink} from '../lib/maps.ts';
import {blankContent,parseDraft,withEvents,invitationEvents} from '../lib/domain.ts';
test('map links preserve customer pins and only label known Maps hosts as Google',()=>{
 for(const href of ['https://maps.app.goo.gl/ExamplePin?g_st=aw','https://www.google.com/maps/place/Example','https://maps.google.co.id/?q=Jakarta','https://goo.gl/maps/Example'])assert.deepEqual(mapLink(' '+href+' '),{href,label:'Buka Google Maps'});
 assert.equal(mapLink('https://maps.app.goo.gl.evil.invalid/location').label,'Buka peta');
 for(const href of ['javascript:alert(1)','http://maps.google.com/','https://user:password@maps.google.com/','<iframe src="https://maps.google.com"></iframe>',''])assert.equal(mapLink(href).href,'');
});
test('editor search encodes location text without inserting additional URL parameters',()=>{
 const url=new URL(googleMapsSearch('Gedung A & B','Jl. Contoh #2'));
 assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('api'),'1');assert.equal(url.searchParams.get('query'),'Gedung A & B, Jl. Contoh #2');assert.equal([...url.searchParams].length,2);
 assert.ok(googleMapsSearch('❤'.repeat(200),'Contoh').length<2048);assert.equal(googleMapsSearch('',''),'https://www.google.com/maps');
});
test('separate ceremony and reception pins survive draft validation with the primary projection',()=>{
 const first={...invitationEvents(blankContent)[0],id:'akad',mapUrl:'https://maps.app.goo.gl/AkadExample'};
 const second={...first,id:'resepsi',label:'Resepsi',mapUrl:'https://www.google.com/maps/search/?api=1&query=Gedung+Contoh'};
 const draft=parseDraft(withEvents(blankContent,[first,second]),'00000000-0000-4000-8000-000000000001');
 assert.equal(draft.mapUrl,first.mapUrl);assert.equal(draft.events?.[1].mapUrl,second.mapUrl);
});
