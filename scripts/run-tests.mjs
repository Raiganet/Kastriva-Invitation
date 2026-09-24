import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
// Enumerate files explicitly so npm test behaves the same in PowerShell, cmd, and Linux.
const files = readdirSync(new URL('../tests/', import.meta.url)).filter(name => name.endsWith('.test.ts')).sort().map(name => `tests/${name}`);
const result = spawnSync(process.execPath, ['--experimental-strip-types', '--test', ...files], { cwd: new URL('../', import.meta.url), stdio: 'inherit' });
process.exitCode = result.status ?? 1;
