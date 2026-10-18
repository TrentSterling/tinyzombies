'use strict';
// Exact inverse of the reviewed polish delta (doorways, pickets, pools, player, maps); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./polish46-delta.json');
function withoutPolish46(html){
 if(!html.includes('function picket45('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact polish hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Polish inverse must restore immutable pre-polish runtime');return html;
}
module.exports={delta,withoutPolish46};
