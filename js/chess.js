/* Chess move graphs: knight, king, rook, bishop, queen */
/* ================= CHESS ================= */
const PIECES={knight:['♞','Knight','--c-violet'],king:['♚','King','--c-sun'],rook:['♜','Rook','--c-sky'],bishop:['♝','Bishop','--c-pink'],queen:['♛','Queen','--c-coral']};
const pieceMark=(x,y)=>`<circle cx="${x}" cy="${y}" r="25" style="fill:var(${PIECES[CS.piece][2]})" stroke="var(--surface)" stroke-width="3"/><text class="piece" x="${x}" y="${y+2}">${PIECES[CS.piece][0]}</text>`;
const CS={n:8,piece:'knight',mode:'moves',sel:57,tour:null,shown:0,timer:null,match:false,msg:''};
function chessAdj(n,p){
  const K=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]], D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const adj=[];
  for(let r=0;r<n;r++) for(let c=0;c<n;c++){ const nb=[]; const add=(a,b)=>{ if(a>=0&&a<n&&b>=0&&b<n) nb.push(a*n+b); };
    if(p==='knight') K.forEach(([a,b])=>add(r+a,c+b));
    else if(p==='king') D8.forEach(([a,b])=>add(r+a,c+b));
    else { const dirs=p==='rook'?D8.slice(0,4):p==='bishop'?D8.slice(4):D8; dirs.forEach(([a,b])=>{ for(let k=1;k<n;k++) add(r+a*k,c+b*k); }); }
    adj.push(nb); }
  return adj;
}
const sqName=(i,n)=>String.fromCharCode(97+i%n)+(n-Math.floor(i/n));
let cAdj, cStat;

function chessRecompute(){ cAdj=chessAdj(CS.n,CS.piece); cStat=analyse(cAdj); }
function stopTour(){ if(CS.timer){clearInterval(CS.timer);CS.timer=null;} }

function drawBoard(){
  const n=CS.n, Z=60, s=cStat; let o=`<svg viewBox="0 0 ${n*Z} ${n*Z}" role="grid" aria-label="Chess board">`;
  const cx=i=>(i%n)*Z+Z/2, cy=i=>Math.floor(i/n)*Z+Z/2;
  for(let i=0;i<n*n;i++){ const r=Math.floor(i/n),c=i%n; o+=`<rect class="${(r+c)%2?'sq-d':'sq-l'}" x="${c*Z}" y="${r*Z}" width="${Z}" height="${Z}"/>`;
    if(CS.mode==='degree') o+=`<rect class="heat" x="${c*Z}" y="${r*Z}" width="${Z}" height="${Z}" fill-opacity="${(0.08+0.72*(s.deg[i]-s.minD)/Math.max(1,s.maxD-s.minD)).toFixed(2)}"/>`;
    if(CS.mode==='parts') o+=`<rect class="${s.color[i]===0?'partA':'partB'}" x="${c*Z}" y="${r*Z}" width="${Z}" height="${Z}"/>`;
    if(c===0) o+=`<text class="sq-coord" x="3" y="${r*Z+12}">${n-r}</text>`;
    if(r===n-1) o+=`<text class="sq-coord" x="${c*Z+Z-10}" y="${n*Z-4}">${String.fromCharCode(97+c)}</text>`; }
  if(CS.mode==='degree') for(let i=0;i<n*n;i++) o+=`<text class="sq-txt" x="${cx(i)}" y="${cy(i)}">${s.deg[i]}</text>`;
  if(CS.mode==='parts') for(let i=0;i<n*n;i++) o+=`<text class="sq-txt" x="${cx(i)}" y="${cy(i)}">${s.color[i]===0?'A':'B'}</text>`;
  if(CS.mode==='moves'){ for(const v of cAdj[CS.sel]) o+=`<line class="e-sel" x1="${cx(CS.sel)}" y1="${cy(CS.sel)}" x2="${cx(v)}" y2="${cy(v)}"/>`;
    for(const v of cAdj[CS.sel]) o+=`<circle class="nb-dot" cx="${cx(v)}" cy="${cy(v)}" r="9"/>`;
    o+=`${pieceMark(cx(CS.sel),cy(CS.sel))}`; }
  if(CS.mode==='tour'){
    if(CS.tour){ const p=CS.tour.slice(0,CS.shown);
      if(CS.match && CS.shown===CS.tour.length) for(let k=0;k+1<p.length;k+=2) o+=`<line class="match-line" x1="${cx(p[k])}" y1="${cy(p[k])}" x2="${cx(p[k+1])}" y2="${cy(p[k+1])}"/>`;
      o+=`<polyline class="tour-line" points="${p.map(i=>cx(i)+','+cy(i)).join(' ')}"/>`;
      p.forEach((i,k)=>{ o+=`<text class="sq-txt" style="font-size:14px" x="${cx(i)}" y="${cy(i)}">${k+1}</text>`; }); }
    else o+=`${pieceMark(cx(CS.sel),cy(CS.sel))}`; }
  o+=`<rect class="sel-ring" x="${(CS.sel%n)*Z+2}" y="${Math.floor(CS.sel/n)*Z+2}" width="${Z-4}" height="${Z-4}" rx="4"/>`;
  for(let i=0;i<n*n;i++){ const r=Math.floor(i/n),c=i%n; o+=`<rect class="sq-hit" data-i="${i}" x="${c*Z}" y="${r*Z}" width="${Z}" height="${Z}" tabindex="-1"><title>${sqName(i,n)} · degree ${s.deg[i]}</title></rect>`; }
  $('#board').innerHTML=o+'</svg>';
}

