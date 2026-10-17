'use strict';
// Exact inverse of the reviewed steering pass 3 delta (breaches); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./steer29-delta.json');
function withoutSteer29(html){
 if(!html.includes('fn laneCode30('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact breach hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Breach inverse must restore immutable pre-breach runtime');return html;
}
module.exports={delta,withoutSteer29};
