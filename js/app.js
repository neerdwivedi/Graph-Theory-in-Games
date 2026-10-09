/* Navigation between Home and Mini project, startup */
/* ================= TABS ================= */
let GAME='chess';
function show(tab,game){
  if(game) GAME=game;
  ['home','project'].forEach(t=>{ $('#screen-'+t).hidden=t!==tab; $('#tab-'+t).setAttribute('aria-selected',t===tab); });
  ['chess','subway'].forEach(g=>{ $('#screen-'+g).hidden=g!==GAME; });
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
if(h==='home') first=['home','chess']; else if(h==='project') first=['project','chess']; else if(h==='chess'||h==='subway') first=['project',h];
else { try{ const s=localStorage.getItem('gig-view'); if(s){ const [a,b]=s.split(':'); if(['home','project'].includes(a)&&['chess','subway'].includes(b)) first=[a,b]; } }catch(e){} }
show(first[0],first[1]);
