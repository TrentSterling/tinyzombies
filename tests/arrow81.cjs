'use strict';
// Exact inverse of the reviewed off-screen HELP arrow delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./arrow81-delta.json');
function withoutArrow81(html){
 html=require('./combo82.cjs').withoutCombo82(html);
 if(!html.includes("Off-screen HELP arrow: when the nearest waiting neighbor is off screen"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact arrow hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Arrow inverse must restore immutable pre-arrow runtime');return html;
}
module.exports={delta,withoutArrow81};
