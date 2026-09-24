'use client';
// Browser-side preprocessing reduces bandwidth; Storage also enforces MIME/size/ownership.
export async function preparePhoto(file: File): Promise<Blob> {
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024||file.size<12)throw new Error('Pilih JPEG, PNG, atau WebP dengan ukuran maksimal 5 MB.');
 const b=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const png=b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10;
 const jpg=b[0]===255&&b[1]===216&&b[2]===255;
 const webp=String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
 if(!((file.type==='image/png'&&png)||(file.type==='image/jpeg'&&jpg)||(file.type==='image/webp'&&webp)))throw new Error('Isi berkas bukan gambar yang didukung.');
 const objectURL=URL.createObjectURL(file);
 try {
  const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Gambar tidak dapat dibaca.'));img.src=objectURL;});
  if(!img.naturalWidth||img.naturalWidth*img.naturalHeight>40000000)throw new Error('Resolusi gambar terlalu besar. Kecilkan dahulu.');
  const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Browser tidak mendukung pemrosesan foto.');ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Gambar gagal diproses.')),'image/webp',0.82));
  if(blob.type!=='image/webp'||blob.size>5*1024*1024)throw new Error('Browser gagal menghasilkan WebP. Coba browser terbaru.');
  return blob;
 }finally{URL.revokeObjectURL(objectURL);}
}
