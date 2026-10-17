'use strict';
const assert=require('node:assert/strict');
const before='let busy=((u.run.x==3.0&&S.botPour15[id]>0.0)||((u.run.x==4.0||u.run.x==5.0)&&a.ai.x==7.0&&distance(a.p.xz,S.orders.yz)<100.0/64.0))&&S.orders.x>.5&&S.order13.z==f32(id)&&S.order13.x==5.0||a.ai.y==4.0||a.ai.y==5.0||a.ai.y==6.0||a.ai.y==7.0||(S.botFuel15[id]>.5&&a.ai.x==7.0&&distance(a.p.xz,u.goals.xy)<115.0/64.0);';
const after=before.replace('let busy=','let busy=(').replace('S.order13.x==5.0||','S.order13.x==5.0)||');
function withoutLogicalGrouping(html){
 if(!html.includes(after))return html;
 assert.equal(html.split(after).length,2,'Exactly one reviewed logical grouping change');
 return html.replace(after,before);
}
// Bounded lexical guard for mixed short-circuit operators in one expression level.
// This is not a full WGSL parser/compiler. Separate arguments, statements and
// parenthesized/indexed expressions must not share an operator accumulator.
function mixedShortCircuit(source){
 const clean=source.replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' ')).replace(/\/\/[^\n]*/g,m=>' '.repeat(m.length));
 const tokens=clean.matchAll(/&&|\|\||==|!=|<=|>=|[()\[\]{},;=]|[^\s]/g),stack=[{op:null}],errors=[];
 for(const match of tokens){const token=match[0],scope=stack[stack.length-1];
  if(token==='('||token==='['){stack.push({op:null});continue;}
  if(token===')'||token===']'){assert(stack.length>1,'Unbalanced expression delimiter');stack.pop();continue;}
  if(token==='{'){scope.op=null;stack.push({op:null});continue;}
  if(token==='}'){assert(stack.length>1,'Unbalanced block delimiter');stack.pop();stack[stack.length-1].op=null;continue;}
  if(token===','||token===';'||token==='='){scope.op=null;continue;}
  if(token==='&&'||token==='||'){
   if(scope.op&&scope.op!==token){errors.push({line:clean.slice(0,match.index).split('\n').length,offset:match.index,first:scope.op,second:token});}
   scope.op=token;
  }
 }
 assert.equal(stack.length,1,'Balanced source delimiters');return errors;
}
module.exports={before,after,withoutLogicalGrouping,mixedShortCircuit};
