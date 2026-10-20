'use strict';
// Exact inverse of the reviewed early-scare delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./scare84-delta.json');
function withoutScare84(html){
 if(!html.includes("Early scare: robot playtests ended the first 30 s"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact scare hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Scare inverse must restore immutable pre-scare runtime');return html;
}
module.exports={delta,withoutScare84};
