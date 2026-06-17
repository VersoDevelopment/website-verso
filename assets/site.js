/* ============================================================
   Verso Development, gedeeld script voor servicepagina's
   ============================================================ */

// ── WEBGL SHADER (Serene Galaxy) ──────────────────────────
(function(){
  const canvas=document.getElementById('bg-canvas');
  if(!canvas)return;
  const gl=canvas.getContext('webgl');
  if(!gl)return;
  const vert=`attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}`;
  const frag=`precision highp float;uniform float t;uniform vec2 r;
    const vec3 cBg=vec3(0.024,0.055,0.125);
    const vec3 cA=vec3(0.75,0.75,1.0);
    const vec3 cB=vec3(0.376,0.643,0.98);
    const vec3 cC=vec3(0.545,0.361,0.965);
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec2 uv=gl_FragCoord.xy/r.xy;float asp=r.x/r.y;
      vec2 p=(uv-0.5);p.x*=asp;
      float pt=t*0.1;
      float path=sin(uv.y*2.5+pt*2.0)*0.2+cos(uv.y*4.2-pt*1.5)*0.08+sin(uv.y*1.2+pt*0.8)*0.15;
      float d=abs(p.x-path);
      float flow=t*0.015;vec2 st=vec2(p.x,uv.y+flow);
      float dm=smoothstep(0.4,0.0,d);float sm=smoothstep(0.08,0.0,d);
      float n1=hash(floor(st*400.0));float s1=step(0.992,n1)*dm;
      float n2=hash(floor(st*250.0));float s2=step(0.985,n2)*dm;
      float n3=hash(floor(st*120.0));float tw=sin(t*0.5+n3*100.0)*0.5+0.5;float s3=step(0.98,n3)*dm*tw;
      float stars=s1*0.8+s2*1.2+s3*2.5;
      float neb=smoothstep(0.3,0.0,d)*0.25+smoothstep(0.05,0.0,d)*0.4;
      float ct=t*0.1;
      vec3 pc=mix(cA,cB,sin(uv.y*2.0+ct)*0.5+0.5);
      pc=mix(pc,cC,cos(uv.y*3.0-ct*0.8)*0.3+0.3);
      vec3 col=cBg+pc*neb*0.6+pc*stars+vec3(1)*sm*neb*0.3;
      col+=vec3(0.8,0.9,1.0)*pow(hash(uv*1000.0),100.0)*0.15;
      gl_FragColor=vec4(col,1);
    }`;
  function mk(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
  const prog=gl.createProgram();
  gl.attachShader(prog,mk(gl.VERTEX_SHADER,vert));
  gl.attachShader(prog,mk(gl.FRAGMENT_SHADER,frag));
  gl.linkProgram(prog);gl.useProgram(prog);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const tLoc=gl.getUniformLocation(prog,'t'),rLoc=gl.getUniformLocation(prog,'r');
  function render(now){
    if(canvas.width!==window.innerWidth||canvas.height!==window.innerHeight){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform1f(tLoc,now*.001);gl.uniform2f(rLoc,canvas.width,canvas.height);
    gl.drawArrays(gl.TRIANGLES,0,6);requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();

// ── MAGNETIC BUTTONS ──────────────────────────────────────
document.querySelectorAll('.magnetic').forEach(btn=>{
  btn.addEventListener('mousemove',e=>{const r=btn.getBoundingClientRect();const x=e.clientX-r.left-r.width/2;const y=e.clientY-r.top-r.height/2;btn.style.transform=`translate(${x*.25}px,${y*.25}px) scale(1.03)`;});
  btn.addEventListener('mouseleave',()=>{btn.style.transform='';});
});

// ── NAV SCROLL + BACK TO TOP ──────────────────────────────
(function(){
  const navEl=document.getElementById('nav');
  const btt=document.getElementById('back-to-top');
  window.addEventListener('scroll',()=>{
    if(navEl)navEl.classList.toggle('scrolled',window.scrollY>80);
    if(btt)btt.classList.toggle('show',window.scrollY>300);
  },{passive:true});
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
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:.12});
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

// ── THEME ─────────────────────────────────────────────────
const themeBtn=document.getElementById('themeToggle');
const sunSvg=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const moonSvg=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
function applyTheme(light){document.body.classList.toggle('light',light);const mTBtn=document.getElementById('mobileThemeToggle');const icon=light?moonSvg:sunSvg;if(themeBtn)themeBtn.innerHTML=icon;if(mTBtn)mTBtn.innerHTML=icon+' '+(light?'Donker':'Licht');localStorage.setItem('verso-theme',light?'light':'dark');}
function toggleTheme(){applyTheme(!document.body.classList.contains('light'));}
applyTheme(localStorage.getItem('verso-theme')==='light');

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
