import {readFileSync,writeFileSync} from 'node:fs';
import {basename} from 'node:path';
import {createHash} from 'node:crypto';
import {inspectElementor} from '../lib/elementor-import.ts';
const [source,destination]=process.argv.slice(2);
if(!source){console.error('Usage: node --experimental-strip-types scripts/inspect-elementor.mjs source.json [report.json]');process.exit(1);}
const bytes=readFileSync(source);if(bytes.length>4*1024*1024)throw new Error('Berkas maksimal 4 MB.');
const report={source:basename(source),sha256:createHash('sha256').update(bytes).digest('hex'),...inspectElementor(JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,'')))};
const output=JSON.stringify(report,null,2)+'\n';if(destination)writeFileSync(destination,output);else console.log(output);
