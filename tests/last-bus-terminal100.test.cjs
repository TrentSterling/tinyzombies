'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadHost}=require('./deadends-cpu-host.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html'),baseline=process.argv[3];
const signoff='Radio Pleasant Acres, signing off. You saved the street.';
function fixture(terminal,{hidden=false,plain=true}={}){
 const h=loadHost(file,{plain});
 // Run the real production hud() and questHUD65(). Only drawing/audio backends are inert.
 // This is a host-state fixture, not a GPU-earned clear or an ordinary playthrough.
 h.run("var spoken100=[],jingles100=[],drawn100=[];announce65=(s,priority)=>{spoken100.push({s,priority:!!priority});return true;};synth65=s=>jingles100.push(s);text=s=>drawn100.push(String(s));rect=()=>{};panel9=()=>{};pill30=s=>drawn100.push(s);textWidth9=(s,px)=>String(s).length*px*.5;screenPoint=()=>[640,360];glyphBuffer={name:'glyphBuffer'};settings.started=true;settings.stats=false;settings.help=false;settings.paused=false;settings.tactical=false;settings.map=false;quest65.world=world;quest65.epoch=runEpoch16;quest65.i=6;quest65.bonus=6000;quest65.radio=QUESTS65[6].radio;quest65.radioUntil=0;playerValues[L7.goal+3]="+terminal+";playerValues[3]=100;playerValues[24]=500;time=500;counters[98]=4;counters[101]=2;settings.hideUI="+hidden);
 const before=h.json('({player:Array.from(playerValues),counters:Array.from(counters),combo:combo69.bonus})');
 h.run('hud()');
 const first=h.json('({i:quest65.i,bonus:quest65.bonus,radio:quest65.radio,spoken:spoken100,jingles:jingles100,drawn:drawn100})');
 h.run('for(let n=0;n<120;n++){time+=1/60;hud()}');
 const repeat=h.json('({i:quest65.i,bonus:quest65.bonus,spoken:spoken100,jingles:jingles100})');
 assert.deepEqual(h.json('({player:Array.from(playerValues),counters:Array.from(counters),combo:combo69.bonus})'),before,'terminal presentation must not change simulation, counters or combo score');
 return {h,first,repeat};
}
const clear=fixture(1),overrun=fixture(2),hidden=fixture(1,{hidden:true}),legacy=fixture(1,{plain:false});
const observed={clear:clear.first,overrun:overrun.first};
if(process.env.TINY_TERMINAL_OBSERVE==='1'){console.log(JSON.stringify(observed,null,2));process.exit(0);}
assert.equal(clear.first.i,7,'a real victory HUD frame completes LAST BUS OUT');
assert.equal(clear.first.bonus,7000,'clear receives exactly the missing 1000 quest points');
assert.equal(clear.first.radio,signoff);
assert.deepEqual(clear.first.spoken,[{s:signoff,priority:true}]);
assert.deepEqual(clear.first.jingles,['jingle']);
assert(clear.first.drawn.includes('MAPLE STREET EVACUATED'),'existing evacuation card remains');
assert(clear.first.drawn.includes('ALL MISSIONS COMPLETE'),'clear completion is drawn');assert(!clear.first.drawn.some(s=>s.startsWith('QUEST COMPLETE:')),'redundant banner must not bleed through evacuation card');
assert(clear.first.drawn.includes('RADIO:  '+signoff),'clear sign-off subtitle is drawn');
assert.equal(clear.repeat.bonus,7000);assert.equal(clear.repeat.i,7);assert.deepEqual(clear.repeat.spoken,clear.first.spoken);assert.deepEqual(clear.repeat.jingles,clear.first.jingles);
assert.equal(overrun.first.i,6,'overrun must not complete LAST BUS OUT');assert.equal(overrun.first.bonus,6000);assert.deepEqual(overrun.repeat.spoken,[]);assert.deepEqual(overrun.repeat.jingles,[]);assert(overrun.first.drawn.includes('Overrun'));assert(!overrun.first.drawn.includes('ALL MISSIONS COMPLETE'));
for(const terminal of [0,2,3]){clear.h.run('playerValues[L7.goal+3]='+terminal);assert.equal(clear.h.run('QUESTS65[6].done()'),false,'only terminal state 1 is victory, not '+terminal);}
clear.h.run('playerValues[L7.goal+3]=1');assert.equal(clear.h.run('QUESTS65[6].done()'),true);
assert.equal(hidden.first.bonus,7000,'hidden normal HUD must not lose clear credit');assert.equal(hidden.repeat.spoken.length,1);
assert.equal(legacy.first.bonus,6000,'legacy campaign must not run Maple Street terminal quests');assert.deepEqual(legacy.repeat.spoken,[]);
// Direct repeated invocation is also idempotent; reroll/reset resumes the unchanged opening quest.
clear.h.run('questHUD65(1);runEpoch16++;playerValues.fill(0);counters.fill(0);spoken100=[];jingles100=[];questHUD65(1)');
assert.equal(clear.h.run('quest65.i'),0);assert.equal(clear.h.run('quest65.bonus'),0);assert.deepEqual(clear.h.json('spoken100'),[{s:clear.h.run('QUESTS65[0].radio'),priority:false}]);
let identicalShaders=null;
function earlierQuests(h){h.run("var earlier100=[];announce65=s=>{earlier100.push(s);return true;};synth65=()=>{};text=()=>{};settings.started=true;playerValues.fill(0);counters.fill(0);time=0;questHUD65(1)");const rows=[];for(const step of ['playerValues[L7.journey7]=1','counters[98]=1','counters[48]=1','counters[83]=1','counters[98]=4','counters[101]=2']){h.run(step+';time++;questHUD65(1)');rows.push(h.json('({i:quest65.i,bonus:quest65.bonus,radio:quest65.radio})'));}assert.deepEqual(rows.map(r=>r.bonus),[1000,2000,3000,4000,5000,6000]);return{rows,spoken:h.json('earlier100')};}
const earlier=earlierQuests(loadHost(file,{plain:true}));
if(baseline){const b=loadHost(baseline,{plain:true}),expected=b.html.replace("done:()=>(playerValues[L7.goal+3]||0)>0","done:()=>playerValues[L7.goal+3]===1").replace('function questHUD65(k){','function questHUD65(k,terminal=false){').replace('if(q.banner&&time<q.until){','if(!terminal&&q.banner&&time<q.until){').replace('if(won&&SANDBOX25){evacCard30(k);}','if(won&&SANDBOX25){questHUD65(k,true);evacCard30(k);}');assert.equal(clear.h.html,expected,'entire runtime differs only by exact victory predicate, victory HUD call and terminal-only banner suppression');identicalShaders=Object.keys(clear.h.sources).length;for(const name of Object.keys(clear.h.sources))assert.equal(clear.h.sources[name],b.sources[name],name+' unchanged');assert.deepEqual(earlier,earlierQuests(b),'all six earlier quest credits and cues unchanged');}
console.log(JSON.stringify({passed:true,method:'Production hud() + questHUD65() with terminal host-state fixtures; no GPU, ordinary full route, or audio listening',sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),clear:{first:clear.first,repeat:clear.repeat},overrun:{first:overrun.first,repeat:overrun.repeat},checks:['Clear +1000/sign-off/jingle exactly once across 121 HUD frames','Overrun: no terminal credit or sign-off','Only state 1 qualifies','Clear with hidden normal HUD','Legacy campaign unaffected','Reset opening unchanged','Simulation/counters/combo unchanged','All shaders byte-identical'],identicalShaders},null,2));
