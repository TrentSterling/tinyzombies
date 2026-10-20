'use strict';
// Exact inverse of the reviewed first-rescue delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./first83-delta.json');
function withoutFirst83(html){
 if(!html.includes("First rescue next door: robot playtests never reached"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact first-rescue hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'First-rescue inverse must restore immutable pre-first-rescue runtime');return html;
}
module.exports={delta,withoutFirst83};
