'use strict';
// Exact inverse of the reviewed kill combo delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./combo82-delta.json');
function withoutCombo82(html){
 html=require('./first83.cjs').withoutFirst83(html);
 if(!html.includes("Kill combo: kills less than 2.5 s apart chain"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact combo hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Combo inverse must restore immutable pre-combo runtime');return html;
}
module.exports={delta,withoutCombo82};
