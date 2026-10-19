'use strict';
// Exact inverse of the reviewed fire delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./fire78-delta.json');
function withoutFire78(html){
 if(!html.includes("Maple Street fire sticks: touching flames"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact fire hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Fire inverse must restore immutable pre-fire runtime');return html;
}
module.exports={delta,withoutFire78};
