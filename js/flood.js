/* Flood-It: connected components, region-adjacency graph, eccentricity lower bound, greedy hint */
/* ================= FLOOD-IT ================= */
(function(){
const N=10, K=5, COLS=['--fl-0','--fl-1','--fl-2','--fl-3','--fl-4'];
const FS={seed:11,grid:null,start:null,moves:0,view:'grid',hint:-1,history:[]};
function make(seed){ const r=rng(seed); return Array.from({length:N*N},()=>Math.floor(r()*K)); }
const nb=i=>{ const r=Math.floor(i/N),c=i%N, o=[]; if(r>0)o.push(i-N); if(r<N-1)o.push(i+N); if(c>0)o.push(i-1); if(c<N-1)o.push(i+1); return o; };
/* label every cell with its same-colour connected component (BFS) */
function regions(g){
  const lab=new Int32Array(N*N).fill(-1); const reg=[];
  for(let s=0;s<N*N;s++){ if(lab[s]>=0) continue; const id=reg.length, q=[s]; lab[s]=id;
    for(let k=0;k<q.length;k++) for(const j of nb(q[k])) if(lab[j]<0&&g[j]===g[s]){ lab[j]=id; q.push(j); }
    reg.push({id,color:g[s],cells:q}); }
  const adj=reg.map(()=>new Set());
  for(let i=0;i<N*N;i++) for(const j of nb(i)) if(lab[i]!==lab[j]) adj[lab[i]].add(lab[j]);
  return {lab,reg,adj:adj.map(s=>[...s])};
}
function bfsDist(adj,s){ const d=new Array(adj.length).fill(-1); d[s]=0; const q=[s];
  for(let k=0;k<q.length;k++) for(const v of adj[q[k]]) if(d[v]<0){ d[v]=d[q[k]]+1; q.push(v); } return d; }
function flood(g,c){ const R=regions(g); const me=R.lab[0]; const out=g.slice(); R.reg[me].cells.forEach(i=>out[i]=c); return out; }
function gain(g,c){ if(g[0]===c) return -1; const before=regions(g).reg[0].cells.length; const after=regions(flood(g,c)); return after.reg[after.lab[0]].cells.length-before; }
function greedyBest(g){ let best=-1,bg=-1; for(let c=0;c<K;c++){ const x=gain(g,c); if(x>bg){bg=x;best=c;} } return best; }
function greedySolve(g){ let n=0; while(regions(g).reg.length>1&&n<200){ g=flood(g,greedyBest(g)); n++; } return n; }

function newGame(seed){ FS.seed=seed; FS.grid=make(seed); FS.start=FS.grid.slice(); FS.moves=0; FS.hint=-1; FS.history=[];
  FS.par=greedySolve(FS.grid.slice()); }
function pick(c){ if(c===FS.grid[0]) return; FS.history.push(FS.grid); FS.grid=flood(FS.grid,c); FS.moves++; FS.hint=-1; render(); }

function render(){
  const g=FS.grid, R=regions(g), me=R.lab[0], dist=bfsDist(R.adj,me), ecc=Math.max(...dist);
  const mine=R.reg[me].cells.length, done=R.reg.length===1;
  const Z=34, S=N*Z; let o=`<svg viewBox="0 0 ${S} ${S}" role="img" aria-label="Flood-It board">`;
  if(FS.view==='grid'){
    for(let i=0;i<N*N;i++){ const r=Math.floor(i/N),c=i%N;
      o+=`<rect x="${c*Z}" y="${r*Z}" width="${Z}" height="${Z}" style="fill:var(${COLS[g[i]]})"${R.lab[i]===me?' class="fl-mine"':''}/>`; }
    // outline the player's region
    for(const i of R.reg[me].cells){ const r=Math.floor(i/N),c=i%N, x=c*Z,y=r*Z;
      if(r===0||R.lab[i-N]!==me) o+=`<line class="fl-edge" x1="${x}" y1="${y}" x2="${x+Z}" y2="${y}"/>`;
      if(r===N-1||R.lab[i+N]!==me) o+=`<line class="fl-edge" x1="${x}" y1="${y+Z}" x2="${x+Z}" y2="${y+Z}"/>`;
      if(c===0||R.lab[i-1]!==me) o+=`<line class="fl-edge" x1="${x}" y1="${y}" x2="${x}" y2="${y+Z}"/>`;
      if(c===N-1||R.lab[i+1]!==me) o+=`<line class="fl-edge" x1="${x+Z}" y1="${y}" x2="${x+Z}" y2="${y+Z}"/>`; }
  } else {
    const cen=R.reg.map(rg=>{ let x=0,y=0; rg.cells.forEach(i=>{x+=i%N;y+=Math.floor(i/N);}); return [(x/rg.cells.length+.5)*Z,(y/rg.cells.length+.5)*Z]; });
    o+=`<rect width="${S}" height="${S}" class="fl-gbg"/>`;
    R.adj.forEach((a,u)=>a.forEach(v=>{ if(u<v){ const on=u===me||v===me;
      o+=`<line class="fl-ge${on?' on':''}" x1="${cen[u][0]}" y1="${cen[u][1]}" x2="${cen[v][0]}" y2="${cen[v][1]}"/>`; } }));
    R.reg.forEach((rg,u)=>{ const r=Math.min(15,4+Math.sqrt(rg.cells.length)*2.4);
      o+=`<circle cx="${cen[u][0]}" cy="${cen[u][1]}" r="${r}" style="fill:var(${COLS[rg.color]})" class="fl-gn${u===me?' me':''}"/>`;
      o+=`<text class="fl-gd" x="${cen[u][0]}" y="${cen[u][1]}">${dist[u]}</text>`; });
  }
  $('#flBoard').innerHTML=o+'</svg>';
  $('#flSw').innerHTML=COLS.map((c,i)=>`<button class="fl-sw${FS.hint===i?' hint':''}" style="--sc:var(${c})" data-c="${i}" aria-label="Colour ${i+1}" ${i===g[0]||done?'disabled':''}></button>`).join('');
  const nV=R.reg.length, nE=R.adj.reduce((a,x)=>a+x.length,0)/2;
  $('#flMoves').textContent=FS.moves; $('#flSize').textContent=mine+' / '+N*N; $('#flLeft').textContent=nV;
  $('#flPill').innerHTML=done?pill('good',FS.moves<=FS.par?`Solved in ${FS.moves} · beat greedy`:`Solved in ${FS.moves}`):pill('info',`Greedy needs ${FS.par}`);
  $('#flStats').innerHTML=rowsHTML([
    ['Grid graph |V| (cells)','Unit 1',N*N],['Grid graph |E|','Unit 1',2*N*(N-1)],
    ['Same-colour components','Unit 1',nV],
    ['Region graph |V| , |E|','Unit 1',`${nV} , ${nE}`],
    ['Region graph connected?','Unit 1',pill('good','Always')],
    ['Your region\'s degree','Unit 1',R.adj[me].length],
    ['Eccentricity of your region','Unit 2',ecc],
    ['Lower bound on moves left','Unit 2',`≥ ${ecc}`],
  ]);
  $('#flNote').innerHTML=done?`<b>Board flooded.</b> The region graph has shrunk to a single vertex. Greedy took ${FS.par} moves on this board; you took ${FS.moves}.`
    :FS.hint>=0?`<b>Greedy hint:</b> this colour absorbs the most cells right now (+${gain(g,FS.hint)}). Greedy is a heuristic, not always optimal.`
    :`Each move merges your region with all neighbouring regions of the chosen colour, so its distance to every region drops by at most 1. That is why the <b>eccentricity</b> (${ecc}) is a lower bound on the moves you still need.`;
  document.querySelectorAll('#flView button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===FS.view));
  $('#flUndo').disabled=!FS.history.length;
}
$('#flSw').addEventListener('click',e=>{ const b=e.target.closest('[data-c]'); if(b&&!b.disabled) pick(+b.dataset.c); });
$('#flView').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; FS.view=b.dataset.v; render(); });
$('#flNew').addEventListener('click',()=>{ newGame(Math.floor(Math.random()*1e6)); render(); });
$('#flRestart').addEventListener('click',()=>{ FS.grid=FS.start.slice(); FS.moves=0; FS.hint=-1; FS.history=[]; render(); });
$('#flUndo').addEventListener('click',()=>{ if(!FS.history.length) return; FS.grid=FS.history.pop(); FS.moves--; FS.hint=-1; render(); });
$('#flHint').addEventListener('click',()=>{ FS.hint=greedyBest(FS.grid); render(); });
newGame(FS.seed); render();
})();
