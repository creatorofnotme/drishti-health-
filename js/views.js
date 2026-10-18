/* ===== STATE ===== */
const S={v:'dash',reg:'',st:'',d:'',type:'All',q:'',cat:'',lim:24,lang:'en',av:'all',risk:'all',ff:'all',notified:new Set(),still:0};
const VIEWS=[['dash','grid'],['map','map'],['fac','bld'],['alr','bell'],['pln','swap']];
function toast(m){const x=$('toast');x.textContent=m;x.classList.add('on');clearTimeout(toast.x);toast.x=setTimeout(()=>x.classList.remove('on'),2600)}
function go(o){const nv=o.v&&o.v!==S.v;Object.assign(S,o,{lim:24});render();if(nv)scrollTo({top:0,behavior:'smooth'})}
const cp=n=>n>=1e4?Math.round(n/1e3)+'k':n>=1e3?(n/1e3).toFixed(1)+'k':String(n);
const notifyBtn=(f,a)=>a.cat>=3?`<span class="rs">Auto-flagged to District Health Officer</span>`:`<button class="btn sm ${S.notified.has(f.id)?'ok':''}" data-notify="${f.id}" ${S.notified.has(f.id)?'disabled':''}>${svg(S.notified.has(f.id)?'check':'send',16)}${S.notified.has(f.id)?'Escalated to DHO':'Escalate to DHO'}</button>`;
const more=(n,tot)=>tot>n?'<div style="text-align:center;margin-top:18px"><button class="btn" data-more>Show more</button></div>':'';
const pills=a=>a.rs.map(r=>`<span class="rs ${r[0]==2?'c':''}">${esc(r[1])}</span>`).join('');

/* ===== VIEWS ===== */
const card=(f,i=0)=>{const a=an(f);return `<article class="card" style="--i:${i%12}"><button class="th" data-fid="${f.id}" aria-label="Open ${esc(f.n)}">${himg(f)}<span class="bdg">Illustrative photo</span>${catTag(a,'on-img')}</button>
 <div class="info">${av(f.n)}<div style="min-width:0;flex:1"><div class="tr"><h2 class="ti" aria-level="3">${esc(f.n)}</h2>${tyTag(f)}</div><div class="ch">${esc(f.d)}, ${esc(SM[f.st].n)}<br>${a.rs.length?esc(a.rs[0][1])+(a.rs.length>1?' +'+(a.rs.length-1):''):'No issues'}</div>
 <div class="acts"><span>${Math.round(a.mind)}d stock</span><span>${a.occp}% beds</span><span>${f.att}% att. &middot; ${a.dn}/${f.doc} on duty</span></div></div></div></article>`};
const planRow=(x,i=0)=>`<div class="al s${x.f?2:4}" style="--i:${i%12}"><div class="mv"><div class="mq ${x.f?'':'rq'}">${cp(x.mv)}<small>${x.f?'move':'order'}</small></div><div style="min-width:0"><b style="color:var(--hi)">${x.f?'Move':'Request'} ${fmt(x.mv)} ${x.nm}</b><div class="route"><span>${x.f?esc(x.f.n):'District drug store'}</span>${svg('arrow',16)}<span>${esc(x.to.n)}</span></div><div class="ch">${esc(x.to.d)} &bull; recipient has ${x.days.toFixed(1)} days left</div></div></div></div>`;

/* ===== HERO scene: sunrise over a CHC hub linked to the six most urgent centres of the current selection ===== */
const bld=(x,y,sc,sign,hub)=>`<g transform="translate(${x} ${y}) scale(${sc})"><ellipse cx="0" cy="2" rx="62" ry="5" fill="#000" opacity=".12"/><rect class="wall2" x="-46" y="-58" width="92" height="58" rx="3"/><rect class="wall" x="-46" y="-58" width="88" height="56" rx="3"/><path class="roof" d="M-54-58H54L44-72H-44z"/><path class="roofd" d="M-54-58H54L52-61H-52z"/>
 <rect class="win" x="-37" y="-46" width="17" height="15" rx="2"/><rect class="win" x="20" y="-46" width="17" height="15" rx="2"/><rect class="win" x="-37" y="-24" width="17" height="14" rx="2"/><rect class="win" x="20" y="-24" width="17" height="14" rx="2"/><rect class="roofd" x="-9" y="-27" width="18" height="27" rx="2"/>
 <rect class="sign" x="-27" y="-88" width="54" height="16" rx="5"/><text class="signt" x="0" y="-76.5"${hub?' style="font-size:8.4px"':''}>${sign}</text>${hub?'<g transform="translate(0 -100)"><rect class="cross" x="-3.5" y="-10" width="7" height="20" rx="1.5"/><rect class="cross" x="-10" y="-3.5" width="20" height="7" rx="1.5"/></g>':''}</g>`;
