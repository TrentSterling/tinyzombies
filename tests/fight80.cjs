'use strict';
// Exact inverse of the reviewed neighbors-fight-back delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./fight80-delta.json');
function withoutFight80(html){
 if(!html.includes("Rescued neighbors fight back (Maple Street)"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact fight hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Fight inverse must restore immutable pre-fight runtime');return html;
}
module.exports={delta,withoutFight80};
