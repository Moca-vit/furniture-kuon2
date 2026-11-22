// Google Fontsは表示をじゃましないよう、あとから読み込む
(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Shippori+Mincho:wght@400;500&display=swap';document.head.appendChild(l);})();

// ヘッダー：スクロールしたら白地に
var h=document.getElementById('h');
addEventListener('scroll',function(){h.classList.toggle('s',scrollY>40)},{passive:true});

// ふわっと表示
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});

// 動画（hero以外）：最初は静止画。動画ファイルは再生する時に初めて読み込む（開いた瞬間の通信量と情報量を抑える）。
//   PC（マウスあり）  ：マウスを載せると再生、離すと停止
//   スマホ（タッチ） ：画面の中央に来た1本だけを、一度だけ再生して最後のコマで止める。タップで再生／停止／もう一度
var isMobile=window.matchMedia('(max-width:767px)').matches;
var canHover=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var conn=navigator.connection||{};
var saveData=conn.saveData===true||/(^|-)2g$/.test(conn.effectiveType||'');
var autoOnce=!canHover&&!reduce&&!saveData;   // スマホで自動の「一度だけ再生」を使うか
function hintText(box,t){var h=box.querySelector('.h-sp');if(h)h.textContent=t}
function playVid(box){
  var v=box.querySelector('video');
  if(!v.dataset.loaded){v.src=v.dataset.src;v.dataset.loaded='1'}
  if(v.ended){v.currentTime=0}
  var p=v.play();if(p&&p.catch)p.catch(function(){});
  box.classList.add('playing');
}
function stopVid(box){box.querySelector('video').pause();box.classList.remove('playing')}
function stopOthers(except){document.querySelectorAll('.pv.playing').forEach(function(b){if(b!==except)stopVid(b)})}
document.querySelectorAll('.pv').forEach(function(box){
  var v=box.querySelector('video');
  if(!canHover){
    v.loop=false;   // スマホは繰り返さず、1回で止める
    v.addEventListener('ended',function(){box.classList.remove('playing');hintText(box,box.dataset.lb?'TAP TO EXPAND':'TAP TO REPLAY')});
  }
  if(canHover){
    box.addEventListener('mouseenter',function(){playVid(box)});
    box.addEventListener('mouseleave',function(){stopVid(box)});
  }
  function toggle(){
    if(box.classList.contains('playing')){stopVid(box)}
    else{stopOthers(box);playVid(box)}
  }
  if(box.dataset.lb){box.addEventListener('click',function(){openVideoLB(box)})}   // WORKSの映像：クリック（タップ）で拡大表示
  else if(!canHover){box.addEventListener('click',toggle)}
  box.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();if(box.dataset.lb){openVideoLB(box)}else{toggle()}}});
});
if(autoOnce){
  // 画面の中央付近（上下35%を除いた帯）に入った動画を、まだ再生していなければ一度だけ再生
  var cio=new IntersectionObserver(function(es){es.forEach(function(e){
    var box=e.target,v=box.querySelector('video');
    if(e.isIntersecting){
      if(!box.dataset.once){box.dataset.once='1';stopOthers(box);playVid(box)}
    }else if(box.classList.contains('playing')){stopVid(box)}
  })},{rootMargin:'-35% 0px -35% 0px',threshold:0});
  document.querySelectorAll('.pv').forEach(function(box){cio.observe(box)});
}

// ヒーロー動画だけは自動再生：スマホ用/PC用を出し分け。通信量節約モード・「視覚効果を減らす」設定の人は静止画のまま
var hv=document.getElementById('hero-video');
if(!reduce&&!saveData){
  hv.src=isMobile?hv.dataset.srcM:hv.dataset.src;
  var hp=hv.play();if(hp&&hp.catch)hp.catch(function(){});
}

