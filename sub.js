/* 久遠 KUON — サブページ共通JS（フォント・ふわっと表示・FAQ・読み進み線・目次・下固定バー） */
(function(){
  var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Shippori+Mincho:wght@400;500&display=swap';document.head.appendChild(l);
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 先頭へ戻る矢印（全ページ共通）
  var tt=document.getElementById('to-top');
  if(!tt){tt=document.createElement('button');tt.id='to-top';tt.type='button';tt.setAttribute('aria-label','ページの先頭へ戻る');tt.textContent='↑';document.body.appendChild(tt)}
  tt.addEventListener('click',function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})});

  // ふわっと表示
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});

  // よくある質問（開閉）
  document.querySelectorAll('.faq-q').forEach(function(b){
    b.addEventListener('click',function(){b.setAttribute('aria-expanded',b.getAttribute('aria-expanded')==='true'?'false':'true')});
  });

  // 読み進み線
  var rp=document.getElementById('rp');
  function onScroll(){
    var h=document.documentElement.scrollHeight-innerHeight,y=scrollY;
    if(rp)rp.style.transform='scaleX('+(h>0?Math.min(1,y/h):0)+')';
    tt.classList.toggle('is-visible',y>600);
    if(st){
      var foot=document.querySelector('footer').getBoundingClientRect().top,tgt=document.getElementById('reserve'),hide=false;
      if(tgt){var r=tgt.getBoundingClientRect();hide=r.top<innerHeight*.6&&r.bottom>0}   // 予約フォームが見えている間は隠す
      st.classList.toggle('on',y>520&&foot>innerHeight*.9&&!hide);
      document.body.classList.toggle('sticky-on',st.classList.contains('on'));
    }
  }
  var st=document.getElementById('sticky');
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  // 目次：いまの位置を表示
  var links=[].slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if(links.length&&'IntersectionObserver' in window){
    var map={};links.forEach(function(a){var s=document.querySelector(a.getAttribute('href'));if(s)map[s.id]=a});
    var io2=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){links.forEach(function(a){a.classList.remove('on')});var a=map[e.target.id];if(a){a.classList.add('on');
        var box=a.parentNode;if(box.scrollWidth>box.clientWidth)box.scrollTo({left:a.offsetLeft-24,behavior:reduce?'auto':'smooth'})}}
    })},{rootMargin:'-30% 0px -60% 0px'});
    Object.keys(map).forEach(function(id){io2.observe(document.getElementById(id))});
  }

  // ===== 日にち選択：入力欄をクリックするとカレンダーが開き、定休日（水曜）は選べない =====
  var WD='日月火水木金土';
  function pad(n){return String(n).padStart(2,'0')}
  function isoOf(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function show(d){return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日（'+WD[d.getDay()]+'）'}
  var pop=null,cur=null,vy=0,vm=0,focusIso=null,opts=null;
  function build(){
    pop=document.createElement('div');pop.className='dpop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','日にちを選ぶ');
    pop.innerHTML='<div class="dp-hd"><button type="button" class="dp-nv" data-d="-1" aria-label="前の月">‹</button><span class="dp-ttl" aria-live="polite"></span><button type="button" class="dp-nv" data-d="1" aria-label="次の月">›</button></div>'+
      '<div class="dp-wk" aria-hidden="true">'+WD.split('').map(function(c){return '<span>'+c+'</span>'}).join('')+'</div><div class="dp-gr" role="grid"></div>'+
      '<div class="dp-foot"><span class="dp-note"></span><button type="button" class="dp-clr">日にちをクリア</button></div>';
    document.body.appendChild(pop);
    pop.querySelectorAll('.dp-nv').forEach(function(b){b.addEventListener('click',function(){move(+b.dataset.d)})});
    pop.querySelector('.dp-clr').addEventListener('click',function(){setVal(null)});
    pop.addEventListener('keydown',onKey);
    document.addEventListener('pointerdown',function(e){if(cur&&!pop.contains(e.target)&&e.target!==cur&&!(cur.parentNode&&cur.parentNode.contains(e.target)))close(false)});
    addEventListener('resize',place);addEventListener('scroll',place,{passive:true});
  }
  function cfg(i){
    var t=new Date();t=new Date(t.getFullYear(),t.getMonth(),t.getDate());
    var max=new Date(t.getTime());max.setDate(max.getDate()+(+i.dataset.max||180));
    return {min:t,max:max,closed:i.dataset.closed===''||i.dataset.closed==null?-1:+i.dataset.closed,label:i.dataset.closedLabel||''};
  }
  function state(d){   // その日が選べない理由
    if(d<opts.min)return 'past';if(d>opts.max)return 'far';if(d.getDay()===opts.closed)return 'closed';return '';
  }
  function render(){
    pop.querySelector('.dp-ttl').textContent=vy+'年'+(vm+1)+'月';
    var mi=new Date(opts.min.getFullYear(),opts.min.getMonth(),1),ma=new Date(opts.max.getFullYear(),opts.max.getMonth(),1),v=new Date(vy,vm,1);
    pop.querySelector('[data-d="-1"]').disabled=v<=mi;pop.querySelector('[data-d="1"]').disabled=v>=ma;
    var gr=pop.querySelector('.dp-gr');gr.innerHTML='';
    var first=new Date(vy,vm,1).getDay(),days=new Date(vy,vm+1,0).getDate(),sel=cur.dataset.iso||'',now=isoOf(opts.min);
    for(var k=0;k<first;k++)gr.appendChild(document.createElement('i'));
    for(var d=1;d<=days;d++){
      var dt=new Date(vy,vm,d),s=state(dt),b=document.createElement('button'),id=isoOf(dt);
      b.type='button';b.dataset.iso=id;b.tabIndex=-1;b.innerHTML=d+(s==='closed'?'<small>休</small>':'');
      if(s){b.setAttribute('aria-disabled','true');if(s==='closed'){b.className='closed';b.setAttribute('aria-label',show(dt)+'：定休日です')}}
      else b.setAttribute('aria-label',show(dt));
      if(id===sel){b.classList.add('sel');b.setAttribute('aria-pressed','true')}
      if(id===now)b.classList.add('today');
      b.addEventListener('click',function(){if(this.getAttribute('aria-disabled')==='true')return;setVal(this.dataset.iso)});
      gr.appendChild(b);
    }
    pop.querySelector('.dp-note').textContent=opts.closed>=0?(WD[opts.closed]+'曜は定休日です'):'';
    var f=gr.querySelector('[data-iso="'+focusIso+'"]')||gr.querySelector('.sel')||gr.querySelector('button:not([aria-disabled])')||gr.querySelector('button');
    if(f)f.tabIndex=0;
  }
  function move(n){var d=new Date(vy,vm+n,1);vy=d.getFullYear();vm=d.getMonth();render()}
  function place(){
    if(!cur||!pop.classList.contains('on'))return;
    var r=cur.getBoundingClientRect(),w=Math.min(340,innerWidth-24);pop.style.width=w+'px';
    var left=Math.max(12,Math.min(r.left,innerWidth-w-12)),h=pop.offsetHeight,top=r.bottom+6;
    if(top+h>innerHeight-8&&r.top-h-6>8)top=r.top-h-6;
    pop.style.left=left+'px';pop.style.top=Math.max(8,top)+'px';
  }
  function open(i){
    if(!pop)build();cur=i;opts=cfg(i);
    var base=i.dataset.iso?new Date(i.dataset.iso+'T00:00:00'):opts.min;vy=base.getFullYear();vm=base.getMonth();focusIso=i.dataset.iso||null;
    render();pop.classList.add('on');i.setAttribute('aria-expanded','true');place();
    setTimeout(function(){var f=pop.querySelector('.dp-gr button[tabindex="0"]');if(f)f.focus({preventScroll:true})},30);
  }
  function close(refocus){
    if(!pop||!cur)return;pop.classList.remove('on');cur.setAttribute('aria-expanded','false');
    var i=cur;cur=null;if(refocus)i.focus({preventScroll:true});
  }
  function setVal(iso){
    var i=cur;if(!i)return;
    if(iso){var d=new Date(iso+'T00:00:00');i.dataset.iso=iso;i.value=show(d)}else{delete i.dataset.iso;i.value=''}
    i.dispatchEvent(new Event('change',{bubbles:true}));close(true);
  }
  function onKey(e){
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);return}
    var t=e.target.closest&&e.target.closest('.dp-gr button');if(!t)return;
    var d=new Date(t.dataset.iso+'T00:00:00'),n=0;
    if(e.key==='ArrowLeft')n=-1;else if(e.key==='ArrowRight')n=1;else if(e.key==='ArrowUp')n=-7;else if(e.key==='ArrowDown')n=7;
    else if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();var m=new Date(d.getFullYear(),d.getMonth()+(e.key==='PageUp'?-1:1),d.getDate());goto(m);return}
    else return;
    e.preventDefault();d.setDate(d.getDate()+n);goto(d);
  }
  function goto(d){
    var lo=new Date(opts.min.getFullYear(),opts.min.getMonth(),1),hi=new Date(opts.max.getFullYear(),opts.max.getMonth()+1,0);
    if(d<lo||d>hi)return;vy=d.getFullYear();vm=d.getMonth();focusIso=isoOf(d);render();
    var f=pop.querySelector('[data-iso="'+focusIso+'"]');if(f){f.tabIndex=0;f.focus({preventScroll:true})}
  }
  document.querySelectorAll('input[data-date]').forEach(function(i){
    i.readOnly=true;i.setAttribute('autocomplete','off');i.setAttribute('aria-haspopup','dialog');i.setAttribute('aria-expanded','false');
    i.addEventListener('click',function(){if(cur===i)close(false);else open(i)});
    i.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){e.preventDefault();open(i)}});
  });

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
    try{history.pushState(null,'','#'+id)}catch(x){}
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
