import {createRequire} from 'node:module';import {spawn} from 'node:child_process';import {demoEnvironment} from './release-policy.mjs';
if(process.env.KI_E2E_DEMO!=='true'){console.error('Only run via isolated Playwright test.');process.exit(1);}
const req=createRequire(import.meta.url);const child=spawn(process.execPath,[req.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3000'],{cwd:new URL('../',import.meta.url),stdio:'inherit',env:demoEnvironment(process.env)});
for(const event of ['SIGINT','SIGTERM'])process.on(event,()=>child.kill(event));child.on('exit',code=>{process.exitCode=code??1;});
