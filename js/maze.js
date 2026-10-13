/* Maze builder & escape: random spanning tree (DFS backtracker or Kruskal), BFS shortest path, playable */
/* ================= MAZE ================= */
(function(){
const MW=14, MH=9, NV=MW*MH;
const MS={algo:'dfs',seed:5,edges:[],order:[],shown:0,timer:null,me:0,steps:0,trail:[0],showPath:false,showBfs:false,showGraph:false};
const id=(x,y)=>y*MW+x, xy=i=>[i%MW,Math.floor(i/MW)];
function gridEdges(){ const e=[]; for(let y=0;y<MH;y++) for(let x=0;x<MW;x++){ if(x<MW-1) e.push([id(x,y),id(x+1,y)]); if(y<MH-1) e.push([id(x,y),id(x,y+1)]); } return e; }
/* randomised depth-first search: carve to a random unvisited neighbour, back up when stuck */
function dfsTree(r){ const vis=new Uint8Array(NV), st=[0], out=[]; vis[0]=1;
  while(st.length){ const u=st[st.length-1], [x,y]=xy(u);
    const nb=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<MW&&b<MH&&!vis[id(a,b)]).map(([a,b])=>id(a,b));
    if(!nb.length){ st.pop(); continue; } const v=nb[Math.floor(r()*nb.length)]; vis[v]=1; out.push([u,v]); st.push(v); }
  return out; }
/* Kruskal: shuffle all grid edges, keep an edge if it joins two different trees (union-find) */
function kruskalTree(r){ const e=gridEdges(); for(let i=e.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [e[i],e[j]]=[e[j],e[i]]; }
  const p=Array.from({length:NV},(_,i)=>i); const f=x=>p[x]===x?x:(p[x]=f(p[x])); const out=[];
  for(const [a,b] of e){ const ra=f(a),rb=f(b); if(ra!==rb){ p[ra]=rb; out.push([a,b]); } } return out; }
function adjOf(edges){ const a=Array.from({length:NV},()=>[]); edges.forEach(([u,v])=>{a[u].push(v);a[v].push(u);}); return a; }
function bfs(adj,s){ const d=new Array(NV).fill(-1), par=new Array(NV).fill(-1); d[s]=0; const q=[s];
  for(let k=0;k<q.length;k++) for(const v of adj[q[k]]) if(d[v]<0){ d[v]=d[q[k]]+1; par[v]=q[k]; q.push(v); } return {d,par}; }

let M;
function build(){ stop(); const r=rng(MS.seed); MS.order=MS.algo==='dfs'?dfsTree(r):kruskalTree(r); MS.shown=MS.order.length;
  MS.me=0; MS.steps=0; MS.trail=[0]; compute(); }
function compute(){ const edges=MS.order.slice(0,MS.shown); const adj=adjOf(edges);
  const {d,par}=bfs(adj,0); const goal=NV-1; const path=[]; if(d[goal]>=0) for(let v=goal;v!==-1;v=par[v]) path.unshift(v);
  M={edges,adj,d,path,stat:analyse(adj),open:new Set(edges.map(([a,b])=>a<b?a+'-'+b:b+'-'+a))}; }
function stop(){ if(MS.timer){clearInterval(MS.timer);MS.timer=null;} }
function animate(){ stop(); const r=rng(MS.seed); MS.order=MS.algo==='dfs'?dfsTree(r):kruskalTree(r); MS.shown=0; MS.me=0; MS.steps=0; MS.trail=[0];
  if(reduced){ MS.shown=MS.order.length; compute(); render(); return; }
  MS.timer=setInterval(()=>{ MS.shown=Math.min(MS.order.length,MS.shown+2); compute(); render(); if(MS.shown>=MS.order.length) stop(); },40); }
const isOpen=(a,b)=>M.open.has(a<b?a+'-'+b:b+'-'+a);
function move(dx,dy){ if(MS.timer) return; const [x,y]=xy(MS.me), nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=MW||ny>=MH) return;
  const v=id(nx,ny); if(!isOpen(MS.me,v)) return; MS.me=v; MS.steps++; MS.trail.push(v); render(); }

