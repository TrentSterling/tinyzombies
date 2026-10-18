'use strict';
// Exact inverse of the reviewed B-movie title and HUD delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./bmovie52-delta.json');
function withoutBmovie52(html){
 if(!html.includes('function poster52('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact poster hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Poster inverse must restore immutable pre-poster runtime');return html;
}
module.exports={delta,withoutBmovie52};