function heroScene(L){
 const top=L.map(f=>[f,an(f)]).sort((a,b)=>b[1].cat-a[1].cat||a[1].mind-b[1].mind).slice(0,6);
 const P=[[240,272,.62],[310,250,.55],[338,288,.5],[548,246,.58],[626,274,.66],[682,244,.46]],H=[436,272];
 const sat=top.map(([f,a],i)=>{const [x,y,sc]=P[i],py=y-92*sc-14,k=a.cat>=3?'p-r':a.cat>=1?'p-o':'p-g';
  return {arc:`<path class="arc" d="M${H[0]} 150Q${(H[0]+x)/2} ${Math.min(150,py)-64} ${x} ${py+16}" style="animation-delay:${-i*.4}s"/>`,
   b:bld(x,y,sc,f.t),
   pin:`<g class="pin ${k}" transform="translate(${x} ${py})" data-fid="${f.id}" role="button" tabindex="0" aria-label="${esc(f.n)}: ${CATS[a.cat]}"><title>${esc(f.n)} (${CATS[a.cat]})</title><g class="pb"><circle class="ring" r="14" cy="-9"/><path d="M0 14C-8 5-14 0-14-9A14 14 0 0 1 14-9C14 0 8 5 0 14Z"/><circle class="pc" r="7.5" cy="-9"/><text y="-4.2">${a.cat>=1?'!':'\u2713'}</text></g></g>`}});
 const stars=[[230,30],[320,60],[410,24],[500,50],[620,26],[680,60],[360,110],[460,96],[700,120]].map(([x,y],i)=>`<circle class="star" cx="${x}" cy="${y}" r="1.6" style="animation-delay:${-i*.6}s"/>`).join('');
 return `<svg viewBox="0 0 720 340" preserveAspectRatio="xMaxYMax slice" role="group" aria-label="Illustration: a community health centre linked to nearby primary health centres; red pins mark centres needing intervention">
 <g class="layer l-far">${stars}<circle class="sunglow" cx="585" cy="104" r="74"/><circle class="sun" cx="585" cy="104" r="34"/><g class="cloud"><ellipse cx="250" cy="72" rx="40" ry="11"/><ellipse cx="276" cy="64" rx="26" ry="11"/></g><g class="cloud c2"><ellipse cx="450" cy="44" rx="34" ry="9"/><ellipse cx="472" cy="38" rx="20" ry="9"/></g>
 <path class="mtn" d="M0 250L70 204 130 238 210 170 282 232 360 190 440 240 520 184 600 230 680 196 720 214V340H0Z"/></g>
 <g class="layer l-mid"><path class="h1" d="M0 262C110 238 220 264 340 250S600 234 720 260V340H0Z"/><path class="h2" d="M0 292C140 270 270 300 420 284S640 274 720 290V340H0Z"/>
 ${sat.map(x=>x.arc).join('')}${sat.map(x=>x.b).join('')}<g class="hub">${bld(H[0],H[1],1.5,'DRISHTI',1)}</g></g>
 <g class="layer l-near"><path class="h3" d="M0 318C170 302 330 324 720 304V340H0Z"/>${sat.map(x=>x.pin).join('')}</g></svg>`}
