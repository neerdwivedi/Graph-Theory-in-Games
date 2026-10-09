/* Subway runner track graph: run counting, must-pass points, fewest-switch route */
/* ================= SUBWAY ================= */
const L=3, C=20; const SS={level:'random',seed:7,grid:null,showEdges:true,showMust:true,showCut:false,run:null,timer:null};
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function genLevel(kind,seed){
  const g=Array.from({length:C},()=>[false,false,false]);
  if(kind==='open') return g;
  if(kind==='choke'){ [5,12].forEach(c=>{g[c][0]=true;g[c][2]=true;}); [3,9,16].forEach(c=>g[c][1]=true); g[8][0]=true; g[15][2]=true; return g; }
  const r=rng(seed);
  for(let c=2;c<C-1;c++){ const x=r(); if(x<0.42) g[c][Math.floor(r()*3)]=true;
    else if(x<0.55){ const keep=Math.floor(r()*3); for(let l=0;l<3;l++) if(l!==keep) g[c][l]=true; } }
  return g;
}
let sub;
function subAnalyse(){
  const g=SS.grid, idx=new Map(), verts=[];
  for(let c=0;c<C;c++) for(let l=0;l<L;l++) if(!g[c][l]){ idx.set(c*L+l,verts.length); verts.push([c,l]); }
  const adj=verts.map(()=>[]), dedges=[];
  verts.forEach(([c,l],a)=>{ if(c===C-1) return; for(let d=-1;d<=1;d++){ const l2=l+d; if(l2<0||l2>=L||g[c+1][l2]) continue;
      const b=idx.get((c+1)*L+l2); adj[a].push(b); adj[b].push(a); dedges.push([a,b,d!==0]); } });
  const V=verts.length, start=idx.get(1); // (c0, middle lane)
  const f=new Array(V).fill(0), gg=new Array(V).fill(0); f[start]=1;
  for(const [a,b] of dedges) f[b]+=f[a];
  verts.forEach(([c],i)=>{ if(c===C-1) gg[i]=1; });
  for(let k=dedges.length-1;k>=0;k--){ const [a,b]=dedges[k]; gg[a]+=gg[b]; }
  const total=gg[start];
  const must=[]; if(total>0) for(let i=0;i<V;i++) if(i!==start && f[i]*gg[i]===total) must.push(i);
  const cost=new Array(V).fill(Infinity), par=new Array(V).fill(-1); cost[start]=0;
  for(const [a,b,sw] of dedges){ if(cost[a]===Infinity) continue; const w=cost[a]+(sw?1:0); if(w<cost[b]){cost[b]=w;par[b]=a;} }
  let best=-1; verts.forEach(([c],i)=>{ if(c===C-1 && cost[i]<Infinity && (best<0||cost[i]<cost[best])) best=i; });
  const path=[]; if(best>=0){ for(let v=best;v!==-1;v=par[v]) path.unshift(v); }
  sub={verts,idx,adj,dedges,start,total,must,path,switches:best>=0?cost[best]:null,stat:analyse(adj)};
}

