const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const url='https://fonts.googleapis.com/css2?family=Bangers&family=Rubik:wght@500;700&display=swap';
test('no parser stylesheet or inline event handler and both fallback stacks remain',()=>{
 const head=html.slice(0,html.indexOf('</head>'));
 assert.doesNotMatch(head,/<link\b[^>]*\brel=["']stylesheet["']/i);
 assert.doesNotMatch(head,/\bon(?:load|error)\s*=/i);
 assert.match(head,/Bangers,Impact,'Arial Black',sans-serif/);
 assert.match(head,/Rubik,'Segoe UI',system-ui,sans-serif/);
 assert.match(html,/document\.fonts\?\.addEventListener\?\.\('loadingdone',\(\)=>textWidths30\.clear\(\)\)/);
 assert.equal(html.split(url).length,2);
});
test('inline startup initiates original CSS without waiting on success or failure',()=>{
 const begin=html.indexOf("'use strict';"),end=html.indexOf('const canvas=document.getElementById',begin);assert.ok(begin>=0&&end>begin);
 const source=html.slice(begin,end)+';continuing();';
 for(const setup of ['pending','failed']){
  const inserted=[];let continued=false;
  const sandbox={continuing(){continued=true},document:{createElement(tag){assert.equal(tag,'link');return {setup}},head:{appendChild(link){inserted.push(link);}}}};
  vm.runInNewContext(source,sandbox);
  assert.equal(continued,true);
  assert.deepEqual(inserted,[{setup,rel:'stylesheet',href:url}]);
  assert.equal('onload' in inserted[0],false);assert.equal('onerror' in inserted[0],false);assert.equal('blocking' in inserted[0],false);
 }
});
