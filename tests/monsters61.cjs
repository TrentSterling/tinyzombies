'use strict';
// Exact inverse of the reviewed B-movie monster palette delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./monsters61-delta.json');
function withoutMonsters61(html){
 html=require('./audio62.cjs').withoutAudio62(html);
 if(!html.includes('Maple Street specials are dressed as B-movie monsters'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact monster hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Monster inverse must restore immutable pre-monster runtime');return html;
}
module.exports={delta,withoutMonsters61};
