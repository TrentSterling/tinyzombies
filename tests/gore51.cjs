'use strict';
// Exact inverse of the reviewed gore delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./gore51-delta.json');
function withoutGore51(html){
 html=require('./bmovie52.cjs').withoutBmovie52(html);
 if(!html.includes('function splatHUD51('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact gore hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Gore inverse must restore immutable pre-gore runtime');return html;
}
module.exports={delta,withoutGore51};
