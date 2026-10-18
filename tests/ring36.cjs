'use strict';
// Exact inverse of the reviewed noise-ring delta (behaviour pass 4); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./ring36-delta.json');
function withoutRing36(html){
 html=require('./follow37.cjs').withoutFollow37(html);
 if(!html.includes('fn hearRing34('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact noise-ring hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Noise-ring inverse must restore immutable pre-noise-ring runtime');return html;
}
module.exports={delta,withoutRing36};
