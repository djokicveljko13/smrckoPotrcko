import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const isV2 = process.argv.includes('--v2');
const duration = isV2 ? 11 : 30;
const outputDir = isV2 ? path.join(dir, 'v2') : dir;
fs.mkdirSync(outputDir, { recursive: true });
const root = path.resolve(dir, '../..');
const cssDir = path.join(root, '.next/static/chunks');
const css = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'))
  .map(f => fs.readFileSync(path.join(cssDir, f), 'utf8')).join('\n');
const fonts = (css.match(/@font-face\{[^}]+\}/g) || [])
  .filter(rule => /font-family:(Archivo|Plus Jakarta Sans|Caveat);/.test(rule))
  .map(rule => rule.replace(/url\(\.\.\/media\/([^\)]+)\)/g, (_, filename) => {
    const bytes = fs.readFileSync(path.join(root, '.next/static/media', filename));
    return `url(data:font/woff2;base64,${bytes.toString('base64')})`;
  })).join('\n');
if (!fonts) throw new Error('Missing locally cached brand fonts.');
const logo = fs.readFileSync(path.join(root, 'public/logo-transparent.png')).toString('base64');
const animation = fs.readFileSync(path.join(dir, isV2 ? 'source/reel-v2.js' : 'source/reel.js'), 'utf8');
const audioTag = isV2 ? `<audio id="soundtrack" loop preload="auto" src="data:audio/wav;base64,${fs.readFileSync(path.join(outputDir, 'reel-sfx.wav')).toString('base64')}"></audio>` : '';
const html = `<!doctype html>
<html lang="sr-Latn"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Šmrčko Potrčko · Reel ${duration} sekundi</title>
<style>${fonts}
*{box-sizing:border-box}body{margin:0;background:#171515;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;min-height:100dvh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px;padding:20px}
canvas{display:block;width:auto;height:min(calc(100dvh - 135px),960px);max-width:100%;aspect-ratio:9/16;box-shadow:0 15px 80px #0008;object-fit:contain}
#controls{width:min(520px,94vw);display:flex;align-items:center;gap:12px;flex-wrap:wrap}
button{background:#fff;border:0;border-radius:8px;padding:11px 15px;font:600 13px 'Plus Jakarta Sans';cursor:pointer;color:#101010}
button:hover{background:#edcbc7}button:focus-visible,input:focus-visible{outline:3px solid #ffb5ae;outline-offset:4px}
input{flex:1;min-width:100px;accent-color:#df352d}output{font:600 12px 'Plus Jakarta Sans';min-width:78px;text-align:right;font-variant-numeric:tabular-nums}
.hint{width:100%;margin:0;text-align:center;color:#bfb5b5;font-size:11px}.hidden{visibility:hidden}body.clean{padding:0;background:#df352d;display:block}body.clean canvas{width:1080px;height:1920px;max-width:none;box-shadow:none}body.clean #controls{display:none}
</style></head><body>
<canvas id="reel" width="1080" height="1920" aria-label="Reklama za Šmrčko Potrčko: dostava, kupovina, provera cene i saradnja sa firmama."></canvas>
${audioTag}
<div id="controls"><button id="play">Pauza</button><button id="restart">Ispočetka</button>${isV2 ? '<button id="sound" aria-pressed="false">Uključi zvuk</button>' : ''}<input id="seek" aria-label="Vreme u reklami" type="range" min="0" max="${duration}" step="0.01" value="0"><output id="time">0,0 / ${duration} s</output><p class="hint">Taster H sakriva kontrole · Razmak pokreće ili pauzira${isV2 ? ' · Zvuk se uključuje dugmetom' : ''}</p></div>
<script>const LOGO_DATA = 'data:image/png;base64,${logo}';</script>
<script>${animation}</script></body></html>`;
fs.writeFileSync(path.join(outputDir, 'smrcko-potrcko-reel.html'), html);
console.log(`Built standalone HTML: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);

