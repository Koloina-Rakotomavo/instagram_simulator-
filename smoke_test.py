import asyncio, json
from pathlib import Path
from io import BytesIO
from PIL import Image
from playwright.async_api import async_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from functools import partial

ROOT=Path(__file__).parent
DATA=ROOT/'index.html'

async def run():
  http=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
  Thread(target=http.serve_forever,daemon=True).start()
  target=f'http://127.0.0.1:{http.server_port}/index.html'
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
    page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    await page.set_content(DATA.read_text(),wait_until="load")
    assert await page.locator('.tile').count()==9
    assert await page.locator('#count').inner_text()=='9'
    await page.locator('#profileUrl').fill('https://www.instagram.com/nasa/')
    await page.locator('#importUrl').click()
    assert 'service d’import n’est pas encore relié' in await page.locator('#status').inner_text()
    await page.locator('#grid .image-wrap').first.click()
    await page.locator('#grid .image-wrap').nth(4).click()
    assert await page.locator('#undo').is_enabled()
    await page.locator('#undo').click()
    assert await page.locator('#count').inner_text()=='9'
    img=Image.new('RGB',(800,1000),'#e9cfad');buf=BytesIO();img.save(buf,format='JPEG');blob=buf.getvalue()
    await page.locator('#imagesMobile').set_input_files([{'name':'nouvelle-image.jpg','mimeType':'image/jpeg','buffer':blob}])
    await page.wait_for_function("document.getElementById('count').textContent==='1'",timeout=8000)
    await page.locator('#export').click()
    # mobile initial screenshot
    await page.screenshot(path=str(ROOT/'apercu_iphone.png'),full_page=True)
    assert not errors,errors
    # new page with mock Worker API / media; no real scraping needed
    page2=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    page2.on('pageerror',lambda e:errors.append(str(e)))
    async def route_handler(route):
      if route.request.url.endswith('/api/import'):
        await route.fulfill(status=200,content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps({'username':'nasa','fullName':'NASA','biography':'test bio','followersCount':100,'followsCount':5,'posts':[{'displayUrl':'https://scontent.cdninstagram.com/media1.jpg','type':'post'},{'displayUrl':'https://scontent.cdninstagram.com/media2.jpg','type':'reel'}]}))
      elif '/api/media?' in route.request.url:
        await route.fulfill(status=200,content_type='image/jpeg',headers={'Access-Control-Allow-Origin':'*'},body=blob)
      else: await route.continue_()
    await page2.route('https://studio.example.com/**',route_handler)
    await page2.set_content(DATA.read_text(),wait_until="load")
    await page2.locator('#backendDetails summary').click()
    await page2.locator('#apiEndpoint').fill('https://studio.example.com')
    await page2.locator('#apiPasscode').fill('test-pass')
    await page2.locator('#profileUrl').fill('https://www.instagram.com/nasa/')
    await page2.locator('#importUrl').click()
    await page2.wait_for_function("document.getElementById('count').textContent==='2'")
    assert await page2.locator('#handle').inner_text()=='nasa'
    assert await page2.locator('#followersPreview').inner_text()=='100'
    assert await page2.locator('#grid img').count()==2
    assert '2 publications importées' in await page2.locator('#status').inner_text()
    assert not errors,errors
    await browser.close()
    print('Tests de base, tactile, import local, endpoint simulé : OK')

if __name__=='__main__': asyncio.run(run())