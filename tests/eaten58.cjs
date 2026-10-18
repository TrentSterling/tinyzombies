'use strict';
// Exact inverse of the reviewed neighbor-eaten delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./eaten58-delta.json');
function withoutEaten58(html){
 html=require('./bleed59.cjs').withoutBleed59(html);
 if(!html.includes('GOT EATEN!'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact eaten hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Eaten inverse must restore immutable pre-eaten runtime');return html;
}
module.exports={delta,withoutEaten58};
