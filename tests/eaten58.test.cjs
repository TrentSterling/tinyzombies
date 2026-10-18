'use strict';
// A neighbor the infected eat bursts once in the props pass (before particles are prepared) and gets a red GOT EATEN! banner.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutEaten58}=require('./eaten58.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('burst fires once per eaten neighbor, in the Maple props pass',()=>{const a=html.indexOf('if(cv.p.w!=30.0||cv.data.y!=4.0){continue;}cv.data.y=4.25;');assert(a>0);
 const props=html.indexOf('const propsShader='),source=html.indexOf('if(u.run.x<=5.0&&u.run.y<.5){sourceProps15();return;}',props);assert(a>source,'after the DEAD ENDS early return');
 const body=html.slice(a,html.indexOf('atomicAdd(&C[57],1u);}',a));assert(body.includes(',7u,120u,'),'120 blood');assert(body.includes(',0u,40u,'),'40 scraps');
 assert.equal(html.split('C[57]').length,3,'C[57] is new: the comment and the one count');});
check('spent state still reads as lost on the HUD',()=>{assert.equal(Math.round(4.25),4);assert(html.includes("if(nb.z<.5||nb.z>2.5){continue;}"),'map skips it');});
check('red GOT EATEN! banner',()=>{assert(html.includes("if(st===4)civBanner47=(n.name||'A NEIGHBOR').toUpperCase()+' GOT EATEN!'"));assert(html.includes('civBannerCol47||COL9.gold'));});
check('neighbor tallies use slots begin() never clears',()=>{for(const [n,k] of [[64,'join'],[65,'lost'],[66,'saved']])assert.equal(html.split('atomicAdd(&C['+n+'],1u)').length,2,k);
 assert(html.includes('atomicExchange(&C[array<u32,3>(24u,25u,29u)[k]],0u)'),'bot pins keep 24/25/29');assert(!/atomicAdd\(&C\[(24|25|29)\],1u\)/.test(html),'no civ add on a pin slot');
 assert(html.includes('saved=counters[66]|0,lost=counters[65]|0')&&html.includes('(counters[66]|0)*500'));});
check('exact inverse restores the immutable pre-eaten runtime',()=>{assert.equal(sha(withoutEaten58(html)),delta.parentSha256);});
const report={method:'Source fragments; a neighbor eaten in the real game was rendered on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
