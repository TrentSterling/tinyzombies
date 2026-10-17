'use strict';
// Exact inverse of the reviewed performance pass 1 delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./perf27-delta.json');
function withoutPerf27(html){
 html=require('./steer28.cjs').withoutSteer28(html);
 if(!html.includes('function qualityGovernor25('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact perf hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Perf inverse must restore immutable pre-perf runtime');return html;
}
module.exports={delta,withoutPerf27};
