'use strict';
// Exact inverse of the reviewed director stage-2 delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./director90-delta.json');
function withoutDirector90(html){
 if(!html.includes("Stage 2: the director steers reinforcements through u.v5.x"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact director2 hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Director2 inverse must restore immutable pre-stage-2 runtime');return html;
}
module.exports={delta,withoutDirector90};
