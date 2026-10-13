/* Navigation between Home and Mini project, startup */
/* ================= TABS ================= */
const GAMES=['chess','subway','stroke','flood','ttt','maze'];
let GAME='chess';
function show(tab,game){
  if(game) GAME=game;
  ['home','project'].forEach(t=>{ $('#screen-'+t).hidden=t!==tab; $('#tab-'+t).setAttribute('aria-selected',t===tab); });
  GAMES.forEach(g=>{ $('#screen-'+g).hidden=g!==GAME; });
  document.querySelectorAll('[data-game]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.game===GAME));
  if(tab==='project'&&GAME==='chess') drawAdj();
  try{ localStorage.setItem('gig-view',tab+':'+GAME); }catch(e){}
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{ show(b.dataset.tab); window.scrollTo({top:0}); }));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{ show('project',b.dataset.go); window.scrollTo({top:0}); }));
document.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>show('project',b.dataset.game)));

document.querySelectorAll('td.u').forEach(td=>td.dataset.u=td.textContent.trim().slice(-1));
SS.grid=genLevel('random',SS.seed);
chessFull(); subFull();
let first=['home','chess']; const h=location.hash.slice(1);
if(h==='home') first=['home','chess']; else if(h==='project') first=['project','chess']; else if(GAMES.includes(h)) first=['project',h];
else { try{ const s=localStorage.getItem('gig-view'); if(s){ const [a,b]=s.split(':'); if(['home','project'].includes(a)&&GAMES.includes(b)) first=[a,b]; } }catch(e){} }
show(first[0],first[1]);

/* code drawer: one tab per game, copy button */
document.querySelectorAll('.code-tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.code-tab').forEach(b=>b.setAttribute('aria-selected',b===t));
  document.querySelectorAll('.code-pane').forEach(p=>p.hidden=p.dataset.pane!==t.dataset.code);
}));
document.querySelectorAll('.code-copy').forEach(b=>b.addEventListener('click',()=>{
  const txt=b.closest('.code-pane').querySelector('pre').innerText;
  const done=()=>{ b.textContent='Copied'; setTimeout(()=>b.textContent='Copy',1400); };
  if(navigator.clipboard) navigator.clipboard.writeText(txt).then(done,()=>{}); 
}));
