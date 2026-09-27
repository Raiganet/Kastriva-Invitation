import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import sharp from 'sharp';

// Reproduce the selected web asset without importing the source pack or its media library.
const root=process.argv[2];
if(!root)throw new Error('Usage: node scripts/prepare-botanical-assets.mjs <File Pendukung folder>');
const source='Ornamen/rose-3416596_960_720.png';
const input=await readFile(join(root,source));
const output=new URL('../public/images/themes/botanical-blush/',import.meta.url);
await mkdir(output,{recursive:true});
const {data,info}=await sharp(input).resize({width:720,withoutEnlargement:true}).webp({quality:86,alphaQuality:100,effort:6}).toBuffer({resolveWithObject:true});
await writeFile(new URL('peach-roses.webp',output),data);
const metadata={pack:'POWER POINT WEDDING INVITATION / File Pendukung',source,sourceSha256:createHash('sha256').update(input).digest('hex'),sourceBytes:input.length,output:'/images/themes/botanical-blush/peach-roses.webp',outputSha256:createHash('sha256').update(data).digest('hex'),outputBytes:data.length,width:info.width,height:info.height,transform:'Resize to 720px wide, WebP quality 86, preserve transparency, strip metadata'};
await writeFile(new URL('../data/imported/botanical-blush-assets.json',import.meta.url),JSON.stringify(metadata,null,2)+'\n');
console.log(`Prepared peach roses: ${input.length} -> ${data.length} bytes (${info.width} x ${info.height})`);
