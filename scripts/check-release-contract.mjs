import {readFileSync,readdirSync} from 'node:fs';
import {sqlTestPlan} from './sql-test-plan.mjs';
import manifest from '../package.json' with {type:'json'};
import contract from '../data/database-contract.json' with {type:'json'};
try {
 const names=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(n=>n.endsWith('.sql'));
 const plan=sqlTestPlan(names);
 for(const file of plan)readFileSync(new URL('../'+file,import.meta.url)); // Missing fixtures must not pass plan checks.
 const catalog=JSON.parse(readFileSync(new URL('../data/templates.json',import.meta.url),'utf8'));
 if(catalog.length!==24||new Set(catalog.map(t=>t.slug)).size!==24)throw new Error('Expected 24 unique renderer references');
 for(const name of contract.migrations)if(!plan.includes('supabase/migrations/'+name))throw new Error('A migration was omitted from the SQL plan');
 console.log(`PASS release contract ${manifest.version}: ${names.length} migrations, ${catalog.length} renderer references, ${plan.length} SQL steps.`);
 console.log('Plan validation only, not SQL execution, dependency audit or production approval.');
} catch(error) { console.error('FAIL release contract: '+(error instanceof Error?error.message:'Unknown error'));process.exitCode=1; }
