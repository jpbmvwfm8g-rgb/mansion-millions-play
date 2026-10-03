const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const {once} = require('node:events');
const root = path.resolve(__dirname, '..');
const modulePaths = [__dirname, process.env.ARQS_QA_MODULES, process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean);
const dep = name => require(require.resolve(name, {paths:modulePaths}));
const {chromium} = dep('playwright');
const KEY = 'mansion-millions-shared-state-v1';
const results = [];
const output = path.resolve(process.env.ARQS_QA_OUTPUT || path.join(root, 'qa'));
fs.mkdirSync(output, {recursive:true});
const mime = {'.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.jpg':'image/jpeg'};
const server = http.createServer((req, res) => {
  let route = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/nested\//, '/');
  if(route === '/') route = '/index.html';
  if(route === '/store') route = '/store.html';
  const file = path.resolve(root, '.' + route);
  if(!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache'});
  fs.createReadStream(file).pipe(res);
});
let browser, origin, peerServer;
const errors = new WeakMap();
async function open(options = {}, init){
  const context = await browser.newContext({viewport:{width:390,height:844}, timezoneId:'America/Vancouver', reducedMotion:'reduce', ...options});
  if(init) await context.addInitScript(init);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const collected = [];errors.set(page,collected);page.on('pageerror',error=>collected.push(error.message));
  return {context,page};
}
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)||'{}'), KEY);
const clean = page => assert.deepEqual(errors.get(page), []);
async function visible(page, selector){assert.equal(await page.locator(selector).isVisible(), true)}
async function room(page, name){await page.locator('.room').filter({has:page.getByRole('heading',{name,exact:true})}).getByRole('button').click();if(name!=='Starter Vault')await visible(page,'#box')}
const choose = (page, name) => page.locator('#box').getByRole('button',{name,exact:true}).click();
async function firstFour(page){
  await page.getByRole('button',{name:'Walk in',exact:true}).click();
  await room(page,'Grand Foyer');await choose(page,'Blue, the quiet door');
  await room(page,'Grand Library');await choose(page,'13');
  await room(page,'Secret Garden');await choose(page,'🐾 paw, leaf, paw');
  await room(page,'Stone Cellar');await page.locator('#box input').fill(' moon ');await page.locator('#box input').press('Enter');
  assert.equal((await state(page)).hour,12);
}
async function run(name,fn){
  if(process.env.ARQS_QA_FILTER&&!name.includes(process.env.ARQS_QA_FILTER))return;
  const start=Date.now();try{await fn();results.push({name,status:'passed',ms:Date.now()-start});console.log('PASS '+name)}
  catch(error){results.push({name,status:'failed',error:error.message,stack:error.stack,ms:Date.now()-start});console.log('FAIL '+name+': '+error.stack)}
}

