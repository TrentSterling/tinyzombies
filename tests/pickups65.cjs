'use strict';
// Exact inverse of the reviewed shelter pickup delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./pickups65-delta.json');
function withoutPickups65(html){
 html=require('./boss66.cjs').withoutBoss66(html);
 if(!html.includes("A grabbable shelter item (more.x=44)"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact pickup hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Pickup inverse must restore immutable pre-pickup runtime');return html;
}
module.exports={delta,withoutPickups65};
