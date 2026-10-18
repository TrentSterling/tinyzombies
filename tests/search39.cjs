'use strict';
// Exact inverse of the reviewed noise-search delta (behaviour pass 6); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./search39-delta.json');
function withoutSearch39(html){
 html=require('./panic40.cjs').withoutPanic40(html);
 if(!html.includes('var searching=false;'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact search hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Search inverse must restore immutable pre-search runtime');return html;
}
module.exports={delta,withoutSearch39};