(async()=>{
  for(const name of ['index.html','sw.js','vendor/peerjs-1.5.4.min.js']){
    const content=fs.readFileSync(path.join(root,name),'utf8');
    if(name.endsWith('.html'))for(const match of content.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
    else new vm.Script(content);
  }
  server.listen(0,'127.0.0.1');await once(server,'listening');origin='http://127.0.0.1:'+server.address().port;
  const bundled=dep('@sparticuz/chromium').default;
  const browserArgs=process.env.ARQS_QA_STANDARD_BROWSER?['--no-sandbox','--disable-dev-shm-usage','--allow-loopback-in-peer-connection','--disable-features=WebRtcHideLocalIpsWithMdns']:bundled.args.filter(arg=>arg!=='--single-process'&&arg!=='--disable-web-security').concat('--allow-loopback-in-peer-connection');
  browser=await chromium.launch({executablePath:process.env.ARQS_CHROMIUM_PATH||await bundled.executablePath(),args:browserArgs,headless:true});
  const browserVersion=browser.version();

  await run('All six companions select and survive a reload',async()=>{
    const {context,page}=await open();try{
      await page.goto(origin+'/');assert.equal(await page.locator('#home .card').count(),6);
      for(const name of ['Jason','Juno','Juni','Sly','Ella','Lumi']){
        const button=page.locator('#home .card').filter({has:page.getByRole('heading',{name,exact:true})});
        await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');
        await page.reload();assert.equal(await button.getAttribute('aria-pressed'),'true');
        assert.equal((await state(page)).character,name.toLowerCase());
      }
      clean(page);await page.screenshot({path:path.join(output,'mobile-home.png'),fullPage:true});
    }finally{await context.close()}
  });

  await run('Complete all twelve cards, midnight puzzle, purchases, and replay',async()=>{
    const {context,page}=await open();try{
      await page.goto(origin+'/');await firstFour(page);
      assert.equal((await state(page)).cards.length,4);assert.equal((await state(page)).floor,0);
      await room(page,'Sky Dome');const before=await state(page);await page.getByRole('button',{name:'Star 3',exact:true}).click();
      assert.equal((await state(page)).hour*60+(await state(page)).minute,before.hour*60+before.minute);
      for(const n of [2,4,1])await page.getByRole('button',{name:'Star '+n,exact:true}).click();
      await room(page,'Candle Hall');for(const n of ['Left','Right','Left','Middle'])await choose(page,n);
      await room(page,'Midnight Garage');await choose(page,'Glove box');
      const beforeVault=await state(page);await room(page,'Starter Vault');
      assert.equal((await state(page)).starter,true);assert.equal((await state(page)).cash-beforeVault.cash,52100);
      const unlocked=await state(page);await room(page,'Starter Vault');assert.deepEqual(await state(page),unlocked);
      await page.getByRole('button',{name:'Climb',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#play .ey').textContent.includes('UPPER FLOOR'));
      await room(page,'Portrait Gallery');await choose(page,'Left');
      await room(page,'Storm Balcony');await choose(page,'Four knocks');
      await room(page,'Bell Tower');await choose(page,'1');
      await page.getByRole('button',{name:'After midnight',exact:true}).click();await page.locator('#box .choices').waitFor();
      await choose(page,'4');await choose(page,'1 · 4 · 2');await choose(page,'Gold');
      assert.equal((await state(page)).cards.length,12);
      await page.getByRole('button',{name:'Album 12/12',exact:true}).click();await page.getByRole('heading',{name:'Both floors are quiet.'}).waitFor();
      await page.screenshot({path:path.join(output,'mobile-album.png'),fullPage:true});
      await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Vault',exact:true}).click();
      const cash=(await state(page)).cash;await page.locator('.asset').filter({has:page.getByRole('heading',{name:'Creator Studio',exact:true})}).getByRole('button',{name:'Buy',exact:true}).click();
      assert.equal((await state(page)).cash,cash-9000);assert.equal((await state(page)).owned.studio,1);
      const bought=await state(page);await page.evaluate(()=>buy('studio'));assert.deepEqual(await state(page),bought);
      await page.reload();assert.equal((await state(page)).owned.studio,1);
      await page.getByRole('button',{name:'Continue the night'}).click();await page.getByRole('button',{name:'Downstairs',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('#play .ey').textContent.includes('GROUND FLOOR'));
      const replay=await state(page);await room(page,'Grand Foyer');await choose(page,'Blue, the quiet door');assert.deepEqual(await state(page),replay);clean(page);
    }finally{await context.close()}
  });

  await run('Wrong answers advance seven minutes; doors and vault enforce prerequisites',async()=>{
    const {context,page}=await open();try{
      await page.goto(origin+'/');await page.getByRole('button',{name:'Walk in',exact:true}).click();
      assert.equal(await page.getByRole('button',{name:'Climb',exact:true}).isDisabled(),true);
      await page.evaluate(()=>enterRoom('midnight'));assert.equal(await page.locator('#box').count(),0);
      await page.evaluate(()=>enterRoom('cellar'));assert.equal(await page.locator('#box').count(),0);
      await room(page,'Grand Foyer');await choose(page,'Gold painting');await choose(page,'Blue, the quiet door');
      const s=await state(page);assert.equal(s.minute,19);assert.equal(s.hour,9);assert.equal(s.perfect,0);assert.equal(s.cash,2800);
      await page.getByRole('button',{name:'Vault',exact:true}).click();const cash=s.cash;
      await page.locator('.asset').first().getByRole('button',{name:'Buy'}).click();assert.equal((await state(page)).cash,cash);clean(page);
    }finally{await context.close()}
  });

  await run('Daily reward follows Vancouver dates and cannot repeat',async()=>{
    const {context,page}=await open();try{
      await page.clock.install({time:new Date('2026-10-03T06:00:00Z')});await page.goto(origin+'/');
      await page.getByRole('button',{name:'Daily reward'}).click();assert.equal((await state(page)).last,'2026-10-02');assert.equal((await state(page)).cash,2500);
      await page.getByRole('button',{name:'Daily reward'}).click();assert.equal((await state(page)).cash,2500);
      await page.clock.setFixedTime(new Date('2026-10-03T08:00:00Z'));await page.getByRole('button',{name:'Daily reward'}).click();
      assert.equal((await state(page)).last,'2026-10-03');assert.equal((await state(page)).cash,5250);assert.equal((await state(page)).streak,2);clean(page);
    }finally{await context.close()}
  });

  await run('Malformed saves and blocked browser storage do not crash',async()=>{
    for(const saved of ['{broken','null',JSON.stringify({cards:['bad','foyer-key','foyer-key'],cash:'no',hour:99,minute:-2,character:'<script>',room:'<script>',floor:1})]){
      const {context,page}=await open();
      // Pass the stored value through a separate init script, without interpolating it as JavaScript.
      await context.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:KEY,value:saved});
      try{await page.goto(origin+'/');await page.locator('#home .card').first().click();const s=await state(page);assert.equal(s.cash,0);assert.equal(s.hour,8);assert.equal(s.floor,0);assert.equal(new Set(s.cards).size,s.cards.length);clean(page)}finally{await context.close()}
    }
    const {context,page}=await open({},()=>Object.defineProperty(window,'localStorage',{value:{getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}}}));
    try{await page.goto(origin+'/');await page.locator('#home .card').nth(2).click();await page.getByRole('button',{name:'Walk in',exact:true}).click();await room(page,'Grand Foyer');await choose(page,'Blue, the quiet door');clean(page)}finally{await context.close()}
  });

  await run('Phone, tablet, and desktop layouts fit without horizontal overflow',async()=>{
    const {context,page}=await open();try{
      for(const width of [320,375,390,768,1024,1440]){
        await page.setViewportSize({width,height:844});await page.goto(origin+'/');await visible(page,'#hud');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'home width '+width);
        await page.getByRole('button',{name:'Walk in',exact:true}).click();await room(page,'Grand Foyer');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'room width '+width);
      }
      await page.screenshot({path:path.join(output,'desktop-room.png'),fullPage:true});clean(page);
    }finally{await context.close()}
  });

  await run('Root and nested installations work offline and retain other app caches',async()=>{
    for(const prefix of ['/', '/nested/']){
      const {context,page}=await open();try{
        await page.goto(origin+prefix);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
        await page.evaluate(()=>caches.open('unrelated-app-cache'));
        const manifest=await page.evaluate(async()=>await (await fetch('manifest.webmanifest')).json());assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
        for(const icon of manifest.icons)assert.equal((await page.request.get(origin+prefix+icon.src)).status(),200);
        await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Walk in',exact:true}).click();await room(page,'Grand Foyer');await choose(page,'Blue, the quiet door');
        assert.equal((await state(page)).cards.length,1);assert.equal((await page.evaluate(()=>caches.keys())).includes('unrelated-app-cache'),true);
        await page.getByRole('link',{name:'Game guide'}).click();await page.getByRole('link',{name:'Play the night'}).click();await page.getByRole('button',{name:'Continue the night'}).waitFor();clean(page);
      }finally{await context.close()}
    }
  });

  await run('Unavailable multiplayer dependency falls back to solo',async()=>{
    const {context,page}=await open({serviceWorkers:'block'});try{
      await page.route('**/vendor/peerjs-1.5.4.min.js',route=>route.abort());await page.goto(origin+'/');
      await page.getByRole('button',{name:'Play together'}).click();await page.getByRole('button',{name:'Open a house'}).click();
      assert.match(await page.locator('#others').textContent(),/unavailable/);await page.getByRole('button',{name:'Explore the house'}).click();await room(page,'Grand Foyer');await choose(page,'Blue, the quiet door');clean(page);
    }finally{await context.close()}
  });

  await run('Real WebRTC pair synchronizes doors and handles navigation, invalid packets, and disconnect',async()=>{
    const express=dep('express'),app=express(),peerHttp=http.createServer(app);const {ExpressPeerServer}=dep('peer');peerServer=ExpressPeerServer(peerHttp,{path:'/'});app.use('/',peerServer);
    peerHttp.listen(0,'127.0.0.1');await once(peerHttp,'listening');const port=peerHttp.address().port;
    const a=await open({serviceWorkers:'block'}), b=await open({serviceWorkers:'block'});
    const vendor=fs.readFileSync(path.join(root,'vendor/peerjs-1.5.4.min.js'),'utf8');
    try{
      for(const p of [a.page,b.page]){await p.route('**/vendor/peerjs-1.5.4.min.js',route=>route.fulfill({contentType:'application/javascript',body:vendor+'\nconst NetworkPeer=window.Peer;window.Peer=class extends NetworkPeer{constructor(id,opts){super(id,{...opts,host:"127.0.0.1",port:'+port+',path:"/",secure:false,config:{iceServers:[]}})}};'}));await p.goto(origin+'/');await p.getByRole('button',{name:'Play together'}).click();await p.getByRole('textbox',{name:'Four-letter house code'}).fill('TEST')}
      await a.page.getByRole('button',{name:'Open a house'}).click();
      try{await a.page.waitForFunction(()=>document.querySelector('#others').textContent.includes('is open'))}
      catch(error){error.message+=' Host: '+JSON.stringify(await a.page.evaluate(()=>({status:sharedStatus,peer:typeof Peer,id:roomPeer?.id,open:roomPeer?.open,destroyed:roomPeer?.destroyed})))+' Errors: '+JSON.stringify(errors.get(a.page));throw error}
      await b.page.getByRole('button',{name:'Join',exact:true}).click();
      try{await b.page.waitForFunction(()=>!!link?.open);await a.page.waitForFunction(()=>!!link?.open)}
      catch(error){for(const [label,p] of [['host',a.page],['guest',b.page]])error.message+=' '+label+': '+JSON.stringify(await p.evaluate(async()=>{let raw;try{const pc=new RTCPeerConnection({iceServers:[]});pc.createDataChannel('check');raw=(await pc.createOffer()).type;pc.close()}catch(e){raw=e.message}return{status:sharedStatus,peerOpen:roomPeer?.open,linkOpen:link?.open,ice:link?.peerConnection?.iceConnectionState,connection:link?.peerConnection?.connectionState,signaling:link?.peerConnection?.signalingState,local:link?.peerConnection?.localDescription?.type,remote:link?.peerConnection?.remoteDescription?.type,raw}}))+' errors='+JSON.stringify(errors.get(p));console.log(error.message);throw error}
      for(const p of [a.page,b.page])await p.evaluate(()=>{window.packetLog=[];link.on('data',msg=>packetLog.push({type:typeof msg,value:msg}));});
      await a.page.getByRole('button',{name:'Explore the house'}).click();await room(a.page,'Grand Foyer');await choose(a.page,'Blue, the quiet door');
      try{await b.page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'{}').cards?.includes('foyer-key'),KEY)}
      catch(error){for(const [label,p] of [['host',a.page],['guest',b.page]])error.message+=' '+label+': '+JSON.stringify(await p.evaluate(()=>({status:sharedStatus,open:link?.open,serialization:link?.serialization,packets:packetLog,cards:S.cards})))+' errors='+JSON.stringify(errors.get(p));throw error}
      assert.equal((await state(b.page)).cash,0);assert.equal((await state(b.page)).hour,9);assert.equal((await state(b.page)).minute,12);
      await b.page.getByRole('button',{name:'Explore the house'}).click();await room(b.page,'Grand Library');await choose(b.page,'13');
      await a.page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).cards.includes('pattern'),KEY);
      const valid=await state(a.page);await b.page.evaluate(()=>{link.send(null);link.send({v:1,hi:'invalid',cards:['invented-card'],hour:999,minute:-1,floor:'1'})});
      await a.page.waitForTimeout(150);assert.deepEqual(await state(a.page),valid);clean(a.page);clean(b.page);
      await b.page.getByRole('button',{name:'Companions'}).click();await b.page.getByRole('button',{name:'Play together'}).click();await b.page.getByRole('button',{name:'Leave house'}).click();
      await a.page.getByRole('button',{name:'House TEST',exact:true}).click();assert.match(await a.page.locator('#others').textContent(),/left/);
    }finally{await a.context.close();await b.context.close();peerHttp.close();peerHttp.closeAllConnections()}
  });

  const report={checkedAt:new Date().toISOString(),browser:browserVersion,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,results,limits:['iPhone Safari installation and WebRTC across two physical devices require device checks.','The WebRTC pair uses a local real PeerServer; the public signaling service is checked separately after deployment.']};
  fs.writeFileSync(path.join(output,'qa-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,failed:report.failed,browser:browserVersion}));
  process.exitCode=report.failed?1:0;
})().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close();server.closeAllConnections();process.exit(process.exitCode||0)});
