/* ページを開いたときは必ず先頭から表示し、見えない状態からふわっと表示する（スクロールして戻る動きを見せない） */
(function(){try{history.scrollRestoration='manual'}catch(e){}
var nt='';try{nt=performance.getEntriesByType('navigation')[0].type}catch(e){}
if(location.hash){if(nt==='reload'||nt==='back_forward'){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}else return}
var h=document.documentElement;h.classList.add('pg-in');
function top(){h.style.scrollBehavior='auto';window.scrollTo(0,0);try{h.scrollIntoView({block:'start',behavior:'instant'})}catch(e){}h.style.scrollBehavior=''}
function go(){top();requestAnimationFrame(function(){h.classList.remove('pg-in')})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
var moved=false;['wheel','touchstart','keydown','mousedown'].forEach(function(t){addEventListener(t,function(){moved=true},{once:true,passive:true})});
addEventListener('load',function(){if(!moved)top()});
setTimeout(function(){h.classList.remove('pg-in')},1500);
})();
