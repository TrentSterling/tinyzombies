'use strict';
// Exact inverse of the reviewed neighbor-follow delta (behaviour pass 5); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./follow37-delta.json');
function withoutFollow37(html){
 if(!html.includes('Followers take their own place'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact follow hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Follow inverse must restore immutable pre-follow runtime');return html;
}
module.exports={delta,withoutFollow37};
