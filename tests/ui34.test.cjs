'use strict';
// UI pass 1: HUD text and panels draw on a crisp 2D overlay (Bangers/Rubik) instead of the stretched SDF atlas.
// A recording 2D context stands in for the browser canvas; no GPU, fonts or layout engine here.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutUi34}=require('./ui34.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const mock=`(()=>{const log=[];const ctx={canvas:{width:0,height:0,clientWidth:1920,clientHeight:1080},log,
 clearRect(){log.push(['clear']);},fillRect(x,y,w,h){log.push(['rect',x,y,w,h,this.fillStyle]);},
 strokeText(s,x,y){log.push(['stroke',s,x,y,this.font]);},fillText(s,x,y){log.push(['fill',s,x,y,this.font,this.fillStyle]);},
 measureText(s){log.push(['measure',s]);return {width:String(s).length*10};},
 save(){},restore(){},beginPath(){},lineTo(){},moveTo(){},stroke(){},fill(){},arc(){},roundRect(){},createRadialGradient(){return {addColorStop(){}};},createLinearGradient(){return {addColorStop(){}};}};return ctx;})()`;
const host=(seed)=>{const h=loadHost(file,seed?{seed}:undefined);h.run('reset()');h.run(`width=960;height=540;window.devicePixelRatio=2;hud2d30=${mock};sizeHud2d30();`);return h;};
const fills=h=>h.json('hud2d30.log.filter(e=>e[0]==="fill").map(e=>e[1])');

check('Bangers and Rubik are linked and the overlay sits above the WebGPU canvas without eating input',()=>{
 assert(html.includes('family=Bangers&family=Rubik:wght@500;700&display=swap'));assert(html.includes('#hud2d{position:fixed;inset:0;pointer-events:none;z-index:1}'));
 assert(html.includes("context=canvas.getContext('webgpu');initHud2d30();"),'overlay created right after the WebGPU context');
});
check('overlay is sized in device pixels (DPR capped at 2) and text is stroked then filled at the scaled position',()=>{
 const h=host();assert.equal(h.json('hud2d30.canvas.width'),3840);assert.equal(h.json('hudScale30'),4);
 h.run('glyphCount=0;hud2d30.log.length=0;text("HELLO",10,20,16,[1,0,0,1])');
 const log=h.json('hud2d30.log');assert.deepEqual(log.map(e=>e[0]),['stroke','fill']);assert.equal(log[1][2],40);assert.equal(log[1][3],(20+12)*4);
 assert.equal(log[1][5],'rgba(255,0,0,1)');assert.equal(h.json('glyphCount'),0,'no SDF glyph quads while the overlay is live');
});
check('big text uses the Bangers display face, small text uses Rubik bold',()=>{
 const h=host();const big=h.json('fontFor30(48)'),small=h.json('fontFor30(14)');assert.match(big,/px Bangers/);assert.match(small,/^700 \d+px Rubik/);return {big,small};
});
check('text widths are measured once per string and size, then served from the cache',()=>{
 const h=host();h.run('textWidths30.clear();hud2d30.log.length=0;a=textWidth9("MAPLE",20);b=textWidth9("MAPLE",20);');
 assert.equal(h.json('hud2d30.log.filter(e=>e[0]==="measure").length'),1);assert.equal(h.json('a'),h.json('b'));assert.equal(h.json('a'),50/4);
});
check('panels go to the overlay too, so a pause panel covers the HUD text under it',()=>{
 const h=host();h.run('glyphCount=0;hud2d30.log.length=0;text("UNDER",0,0,16);rect(5,6,7,8,[0,0,0,.5]);text("OVER",0,0,16)');
 assert.deepEqual(h.json('hud2d30.log.map(e=>e[0])'),['stroke','fill','rect','stroke','fill']);assert.equal(h.json('glyphCount'),0);
});
check('without a 2D context the original SDF glyph path still draws',()=>{
 const h=loadHost(file);h.run('reset()');h.run('hud2d30=null;glyphCount=0;text("FALLBACK",0,0,16)');assert(h.json('glyphCount')>=8);
});
check('sandbox title card: name, street, click-to-play and the pitch',()=>{
 const h=host('73129&sandbox');h.run('hud2d30.log.length=0;titleCard30(1)');const f=fills(h);
 for(const s of ['TINY ZOMBIES','MAPLE STREET','CLICK TO PLAY'])assert(f.includes(s),s);assert(f.some(x=>String(x).startsWith('Rescue your neighbors. Drop the houses on everyone else.')),'tagline (poster52 adds Kick the cheese.)');
 assert(html.includes('if(!settings.started&&!completedBoundary15&&SANDBOX25){titleCard30(k);}'));
});
check('evacuation card reports saved neighbors, kills, crushes and time, with a quip for every outcome',()=>{
 const h=host('73129&sandbox');h.run('world.civilians30=new Array(8);counters[29]=5;counters[25]=3;counters[0]=1234;counters[34]=88;playerValues[24]=412;hud2d30.log.length=0;evacCard30(1)');
 const f=fills(h);for(const s of ['MAPLE STREET EVACUATED','5 / 8 NEIGHBORS SAVED','1,234 put down   /   88 crushed   /   6:52','ENTER   NEXT STREET'])assert(f.includes(s),s);
 const q=h.json('[evacQuip30(8,0,8),evacQuip30(0,8,8),evacQuip30(2,6,8),evacQuip30(5,3,8)]');assert.equal(new Set(q).size,4);
 assert(html.includes('if(won&&SANDBOX25){evacCard30(k);}'));return {quips:q};
});
check('exact inverse restores the immutable pre-UI runtime',()=>{assert.equal(sha(withoutUi34(html)),delta.parentSha256);});
const report={method:'CPU host with a recording 2D context; no GPU, real fonts or layout.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