function hero(L,s){return `<section class="hero" aria-labelledby="hh"><div class="hero-copy"><span class="eyebrow">${svg('bell',14)} District operations &middot; simulated data</span>
 <h1 id="hh">Operational Gaps in <u><span class="g1">PHCs</span> &amp; <span class="g2">CHCs</span></u></h1>
 <p>Medicine stock, patient footfall, beds, doctors and tests across <b>${fmt(s.n)} centres</b>. Gaps surface early and supplies move to the centres that need them.</p>
 <div class="hero-cta"><button class="btn p" data-v="alr">${svg('bell',18)} Review alerts</button><button class="btn" data-v="pln">${svg('swap',18)} Redistribution plan</button></div></div>
 <div class="scene">${heroScene(L)}</div></section>`}

/* ===== KPI gap tiles (one bar per region) ===== */
function tiles(L,s){const A=L.map(f=>[f,an(f)]),R=Object.keys(REG).map(r=>A.filter(x=>SM[x[0].st].r==r));
 const bars=(fn)=>{const v=R.map(a=>a.length?fn(a):0),m=Math.max(...v,1e-9);return `<span class="kb" aria-hidden="true">${v.map((x,i)=>`<i style="--h:${Math.max(16,Math.round(100*x/m))};--k:${i}" title="${Object.values(REG)[i]}"></i>`).join('')}</span>`};
 const so=A.filter(x=>x[1].low.length).length,full=A.filter(x=>x[0].occ>=x[0].beds||x[1].occp>=90).length,ts=A.filter(x=>x[1].tests<6).length,eqn=A.filter(x=>x[1].eqd.length||x[0].inc).length,pc=v=>s.n?Math.round(100*v/s.n):0;
 const t=(c,ic,lab,val,suf,sub,b,jump,hint)=>`<button class="kt ${c}" data-jump="${jump}" title="${hint}"><span class="ki">${svg(ic,24)}</span><span class="kl">${lab}</span><span class="kn"><span data-count="${val}" data-suf="${suf}">${fmt(val)}${suf}</span></span><span class="ks">${sub}</span>${b}</button>`;
 return `<div class="kts">${
  t('t-red','pill','Medicine stock-out alerts',so,'',`${pc(so)}% of centres under 7 days`,bars(a=>a.filter(x=>x[1].low.length).length/a.length),'pln','Open the redistribution plan')+
  t('t-blue','users','Patient footfall (latest day)',s.fo,'',`forecast ${fmt(s.fc)} tomorrow`,bars(a=>a.reduce((q,x)=>q+x[0].fo[6],0)),'map','Open the map')+
  t('t-peach','bed','Centres with beds unavailable',full,'',`${pc(full)}% at 90%+ occupancy`,bars(a=>a.filter(x=>x[0].occ>=x[0].beds||x[1].occp>=90).length/a.length),'fac','Browse centres')+
  t('t-lav','doc','Doctor attendance',s.att,'%',`${s.watch+s.flag} centres flagged`,bars(a=>a.reduce((q,x)=>q+x[0].att,0)/a.length),'alr','Open alerts')+
  t('t-mint','flask','Test shortage',ts,'',`${pc(ts)}% missing a test`,bars(a=>a.filter(x=>x[1].tests<6).length/a.length),'alr','Open alerts')+
  t('t-sand','alert','Equipment down or active incident',eqn,'',`${pc(eqn)}% of centres`,bars(a=>a.filter(x=>x[1].eqd.length||x[0].inc).length/a.length),'alr','Open alerts')}</div>`}

/* ===== centre status ring + dot map of every centre in the selection ===== */
function statusPanel(L){const R=[0,1,2].map(r=>L.filter(f=>riskOf(f)==r).length),n=L.length||1,C=2*Math.PI*40;let off=0;
 const seg=[[2,'var(--cl)','Critical'],[1,'var(--hr)','Needs attention'],[0,'var(--okc)','Normal']].map(([r,c,l])=>{const len=C*R[r]/n,o=`<circle class="sg" cx="50" cy="50" r="40" stroke="${c}" style="--d:${Math.max(0,len-(R[r]&&R[r]<n?4:0)).toFixed(1)}" stroke-dasharray="${Math.max(0,len-(R[r]&&R[r]<n?4:0)).toFixed(1)} 400" stroke-dashoffset="${(-off).toFixed(1)}"/>`;off+=len;return o}).join('');
 const leg=[[2,'h','var(--cl)','Critical'],[1,'m','var(--hr)','Needs attention'],[0,'l','var(--okc)','Normal']].map(([r,k,c,l])=>`<button class="lgi" data-jump="map:${k}" title="Show ${l.toLowerCase()} centres on the map"><i style="background:${c}"></i>${l}<b>${R[r]}</b></button>`).join('');
 return `<div class="glass"><h3 class="sh2" aria-level="2">Centre status</h3><div class="stat"><div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="tr0" cx="50" cy="50" r="40"/>${seg}</svg><div class="mid"><b data-count="${L.length}">${fmt(L.length)}</b><span>centres</span></div></div><div class="lg">${leg}</div></div></div>`}