// 椅子の列：自動で左へゆっくり流れる／マウスを載せる・触れると止まる／矢印で早送り・巻き戻し（長押しで速く）
(function(){
  var rail=document.getElementById('rail'),track=document.getElementById('rail-track');
  if(!rail||!track)return;
  var prev=document.getElementById('rail-prev'),next=document.getElementById('rail-next');
  var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ① 同じ並びをもう1セット複製して、端がつながって見えるようにする
  var orig=[].slice.call(track.children);
  orig.forEach(function(f){var c=f.cloneNode(true);c.setAttribute('aria-hidden','true');track.appendChild(c)});
  rail.classList.add('auto');
  var DEFAULT=-1;                    // 標準の向き：-1＝左へ流れる（→で次の写真が右から現れる向き）
  var setW=0,pos=0,dir=DEFAULT,boost=1,paused=false,visible=true,dragging=false,dragX=0,dragPos=0,resumeAt=0;
  var BASE=36;                       // 1秒あたりに流れるpx（ゆっくり）
  function measure(){
    var gap=parseFloat(getComputedStyle(track).columnGap)||0;
    setW=orig.length*(orig[0].getBoundingClientRect().width+gap);
  }
  function render(){
    // pos が減るほど、画像は左へ流れる（pos が増えると右へ）
    pos=((pos%setW)+setW)%setW;
    track.style.transform='translate3d('+(pos-setW)+'px,0,0)';
  }
  var last=performance.now();
  function tick(now){
    var dt=Math.min(now-last,60)/1000;last=now;
    if(setW&&visible&&!dragging&&!document.hidden){
      var stopped=(paused&&boost===1)||reduceMotion&&boost===1||now<resumeAt&&boost===1;
      if(!stopped){pos+=dir*BASE*boost*dt;render()}
    }
    requestAnimationFrame(tick);
  }
  // ② ホバー（PC）で止める。離すと再開
  rail.addEventListener('mouseenter',function(){paused=true});
  rail.addEventListener('mouseleave',function(){paused=false});
  rail.addEventListener('focusin',function(){paused=true});
  rail.addEventListener('focusout',function(){paused=false});
  // ③ 指やマウスで直接ドラッグ。離したら2秒後に流れを再開
  rail.addEventListener('pointerdown',function(e){dragging=true;dragX=e.clientX;dragPos=pos;rail.classList.add('dragging');rail.setPointerCapture(e.pointerId)});
  rail.addEventListener('pointermove',function(e){if(!dragging)return;pos=dragPos+(e.clientX-dragX);render()});
  function endDrag(){if(!dragging)return;dragging=false;rail.classList.remove('dragging');resumeAt=performance.now()+2000}
  rail.addEventListener('pointerup',endDrag);rail.addEventListener('pointercancel',endDrag);
  // ④ 矢印：クリックで1枚ぶん、長押しで速く（右矢印＝次へ早送り、左矢印＝前へ巻き戻し）
  var stepAnim=null;
  function step(sign){
    var w=setW/orig.length,from=pos,to=pos+sign*w,t0=performance.now();
    cancelAnimationFrame(stepAnim);
    (function a(now){
      var k=Math.min((now-t0)/450,1),e=1-Math.pow(1-k,3);
      pos=from+(to-from)*e;render();
      if(k<1)stepAnim=requestAnimationFrame(a);
    })(t0);
    resumeAt=performance.now()+2500;
  }
  function holdable(btn,sign){
    var timer=null,held=false;
    function down(e){
      held=false;
      timer=setTimeout(function(){held=true;dir=sign;boost=8;},280); // 280ms以上押し続けたら早送り／巻き戻し
    }
    function up(){
      clearTimeout(timer);
      if(held){boost=1;dir=DEFAULT;resumeAt=performance.now()+1500}
      else if(timer!==null){step(sign)}
      timer=null;held=false;
    }
    btn.addEventListener('pointerdown',down);
    btn.addEventListener('pointerup',up);
    btn.addEventListener('pointerleave',function(){if(held){boost=1;dir=DEFAULT}clearTimeout(timer);timer=null;held=false});
    btn.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();step(sign)}});
  }
  holdable(next,-1);holdable(prev,1);   // →（次へ）は左へ動かす、←（前へ）は右へ動かす
  // ⑤ 画面の外にあるときは動かさない（電池・CPUの節約）
  new IntersectionObserver(function(es){visible=es[0].isIntersecting}).observe(rail);
  window.addEventListener('resize',function(){measure();render()});
  measure();render();requestAnimationFrame(tick);
})();

