"""Static HTML layout only; no React effects, hydration, HTTP, or database test."""
from pathlib import Path
import json,sys,shutil
from playwright.sync_api import sync_playwright
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
fixtures=root/'test-results/stage6-static'; out=root/'docs/previews/stage6';out.mkdir(parents=True,exist_ok=True)
css=(fixtures/'styles.css').read_text();results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium') or None,headless=True,args=['--no-sandbox'])
    page=browser.new_page()
    for file in sorted(fixtures.glob('*.html')):
        text=file.read_text().replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>')
        for width in [320,390,768,1440]:
            page.set_viewport_size({'width':width,'height':980})
            page.set_content(text,wait_until='load')
            page.wait_for_timeout(70)
            size=page.evaluate('({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})')
            results.append({'fixture':file.stem,'width':width,'overflow':size['scroll']>size['width']+1,'measured':size})
            if (file.stem,width) in [('cms-hero',1440),('cms-hero',390),('cms-katalog',390),('cms-seo',320),('cms-riwayat',1440),('home',1440),('home',390),('cms-preview',390)]:
                page.screenshot(path=str(out/f'{file.stem}-{width}.png'),full_page=True)
    browser.close()
report={'scope':'Static rendered TSX adapter; not Next.js/React/end-to-end','checks':len(results),'failures':sum(x['overflow'] for x in results),'results':results}
(root/'docs/test-results/stage6/layout.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
if report['failures']:sys.exit(1)
