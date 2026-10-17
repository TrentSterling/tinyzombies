'use strict';
// Exact inverse of the reviewed Maple Street neighbors delta (milestone 2a); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./civ30-delta.json');
function withoutCiv30(html){
 if(!html.includes('const civilians30Shader='))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact neighbors hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Neighbors inverse must restore immutable pre-neighbors runtime');return html;
}
module.exports={delta,withoutCiv30};
