'use strict';
// Exact inverse of the reviewed Maple-Street-default delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./maple42-delta.json');
function withoutMaple42(html){
 html=require('./sunny43.cjs').withoutSunny43(html);
 if(!html.includes('Maple Street is the default game.'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact default-switch hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Default-switch inverse must restore immutable pre-default-switch runtime');return html;
}
module.exports={delta,withoutMaple42};