function star(x,y,R,r){ const p=[]; for(let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, rr=k%2?r:R; p.push((x+rr*Math.cos(a)).toFixed(1)+','+(y+rr*Math.sin(a)).toFixed(1)); } return p.join(' '); }
const TX=48,TY=58,ML=46,MT=34;
const nx_=c=>ML+c*TX+TX/2, ny_=l=>MT+l*TY+TY/2;
function drawTrack(){
  const W=ML+C*TX+24, H=MT+L*TY+34, g=SS.grid, s=sub; const onPath=new Set(s.path);
  let o=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Subway runner track graph">`;
  o+=`<defs><pattern id="chk" width="16" height="16" patternUnits="userSpaceOnUse"><rect class="chk-a" width="8" height="8"/><rect class="chk-a" x="8" y="8" width="8" height="8"/></pattern></defs>`;
  for(let l=0;l<L;l++){ o+=`<rect style="fill:var(--lane${l})" x="${ML}" y="${MT+l*TY+6}" width="${C*TX}" height="${TY-12}" rx="8"/>`; }
  o+=`<rect class="finish" x="${ML+(C-1)*TX+2}" y="${MT}" width="${TX-4}" height="${L*TY}" rx="6"/><rect fill="url(#chk)" x="${ML+(C-1)*TX+2}" y="${MT}" width="${TX-4}" height="${L*TY}" rx="6"/>`;
  ['Left','Mid','Right'].forEach((t,l)=>o+=`<text class="t-lab" x="6" y="${ny_(l)+4}">${t}</text>`);
  for(let c=0;c<C;c+=5) o+=`<text class="t-lab" x="${nx_(c)-8}" y="${H-10}">${c*10} m</text>`;
  o+=`<path class="flag-f" d="M${nx_(C-1)-30} ${MT-6} v-17 l11 4.5 -11 4.5Z"/><text class="t-lab" x="${nx_(C-1)-17}" y="${MT-10}">FINISH</text>`+
     `<path class="flag" d="M${nx_(0)-22} ${MT-6} v-17 l11 4.5 -11 4.5Z"/><text class="t-start" x="${nx_(0)-9}" y="${MT-10}">START</text>`;
  const pathEdge=new Set(); for(let k=0;k+1<s.path.length;k++) pathEdge.add(s.path[k]+'-'+s.path[k+1]);
  if(SS.showEdges) for(const [a,b,sw] of s.dedges){ const [c1,l1]=s.verts[a],[c2,l2]=s.verts[b]; if(pathEdge.has(a+'-'+b)) continue;
    o+=`<line class="${sw?'e-sw':'e-fwd'}" x1="${nx_(c1)}" y1="${ny_(l1)}" x2="${nx_(c2)}" y2="${ny_(l2)}"/>`; }
  for(let k=0;k+1<s.path.length;k++){ const [c1,l1]=s.verts[s.path[k]],[c2,l2]=s.verts[s.path[k+1]];
    o+=`<line class="e-path" x1="${nx_(c1)}" y1="${ny_(l1)}" x2="${nx_(c2)}" y2="${ny_(l2)}"/>`; }
  for(let c=0;c<C;c++) for(let l=0;l<L;l++) if(g[c][l]){ const x=ML+c*TX+3,y=MT+l*TY+8,w=TX-6,h=TY-16;
    o+=`<rect class="trainr${(c+l)%2?' b':''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><rect class="train-nose" x="${x}" y="${y+h-10}" width="${w}" height="10" rx="5"/>`+
       `<rect class="train-win" x="${x+5}" y="${y+6}" width="${w/2-7}" height="11" rx="3"/><rect class="train-win" x="${x+w/2+2}" y="${y+6}" width="${w/2-7}" height="11" rx="3"/>`+
       `<circle class="train-light" cx="${x+9}" cy="${y+h-5}" r="2.6"/><circle class="train-light" cx="${x+w-9}" cy="${y+h-5}" r="2.6"/>`; }
  const mustSet=new Set(SS.showMust?s.must:[]);
  s.verts.forEach(([c,l],i)=>{ const x=nx_(c),y=ny_(l);
    const isCut=SS.showCut && s.stat.ap.has(i);
    if(isCut) o+=`<rect class="cutv" x="${x-8}" y="${y-8}" width="16" height="16" transform="rotate(45 ${x} ${y})"/>`;
    if(mustSet.has(i)) o+=`<polygon class="must" points="${star(x,y,isCut?14:11.5,isCut?6:4.8)}"/>`;
    else if(!isCut) o+=`<circle class="node${onPath.has(i)?' on-path':''}" cx="${x}" cy="${y}" r="${onPath.has(i)?5.5:4.5}"/>`; });
  const [sc,sl]=s.verts[s.start];
  o+=`<g class="runner" id="runner" transform="translate(${nx_(sc)} ${ny_(sl)})"><circle class="rb" r="14"/><circle class="rh" cx="2.5" cy="-7" r="2.8"/><path class="rf" d="M1.5 -3.5 L-1 3 M-1 3 L-5.5 8.5 M-1 3 L3.5 8 M0.5 -1 L-5 1.5 M0.5 -1 L6 -3.5"/></g>`;
  for(let c=0;c<C;c++) for(let l=0;l<L;l++){ if(c===0&&l===1) continue;
    o+=`<rect class="cell-hit" data-c="${c}" data-l="${l}" x="${ML+c*TX}" y="${MT+l*TY}" width="${TX}" height="${TY}"><title>${c*10} m, ${['left','middle','right'][l]} lane: click to ${g[c][l]?'remove':'place'} a train</title></rect>`; }
  $('#track').innerHTML=o+'</svg>';
}

function subPanels(){
  const s=sub, st=s.stat;
  $('#kRuns').textContent=s.total.toLocaleString('en-IN');
  $('#kMust').textContent=s.must.length;
  $('#kSw').textContent=s.switches===null?'–':s.switches;
  $('#survPill').innerHTML=s.total>0?pill('good','Survivable'):pill('bad','No way through');
  $('#runBtn').disabled=!s.path.length;
  $('#subNote').innerHTML=s.total>0
    ? `Runs are counted with dynamic programming on the move digraph: runs(v) = sum of runs into v. A must-pass point satisfies runs-to(v) × runs-from(v) = <b>${s.total.toLocaleString('en-IN')}</b>, the total. The orange route uses the fewest lane switches.`
    : `The start and the finish are in different parts of the move digraph, so no path exists. Remove a train to reconnect them.`;
  $('#subStats').innerHTML=rowsHTML(propertyRows(st))+`<div class="row"><span class="k"><small>Note</small>Why bipartite?</span><span class="v" style="font-family:var(--f-body);max-width:24ch">Every edge joins an even step to an odd step.</span></div>`;
  degChart($('#subDeg'),st.degCount);
}
function subFull(){ stopRun(); subAnalyse(); drawTrack(); subPanels();
  document.querySelectorAll('#levelSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.level===SS.level));
  $('#reroll').disabled=SS.level!=='random'; }
function stopRun(){ if(SS.timer){clearInterval(SS.timer);SS.timer=null;} }
function run(){ stopRun(); const p=sub.path; if(!p.length) return; const el=$('#runner'); let k=0;
  const place=i=>{ const [c,l]=sub.verts[p[i]]; el.setAttribute('transform',`translate(${nx_(c)} ${ny_(l)})`); };
  if(reduced){ place(p.length-1); return; }
  place(0); SS.timer=setInterval(()=>{ k++; if(k>=p.length){stopRun();return;} place(k); },150); }

$('#levelSeg').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; SS.level=b.dataset.level; SS.grid=genLevel(SS.level,SS.seed); subFull(); });
$('#reroll').addEventListener('click',()=>{ SS.seed=Math.floor(Math.random()*1e6); SS.level='random'; SS.grid=genLevel('random',SS.seed); subFull(); });
$('#runBtn').addEventListener('click',run);
$('#edgeChk').addEventListener('change',e=>{SS.showEdges=e.target.checked;drawTrack();});
$('#mustChk').addEventListener('change',e=>{SS.showMust=e.target.checked;drawTrack();});
$('#cutChk').addEventListener('change',e=>{SS.showCut=e.target.checked;drawTrack();});
$('#track').addEventListener('click',e=>{ const r=e.target.closest('[data-c]'); if(!r) return; const c=+r.dataset.c,l=+r.dataset.l;
  SS.grid[c][l]=!SS.grid[c][l]; subFull(); });
