const CACHE='sanbi-v1';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(u.pathname.endsWith('/build.txt'))return;
  const isPage=/\/s\d{3}-\d+\.enc$/.test(u.pathname);
  const sameOrigin=(u.origin===self.location.origin);
  const isApiRaw=(u.hostname==='api.github.com'&&/\/(setlist|notes|history)\.enc$/.test(u.pathname)&&(req.headers.get('Accept')||'').includes('raw'));
  const isData=sameOrigin&&/\/(data\.enc|keys\.json|setlist\.enc|notes\.enc|history\.enc)$/.test(u.pathname);
  const isShell=sameOrigin&&(u.pathname.endsWith('/')||/\/(index\.html|manifest\.json|icon-\d+\.png)$/.test(u.pathname));
  const key=u.origin+u.pathname;
  if(isPage){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(key);if(hit)return hit;
      const r=await fetch(req);if(r.ok)c.put(key,r.clone());return r;
    }));return;
  }
  if(isApiRaw||isData||isShell){
    e.respondWith(caches.open(CACHE).then(async c=>{
      try{const r=await fetch(req);if(r.ok)c.put(key,r.clone());return r;}
      catch(err){const hit=await c.match(key);if(hit)return hit;throw err;}
    }));return;
  }
});
