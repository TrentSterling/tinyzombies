import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const [beforePath,afterPath,outputPath]=process.argv.slice(2);
if(!beforePath||!afterPath)throw Error('Usage: node tools/check_audio_cache.mjs before.html after.html [report.json]');
const kinds=['rifle','shotgun','crit','explosion','chain','hit','death','growl','breath','step','debris','door','mass','beepLow','beepMid','beepHigh','tone230','tone180','tone440','tone220','tone660','tone880','tone540','tone720'];
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
function generate(path,sampleRate){
 const html=fs.readFileSync(path,'utf8'),start=html.indexOf('function audioClip9('),end=html.indexOf('function playAudio9(',start);
 if(start<0||end<0)throw Error('Audio factory not found');
 const context=vm.createContext({Float32Array,Map,Math,Number,Array});
 vm.runInContext(`const audioClips9=new Map();let allocations=0,bytes=0;const audio={sampleRate:${sampleRate},createBuffer(channels,length,rate){allocations++;bytes+=length*channels*4;const data=new Float32Array(length);return {duration:length/rate,getChannelData(){return data;}};}};${html.slice(start,end)};globalThis.inspect=(kind,variant)=>audioClip9(kind,variant).getChannelData(0);globalThis.stats=()=>({buffers:audioClips9.size,allocations,pcmBytes:bytes});`,context);
 const warmMatch=html.match(/const warm=(.+);/);if(!warmMatch)throw Error('Warm queue not found');
 const warm=vm.runInContext('('+warmMatch[1]+')',context);for(const [kind,variant] of warm)context.inspect(kind,variant);
 const warmStats={...context.stats(),queueEntries:warm.length};
 const clips={},unique={};
 for(const kind of kinds){unique[kind]=new Set();for(let variant=0;variant<6;variant++){const data=context.inspect(kind,variant),hash=sha(Buffer.from(data.buffer,data.byteOffset,data.byteLength));clips[kind+':'+variant]={sha256:hash,frames:data.length};unique[kind].add(hash);}}
 return {htmlSha256:sha(Buffer.from(html)),warm:warmStats,full:context.stats(),clips,uniqueHashes:Object.fromEntries(Object.entries(unique).map(([k,v])=>[k,v.size]))};
}
const result={method:'CPU-only extraction of the exact audioClip9 and warm-queue expressions, using Float32 AudioBuffer storage. All 24 sound kinds and six variants compared at 44.1 and 48 kHz. No browser, GPU or listening.',sampleRates:{}};
for(const sampleRate of [44100,48000]){
 const before=generate(beforePath,sampleRate),after=generate(afterPath,sampleRate);
 const same=Object.keys(before.clips).every(k=>before.clips[k].sha256===after.clips[k].sha256&&before.clips[k].frames===after.clips[k].frames);
 if(!same)throw Error('PCM sample identity failed at '+sampleRate);
 const saving={warmBuffers:before.warm.buffers-after.warm.buffers,warmPcmBytes:before.warm.pcmBytes-after.warm.pcmBytes,fullBuffers:before.full.buffers-after.full.buffers,fullPcmBytes:before.full.pcmBytes-after.full.pcmBytes};
 result.sampleRates[sampleRate]={before,after,allSamplesIdentical:same,saving};
 console.log(JSON.stringify({sampleRate,before:{warm:before.warm,full:before.full},after:{warm:after.warm,full:after.full},saving,allSamplesIdentical:same}));
}
if(outputPath)fs.writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n');
