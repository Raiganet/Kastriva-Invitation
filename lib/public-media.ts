/** Pure envelope checks shared by the server proxy and unit tests. Actual decoding is done by sharp. */
export const MAX_PUBLIC_PHOTO_BYTES=5*1024*1024;
export function photoMagic(bytes:Uint8Array):'jpeg'|'png'|'webp'|null{if(bytes.length<12||bytes.length>MAX_PUBLIC_PHOTO_BYTES)return null;
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpeg';
 if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'png';
 if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'webp';return null;}
export function validPrivatePhotoPath(value:unknown):value is string{return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|jpg|png)$/.test(value);}
