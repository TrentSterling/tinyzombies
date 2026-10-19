'use strict';
// Exact inverse of the reviewed level-edge delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./edge69-delta.json');
function withoutEdge69(html){
 html=require('./voice70.cjs').withoutVoice70(html);
 if(!html.includes("Maple Street's edge (render only;"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact edge hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Edge inverse must restore immutable pre-edge runtime');return html;
}
module.exports={delta,withoutEdge69};
