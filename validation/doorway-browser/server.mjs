import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),bank=JSON.parse(fs.readFileSync('assets/audio/manifest.json','utf8'));
const allowed=new Set(['baseline.html','candidate.html',...bank.clips.map(c=>c.file)]);
const server=http.createServer(async(req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname.slice(1);
 if(!allowed.has(name)){res.writeHead(404);res.end();return;}
 const faults=fs.existsSync('server-faults.json')?JSON.parse(fs.readFileSync('server-faults.json','utf8')):{};
 const rule=faults[name];
 if(rule?.delayMs)await new Promise(r=>setTimeout(r,Math.min(rule.delayMs,20000)));
 if(rule?.status){res.writeHead(rule.status);res.end();return;}
 const data=fs.readFileSync(path.join(root,name));if(rule?.corrupt)data[data.length-1]^=1;
 fs.appendFileSync('requests.jsonl',JSON.stringify({time:Date.now(),name,fault:rule||null,bytes:data.length})+'\n');
 res.writeHead(200,{'Content-Type':name.endsWith('.flac')?'audio/flac':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(data);
});
server.listen(0,'127.0.0.1',()=>fs.writeFileSync('server-port.txt',String(server.address().port)));
