'use strict';
// The mission panel and radio subtitle shrink their text to fit, so nothing runs off the right edge (seen in a 2000x1125 playtest).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutPanel76}=require('./panel76.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('every mission line fits inside the panel at common sizes',()=>{const out={};for(const [w,h] of [[1280,720],[960,540],[2000,1125],[800,600]]){const H=loadHost(file,{plain:true});H.run(`reset();width=${w};height=${h};counters.fill(0)`);
 const worst=H.json(`(()=>{const k=Math.min(width/1280,height/720);const fit=(s,px,wd)=>Math.min(px,px*wd/Math.max(1,textWidth9(s,px)));let m=0;for(const q of QUESTS65){for(const [s,px] of [[q.goal(),12],['MISSION 7/7  '+q.title,15]]){m=Math.max(m,textWidth9(s,fit(s,px*k,276*k))/(276*k));}}return m})()`);
 assert(worst<=1.0001,w+'x'+h+' '+worst);out[w+'x'+h]=+worst.toFixed(3);}return out;});
check('panel and radio use the fit',()=>{assert(html.includes('text(g,x+12*k,y+32*k,fit(g,12*k,276*k),COL9.white);'));assert(html.includes("const r='RADIO:  '+q.radio,px=fit(r,14*k,width-40*k);"));});
check('exact inverse restores the immutable pre-panel runtime',()=>{assert.equal(sha(withoutPanel76(html)),delta.parentSha256);});
const report={method:'CPU-host text measurement at four screen sizes.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
