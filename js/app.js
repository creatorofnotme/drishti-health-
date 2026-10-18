/* ===== events ===== */
document.addEventListener('click',e=>{const g=s=>e.target.closest(s);let x;
 if(g('[data-close]')){g('dialog').close();return}
 if(x=g('[data-fid]'))openF(x.dataset.fid);
 else if(x=g('[data-v]'))go({v:x.dataset.v});
 else if(x=g('[data-reg]')){const r=S.reg==x.dataset.reg?'':x.dataset.reg,keep=!r||!S.st||SM[S.st].r==r;go({reg:r,st:keep?S.st:'',d:keep?S.d:''})}
 else if(x=g('[data-t]'))go({type:x.dataset.t});
 else if(x=g('[data-st]')){const c=x.dataset.st,on=S.st==c;go({st:on?'':c,d:'',reg:(!on&&S.reg&&SM[c].r!=S.reg)?'':S.reg})}
 else if(x=g('[data-d]'))go({d:S.d==x.dataset.d?'':x.dataset.d});
 else if(x=g('[data-pick]'))pickState(x.dataset.pick,1);
 else if(x=g('[data-rk]'))go({risk:x.dataset.rk});
 else if(x=g('[data-ff]'))go({ff:x.dataset.ff});
 else if(x=g('[data-jump]')){const[v,r]=x.dataset.jump.split(':');go(r?{v,risk:r}:{v})}
 else if(x=g('[data-notify]')){const id=+x.dataset.notify;S.notified.add(id);toast('Escalated to the District Health Officer (simulated)');if(g('dialog'))keepFocus(()=>openF(id),$('watchD'),'[data-close]');S.still=1;render();S.still=0}
 else if(g('[data-reset]')){$('q').value='';go({reg:'',st:'',d:'',type:'All',q:'',cat:'',av:'all',risk:'all',ff:'all'})}
 else if(g('[data-more]')){S.lim+=24;S.still=1;render();S.still=0}
 else if(e.target.tagName=='DIALOG')e.target.close()});
document.addEventListener('change',e=>{const i=e.target.id;
 if(i=='fS')go({st:e.target.value,d:''});else if(i=='fD')go({d:e.target.value});else if(i=='mA')go({av:e.target.value});else if(i=='fC')go({cat:e.target.value===''?'':+e.target.value});
 else if(i=='lang'){const v=e.target.value;S.lang=v;document.documentElement.lang=v;document.documentElement.dir=v=='ur'?'rtl':'ltr';if(!DICT[v])toast('Labels for this language are coming. Showing English.');render()}});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const c=e.target.closest?e.target:null;if(!c)return;const x=c.closest('[data-fid][role=button]');if(x){e.preventDefault();openF(x.dataset.fid);return}
 const r=c.closest('tr[data-pick]');if(r&&c===r){e.preventDefault();pickState(r.dataset.pick,1)}});
/* a photo that fails to load is swapped for the placeholder (error events do not bubble, so listen in the capture phase) */
document.addEventListener('error',imgFallback,true);
/* spotlight on tiles, parallax on the hero scene */
let pmE=null;/* one spotlight update per animation frame instead of one per pointer event */
document.addEventListener('pointermove',e=>{if(!pmE)requestAnimationFrame(()=>{const ev=pmE;pmE=null;spot(ev)});pmE=e});
function spot(e){const k=e.target.closest&&e.target.closest('.kt');if(k){const r=k.getBoundingClientRect();k.style.setProperty('--mx',e.clientX-r.left+'px');k.style.setProperty('--my',e.clientY-r.top+'px')}
 const h=e.target.closest&&e.target.closest('.hero');if(h&&e.pointerType==='mouse'){const r=h.getBoundingClientRect();h.style.setProperty('--px',((e.clientX-r.left)/r.width-.5).toFixed(2));h.style.setProperty('--py',((e.clientY-r.top)/r.height-.5).toFixed(2))}}
document.addEventListener('pointerout',e=>{const h=e.target.closest&&e.target.closest('.hero');if(h&&!h.contains(e.relatedTarget)){h.style.setProperty('--px',0);h.style.setProperty('--py',0)}});
$('q').oninput=debounce(e=>go({q:e.target.value.trim().toLowerCase()}));
$('lang').innerHTML=LANGS.map(([c,n])=>`<option value="${c}">${n}</option>`).join('');

/* ===== theme ===== */
const root=document.documentElement,tb=$('themeB');
let th=null;try{th=localStorage.getItem('drishti-theme')}catch(e){}
if(th!=='dark'&&th!=='light')th=null;/* ignore anything else that may be stored */
function setTheme(t,save){root.dataset.theme=t;tb.innerHTML=svg(t=='dark'?'sun':'moon');const l='Switch to '+(t=='dark'?'light':'dark')+' theme';tb.title=l;tb.setAttribute('aria-label',l);if(save)try{localStorage.setItem('drishti-theme',t)}catch(e){}}
tb.onclick=()=>{setTheme(root.dataset.theme=='dark'?'light':'dark',1)};
setTheme(th||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
icons(document);render();
