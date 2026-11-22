var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var stage=document.getElementById('stage'),cap=document.getElementById('cap2'),timers=[];
var LINES=['部品を、ひとつずつ。','脚を立てて、貫でつなぎます。','座面をのせ、背を組みます。','できあがりました。あとは仕上げを少し。'];
function say(t){cap.style.opacity=0;setTimeout(function(){cap.textContent=t;cap.style.opacity=1},180)}
cap.style.transition='opacity .25s';
function play(){
  timers.forEach(clearTimeout);timers=[];
  stage.classList.remove('go','done','ex');void stage.getBoundingClientRect();
  cap.textContent=LINES[0];
  if(reduce){stage.classList.add('go','done');cap.textContent='仕立て中のイメージです。';return}
  stage.classList.add('go');
  timers.push(setTimeout(function(){say(LINES[1])},900));
  timers.push(setTimeout(function(){say(LINES[2])},2000));
  timers.push(setTimeout(function(){stage.classList.add('done');say(LINES[3])},3700));
  timers.push(setTimeout(function(){say('カーソルを重ねる（タップする）と、分解図になります。')},7200));
}
document.getElementById('replay').addEventListener('click',play);
// スマホ：タップで分解図 ⇄ 組み立て
stage.addEventListener('click',function(){if(stage.classList.contains('done'))stage.classList.toggle('ex')});
stage.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&stage.classList.contains('done')){e.preventDefault();stage.classList.toggle('ex')}});
play();

// 進み具合のバー：画面に入ったら伸びる＋数字が増える
var bars=document.getElementById('bars');
function runBars(){
  [].forEach.call(bars.children,function(li,k){
    var v=+li.dataset.v,s=+li.dataset.s,i=li.querySelector('i'),n=li.querySelector('.n');
    [].forEach.call(li.querySelectorAll('.stg span'),function(sp,j){sp.classList.toggle('on',j<=s)});
    if(reduce){i.style.width=v+'%';n.textContent=v;return}
    setTimeout(function(){i.style.width=v+'%'},150*k);
    var t0=performance.now()+150*k;
    (function tick(t){var p=Math.min(1,Math.max(0,(t-t0)/2200));n.textContent=Math.round(v*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)})(performance.now());
  });
}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);if(e.target.contains(bars))runBars()}})},{threshold:.2});
document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
