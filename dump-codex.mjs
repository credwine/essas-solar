// Dump ALL generated images from the Antigravity Codex chat webview via CDP — no aspect filter.
import { writeFileSync, mkdirSync } from 'node:fs';
const PORT = 9222;
const outDir = process.argv[2] || '.';
mkdirSync(outDir, { recursive: true });
const listURL = `http://127.0.0.1:${PORT}/json/list`;

function open(target){
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let idc=0; const pend=new Map();
  const send=(m,p={})=>new Promise((res,rej)=>{const id=++idc;pend.set(id,{res,rej});ws.send(JSON.stringify({id,method:m,params:p}));});
  ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id&&pend.has(m.id)){const{res,rej}=pend.get(m.id);pend.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result);}});
  const ready=new Promise((res,rej)=>{ws.addEventListener('open',res);ws.addEventListener('error',rej);});
  return { ws, send, ready };
}
const evalOn = async (target, expr) => { const c=open(target); await c.ready; await c.send('Runtime.enable'); const r=await c.send('Runtime.evaluate',{expression:expr,returnByValue:true}); c.ws.close(); return r.result?.value; };

const detect = `(()=>{const af=document.getElementById('active-frame');if(!af||!af.contentDocument)return 'no';const d=af.contentDocument;const pm=d.querySelector('.ProseMirror');const txt=(d.body?.innerText||'');const codexish=/Recent tasks|Ask for follow-up|generated-images|Codex|No tasks|No chats in progress|chats in progress|What do you want to work on/i.test(txt);return pm&&codexish?'CODEX':(pm?'PM':'no');})()`;
async function findCodex(){
  const list = await (await fetch(listURL)).json();
  const iframes = list.filter(t => t.type === 'iframe');
  let pm=null;
  for (const t of iframes) { const v=await evalOn(t, detect).catch(()=>'no'); if (v==='CODEX') return t; if (v==='PM'&&!pm) pm=t; }
  return pm;
}
let codex=null;
for (let a=0; a<6 && !codex; a++){ codex=await findCodex(); if(!codex) await new Promise(r=>setTimeout(r,2000)); }
if (!codex){ console.error('Codex panel not found'); process.exit(4); }

const grab = `(()=>{const d=document.getElementById('active-frame').contentDocument;
  const imgs=[...d.querySelectorAll('img')].filter(i=>i.src.startsWith('data:image')&&i.src.length>20000);
  return imgs.map(i=>({w:i.naturalWidth,h:i.naturalHeight,src:i.src}));})()`;
const c=open(codex); await c.ready; await c.send('Runtime.enable');
const imgs=(await c.send('Runtime.evaluate',{expression:grab,returnByValue:true})).result.value||[];
c.ws.close();
console.log('found', imgs.length, 'images');
let n=0;
for (const im of imgs){
  const ext=(im.src.slice(5,im.src.indexOf(';'))||'image/png').split('/')[1]||'png';
  const b64=im.src.slice(im.src.indexOf(',')+1);
  const buf=Buffer.from(b64,'base64');
  const path=`${outDir}/codex-${String(++n).padStart(2,'0')}-${im.w}x${im.h}.${ext}`;
  writeFileSync(path, buf);
  console.log('saved', path, buf.length, 'bytes');
}
