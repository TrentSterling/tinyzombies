'use strict';
// ZAMN events 3: characters hand over a reward as they join; Baby Buster waits in a crib (slot 5).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutReward50}=require('./reward50.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),h=loadHost(file),civ=Object.values(h.sources).find(s=>s.includes('fn civStep30('));
check('the hardcoded state slots match L12',()=>{assert.equal(h.json('L12.reserve/4'),557);assert.equal(h.json('L12.items/4'),558);assert(civ.includes('var it=SR[558u];var rs=SR[557u];'));});
check('rewards per type, capped like the pickups, only on the join edge',()=>{
 const j=civ.indexOf('if(c.data.y<1.5&&d<2.2&&player.w>0.0){c.data.y=2.0;atomicAdd(&C[64],1u);'),r=civ.indexOf('if(t30>0u){SR[558u]=it;SR[557u]=rs;}}');assert(j>0&&r>j&&r-j<900,'inside the join branch');
 for(const f of ['if(t30==1u){rs.x=min(240.0,rs.x+60.0);rs.y=min(56.0,rs.y+12.0);}','if(t30==2u){it.z=min(2.0,it.z+1.0);}','if(t30==3u||t30==5u){it.y=min(3.0,it.y+1.0);}','if(t30==4u){it.x=min(4.0,it.x+2.0);}'])assert(civ.includes(f),f);
 assert.deepEqual(h.json('CIV_REWARD47').map(x=>x.replace('SODA CANS','PIPE BOMBS')),['','+60 AMMO','+1 MOLOTOV','+1 MEDKIT','+2 PIPE BOMBS','+1 MEDKIT']);
});
check('Baby Buster takes slot 5, is small, lies in a crib and has his own lines',()=>{
 const n=loadHost(file,{seed:'99&sandbox'}).json('makeWorld().civilians30.map(c=>c.name)');assert.equal(n[5],'Baby Buster');
 assert(html.includes('modelSize=vec3f(select(.92,.52,kind30==5u));'));assert(html.includes('if(kind30==5u){let cr=home'));assert.equal(h.json('CIV_TYPE_LINES47[5].saved.length'),2);
});
check('joining a character shows the reward banner',()=>{
 const g=loadHost(file,{seed:'99&sandbox'});g.run('reset();glyphBuffer={name:"glyphBuffer"};settings.started=true;playerValues[3]=100;for(let c=0;c<world.civilians30.length;c++)playerValues[CIV_STATE30+c*4+2]=1;hud();playerValues[CIV_STATE30+3*4+2]=2;hud();');
 assert.equal(g.json('civBanner47'),'TIFFANY  +1 MEDKIT');
});
check('exact inverse restores the immutable pre-rewards runtime',()=>{assert.equal(sha(withoutReward50(html)),delta.parentSha256);});
const report={method:'Source fragments and HUD in the CPU host; rewards were read back from the real civilians30 shader on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