function chessNote(){
  const n=CS.n,i=CS.sel,s=cStat,nm=PIECES[CS.piece][1];
  let t='';
  if(CS.mode==='moves') t=`<b>${sqName(i,n)}</b> has degree <b>${s.deg[i]}</b>. Neighbours: ${cAdj[i].map(v=>sqName(v,n)).join(', ')||'none'}. Click any square to move the ${nm.toLowerCase()}.`;
  else if(CS.mode==='degree') t=`Darker squares have more moves. Degrees run from <b>${s.minD}</b> to <b>${s.maxD}</b>, so the ${nm.toLowerCase()} graph is ${s.regular?'regular':'not regular'}.`;
  else if(CS.mode==='parts') t= s.bip?`Every edge joins an <b>A</b> square to a <b>B</b> square, so the graph is bipartite with parts ${s.partA} and ${s.partB}.`
       :`The 2-colouring fails: the ${nm.toLowerCase()} graph has an odd cycle, so it is <b>not bipartite</b>. Colours show the BFS attempt.`;
  else t=CS.msg||'Click a starting square to search for a Hamiltonian path (a tour visiting every square once).';
  $('#chessNote').innerHTML=t;
}

function chessStatsPanel(){
  const s=cStat; $('#chessTitle').textContent=PIECES[CS.piece][1]+' graph'; $('#chessBadge').textContent=`${CS.n} × ${CS.n}`;
  $('#chessStats').innerHTML=rowsHTML(propertyRows(s));
  degChart($('#chessDeg'),s.degCount); drawAdj();
}

function drawAdj(){
  const cv=$('#adjCanvas'), V=cAdj.length, px=Math.max(1,Math.floor(256/V)), W=px*V; cv.width=W; cv.height=W;
  const ctx=cv.getContext('2d'), st=getComputedStyle(document.documentElement);
  ctx.fillStyle=st.getPropertyValue('--surface').trim(); ctx.fillRect(0,0,W,W);
  for(let i=0;i<V;i++){ ctx.fillStyle=st.getPropertyValue(i===CS.sel?'--hot':'--accent').trim(); for(const j of cAdj[i]) ctx.fillRect(j*px,i*px,px,px); }
  $('#adjLab').textContent=`${V} × ${V}`;
}

function runTour(){
  stopTour(); const s=cStat, n=CS.n, st=CS.sel; CS.tour=null; CS.shown=0;
  if(s.comps>1){ CS.msg=`No Hamiltonian path exists: the graph is disconnected into <b>${s.comps}</b> components, and a path cannot jump between them.`; return; }
  if(s.bip){ const big=Math.max(s.partA,s.partB), small=Math.min(s.partA,s.partB); const myPart=s.color[st]===0?s.partA:s.partB;
    if(big-small>1){ CS.msg=`Impossible: a Hamiltonian path in a bipartite graph alternates sides, but the parts are ${s.partA} and ${s.partB}.`; return; }
    if(big!==small && myPart===small){ CS.msg=`Impossible from <b>${sqName(st,n)}</b>: parts are ${s.partA} and ${s.partB}, so a path covering all ${s.V} squares must start on the larger side. Try a square of the other colour.`; return; } }
  const p=hamPath(cAdj,st,80);
  if(!p){ CS.msg=`The Warnsdorff heuristic found no tour from <b>${sqName(st,n)}</b> in 80 attempts. Try another square.`; return; }
  CS.tour=p; const closed=cAdj[p[p.length-1]].includes(p[0]);
  CS.msg=`Hamiltonian path found from <b>${sqName(st,n)}</b>: all <b>${p.length}</b> squares visited once, ending on ${sqName(p[p.length-1],n)}. ${closed?'The end is one move from the start, so this is a <b>closed tour (Hamiltonian cycle)</b>.':'It is an open tour.'}`+
    (p.length%2===0?` Pairing steps 1–2, 3–4, … gives a perfect matching of ${p.length/2} edges.`:'');
  if(reduced){ CS.shown=p.length; return; }
  CS.timer=setInterval(()=>{ CS.shown++; drawBoard(); if(CS.shown>=p.length) stopTour(); },35);
}

function chessRender(){ drawBoard(); chessNote(); }
function chessFull(){ chessRecompute(); chessStatsPanel(); chessRender(); syncChessControls(); }
function syncChessControls(){
  document.querySelectorAll('#pieceSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===CS.piece));
  document.querySelectorAll('#modeSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===CS.mode));
  $('#matchWrap').hidden=CS.mode!=='tour';
}

$('#pieceSeg').innerHTML=Object.entries(PIECES).map(([k,[g,nm,col]])=>`<button data-p="${k}" style="--pc:var(${col})"><i class="dot"></i>${g} ${nm}</button>`).join('');
$('#pieceSeg').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; stopTour(); CS.piece=b.dataset.p; CS.tour=null; CS.msg=''; chessFull(); });
$('#modeSeg').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; stopTour(); CS.mode=b.dataset.mode;
  if(CS.mode==='tour'){ CS.tour=null; CS.msg=''; } syncChessControls(); chessRender(); });
$('#nSel').addEventListener('change',e=>{ stopTour(); CS.n=+e.target.value; CS.sel=(CS.n-1)*CS.n+1; CS.tour=null; CS.msg=''; chessFull(); });
$('#matchChk').addEventListener('change',e=>{ CS.match=e.target.checked; drawBoard(); });
$('#board').addEventListener('click',e=>{ const r=e.target.closest('[data-i]'); if(!r) return; CS.sel=+r.dataset.i;
  if(CS.mode==='tour') runTour(); chessRender(); drawAdj(); });
