import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const script=path.resolve(import.meta.dirname,'../scripts/check-env.mjs');
function run(values:Record<string,string>,file?:string,filename='.env.local'){const dir=mkdtempSync(path.join(os.tmpdir(),'ki-env-'));const env:NodeJS.ProcessEnv={NODE_ENV:process.env.NODE_ENV || 'development'};for(const[k,v]of Object.entries(process.env)){if(v!==undefined&&!k.startsWith('NEXT_PUBLIC_')&&!['ENABLE_ORDER_REQUESTS','ENABLE_CHECKOUT','ENABLE_PUBLIC_INVITATIONS','ENABLE_RSVP','RATE_LIMIT_HMAC_KEY','SUPABASE_SECRET_KEY','VERCEL'].includes(k))env[k]=v;}Object.assign(env,values);if(file)writeFileSync(path.join(dir,filename),file);try{return spawnSync(process.execPath,[script],{cwd:dir,env,encoding:'utf8'});}finally{rmSync(dir,{recursive:true,force:true});}}
test('empty environment starts demo only',()=>{const r=run({});assert.equal(r.status,0);assert.match(r.stdout,/mode demo/);});
test('partial backend configuration fails before build',()=>assert.equal(run({NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co'}).status,1));
test('publishable configuration passes format validation without claiming connectivity',()=>{const r=run({NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example'});assert.equal(r.status,0);assert.match(r.stdout,/belum diuji/);});
test('secret Supabase key rejected and never echoed',()=>{const value='sb_secret_DO_NOT_DISPLAY_123';const r=run({NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:value});assert.equal(r.status,1);assert.ok(!(r.stdout+r.stderr).includes(value));});
test('legacy service_role JWT in any NEXT_PUBLIC variable is rejected',()=>{const token='e30.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.signature';const r=run({NEXT_PUBLIC_ANY:token});assert.equal(r.status,1);assert.ok(!r.stderr.includes(token));});
test('legacy anon JWT accepted',()=>{const token='e30.'+Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')+'.signature';assert.equal(run({NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:token}).status,0);});
test('local env files receive same secret checks',()=>assert.equal(run({},'NEXT_PUBLIC_BAD=sb_secret_not_to_publish\n').status,1));
test('nonlocal http origin and path in site origin rejected',()=>{assert.equal(run({NEXT_PUBLIC_SITE_URL:'http://example.com'}).status,1);assert.equal(run({NEXT_PUBLIC_SITE_URL:'https://example.com/dashboard'}).status,1);assert.equal(run({NEXT_PUBLIC_SITE_URL:'http://localhost:3000'}).status,0);});
test('cannot enable order requests without backend configuration',()=>assert.equal(run({ENABLE_ORDER_REQUESTS:'true'}).status,1));

test('production env files are checked before production builds',()=>assert.equal(run({NODE_ENV:'production'},'NEXT_PUBLIC_BAD=sb_secret_not_to_publish\n','.env.production').status,1));

test('public variable interpolation is rejected before Next resolves a secret',()=>{const r=run({},'SECRET=sb_secret_private\nNEXT_PUBLIC_BAD=${SECRET}\n');assert.equal(r.status,1);assert.ok(!r.stderr.includes('sb_secret_private'));});
test('backend URL must be an origin, not query/path-bearing',()=>{for(const url of ['https://example.supabase.co/rest/v1','https://example.supabase.co/?apikey=secret','https://example.supabase.co/#token']){assert.equal(run({NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example'}).status,1);}});
test('Vercel backend cannot silently use missing or local site URL',()=>{const env={VERCEL:'1',NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example'};assert.equal(run(env).status,1);assert.equal(run({...env,NEXT_PUBLIC_SITE_URL:'http://localhost:3000'}).status,1);assert.equal(run({...env,NEXT_PUBLIC_SITE_URL:'https://invitation.example'}).status,0);});
test('empty publishable key suffix rejected',()=>{assert.equal(run({NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_'}).status,1);});

const stage7Env={NEXT_PUBLIC_SITE_URL:'http://localhost:3000',NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example',ENABLE_PUBLIC_INVITATIONS:'true',SUPABASE_SECRET_KEY:'sb_secret_FIXTURE_ONLY_NOT_REAL',RATE_LIMIT_HMAC_KEY:'0123456789abcdef'.repeat(4)};
test('stage7 public gateway configuration accepts complete local test configuration',()=>assert.equal(run(stage7Env).status,0));
test('stage7 public invitation cannot omit service key even with no photos',()=>assert.equal(run({...stage7Env,SUPABASE_SECRET_KEY:''}).status,1));
test('stage7 public invitation cannot omit HMAC key',()=>assert.equal(run({...stage7Env,RATE_LIMIT_HMAC_KEY:''}).status,1));
test('stage7 rejects obviously weak key without displaying it',()=>{const value='a'.repeat(64);const r=run({...stage7Env,RATE_LIMIT_HMAC_KEY:value});assert.equal(r.status,1);assert.ok(!r.stderr.includes(value));});
test('stage7 rejects public HMAC variable',()=>{const r=run({...stage7Env,NEXT_PUBLIC_RATE_LIMIT_HMAC_KEY:stage7Env.RATE_LIMIT_HMAC_KEY});assert.equal(r.status,1);assert.ok(!r.stderr.includes(stage7Env.RATE_LIMIT_HMAC_KEY));});
test('stage7 non-Vercel remote origin fails closed',()=>assert.equal(run({...stage7Env,NEXT_PUBLIC_SITE_URL:'https://invitation.example',VERCEL:'0'}).status,1));
test('stage7 verified platform flag and HTTPS origin accept config only',()=>{const r=run({...stage7Env,NEXT_PUBLIC_SITE_URL:'https://invitation.example',VERCEL:'1'});assert.equal(r.status,0);assert.match(r.stdout,/belum diuji/);});
