'use strict';
// Exact inverse of the reviewed 3D height and trampoline delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./height67-delta.json');
function withoutHeight67(html){
 html=require('./edge69.cjs').withoutEdge69(html);
 if(!html.includes("Maple Street height: the top of the highest solid voxel"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact height hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Height inverse must restore immutable pre-height runtime');return html;
}
module.exports={delta,withoutHeight67};
