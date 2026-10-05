/** Pure logic + tour.html smoke (Playwright). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { once } = require('node:events');
const root = path.resolve(__dirname, '..');
const modulePaths = [__dirname, process.env.ARQS_QA_MODULES, process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean);
const dep = (name) => require(require.resolve(name, { paths: modulePaths }));

// --- unit ---
const vm = require('node:vm');
function load(file) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  const sandbox = { window: {}, console, localStorage: { _s: {}, getItem(k){return this._s[k]||null}, setItem(k,v){this._s[k]=String(v)} } };
  sandbox.global = sandbox;
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox, { filename: file });
  return sandbox;
}
const box = load('js/board-data.js');
load.call = null;
vm.runInNewContext(fs.readFileSync(path.join(root,'js/game-state.js'),'utf8'), box, {filename:'game-state.js'});
vm.runInNewContext(fs.readFileSync(path.join(root,'js/shop-catalog.js'),'utf8'), box, {filename:'shop-catalog.js'});
assert.ok(box.MMBoard.BOARD.length >= 24);
assert.equal(box.MMBoard.BOARD.filter(s=>s.type==='city').length, 16);
assert.ok(box.MMShop.CARS.length >= 3);
const st = box.MMState.load();
assert.equal(st.dice, box.MMBoard.DAILY_DICE);
assert.ok(box.MMState.claimLogin(st).ok);
assert.ok(!box.MMState.claimLogin(st).ok);
console.log('PASS tour unit logic');

(async () => {
  const { chromium } = dep('playwright');
  const bundled = dep('@sparticuz/chromium').default;
  const server = http.createServer((req, res) => {
    let route = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (route === '/') route = '/tour.html';
    const file = path.resolve(root, '.' + route);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const ext = path.extname(file);
    const mime = { '.html':'text/html','.js':'application/javascript','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.png':'image/png','.webmanifest':'application/manifest+json' };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  const out = path.resolve(process.env.ARQS_QA_OUTPUT || path.join(root, 'screenshots'));
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.ARQS_CHROMIUM_PATH || await bundled.executablePath(),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin + '/tour.html');
  await page.waitForSelector('#rollBtn');
  await page.screenshot({ path: path.join(out, 'tour-boot.png') });
  // claim daily
  await page.click('#loginBtn');
  // open shop
  await page.click('#shopBtn');
  await page.waitForSelector('#shopModal.on');
  await page.screenshot({ path: path.join(out, 'tour-shop.png') });
  await page.click('#shopClose');
  // roll a few times (reduced motion = fast)
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { const p = document.getElementById('shopPrompt'); if (p) p.classList.remove('on'); });
    await page.click('#rollBtn', { force: true });
    await page.waitForFunction(() => !document.getElementById('rollBtn').disabled, null, { timeout: 45000 });
    await page.evaluate(() => { const p = document.getElementById('shopPrompt'); if (p) p.classList.remove('on'); const c = document.getElementById('cutscene'); if (c) { c.classList.remove('on'); c.innerHTML=''; } const ci = document.getElementById('cinematic'); if (ci) { ci.classList.remove('on'); ci.innerHTML=''; } });
  }
  await page.screenshot({ path: path.join(out, 'tour-after-rolls.png') });
  assert.deepEqual(errors, [], errors.join('\n'));
  console.log('PASS tour.html mobile smoke');
  await browser.close();
  server.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
