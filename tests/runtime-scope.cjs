'use strict';
// Exact inverse of the independently scoped heal-validity delta; not a general code scrubber.
const assert=require('node:assert/strict');
const helper=`// Retained medical plans must revalidate their patient before spending a kit.
fn validHealPatient21(patientId21:i32,healer:u32,healerHP:f32)->bool {
 if(patientId21< -1||patientId21>2){return false;}
 if(patientId21== -1){return S.pos.w>0.0&&S.player7.x<=0.0;}
 let patient=u32(patientId21);return select(S.team7[patient].p.w,healerHP,patient==healer)>0.0&&S.botLife13[patient].y<.5;
}
`;
function withoutRevivePriority22(html){
 const before="threatNear7(a.p.xz,48.0/64.0)<.5){a.vital.x+=dt;",after="threatNear7(a.p.xz,48.0/64.0)<.5){if(u.run.x<=5.0&&S.heal12.y<0.0){S.heal12.x=0.0;S.supplies.w=0.0;}a.vital.x+=dt;";
 if(!html.includes(after))return html;
 assert.equal(html.split(after).length,2,"Exact reviewed self-heal revive reset");return html.replace(after,before);
}
function withoutHealValidity21(html){
 html=withoutRevivePriority22(html);
 if(!html.includes('fn validHealPatient21('))return html;
 assert.equal(html.split(helper).length,2,'Exact reviewed patient helper');
 const before='   if(action==5u||action==6u){let tid=select(i32(a.ai.z),i32(id),action==6u);let t=teamTarget7(tid);let close=';
 const after='   if(action==5u||action==6u){let tid=select(i32(a.ai.z),i32(id),action==6u);\n    if(!validHealPatient21(tid,id,a.p.w)){a.vital.x=0.0;a.plan.y=0u;}else{let t=teamTarget7(tid);let close=';
 assert.equal(html.split(after).length,2,'Exact guarded action entry');
 const close='    else{a.vital.x=0.0;a.plan.y=0u;}}}\n   if(action==8u)';assert.equal(html.split(close).length,2,'Exact guarded action exit');
 return html.replace(helper,'').replace(after,before).replace(close,'    else{a.vital.x=0.0;a.plan.y=0u;}}\n   if(action==8u)');
}
module.exports={withoutHealValidity21,withoutRevivePriority22};