function render(){
  const Z=40, P=8, W=MW*Z+2*P, H=MH*Z+2*P, cx=i=>P+(i%MW+.5)*Z, cy=i=>P+(Math.floor(i/MW)+.5)*Z;
  const building=MS.shown<MS.order.length;
  const maxD=Math.max(1,...M.d);
  let o=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Maze, ${MW} by ${MH} rooms">`;
  o+=`<rect class="mz-bg" x="${P}" y="${P}" width="${MW*Z}" height="${MH*Z}"/>`;
  if(MS.showBfs&&!building) for(let i=0;i<NV;i++) if(M.d[i]>=0){ const [x,y]=xy(i);
    o+=`<rect class="mz-heat" x="${P+x*Z}" y="${P+y*Z}" width="${Z}" height="${Z}" fill-opacity="${(0.08+0.6*M.d[i]/maxD).toFixed(2)}"/>`; }
  o+=`<rect class="mz-goal" x="${P+(MW-1)*Z+6}" y="${P+(MH-1)*Z+6}" width="${Z-12}" height="${Z-12}" rx="6"/>`;
  // walls: draw every grid edge that is not an open passage
  let walls='';
  for(let y=0;y<MH;y++) for(let x=0;x<MW;x++){ const i=id(x,y);
    if(x<MW-1&&!isOpen(i,i+1)) walls+=`M${P+(x+1)*Z} ${P+y*Z}v${Z}`;
    if(y<MH-1&&!isOpen(i,i+MW)) walls+=`M${P+x*Z} ${P+(y+1)*Z}h${Z}`; }
  o+=`<path class="mz-wall" d="${walls}M${P} ${P}h${MW*Z}v${MH*Z}h${-MW*Z}Z"/>`;
  if(MS.showGraph||building){ M.edges.forEach(([a,b],k)=>{ const fresh=building&&k>=M.edges.length-2;
      o+=`<line class="mz-te${fresh?' fresh':''}" x1="${cx(a)}" y1="${cy(a)}" x2="${cx(b)}" y2="${cy(b)}"/>`; });
    for(let i=0;i<NV;i++) o+=`<circle class="mz-tn${M.stat.deg[i]===1?' leaf':''}" cx="${cx(i)}" cy="${cy(i)}" r="${M.stat.deg[i]?3.4:2.4}"/>`; }
  if(MS.showPath&&M.path.length) o+=`<polyline class="mz-path" points="${M.path.map(i=>cx(i)+','+cy(i)).join(' ')}"/>`;
  if(MS.trail.length>1) o+=`<polyline class="mz-trail" points="${MS.trail.map(i=>cx(i)+','+cy(i)).join(' ')}"/>`;
  o+=`<circle class="mz-start" cx="${cx(0)}" cy="${cy(0)}" r="7"/>`;
  o+=`<circle class="mz-me" cx="${cx(MS.me)}" cy="${cy(MS.me)}" r="11"/>`;
  $('#mzBoard').innerHTML=o+'</svg>';

  const s=M.stat, E=M.edges.length, leaves=s.deg.filter(d=>d===1).length, cyc=E-NV+s.comps;
  const won=MS.me===NV-1, best=M.path.length?M.path.length-1:null;
  $('#mzPill').innerHTML=building?pill('info',`Building… ${E} / ${NV-1} edges`):won?pill('good',`Escaped in ${MS.steps} steps`):pill('info','Find the exit');
  $('#mzStats').innerHTML=rowsHTML([
    ['Order |V| (rooms)','Unit 1',NV],
    ['Size |E| (passages)','Unit 1',E],
    ['Tree test: E = V − 1','Unit 2',E===NV-1?pill('good',`${E} = ${NV} − 1`):`${E} ≠ ${NV-1}`],
    ['Connected?','Unit 1',s.comps===1?pill('good','Yes'):pill('bad',`No · ${s.comps} components`)],
    ['Independent cycles (E − V + c)','Unit 2',cyc],
    ['Bridges','Unit 2',`${s.bridges}${E&&s.bridges===E?' (every edge)':''}`],
    ['Leaves = dead ends','Unit 2',leaves],
    ['Bipartite?','Unit 1',s.bip?pill('good','Yes'):pill('bad','No')],
    ['Shortest escape (BFS)','Unit 2',best===null?'–':best+' steps'],
    ['Your steps','',MS.steps],
  ]);
  $('#mzNote').innerHTML=building?`<b>${MS.algo==='dfs'?'Depth-first search':'Kruskal'}</b> is adding passages one at a time. Each new edge joins a new room, so the graph never gets a cycle.`
    :won?`<b>You escaped.</b> BFS's shortest route is ${best} steps; you took ${MS.steps}. ${MS.steps===best?'That is optimal: in a tree there is exactly one simple path between two rooms.':'In a tree there is exactly one simple path, so every extra step was a detour into a dead end and back.'}`
    :`Move with the arrow keys, WASD or the buttons. A perfect maze is a <b>spanning tree</b>: all ${NV} rooms connected by exactly ${NV-1} passages, so there is exactly one simple route to the exit.`;
  document.querySelectorAll('#mzAlgo button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.a===MS.algo));
  $('#mzPathChk').checked=MS.showPath; $('#mzBfsChk').checked=MS.showBfs; $('#mzGraphChk').checked=MS.showGraph;
}
$('#mzAlgo').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; MS.algo=b.dataset.a; build(); render(); });
$('#mzNew').addEventListener('click',()=>{ MS.seed=Math.floor(Math.random()*1e6); build(); render(); });
$('#mzWatch').addEventListener('click',animate);
$('#mzPathChk').addEventListener('change',e=>{ MS.showPath=e.target.checked; render(); });
$('#mzBfsChk').addEventListener('change',e=>{ MS.showBfs=e.target.checked; render(); });
$('#mzGraphChk').addEventListener('change',e=>{ MS.showGraph=e.target.checked; render(); });
document.querySelectorAll('#mzPad [data-d]').forEach(b=>b.addEventListener('click',()=>{ const [dx,dy]=b.dataset.d.split(',').map(Number); move(dx,dy); }));
const KEYS={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
document.addEventListener('keydown',e=>{ if($('#screen-maze').hidden||$('#screen-project').hidden) return; const k=KEYS[e.key]; if(!k) return;
  if(e.target.closest('select,textarea,input[type="text"]')) return; e.preventDefault(); move(k[0],k[1]); });
build(); render();
})();
