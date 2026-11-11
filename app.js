const POSITIONS=['Kaleci','Defans','Orta Saha','Forvet'];
let players=JSON.parse(localStorage.getItem('sahaPlayers')||'[]');
const $=s=>document.querySelector(s);
const els={form:$('#playerForm'),name:$('#playerName'),rating:$('#playerRating'),position:$('#playerPosition'),list:$('#playerList'),count:$('#count'),needed:$('#needed'),draw:$('#drawTeams'),results:$('#results'),hint:$('#validationHint'),toast:$('#toast')};

function save(){localStorage.setItem('sahaPlayers',JSON.stringify(players));render()}
function initials(name){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function stars(n){return '★'.repeat(n)}
function escapeHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function toast(msg){els.toast.textContent=msg;els.toast.classList.add('show');setTimeout(()=>els.toast.classList.remove('show'),1800)}

function render(){
  els.count.textContent=players.length; $('#heroCount').textContent=players.length;
  $('#heroAvg').textContent=players.length?(players.reduce((s,p)=>s+p.rating,0)/players.length).toFixed(1):'—';
  const valid=players.length>=14&&players.length<=22;
  $('#heroReady').textContent=valid?'Hazır':'Değil'; els.draw.disabled=!valid;
  els.needed.textContent=players.length<14?`Kura için ${14-players.length} oyuncu daha`:players.length<=22?'Kura çekmeye hazır':'En fazla 22 oyuncu';
  els.hint.textContent=valid?'Takımlar aynı sayıda; tek sayıda bir takım 1 kişi fazla olur.':'Toplam oyuncu sayısı 14 ile 22 arasında olmalıdır.';
  if(!players.length){els.list.innerHTML='<div class="empty-state"><div>+</div><p>İlk oyuncuyu ekleyerek başla</p><span>14–22 oyuncu desteklenir</span></div>';return}
  els.list.innerHTML=players.map((p,i)=>`<div class="player-row"><span class="avatar">${initials(p.name)}</span><h4>${escapeHtml(p.name)}</h4><span class="pos">${p.position}</span><span class="stars">${stars(p.rating)}</span><button class="remove" data-i="${i}" aria-label="Oyuncuyu sil">×</button></div>`).join('');
  document.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{players.splice(+b.dataset.i,1);save()});
}

els.form.onsubmit=e=>{e.preventDefault();const name=els.name.value.trim();if(!name)return;if(players.length>=22){toast('En fazla 22 oyuncu eklenebilir');return}players.push({id:crypto.randomUUID(),name,rating:+els.rating.value,position:els.position.value});els.name.value='';save();els.name.focus()};
$('#clearAll').onclick=()=>{if(players.length&&confirm('Tüm oyuncular silinsin mi?')){players=[];localStorage.removeItem('sahaPlayers');render();resetResults()}};

function scoreTeams(a,b){
  const sum=x=>x.reduce((s,p)=>s+p.rating,0), count=(x,pos)=>x.filter(p=>p.position===pos).length;
  let score=Math.abs(sum(a)-sum(b))*8;
  for(const pos of POSITIONS)score+=Math.abs(count(a,pos)-count(b,pos))*(pos==='Kaleci'?10:4);
  score+=Math.abs(a.length-b.length)*20;return score;
}
function makeTeams(){
  let best=null,bestScore=Infinity;const targetA=Math.ceil(players.length/2);
  for(let attempt=0;attempt<1800;attempt++){
    const shuffled=[...players].sort(()=>Math.random()-.5).sort((a,b)=>b.rating-a.rating+(Math.random()-.5)*2);
    const a=[],b=[];
    shuffled.forEach(p=>{
      if(a.length>=targetA)b.push(p);else if(b.length>=players.length-targetA)a.push(p);else{
        const aTry=scoreTeams([...a,p],b),bTry=scoreTeams(a,[...b,p]);
        (aTry<bTry||(aTry===bTry&&Math.random()>.5)?a:b).push(p);
      }
    });
    const s=scoreTeams(a,b);if(s<bestScore){best=[a,b];bestScore=s;if(s===0)break}
  }return best;
}
function teamCard(team,name){
  const total=team.reduce((s,p)=>s+p.rating,0);const node=$('#teamTemplate').content.cloneNode(true);node.querySelector('h3').textContent=name;node.querySelector('.team-title strong').textContent=`${team.length} OYUNCU`;node.querySelector('.team-total').textContent=total;node.querySelector('.team-average').textContent=(total/team.length).toFixed(1);node.querySelector('.team-players').innerHTML=[...team].sort((a,b)=>POSITIONS.indexOf(a.position)-POSITIONS.indexOf(b.position)).map(p=>`<div class="team-player"><span class="avatar">${initials(p.name)}</span><b>${escapeHtml(p.name)}</b><span class="pos">${p.position}</span><span class="rating">${p.rating}</span></div>`).join('');return node;
}
function showTeams(){const [a,b]=makeTeams();els.results.innerHTML='<div class="team-results"><div class="results-head"><div><span class="step">02</span><h2>Dengeli kadrolar</h2></div><button class="reroll">↻ Yeniden çek</button></div></div>';const wrap=els.results.firstChild;wrap.append(teamCard(a,'Kırmızı Takım'),teamCard(b,'Mavi Takım'));const diff=Math.abs(a.reduce((s,p)=>s+p.rating,0)-b.reduce((s,p)=>s+p.rating,0));wrap.insertAdjacentHTML('beforeend',`<div class="balance-note">Puan farkı: <b>${diff}</b> · Pozisyonlar mümkün olan en yakın dağılımda</div>`);$('.reroll').onclick=showTeams;els.results.scrollIntoView({behavior:'smooth',block:'start'})}
function resetResults(){els.results.innerHTML='<div class="results-placeholder"><div class="pitch-icon"><span></span></div><span class="step">02</span><h2>Takımlar burada</h2><p>Oyuncu listesini tamamlayıp kurayı çektiğinde, dengeli kadroların burada görünecek.</p></div>'}
els.draw.onclick=showTeams;render();
