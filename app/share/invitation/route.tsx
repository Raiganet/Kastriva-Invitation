import {ImageResponse} from 'next/og';
export const runtime='nodejs';
export async function GET(){
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#faf5f0',color:'#794457',padding:36}}><div style={{display:'flex',width:'100%',height:'100%',border:'2px solid #d8bcc6',alignItems:'center',justifyContent:'center',flexDirection:'column',borderRadius:24}}><div style={{display:'flex',fontSize:23,letterSpacing:8,marginBottom:38}}>KASTRIVA INVITATION</div><div style={{display:'flex',fontSize:76,marginBottom:24}}>Anda diundang.</div><div style={{display:'flex',fontSize:27,color:'#76666c'}}>Sebuah cerita. Satu undangan. Banyak kenangan.</div><div style={{display:'flex',fontSize:22,marginTop:50}}>Buka undangan untuk melihat detail acara</div></div></div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=86400'}});
}
