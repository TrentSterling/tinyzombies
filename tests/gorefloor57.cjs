'use strict';
// Exact inverse of the reviewed gore-floor delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./gorefloor57-delta.json');
function withoutGorefloor57(html){
 html=require('./eaten58.cjs').withoutEaten58(html);
 if(!html.includes('Ordinary Maple Street kills still tear the shirt'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact gore-floor hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Gore-floor inverse must restore immutable pre-gore-floor runtime');return html;
}
module.exports={delta,withoutGorefloor57};
