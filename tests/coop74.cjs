'use strict';
// Exact inverse of the reviewed same-screen co-op delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./coop74-delta.json');
function withoutCoop74(html){
 html=require('./online75.cjs').withoutOnline75(html);
 if(!html.includes("Same-screen co-op (Maple Street): player two drives bot 1"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact co-op hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Co-op inverse must restore immutable pre-co-op runtime');return html;
}
module.exports={delta,withoutCoop74};
