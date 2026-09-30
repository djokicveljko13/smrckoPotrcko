/** Add the user-selected, licensed music to the existing 11-second Reel. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const dir=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
const option=name=>{const index=args.indexOf(name);return index>=0?args[index+1]:undefined;};
const source=option('--music');
const offset=Number(option('--start')||0);
if(!source||!fs.existsSync(source))throw new Error('Provide the downloaded Sonican MP3 using --music <path>.');
if(!Number.isFinite(offset)||offset<0)throw new Error('--start must be a nonnegative number of seconds.');
const ffmpeg=path.join(dir,'tools/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const outputDir=path.join(dir,'v3');
const qaDir=path.join(outputDir,'qa');
fs.mkdirSync(qaDir,{recursive:true});
function run(name,params){
  const result=spawnSync(ffmpeg,['-hide_banner','-y',...params],{windowsHide:true,encoding:'utf8',maxBuffer:16*1024*1024});
  fs.writeFileSync(path.join(qaDir,name+'.log'),result.stderr||'');
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error((result.stderr||'').slice(-4000));
  return result.stderr;
}
// Measure the selected extract rather than guessing a percentage of an
// unknown source level. -28 LUFS leaves space for the existing sound effects.
const trim=`atrim=start=${offset}:duration=11,asetpts=PTS-STARTPTS`;
const analysis=run('music-measure',['-i',path.resolve(source),'-vn','-af',`${trim},loudnorm=I=-28:TP=-8:LRA=7:print_format=json`,'-f','null','NUL']);
const report=JSON.parse(analysis.slice(analysis.lastIndexOf('{'),analysis.lastIndexOf('}')+1));
for(const field of ['input_i','input_tp','input_lra','input_thresh','target_offset']){
  if(!Number.isFinite(Number(report[field])))throw new Error('The selected music extract is silent or cannot be measured.');
}
const normalize=`loudnorm=I=-28:TP=-8:LRA=7:measured_I=${report.input_i}:measured_TP=${report.input_tp}:measured_LRA=${report.input_lra}:measured_thresh=${report.input_thresh}:offset=${report.target_offset}:linear=true`;
const filter=`[0:a]${trim},${normalize},aresample=48000,aformat=channel_layouts=stereo,afade=t=in:st=0:d=0.15,afade=t=out:st=9.65:d=1.35,apad,atrim=duration=11[music];[1:a]aresample=48000,aformat=channel_layouts=stereo,asplit=2[sfx][key];[music][key]sidechaincompress=threshold=0.025:ratio=2:attack=8:release=110[bed];[bed][sfx]amix=inputs=2:duration=longest:dropout_transition=0,volume=2,alimiter=limit=0.89:level=false,atrim=duration=11[mix]`;
const soundtrack=path.join(qaDir,'music-and-sfx.wav');
run('music-mix',['-i',path.resolve(source),'-i',path.join(dir,'v2/reel-sfx.wav'),'-filter_complex',filter,'-map','[mix]','-c:a','pcm_s16le','-ar','48000','-ac','2',soundtrack]);
const output=path.join(outputDir,'smrcko-potrcko-reel-11s-sa-muzikom.mp4');
run('final-mux',['-i',path.join(dir,'v2/smrcko-potrcko-reel-11s.mp4'),'-i',soundtrack,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t','11','-movflags','+faststart',output]);
run('final-decode',['-i',output,'-af','volumedetect','-f','null','NUL']);
// Embed only the edited soundtrack in the complete animation, not the full
// standalone stock track. The previous video and HTML remain intact.
const previous=fs.readFileSync(path.join(dir,'v2/smrcko-potrcko-reel.html'),'utf8');
const html=previous.replace(/data:audio\/wav;base64,[A-Za-z0-9+/=]+/,`data:audio/wav;base64,${fs.readFileSync(soundtrack).toString('base64')}`);
fs.writeFileSync(path.join(outputDir,'smrcko-potrcko-reel.html'),html);
fs.copyFileSync(path.join(dir,'v2/smrcko-potrcko-naslovna.png'),path.join(outputDir,'smrcko-potrcko-naslovna.png'));
fs.writeFileSync(path.join(outputDir,'mix-settings.json'),JSON.stringify({music:'Sonican — Upbeat Ukulele Loop - Positive Ads',trackId:268489,sourceUrl:'https://pixabay.com/music/upbeat-upbeat-ukulele-loop-positive-ads-268489/',sourceFilename:path.basename(source),startSeconds:offset,durationSeconds:11,musicTargetLUFS:-28,fadeInSeconds:.15,fadeOutStartSeconds:9.65,originalSoundEffects:true,videoReencoded:false,sourceMeasurement:report},null,2));
console.log(JSON.stringify({output,bytes:fs.statSync(output).size,duration:11}));
