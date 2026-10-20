'use strict';
// Recorded voices: every manifest line (assets/audio/voice/lines.csv) maps to the slug the game computes for the spoken string; a decoded
// file plays through the mix (and cuts speech), a missing one falls back to speech synthesis; index.json is a JSON array of ids.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutVoicefiles89}=require('./voicefiles89.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html'),root=path.join(path.dirname(file),'assets/audio/voice');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const csv=fs.readFileSync(path.join(root,'lines.csv'),'utf8').trim().split('\n').slice(1).map(l=>l.split(',')[0]);
check('manifest ids are unique slugs, and the game strings slug onto them',()=>{const h=loadHost(file,{plain:true});assert.equal(new Set(csv).size,csv.length);
 const spoken=['This is Radio Pleasant Acres. The H O A says stay indoors. The H O A is a zombie. Go outside.','They broke through the hedges! Here they come!','H O A VIOLATION!','Warning! The H. O. A. President has arrived!','Level 2. NIGHT OF THE LIVING HOA','BBQ Dad got eaten!','A neighbor joined the squad!','Radio Pleasant Acres, signing off. You saved the street.'];
 for(const s of spoken)assert(csv.includes(h.json('voiceSlug70('+JSON.stringify(s)+')')),s);
 for(const r of h.json('QUESTS65.map(q=>q.radio).filter(Boolean)'))assert(csv.includes(h.json('voiceSlug70('+JSON.stringify(r)+')')),r);
 for(const c of h.json('COMBO_LINES69.filter(Boolean)'))assert(csv.includes(h.json('voiceSlug70('+JSON.stringify(c)+')')),c);
 const idx=JSON.parse(fs.readFileSync(path.join(root,'index.json'),'utf8'));assert(Array.isArray(idx));for(const id of idx){assert(csv.includes(id),id);assert(fs.existsSync(path.join(root,id+'.ogg')),id+'.ogg');}return {lines:csv.length,files:idx.length};});
const host=()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;window.__played=[];window.__spoke=[];audioAllowed9=()=>true;audio={createBufferSource:()=>({connect(){},start(){__played.push(this.buffer.tag)},stop(){}}),createGain:()=>({gain:{value:0},connect(){}})};audioMix9={};voice65.ok=true;window.speechSynthesis={speaking:false,cancel(){},getVoices:()=>[],speak:u=>__spoke.push(u.text)};window.SpeechSynthesisUtterance=function(t){this.text=t};voiceFiles70.started=true;time=10');return h;};
check('a decoded file plays; a missing one speaks',()=>{const h=host();h.run('voiceFiles70.buf.set("h_o_a_violation",{duration:1.2,tag:"hoa"});announce65("H O A VIOLATION!");time=20;announce65("Boing!")');assert.deepEqual(h.json('__played'),['hoa']);assert.deepEqual(h.json('__spoke'),['Boing!']);});
check('a playing file blocks normal lines and yields to priority ones',()=>{const h=host();h.run('voiceFiles70.buf.set("boing",{duration:3,tag:"b"});voiceFiles70.buf.set("extra_crispy",{duration:1,tag:"c"});announce65("Boing!");time=10.5;announce65("Extra crispy!");time=11;announce65("Extra crispy!",true)');assert.deepEqual(h.json('__played'),['b','c']);assert.deepEqual(h.json('__spoke'),[]);});
check('exact inverse restores the immutable pre-voice runtime',()=>{assert.equal(sha(withoutVoicefiles89(html)),delta.parentSha256);});
const report={method:'CPU host with a mocked AudioContext and speechSynthesis; manifest parity against the game strings.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
