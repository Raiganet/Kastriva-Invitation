const fs=require('node:fs');const path=require('node:path');
let ts;try{ts=require('typescript');}catch{console.error('TypeScript belum terpasang. Jalankan npm install terlebih dahulu.');process.exit(1);}
const root=path.resolve(__dirname,'..');const files=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.next','.next-test','.git','docs'].includes(item.name))continue;const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(/\.tsx?$/.test(p)&&!p.endsWith('.d.ts'))files.push(p);}}
walk(root);let errors=0;
for(const file of files){const source=fs.readFileSync(file,'utf8');const out=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,isolatedModules:true}});for(const d of out.diagnostics||[]){if(d.category!==ts.DiagnosticCategory.Error)continue;errors++;console.error(path.relative(root,file)+': '+ts.flattenDiagnosticMessageText(d.messageText,'\n'));}
 const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 for(const s of sf.statements){if(!ts.isImportDeclaration(s)||!ts.isStringLiteral(s.moduleSpecifier))continue;const name=s.moduleSpecifier.text;if(!(name.startsWith('.')||name.startsWith('@/')))continue;const b=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);if(!['','.ts','.tsx','.json','.css','/index.ts','/index.tsx'].some(ext=>fs.existsSync(b+ext))){errors++;console.error(path.relative(root,file)+': local import not found '+name);}}
}
console.log(`${errors?'FAIL':'PASS'}: ${files.length} TS/TSX files; ${errors} syntax/local-import errors; TypeScript ${ts.version}.`);
console.log('Syntax check is not a Next.js build or dependency-aware typecheck.');if(errors)process.exitCode=1;
