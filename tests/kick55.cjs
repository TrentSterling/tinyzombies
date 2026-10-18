'use strict';
// Exact inverse of the reviewed kick-me hint delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./kick55-delta.json');
function withoutKick55(html){
 html=require('./overlap56.cjs').withoutOverlap56(html);
 if(!html.includes('KICK ME!'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact hint hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Hint inverse must restore immutable pre-hint runtime');return html;
}
module.exports={delta,withoutKick55};
