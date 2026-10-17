'use strict';
// Exact inverse of the reviewed collapse-crush and breach-noise delta (milestone 2b); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./crush31-delta.json');
function withoutCrush31(html){
 html=require('./rescue32.cjs').withoutRescue32(html);
 if(!html.includes('const crush30Shader='))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact crush hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Crush inverse must restore immutable pre-crush runtime');return html;
}
module.exports={delta,withoutCrush31};
