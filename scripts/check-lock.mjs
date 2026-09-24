import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
try{const pkg=read('package.json'),lock=read('package-lock.json');if(lock.lockfileVersion<3||!lock.packages?.[''])throw new Error();
 for(const group of ['dependencies','devDependencies'])for(const[name,version]of Object.entries(pkg[group]||{})){if(lock.packages[''][group]?.[name]!==version||!lock.packages['node_modules/'+name]?.version)throw new Error();}
 for(const[name,item]of Object.entries(lock.packages)){if(!name)continue;if(item.link||!/^https:\/\/registry\.npmjs\.org\//.test(item.resolved||'')||!/^sha512-[A-Za-z0-9+/]+=*$/.test(item.integrity||''))throw new Error();}
 console.log('PASS: lockfile sesuai manifest dan memakai integrity registry. Ini bukan audit kerentanan.');
}catch{console.error('STOP: package-lock.json belum ada/tidak cocok/tidak tervalidasi. Jalankan npm install, tinjau lockfile, lalu npm ci. Jangan membuat lockfile manual.');process.exitCode=1;}
