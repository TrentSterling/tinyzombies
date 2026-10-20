'use strict';
// Exact inverse of the reviewed counter-slot move; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./slots85-delta.json');
function withoutSlots85(html){
 html=require('./grace86.cjs').withoutGrace86(html);
 if(!html.includes("Maple Street: neighbors C[96] joined, C[97] lost, C[98] saved"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact slots hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Slots inverse must restore immutable pre-move runtime');return html;
}
module.exports={delta,withoutSlots85};
