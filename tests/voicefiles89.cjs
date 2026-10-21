'use strict';
// Exact inverse of the reviewed recorded-voice delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./voicefiles89-delta.json');
function withoutVoicefiles89(html){
 html=require('./director90.cjs').withoutDirector90(html);
 if(!html.includes("Recorded voices: lines rendered offline (Kokoro + DSP"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact voice hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Voice inverse must restore immutable pre-voice runtime');return html;
}
module.exports={delta,withoutVoicefiles89};
