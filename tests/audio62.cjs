'use strict';
// Exact inverse of the reviewed Maple audio cue delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./audio62-delta.json');
function withoutAudio62(html){
 if(!html.includes('function updateMapleAudio62()'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact audio hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Audio inverse must restore immutable pre-audio runtime');return html;
}
module.exports={delta,withoutAudio62};
