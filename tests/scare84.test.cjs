'use strict';
// Early scare: 1.2% of the held Maple infected come in awake at 15-17 s; the HUD fires one radio warning, sting and banner per world.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutScare84}=require('./scare84.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('init: a thin early band at 15-17 s, the rest keep 25-180 s; early ones spawn awake',()=>{
 assert(html.includes('Z[i].v.w=select(25.0+(f-.30)/.70*155.0,15.0+(f-held)/.012*2.0,f<held+.012);'));assert(html.includes('(S.aux.x>90.0||S.aux.x<20.0)'));
 const out={};for(const lvl of [1,3]){const held=.30+Math.min(.30,Math.max(0,lvl-1)*.10);let early=0,n=0;for(let i=0;i<4000;i++){const f=i/4000;if(f<=held)continue;n++;const w=f<held+.012?15+(f-held)/.012*2:25+(f-.30)/.70*155;if(w<20){early++;assert(w>=15&&w<=17);}else assert(w>=25);}out['level'+lvl]=early/4000;assert(early/4000>.01&&early/4000<.014);}return out;});
const host=()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;window.__said=[];window.__snd=[];announce65=s=>__said.push(s);synth65=s=>__snd.push(s);time=5');return h;};
check('one warning at 15 s per world',()=>{const h=host();h.run('playerValues[24]=10;scareHUD69(1);playerValues[24]=15.2;scareHUD69(1);time=6;scareHUD69(1);playerValues[24]=40;scareHUD69(1)');const [said,snd,r]=h.json('[__said,__snd,quest65.radio]');assert.equal(said.length,1);assert.deepEqual(snd,['sting']);assert.match(r,/Here they come/);});
check('exact inverse restores the immutable pre-scare runtime',()=>{assert.equal(sha(withoutScare84(html)),delta.parentSha256);});
const report={method:'Text and numeric model of the WGSL init; CPU host for the HUD; Tint validated the shader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
