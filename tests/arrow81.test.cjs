'use strict';
// Off-screen HELP arrow: the nearest waiting neighbor, if off screen, gets a gold edge arrow with the distance; on screen, nothing.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutArrow81}=require('./arrow81.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const host=()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;glyphBuffer={name:"glyphBuffer"};hud2d30={save(){},restore(){},translate(x,y){this.t=[x,y]},rotate(a){this.a=a},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){this.filled=true},measureText:s=>({width:s.length*8}),fillText(){},strokeText(){}};hudScale30=1;width=1280;height=720;time=1;for(let c=0;c<CIV_MAX30;c++)playerValues[CIV_STATE30+c*4+2]=0;playerValues[0]=0;playerValues[2]=0');return h;};
check('off screen: arrow on the edge, pointing at the neighbor',()=>{const h=host();h.run('{const o=CIV_STATE30;playerValues[o]=60;playerValues[o+1]=0;playerValues[o+2]=1;helpArrow68(1)}');const [f,t]=h.json('[hud2d30.filled,hud2d30.t]');assert.equal(f,true);assert(t[0]>1100&&t[0]<=1280-55,'right edge: '+t[0]);});
check('on screen or nobody waiting: no arrow',()=>{const h=host();h.run('{const o=CIV_STATE30;playerValues[o]=2;playerValues[o+1]=0;playerValues[o+2]=1;helpArrow68(1)}');assert.equal(h.json('!!hud2d30.filled'),false);const g=host();g.run('helpArrow68(1)');assert.equal(g.json('!!hud2d30.filled'),false);});
check('exact inverse restores the immutable pre-arrow runtime',()=>{assert.equal(sha(withoutArrow81(html)),delta.parentSha256);});
const report={method:'CPU host with a recorded 2D context.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
