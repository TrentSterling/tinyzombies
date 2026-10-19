'use strict';
// Exact inverse of the reviewed slow-start ramp and Maple healing delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./ramp64-delta.json');
function withoutRamp64(html){
 if(!html.includes("Maple Street starts slow and ramps"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact ramp hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Ramp inverse must restore immutable pre-ramp runtime');return html;
}
module.exports={delta,withoutRamp64};
