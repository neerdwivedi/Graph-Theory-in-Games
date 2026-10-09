/* Press Start to Graph: shared graph algorithms (analysis, Tarjan cut-vertices, planarity bound, Warnsdorff tour, degree chart) */
const $=s=>document.querySelector(s);
const reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

const PAL=['--c-violet','--c-sky','--c-teal','--c-sun','--c-coral','--c-pink'];
/* ---------- generic graph analysis (undirected adjacency list) ---------- */
function analyse(adj){
  const V=adj.length; const deg=adj.map(a=>a.length);
  const E=deg.reduce((a,b)=>a+b,0)/2;
  const comp=new Int32Array(V).fill(-1), color=new Int8Array(V).fill(-1);
  let nc=0, bip=true;
  for(let s=0;s<V;s++){ if(comp[s]!==-1) continue; const q=[s]; comp[s]=nc; color[s]=0;
    for(let i=0;i<q.length;i++){ const u=q[i]; for(const v of adj[u]){ if(comp[v]===-1){comp[v]=nc;color[v]=1-color[u];q.push(v);} else if(color[v]===color[u]) bip=false; } }
    nc++; }
  let a=0; for(let i=0;i<V;i++) if(color[i]===0) a++;
  const degCount=new Map(); deg.forEach(d=>degCount.set(d,(degCount.get(d)||0)+1));
  const odd=deg.filter(d=>d%2).length;
  const nonIso=new Set(); for(let i=0;i<V;i++) if(deg[i]>0) nonIso.add(comp[i]);
  const edgeConnected=nonIso.size<=1;
  // Tarjan
  const disc=new Int32Array(V).fill(-1), low=new Int32Array(V); let t=0; const ap=new Set(); let bridges=0;
  function dfs(u,p){ disc[u]=low[u]=t++; let ch=0;
    for(const v of adj[u]){ if(disc[v]===-1){ ch++; dfs(v,u); low[u]=Math.min(low[u],low[v]);
        if(p!==-1&&low[v]>=disc[u]) ap.add(u); if(low[v]>disc[u]) bridges++; }
      else if(v!==p) low[u]=Math.min(low[u],disc[v]); }
    if(p===-1&&ch>1) ap.add(u); }
  for(let i=0;i<V;i++) if(disc[i]===-1) dfs(i,-1);
  let planar;
  if(V<3) planar={verdict:'planar',txt:'Planar (fewer than 3 vertices)'};
  else { const bound=bip?2*V-4:3*V-6, f=bip?'2V − 4':'3V − 6';
    planar = E>bound ? {verdict:'non',txt:`E = ${E} > ${f} = ${bound}`} : {verdict:'?',txt:`E = ${E} ≤ ${f} = ${bound}`}; }
  const minD=Math.min(...deg), maxD=Math.max(...deg);
  return {V,E,deg,degCount,minD,maxD,regular:minD===maxD,comps:nc,comp,bip,color,partA:a,partB:V-a,odd,
    euler:edgeConnected&&odd===0&&E>0, trail:edgeConnected&&odd===2, complement:V*(V-1)/2-E, planar, ap, bridges};
}

function rowsHTML(rows){ return rows.map(([k,unit,v])=>`<div class="row"><span class="k">${unit?`<small data-u="${unit.slice(-1)}">${unit}</small>`:''}${k}</span><span class="v">${v}</span></div>`).join(''); }
const pill=(cls,txt)=>`<span class="pill ${cls}">${txt}</span>`;

function propertyRows(s, notes){
  notes=notes||{};
  return [
    ['Order |V|','Unit 1',s.V],
    ['Size |E|','Unit 1',s.E],
    ['Degree range','Unit 1',`${s.minD} – ${s.maxD}`],
    ['Regular?','Unit 1',s.regular?pill('good',`Yes, ${s.minD}-regular`):pill('bad','No')],
    ['Bipartite?','Unit 1',s.bip?pill('good',`Yes · ${s.partA} / ${s.partB}`):pill('bad','No (odd cycle)')],
    ['Complement size','Unit 1',s.complement],
    ['Connected?','Unit 1',s.comps===1?pill('good','Yes'):pill('bad',`No · ${s.comps} components`)],
    ['Cut-vertices','Unit 2',s.ap.size],
    ['Bridges','Unit 2',s.bridges],
    ['Odd-degree vertices','Unit 2',s.odd],
    ['Eulerian circuit?','Unit 2',s.euler?pill('good','Yes'):pill('bad',s.trail?'No · Euler trail exists':'No')],
    ['Planar?','Unit 3',s.planar.verdict==='non'?pill('bad','Non-planar')+`<div style="margin-top:3px">${s.planar.txt}</div>`
        :s.planar.verdict==='planar'?pill('good','Planar'):pill('info','Bound holds')+`<div style="margin-top:3px">${s.planar.txt} · inconclusive</div>`],
  ];
}

function degChart(el, degCount){
  const ks=[...degCount.keys()].sort((a,b)=>a-b); const maxC=Math.max(...degCount.values());
  const W=420,H=170,pl=10,pb=24,pt=18; const bw=Math.min(46,(W-pl*2)/ks.length*0.7); const step=(W-pl*2)/ks.length;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Degree distribution">`;
  s+=`<line x1="${pl}" x2="${W-pl}" y1="${H-pb}" y2="${H-pb}" stroke="var(--line)"/>`;
  ks.forEach((k,i)=>{ const c=degCount.get(k); const h=(H-pb-pt)*c/maxC; const x=pl+step*i+step/2;
    s+=`<rect class="bar" style="fill:var(${PAL[i%PAL.length]})" x="${x-bw/2}" y="${H-pb-h}" width="${bw}" height="${h}" rx="4"/>`;
    s+=`<text class="bar-v" x="${x}" y="${H-pb-h-5}">${c}</text><text class="ax" x="${x}" y="${H-7}">deg ${k}</text>`; });
  el.innerHTML=s+'</svg>';
}

/* ---------- Hamiltonian path (Warnsdorff + random restarts) ---------- */
function hamPath(adj,start,tries){
  const V=adj.length;
  for(let t=0;t<tries;t++){ const vis=new Uint8Array(V); const path=[start]; vis[start]=1; let u=start;
    while(path.length<V){ let bd=1e9,c=[];
      for(const v of adj[u]) if(!vis[v]){ let d=0; for(const w of adj[v]) if(!vis[w]) d++; if(d<bd){bd=d;c=[v];} else if(d===bd) c.push(v); }
      if(!c.length) break; const v=t===0?c[0]:c[Math.floor(Math.random()*c.length)]; vis[v]=1; path.push(v); u=v; }
    if(path.length===V) return path; }
  return null;
}
