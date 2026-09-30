/** Original, deterministic motion-graphics sound design; no sampled assets. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDir = resolve(dirname(fileURLToPath(import.meta.url)), '../v2');
const sampleRate = 48000;
const duration = 11;
const frameCount = sampleRate * duration;
const channels = [new Float64Array(frameCount), new Float64Array(frameCount)];
const TAU = Math.PI * 2;
let randomState = 0x51f37b93;
function noise() {
  randomState ^= randomState << 13;
  randomState ^= randomState >>> 17;
  randomState ^= randomState << 5;
  return (randomState >>> 0) / 2147483648 - 1;
}
const smoothstep = (x) => { x = Math.max(0, Math.min(1, x)); return x*x*(3-2*x); };
const attack = (t, seconds) => smoothstep(t / seconds);
const tail = (t, length, fade = 0.035) => smoothstep((length-t) / fade);

// Resonant wooden/paper taps: fast pitch drop, rounded attack, short noise grain.
function pop(t, length, frequency, size = 1) {
  const phase = TAU * (frequency*t + frequency*0.28*0.018*(1-Math.exp(-t/0.018)));
  return attack(t, 0.0025) * tail(t, length) * (
    Math.sin(phase)*Math.exp(-t/(0.036*size)) +
    0.18*Math.sin(phase*1.93)*Math.exp(-t/0.02) +
    0.10*noise()*Math.exp(-t/0.009)
  );
}
function chime(t, length, frequency) {
  const envelope = attack(t, 0.007) * tail(t, length, 0.15);
  return envelope * (
    0.75*Math.sin(TAU*frequency*t)*Math.exp(-t/0.22) +
    0.22*Math.sin(TAU*frequency*2.003*t)*Math.exp(-t/0.125) +
    0.06*Math.sin(TAU*frequency*3.99*t)*Math.exp(-t/0.065)
  );
}
function makeAir() {
  let low = 0, lower = 0, smoothed = 0;
  return (t, length) => {
    const position = t / length;
    const cutoff = 750 + 2300*Math.sin(Math.PI*position);
    const coefficient = 1-Math.exp(-TAU*cutoff/sampleRate);
    low += coefficient*(noise()-low);
    lower += 0.026*(low-lower);
    smoothed += 0.46*((low-lower)-smoothed);
    const envelope = Math.sin(Math.PI*position)**1.7;
    return smoothed*envelope*(0.93 + 0.07*Math.sin(TAU*67*t));
  };
}
function makeRoll() {
  let low = 0;
  return (t, length) => {
    low += 0.055*(noise()-low);
    const envelope = Math.sin(Math.PI*t/length)**1.7;
    return envelope*(low*0.8 + Math.sin(TAU*(91*t + 15*t*t))*0.055);
  };
}

const events = [];
function add(name, start, length, gain, sampler, pan = 0, reflections = false) {
  events.push({ name, start, duration: length, gain, pan: typeof pan === 'function' ? 'gentle sweep' : pan });
  const offset = Math.round(start*sampleRate);
  const count = Math.round(length*sampleRate);
  for (let i=0; i<count; i++) {
    const t = i/sampleRate;
    const value = sampler(t, length)*gain;
    const p = typeof pan === 'function' ? pan(t/length) : pan;
    const angle = (p+1)*Math.PI/4;
    const left = value*Math.cos(angle), right = value*Math.sin(angle);
    if (offset+i < frameCount) {
      channels[0][offset+i] += left;
      channels[1][offset+i] += right;
    }
    if (reflections) {
      // Quiet, cross-channel early reflections give depth without a long echo.
      for (const [delay, amount] of [[0.039, 0.10], [0.069, 0.055], [0.101, 0.026]]) {
        const index = offset+i+Math.round(delay*sampleRate);
        if (index < frameCount) {
          channels[0][index] += right*amount;
          channels[1][index] += left*amount;
        }
      }
    }
  }
}

add('opening soft pop', 0.10, 0.28, 0.66, (t,d) => pop(t,d,235,1.7), 0, true);
for (const [i,time] of [0.45,0.8,1.15].entries()) {
  add('clock tick '+(i+1), time, 0.055, 0.18, (t,d) => pop(t,d,i%2 ? 840 : 1000,0.38), i%2 ? 0.10 : -0.10);
}
for (const [i,start] of [1.90,3.90,5.90,6.90,8.90].entries()) {
  const direction = i%2 ? -1 : 1;
  add('paper transition '+(i+1), start, 0.20, 0.73, makeAir(), (p) => direction*(p-0.5)*0.85);
}
add('delivery movement', 2.20, 1.10, 0.35, makeRoll(), (p) => -0.28+0.56*p);
for (const [i,start] of [4.35,4.62,4.89].entries()) {
  add('shopping checkbox '+(i+1), start, 0.105, 0.35, (t,d) => pop(t,d,620+i*65,0.7), -0.08+i*0.08, true);
}
for (const [i,start] of [5.0,5.25,5.5].entries()) {
  add('shopping landing '+(i+1), start, 0.16, 0.29, (t,d) => pop(t,d,210+i*17,1.1), 0.10-i*0.1);
}
add('calculator tap', 6.18, 0.055, 0.24, (t,d) => pop(t,d,770,0.4));
add('calculator result ping', 6.48, 0.40, 0.28, (t,d) => chime(t,d,1046.502), 0.03, true);
add('business parcel thump', 7.65, 0.30, 0.55, (t,d) => pop(t,d,147,1.65), 0, true);
add('closing chime lower', 9.12, 1.05, 0.37, (t,d) => chime(t,d,659.255), -0.12, true);
add('closing chime upper', 9.29, 1.25, 0.34, (t,d) => chime(t,d,987.767), 0.12, true);

// Remove DC and subsonic energy, then normalize with generous encoding headroom.
let peak = 0;
for (const channel of channels) {
  let previousInput = 0, previousOutput = 0;
  const coefficient = Math.exp(-TAU*28/sampleRate);
  for (let i=0; i<frameCount; i++) {
    const input = channel[i];
    const filtered = coefficient*(previousOutput+input-previousInput);
    previousInput = input;
    previousOutput = filtered;
    channel[i] = filtered * tail(i/sampleRate, 10.75, 0.2);
    peak = Math.max(peak, Math.abs(channel[i]));
  }
}
const targetPeakDbfs = -5;
const scale = 10**(targetPeakDbfs/20) / peak;
let sumSquares = 0;
const wav = Buffer.alloc(44+frameCount*4);
wav.write('RIFF',0); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(2,22);
wav.writeUInt32LE(sampleRate,24); wav.writeUInt32LE(sampleRate*4,28);
wav.writeUInt16LE(4,32); wav.writeUInt16LE(16,34); wav.write('data',36);
wav.writeUInt32LE(frameCount*4,40);
for (let i=0; i<frameCount; i++) {
  for (let c=0; c<2; c++) {
    const value = channels[c][i]*scale;
    sumSquares += value*value;
    wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),44+i*4+c*2);
  }
}
mkdirSync(outputDir,{recursive:true});
const wavPath = resolve(outputDir,'reel-sfx.wav');
writeFileSync(wavPath,wav);
const report = {
  file:'reel-sfx.wav', durationSeconds:duration, sampleRate, channels:2,
  encoding:'PCM signed 16-bit little-endian', sampleFrames:frameCount,
  peakDbfs:targetPeakDbfs,
  rmsDbfs:20*Math.log10(Math.sqrt(sumSquares/(frameCount*2))),
  provenance:'Original deterministic synthesis; no samples, music, or speech.',
  events:events.sort((a,b) => a.start-b.start),
};
writeFileSync(resolve(outputDir,'audio-manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file:wavPath,durationSeconds:duration,peakDbfs:targetPeakDbfs,rmsDbfs:report.rmsDbfs}));
