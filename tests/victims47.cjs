'use strict';
// Exact inverse of the reviewed neighbor-types delta (ZAMN events 1); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./victims47-delta.json');
function withoutVictims47(html){
 html=require('./bots48.cjs').withoutBots48(html);
 if(!html.includes('const CIV_TYPE_LINES47='))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact neighbor-types hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Neighbor-types inverse must restore immutable pre-neighbor-types runtime');return html;
}
module.exports={delta,withoutVictims47};
