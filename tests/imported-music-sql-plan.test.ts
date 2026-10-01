import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {sqlTestPlan} from '../scripts/sql-test-plan.mjs';
test('018 imported music migration and test are reviewed twice in isolated SQL plan',()=>{
 const names=readdirSync(new URL('../supabase/migrations',import.meta.url)).filter(s=>s.endsWith('.sql'));
 const plan=sqlTestPlan(names);
 for(const p of ['supabase/migrations/018_imported_music.sql','supabase/tests/018_imported_music.sql'])assert.equal(plan.filter(x=>x===p).length,2,p);
 assert.ok(plan.indexOf('supabase/migrations/018_imported_music.sql')>plan.indexOf('supabase/migrations/017_music_volume.sql'));
});