function underperf(L){const A=L.map(f=>[f,an(f)]).sort((a,b)=>b[1].cat-a[1].cat||a[1].mind-b[1].mind),T=A.filter(x=>x[1].cat>=2).slice(0,5);
 return `<div class="glass"><h3 class="sh2" aria-level="2">Underperforming centres</h3><div class="up">${T.map(([f,a])=>`<button class="upi" data-fid="${f.id}"><span class="ab">${svg('alert',20)}</span><span style="min-width:0"><b><span>${esc(f.n)}</span>${tyTag(f)}</b><small>${a.rs.slice(0,2).map(r=>esc(r[1])).join(' \u00b7 ')||'No issues'}</small></span>${svg('chev',18)}</button>`).join('')||'<p class="empty" style="padding:24px 0">No underperforming centres for these filters.</p>'}</div></div>`}

function vDash(L){const s=stats(L),crit=L.filter(f=>an(f).cat==4).sort((a,b)=>an(a).mind-an(b).mind),top=crit.slice(0,S.lim);
 return `<div style="--s:0">${hero(L,s)}</div><div style="--s:1">${tiles(L,s)}</div>
 <div class="dgrid" style="--s:2"><div style="display:grid;gap:16px;align-content:start">${statusPanel(L)}${underperf(L)}</div>${mapCard('Where the gaps are',L)}</div>
 <div style="--s:3"><div class="sec"><h3 class="sh2" aria-level="2">Centre status by category</h3></div><div class="cg">${[4,3,2,1,0].map(i=>`<div class="cs ${CC[i]}" title="${CAT_HELP[i]}"><b data-count="${s.cats[i]}">${s.cats[i]}</b><span>${CATS[i]}</span></div>`).join('')}</div>
 <p class="note">Critical Loss: stock-out within 3 days or no doctor posted &bull; High Risk: several issues at once &bull; Low Performance: attendance under 60% or fewer than 4 of 6 tests &bull; Warning: one issue to watch.</p></div>
 <div style="--s:4"><div class="sec"><h3 class="sh2" aria-level="2">Critical Loss centres (${crit.length})</h3><small>Lowest stock first</small></div><div class="grid">${top.map(card).join('')||'<p class="empty">No Critical Loss centres for these filters.</p>'}</div>${more(top.length,crit.length)}</div>`}

function vFac(L){L=[...L].sort((a,b)=>an(b).cat-an(a).cat||an(a).mind-an(b).mind);const sh=L.slice(0,S.lim);
 return `<h2 class="sr-only">Centres, most urgent first</h2><p class="ch" style="margin:0 0 12px">Showing ${sh.length} of ${L.length} centres, most urgent first</p><div class="grid">${sh.map(card).join('')||'<p class="empty">No centres match these filters.</p>'}</div>${more(sh.length,L.length)}`}

/* vAlr (Alerts) and vPln (Redistribution) live in js/analytics.js */

