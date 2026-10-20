'use strict';
// Exact inverse of the reviewed director delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./director88-delta.json');
function withoutDirector88(html){
 if(!html.includes("AI Director, stage 1: measure and show (Left 4 Dead style)"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact director hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Director inverse must restore immutable pre-director runtime');return html;
}
module.exports={delta,withoutDirector88};
