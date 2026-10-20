'use strict';
// Exact inverse of the reviewed neighbor grace delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./grace86-delta.json');
function withoutGrace86(html){
 if(!html.includes("Barricaded: robot playtests (with honest tallies) lost two waiting neighbors"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact grace hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Grace inverse must restore immutable pre-grace runtime');return html;
}
module.exports={delta,withoutGrace86};
