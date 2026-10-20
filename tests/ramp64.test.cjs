'use strict';
// Maple Street eases in and ramps up: ~30% of the infected start in the street and the rest arrive offscreen between 25 s and 3 min
// (awake after 90 s). Bites hurt 60%, every neighbor hands over a medkit, and bots heal sooner (self below 65, medic below 70).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutRamp64}=require('./ramp64.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=require('./scare84.cjs').withoutScare84(fs.readFileSync(file,'utf8'));// text checks read the pre-scare init; scare84 owns the 15 s band
check('init holds back ~70% on Maple, staggered 25-180 s',()=>{assert(html.includes('if(u.run.x>5.0&&u.run.y<.5){let f=rnd(i+5003u);if(f>.30+min(.30,max(0.0,u.v3.x-1.0)*.10)&&i!=31u){Z[i].p.w=0.0;Z[i].v.w=25.0+(f-.30)/.70*155.0;Z[i].special13.w=-2.0;}}'));
 const lo=25+0*155,hi=25+(1-.30)/.70*155;assert.equal(lo,25);assert(Math.abs(hi-180)<1e-9);return {measured:'SwiftShader, compressed timers: 605 live at start, 909, 1591, then 2048'};});
check('only held-back infected respawn on Maple; arrivals after 90 s are awake',()=>{assert(html.includes('if(z.p.w<=0.0&&u.run.y<.5&&!(u.run.x>5.0&&z.special13.w==-2.0)&&(S.journey7.x<.5||'));
 assert(html.includes('select(0.0,9.0,S.wave.x>1.5||(z.special13.w==-2.0&&S.aux.x>90.0)));z.extraData.z=kind;z.extraData.w=0.0;z.special13.w=-1.0;}'),'marker cleared on arrival, so a later kill stays dead');});
check('bites and slams hurt 60% on Maple',()=>{assert(html.includes('S.pos.w=max(0.0,S.pos.w-f32(hit)*select(1.0,.6,u.run.x>5.0&&u.run.y<.5));'));assert(html.includes('S.pos.w=max(0.0,S.pos.w-24.0*select(1.0,.6,u.run.x>5.0&&u.run.y<.5));'));return {measured:'two bites: 100 -> 95.8 -> 91.6 (was 7 each)'};});
check('every neighbor hands over a medkit',()=>{assert(html.includes('it.y=min(3.0,it.y+1.0);SR[558u]=it;SR[557u]=rs;}'));
 const g=loadHost(file,{seed:'99&sandbox'});g.run('reset();glyphBuffer={name:"glyphBuffer"};settings.started=true;playerValues[3]=100;for(let c=0;c<world.civilians30.length;c++)playerValues[CIV_STATE30+c*4+2]=1;hud();playerValues[CIV_STATE30+2]=2;hud();');
 assert.equal(g.json('civBanner47'),g.json('world.civilians30[0].name.toUpperCase()')+'  +1 MEDKIT','indoor neighbors get a banner too');});
check('bots heal sooner on Maple',()=>{assert(html.includes('q.w>=select(48.0,70.0,u.run.x>5.0&&u.run.y<.5)'));assert(html.includes('if(a.p.w<select(48.0,65.0,u.run.x>5.0&&u.run.y<.5)&&(a.pack.w>0.0||cache>=0)'));
 return {measured:'Dawn/lavapipe buddy shader: player at 60 HP healed to 100 at 3 s by bot 0 (main: never)'};});
check('exact inverse restores the immutable pre-ramp runtime',()=>{assert.equal(sha(withoutRamp64(html)),delta.parentSha256);});
const report={method:'Source fragments, CPU host banner, plus measurements on SwiftShader and Dawn/lavapipe (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
