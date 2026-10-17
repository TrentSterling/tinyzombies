'use strict';
// Exact inverse of the reviewed Maple Street sandbox delta (milestone 1); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./sandbox26-delta.json');
function withoutSandbox26(html){
 html=require('./perf27.cjs').withoutPerf27(html);
 if(!html.includes('function houses25('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact sandbox hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Sandbox inverse must restore immutable pre-sandbox runtime');return html;
}
module.exports={delta,withoutSandbox26};
