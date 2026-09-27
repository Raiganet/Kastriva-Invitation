/** Read design metadata only. Elementor HTML, shortcodes, scripts and URLs are never executed. */
export type ElementorInspection={title:string;version:string;nodeCount:number;widgets:Record<string,number>;palette:{background:string;accent:string;text:string};headingFont:string;sections:{id:string;anchor:string;animation:string}[];assetUrls:string[];unsupportedWidgets:string[]};
const safeWidgets=new Set(['heading','image','text-editor','button','image-gallery','google_maps','spacer','divider','icon']);
const safeAnimations=new Set(['zoomIn','slideInUp','slideInLeft','slideInRight','fadeIn','fadeInUp']);
const hex=/^#[0-9a-f]{6}$/i;
const plain=(v:unknown,max=100)=>typeof v==='string'?v.replace(/[<>\u0000-\u001f]/g,'').slice(0,max):'';
export function inspectElementor(value:unknown):ElementorInspection{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Template harus berupa objek JSON Elementor.');
 const input=value as Record<string,unknown>;
 if(!Array.isArray(input.content)||input.version!=='0.4'||!['page','section','container'].includes(String(input.type)))throw new Error('Format ekspor Elementor belum didukung.');
 const result:ElementorInspection={title:plain(input.title)||'Template Elementor',version:'0.4',nodeCount:0,widgets:Object.create(null) as Record<string,number>,palette:{background:'#002420',accent:'#EFA947',text:'#FFFFFF'},headingFont:'Georgia',sections:[],assetUrls:[],unsupportedWidgets:[]};
 const urls=new Set<string>(),unknown=new Set<string>();let background=false,accent=false,font=false;
 function assets(v:unknown,depth=0){
  if(depth>24)throw new Error('Pengaturan template terlalu dalam.');
  if(Array.isArray(v)){if(v.length>1000)throw new Error('Pengaturan template terlalu besar.');v.forEach(x=>assets(x,depth+1));}
  else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v)){
   if(k==='url'&&typeof x==='string'&&x.length<2000){try{const u=new URL(x);if(u.protocol==='https:'&&!u.username&&!u.password&&/\.(png|jpe?g|webp|gif)$/i.test(u.pathname))urls.add(u.href);}catch{/* A report does not follow malformed URLs. */}}
   else assets(x,depth+1);
  }
 }
 function visit(nodes:unknown[],depth=0){
  if(depth>24)throw new Error('Struktur template terlalu dalam.');
  for(const node of nodes){
   if(++result.nodeCount>2000)throw new Error('Template maksimal 2.000 elemen.');
   if(!node||typeof node!=='object'||Array.isArray(node))throw new Error('Elemen Elementor tidak valid.');
   const n=node as Record<string,unknown>,s=(n.settings&&typeof n.settings==='object'&&!Array.isArray(n.settings)?n.settings:{}) as Record<string,unknown>;
   if(!background&&typeof s.background_color==='string'&&hex.test(s.background_color)){result.palette.background=s.background_color.toUpperCase();background=true;}
   if(n.widgetType==='heading'){
    if(!accent&&typeof s.title_color==='string'&&hex.test(s.title_color)){result.palette.accent=s.title_color.toUpperCase();accent=true;}
    if(!font&&['Great Vibes','Dancing Script','Cinzel','Georgia'].includes(String(s.typography_font_family))){result.headingFont=String(s.typography_font_family);font=true;}
   }
   if(n.widgetType){const type=plain(n.widgetType,80);if(type){result.widgets[type]=(Object.hasOwn(result.widgets,type)?result.widgets[type]:0)+1;if(!safeWidgets.has(type))unknown.add(type);}}
   if(depth===0)result.sections.push({id:plain(n.id,40),anchor:plain(s._element_id,50),animation:safeAnimations.has(String(s._animation))?String(s._animation):''});
   assets(s);
   if(n.elements!==undefined){if(!Array.isArray(n.elements))throw new Error('Daftar elemen Elementor tidak valid.');visit(n.elements,depth+1);}
  }
 }
 visit(input.content);result.assetUrls=[...urls].sort();result.unsupportedWidgets=[...unknown].sort();return result;
}
