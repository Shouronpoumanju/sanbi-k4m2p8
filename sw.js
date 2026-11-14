const CACHE='sanbi-v3';
/* ws_pagever_v1：楽譜の画像は「番号＋版（?v=）」で覚える。版が変わったら新しく取りに行き、古い版は捨てる。
   前は番号だけで覚えていたので、差し替えた楽譜が端末に届かなかった。 */
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys()){if(k!==CACHE)await caches.delete(k)}await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(u.pathname.endsWith('/build.txt')||u.pathname.endsWith('/sw.js'))return;
  const isPage=/\/s\d{3}-\d+\.enc$/.test(u.pathname);
  const sameOrigin=(u.origin===self.location.origin);
  const isApiRaw=(u.hostname==='api.github.com'&&/\/(setlist|notes|history|edits)\.enc$/.test(u.pathname)&&(req.headers.get('Accept')||'').includes('raw'));
  const isData=sameOrigin&&/\/(data\.enc|keys\.json|setlist\.enc|notes\.enc|history\.enc|edits\.enc|pages\.enc|editor\.enc)$/.test(u.pathname);
  const isShell=sameOrigin&&(u.pathname.endsWith('/')||/\/(index\.html|manifest\.json|icon-\d+\.png)$/.test(u.pathname));
  if(isPage){
    const v=u.searchParams.get('v')||'';const key=u.origin+u.pathname+(v?'?v='+v:'');
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(key);if(hit)return hit;
      try{
        const r=await fetch(v?req:new Request(req.url,{cache:'no-cache'}));
        if(r.ok&&v){
          for(const k of await c.keys()){const ku=new URL(k.url);if(ku.pathname===u.pathname&&ku.search!==u.search)await c.delete(k)}
          c.put(key,r.clone());
        }
        return r;
      }catch(err){
        /* 電波が無いとき：新しい版が取れなければ、手元にある前の版を出す（何も出ないよりよい） */
        for(const k of await c.keys()){if(new URL(k.url).pathname===u.pathname){const old=await c.match(k);if(old)return old}}
        throw err;
      }
    }));return;
  }
  if(isApiRaw||isData||isShell){
    const key=u.origin+u.pathname;
    e.respondWith(caches.open(CACHE).then(async c=>{
      try{const r=await fetch(req);if(r.ok)c.put(key,r.clone());return r;}
      catch(err){const hit=await c.match(key);if(hit)return hit;throw err;}
    }));return;
  }
});
