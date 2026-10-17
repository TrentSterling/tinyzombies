'use strict';
// Exact inverse of the reviewed required-rescue delta (milestone 2c); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./rescue32-delta.json');
function withoutRescue32(html){
 if(!html.includes('fn neighborsWaiting30()'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact rescue hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Rescue inverse must restore immutable pre-rescue runtime');return html;
}
module.exports={delta,withoutRescue32};
