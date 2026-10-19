'use strict';
// Exact inverse of the reviewed voice and synth audio delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./voice70-delta.json');
function withoutVoice70(html){
 html=require('./quests71.cjs').withoutQuests71(html);
 if(!html.includes("B-movie announcer: the browser's own speech voices"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact voice hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Voice inverse must restore immutable pre-voice runtime');return html;
}
module.exports={delta,withoutVoice70};
