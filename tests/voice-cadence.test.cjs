const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(new URL('../index.html','file://'+__filename),'utf8');
const section=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i);return html.slice(i,j);};
const code=[
 section('const voiceSlug70=', '// Opt-in assets'),
 section('function pickVoiceTake101(', 'function preloadVoices70('),
 section('// Optional decoded callout only;', '// Synthesised layers'),
 section('function updateEquipmentAudio12(', 'function audioHash9('),
 section('function pumpNpcVoice103(', 'function neighborsHUD30('),
 section('const crispy105=', 'const toast67='),
].join('\n');
function fixture(){
 const event=[],speech=[],mechanical=[],playback=[],sources=[];
 const c={
  time:0,clock:0,performance:{now:()=>c.clock*1000},SANDBOX25:true,audioAllowed9:()=>c.enabled,
  enabled:true,audioMix9:{},speechSynthesis:{speaking:false,pending:false,cancel(){playback.push('cancel speech');this.pending=this.speaking=false;},getVoices:()=>[],speak(u){playback.push('speak '+u.line);speech.push(u.line);this.speaking=true;this.ends=c.clock+1;}},
  SpeechSynthesisUtterance:function(line){this.line=line},settings:{started:true,paused:false},runEpoch16:0,world:{},
  voice65:{ok:true,lines:0},voiceFiles70:{buf:new Map(),src:null,until:-9,variants:new Map(),lastTake:new Map(),lastWording:new Map(),takeCycle:new Map()},
  debugView101:{enabled:true},recordAudioDebug101:e=>event.push(e),
  npcVoice103:{pending:[],nextAt:0},npcBlock103:()=>'',skipNpc103(){},syncNpcEpoch103(){},preloadVoices70(){},
  audio:{createBufferSource:()=>{const s={connect(){},disconnect(){},
   start(){s.active=true;s.ends=c.clock+s.buffer.duration;playback.push('start recorded');},
   stop(){s.active=false;playback.push('stop recorded');},
  };sources.push(s);return s;},createGain:()=>({gain:{},connect(){},disconnect(){}})},
  playerValues:[0,0,0],L12:{events:0,edges:0},counters:Array(128).fill(0),
  audioShot12:0,audioReload12:0,audioShove12:0,audioReloadStart102:0,playAudio9:(kind)=>mechanical.push(kind),
 };
 for(const name of ['reloading','extra_crispy','say_cheese','say_cheese_v2'])c.voiceFiles70.buf.set(name,{duration:1});
 c.voiceFiles70.variants.set('say_cheese',[{id:'say_cheese_v2',text:'smile for the camera'}]);
 vm.createContext(c);vm.runInContext(code,c);
 return {c,event,speech,mechanical,playback,sources,at(t,expr,audioClock=t){
  c.time=c.clock=t;
  for(const s of sources)if(s.active&&s.ends<=audioClock){s.active=false;s.onended?.();}
  if(c.speechSynthesis.ends<=audioClock)c.speechSynthesis.speaking=false;
  return vm.runInContext(expr,c);
 }};
}
test('rapid auto-shotgun cycles speak once while all mechanical cues play',()=>{
 const f=fixture();
 for(let i=1;i<=24;i++){f.c.counters[102]=i;f.c.playerValues[1]=i;f.at(i,'updateEquipmentAudio12()');}
 assert.equal(f.c.voice65.lines,1);
 assert.equal(f.mechanical.filter(k=>k==='ratchet').length,24);
 f.c.counters[102]++;f.at(26,'updateEquipmentAudio12()');
 assert.equal(f.c.voice65.lines,2);
});
test('alternating recorded and synthesized lines cannot bypass per-line or global cooldown',()=>{
 const f=fixture();assert.equal(f.at(0,"announce65('Say cheese!')"),true);
 assert.equal(f.at(1,"announce65('New joke!')"),false);
 assert.equal(f.at(3,"announce65('New joke!')"),true);
 assert.deepEqual(f.speech,['New joke!']);
 assert.equal(f.at(6,"announce65('SAY CHEESE.')"),false);
 assert.equal(f.at(25,"announce65('Say cheese!')"),true);
 assert.equal(f.event.at(-1).take,'say_cheese_v2');
});
test('urgent distinct lines cut in, but the same urgent warning cannot repeat',()=>{
 const f=fixture();assert.equal(f.at(0,"announce65('Say cheese!')"),true);
 assert.equal(f.at(.2,"announce65('Boss warning!',true)"),true);
 assert.equal(f.at(1,"announce65('BOSS WARNING!',true)"),false);
 assert.equal(f.at(1.1,"announce65('Extraction open!',true)"),true);
 assert.deepEqual(f.speech,['Boss warning!','Extraction open!']);
});
test('same neighbor group is spaced while distinct rescue outcomes are retained',()=>{
 const f=fixture();
 assert.equal(f.at(0,"announce65('Marv is safe!',false,'neighbor:3')"),true);
 assert.equal(f.at(4,"announce65('Linda is safe!',false,'neighbor:3')"),false);
 assert.equal(f.at(5,"announce65('Brenda got eaten!',false,'neighbor:4')"),true);
 assert.equal(f.at(8,"announce65('Linda is safe!',false,'neighbor:3')"),true);
});
test('queued neighbor absorbs ordinary spacing without cutting active speech',()=>{
 const f=fixture();
 f.at(0,"announce65('Say cheese!')");
 f.c.npcVoice103.pending.push({line:'Marv is safe!',state:3,expires:8});
 f.at(1.1,'pumpNpcVoice103()');assert.equal(f.c.npcVoice103.pending.length,1);
 f.at(3,'pumpNpcVoice103()');assert.deepEqual(f.speech,['Marv is safe!']);
});
test('muted reload events are consumed; cosmetic streak cue shares the same gate',()=>{
 const f=fixture();f.c.enabled=false;f.c.counters[102]=1;f.at(1,'updateEquipmentAudio12()');
 f.c.enabled=true;f.at(2,'updateEquipmentAudio12()');assert.equal(f.c.voice65.lines,0);
 f.c.counters[61]=3;f.at(3,'updateCrispy105()');assert.equal(f.c.voice65.lines,1);
 f.c.counters[102]=2;f.at(4,'updateEquipmentAudio12()');assert.equal(f.c.voice65.lines,1);
 f.c.counters[61]=6;f.at(12,'updateCrispy105()');assert.equal(f.c.voice65.lines,1);
});