// ブランドフィルム（準備中）：静止画のスライドショー。自動で切り替え／一時停止ボタン／ドットで選択
(function(){
  var box=document.getElementById('story-slides');if(!box)return;
  var slides=[].slice.call(box.querySelectorAll('.slide')),dotsWrap=document.getElementById('slide-dots'),pause=document.getElementById('slide-pause'),title=document.getElementById('slide-title');
  var titles=['一本の木から、一脚を。','手で削り、整える。','住まいの中の、一脚へ。'];
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur=0,timer=null,paused=reduce,visible=true;
  var dots=slides.map(function(_,i){var b=document.createElement('button');b.type='button';b.appendChild(document.createElement('i'));b.setAttribute('aria-label',(i+1)+'枚目を表示');b.addEventListener('click',function(){show(i)});dotsWrap.appendChild(b);return b});
  function show(i){
    slides[cur].classList.remove('is-active');dots[cur].classList.remove('on');
    cur=(i+slides.length)%slides.length;
    slides[cur].classList.add('is-active');dots[cur].classList.add('on');
    if(title)title.textContent=titles[cur]||titles[0];
    restart();
  }
  function restart(){dotsWrap.classList.toggle('pz',paused);var f=dots[cur].firstChild;f.style.animation='none';void f.offsetWidth;f.style.animation='';clearInterval(timer);if(!paused&&visible)timer=setInterval(function(){show(cur+1)},5000)}
  function setPaused(p){paused=p;pause.classList.toggle('is-paused',p);pause.setAttribute('aria-label',p?'スライドショーを再生':'スライドショーを一時停止');restart()}
  pause.addEventListener('click',function(){setPaused(!paused)});
  new IntersectionObserver(function(es){visible=es[0].isIntersecting;restart()}).observe(box);
  // 先読み：スライド部分の1画面ぶん手前まで来たら、2・3枚目をまとめて読み込む
  var pre=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;slides.forEach(function(s){s.loading='eager'});pre.disconnect()},{rootMargin:'100% 0px'});
  pre.observe(box);
  dots[0].classList.add('on');setPaused(paused);
})();

// FAQ：1つ開くと前のが閉じる（openクラスの付け外し）
var faqItems=document.querySelectorAll('.faq-item');
faqItems.forEach(function(item){
  var b=item.querySelector('.faq-q');
  b.addEventListener('click',function(){
    var was=item.classList.contains('open');
    faqItems.forEach(function(o){o.classList.remove('open');o.querySelector('.faq-q').setAttribute('aria-expanded','false')});
    if(!was){item.classList.add('open');b.setAttribute('aria-expanded','true')}
  });
});

// ハンバーガー：classList.toggle('open')
var menuBtn=document.getElementById('menu-btn'),menuNav=document.getElementById('menu');
function toggleMenu(){
  menuNav.classList.toggle('open');menuBtn.classList.toggle('open');document.body.classList.toggle('open');
  var o=menuNav.classList.contains('open');
  menuBtn.setAttribute('aria-expanded',o);menuBtn.setAttribute('aria-label',o?'メニューを閉じる':'メニューを開く');
}
menuBtn.addEventListener('click',toggleMenu);
menuNav.addEventListener('click',function(e){if(e.target.closest('a')&&menuNav.classList.contains('open'))toggleMenu()});
window.matchMedia('(min-width:1024px)').addEventListener('change',function(e){if(e.matches&&menuNav.classList.contains('open'))toggleMenu()});

// トップへ戻る
var toTop=document.getElementById('to-top');
function tt(){toTop.classList.toggle('is-visible',scrollY>400)}
addEventListener('scroll',tt,{passive:true});tt();
toTop.addEventListener('click',function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})});

