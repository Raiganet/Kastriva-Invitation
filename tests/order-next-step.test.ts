import test from 'node:test';
import assert from 'node:assert/strict';
import {orderNextStep} from '../lib/order-next-step.ts';
const now=Date.parse('2026-09-27T00:00:00Z');
const paid={status:'paid' as const,expires_at:'2027-09-27T00:00:00Z'};
test('sharing requires an active publication, enabled service and known status',()=>{
 assert.equal(orderNextStep(paid,{active:true},true,true,now).hash,'#bagikan');
 for(const [enabled,known] of [[false,true],[true,false]])assert.equal(orderNextStep(paid,{active:true},enabled,known,now).hash,'');
 assert.equal(orderNextStep(paid,null,true,true,now).hash,'#publikasi');
 assert.match(orderNextStep(paid,{active:false},true,true,now).label,/ditarik/);
});
test('expiry boundary and missing expiry never suggest publishing or sharing',()=>{
 for(const expires_at of [null,'invalid',new Date(now).toISOString()])assert.equal(orderNextStep({...paid,expires_at},{active:true},true,true,now).hash,'');
});
test('payment states never suggest publication even when a publication exists',()=>{
 for(const status of ['awaiting_payment','awaiting_review','rejected','cancelled','revoked'] as const){
  const result=orderNextStep({...paid,status},{active:true},true,true,now);
  assert.notEqual(result.hash,'#bagikan');assert.notEqual(result.hash,'#publikasi');
 }
 assert.equal(orderNextStep({...paid,status:'rejected'},null,true,true,now).hash,'#konfirmasi-transfer');
});