function render(){keepFocus(renderView)}
function renderView(){const L=mapFilt(DB.q({...S,t:S.type,c:S.cat})),dirty=S.reg||S.st||S.d||S.type!='All'||S.q||S.cat!==''||S.av!='all'||S.risk!='all'||S.ff!='all',rs=ST.filter(s=>!S.reg||s.r==S.reg),nf=L.filter(f=>an(f).lvl==2).length;
 $('rail').innerHTML=Object.entries(REG).map(([k,v])=>`<button class="srv ${S.reg==k?'on':''}" data-reg="${k}" aria-label="${v}" aria-pressed="${S.reg==k}" title="${v}">${k}</button>`).join('');
 const badge=v=>v=='alr'&&nf?`<span class="n">${nf}</span>`:'';
 $('nav').innerHTML=VIEWS.map(([v,i])=>`<button class="nv ${S.v==v?'on':''}" data-v="${v}"${S.v==v?' aria-current="page"':''}><span data-i="${i}" style="display:grid"></span>${t(v)}${badge(v)}</button>`).join('');
 $('tabs').innerHTML=VIEWS.map(([v,i])=>`<button class="${S.v==v?'on':''}" data-v="${v}" aria-label="${t(v)}"${S.v==v?' aria-current="page"':''}><span data-i="${i}" style="display:grid"></span>${t(v)}${badge(v)}</button>`).join('');
 $('cnt').textContent=DB.rows.length+' centres';$('prov').textContent='Verified: 0 \u00b7 Simulated: '+DB.rows.length+' \u00b7 Real-time feeds: not connected';
 $('bar').innerHTML=`<div class="rg chips">${Object.entries(REG).map(([k,v])=>`<button class="chip" data-reg="${k}" aria-pressed="${S.reg==k}">${v}</button>`).join('')}</div>
 <select id="fS" aria-label="State or UT"><option value="">All states &amp; UTs</option>${rs.map(s=>`<option value="${s.c}"${S.st==s.c?' selected':''}>${esc(s.n)}</option>`).join('')}</select>
 <select id="fD" aria-label="District"${S.st?'':' disabled'}><option value="">All districts</option>${S.st?SM[S.st].d.map(d=>`<option${S.d==d?' selected':''}>${esc(d)}</option>`).join(''):''}</select>
 ${['All','PHC','CHC'].map(x=>`<button class="chip" data-t="${x}" aria-pressed="${S.type==x}">${x=='All'?'PHC + CHC':x}</button>`).join('')}
 <select id="fC" aria-label="Centre status"><option value="">All statuses</option>${[4,3,2,1,0].map(i=>`<option value="${i}"${S.cat===i?' selected':''}>${CATS[i]}</option>`).join('')}</select>${dirty?'<button class="chip" data-reset>Clear filters</button>':''}`;
 const V=$('view');V.classList.toggle('enter',!S.still);
 V.innerHTML=(S.v=='dash'?'':`<h1 class="sr-only">${esc(t(S.v))}</h1>`)+(S.v!='map'&&(S.av!='all'||S.risk!='all'||S.ff!='all')?'<p class="fnote">Risk, footfall and availability filters from the map are applied here too. Use Clear filters to reset.</p>':'')+{dash:vDash,map:vMap,fac:vFac,alr:vAlr,pln:vPln}[S.v](L);
 document.title=t(S.v)+' | DRISHTI Health Surveillance';const msg=`${L.length} centres match the current filters`,sr=$('sr');if(sr.textContent!==msg)sr.textContent=msg;
 icons(document);fx(V)}

