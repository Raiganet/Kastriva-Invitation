import sharp from 'sharp';
import {photoMagic} from './public-media';
/** Node-only binary decoder: no remote URLs, SVG passthrough, animation, or metadata retention. */
export async function renderPublicPhoto(bytes:Uint8Array):Promise<Uint8Array>{
 if(!photoMagic(bytes))throw new Error('UNSUPPORTED_PHOTO');
 const output=await sharp(bytes,{limitInputPixels:25000000,animated:false}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();
 return new Uint8Array(output);
}
