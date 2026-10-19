'use strict';
// Exact inverse of the reviewed HOA President boss delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./boss66-delta.json');
function withoutBoss66(html){
 html=require('./ext68.cjs').withoutExt68(html);
 if(!html.includes("Maple Street boss: at 3 min zombie 1567"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact boss hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Boss inverse must restore immutable pre-boss runtime');return html;
}
module.exports={delta,withoutBoss66};
