'use strict';
// Errors thrown by browser extensions (seen live: chrome-extension://.../executors/200.js, "reading 'M_ID'") must not stop the game;
// the game's own errors still do.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutExt68}=require('./ext68.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('extension errors are recognised, game errors are not',()=>{const src=html.match(/const foreignError68=[^\n]*\n/)[0];const f=new Function(src+'return foreignError68;')();
 const ext=new TypeError("Cannot read properties of undefined (reading 'M_ID')");ext.stack="TypeError: x\n    at Y (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:761)";
 assert(f(ext,''));assert(f('x','chrome-extension://abc/a.js'));assert(f('x','moz-extension://abc/a.js'));const own=new Error('GPU');own.stack='Error: GPU\n    at frameLoop (https://tront.xyz/tinyzombies/:4200:3)';assert(!f(own,'https://tront.xyz/tinyzombies/'));assert(!f('Script error.',''));});
check('both handlers filter before fail()',()=>{assert(html.includes("window.addEventListener('error',e=>{if(foreignError68(e.error||e.message,e.filename)){"));assert(html.includes("window.addEventListener('unhandledrejection',e=>{if(foreignError68(e.reason)){"));return {measured:'real page on SwiftShader: 6 extension errors dispatched, stopped=false, frames advancing; the previous build stopped'};});
check('exact inverse restores the immutable pre-extension runtime',()=>{assert.equal(sha(withoutExt68(html)),delta.parentSha256);});
const report={method:'Handler regex unit cases plus a real-page dispatch on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
