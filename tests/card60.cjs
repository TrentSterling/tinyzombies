'use strict';
// Exact inverse of the reviewed level-card delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./card60-delta.json');
function withoutCard60(html){
 html=require('./monsters61.cjs').withoutMonsters61(html);
 if(!html.includes('function levelCard59(k)'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact card hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Card inverse must restore immutable pre-card runtime');return html;
}
module.exports={delta,withoutCard60};
