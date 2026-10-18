'use strict';
// B-movie look: the Maple Street title is a poster (yellow, turning red spiral, drippy green title), and in play a ZAMN-style
// segmented health bar and score sit top left. Drawn straight on the 2D overlay; without it the old title card remains.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutBmovie52}=require('./bmovie52.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const mock=`(()=>{const log=[];const g={addColorStop(){}};return {canvas:{width:0,height:0,clientWidth:1280,clientHeight:720},log,clearRect(){},fillRect(x,y,w,h){log.push(['rect',x,y,w,h,this.fillStyle]);},strokeText(){},fillText(s){log.push(['fill',s]);},measureText(s){return {width:String(s).length*9};},
 save(){},restore(){},beginPath(){log.push(['path']);},lineTo(){},stroke(){log.push(['stroke']);},fill(){},roundRect(){log.push(['drip']);},createRadialGradient(){return g;},createLinearGradient(){return g;}};})()`;
const host=()=>{const h=loadHost(file,{plain:true});h.run('reset()');h.run(`width=1280;height=720;hud2d30=${mock};sizeHud2d30();`);return h;};
check('the poster fills the screen yellow, draws the spiral, eleven drips and the title text',()=>{
 const h=host();h.run('time=3;hud2d30.log.length=0;titleCard30(1)');const log=h.json('hud2d30.log');
 assert.equal(log.find(e=>e[0]==='rect')[5],'rgb(246,212,58)');assert(log.some(e=>e[0]==='stroke'),'spiral');assert.equal(log.filter(e=>e[0]==='drip').length,11);
 const f=log.filter(e=>e[0]==='fill').map(e=>e[1]);for(const s of ['TINY ZOMBIES','MAPLE STREET','CLICK TO PLAY'])assert(f.includes(s),s);
});
check('without the overlay the old title card still draws',()=>{const h=loadHost(file,{plain:true});h.run('reset();hud2d30=null;glyphCount=0;titleCard30(1)');assert(h.json('glyphCount')>40);});
check('ZAMN status block: ten health cells, red when low, and a six-digit score',()=>{
 const h=host();h.run('counters[0]=137;counters[34]=12;counters[66]=2;playerValues[3]=70;hud2d30.log.length=0;zamnHUD52(1)');let log=h.json('hud2d30.log');
 const cells=log.filter(e=>e[0]==='rect'&&e[4]===26);assert.equal(cells.length,10);assert.equal(cells.filter(e=>e[5]==='rgba(92,168,255,1)').length,7);
 assert(log.some(e=>e[0]==='fill'&&e[1]==='002670'),'137*10+12*25+2*500');
 h.run('playerValues[3]=20;hud2d30.log.length=0;zamnHUD52(1)');log=h.json('hud2d30.log');assert.equal(log.filter(e=>e[0]==='rect'&&e[4]===26&&e[5]==='rgba(255,82,77,1)').length,2);
 assert(html.includes('  if(SANDBOX25)calloutsHUD30(k);\n  if(SANDBOX25)zamnHUD52(k);'));
});
check('exact inverse restores the immutable pre-poster runtime',()=>{assert.equal(sha(withoutBmovie52(html)),delta.parentSha256);});
const report={method:'CPU host with a recording 2D context; frames rendered on SwiftShader for the PR.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
