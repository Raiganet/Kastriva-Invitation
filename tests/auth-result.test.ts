import test from 'node:test';
import assert from 'node:assert/strict';
import { authFailureKind, verifiedUser, requireAdminDecision, AUTH_UNAVAILABLE } from '../lib/auth-result.ts';
import { HttpError } from '../lib/http-errors.ts';
const user = {id:'a0000000-0000-4000-8000-000000000001', email:'fixture@example.invalid'};
const hasStatus = (status:number) => (e:unknown) => e instanceof HttpError && e.status===status;

test('auth: verified getUser identity is returned unchanged',async()=>{
 let calls=0;const result=await verifiedUser(async()=>{calls++;return {data:{user},error:null};});
 assert.equal(result,user);assert.equal(calls,1);
});
test('auth: a successful no-user answer asks for login',async()=>{
 await assert.rejects(verifiedUser(async()=>({data:{user:null},error:null})),hasStatus(401));
});
for (const error of [
 {name:'AuthSessionMissingError',status:400}, {code:'bad_jwt',status:401},
 {code:'refresh_token_not_found',status:400}, {code:'session_not_found',status:403},
 {code:'refresh_token_already_used',status:400}, {code:'user_banned',status:403},
]) test('auth: explicit missing or revoked session '+JSON.stringify(error),async()=>{
 assert.equal(authFailureKind(error),'session');
 await assert.rejects(verifiedUser(async()=>({data:{user:null},error})),hasStatus(401));
});
for (const error of [
 {name:'AuthRetryableFetchError',status:0},{name:'AuthUnknownError',status:400},
 {name:'TypeError',message:'fetch failed'}, {name:'AbortError'},
 {code:'request_timeout',status:408}, {code:'over_request_rate_limit',status:429},
 {status:500},{status:503},{status:401,message:'Invalid API key'},
 {status:403,message:'Proxy refused'}, {code:'unexpected_failure',status:422},
 {code:'bad_jwt',status:503}, {name:'AuthSessionMissingError',status:503},
]) test('auth: dependency failure must NOT invalidate session '+JSON.stringify(error),async()=>{
 assert.equal(authFailureKind(error),'unavailable');
 // Even a user object alongside an error cannot bypass authentication.
 await assert.rejects(verifiedUser(async()=>({data:{user},error})),hasStatus(503));
});
test('auth: thrown transport error is private and retryable, not a sign-out',async()=>{
 try {await verifiedUser(async()=>{throw new Error('sb_secret_FIXTURE hidden URL');});assert.fail();}
 catch(e){assert.ok(hasStatus(503)(e));assert.equal((e as HttpError).message,AUTH_UNAVAILABLE);}
});
test('auth: thrown session-missing error requires login',async()=>{
 await assert.rejects(verifiedUser(async()=>{throw Object.assign(new Error('missing'),{name:'AuthSessionMissingError'});}),hasStatus(401));
});
for(const reply of [undefined,null,{}, {data:{}}, {data:{user}}, {error:null},
 {error:null,data:{user:{id:'forged'}}}, {error:null,data:{user:false}}, {error:undefined,data:{user}},
 {error:null,data:[]}, {error:null,data:{user:[]}}, {error:null,data:{user:'admin'}}]) {
 test('auth: malformed SDK response is unavailable '+JSON.stringify(reply),async()=>{
  await assert.rejects(verifiedUser(async()=>reply as never),hasStatus(503));
 });
}
test('admin: confirmed boolean true allows access',()=>assert.doesNotThrow(()=>requireAdminDecision(true,null)));
test('admin: confirmed boolean false denies access',()=>assert.throws(()=>requireAdminDecision(false,null),hasStatus(403)));
for(const [data,error] of [[true,{code:'FETCH_ERROR'}],[false,{code:'42501'}],[null,null],['true',null],[{},null],[true,undefined]]) {
 test('admin: failed or malformed role check is unavailable '+JSON.stringify([data,error]),()=>{
  assert.throws(()=>requireAdminDecision(data,error),hasStatus(503));
 });
}
