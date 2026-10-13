/* Tic-tac-toe AI: the game tree, minimax search, "why this move?" branch view */
/* ================= TIC-TAC-TOE ================= */
(function(){
const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const TS={b:Array(9).fill(''),human:'X',ai:'O',turn:'X',last:null,why:null,showVals:false,aiFirst:false};
function winner(b){ for(const [a,c,d] of LINES) if(b[a]&&b[a]===b[c]&&b[a]===b[d]) return {p:b[a],line:[a,c,d]}; return b.every(Boolean)?{p:'draw'}:null; }
/* minimax: +10 - depth if AI wins, depth - 10 if human wins, 0 for a draw. Counts every tree node it visits. */
let visited=0;
function minimax(b,turn,depth){
  visited++; const w=winner(b);
  if(w) return w.p===TS.ai?10-depth:w.p==='draw'?0:depth-10;
  let best=turn===TS.ai?-Infinity:Infinity;
  for(let i=0;i<9;i++) if(!b[i]){ b[i]=turn; const v=minimax(b,turn==='X'?'O':'X',depth+1); b[i]='';
    best=turn===TS.ai?Math.max(best,v):Math.min(best,v); }
  return best;
}
/* evaluate every child of the current position */
function branches(b,turn){ visited=0; const out=[];
  for(let i=0;i<9;i++) if(!b[i]){ b[i]=turn; out.push({i,v:minimax(b,turn==='X'?'O':'X',1)}); b[i]=''; }
  return {out,visited}; }
const outcome=v=>v>0?'win':v<0?'loss':'draw';
/* whole game tree from the empty board: every node, and distinct positions */
function treeSize(){ let nodes=0; const seen=new Set();
  (function go(b,t){ nodes++; seen.add(b.join(',')); if(winner(b)) return; for(let i=0;i<9;i++) if(!b[i]){ b[i]=t; go(b,t==='X'?'O':'X'); b[i]=''; } })(Array(9).fill(''),'X');
  return {nodes,positions:seen.size}; }
const TREE=treeSize();

function aiMove(){
  const {out,visited}=branches(TS.b.slice(),TS.ai);
  const best=Math.max(...out.map(o=>o.v)); const choice=out.filter(o=>o.v===best);
  // prefer centre, then corners, among equally good moves
  const pref=[4,0,2,6,8,1,3,5,7]; choice.sort((a,b)=>pref.indexOf(a.i)-pref.indexOf(b.i));
  const pickI=choice[0].i;
  TS.why={before:TS.b.slice(),out,visited,pick:pickI};
  TS.b[pickI]=TS.ai; TS.last=pickI; TS.turn=TS.human;
}
function newGame(){ TS.b=Array(9).fill(''); TS.last=null; TS.why=null; TS.turn='X';
  TS.human=TS.aiFirst?'O':'X'; TS.ai=TS.aiFirst?'X':'O';
  if(TS.aiFirst){ aiMove(); } render(); }
function play(i){ if(TS.b[i]||winner(TS.b)||TS.turn!==TS.human) return;
  TS.b[i]=TS.human; TS.last=i; TS.turn=TS.ai; render();
  if(!winner(TS.b)) setTimeout(()=>{ aiMove(); render(); },reduced?0:260); }

function miniBoard(b,x,y,s,hi,cls){ let o=`<g transform="translate(${x} ${y})"><rect class="tt-mb ${cls||''}" width="${s}" height="${s}" rx="5"/>`; const c=s/3;
  o+=`<path class="tt-mg" d="M${c} 3V${s-3}M${2*c} 3V${s-3}M3 ${c}H${s-3}M3 ${2*c}H${s-3}"/>`;
  b.forEach((m,i)=>{ if(!m) return; const cx=(i%3+.5)*c, cy=(Math.floor(i/3)+.5)*c;
    o+=`<text class="tt-mt ${m==='X'?'x':'o'}${i===hi?' hi':''}" x="${cx}" y="${cy}" font-size="${c*.75}">${m}</text>`; });
  return o+'</g>'; }

function render(){
  const w=winner(TS.b);
  let o='';
  for(let i=0;i<9;i++){ const m=TS.b[i];
    const win=w&&w.line&&w.line.includes(i);
    o+=`<button class="tt-cell${m?' '+(m==='X'?'x':'o'):''}${i===TS.last?' last':''}${win?' win':''}" data-i="${i}" aria-label="Square ${i+1}${m?', '+m:''}" ${m||w||TS.turn!==TS.human?'disabled':''}>${m}</button>`; }
  $('#ttBoard').innerHTML=o;
  // value overlay for the human
  if(TS.showVals&&!w&&TS.turn===TS.human){ const {out}=branches(TS.b.slice(),TS.human);
    out.forEach(({i,v})=>{ const el=$('#ttBoard').children[i]; const r=outcome(-v);
      el.innerHTML=`<span class="tt-val ${r}">${r==='win'?'Win':r==='draw'?'Draw':'Lose'}</span>`; }); }
  const status=w?(w.p==='draw'?pill('info','Draw'):w.p===TS.human?pill('good','You win'):pill('bad','Computer wins')):TS.turn===TS.human?pill('info',`Your move (${TS.human})`):pill('info','Thinking…');
  $('#ttStatus').innerHTML=status;

  // why-this-move tree
  const y=TS.why;
  if(!y){ $('#ttTree').innerHTML=`<p class="muted" style="font-size:14px">Make a move. After the computer replies, its search tree for that decision appears here.</p>`; $('#ttWhy').innerHTML=''; }
  else {
    const n=y.out.length, s=58, gap=12, W=Math.max(n*(s+gap),s+gap)+gap, H=210;
    let t=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Game tree of the computer's last decision">`;
    const rx=W/2-s/2;
    y.out.forEach((b,k)=>{ const cx=gap+k*(s+gap)+s/2; t+=`<line class="tt-edge${b.i===y.pick?' pick':''}" x1="${W/2}" y1="${s+8}" x2="${cx}" y2="${118}"/>`; });
    t+=miniBoard(y.before,rx,6,s,-1,'root');
    y.out.forEach((b,k)=>{ const x=gap+k*(s+gap); const nb=y.before.slice(); nb[b.i]=TS.ai; const r=outcome(b.v);
      t+=miniBoard(nb,x,118,s,b.i,b.i===y.pick?'pick':'');
      t+=`<text class="tt-res ${r}" x="${x+s/2}" y="${118+s+16}">${r==='win'?'AI wins':r==='draw'?'Draw':'AI loses'}</text>`;
      t+=`<text class="tt-score" x="${x+s/2}" y="${118+s+30}">${b.v>0?'+':''}${b.v}</text>`; });
    $('#ttTree').innerHTML=t+'</svg>';
    const best=y.out.find(o=>o.i===y.pick), r=outcome(best.v);
    const names=['top-left','top-middle','top-right','middle-left','centre','middle-right','bottom-left','bottom-middle','bottom-right'];
    const nWin=y.out.filter(o=>o.v>0).length,nDraw=y.out.filter(o=>o.v===0).length,nLoss=y.out.filter(o=>o.v<0).length;
    $('#ttWhy').innerHTML=`<b>Why ${names[y.pick]}?</b> The computer looked at all ${n} possible moves and searched every game that could follow (${y.visited.toLocaleString('en-IN')} tree nodes). Assuming you play perfectly, ${nWin?nWin+' move'+(nWin>1?'s':'')+' win, ':''}${nDraw?nDraw+' draw, ':''}${nLoss?nLoss+' lose':''}. It chose the best score: ${r==='win'?'a forced win':r==='draw'?'a guaranteed draw':'the slowest loss'}.`;
  }
  const empty=TS.b.filter(m=>!m).length;
  $('#ttStats').innerHTML=rowsHTML([
    ['Game-tree nodes (from empty board)','Unit 2',TREE.nodes.toLocaleString('en-IN')],
    ['Distinct positions (vertices)','Unit 2',TREE.positions.toLocaleString('en-IN')],
    ['Root','Unit 2','Empty board'],
    ['Depth of current position','Unit 2',9-empty],
    ['Children of current position','Unit 2',w?0:empty],
    ['Leaves = finished games','Unit 2','Win, loss or draw'],
    ['Last search visited','Unit 2',y?y.visited.toLocaleString('en-IN')+' nodes':'–'],
    ['Value with perfect play','',pill('info','Draw')],
  ]);
  $('#ttValChk').checked=TS.showVals;
  document.querySelectorAll('#ttFirst button').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.f==='ai')===TS.aiFirst));
}
$('#ttBoard').addEventListener('click',e=>{ const b=e.target.closest('[data-i]'); if(b) play(+b.dataset.i); });
$('#ttNew').addEventListener('click',newGame);
$('#ttValChk').addEventListener('change',e=>{ TS.showVals=e.target.checked; render(); });
$('#ttFirst').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; TS.aiFirst=b.dataset.f==='ai'; newGame(); });
newGame();
})();
