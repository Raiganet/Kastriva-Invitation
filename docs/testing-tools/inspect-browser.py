from pathlib import Path
import json,sys,shutil,os
from playwright.sync_api import sync_playwright
r=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve();root=r/'test-results/stage3-static'
report={'kind':'static layout and isolated browser modules; NOT a Next.js end-to-end test','layout':[]}
pics=r/'docs/previews/stage3';pics.mkdir(exist_ok=True,parents=True)
with sync_playwright() as p:
 executable=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
 browser=p.chromium.launch(**({'executable_path':executable} if executable else {}))
 page=browser.new_page()
 for width in [360,390,768,1440]:
  for section in ['pasangan','acara','cerita','galeri','review']:
   page.set_viewport_size({'width':width,'height':1000})
   page.set_content((root/f'{section}-form.html').read_text().replace('<link rel="stylesheet" href="styles.css">','<style>'+ (root/'styles.css').read_text()+'</style>'))
   check=page.evaluate('''()=>({body:document.documentElement.scrollWidth,viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})''')
   report['layout'].append({'width':width,'section':section,'pane':'form',**check})
   if width==1440 and section=='pasangan':page.screenshot(path=str(pics/'editor-desktop-static.png'),full_page=True)
   if width==390 and section=='pasangan':page.screenshot(path=str(pics/'editor-mobile-static.png'),full_page=True)
  for section in ['pasangan','acara','review']:
   page.set_content((root/f'{section}-preview.html').read_text().replace('<link rel="stylesheet" href="styles.css">','<style>'+ (root/'styles.css').read_text()+'</style>'))
   check=page.evaluate('''()=>({body:document.documentElement.scrollWidth,viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})''')
   report['layout'].append({'width':width,'section':section,'pane':'preview',**check})
   if width==390 and section=='review':page.screenshot(path=str(pics/'live-preview-mobile-static.png'),full_page=True)
 page.set_content('<html><body>Isolated Canvas/File test</body></html>')
 # These call real browser Canvas/File APIs, not the static renderer or a mocked image processor.
 report['photo']=page.evaluate('''async(code)=>{
  const preparePhoto=new Function(code+';return preparePhoto;')();const results=[];
  async function imageFile(width,height){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.fillStyle='#bc8571';ctx.fillRect(0,0,width,height);const blob=await new Promise(r=>c.toBlob(r,'image/png'));return new File([blob],'test.png',{type:'image/png'});}
  for(const [w,h]of [[2400,1600],[1,3000],[800,800]]){const blob=await preparePhoto(await imageFile(w,h));const bmp=await createImageBitmap(blob);results.push({case:`resize ${w}x${h}`,pass:blob.type==='image/webp'&&bmp.width>=1&&bmp.height>=1&&Math.max(bmp.width,bmp.height)<=1600,width:bmp.width,height:bmp.height,type:blob.type});bmp.close();}
  for(const file of [new File(['<svg/>'],'a.svg',{type:'image/svg+xml'}),new File(['hello fake png'],'fake.png',{type:'image/png'}),new File([new Uint8Array(5242881)],'large.png',{type:'image/png'}),new File(['tiny'],'tiny.png',{type:'image/png'})]){let rejected=false;try{await preparePhoto(file);}catch{rejected=true;}results.push({case:file.name,pass:rejected});}
  return results;
 }''', (root/'photo.js').read_text().replace('export async function','async function'))
 report['session']={'status':'not covered by this inspection tool; controller uses in-memory IO in Node unit tests'}
 browser.close()
report['overflow_count']=sum(row['overflow'] for row in report['layout'])
(r/'docs/test-results/stage3/browser-inspection.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'layouts':len(report['layout']),'overflows':report['overflow_count'],'photo_tests':report['photo'],'session_tests':report['session']},indent=2))
