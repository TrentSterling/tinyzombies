'use strict';
// Exact inverse of the reviewed twelve-neighbor delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./survivors72-delta.json');
function withoutSurvivors72(html){
 if(!html.includes("Twelve neighbors (every slot)"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact survivor hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Survivor inverse must restore immutable pre-survivor runtime');return html;
}
module.exports={delta,withoutSurvivors72};