/* ===== ライトボックス（画像・動画の拡大表示） ===== */
(function(){
  function $(id){return document.getElementById(id)}
  var lb=$('lb'),img=$('lb-img'),vid=$('lb-vid'),cap=$('lb-cap'),btn=$('lb-x'),fig=lb.querySelector('figure');
  var prev=$('lb-prev'),next=$('lb-next'),pp=$('lb-pp'),snd=$('lb-snd'),count=$('lb-count'),prog=$('lb-prog');
  var last=null,downX=0,downY=0,items=[],cur=0,timer=0,soundOn=false;
  function setCap(f){var c=f&&f.querySelector('figcaption');cap.innerHTML=c?c.innerHTML:''}
  function lock(on){
    if(on){var sw=window.innerWidth-document.documentElement.clientWidth;document.body.style.overflow='hidden';if(sw)document.body.style.paddingRight=sw+'px'}
    else{document.body.style.overflow='';document.body.style.paddingRight=''}
  }
  function clean(){fig.style.transition='';fig.style.transform='';fig.style.transformOrigin=''}
  function flip(box,el){   // 小さい画面の位置 ⇄ 拡大位置 のあいだを、なめらかに動かす
    var a=box.getBoundingClientRect(),b=el.getBoundingClientRect();
    if(!b.width||!a.width)return null;
    return 'translate('+(a.left-b.left)+'px,'+(a.top-b.top)+'px) scale('+(a.width/b.width)+')';
  }
  /* ---- 画像 ---- */
  function openImg(src,f){
    clearTimeout(timer);clean();
    last=document.activeElement;
    lb.classList.remove('vid');lb.setAttribute('aria-label','画像の拡大表示');
    img.src=src.getAttribute('src');img.alt=src.alt||'';setCap(f);
    lock(true);lb.classList.add('on');lb.setAttribute('aria-hidden','false');btn.focus({preventScroll:true});
  }
  /* ---- 動画（WORKSの3本をまとめて見られる） ---- */
  function load(i,t){
    var b=items[i],v=b.querySelector('video');
    vid.style.setProperty('--ar',v.dataset.ar||'0.5625');
    vid.poster=v.getAttribute('poster')||'';
    vid.muted=!soundOn;
    vid.onloadedmetadata=function(){if(t&&vid.duration)vid.currentTime=t%vid.duration};
    vid.onloadeddata=function(){vid.style.opacity=1};
    vid.src=v.dataset.hd;
    var p=vid.play();if(p&&p.catch)p.catch(function(){});
    vid.setAttribute('aria-label',v.getAttribute('aria-label')||'');
    setCap(b.closest('figure'));
    count.textContent=(i+1)+' / '+items.length;prog.style.transform='scaleX(0)';
  }
  function openVid(box){
    items=[].slice.call(document.querySelectorAll('.pv[data-lb]'));cur=items.indexOf(box);if(cur<0)return;
    clearTimeout(timer);clean();
    var tv=box.querySelector('video'),t=tv.dataset.loaded?tv.currentTime:0;
    stopOthers(null);stopVid(box);                       // 小さい方のプレビューは止める
    last=document.activeElement;
    lb.classList.add('vid');lb.setAttribute('aria-label','映像の拡大表示');
    vid.style.opacity=1;load(cur,t);                     // プレビューの続きから再生
    fig.style.transition='none';fig.style.transform='none';
    lock(true);lb.classList.add('on');lb.setAttribute('aria-hidden','false');
    if(!reduce){
      var tr=flip(box,vid);
      if(tr){fig.style.transformOrigin='0 0';fig.style.transform=tr;void fig.offsetWidth;
        fig.style.transition='transform .55s cubic-bezier(.2,.7,.2,1)';fig.style.transform='none';
        timer=setTimeout(clean,620)}
    }
    btn.focus({preventScroll:true});
  }
  function go(d){
    if(!lb.classList.contains('vid'))return;
    cur=(cur+d+items.length)%items.length;
    vid.style.opacity=0;
    setTimeout(function(){load(cur,0)},200);
  }
  window.openVideoLB=openVid;
  /* ---- 閉じる ---- */
  function close(){
    if(!lb.classList.contains('on'))return;
    var isVid=lb.classList.contains('vid');
    if(isVid&&!reduce){   // 元の場所へ縮みながら閉じる
      var box=items[cur],r=box.getBoundingClientRect();
      if(r.bottom>0&&r.top<innerHeight){var tr=flip(box,vid);
        if(tr){fig.style.transformOrigin='0 0';fig.style.transition='transform .35s cubic-bezier(.4,0,.2,1)';fig.style.transform=tr}}
    }
    lb.classList.remove('on');lb.setAttribute('aria-hidden','true');lock(false);
    if(last&&last.focus)last.focus({preventScroll:true});
    clearTimeout(timer);
    timer=setTimeout(function(){clean();if(isVid){vid.pause();vid.removeAttribute('src');vid.load();lb.classList.remove('vid')}},isVid?450:0);
  }
  /* ---- 操作 ---- */
  document.addEventListener('pointerdown',function(e){downX=e.clientX;downY=e.clientY},true);
  document.addEventListener('click',function(e){
    if(lb.contains(e.target))return;
    if(Math.abs(e.clientX-downX)>6||Math.abs(e.clientY-downY)>6)return;   // ドラッグ操作は無視
    var t=e.target;
    if(t.id==='rail'||t.closest&&t.closest('#rail')&&t.tagName!=='IMG'){t=document.elementFromPoint(e.clientX,e.clientY)||t}  // 椅子レール：ドラッグ用の捕捉をすり抜けて画像を取得
    var im=t.closest&&t.closest('.zm img, .rail img');
    if(im)openImg(im,im.closest('figure'));
  });
  lb.addEventListener('click',function(e){if(e.target===lb)close()});    // 背景のクリックで閉じる
  btn.addEventListener('click',close);
  prev.addEventListener('click',function(){go(-1)});
  next.addEventListener('click',function(){go(1)});
  function toggleP(){if(vid.paused){var p=vid.play();if(p&&p.catch)p.catch(function(){})}else vid.pause()}
  pp.addEventListener('click',toggleP);vid.addEventListener('click',toggleP);
  vid.addEventListener('play',function(){pp.classList.remove('paused');pp.setAttribute('aria-label','一時停止')});
  vid.addEventListener('pause',function(){pp.classList.add('paused');pp.setAttribute('aria-label','再生')});
  vid.addEventListener('timeupdate',function(){if(vid.duration)prog.style.transform='scaleX('+(vid.currentTime/vid.duration)+')'});
  snd.addEventListener('click',function(){soundOn=!soundOn;vid.muted=!soundOn;snd.classList.toggle('on',soundOn);snd.setAttribute('aria-pressed',soundOn);snd.setAttribute('aria-label',soundOn?'音を消す':'音を出す')});
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('on'))return;
    if(e.key==='Escape')close();
    else if(e.key==='ArrowRight')go(1);
    else if(e.key==='ArrowLeft')go(-1);
    else if(e.key==='Tab'){   // 拡大中は、フォーカスを拡大表示の中だけで回す
      e.preventDefault();
      var f=[].filter.call(lb.querySelectorAll('button'),function(b){return b.getClientRects().length});
      var i=f.indexOf(document.activeElement);i=(i+(e.shiftKey?-1:1)+f.length)%f.length;f[i].focus();
    }
  });
  var sx=0,sy=0;   // スマホ：左右スワイプで前後の映像、下スワイプで閉じる
  lb.addEventListener('touchstart',function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY},{passive:true});
  lb.addEventListener('touchend',function(e){
    var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)go(dx<0?1:-1);
    else if(dy>80&&Math.abs(dy)>Math.abs(dx)*1.5)close();
  },{passive:true});
})();

