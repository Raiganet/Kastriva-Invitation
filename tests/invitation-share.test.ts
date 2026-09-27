import test from 'node:test';
import assert from 'node:assert/strict';
import {blankContent} from '../lib/domain.ts';
import {invitationShareText} from '../lib/invitation-share.ts';
test('preview uses published names and event date without private details',()=>{
 const result=invitationShareText({...blankContent,groom:' Andi ',bride:'Nisa',eventDate:'2027-01-24',address:'PRIVATE_ADDRESS',story:'PRIVATE_STORY',photoPaths:['PRIVATE_PHOTO']});
 assert.equal(result.title,'Undangan Andi & Nisa');assert.match(result.description,/24 Januari 2027/);
 assert.doesNotMatch(JSON.stringify(result),/PRIVATE_/);
});
test('preview follows the first event and bounds unusually long titles',()=>{
 const result=invitationShareText({...blankContent,groom:'A'.repeat(200),bride:'B',eventDate:'2027-01-24',events:[{id:'akad',label:'Akad',eventDate:'2028-02-03',eventTime:'08:00',endTime:'10:00',timezone:'Asia/Jakarta',venue:'Venue',address:'Address',mapUrl:''}]});
 assert.match(result.description,/3 Februari 2028/);assert.ok(result.title.length<=150);
});
