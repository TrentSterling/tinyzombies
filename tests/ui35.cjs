'use strict';
// Exact inverse of the reviewed key-cap help and boot-screen delta (UI pass 2); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./ui35-delta.json');
function withoutUi35(html){
 if(!html.includes('function helpCard30('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact help-card hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'UI inverse must restore immutable pre-help-card runtime');return html;
}
module.exports={delta,withoutUi35};
