'use strict';
// SAY CHEESE! (and its line) sit at height .11-.16, clear of CRUSHED xN at .24 and CHAIN xN below it.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutOverlap56}=require('./overlap56.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('cheese banner above the crush callouts',()=>{assert(html.includes("text(s,width/2-textWidth9(s,px)/2,height*.11,px,COL9.gold);"));assert(html.includes("text(s,width/2-textWidth9(s,px)/2,height*.24,px,COL9.gold);"),'crushed stays at .24');
 const k=1.2,h=1080,cheeseBottom=h*.11+50*k+15*k*1.3,crushedTop=h*.24;assert(cheeseBottom<crushedTop,cheeseBottom+' < '+crushedTop);});
check('exact inverse restores the immutable pre-overlap-fix runtime',()=>{assert.equal(sha(withoutOverlap56(html)),delta.parentSha256);});
const report={method:'Source fragments and layout arithmetic; a real crush was rendered on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
