from pathlib import Path
from playwright.sync_api import sync_playwright
import mimetypes,json,base64,re
import sys
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
previews=root/'docs/previews/brand-crest-v1'; results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(device_scale_factor=1)
 def route(req):
  from urllib.parse import urlparse
  path=urlparse(req.request.url).path
  f=(root/'public'/path.lstrip('/')) if path.startswith('/brand/') else previews/path.lstrip('/')
  if f.exists() and f.is_file():req.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
  else:req.fulfill(status=404,body='not found')
 page.route('https://ki-brand.test/**',route)
 for name in ['home','guest','menu','custom','private']:
  for width in [320,360,390,768,1024,1440]:
   page.set_viewport_size({'width':width,'height':960})
   html=(previews/(name+'.html')).read_text().replace('<link rel="stylesheet" href="/styles.css">','<style>'+(previews/'styles.css').read_text()+'</style>')
   def inline(m):
    f=root/'public'/m[1].lstrip('/')
    mime=mimetypes.guess_type(str(f))[0] or 'image/webp'
    return 'src="data:'+mime+';base64,'+base64.b64encode(f.read_bytes()).decode()+'"'
   html=re.sub(r'src="(/brand/crest-v1/[^"]+)"',inline,html)
   page.set_content(html,wait_until='load')
   # Force lazy footer image into view then back, still pure HTML layout.
   if name!='private':
    page.locator('.site-footer').scroll_into_view_if_needed();page.wait_for_timeout(150);page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(350)
   data=page.evaluate('''() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,
    brands:[...document.querySelectorAll('.ki-brand')].map(el=>({label:el.getAttribute('aria-label'),box:{x:el.getBoundingClientRect().x,width:el.getBoundingClientRect().width},pictures:[...el.querySelectorAll('img')].map(i=>({loaded:i.complete&&i.naturalWidth>0}))})),
    headerOverlap:(()=>{const a=document.querySelector('.site-header .ki-brand'),b=document.querySelector('.nav-actions');return a&&b?a.getBoundingClientRect().right>b.getBoundingClientRect().left-3:false;})()
   })''')
   assert data['scroll']<=width+1,(name,width,data)
   assert not data['headerOverlap'],(name,width,'overlap')
   assert all(i['loaded'] for a in data['brands'] for i in a['pictures']),(name,width,'broken logo')
   assert len(data['brands'])==(0 if name=='private' else 2)
   results.append({'fixture':name,**data})
   if name=='home' and width in [390,1440]:
    page.evaluate('window.scrollTo({top:0,behavior:"instant"})');page.wait_for_timeout(100)
    page.screenshot(path=str(previews/f'homepage-{width}-static.png'))
    page.locator('.site-footer').scroll_into_view_if_needed();page.wait_for_timeout(300)
    page.locator('.site-footer').screenshot(path=str(previews/f'footer-{width}-static.png'))
   if name=='menu' and width==390:
    page.evaluate('window.scrollTo({top:0,behavior:"instant"})');page.wait_for_timeout(100)
    page.screenshot(path=str(previews/'menu-390-static.png'))
 browser.close()
report={'kind':'Chromium static HTML layout (actual TSX/CSS, mocked React hooks)','count':len(results),'all_passed':True,'checks':'horizontal overflow, logo load, header action overlap, private-route marketing-logo hiding','results':results}
(root/'docs/test-results/brand-crest-v1/layout.json').write_text(json.dumps(report,indent=2))
print(f'{len(results)} static layouts passed; no missing logos or header overlap. NOT Next/React E2E.')
