const IC={swap:'<path d="M4 8h14l-3-3M20 16H6l3 3"/>',grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',bld:'<path d="M5 21V5l7-2 7 2v16M3 21h18M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',bell:'<path d="M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',moon:'<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
pill:'<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.2 9.2l5.6 5.6"/>',
users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><circle cx="17.5" cy="9" r="2.4"/><path d="M17 14c2.7 0 4.5 2 4.5 5"/>',
bed:'<path d="M3 19V6M3 14h18v5M21 14v-1.5A3.5 3.5 0 0017.5 9H11v5"/><circle cx="7" cy="10.5" r="1.9"/>',
doc:'<path d="M6 3v6a4 4 0 008 0V3M10 13v2a4 4 0 008 0v-1.5"/><circle cx="18" cy="11.5" r="2"/>',
flask:'<path d="M9 3h6M10 3v6l-5 9.2A2 2 0 006.7 21h10.6a2 2 0 001.7-2.8L14 9V3"/><path d="M7.8 15h8.4"/>',
alert:'<path d="M12 3.2l9.6 16.6H2.4z"/><path d="M12 10v4.6M12 17.6v.4"/>',
chev:'<path d="M9 6l6 6-6 6"/>',send:'<path d="M21 3L10 14M21 3l-6.5 18-4-7.5L3 9.5z"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>'};
const svg=(n,s=20)=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const icons=root=>root.querySelectorAll('[data-i]').forEach(e=>e.innerHTML=svg(e.dataset.i,e.classList.contains('ib')?20:19));
const $=id=>document.getElementById(id);
const PAL=['#1f36b0','#ef4b5b','#e8800f','#1f9a5c','#5b49d6'];
const col=s=>PAL[[...s].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
const ini=n=>n.split(' ').map(w=>w[0]).join('').slice(0,2);
const av=(n,s=36)=>`<span class="av" style="width:${s}px;height:${s}px;background:${col(n)}">${ini(n)}</span>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const fmt=v=>v==null?'\u2014':v.toLocaleString('en-IN');
const IMG_DIR='assets/hospitals/',IMG_PH=IMG_DIR+'placeholder.svg';
const POOL={CHC:IMAGES.filter(n=>/^\d/.test(n)),PHC:IMAGES.filter(n=>/^[a-z]/i.test(n))};
const himg=f=>{const p=POOL[f.t],ph=!p.length;
 return `<img class="him${ph?' ph':''}" src="${ph?IMG_PH:IMG_DIR+p[f.id%p.length]}" alt="${esc(f.n)} (illustrative photo)" loading="lazy" onerror="this.onerror=null;this.className='him ph';this.src='${IMG_PH}'">`};
const tyTag=(f,full)=>`<span class="ty ${f.t.toLowerCase()}" title="${TYPE_FULL[f.t]}" aria-label="${TYPE_FULL[f.t]}">${f.t}${full?' &middot; '+TYPE_FULL[f.t]:''}</span>`;
const catTag=(a,cls='')=>`<span class="ct ${CC[a.cat]} ${cls}" title="${CAT_HELP[a.cat]}">${CATS[a.cat]}</span>`;

/* count-up for [data-count] numbers (final value is already in the markup, so the page is complete without it) */
function fx(root=document){const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
 root.querySelectorAll('[data-count]').forEach(el=>{const to=+el.dataset.count,suf=el.dataset.suf||'';if(rm||to<2||el.dataset.done==to+suf)return;el.dataset.done=to+suf;
  const t0=performance.now(),d=800+Math.min(700,to/4);(function step(t){const p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(to*e))+suf;if(p<1)requestAnimationFrame(step)})(t0)})}
