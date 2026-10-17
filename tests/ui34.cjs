'use strict';
// Exact inverse of the reviewed crisp-text HUD delta (UI pass 1); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./ui34-delta.json');
function withoutUi34(html){
 html=require('./ui35.cjs').withoutUi35(html);
 if(!html.includes('function initHud2d30('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact UI hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'UI inverse must restore immutable pre-UI runtime');return html;
}
module.exports={delta,withoutUi34};
