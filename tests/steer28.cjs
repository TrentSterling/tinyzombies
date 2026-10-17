'use strict';
// Exact inverse of the reviewed steering pass 2 delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./steer28-delta.json');
function withoutSteer28(html){
 html=require('./steer29.cjs').withoutSteer29(html);
 if(!html.includes('const navPublishShader='))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact steering hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Steering inverse must restore immutable pre-steering runtime');return html;
}
module.exports={delta,withoutSteer28};
