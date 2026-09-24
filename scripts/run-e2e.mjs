import {existsSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {createRequire} from 'node:module';import {demoEnvironment} from './release-policy.mjs';
const root=new URL('../',import.meta.url);const req=createRequire(import.meta.url);
if(!existsSync(new URL('../.next-test/BUILD_ID',import.meta.url))){console.error('STOP: build demo belum ada. Jalankan npm run verify:release; pengujian tidak memakai .next produksi.');process.exit(1);}
let cli;try{cli=req.resolve('@playwright/test/cli');}catch{console.error('Playwright belum terpasang. Jalankan npm install dan npx playwright install chromium.');process.exit(1);}
const r=spawnSync(process.execPath,[cli,'test'],{cwd:root,stdio:'inherit',env:demoEnvironment(process.env)});process.exitCode=r.status??1;
