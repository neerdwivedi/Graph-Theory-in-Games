/* One-stroke puzzle: draw every edge exactly once (Euler trail / circuit), Hierholzer's algorithm, puzzle designer */
/* ================= ONE-STROKE ================= */
(function(){
const PUZ={
  house:{name:'House',v:[[110,250],[290,250],[110,140],[290,140],[200,50]],e:[[0,1],[1,3],[3,2],[2,0],[2,4],[4,3],[0,3],[1,2]]},
  bowtie:{name:'Bow tie',v:[[70,70],[70,230],[200,150],[330,70],[330,230]],e:[[0,1],[1,2],[2,0],[2,3],[3,4],[4,2]]},
  star:{name:'Hex star',v:[[200,40],[310,100],[310,210],[200,270],[90,210],[90,100]],e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,2],[2,4],[4,0]]},
  square:{name:'Crossed square',v:[[100,60],[300,60],[300,250],[100,250]],e:[[0,1],[1,2],[2,3],[3,0],[0,2],[1,3]]},
  fish:{name:'Fish',v:[[60,150],[150,70],[150,230],[250,150],[340,80],[340,220]],e:[[0,1],[0,2],[1,3],[2,3],[1,2],[3,4],[3,5],[4,5]]},
};
const OS={key:'house',v:[],e:[],used:[],trail:[],cur:-1,msg:'',design:false,pick:-1,timer:null,showOdd:false};
const W=400,H=300;
function load(k){ stop(); OS.key=k; OS.design=false; const p=PUZ[k]; OS.v=p.v.map(a=>a.slice()); OS.e=p.e.map(a=>a.slice()); reset(); }
function reset(){ stop(); OS.used=OS.e.map(()=>false); OS.trail=[]; OS.cur=-1; OS.pick=-1; OS.msg=''; }
function stop(){ if(OS.timer){clearInterval(OS.timer);OS.timer=null;} }
function adjList(){ const a=OS.v.map(()=>[]); OS.e.forEach(([x,y])=>{a[x].push(y);a[y].push(x);}); return a; }
function deg(){ const d=OS.v.map(()=>0); OS.e.forEach(([x,y])=>{d[x]++;d[y]++;}); return d; }
function verdict(){
  const d=deg(), odd=d.map((x,i)=>x%2?i:-1).filter(i=>i>=0);
  const s=OS.v.length?analyse(adjList()):null;
  const nonIso=new Set(); if(s) d.forEach((x,i)=>{ if(x>0) nonIso.add(s.comp[i]); });
  const conn=nonIso.size<=1, E=OS.e.length;
  let ok=false, kind='', why='';
  if(!E){ kind='No edges yet'; why='Add some edges first.'; }
  else if(!conn){ kind='Impossible'; why='The edges are in more than one piece, so the pen would have to jump.'; }
  else if(odd.length===0){ ok=true; kind='Euler circuit'; why='Every vertex has even degree, so you can start anywhere and you will finish where you started.'; }
  else if(odd.length===2){ ok=true; kind='Euler trail'; why=`Exactly two vertices have odd degree (${odd.map(i=>'v'+(i+1)).join(' and ')}). Start at one of them and you will finish at the other.`; }
  else { kind='Impossible'; why=`${odd.length} vertices have odd degree. Each time the pen passes through a vertex it uses two edges, so only the start and the end can be odd. More than 2 odd vertices means no single stroke exists.`; }
  return {d,odd,conn,ok,kind,why,s};
}
/* Hierholzer's algorithm */
function hierholzer(){
  const v=verdict(); if(!v.ok) return null;
  const adj=OS.v.map(()=>[]); OS.e.forEach(([x,y],k)=>{adj[x].push([y,k]);adj[y].push([x,k]);});
  const used=OS.e.map(()=>false); const start=v.odd.length?v.odd[0]:OS.e[0][0];
  const st=[[start,-1]], out=[];
  while(st.length){ const [u]=st[st.length-1]; while(adj[u].length&&used[adj[u][adj[u].length-1][1]]) adj[u].pop();
    if(!adj[u].length){ out.push(st.pop()); } else { const [w,k]=adj[u].pop(); used[k]=true; st.push([w,k]); } }
  return out.reverse();  // [[vertex, edgeUsedToArrive], ...]
}
function edgeBetween(a,b){ return OS.e.findIndex(([x,y],k)=>!OS.used[k]&&((x===a&&y===b)||(x===b&&y===a))); }
function clickVertex(i){
  if(OS.design){
    if(OS.pick<0){ OS.pick=i; }
    else if(OS.pick===i){ OS.pick=-1; }
    else { const a=OS.pick,b=i; const k=OS.e.findIndex(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
      if(k>=0) OS.e.splice(k,1); else OS.e.push([a,b]); OS.pick=-1; OS.used=OS.e.map(()=>false); }
    render(); return;
  }
  stop();
  if(OS.cur<0){ OS.cur=i; OS.trail=[i]; OS.msg=''; render(); return; }
  const k=edgeBetween(OS.cur,i);
  if(k<0){ OS.msg=i===OS.cur?'You are already here. Pick a neighbour.':'There is no unused edge between those two vertices.'; render(); return; }
  OS.used[k]=true; OS.cur=i; OS.trail.push(i); OS.msg=''; render();
}
function undo(){ stop(); if(OS.trail.length<=1){ reset(); render(); return; }
  const b=OS.trail.pop(), a=OS.trail[OS.trail.length-1];
  const k=OS.e.findIndex(([x,y],j)=>OS.used[j]&&((x===a&&y===b)||(x===b&&y===a))); if(k>=0) OS.used[k]=false; OS.cur=a; render(); }
function solve(){ const t=hierholzer(); if(!t){ OS.msg='No one-stroke drawing exists for this graph.'; render(); return; }
  reset(); OS.cur=t[0][0]; OS.trail=[t[0][0]]; render(); let k=1;
  const step=()=>{ if(k>=t.length){ stop(); return; } const [v,e]=t[k++]; OS.used[e]=true; OS.cur=v; OS.trail.push(v); render(); };
  if(reduced){ while(k<t.length) step(); return; }
  OS.timer=setInterval(step,380); }

function render(){
  const v=verdict(), d=v.d, done=OS.e.length>0&&OS.used.every(Boolean);
  const stuck=!done&&OS.cur>=0&&!OS.e.some(([x,y],k)=>!OS.used[k]&&(x===OS.cur||y===OS.cur));
  let o=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="One-stroke puzzle graph">`;
  o+=`<rect class="os-bg${OS.design?' design':''}" width="${W}" height="${H}" rx="12"/>`;
  OS.e.forEach(([a,b],k)=>{ const p=OS.v[a],q=OS.v[b];
    o+=`<line class="os-e${OS.used[k]?' used':''}" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`; });
  // order numbers on traced edges
  for(let k=1;k<OS.trail.length;k++){ const p=OS.v[OS.trail[k-1]],q=OS.v[OS.trail[k]];
    o+=`<circle class="os-ord-b" cx="${(p[0]+q[0])/2}" cy="${(p[1]+q[1])/2}" r="9"/><text class="os-ord" x="${(p[0]+q[0])/2}" y="${(p[1]+q[1])/2}">${k}</text>`; }
  OS.v.forEach((p,i)=>{ const odd=d[i]%2===1;
    const cls=['os-v']; if(OS.showOdd&&odd) cls.push('odd'); if(i===OS.cur) cls.push('cur'); if(i===OS.pick) cls.push('pick');
    o+=`<g class="os-hit" data-v="${i}" tabindex="0" role="button" aria-label="Vertex ${i+1}, degree ${d[i]}"><circle class="${cls.join(' ')}" cx="${p[0]}" cy="${p[1]}" r="17"/><text class="os-vt" x="${p[0]}" y="${p[1]}">${i+1}</text>`+
       `<text class="os-deg" x="${p[0]+20}" y="${p[1]-18}">deg ${d[i]}</text></g>`; });
  $('#osBoard').innerHTML=o+'</svg>';

  const traced=OS.used.filter(Boolean).length;
  let note;
  if(OS.design) note=`<b>Designer mode.</b> Click empty space to add a vertex. Click two vertices to add an edge (or remove it if it exists). The verdict updates live.`;
  else if(done) note=`<b>Solved.</b> You drew all ${OS.e.length} edges in one stroke, ${OS.trail[0]===OS.cur?'finishing where you started: an Euler circuit':'from v'+(OS.trail[0]+1)+' to v'+(OS.cur+1)+': an Euler trail'}.`;
  else if(stuck) note=`<b>Stuck at v${OS.cur+1}.</b> No unused edges leave this vertex, but ${OS.e.length-traced} edges are left. ${v.ok&&v.odd.length===2&&!v.odd.includes(OS.trail[0])?'You started at an even vertex; start at an odd one instead.':'Undo a few steps and try another way.'}`;
  else if(OS.msg) note=OS.msg;
  else if(OS.cur<0) note='Click any vertex to put your pen down.';
  else note=`Pen at <b>v${OS.cur+1}</b>. Click a neighbour to draw the next edge.`;
  $('#osNote').innerHTML=note;
  $('#osVerdict').innerHTML=`<div class="os-verdict ${v.ok?'ok':v.kind==='Impossible'?'no':''}"><b>${v.kind}</b><p>${v.why}</p></div>`;
  const degSeq=[...d].sort((a,b)=>b-a).join(', ');
  $('#osStats').innerHTML=rowsHTML([
    ['Order |V|','Unit 1',OS.v.length],['Size |E|','Unit 1',OS.e.length],
    ['Degree sequence','Unit 1',degSeq||'–'],
    ['Handshake check','Unit 1',`Σ deg = ${d.reduce((a,b)=>a+b,0)} = 2 × ${OS.e.length}`],
    ['Connected (edges)?','Unit 1',v.conn?pill('good','Yes'):pill('bad','No')],
    ['Odd-degree vertices','Unit 2',v.odd.length],
    ['Euler circuit?','Unit 2',v.ok&&v.odd.length===0?pill('good','Yes'):pill('bad','No')],
    ['Euler trail?','Unit 2',v.ok?pill('good','Yes'):pill('bad','No')],
    ['Edges traced','',`${traced} / ${OS.e.length}`],
  ]);
  document.querySelectorAll('#osSeg button').forEach(b=>b.setAttribute('aria-pressed',OS.design?b.dataset.p==='design':b.dataset.p===OS.key));
  $('#osOddChk').checked=OS.showOdd;
  $('#osUndo').disabled=OS.design||!OS.trail.length; $('#osSolve').disabled=OS.design;
}

$('#osSeg').innerHTML=Object.entries(PUZ).map(([k,p])=>`<button data-p="${k}">${p.name}</button>`).join('')+`<button data-p="design">✎ Design your own</button>`;
$('#osSeg').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.p==='design'){ stop(); OS.design=true; OS.v=[]; OS.e=[]; reset(); } else load(b.dataset.p); render(); });
$('#osBoard').addEventListener('click',e=>{ const g=e.target.closest('[data-v]');
  if(g){ clickVertex(+g.dataset.v); return; }
  if(OS.design){ const svg=$('#osBoard svg'); const r=svg.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width*W, y=(e.clientY-r.top)/r.height*H;
    if(x<20||y<20||x>W-20||y>H-20||OS.v.some(p=>Math.hypot(p[0]-x,p[1]-y)<40)) return;
    OS.v.push([Math.round(x),Math.round(y)]); OS.used=OS.e.map(()=>false); render(); } });
$('#osBoard').addEventListener('keydown',e=>{ if(e.key!=='Enter'&&e.key!==' ') return; const g=e.target.closest('[data-v]'); if(g){ e.preventDefault(); clickVertex(+g.dataset.v); } });
$('#osReset').addEventListener('click',()=>{ reset(); render(); });
$('#osUndo').addEventListener('click',undo);
$('#osSolve').addEventListener('click',solve);
$('#osHint').addEventListener('click',()=>{ OS.showOdd=true; const v=verdict();
  OS.msg=!v.ok?'Hint: this one cannot be done. Check the odd-degree count.':v.odd.length?`Hint: start at v${v.odd[0]+1} or v${v.odd[1]+1} (the yellow, odd-degree vertices).`:'Hint: all degrees are even, so any starting vertex works.'; render(); });
$('#osOddChk').addEventListener('change',e=>{ OS.showOdd=e.target.checked; render(); });
load('house'); render();
})();
