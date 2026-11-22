
/* ---------- 都道府県の選択肢 ---------- */
var PREFS='北海道,青森県,岩手県,宮城県,秋田県,山形県,福島県,茨城県,栃木県,群馬県,埼玉県,千葉県,東京都,神奈川県,新潟県,富山県,石川県,福井県,山梨県,長野県,岐阜県,静岡県,愛知県,三重県,滋賀県,京都府,大阪府,兵庫県,奈良県,和歌山県,鳥取県,島根県,岡山県,広島県,山口県,徳島県,香川県,愛媛県,高知県,福岡県,佐賀県,長崎県,熊本県,大分県,宮崎県,鹿児島県,沖縄県'.split(',');
document.querySelectorAll('select[data-pref]').forEach(function(s){PREFS.forEach(function(p){var o=document.createElement('option');o.textContent=p;s.appendChild(o)})});

var f=document.getElementById('f'),LABEL={catalog:'カタログ請求',estimate:'お見積り依頼',repair:'修理のご相談',visit:'ご来店のご相談',trade:'設計者・不動産会社の方',other:'その他'};

/* ---------- ご用件に合わせて入力項目を切り替える ---------- */
var conds=[].slice.call(f.querySelectorAll('.cond')),hintEl=document.getElementById('pick-first');
function setType(v){
  conds.forEach(function(c){
    var on=!!v&&c.dataset.for.split(' ').indexOf(v)>-1;
    c.classList.toggle('open',on);c.inert=!on;
    c.querySelectorAll('input,select,textarea').forEach(function(el){el.disabled=!on});
  });
  hintEl.style.display=v?'none':'';
  if(v==='other'){hintEl.style.display='';hintEl.textContent='ご用件の追加項目はありません。下のメッセージ欄にご記入ください。'}
  else hintEl.textContent='先に「01 ご用件」を選ぶと、必要な項目がここに表示されます。';
  clearErr(document.getElementById('e-type'));
}
f.querySelectorAll('input[name=type]').forEach(function(r){r.addEventListener('change',function(){setType(r.value)})});
// リンク元（?type=catalog など）に合わせて最初から選んでおく
var q=new URLSearchParams(location.search).get('type'),qr=q&&f.querySelector('input[name=type][value="'+q+'"]');
if(qr){qr.checked=true;setType(q)}else setType('');
var today=new Date(),iso=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
// 選んだファイル名を表示
[['plan','plan-n','PDF・画像（あれば）'],['rphoto','rphoto-n','全体と傷みのある部分（あれば）']].forEach(function(a){
  var i=document.getElementById(a[0]),n=document.getElementById(a[1]);
  i.addEventListener('change',function(){n.textContent=i.files.length?[].map.call(i.files,function(x){return x.name}).join('、'):a[2]});
});

/* ---------- 入力チェック ---------- */
function clearErr(e){if(e)e.style.display=''}
function mark(box,bad){box.classList.toggle('err',bad);var inp=box.querySelector('input,select,textarea');if(inp)inp.setAttribute('aria-invalid',bad?'true':'false')}
var nameBox=document.getElementById('fl-name'),mailBox=document.getElementById('fl-email'),nameI=document.getElementById('name'),mailI=document.getElementById('email'),agree=document.getElementById('agree'),cons=document.getElementById('cons'),typeErr=document.getElementById('e-type');
var MAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function okName(){return nameI.value.trim().length>0}
function okMail(){return MAIL.test(mailI.value.trim())}
nameI.addEventListener('blur',function(){mark(nameBox,!okName())});
mailI.addEventListener('blur',function(){mark(mailBox,!okMail())});
nameI.addEventListener('input',function(){if(nameBox.classList.contains('err'))mark(nameBox,!okName())});
mailI.addEventListener('input',function(){if(mailBox.classList.contains('err'))mark(mailBox,!okMail())});
agree.addEventListener('change',function(){cons.classList.toggle('err',!agree.checked)});

f.addEventListener('submit',function(e){
  e.preventDefault();
  var type=(f.querySelector('input[name=type]:checked')||{}).value,bad=[];
  typeErr.style.display=type?'':'block';if(!type)bad.push(f.querySelector('input[name=type]'));
  mark(nameBox,!okName());if(!okName())bad.push(nameI);
  mark(mailBox,!okMail());if(!okMail())bad.push(mailI);
  cons.classList.toggle('err',!agree.checked);if(!agree.checked)bad.push(agree);
  if(bad.length){bad[0].focus({preventScroll:true});bad[0].scrollIntoView({block:'center',behavior:'smooth'});return}
  var btn=document.getElementById('send');btn.disabled=true;btn.textContent='送信しています…';
  setTimeout(function(){showDone(type)},700);
});

/* ---------- 送信後の画面（デモ：実際には送信しません） ---------- */
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function showDone(type){
  var d=new FormData(f),rows=[['受付番号','KUON-'+String(today.getFullYear()).slice(2)+String(today.getMonth()+1).padStart(2,'0')+String(today.getDate()).padStart(2,'0')+'-'+String(Math.floor(1000+Math.random()*9000))],['ご用件',LABEL[type]],['お名前',d.get('name')],['メール',d.get('email')]];
  var list=[].concat(d.getAll('cat'),d.getAll('items'),d.getAll('docs'));if(list.length)rows.push(['ご希望',list.join('、')]);
  var msg=(d.get('msg')||'').trim();if(msg)rows.push(['メッセージ',msg.length>80?msg.slice(0,80)+'…':msg]);
  document.getElementById('sum').innerHTML=rows.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+esc(r[1])+'</dd>'}).join('');
  document.getElementById('formpage').hidden=true;
  var done=document.getElementById('done');done.hidden=false;
  requestAnimationFrame(function(){done.classList.add('show')});
  window.scrollTo(0,0);document.getElementById('done-h').focus({preventScroll:true});
}
document.getElementById('again').addEventListener('click',function(e){e.preventDefault();location.href='contact.html'});
