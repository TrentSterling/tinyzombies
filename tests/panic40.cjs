'use strict';
// Exact inverse of the reviewed neighbor-panic delta (behaviour pass 7); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./panic40-delta.json');
function withoutPanic40(html){
 if(!html.includes('let panic=c.data.y<1.5'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact panic hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Panic inverse must restore immutable pre-panic runtime');return html;
}
module.exports={delta,withoutPanic40};
