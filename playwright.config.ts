import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'./e2e',fullyParallel:false,workers:1,retries:0,timeout:30000,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:3000',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['Pixel 7']}}],
 webServer:{command:'node scripts/start-e2e.mjs',url:'http://127.0.0.1:3000/api/health',reuseExistingServer:false,timeout:60000},
});
