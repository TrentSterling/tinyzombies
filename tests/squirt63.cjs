'use strict';
// Exact inverse of the reviewed squirt gun delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./squirt63-delta.json');
function withoutSquirt63(html){
 if(!html.includes("the player's pistol is a squirt gun"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact squirt hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Squirt inverse must restore immutable pre-squirt runtime');return html;
}
module.exports={delta,withoutSquirt63};
