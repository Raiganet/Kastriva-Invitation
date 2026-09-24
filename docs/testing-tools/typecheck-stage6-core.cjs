// Semantic check of dependency-free logic + tests ONLY, not the Next.js/React/Supabase app.
const path=require('node:path'),ts=require('typescript'),fs=require('node:fs');
const root=path.resolve(process.argv[2]||process.cwd());
const candidates=[path.join(root,'node_modules/@types'),path.resolve(path.dirname(require.resolve('typescript')),'../../ts-node/node_modules/@types')];
const typeRoots=candidates.filter(p=>fs.existsSync(path.join(p,'node')));
if(!typeRoots.length){console.error('Node type definitions unavailable. Install dependencies; no check was performed.');process.exit(2);}
const files=['lib/cms.ts','lib/admin-operations.ts','tests/cms.test.ts','tests/admin-operations.test.ts','tests/stage6-contracts.test.ts'];
const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,lib:['lib.es2023.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],strict:true,noEmit:true,allowImportingTsExtensions:true,skipLibCheck:true,esModuleInterop:true,types:['node'],typeRoots};
const program=ts.createProgram(files.map(f=>path.join(root,f)),options),errors=ts.getPreEmitDiagnostics(program);
for(const d of errors)console.error(ts.formatDiagnostic(d,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
const local=program.getSourceFiles().filter(f=>f.fileName.startsWith(root)&&!f.isDeclarationFile).map(f=>path.relative(root,f.fileName));
console.log(JSON.stringify({scope:'Strict semantic typecheck of pure logic and selected tests ONLY; NOT Next.js application',typescript:ts.version,files:local,errors:errors.length},null,2));if(errors.length)process.exitCode=1;
