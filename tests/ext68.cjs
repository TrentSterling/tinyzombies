'use strict';
// Exact inverse of the reviewed extension-error delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./ext68-delta.json');
function withoutExt68(html){
 html=require('./height67.cjs').withoutHeight67(html);
 if(!html.includes("Browser extensions run their own scripts in the page"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact extension hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Extension inverse must restore immutable pre-extension runtime');return html;
}
module.exports={delta,withoutExt68};
