/* ============================================================
   Verso Development, gedeeld script voor alle pagina's
   ============================================================ */

// ── NAV SCROLL + BACK TO TOP ──────────────────────────────
(function(){
  const navEl=document.getElementById('nav');
  const btt=document.getElementById('back-to-top');
  function onScroll(){
    if(navEl)navEl.classList.toggle('scrolled',window.scrollY>40);
    if(btt)btt.classList.toggle('show',window.scrollY>300);
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
})();

// ── HAMBURGER ─────────────────────────────────────────────
(function(){
  const ham=document.getElementById('nav-hamburger');
  const mob=document.getElementById('mobile-menu');
  if(!ham||!mob)return;
  function open(){ham.classList.add('open');mob.classList.add('open');ham.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';}
  function close(){ham.classList.remove('open');mob.classList.remove('open');ham.setAttribute('aria-expanded','false');document.body.style.overflow='';}
  ham.addEventListener('click',()=>mob.classList.contains('open')?close():open());
  mob.querySelectorAll('a').forEach(l=>l.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
})();

// ── REVEAL ────────────────────────────────────────────────
(function(){
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
})();

// ── SMOOTH ANCHORS ────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{const id=a.getAttribute('href');if(id==='#'||id.length<2)return;const t=document.querySelector(id);if(!t)return;e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});});
});

// ── FAQ ACCORDION ─────────────────────────────────────────
document.querySelectorAll('.faq-q').forEach(q=>{
  q.addEventListener('click',()=>{q.closest('.faq-item').classList.toggle('open');});
});

// ── LANGUAGE ──────────────────────────────────────────────
const langBtn=document.getElementById('langToggle');
let currentLang=localStorage.getItem('verso-lang')||'nl';
function applyLang(lang){
  currentLang=lang;
  if(langBtn)langBtn.textContent=lang==='nl'?'EN':'NL';
  localStorage.setItem('verso-lang',lang);
  document.querySelectorAll('[data-nl]').forEach(el=>{const v=el.getAttribute('data-'+lang);if(v!=null){if(el.children.length>0||v.includes('<'))el.innerHTML=v;else el.textContent=v;}});
  document.documentElement.lang=lang;
}
function toggleLang(){applyLang(currentLang==='nl'?'en':'nl');}
applyLang(currentLang);
