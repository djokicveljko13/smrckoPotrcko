import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from './tools/node_modules/playwright-core/index.mjs';
import sharp from 'sharp';

const dir=path.dirname(fileURLToPath(import.meta.url));
const isV2=process.argv.includes('--v2');
const outputDir=isV2?path.join(dir,'v2'):dir;
const duration=isV2?11:30;
const frameCount=duration*30;
const posterTime=isV2?10:27;
const cdp=process.env.REEL_CDP_URL;
const isQA=process.argv.includes('--qa');
if(!cdp)throw new Error('Set REEL_CDP_URL to the dedicated animation browser endpoint.');
const browser=await chromium.connectOverCDP(cdp);
const context=browser.contexts()[0];
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.setViewportSize({width:1080,height:1920});
await page.goto(pathToFileURL(path.join(outputDir,'smrcko-potrcko-reel.html')).href+'?capture');
await page.evaluate(()=>window.reelReady);

async function capture(time,type='image/png'){
  const encoded=await page.evaluate(({time,type})=>{
    window.reel.seek(time);
    return document.getElementById('reel').toDataURL(type,.98).split(',')[1];
  },{time,type});
  return Buffer.from(encoded,'base64');
}

if(isQA){
  fs.mkdirSync(path.join(outputDir,'qa'),{recursive:true});
  const times=isV2?[.9,3,5.65,6.65,8.3,10]:[2,6.5,11.5,16.5,21.5,27];
  const panels=[];
  for(let i=0;i<times.length;i++){
    const png=await capture(times[i]);
    fs.writeFileSync(path.join(outputDir,`qa/scene-${i+1}.png`),png);
    panels.push({input:await sharp(png).resize(324,576).png().toBuffer(),left:(i%3)*344+20,top:Math.floor(i/3)*596+20});
  }
  await sharp({create:{width:1052,height:1212,channels:3,background:'#171515'}}).composite(panels).png().toFile(path.join(outputDir,'qa/contact-sheet.png'));
  fs.writeFileSync(path.join(outputDir,'smrcko-potrcko-naslovna.png'),await capture(posterTime));
  const dimensions=await page.evaluate(()=>({width:document.getElementById('reel').width,height:document.getElementById('reel').height,fonts:document.fonts.status,ready:!!window.reel}));
  fs.writeFileSync(path.join(outputDir,'qa/report.json'),JSON.stringify({dimensions,errors,sceneTimes:times},null,2));
  console.log(JSON.stringify({dimensions,errors,contactSheet:path.join(outputDir,'qa/contact-sheet.png')}));
}else{
  const ffmpeg=path.join(dir,'tools/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
  const output=path.join(outputDir,isV2?'smrcko-potrcko-reel-11s.mp4':'smrcko-potrcko-reel.mp4');
  fs.mkdirSync(path.join(outputDir,'qa'),{recursive:true});
  const videoOutput=isV2?path.join(outputDir,'qa/video-only.mp4'):output;
  // Encoding the image pipe and sound in one pass can stop audio early when
  // the video frame limit is reached. Mux the complete WAV after video closes.
  const proc=spawn(ffmpeg,['-hide_banner','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r','30','-frames:v',String(frameCount),'-movflags','+faststart',videoOutput],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let logs='';proc.stderr.on('data',d=>{logs+=d.toString();});
  const done=new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',code=>code===0?resolve():reject(new Error(logs.slice(-5000))));});
  const started=Date.now();
  for(let i=0;i<frameCount;i++){
    const frame=await capture(i/30,'image/jpeg');
    if(!proc.stdin.write(frame))await once(proc.stdin,'drain');
    if(i%60===0)console.log(`Rendering ${i}/${frameCount} frames (${Math.round((Date.now()-started)/1000)} s elapsed)`);
  }
  proc.stdin.end();await done;
  if(isV2){
    const mux=spawn(ffmpeg,['-hide_banner','-y','-i',videoOutput,'-i',path.join(outputDir,'reel-sfx.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t',String(duration),'-movflags','+faststart',output],{windowsHide:true,stdio:['ignore','ignore','pipe']});
    let muxLogs='';mux.stderr.on('data',d=>{muxLogs+=d.toString();});
    await new Promise((resolve,reject)=>{mux.on('error',reject);mux.on('close',code=>code===0?resolve():reject(new Error(muxLogs)));});
    fs.writeFileSync(path.join(outputDir,'qa/ffmpeg-mux.log'),muxLogs);
  }
  fs.writeFileSync(path.join(outputDir,'smrcko-potrcko-naslovna.png'),await capture(posterTime));
  fs.mkdirSync(path.join(outputDir,'qa'),{recursive:true});
  fs.writeFileSync(path.join(outputDir,'qa/ffmpeg-render.log'),logs);
  console.log(JSON.stringify({output,bytes:fs.statSync(output).size,errors,seconds:Math.round((Date.now()-started)/1000)}));
}
await page.close();
await browser.close();
if(errors.length)process.exitCode=1;
