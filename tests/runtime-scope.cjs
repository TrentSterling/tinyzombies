'use strict';
// Exact inverse of the independently scoped heal-validity delta; not a general code scrubber.
const assert=require('node:assert/strict');
const {withoutLogicalGrouping}=require('./wgsl-logical-grouping.cjs');
const helper=`// Retained medical plans must revalidate their patient before spending a kit.
fn validHealPatient21(patientId21:i32,healer:u32,healerHP:f32)->bool {
 if(patientId21< -1||patientId21>2){return false;}
 if(patientId21== -1){return S.pos.w>0.0&&S.player7.x<=0.0;}
 let patient=u32(patientId21);return select(S.team7[patient].p.w,healerHP,patient==healer)>0.0&&S.botLife13[patient].y<.5;
}
`;
function withoutBotObjectivePriority23(html){
 html=require('./mercer-restoration-scope.cjs').withoutMercerRestoration24(html);
 html=withoutLogicalGrouping(html);
 if(!html.includes('fn botReviveFirst23('))return html;
 const helper23=`// Bot machinery must not bypass the source's nearby revive interaction priority.
fn botReviveFirst23(id:u32)->bool {
 let p=S.team7[id].p.xz;
 if(S.player7.x>0.0&&distance(p,S.pos.xz)<90.0/64.0){return true;}
 for(var other=0u;other<3u;other++){if(other!=id&&S.team7[other].p.w<=0.0&&S.botLife13[other].y<.5&&S.squad7.y!=f32(other)&&distance(p,S.team7[other].p.xz)<90.0/64.0){return true;}}
 return false;
}
`;
 assert.equal(html.split(helper23).length,2,'Exact reviewed objective revive helper');
 const crank='&&S.botLife13[u32(S.order13.z)].w==0.0&&!botReviveFirst23(u32(S.order13.z))';
 const pour='&&a.ai.x==7.0&&!botReviveFirst23(id)&&distance(a.p.xz,u.goals.xy)<115.0/64.0';
 assert.equal(html.split(crank).length,2,'Exact crank priority guard');
 assert.equal(html.split(pour).length,2,'Exact fuel priority guard');
 return html.replace(helper23,'').replace(crank,'&&S.botLife13[u32(S.order13.z)].w==0.0').replace(pour,'&&a.ai.x==7.0&&distance(a.p.xz,u.goals.xy)<115.0/64.0');
}
function withoutRevivePriority22(html){
 html=withoutBotObjectivePriority23(html);
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
module.exports={withoutHealValidity21,withoutRevivePriority22,withoutBotObjectivePriority23};
