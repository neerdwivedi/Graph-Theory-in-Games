/* Home page animation: level -> waypoint graph -> Dijkstra -> chase */
/* ================= HOME ANIMATION: guard pathfinding ================= */
(function(){
  const svg=$('#aSvg'); if(!svg) return;
  const NS='http://www.w3.org/2000/svg';
  const N=[[60,280],[60,120],[140,60],[150,290],[270,290],[260,140],[360,250],[360,70],[480,60],[500,200],[580,60],[580,290]];
  const EDG=[[0,1],[0,3],[1,2],[1,3],[2,3],[3,4],[4,5],[4,6],[5,7],[6,7],[7,8],[8,10],[8,9],[9,10],[9,11],[10,11]];
  const S=0,T=10;
  const dd=(a,b)=>Math.hypot(N[a][0]-N[b][0],N[a][1]-N[b][1]);
  const adj=N.map(()=>[]); EDG.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});
  // Dijkstra from the guard, stopping when the player is settled
  const dist=N.map(()=>Infinity), prev=N.map(()=>-1), done=N.map(()=>false), order=[]; dist[S]=0;
  for(let k=0;k<N.length;k++){ let u=-1; for(let i=0;i<N.length;i++) if(!done[i]&&(u<0||dist[i]<dist[u])) u=i;
    if(u<0||dist[u]===Infinity) break; done[u]=true; order.push(u); if(u===T) break;
    for(const v of adj[u]){ const w=dist[u]+dd(u,v); if(w<dist[v]){dist[v]=w;prev[v]=u;} } }
  const path=[]; for(let v=T;v!==-1;v=prev[v]) path.unshift(v);
  const pts=path.map(i=>N[i]); const segL=[]; let pathLen=0;
  for(let k=1;k<pts.length;k++){ const l=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]); segL.push(l); pathLen+=l; }

  const PH=[
    ['The game level','A typical stealth or shooter level, like the ones built in the Unity engine. A guard (red) spots you (blue) behind walls and crates. Which way does it run?',3],
    ['Vertices','Unity "bakes" a navigation mesh: it splits the walkable floor into pieces and places a node on each piece. Each node is a vertex.',2.8],
    ['Edges','Neighbouring pieces are joined by edges, weighted by walking distance. The level is now a weighted graph.',3],
    ['Search explores',"Unity's manual says it runs A* on this graph. A* is Dijkstra's algorithm plus a distance guess that makes it faster. This demo shows plain Dijkstra: the nearest unsettled waypoint is settled first, spreading like a ripple. Numbers are distances from the guard.",5],
    ['Shortest path',`The player's waypoint is reached at distance ${Math.round(dist[T])}. Following each waypoint's predecessor back gives the shortest path: ${path.length} vertices, ${path.length-1} edges.`,2.8],
    ['The chase','The guard follows the path around the walls. The search runs again whenever you move, which is why enemies react the moment you change position.',4.4]];
  const start=[]; let acc=0; PH.forEach(p=>{start.push(acc);acc+=p[2];}); const TOTAL=acc+2;
  const COL=['--c-violet','--c-sky','--c-teal','--c-sun','--c-coral','--c-pink'];

  const mk=(tag,attrs,parent)=>{ const e=document.createElementNS(NS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); (parent||svg).appendChild(e); return e; };
  // scene
  const defs=mk('defs',{}); const pat=mk('pattern',{id:'aTiles',width:40,height:40,patternUnits:'userSpaceOnUse'},defs);
  mk('rect',{width:40,height:40,class:'a-floor'},pat); mk('path',{d:'M40 0H0V40',class:'a-tile'},pat);
  mk('rect',{width:640,height:340,fill:'url(#aTiles)'});
  [[30,40,15],[612,175,14],[300,318,13],[118,200,0]].forEach(([x,y,r])=>{ if(r) mk('circle',{cx:x,cy:y,r,class:'a-bush'}); });
  [[200,0,20,230],[420,110,20,230]].forEach(([x,y,w,h])=>{ mk('rect',{x,y,width:w,height:h,class:'a-wall'}); mk('rect',{x,y,width:6,height:h,class:'a-wall-top'}); });
  mk('rect',{x:290,y:150,width:50,height:45,rx:4,class:'a-crate'}); mk('path',{d:'M294 154l42 37M336 154l-42 37',class:'a-crate-l'});
  mk('rect',{x:2.5,y:2.5,width:635,height:335,rx:13,class:'a-border'});
  // graph layers
  const gE=mk('g',{}), gW=mk('g',{}), gP=mk('g',{}), gR=mk('g',{}), gN=mk('g',{}), gD=mk('g',{});
  const edgeEls=EDG.map(([a,b])=>{ const l=dd(a,b); const e=mk('line',{x1:N[a][0],y1:N[a][1],x2:N[b][0],y2:N[b][1],class:'a-edge','stroke-dasharray':l,'stroke-dashoffset':l},gE);
    const w=mk('text',{x:(N[a][0]+N[b][0])/2+8,y:(N[a][1]+N[b][1])/2-6,class:'a-w',opacity:0},gW); w.textContent=Math.round(l); return {e,l,w}; });
  const pathEl=mk('polyline',{points:pts.map(p=>p.join(',')).join(' '),class:'a-path','stroke-dasharray':pathLen,'stroke-dashoffset':pathLen},gP);
  const ringEls=N.map(([x,y])=>mk('circle',{cx:x,cy:y,r:9,class:'a-ring',opacity:0},gR));
  const nodeEls=N.map(([x,y])=>mk('circle',{cx:x,cy:y,r:9,class:'a-node',opacity:0},gN));
  const distEls=N.map(([x,y])=>{ const t=mk('text',{x:x+12,y:y-12,class:'a-dist',opacity:0},gD); t.textContent=isFinite(dist[x])?'':''; return t; });
  // characters
  function face(g,cls){ mk('circle',{r:15,class:cls},g); mk('circle',{cx:-5,cy:-3,r:4,class:'a-eye'},g); mk('circle',{cx:5,cy:-3,r:4,class:'a-eye'},g);
    mk('circle',{cx:-4,cy:-2,r:1.8,class:'a-pupil'},g); mk('circle',{cx:6,cy:-2,r:1.8,class:'a-pupil'},g); }
  const you=mk('g',{transform:`translate(${N[T][0]} ${N[T][1]})`}); face(you,'a-you'); mk('text',{y:-22,class:'a-tag'},you).textContent='YOU';
  const guard=mk('g',{transform:`translate(${N[S][0]} ${N[S][1]})`}); face(guard,'a-guard');
  mk('path',{d:'M-9 -10l7 3M9 -10l-7 3',stroke:'#1d1640','stroke-width':2.2,'stroke-linecap':'round'},guard);
  mk('text',{y:-22,class:'a-tag'},guard).textContent='GUARD';
  const bub=mk('g',{transform:`translate(${N[T][0]-40} ${N[T][1]+44})`,opacity:0}); mk('rect',{x:-38,y:-16,width:76,height:28,rx:10,class:'a-bubble'},bub);
  mk('text',{y:4,class:'a-bubble-t'},bub).textContent='Caught!';

  // step chips
  $('#aSteps').innerHTML=PH.map((p,i)=>`<button class="astep" data-s="${i}">${i+1}. ${p[0]}</button>`).join('');
  const clamp=x=>Math.max(0,Math.min(1,x));
  let t=0, playing=!reduced, last=null, curPh=-1;
  function posAlong(f){ let target=f*pathLen; for(let k=0;k<segL.length;k++){ if(target<=segL[k]||k===segL.length-1){ const r=segL[k]?Math.min(1,target/segL[k]):1; return [pts[k][0]+(pts[k+1][0]-pts[k][0])*r, pts[k][1]+(pts[k+1][1]-pts[k][1])*r]; } target-=segL[k]; } return pts[pts.length-1]; }
  function render(){
    let ph=0; for(let i=0;i<PH.length;i++) if(t>=start[i]) ph=i;
    const loc=t-start[ph];
    N.forEach((_,i)=>{ const op= ph<1?0: ph>1?1: clamp((loc-i*0.17)/0.3); nodeEls[i].setAttribute('opacity',op); });
    edgeEls.forEach((o,i)=>{ const p= ph<2?0: ph>2?1: clamp((loc-i*0.12)/0.5); o.e.setAttribute('stroke-dashoffset',o.l*(1-p)); o.w.setAttribute('opacity', ph===2||ph===3 ? p : 0); });
    const stepT=(PH[3][2]*0.9)/order.length;
    order.forEach((u,k)=>{ const at=start[3]+k*stepT; const on=t>=at;
      nodeEls[u].classList.toggle('set',on);
      distEls[u].textContent=Math.round(dist[u]); distEls[u].setAttribute('opacity', on&&ph<5?1:0);
      const age=t-at; ringEls[u].setAttribute('opacity', on&&age<0.7?1-age/0.7:0); ringEls[u].setAttribute('r',9+18*clamp(age/0.7)); });
    if(ph<3) order.forEach(u=>{ nodeEls[u].classList.remove('set'); distEls[u].setAttribute('opacity',0); ringEls[u].setAttribute('opacity',0); });
    const pp= ph<4?0: ph>4?1: clamp(loc/(PH[4][2]*0.75)); pathEl.setAttribute('stroke-dashoffset',pathLen*(1-pp));
    const gf= ph<5?0: clamp(loc/(PH[5][2]*0.8)); const [gx,gy]=posAlong(gf); guard.setAttribute('transform',`translate(${gx} ${gy})`);
    bub.setAttribute('opacity', ph===5&&gf>=1?1:0);
    if(ph!==curPh){ curPh=ph; $('#aTitle').textContent=PH[ph][0]; $('#aCap').textContent=PH[ph][1]; $('#aNum').textContent=ph+1;
      $('#aNum').style.setProperty('--cc',`var(${COL[ph]})`);
      document.querySelectorAll('.astep').forEach((b,i)=>{ b.setAttribute('aria-current',i===ph); b.classList.toggle('done',i<ph); }); }
  }
  function frame(ts){
    if(last===null) last=ts; const dt=Math.min(0.1,(ts-last)/1000); last=ts;
    if(playing && !$('#screen-home').hidden){ t+=dt; if(t>TOTAL) t=0; render(); }
    requestAnimationFrame(frame);
  }
  function setPlay(p){ playing=p; $('#aPlay').textContent=p?'Pause':'Play'; }
  $('#aPlay').addEventListener('click',()=>setPlay(!playing));
  $('#aReplay').addEventListener('click',()=>{ t=0; render(); setPlay(true); });
  $('#aSteps').addEventListener('click',e=>{ const b=e.target.closest('[data-s]'); if(!b) return; const i=+b.dataset.s;
    t= reduced? start[i]+PH[i][2]-0.01 : start[i]; render(); });
  if(reduced){ t=start[4]+PH[4][2]-0.01; setPlay(false); }
  render(); requestAnimationFrame(frame);
})();