/* ===== centre profile ===== */
const roster=f=>f.docs.length?`<div class="tw"><table class="stt ro"><thead><tr><th scope="col">Doctor</th><th scope="col">Specialty</th><th scope="col">Duty today</th><th scope="col">7-day attendance</th></tr></thead><tbody>${f.docs.map((d,i)=>`<tr><td>Doctor ${i+1}<small class="ch" style="display:block;margin:0">name not provided</small></td><td>${esc(d[0])}</td><td><span class="dty ${d[1]}">${DUTY[d[1]]}</span></td><td><span class="ab7"><i class="${d[2]<60?'lo':''}" style="width:${d[2]}%"></i></span> ${d[2]}%</td></tr>`).join('')}</tbody></table></div>`:'<p class="ch"><b>No doctor posted.</b> This is a Critical Loss condition.</p>';
const eqList=f=>`<div>${EQ.map((e,i)=>{const v=f.eq[i];return `<span class="rs ${v==0?'c':v==2?'na':''}" title="${EQ_ST[v]}">${v==1?'\u2713':v==0?'\u2717':'\u2013'} ${e[0]}${v==1?'':' &middot; '+EQ_ST[v]}</span>`}).join('')}</div>`;
function openF(id){const f=DB.rows.find(x=>x.id==id),a=an(f),s=SM[f.st],mv=plan(DB.q({st:f.st,d:f.d,t:'All'})).filter(x=>x.to==f||x.f==f),k=(c,l,v,x)=>`<div class="kp ${c}"><small>${l}</small><b>${v}</b><span>${x}</span></div>`;
 $('watchC').innerHTML=`<div class="wg"><div><div class="th">${himg(f)}<span class="bdg">Illustrative photo</span>${catTag(a,'on-img')}</div><h2 id="watchT">${esc(f.n)} ${tyTag(f,1)}</h2>
 <div class="wrow">${av(f.n,40)}<div><b style="color:var(--hi)">${esc(f.d)}, ${esc(s.n)}</b><div class="ch" style="margin:0">${esc(f.loc)} &bull; ${f.lat.toFixed(2)}, ${f.lng.toFixed(2)} (approx.)</div></div><span style="margin-left:auto">${catTag(a)}</span></div>
 <div class="kg">${k('t-red',t('alr'),a.rs.length,CATS[a.cat])}${k('t-peach',t('stk'),Math.round(a.mind)+'d','lowest item left')}${k('t-blue',t('bed'),`${f.occ}/${f.beds}`,a.occp+'% occupied')}${k('t-lav',t('att'),f.att+'%',a.dn+' of '+f.doc+' on duty today')}${k('t-blue',t('foot'),f.fo[6],'tomorrow ~'+a.fc)}${k('t-mint',t('tst'),a.tests+'/6','available')}</div>
 <h3 class="sh2" aria-level="3">${t('stk')}: days left (forecast)</h3>${a.ms.map((x,i)=>`<div class="br"><span>${x.n}</span><i><u style="width:${Math.min(100,x.d/30*100)}%;animation-delay:${i*80}ms;${x.d<7?'':'background:linear-gradient(90deg,var(--sky),#7cc8ff)'}"></u></i><span class="ch" style="margin:0">${x.d.toFixed(1)}d${x.d<60?' &middot; '+new Date(+TODAY+x.d*DAY).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''}</span></div>`).join('')}
 <h3 class="sh2" aria-level="3" style="margin-top:18px">Doctors: duty today and 7-day attendance</h3>${roster(f)}
 <h3 class="sh2" aria-level="3" style="margin-top:18px">Equipment and infrastructure</h3>${eqList(f)}${f.inc?`<p class="inc"><b>Active incident:</b> ${esc(f.inc)}</p>`:''}</div>
 <div class="chat"><h3>${svg('bell',18)} Flags &amp; actions</h3><div>${a.rs.length?pills(a):'<p class="ch">No issues detected.</p>'}
 ${a.rs.length?`<h3 class="sh2" aria-level="3" style="margin-top:14px">Recommended actions</h3><ul class="rec">${recs(a).map(x=>`<li>${x}</li>`).join('')}</ul><div style="margin-top:12px">${notifyBtn(f,a)}</div>`:''}
 <h3 class="sh2" aria-level="3" style="margin-top:18px">Suggested transfers</h3>${mv.length?mv.slice(0,6).map((x,i)=>planRow(x,i)).join(''):'<p class="ch">None needed.</p>'}
 <h3 class="sh2" aria-level="3" style="margin-top:16px">${t('tst')}</h3>${TESTS.map((n,i)=>`<span class="rs ${f.tests[i]?'':'c'}">${f.tests[i]?'\u2713':'\u2717'} ${n}</span>`).join('')}
 <h3 class="sh2" aria-level="3" style="margin-top:18px">District administration</h3>${adminHTML(f.st,f.d)}
 <p class="ch" style="margin-top:14px"><span class="dsb">Simulated data</span> Not verified against any real record; location approximate; officer name not provided. Days left = stock / forecast daily usage (weighted moving average).</p></div></div></div>`;
 icons($('watchC'));if(!$('watchD').open)$('watchD').showModal()}
