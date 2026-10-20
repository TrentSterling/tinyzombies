'use strict';
// Rescued neighbors fight back: a following neighbor hits each infected within 2.4 m about every half second, by type.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutFight80}=require('./fight80.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('only following neighbors, Maple only, not tanks or the boss, 2.4 m, every 30 frames',()=>{assert(html.includes('if(u.run.x>5.0&&u.run.y<.5&&z.p.w>0.0&&kind!=6.0){for(var ck=0u;ck<12u;ck++){let cv=Props[CIV_BASE30+ck];if(cv.p.w!=30.0||cv.data.y<1.5||cv.data.y>2.5){continue;}'));
 assert(html.includes('if(t30==0u||t30==5u||length(cv.p.xz-z.p.xz)>2.4||((u32(u.clock.z)+i*7u+ck*13u)%30u)!=0u){continue;}'));});
check('per type: BBQ fire, Pool Guy knockback, cheer and stomp damage',()=>{assert(html.includes('if(t30==2u){burning=true;'));assert(html.includes('if(t30==1u){damage+=14.0;z.history.z+=away.x*6.0;'));assert(html.includes('if(t30==3u){damage+=26.0;'));assert(html.includes('if(t30==4u){damage+=32.0;'));
 const fire=html.indexOf('if(t30==2u){burning=true;'),stick=html.indexOf('// Maple Street fire sticks:');assert(fire>0&&fire<stick,'BBQ fire feeds the burn timer in the same frame');});
check('exact inverse restores the immutable pre-fight runtime',()=>{assert.equal(sha(withoutFight80(html)),delta.parentSha256);});
const report={method:'Source fragments; a following BBQ Dad among awake infected was rendered on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
