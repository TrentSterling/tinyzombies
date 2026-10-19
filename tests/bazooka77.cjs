'use strict';
// Exact inverse of the reviewed bazooka delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./bazooka77-delta.json');
function withoutBazooka77(html){
 html=require('./fire78.cjs').withoutFire78(html);
 if(!html.includes("On Maple Street the R7 slot is the BAZOOKA"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact bazooka hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Bazooka inverse must restore immutable pre-bazooka runtime');return html;
}
module.exports={delta,withoutBazooka77};