test('urgent missing clip stops a recording before synthesized speech starts',()=>{
 const f=fixture();
 assert.equal(f.at(0,"announce65('Say cheese!')"),true);
 assert.equal(f.at(.2,"announce65('Boss warning!',true)"),true);
 assert.deepEqual(f.playback,['start recorded','stop recorded','speak Boss warning!']);
 assert.equal(f.sources[0].active,false);
 assert.equal(f.at(.3,"announce65('BOSS WARNING',true)"),false);
});
test('urgent recording cancels speech before playback, and stale ended events cannot clear a newer source',()=>{
 const f=fixture();
 assert.equal(f.at(0,"announce65('Boss warning!',true)"),true);
 assert.equal(f.at(.2,"announce65('Say cheese!',true)"),true);
 assert.deepEqual(f.playback,['speak Boss warning!','cancel speech','start recorded']);
 assert.equal(f.at(.3,'playVoice70("Extra crispy!",true)'), 'extra_crispy');
 assert.deepEqual(f.playback.slice(-2),['stop recorded','start recorded']);
 f.sources[0].onended?.();
 assert.equal(f.c.voiceFiles70.src,f.sources[1]);
 f.at(1.4,'0');
 assert.equal(f.c.voiceFiles70.src,null);
});
test('when game time advances past a still-playing clip, ordinary chatter does not stack',()=>{
 const f=fixture();
 assert.equal(f.at(0,"announce65('Say cheese!')"),true);
 assert.equal(f.at(4,"announce65('New joke!')",.5),false);
 assert.equal(f.at(5,"announce65('New joke!')"),true);
});