/* ページ内リンクをやわらかく動かす：動きの速さ・なめらかさはここで調整（dur の数字） */
(function(){
  var root=document.documentElement,raf=0;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}           // ゆっくり始まり、ゆっくり止まる
  function target(el){var m=parseFloat(getComputedStyle(el).scrollMarginTop)||0;
    return Math.max(0,Math.min(el.getBoundingClientRect().top+window.scrollY-m,root.scrollHeight-window.innerHeight))}
  function stop(){if(raf){cancelAnimationFrame(raf);raf=0}root.style.scrollBehavior=''}
  ['wheel','touchstart','keydown','mousedown'].forEach(function(t){addEventListener(t,stop,{passive:true})});
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#"]');
    if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;
    var id=decodeURIComponent(a.getAttribute('href').slice(1)),el=id&&document.getElementById(id);
    if(!el)return;
    e.preventDefault();stop();
    var start=window.scrollY;
    if(reduce){window.scrollTo(0,target(el));return}
    var dur=Math.min(2400,Math.max(1200,Math.abs(target(el)-start)*0.8)),t0=performance.now();   // 1200〜2400ミリ秒
    root.style.scrollBehavior='auto';
    (function step(now){
      var p=Math.min(1,(now-t0)/dur),to=target(el);                      // 毎回、行き先を測り直す（画像の読み込みでずれても追従）
      window.scrollTo(0,start+(to-start)*ease(p));
      if(p<1)raf=requestAnimationFrame(step);else{raf=0;root.style.scrollBehavior=''}
    })(t0);
  });
})();
