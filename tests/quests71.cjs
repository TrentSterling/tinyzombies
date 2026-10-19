'use strict';
// Exact inverse of the reviewed story, quests and yellow paint delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./quests71-delta.json');
function withoutQuests71(html){
 html=require('./survivors72.cjs').withoutSurvivors72(html);
 if(!html.includes("Story and quests: Radio Pleasant Acres walks the player"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact quest hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Quest inverse must restore immutable pre-quest runtime');return html;
}
module.exports={delta,withoutQuests71};
