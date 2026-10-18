'use strict';
// Exact inverse of the reviewed shelter makeover delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./shelter54-delta.json');
function withoutShelter54(html){
 if(!html.includes('fn exitDecor54('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact shelter hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Shelter inverse must restore immutable pre-shelter runtime');return html;
}
module.exports={delta,withoutShelter54};
