/* Deterministic, single-clock animation. Every frame is a pure function of time. */
const canvas = document.getElementById('reel');
const ctx = canvas.getContext('2d', { alpha: false });
const C = { red: '#df352d', dark: '#b8241d', ink: '#101010', white: '#ffffff', paper: '#fffdf7', pink: '#edcbc7', accent: '#ffb5ae', grey: '#f1f1f3' };
const logo = new Image();
logo.src = LOGO_DATA;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const ease = v => { const t = clamp(v); return t * t * t * (t * (t * 6 - 15) + 10); };
const out = v => 1 - (1 - clamp(v)) ** 4;
const startTimes = [0, 4, 9, 14, 19, 24];
const scenePaper = [
  { x: 90, y: 705, w: 810, h: 780, phone: 0 },
  { x: 90, y: 690, w: 810, h: 805, phone: 0 },
  { x: 120, y: 690, w: 750, h: 800, phone: 0 },
  { x: 210, y: 670, w: 570, h: 830, phone: 1 },
  { x: 90, y: 690, w: 810, h: 805, phone: 0 },
  { x: 90, y: 655, w: 810, h: 845, phone: 0 },
];

function round(x, y, w, h, r, fill, stroke, lineWidth = 4) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}
function circle(x, y, r, fill, stroke, lineWidth = 4) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}
function path(points, fill, stroke, width = 4, close = true) {
  ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function line(x1,y1,x2,y2,color=C.ink,width=4) { path([[x1,y1],[x2,y2]],null,color,width,false); }
function local(x,y,scale,rotation,draw) {
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(rotation);draw();ctx.restore();
}
function text(value,x,y,size=60,color=C.ink,options={}) {
  ctx.save();ctx.fillStyle=color;ctx.textBaseline='alphabetic';ctx.textAlign=options.align||'left';
  const family = options.hand ? 'Caveat' : options.head ? 'Archivo' : 'Plus Jakarta Sans';
  const weight = options.weight || (options.head ? 900 : 650);
  const style = options.head ? 'italic ' : '';
  ctx.font=`${style}${weight} ${size}px "${family}"`;
  if(options.maxWidth) {
    const measured=ctx.measureText(value).width;
    if(measured>options.maxWidth) ctx.font=`${style}${weight} ${size*options.maxWidth/measured}px "${family}"`;
  }
  ctx.fillText(value,x,y);ctx.restore();
}
function check(x,y,s=1,progress=1,color=C.red) {
  local(x,y,s,0,()=>{
    const p=clamp(progress);ctx.beginPath();ctx.moveTo(-19,0);
    if(p<.36)ctx.lineTo(mix(-19,-4,p/.36),mix(0,15,p/.36));
    else {ctx.lineTo(-4,15);ctx.lineTo(mix(-4,26,(p-.36)/.64),mix(15,-20,(p-.36)/.64));}
    ctx.strokeStyle=color;ctx.lineWidth=8;ctx.stroke();
  });
}
function pin(x,y,s=1,fill=C.red) {
  local(x,y,s,0,()=>{
    ctx.beginPath();ctx.moveTo(0,40);ctx.bezierCurveTo(-12,25,-29,5,-29,-11);ctx.arc(0,-11,29,Math.PI,0);ctx.bezierCurveTo(29,5,12,25,0,40);ctx.fillStyle=fill;ctx.fill();circle(0,-11,10,C.paper);
  });
}
function spark(x,y,s=1,color=C.red,rotation=0) {
  local(x,y,s,rotation,()=>{path([[0,-22],[5,-5],[22,0],[5,5],[0,22],[-5,5],[-22,0],[-5,-5]],color);});
}
function shadow(x,y,w,h,opacity=.1) {ctx.save();ctx.globalAlpha*=opacity;ctx.fillStyle=C.ink;ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawBox(x,y,s=1,rotation=0) {
  local(x,y,s,rotation,()=>{
    path([[-80,-62],[13,-88],[91,-43],[0,-12]],C.pink,C.ink,5);
    path([[-80,-62],[0,-12],[0,88],[-80,36]],C.paper,C.ink,5);
    path([[0,-12],[91,-43],[91,56],[0,88]],C.red,C.ink,5);
    path([[-45,-72],[40,-27],[68,-36],[-16,-80]],C.white,C.ink,3);
    path([[40,-27],[40,6],[67,-3],[68,-36]],C.white,C.ink,3);
    line(-57,-15,-22,5,C.ink,5);line(-57,0,-36,12,C.ink,4);
  });
}
function drawTakeaway(x,y,s=1,rotation=0) {
  local(x,y,s,rotation,()=>{
    round(-64,-68,128,158,15,C.red,C.ink,5);
    ctx.beginPath();ctx.moveTo(-31,-57);ctx.lineTo(-31,-94);ctx.bezierCurveTo(-31,-136,31,-136,31,-94);ctx.lineTo(31,-57);ctx.strokeStyle=C.ink;ctx.lineWidth=7;ctx.stroke();
    circle(0,2,33,C.paper);
    line(-12,-17,-12,23,C.red,4);line(-20,-17,-20,-4,C.red,3);line(-4,-17,-4,-4,C.red,3);line(-20,-4,-4,-4,C.red,3);
    circle(13,-10,7,C.red);line(13,-6,13,23,C.red,4);
    line(-40,65,40,65,C.paper,4);
  });
}
function drawMilk(x,y,s=1,rotation=0) {
  local(x,y,s,rotation,()=>{
    path([[-33,-57],[-15,-86],[26,-86],[42,-57]],C.red,C.ink,4);
    path([[-33,-57],[42,-57],[42,65],[-33,65]],C.white,C.ink,4);
    path([[17,-57],[42,-57],[42,65],[17,65]],C.pink,C.ink,3);
    line(-15,-86,17,-57,C.ink,3);round(-23,-20,29,44,6,C.red);
    circle(-8,2,7,C.white);line(-22,46,4,46,C.ink,3);
  });
}
function drawBread(x,y,s=1,rotation=-.2) {
  local(x,y,s,rotation,()=>{
    round(-23,-108,46,204,23,C.pink,C.ink,4);
    for(let i=0;i<4;i++)line(-10,-71+i*38,9,-56+i*38,C.paper,7);
  });
}
function drawBottle(x,y,s=1,rotation=0) {
  local(x,y,s,rotation,()=>{
    round(-22,-93,44,28,7,C.ink);round(-32,-68,64,137,20,C.red,C.ink,4);
    round(-20,-9,40,42,9,C.paper);line(-9,8,9,8,C.red,5);
  });
}
function drawBag(x,y,s=1,rotation=0,items=true) {
  local(x,y,s,rotation,()=>{
    if(items){drawBread(-39,-46,.85,-.25);drawMilk(25,-54,.72,.08);drawBottle(65,-25,.65,.17);}
    path([[-81,-45],[82,-45],[66,107],[-65,107]],C.paper,C.ink,5);
    ctx.beginPath();ctx.moveTo(-31,-36);ctx.bezierCurveTo(-33,30,34,30,32,-36);ctx.strokeStyle=C.red;ctx.lineWidth=8;ctx.stroke();
    line(-38,70,40,70,C.pink,5);line(-22,85,23,85,C.pink,5);
  });
}
function drawClock(x,y,r,t) {
  local(x,y,1,-.12,()=>{
    circle(0,0,r+13,C.red,C.ink,6);circle(0,0,r,C.paper,C.ink,4);
    for(let i=0;i<12;i++){const a=i*Math.PI/6;line(Math.sin(a)*(r-15),-Math.cos(a)*(r-15),Math.sin(a)*(r-24),-Math.cos(a)*(r-24),C.ink,4);}
    const a=-.6+Math.min(t,2)*.16;line(0,0,Math.sin(a)*(r*.6),-Math.cos(a)*(r*.6),C.red,8);line(0,0,43,18,C.ink,9);circle(0,0,9,C.ink);
    line(-37,-r-19,37,-r-19,C.ink,9);
  });
}
function drawVan(x,y,s=1,t=0) {
  local(x,y,s,0,()=>{
    path([[-134,-71],[38,-71],[38,-45],[81,-45],[118,-3],[134,11],[134,64],[-134,64]],C.red,C.ink,6);
    path([[49,-33],[77,-33],[106,0],[49,0]],C.paper,C.ink,4);
    round(-113,-46,119,70,12,C.paper);line(-95,-11,-15,-11,C.red,10);
    line(40,10,40,53,C.ink,4);line(52,14,66,14,C.ink,4);round(116,19,15,18,4,C.pink);
    for(const wx of [-81,82]){circle(wx,64,29,C.ink);circle(wx,64,15,C.paper);local(wx,64,1,t,()=>{line(-7,0,7,0,C.ink,4);line(0,-7,0,7,C.ink,4);});}
  });
}
function drawHome(x,y,s=1) {
  local(x,y,s,0,()=>{
    round(-72,-17,144,142,8,C.paper,C.ink,5);
    path([[-93,-14],[0,-95],[93,-14]],C.red,C.ink,6);
    round(-16,52,39,73,5,C.pink,C.ink,4);round(-49,22,29,30,4,C.white,C.ink,4);circle(12,91,3,C.ink);
  });
}
function drawStore(x,y,s=1) {
  local(x,y,s,0,()=>{
    round(-149,-79,298,266,12,C.white,C.ink,5);
    round(-111,26,100,106,6,C.pink,C.ink,5);line(-61,29,-61,129,C.ink,4);
    round(23,25,88,162,5,C.paper,C.ink,5);line(91,99,91,121,C.ink,5);
    round(-118,-139,236,48,12,C.red,C.ink,5);
    path([[-149,-79],[149,-79],[171,-10],[-171,-10]],C.paper,C.ink,5);
    for(let i=0;i<6;i++){
      const ax=-171+i*57;path([[mix(-149,149,i/6),-79],[mix(-149,149,(i+1)/6),-79],[ax+57,-10],[ax,-10]],i%2?C.paper:C.red);
      round(ax,-10,57,36,[0,0,19,19],i%2?C.paper:C.red,C.ink,3);
    }
    line(-149,-79,149,-79,C.ink,5);
  });
}

const paperOffsets = [0,5,-3,11,0,-5,8,2,17,3,-6,4,0,12,-3,6,0,-4,13,2,8,-3,3,15,-4,5,0];
function paperShape(x,y,w,h,offset=0) {
  ctx.beginPath();ctx.moveTo(x,y+15+offset);
  for(let i=0;i<paperOffsets.length;i++)ctx.lineTo(x+w*i/(paperOffsets.length-1),y+paperOffsets[i]+offset);
  ctx.lineTo(x+w,y+h);
  for(let i=paperOffsets.length-1;i>=0;i--)ctx.lineTo(x+w*i/(paperOffsets.length-1),y+h+paperOffsets[(i+8)%paperOffsets.length]+offset);
  ctx.closePath();
}
function drawPaper(p) {
  ctx.save();
  ctx.shadowColor='#5c120b30';ctx.shadowBlur=40;ctx.shadowOffsetY=24;
  if(p.phone>.99){round(p.x-12,p.y-12,p.w+24,p.h+24,65,C.ink);round(p.x,p.y,p.w,p.h,54,C.paper);}
  else {
    paperShape(p.x,p.y-8,p.w,p.h+2,0);ctx.fillStyle=C.pink;ctx.fill();
    ctx.shadowColor='transparent';paperShape(p.x,p.y,p.w,p.h);ctx.fillStyle=C.paper;ctx.fill();
    if(p.phone>0){ctx.globalAlpha=p.phone;round(p.x-8,p.y-8,p.w+16,p.h+16,60,null,C.ink,12);}
  }
  ctx.restore();
}
function background(t) {
  const g=ctx.createLinearGradient(0,0,1080,1920);g.addColorStop(0,'#e44137');g.addColorStop(.55,C.red);g.addColorStop(1,C.dark);ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);
  ctx.save();ctx.strokeStyle='#ffffff';ctx.globalAlpha=.045;ctx.lineWidth=2;
  for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(1110,-80,330+i*115,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-120,1850,240+i*155,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
  ctx.save();ctx.globalAlpha=.11;
  spark(970,670,1.3,C.paper,.1);spark(70,470,.8,C.paper,-.15);
  circle(944,1540,8,C.paper);circle(101,1620,5,C.paper);
  ctx.restore();
  // The lower paper edge echoes the public website and stays outside the text area.
  paperShape(-20,1783,1120,160);ctx.fillStyle=C.pink;ctx.fill();
  paperShape(-20,1794,1120,160);ctx.fillStyle=C.paper;ctx.fill();
}
function logoPlacement(index) {
  return index===0||index===5 ? {x:135,y:217,w:720} : {x:110,y:174,w:375};
}
function sceneHeader(lines, sub, age) {
  const p=out(age/.45);ctx.save();ctx.globalAlpha*=p;ctx.translate(0,(1-p)*25);
  lines.forEach((s,i)=>text(s,120,459+i*105,99,C.white,{head:true,maxWidth:750}));
  if(sub)text(sub,124,625,45,C.white,{weight:600,maxWidth:735});
  ctx.restore();
}
function hook(t) {
  const p=out(t/.45);ctx.save();ctx.globalAlpha*=p;ctx.translate(0,(1-p)*26);
  text('Nemaš',144,835,103,C.ink,{head:true});
  text('vremena?',144,937,103,C.ink,{head:true});
  text('Mi trčimo umesto tebe.',148,1022,46,C.dark,{weight:750,maxWidth:705});
  ctx.restore();
  const b=out(t/.6);ctx.save();ctx.globalAlpha*=b;
  shadow(430,1408,206,18,.08);drawClock(388,1250+(1-b)*45,125,t);
  drawBox(651,1333+(1-b)*70,.88,-.12);spark(676,1160,1.2,C.red,.1);spark(217,1196,.65,C.red,.15);ctx.restore();
}
function delivery(t) {
  sceneHeader(['Dostava na','tvoju adresu.'],'Jagodina i okolina.',t);
  const a=out((t-.18)/.6);ctx.save();ctx.globalAlpha*=a;
  const y=917+(1-a)*40+Math.sin(t*1.6)*3;
  [280,495,710].forEach(x=>circle(x,y,86,'#f3ede4'));
  drawTakeaway(280,y,.66,-.06);drawBag(495,y,.63,.05);drawBox(710,y,.7,-.04);
  ctx.save();ctx.setLineDash([9,14]);line(204,1336,789,1336,C.pink,5);ctx.restore();
  const progress=out((t-.3)/1.8);drawVan(mix(253,370,progress),1241,.9,progress*8);
  drawHome(728,1237,.7);pin(728,1091,.65);
  ctx.restore();
}
function shopping(t) {
  sceneHeader(['Ti napiši listu.'],null,t);
  text('Mi kupujemo i donosimo.',124,554,49,C.white,{weight:650,maxWidth:746});
  // Tape sits above the recurring paper sheet.
  local(492,700,1,-.065,()=>{ctx.save();ctx.globalAlpha=.85;round(-100,-23,200,46,3,C.accent);ctx.restore();});
  for(let i=0;i<3;i++){
    const y=832+i*170;round(180,y-25,52,52,10,null,C.pink,4);
    check(204,y+1,.8,out((t-.5-i*.35)/.5));
    line(280,y+60,789,y+60,C.pink,2);
  }
  const p=out((t-.2)/.7);
  drawMilk(337,838, .62, -.04);drawBread(337,1002,.59,.4);drawBottle(337,1174,.63,-.05);
  ctx.save();ctx.globalAlpha*=p;
  // Each grocery travels from its list row into the shared bag along a soft arc.
  const groceries=[
    {draw:drawMilk,fromY:838,toX:676,toY:1104,scale:.92,delay:.4},
    {draw:drawBread,fromY:1002,toX:589,toY:1110,scale:1.12,delay:.75},
    {draw:drawBottle,fromY:1174,toX:730,toY:1140,scale:.88,delay:1.1},
  ];
  for(const item of groceries){
    const travel=ease((t-item.delay)/1.0);
    ctx.save();ctx.globalAlpha*=out((t-item.delay)/.18);
    item.draw(mix(337,item.toX,travel),mix(item.fromY,item.toY,travel)-Math.sin(travel*Math.PI)*100,mix(.62,item.scale,travel),-.1);
    ctx.restore();
  }
  drawBag(641,1183+(1-p)*50,1.4,-.06,false);ctx.restore();
  spark(730,877,.9,C.red,.25);spark(544,957,.6,C.red,-.2);
  // Visible list strokes avoid adding another reading task.
  line(396,820,505,820,C.pink,8);line(395,844,468,844,C.pink,6);
  line(396,989,487,989,C.pink,8);line(396,1013,449,1013,C.pink,6);
  line(180,1385,797,1385,C.pink,2);
}
function pricing(t) {
  sceneHeader(['Proveri cenu','pre poručivanja.'],null,t);
  round(420,691,150,22,11,C.ink);
  // Address rows are illustrative, without invented customer data.
  for(let i=0;i<2;i++){
    const y=782+i*147;round(257,y,476,114,21,C.white,C.pink,2);
    pin(298,y+51,.53,i?C.red:C.ink);
    line(348,y+40,664,y+40,C.pink,9);line(348,y+66,571,y+66,C.grey,7);
    check(696,y+53,.42,out((t-.3-i*.25)/.45));
  }
  const glow=1+.015*Math.sin(Math.min(t,2)*Math.PI);
  local(495,1150,glow,0,()=>{
    round(-238,-52,476,104,22,C.red);
    text('Izračunaj cenu',0,17,44,C.white,{align:'center',weight:750});
  });
  const p=out((t-.9)/.7);circle(495,1335,73,C.pink);circle(495,1335,58,C.white);
  ctx.save();ctx.globalAlpha*=p;check(495,1336,1.48,1);ctx.restore();
  ctx.save();ctx.globalAlpha*=1-p;circle(487,1327,22,null,C.red,7);line(502,1344,521,1364,C.red,7);ctx.restore();
  round(430,1453,130,7,4,C.ink);
}
function business(t) {
  sceneHeader(['Dostava i za','Vašu firmu.'],'Dogovorimo saradnju.',t);
  const p=out((t-.2)/.7);ctx.save();ctx.globalAlpha*=p;
  shadow(470,1400,247,18,.07);drawStore(437,1030+(1-p)*45,1.12);
  drawBox(712,1280+(1-p)*80,.91,-.08);
  ctx.save();ctx.setLineDash([7,13]);ctx.beginPath();ctx.moveTo(362,1290);ctx.bezierCurveTo(359,1382,592,1394,640,1337);ctx.strokeStyle=C.red;ctx.lineWidth=5;ctx.stroke();ctx.restore();
  circle(723,876,48,C.red);check(721,878,1,1,C.white);
  spark(231,898,.75,C.red,.25);ctx.restore();
}
function phoneIcon(x,y,s=1) {
  local(x,y,s,-.18,()=>{
    ctx.beginPath();ctx.moveTo(-22,-29);ctx.bezierCurveTo(-36,-12,-10,29,18,34);ctx.lineTo(32,19);ctx.lineTo(13,2);ctx.lineTo(1,12);ctx.bezierCurveTo(-10,7,-17,-3,-17,-13);ctx.lineTo(-5,-19);ctx.lineTo(-15,-39);ctx.closePath();ctx.fillStyle=C.white;ctx.fill();
  });
}
function ending(t) {
  const a=out(t/.42);ctx.save();ctx.globalAlpha*=a;ctx.translate(0,(1-a)*23);
  text('Poruči onlajn',495,796,65,C.ink,{head:true,align:'center'});
  text('ili pozovi',495,868,65,C.ink,{head:true,align:'center'});
  round(137,935,716,110,22,C.red);
  text('smrckopotrcko.rs',495,1007,59,C.white,{align:'center',weight:800,maxWidth:665});
  circle(495,1130,44,C.red);phoneIcon(495,1130,.72);
  text('066 59 355 35',495,1250,77,C.ink,{align:'center',weight:800,maxWidth:700});
  line(200,1312,790,1312,C.pink,2);
  text('Svaki dan 08:00-23:00',495,1400,44,C.dark,{align:'center',weight:700,maxWidth:700});
  ctx.restore();
}
const scenes=[hook,delivery,shopping,pricing,business,ending];

function getState(seconds) {
  const t=clamp(seconds,0,30);
  // Crossfade the end into exactly the opening state, preserving the final hold.
  if(t>=29.5)return {from:5,to:0,p:ease((t-29.5)/.5),fromAge:t-24,toAge:0};
  for(let i=1;i<6;i++)if(t>=startTimes[i]-.3&&t<startTimes[i]+.3)
    return {from:i-1,to:i,p:ease((t-startTimes[i]+.3)/.6),fromAge:t-startTimes[i-1],toAge:Math.max(.45,t-startTimes[i]+.3)};
  let i=0;for(let j=1;j<6;j++)if(t>=startTimes[j])i=j;
  return {from:i,to:i,p:0,fromAge:t-startTimes[i],toAge:t-startTimes[i]};
}
function render(seconds) {
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.lineCap='round';ctx.lineJoin='round';
  const s=getState(seconds);background(seconds);
  const p={};for(const key of Object.keys(scenePaper[0]))p[key]=mix(scenePaper[s.from][key],scenePaper[s.to][key],s.p);
  drawPaper(p);
  const fromLogo=logoPlacement(s.from),toLogo=logoPlacement(s.to);
  const lw=mix(fromLogo.w,toLogo.w,s.p);
  ctx.drawImage(logo,mix(fromLogo.x,toLogo.x,s.p),mix(fromLogo.y,toLogo.y,s.p),lw,lw*583/1200);
  if(s.from===s.to)scenes[s.from](s.fromAge);
  else{
    ctx.save();ctx.globalAlpha=1-s.p;ctx.translate(0,-18*s.p);scenes[s.from](s.fromAge);ctx.restore();
    ctx.save();ctx.globalAlpha=s.p;ctx.translate(0,18*(1-s.p));scenes[s.to](s.toAge);ctx.restore();
  }
}

let playing=false,position=0,previous=0,raf=0;
const playButton=document.getElementById('play'),seek=document.getElementById('seek'),timeLabel=document.getElementById('time');
function syncControls(){seek.value=position;timeLabel.textContent=position.toFixed(1).replace('.',',')+' / 30 s';playButton.textContent=playing?'Pauza':'Pokreni';}
function frame(now){if(playing){position=(position+(now-previous)/1000)%30;render(position);syncControls();}previous=now;raf=requestAnimationFrame(frame);}
function setPlaying(value){playing=value;previous=performance.now();syncControls();}
playButton.addEventListener('click',()=>setPlaying(!playing));
document.getElementById('restart').addEventListener('click',()=>{position=0;render(0);setPlaying(true);});
seek.addEventListener('input',()=>{setPlaying(false);position=Number(seek.value);render(position);syncControls();});
document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='h')document.getElementById('controls').classList.toggle('hidden');if(event.code==='Space'&&event.target.tagName!=='INPUT'){event.preventDefault();setPlaying(!playing);}});
window.reel={render,seek(seconds){setPlaying(false);position=clamp(seconds,0,30);render(position);syncControls();},play(){setPlaying(true);},pause(){setPlaying(false);},get state(){return {position,playing};}};
window.reelReady=(async()=>{
  await logo.decode();
  await Promise.all([document.fonts.load('italic 900 99px "Archivo"','Šmrčko Potrčko'),document.fonts.load('800 70px "Plus Jakarta Sans"','Šmrčko čćšžđ'),document.fonts.load('650 49px "Plus Jakarta Sans"')]);
  await document.fonts.ready;
  if(new URLSearchParams(location.search).has('capture'))document.body.classList.add('clean');
  render(0);setPlaying(!new URLSearchParams(location.search).has('capture'));previous=performance.now();raf=requestAnimationFrame(frame);return true;
})();
