var f=document.getElementById('f'),today=new Date();
function pad(n){return String(n).padStart(2,'0')}
var iso=today.getFullYear()+'-'+pad(today.getMonth()+1)+'-'+pad(today.getDate());

/* 入力チェック */
var MAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function mark(box,bad,msg,eid){box.classList.toggle('err',bad);var i=box.querySelector('input,select,textarea');if(i)i.setAttribute('aria-invalid',bad?'true':'false');if(msg&&eid)document.getElementById(eid).textContent=msg}
var nameI=document.getElementById('name'),mailI=document.getElementById('email'),agree=document.getElementById('agree'),cons=document.getElementById('cons');
function box(id){return document.getElementById(id).closest('.fld')}
function okName(){return nameI.value.trim().length>0}
function okMail(){return MAIL.test(mailI.value.trim())}
// 日にちのチェック：空欄／過去／水曜（定休日）
function chkDate(id,required){
  var i=document.getElementById(id),v=i.dataset.iso||'',b=box(id),e='e-'+id;
  if(!v){mark(b,required,required?'日にちを選んでください。':'',e);return !required}
  var d=new Date(v+'T00:00:00');
  if(d<new Date(iso+'T00:00:00')){mark(b,true,'本日以降の日にちを選んでください。',e);return false}
  if(d.getDay()===3){mark(b,true,'水曜は定休日です。別の日をお選びください。',e);return false}
  mark(b,false,'',e);return true;
}
['d1','d2','d3'].forEach(function(id){document.getElementById(id).addEventListener('change',function(){chkDate(id,id==='d1')})});
nameI.addEventListener('blur',function(){mark(box('name'),!okName())});
mailI.addEventListener('blur',function(){mark(box('email'),!okMail())});
nameI.addEventListener('input',function(){if(box('name').classList.contains('err'))mark(box('name'),!okName())});
mailI.addEventListener('input',function(){if(box('email').classList.contains('err'))mark(box('email'),!okMail())});
agree.addEventListener('change',function(){cons.classList.toggle('err',!agree.checked)});

f.addEventListener('submit',function(e){
  e.preventDefault();var bad=[];
  if(!chkDate('d1',true))bad.push(document.getElementById('d1'));
  if(!chkDate('d2',false))bad.push(document.getElementById('d2'));
  if(!chkDate('d3',false))bad.push(document.getElementById('d3'));
  mark(box('name'),!okName());if(!okName())bad.push(nameI);
  mark(box('email'),!okMail());if(!okMail())bad.push(mailI);
  cons.classList.toggle('err',!agree.checked);if(!agree.checked)bad.push(agree);
  if(bad.length){bad[0].focus({preventScroll:true});bad[0].scrollIntoView({block:'center',behavior:'smooth'});return}
  var btn=document.getElementById('send');btn.disabled=true;btn.textContent='送信しています…';
  setTimeout(showDone,700);
});

/* 送信後の画面（デモ：実際には送信しません） */
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var WD='日月火水木金土';
function fmt(v){if(!v)return '';var d=new Date(v+'T00:00:00');return (d.getMonth()+1)+'月'+d.getDate()+'日（'+WD[d.getDay()]+'）'}
function showDone(){
  var d=new FormData(f),I=function(id){return document.getElementById(id).dataset.iso||''},rows=[['お名前',d.get('name')],['メール',d.get('email')],['第1希望',fmt(I('d1'))]];
  if(I('d2'))rows.push(['第2希望',fmt(I('d2'))]);if(I('d3'))rows.push(['第3希望',fmt(I('d3'))]);
  rows.push(['時間帯',d.get('slot')||'どちらでも']);rows.push(['人数',d.get('ppl')||'1名']);
  var see=d.getAll('see');if(see.length)rows.push(['見たいもの',see.join('、')]);
  document.getElementById('sum').innerHTML=rows.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+esc(r[1])+'</dd>'}).join('');
  document.getElementById('page').hidden=true;document.getElementById('sticky').style.display='none';
  var done=document.getElementById('done');done.hidden=false;requestAnimationFrame(function(){done.classList.add('show')});
  window.scrollTo(0,0);document.getElementById('done-h').focus({preventScroll:true});
}
