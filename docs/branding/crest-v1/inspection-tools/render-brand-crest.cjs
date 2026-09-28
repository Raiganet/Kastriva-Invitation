// Inspection adapter only. NOT React, Next.js, hydration, or end-to-end testing.
const fs=require('fs'),path=require('path'),ts=require('typescript');
const root=path.resolve(process.argv[2]||process.cwd()), out=path.join(root,'docs','previews','brand-crest-v1');fs.mkdirSync(out,{recursive:true});
const cache={};let component='',hook=0,settings={section:'pasangan',pane:'form',opened:false,theme:'elegant-rose',path:'/',account:'signed-in',menu:false};
const h=(type,props)=>({type,props:props||{}});let uid=0;
const react={useState(initial){const n=hook++;let value=typeof initial==='function'?initial():initial;if(component==='SiteHeader' && n===0)value=settings.menu;if(component==='PublicOpenWishes'){if(n===0)value=settings.feed;if(n===1)value=false;if(n===3)value='Tamu contoh';if(n===4)value='Selamat menempuh hidup baru. Semoga selalu dipenuhi kasih dan kebahagiaan.';}if(component==='DraftEditor'&&n===0)value=settings.section;if(component==='DraftEditor'&&n===1)value=settings.pane;if(component==='InvitationView'&&n===1)value=settings.opened;if(component==='CmsEditor'&&n===1)value=settings.cmsSection||'hero';if(component==='CmsEditor'&&n===2)value=Boolean(settings.cmsPreview);return[value,()=>{}];},useCallback:f=>f,useMemo:f=>f(),useRef:v=>({current:v}),useEffect:()=>{},useId:()=>`snapshot-${uid++}`};
const mocks={react,'react/jsx-runtime':{jsx:h,jsxs:h,Fragment:'fragment'},'next/link':{default:p=>h('a',p)},'next/navigation':{useRouter:()=>({}),usePathname:()=>settings.path},'@supabase/ssr':{createBrowserClient:()=>({})},'server-only':{}};
const owner='01234567-89ab-4def-8123-456789abcdef',id='11234567-89ab-4def-8123-456789abcdef';
function load(file){file=path.resolve(file);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;const source=fs.readFileSync(file,'utf8');if(file.endsWith('.json'))return module.exports=JSON.parse(source);const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const req=(name)=>{if(name in mocks){const x=mocks[name];return name==='next/link'?{__esModule:true,...x}:x;}let name2=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);for(const ext of ['','.tsx','.ts','.json'])if(fs.existsSync(name2+ext)&&fs.statSync(name2+ext).isFile()){name2+=ext;break;}if(name2.endsWith('useAccountNavigation.ts'))return {useAccountNavigation:()=>settings.account==='signed-in'?{href:'/dashboard',label:'Dashboard'}:settings.account==='guest'?{href:'/login',label:'Masuk'}:{href:'/dashboard',label:'Akun'}};if(name2.endsWith('useRetainedRequest.ts'))return{useRetainedRequest:()=>({busy:false,body:null,message:'',success:false,ready:true,blocked:false,locked:false,retry:()=>{},submit:async()=>{}})};if(name2.endsWith('useCommerceMutation.ts'))return{useCommerceMutation:()=>({busy:false,pending:false,message:'',success:false,ready:true,locked:false,retry:()=>{},submit:()=>{}})};if(name2.endsWith('useDraftEditor.ts'))return{useDraftEditor:()=>({controller:{getSnapshot:()=>state},state,autosave:true,setAutosave:()=>{},dirty:false})};if(name2.endsWith('usePrivatePhotos.ts'))return{usePrivatePhotos:()=>({urls:{},error:'',reload:()=>{}})};return load(name2);};new Function('require','module','exports',js)(req,module,module.exports);return module.exports;}
const domain=load(root+'/lib/domain.ts'),editor=load(root+'/lib/editor-document.ts');
let state;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(node){if(node==null||typeof node==='boolean')return'';if(Array.isArray(node))return node.map(render).join('');if(typeof node!=='object')return esc(node);const {type,props}=node;if(typeof type==='function'){const before=[component,hook];component=type.name;hook=0;const next=type(props);const result=render(next);[component,hook]=before;return result;}if(type==='fragment')return render(props.children);if(typeof type!=='string')throw Error('Unknown type');const voids=['input','img','br','hr','link','meta'];const keys=Object.entries(props).filter(([k,v])=>!['children','key','ref','suppressHydrationWarning'].includes(k)&&!k.startsWith('on')&&v!==undefined&&v!==null&&v!==false);let attrs='';for(let[k,v]of keys){if(k==='defaultValue')k='value';if(k==='className')k='class';if(k==='htmlFor')k='for';if(k==='tabIndex')k='tabindex';if(k==='style'){v=Object.entries(v).map(([a,b])=>a.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+':'+b).join(';');}if(k==='value'&&type==='textarea')continue;attrs+=' '+k+(v===true?'':`="${esc(v)}"`);}return `<${type}${attrs}>`+(voids.includes(type)?'':(type==='textarea'&&props.value!==undefined?esc(props.value):render(props.children))+`</${type}>`);}





const Header=load(root+'/components/SiteHeader.tsx').default;
const Footer=load(root+'/components/SiteFooter.tsx').default;
const Home=load(root+'/components/cms/MarketingHome.tsx').default;
const Brand=load(root+'/components/BrandLogo.tsx').default;
const defaults=load(root+'/data/cms-defaults.json');
const catalog=load(root+'/data/templates.json');
const label=h('div',{style:{background:'#fff',color:'#766b70',font:'11px Arial',padding:'8px 16px',textAlign:'center'},children:'PRATINJAU PENEMPATAN LOGO • HTML statis / bukan deployment atau data pelanggan'});
const fixtures=[
 ['home',{path:'/',menu:false,account:'signed-in'},defaults],
 ['guest',{path:'/',menu:false,account:'guest'},defaults],
 ['menu',{path:'/',menu:true,account:'signed-in'},defaults],
 ['custom',{path:'/',menu:false,account:'unknown'},{...defaults,brandName:'Kastriva Invitation Nama Panjang Penguji',tagline:'UNDANGAN DIGITAL & ACARA SPESIAL ANDA'}],
 ['private',{path:'/u/contoh',menu:false,account:'guest'},defaults],
];
for(const[name,options,content]of fixtures){
 Object.assign(settings,options);
 const main=name==='private'?h('main',{children:'Fixture: logo pemasaran tidak disisipkan pada undangan pelanggan.'}):h(Home,{content,catalog,source:'preview'});
 const body=render([label,h(Header,{content}),main,h(Footer,{content})]);
 fs.writeFileSync(path.join(out,name+'.html'),`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><title>Pratinjau statis logo Kastriva</title></head><body>${body}</body></html>`);
}
const css=['globals.css','invitation-cinematic.css','invitation-heritage.css','invitation-elementor.css','invitation-botanical.css','brand-identity.css'].map(f=>fs.readFileSync(path.join(root,'app',f),'utf8')).join('\n');
fs.writeFileSync(path.join(out,'styles.css'),css);
console.log('5 static fixtures rendered from current TSX. Hooks are mocked; no Next/React/browser interactions or backend tested.');
