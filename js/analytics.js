/* ===== ANALYTICS VIEWS: Alerts and Redistribution =====
   KPI tiles -> charts (all clickable filters) -> database-style table with expandable rows.
   Everything is computed in the browser from the same simulated dataset (an(), plan() in store.js).
   Wrapped in a function so it adds nothing to the global scope except vAlr and vPln. */
(function(){
const GAP=[['s','Stock-out risk','var(--cl)'],['b','Bed pressure','var(--hr)'],['a','Doctor gaps','var(--lp)'],['t','Test gaps','var(--sky)'],['q','Equipment down','var(--wn)'],['i','Active incident','var(--or2)']];
const AS={af:'',ac:'',sort:'sev',dir:-1,med:-1,open:new Set()};
const PS={med:-1,kind:'all',urg:'all',sort:'days',dir:1,cm:-1,open:new Set(),appr:new Set()};
const LAST={alr:[],pln:[]};
const had=(a,k)=>a.rs.some(r=>r[2]==k);
const sum=(a,f)=>a.reduce((x,y)=>x+f(y),0);
const dstr=d=>new Date(+TODAY+d*DAY).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v||1))),m=v/p;return(m<=1?1:m<=2?2:m<=5?5:10)*p};
const pct=(a,b)=>b?Math.round(100*a/b):0;
const rr=()=>{S.still=1;render();S.still=0};
const recFor=r=>r[1]=='No doctor posted'?'Deploy a doctor immediately: rotation from the nearest CHC or an emergency locum.':REC[r[2]];
const CATCOL=['var(--okc)','var(--wn)','var(--lp)','var(--hr)','var(--cl)'];
let CHN=0;

/* ---------- small chart helpers (plain SVG/HTML, no library) ---------- */
function lineChart(o){
 const W=600,H=o.h||250,l=44,r=16,tp=16,bb=o.bars?56:0,b=26+bb,pw=W-l-r,ph=H-tp-b,n=o.xs.length,id='g'+(++CHN);
 const vals=o.series.flatMap(s=>s.y).concat((o.hl||[]).map(h=>h.y)),mx=Math.max(...vals),mn=Math.min(...vals);
 let lo=0,hi=Math.max(1,nice(mx*1.04));
 if(o.auto){const sp=(mx-mn)||mx*.1||1;lo=Math.max(0,mn-sp*.35);hi=mx+sp*.25}
 if(o.max)hi=o.max;
 const X=i=>l+(n>1?i*pw/(n-1):pw/2),Y=v=>tp+ph*(1-(Math.min(v,hi)-lo)/(hi-lo)),tick=v=>(hi-lo)>=6?cp(Math.round(v)):v.toFixed(1);
 let d='',s='';
 o.series.forEach((se,si)=>{d+=`<linearGradient id="${id}${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${se.c}" stop-opacity=".28"/><stop offset="1" stop-color="${se.c}" stop-opacity="0"/></linearGradient>`});
 const gn=o.grid||4;for(let k=0;k<=gn;k++){const v=lo+(hi-lo)*k/gn,y=Y(v);s+=`<line class="gl" x1="${l}" x2="${W-r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text x="${l-7}" y="${(y+3.5).toFixed(1)}" text-anchor="end">${tick(v)}</text>`}
 const st=Math.max(1,Math.ceil(n/8));
 o.xs.forEach((x,i)=>{if(i%st==0)s+=`<text x="${X(i).toFixed(1)}" y="${tp+ph+16}" text-anchor="middle">${x}</text>`});
 (o.vl||[]).forEach(v=>{const x=X(v.i);s+=`<line x1="${x}" x2="${x}" y1="${tp}" y2="${tp+ph}" stroke="${v.c}" stroke-dasharray="4 4" opacity=".75"/><text x="${x+4}" y="${tp+10}" style="fill:${v.c}">${v.label}</text>`});
 (o.hl||[]).forEach(h=>{const y=Y(h.y);s+=`<line x1="${l}" x2="${W-r}" y1="${y}" y2="${y}" stroke="${h.c}" stroke-dasharray="5 4" opacity=".8"/><text x="${W-r}" y="${y-5}" text-anchor="end" style="fill:${h.c}">${h.label}</text>`});
 if(o.bars){const bt=tp+ph+26,bh=bb-8,mid=bt+bh/2,m=Math.max(1,...o.bars.y.map(Math.abs)),bw=Math.min(26,pw/n*.5);
  s+=`<line class="gl" x1="${l}" x2="${W-r}" y1="${mid}" y2="${mid}"/><text x="${l-7}" y="${mid+3.5}" text-anchor="end">Δ</text>`;
  o.bars.y.forEach((v,i)=>{const h=Math.abs(v)/m*(bh/2-2);s+=`<rect x="${(X(i)-bw/2).toFixed(1)}" width="${bw}" y="${(v>=0?mid-h:mid).toFixed(1)}" height="${Math.max(1,h).toFixed(1)}" rx="2" fill="${v>=0?'var(--sky)':'var(--hr)'}" opacity=".8"/>`})}
 o.series.forEach((se,si)=>{const pts=se.y.map((v,i)=>[X(i),Y(v)]),last=se.dash!=null?se.dash:n-1;
  const path=(a,z)=>{let p='';for(let i=a;i<=z;i++)p+=(i==a?'M':se.step?'H':'L')+pts[i][0].toFixed(1)+(se.step&&i>a?'V':' ')+pts[i][1].toFixed(1);return p};
  if(se.area)s+=`<path d="${path(0,last)}L${pts[last][0].toFixed(1)} ${Y(lo)}L${pts[0][0].toFixed(1)} ${Y(lo)}Z" fill="url(#${id}${si})"/>`;
  s+=`<path d="${path(0,last)}" fill="none" stroke="${se.c}" stroke-width="${se.w||2.2}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if(se.dash!=null&&last<n-1)s+=`<path d="${path(last,n-1)}" fill="none" stroke="${se.c}" stroke-width="${se.w||2.2}" stroke-dasharray="5 4" stroke-linecap="round"/>`});
 const stp=n>1?pw/(n-1):pw;
 for(let i=0;i<n;i++){const hx=X(i),tip=`<b>${o.tipx?o.tipx(i):o.xs[i]}</b>`+o.series.map(se=>`<div><i style="background:${se.c}"></i>${se.n}: <b>${se.f?se.f(se.y[i]):fmt(Math.round(se.y[i]))}</b></div>`).join('')+(o.tip?o.tip(i):'');
  s+=`<g class="hx"><line x1="${hx}" x2="${hx}" y1="${tp}" y2="${tp+ph}"/><rect x="${(hx-stp/2).toFixed(1)}" y="${tp}" width="${stp.toFixed(1)}" height="${H-tp}" data-tip="${esc(tip)}"/>${o.series.map(se=>`<circle cx="${hx}" cy="${Y(se.y[i]).toFixed(1)}" r="3.6" fill="${se.c}"/>`).join('')}</g>`}
 return `<svg class="cv" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label)}"><defs>${d}</defs>${s}</svg>`}
const legend=a=>`<div class="lgd">${a.map(([c,l,dash])=>`<span><i style="background:${dash?'transparent':c};${dash?`border-top:2px dashed ${c};height:0`:''}"></i>${l}</span>`).join('')}</div>`;
const cols=a=>{const m=Math.max(1,...a.map(x=>x.v));return `<div class="cols">${a.map(x=>`<div class="cc" style="--p:${(x.v/m).toFixed(3)}" data-tip="${esc(x.tip)}"><b>${x.v}</b><u style="background:${x.c}"></u><span>${x.l}</span></div>`).join('')}</div>`};
const hb=a=>{const m=Math.max(1,...a.map(x=>x.v));return `<div class="hbs">${a.map(x=>`<button class="hb${x.on?' on':''}" ${x.attr||'disabled'} ${x.tip?`data-tip="${esc(x.tip)}"`:''}><span class="l">${x.l}</span><i><u style="width:${(100*x.v/m).toFixed(1)}%;background:${x.c}"></u></i><b>${x.t!=null?x.t:x.v}</b></button>`).join('')}</div>`};
const kpi=(c,l,v,sub,p,attr,on)=>{const tg=attr?'button':'div';return `<${tg} class="ak${on?' on':''}" style="--c:${c}" ${attr||''}><small>${l}</small><b>${v}</b><em>${sub}</em><i class="bar"><u style="width:${Math.min(100,p)}%"></u></i></${tg}>`};
const card2=(t,sub,body,cls='')=>`<section class="glass ac ${cls}"><div class="ach"><h3 class="sh2">${t}</h3>${sub?`<p class="ch">${sub}</p>`:''}</div>${body}</section>`;
const spark=(y,c)=>{const w=120,h=34,m=Math.max(...y),n=Math.min(...y),sp=(m-n)||1,p=y.map((v,i)=>`${(i*w/(y.length-1)).toFixed(1)},${(h-4-(v-n)/sp*(h-8)).toFixed(1)}`);return `<svg class="spk" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${p.join(' ')}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><circle cx="${p[p.length-1].split(',')[0]}" cy="${p[p.length-1].split(',')[1]}" r="3" fill="${c}"/></svg>`};
const th=(St,k,l,cls='')=>`<th class="${cls}" data-${St==AS?'as':'ps'}="${k}" aria-sort="${St.sort==k?(St.dir>0?'ascending':'descending'):'none'}" tabindex="0">${l}${St.sort==k?`<span class="sa">${St.dir>0?'▲':'▼'}</span>`:''}</th>`;
function csv(name,rows){const b=new Blob(['﻿'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
const km=(a,b)=>{const R=6371,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))};

/* ============================ ALERTS ============================ */
const AK={sev:x=>x[1].cat*100+x[1].rs.length,name:x=>x[0].n,alerts:x=>x[1].rs.length,stock:x=>x[1].mind,beds:x=>x[1].occp,att:x=>x[0].att,tests:x=>x[1].tests};

function alrDetail(f,a){
 const fo=f.fo.concat([a.fc]),duty=f.docs.map(d=>d[1]),rows=a.rs.map(r=>`<li><span class="rs ${r[0]==2?'c':''}">${esc(r[1])}</span><small>${esc(recFor(r))}</small></li>`).join('');
 return `<div class="xdi"><div><h4>Issues &amp; recommended actions</h4><ul class="xl">${rows}</ul></div>
 <div><h4>Medicine cover (days left, forecast)</h4>${a.ms.map(x=>`<div class="mb"><span>${x.n}</span><i><u class="${x.d<3?'c':x.d<7?'w':'o'}" style="width:${Math.min(100,x.d/30*100)}%"></u></i><b>${x.d.toFixed(1)}d</b><small>${x.d<30?dstr(x.d):'30d+'}</small></div>`).join('')}</div>
 <div><h4>Footfall, capacity &amp; staffing</h4><div class="sp">${spark(fo,'var(--brand2)')}<span><b>${f.fo[6]}</b> patients latest day<br><small>Forecast tomorrow ~${a.fc}</small></span></div>
  <div class="mb"><span>Beds</span><i><u class="${a.occp>=90?'c':a.occp>=75?'w':'o'}" style="width:${a.occp}%"></u></i><b>${f.occ}/${f.beds}</b><small>${a.occp}%</small></div>
  <div class="mb"><span>Attendance</span><i><u class="${f.att<60?'c':f.att<80?'w':'o'}" style="width:${f.att}%"></u></i><b>${f.att}%</b><small>${a.dn}/${f.doc} on duty</small></div>
  <div class="mb"><span>Tests</span><i><u class="${a.tests<4?'c':a.tests<6?'w':'o'}" style="width:${a.tests/6*100}%"></u></i><b>${a.tests}/6</b><small>${TESTS.filter((t,i)=>!f.tests[i]).join(', ')||'all available'}</small></div>
  ${a.eqd.length?`<p class="ch">Equipment down: ${a.eqd.join(', ')}</p>`:''}${f.inc?`<p class="ch">Incident: ${esc(f.inc)}</p>`:''}</div>
 <div class="xa"><button class="btn sm p" data-fid="${f.id}">${svg('chev',16)} Open full profile</button>${notifyBtn(f,a)}${a.low.length?`<button class="btn sm" data-jump="pln">${svg('swap',16)} Redistribution plan</button>`:''}</div></div>`}

function vAlr(L){
 const all=L.map(f=>[f,an(f)]),A=all.filter(x=>x[1].lvl),n=A.length,gc=k=>A.filter(x=>had(x[1],k)).length,cc=c=>A.filter(x=>x[1].cat==c).length;
 let R=A.filter(x=>(!AS.af||had(x[1],AS.af))&&(AS.ac===''||x[1].cat==AS.ac));
 const k=AS.sort in AK?AS.sort:'sev';R.sort((p,q)=>{const a=AK[k](p),b=AK[k](q);return((typeof a=='string'?a.localeCompare(b):a-b)*AS.dir)||(AK.sev(q)-AK.sev(p))});
 LAST.alr=R;
 const esc2=A.filter(x=>x[1].cat>=3||S.notified.has(x[0].id)).length,N=L.length||1;
 const kp=[kpi('var(--brand2)','Centres with alerts',fmt(n),`${pct(n,L.length)}% of ${fmt(L.length)} centres`,pct(n,L.length),'data-ax="clear"',!AS.af&&AS.ac===''),
  kpi('var(--cl)','Critical Loss',cc(4),'stock-out ≤3 days or no doctor',pct(cc(4),n),'data-ac="4"',AS.ac===4),
  kpi('var(--hr)','High Risk',cc(3),'several issues at once',pct(cc(3),n),'data-ac="3"',AS.ac===3),
  kpi('var(--cl)','Stock-out warnings',gc('s'),'an item under 7 days',pct(gc('s'),n),'data-af="s"',AS.af=='s'),
  kpi('var(--hr)','Bed pressure',gc('b'),'≥90% occupied',pct(gc('b'),n),'data-af="b"',AS.af=='b'),
  kpi('var(--lp)','Doctor gaps',gc('a'),'low attendance or none on duty',pct(gc('a'),n),'data-af="a"',AS.af=='a'),
  kpi('var(--sky)','Test gaps',gc('t'),'fewer than 4 of 6 tests',pct(gc('t'),n),'data-af="t"',AS.af=='t'),
  kpi('var(--okc)','DHO escalations',esc2,'auto-flagged + escalated by you',pct(esc2,n))].join('');
 /* charts */
 const gapBars=hb(GAP.map(g=>({l:g[1],v:gc(g[0]),c:g[2],on:AS.af==g[0],attr:`data-af="${g[0]}"`,tip:`${g[1]}: ${gc(g[0])} centres. Click to filter the table.`})));
 const sevBars=hb([4,3,2,1].map(c=>({l:CATS[c],v:cc(c),c:CATCOL[c],on:AS.ac===c,attr:`data-ac="${c}"`,tip:`${CATS[c]}: ${CAT_HELP[c]}`})));
 const m=AS.med,dd=all.map(([f,a])=>m<0?a.mind:a.ms[m].d),xs=[...Array(15)].map((_,i)=>i?'+'+i+'d':'Today'),cum=xs.map((_,i)=>dd.filter(d=>d<=i).length);
 const medChips=`<div class="chips sm">${[[-1,'Any item'],...MED.map((x,i)=>[i,x[0]])].map(([i,l])=>`<button class="chip" data-am="${i}" aria-pressed="${m==i}">${l}</button>`).join('')}</div>`;
 const tl=lineChart({xs,series:[{n:'Centres out of stock',c:'var(--cl)',y:cum,area:1,step:1}],vl:[{i:3,label:'3d critical',c:'var(--cl)'},{i:7,label:'7d warning',c:'var(--hr)'}],label:'Cumulative centres expected to run out of stock over the next 14 days',tipx:i=>`Out of stock by ${i?dstr(i):'today'}`,tip:i=>`<div class="ch">${pct(cum[i],N)}% of ${fmt(L.length)} centres</div>`});
 const tot=[0,1,2,3,4,5,6].map(i=>sum(L,f=>f.fo[i])),fc=sum(all,x=>x[1].fc),fy=tot.concat([fc]),ma=fy.map((_,i)=>{const w=fy.slice(Math.max(0,i-2),i+1);return w.reduce((p,q)=>p+q,0)/w.length}),dl=fy.map((v,i)=>i?v-fy[i-1]:0);
 const fx2=[...Array(7)].map((_,i)=>dstr(i-6)).concat(['Forecast']),chg=tot[6]?Math.round(1000*(fc-tot[6])/tot[6])/10:0;
 const ff=lineChart({xs:fx2,series:[{n:'Daily footfall',c:'var(--brand2)',y:fy,area:1,dash:6},{n:'3-day average',c:'var(--hr)',y:ma,w:1.6}],bars:{y:dl},auto:1,label:'Patient footfall for the last 7 days with next-day forecast',tipx:i=>i==7?'Tomorrow (forecast)':fx2[i],tip:i=>i?`<div class="ch">Change vs previous day: ${dl[i]>=0?'+':''}${fmt(Math.round(dl[i]))}</div>`:''});
 /* hotspot heatmap by state (or by district once a state is chosen) */
 const byD=!!S.st,gk=x=>byD?x[0].d:x[0].st,groups={};all.forEach(x=>{(groups[gk(x)]=groups[gk(x)]||[]).push(x)});
 const hr=Object.entries(groups).map(([g,a])=>({g,n:a.length,al:a.filter(x=>x[1].lvl).length,c:GAP.map(q=>a.filter(x=>had(x[1],q[0])).length)})).filter(r=>r.al).sort((a,b)=>b.al-a.al).slice(0,12),hm=Math.max(1,...hr.flatMap(r=>r.c));
 const heat=hr.length?`<div class="tw hmw"><table class="hmt"><thead><tr><th>${byD?'District':'State / UT'}</th><th>Centres</th>${GAP.map(g=>`<th title="${g[1]}">${g[1].split(' ')[0]}<small>${g[1].split(' ').slice(1).join(' ')}</small></th>`).join('')}<th>Alerts</th></tr></thead><tbody>${hr.map(r=>`<tr><td><button class="hl" data-hm="|${esc(r.g)}">${esc(byD?r.g:SM[r.g].n)}</button></td><td>${r.n}</td>${r.c.map((v,i)=>`<td><button class="hc" ${v?`data-hm="${GAP[i][0]}|${esc(r.g)}"`:'disabled'} style="--v:${Math.round(8+62*v/hm)}%" data-tip="${esc(`${byD?r.g:SM[r.g].n}: ${v} centres with ${GAP[i][1].toLowerCase()}`)}">${v||''}</button></td>`).join('')}<td><b>${r.al}</b> <small>${pct(r.al,r.n)}%</small></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty" style="padding:30px 0">No alerts for these filters.</p>';
 const bins=(vals,defs)=>defs.map(([l,lo,hi,c])=>({l,c,v:vals.filter(v=>v>=lo&&v<=hi).length}));
 const ad=bins(L.map(f=>f.att),[['<40',0,39,'var(--cl)'],['40–59',40,59,'var(--hr)'],['60–69',60,69,'var(--wn)'],['70–79',70,79,'var(--sky)'],['80–89',80,89,'var(--okc)'],['90+',90,100,'var(--okc)']]).map(x=>({...x,tip:`${x.v} centres with ${x.l}% attendance`}));
 const bo=bins(all.map(x=>x[1].occp),[['<50',0,49,'var(--okc)'],['50–69',50,69,'var(--okc)'],['70–79',70,79,'var(--sky)'],['80–89',80,89,'var(--wn)'],['90–99',90,99,'var(--hr)'],['100',100,999,'var(--cl)']]).map(x=>({...x,tip:`${x.v} centres at ${x.l}% bed occupancy`}));
 const noDoc=all.filter(x=>x[0].docs.length&&!x[1].dn).length,full=all.filter(x=>x[1].occp>=90).length;
 /* table */
 const lim=R.slice(0,S.lim),tcol=(key,l,cls)=>th(AS,key,l,cls);
 const sevC=[['',`All (${n})`],...[4,3,2,1].map(c=>[c,`${CATS[c]} (${cc(c)})`])],gapC=[['','Any gap'],...GAP.map(g=>[g[0],`${g[1]} (${gc(g[0])})`])];
 const filtering=AS.af||AS.ac!=='';
 const rowsH=lim.map(([f,a])=>{const o=AS.open.has(f.id),st=S.notified.has(f.id)?'<span class="rs ok">Escalated</span>':a.cat>=3?'<span class="rs c">Auto-flagged</span>':'<span class="rs">Not escalated</span>';
  return `<tr class="xr${o?' on':''}" data-x="${f.id}" tabindex="0" aria-expanded="${o}"><td class="cx">${svg('chev',16)}</td>
  <td class="l"><button class="nb" data-fid="${f.id}">${esc(f.n)}</button> ${tyTag(f)}<small>${f.d}, ${SM[f.st].n}</small></td><td class="l">${catTag(a)}</td>
  <td class="l"><b>${a.rs.length}</b> ${GAP.filter(g=>had(a,g[0])).map(g=>`<i class="gd" style="background:${g[2]}" title="${g[1]}"></i>`).join('')}</td>
  <td><span class="mini ${a.mind<3?'c':a.mind<7?'w':'o'}"><u style="width:${Math.min(100,a.mind/30*100)}%"></u></span>${a.mind.toFixed(1)}d</td><td class="${a.occp>=90?'bad':''}">${a.occp}%</td><td class="${f.att<60?'bad':''}">${f.att}%</td><td class="${a.tests<4?'bad':''}">${a.tests}/6</td><td class="l">${st}</td></tr>
  <tr class="xd" ${o?'':'hidden'}><td colspan="9">${alrDetail(f,a)}</td></tr>`}).join('');
 return `<div class="vh"><div><h2>${t('alr')} &amp; early warnings</h2><p class="ch">Click any tile, bar or heatmap cell to filter the table below. Critical Loss and High Risk centres are auto-flagged to their District Health Officer (simulated, nothing is sent).</p></div></div>
 <div class="aks">${kp}</div>
 <div class="ag">
 ${card2('Alerts by gap type','Which operational gaps are driving the alerts',gapBars)}
 ${card2('Severity mix','Centres by status, worst first',sevBars+`<p class="ch" style="margin-top:12px"><b>${noDoc}</b> centres have no doctor on duty today &middot; <b>${full}</b> have beds ≥90% full.</p>`)}
 ${card2('Stock-out early warning','Cumulative centres expected to run out of stock (days from today)',medChips+tl+`<p class="ch">${cum[7]} of ${fmt(L.length)} centres reach zero within 7 days (${cum[3]} within 3). Forecast usage = 60% last-3-day + 40% 7-day average.</p>`)}
 ${card2('Patient footfall: actual vs forecast',`Latest day <b>${fmt(tot[6])}</b> &middot; tomorrow ~<b>${fmt(fc)}</b> (${chg>=0?'+':''}${chg}%)`,legend([['var(--brand2)','Daily footfall'],['var(--brand2)','Forecast','d'],['var(--hr)','3-day average']])+ff+`<p class="ch">Bars below the line show the day-over-day change.</p>`)}
 ${card2(`Gap hotspots by ${byD?'district':'state / UT'}`,'Centres with each gap type. Darker means more centres. Click a cell to filter.',heat,'w2')}
 ${card2('Doctor attendance','Centres by 7-day attendance %, below 60% is flagged',cols(ad))}
 ${card2('Bed occupancy','Centres by current occupancy %, 90% and above is flagged',cols(bo))}
 </div>
 <section class="glass ac dbs"><div class="ach row"><div><h3 class="sh2">Alert register</h3><p class="ch">${fmt(R.length)} of ${fmt(n)} alerting centres${filtering?' (filtered)':''}. Click a row to expand its causes, actions and trends.</p></div>
  <div class="tba"><button class="btn sm" data-ax="expand">Expand all</button><button class="btn sm" data-ax="collapse">Collapse all</button><button class="btn sm" data-ax="csv">${svg('send',16)} Export CSV</button></div></div>
  <div class="chips sm">${sevC.map(([v,l])=>`<button class="chip" data-ac="${v}" aria-pressed="${AS.ac===v}">${l}</button>`).join('')}</div>
  <div class="chips sm">${gapC.map(([v,l])=>`<button class="chip" data-af="${v}" aria-pressed="${AS.af==v}">${l}</button>`).join('')}</div>
  <div class="tw"><table class="dbt"><thead><tr><th class="cx"></th>${tcol('name','Centre','l')}${tcol('sev','Status','l')}${tcol('alerts','Alerts','l')}${tcol('stock','Min stock cover')}${tcol('beds','Beds')}${tcol('att','Attendance')}${tcol('tests','Tests')}<th class="l">DHO status</th></tr></thead><tbody>${rowsH||'<tr><td colspan="9" class="empty">No alerts for these filters.</td></tr>'}</tbody></table></div>${more(S.lim,R.length)}</section>`}

/* ============================ REDISTRIBUTION ============================ */
function planData(L){
 const P=plan(L),inb={},out={};
 P.forEach(x=>{x.mi=MED.findIndex(m=>m[0]==x.nm);const a=x.to.id+'|'+x.mi;inb[a]=(inb[a]||0)+x.mv;if(x.f){const b=x.f.id+'|'+x.mi;out[b]=(out[b]||0)+x.mv}});
 P.forEach((x,i)=>{const u=an(x.to).ms[x.mi].u,q=x.to.med[x.mi].q;x.key=(x.f?x.f.id:'S')+'>'+x.to.id+'>'+x.mi;x.u=u;x.q=q;x.before=q/u;x.after=(q+x.mv)/u;x.afterAll=(q+inb[x.to.id+'|'+x.mi])/u;x.need=Math.max(0,Math.round(u*14-q));x.urg=x.before<3?0:x.before<5?1:2;
  if(x.f){const d=an(x.f).ms[x.mi],o=out[x.f.id+'|'+x.mi];x.du=d.u;x.dq=x.f.med[x.mi].q;x.dBefore=d.d;x.dAfter=(x.dq-o)/d.u;x.dist=km(x.f,x.to);x.keep=Math.round(d.u*21)}});
 return {P,inb,out}}
const URG=['Urgent','High','Medium'],URGC=['var(--cl)','var(--hr)','var(--wn)'];
const PK={days:x=>x.before,med:x=>x.nm,from:x=>x.f?x.f.n:'~',to:x=>x.to.n,dist:x=>x.f?x.dist:1e9,qty:x=>x.mv,after:x=>x.afterAll};

function plnDetail(x,E){
 const same=E.P.filter(y=>y.to==x.to&&y!==x);
 const rec=`<div><h4>Recipient &middot; ${esc(x.to.n)}</h4><dl class="dl"><dt>Stock on hand</dt><dd>${fmt(x.q)} units</dd><dt>Forecast usage</dt><dd>${x.u.toFixed(1)} / day</dd><dt>Runs out</dt><dd><b>${dstr(x.before)}</b> (${x.before.toFixed(1)} days)</dd><dt>Needed for 14 days</dt><dd>${fmt(x.need)} units</dd><dt>After this action</dt><dd class="good">${x.after.toFixed(1)} days</dd></dl></div>`;
 const src=x.f?`<div><h4>Donor &middot; ${esc(x.f.n)}</h4><dl class="dl"><dt>Stock on hand</dt><dd>${fmt(x.dq)} units</dd><dt>Forecast usage</dt><dd>${x.du.toFixed(1)} / day</dd><dt>Cover now → after</dt><dd>${x.dBefore.toFixed(0)} → <b>${x.dAfter.toFixed(0)}</b> days</dd><dt>Reserve kept (21d)</dt><dd>${fmt(x.keep)} units</dd><dt>Approx. distance</dt><dd>${x.dist.toFixed(0)} km (straight line)</dd></dl></div>`:
  `<div><h4>Source &middot; District drug store</h4><p class="ch">No donor centre in ${esc(x.to.d)} has surplus of ${x.nm}. Raise an emergency indent for <b>${fmt(x.mv)}</b> units with the district drug store.</p></div>`;
 const oth=`<div><h4>Other actions at this centre</h4>${same.length?`<ul class="xl">${same.map(y=>`<li><span class="rs ${y.urg==0?'c':''}">${y.nm}: ${y.before.toFixed(1)}d left</span><small>${y.f?'Move':'Order'} ${fmt(y.mv)} ${y.f?'from '+esc(y.f.n):'from district store'}</small></li>`).join('')}</ul>`:'<p class="ch">No other medicine needs action here.</p>'}</div>`;
 const ap=PS.appr.has(x.key);
 return `<div class="xdi">${rec}${src}${oth}<div class="xa"><button class="btn sm ${ap?'ok':'p'}" data-ap="${x.key}">${svg(ap?'check':'send',16)} ${ap?'Approved · undo':x.f?'Approve transfer':'Approve order'}</button><button class="btn sm" data-fid="${x.to.id}">Recipient profile</button>${x.f?`<button class="btn sm" data-fid="${x.f.id}">Donor profile</button>`:''}</div></div>`}

function vPln(L){
 const E=planData(L),P=E.P,N=P.length,tr=P.filter(x=>x.f),od=P.filter(x=>!x.f),units=sum(P,x=>x.mv),tu=sum(tr,x=>x.mv),rc=new Set(P.map(x=>x.to.id)).size,dn=new Set(tr.map(x=>x.f.id)).size;
 const medStat=MED.map((m,i)=>{const a=P.filter(x=>x.mi==i);return{i,n:m[0],tr:sum(a.filter(x=>x.f),x=>x.mv),od:sum(a.filter(x=>!x.f),x=>x.mv),c:a.length}});
 const best=medStat.reduce((b,x)=>x.c>b.c?x:b,medStat[0]),cm=PS.cm>=0?PS.cm:best.i;
 let R=P.filter(x=>(PS.med<0||x.mi==PS.med)&&(PS.kind=='all'||(PS.kind=='tr')==!!x.f)&&(PS.urg=='all'||x.urg==PS.urg));
 const k=PS.sort in PK?PS.sort:'days';R.sort((p,q)=>{const a=PK[k](p),b=PK[k](q);return((typeof a=='string'?a.localeCompare(b):a-b)*PS.dir)||(p.before-q.before)});LAST.pln=R;
 const ur=[0,1,2].map(u=>P.filter(x=>x.urg==u).length);
 const kp=[kpi('var(--brand2)','Suggested actions',fmt(N),`${tr.length} transfers + ${od.length} store orders`,100),
  kpi('var(--okc)','Donor transfers',fmt(tr.length),`${fmt(tu)} units from ${dn} centres`,pct(tr.length,N),'data-pk="tr"',PS.kind=='tr'),
  kpi('var(--hr)','District store orders',fmt(od.length),`${fmt(units-tu)} units, no donor available`,pct(od.length,N),'data-pk="od"',PS.kind=='od'),
  kpi('var(--cl)','Urgent (under 3 days)',ur[0],'recipient runs out soonest',pct(ur[0],N),'data-pu="0"',PS.urg===0),
  kpi('var(--sky)','Centres helped',fmt(rc),`${dn} donor centres involved`,pct(rc,L.length)),
  kpi('var(--okc)','Need met by donors',pct(tu,units)+'%',`${fmt(tu)} of ${fmt(units)} units`,pct(tu,units)),
  kpi('var(--brand2)','Approved (simulated)',PS.appr.size,`of ${N} suggested actions`,pct(PS.appr.size,N))].join('');
 /* charts */
 const medBars=`<div class="hbs">${medStat.map(m=>{const t2=m.tr+m.od,mx=Math.max(1,...medStat.map(z=>z.tr+z.od));return `<button class="hb stk${PS.med==m.i?' on':''}" data-pm="${m.i}" data-tip="${esc(`${m.n}: ${fmt(m.tr)} units by donor transfer, ${fmt(m.od)} units by store order, ${m.c} actions`)}"><span class="l">${m.n}</span><i><u style="width:${(100*m.tr/mx).toFixed(1)}%;background:var(--okc)"></u><u style="width:${(100*m.od/mx).toFixed(1)}%;background:var(--hr)"></u></i><b>${fmt(t2)}</b></button>`}).join('')}</div>${legend([['var(--okc)','Donor transfer (units)'],['var(--hr)','District store order (units)']])}`;
 const cov=L.map(f=>{const a=an(f).ms[cm],a2=f.med[cm].q,u=a.u;return{b:a.d,a:(a2+(E.inb[f.id+'|'+cm]||0)-(E.out[f.id+'|'+cm]||0))/u}});
 const sb=cov.map(c=>c.b).sort((p,q)=>p-q),sa=cov.map(c=>c.a).sort((p,q)=>p-q),M=Math.min(61,Math.max(2,sb.length)),idx=[...Array(M)].map((_,i)=>Math.round(i*(sb.length-1)/(M-1)));
 const yb=idx.map(i=>Math.min(30,sb[i]||0)),ya=idx.map(i=>Math.min(30,sa[i]||0)),ub=sb.filter(d=>d<7).length,ua=sa.filter(d=>d<7).length;
 const cch=`<div class="chips sm">${MED.map((x,i)=>`<button class="chip" data-pcm="${i}" aria-pressed="${cm==i}">${x[0]}</button>`).join('')}</div>`;
 const curve=lineChart({xs:idx.map((_,i)=>Math.round(100*i/(M-1))+'%'),series:[{n:'Before',c:'var(--cl)',y:yb,area:1},{n:'After plan',c:'var(--okc)',y:ya,w:2.6}],hl:[{y:7,label:'7-day safe line',c:'var(--hr)'},{y:3,label:'3-day critical',c:'var(--cl)'}],max:30,grid:3,label:'Days of medicine cover per centre, ranked, before and after redistribution',tipx:i=>`Weakest ${Math.round(100*i/(M-1))}% of centres`,tip:i=>`<div class="ch">Days of ${MED[cm][0]} cover</div>`,f:0});
 const dg={};P.forEach(x=>{const g=x.to.st+'|'+x.to.d;(dg[g]=dg[g]||{n:0,u:0,st:x.to.st,d:x.to.d}).n++;dg[g].u+=x.mv});
 const dbars=hb(Object.values(dg).sort((a,b)=>b.u-a.u).slice(0,8).map(g=>({l:`${esc(g.d)} <small>${g.st}</small>`,v:g.u,t:fmt(g.u),c:'var(--brand2)',attr:`data-geo="${g.st}|${esc(g.d)}"`,tip:`${g.d}, ${SM[g.st].n}: ${g.n} actions, ${fmt(g.u)} units. Click to filter.`})));
 const ub2=[['<1d',0,1,'var(--cl)'],['1–2d',1,2,'var(--cl)'],['2–3d',2,3,'var(--hr)'],['3–5d',3,5,'var(--hr)'],['5–7d',5,7,'var(--wn)']].map(([l,a,b,c])=>({l,c,v:P.filter(x=>x.before>=a&&x.before<b).length})).map(x=>({...x,tip:`${x.v} actions where the recipient has ${x.l} of stock left`}));
 /* table */
 const lim=R.slice(0,S.lim),tcol=(key,l,cls)=>th(PS,key,l,cls);
 const medC=[[-1,`All medicines (${N})`],...medStat.map(m=>[m.i,`${m.n} (${m.c})`])],urgC=[['all','Any urgency'],...URG.map((u,i)=>[i,`${u} (${ur[i]})`])],kindC=[['all','Transfers + orders'],['tr',`Transfers (${tr.length})`],['od',`Store orders (${od.length})`]];
 const rowsH=lim.map(x=>{const o=PS.open.has(x.key),ap=PS.appr.has(x.key);
  return `<tr class="xr${o?' on':''}" data-x="${x.key}" tabindex="0" aria-expanded="${o}"><td class="cx">${svg('chev',16)}</td><td class="l"><span class="rs" style="background:${URGC[x.urg]};color:${x.urg==2?'#2a2100':'#fff'};border-color:transparent;margin:0">${URG[x.urg]}</span></td><td class="l"><b>${x.nm}</b></td>
  <td class="l route2">${x.f?`<button class="nb" data-fid="${x.f.id}">${esc(x.f.n)}</button>`:'<span class="ch" style="margin:0">District drug store</span>'}${svg('arrow',14)}<button class="nb" data-fid="${x.to.id}">${esc(x.to.n)}</button><small>${esc(x.to.d)}, ${SM[x.to.st].n}</small></td>  <td><b>${fmt(x.mv)}</b></td><td><span class="bad">${x.before.toFixed(1)}d</span> → <span class="good">${x.afterAll.toFixed(1)}d</span></td><td>${x.f?x.dist.toFixed(0)+' km':'—'}</td>
  <td class="l"><button class="btn sm ${ap?'ok':''}" data-ap="${x.key}">${ap?'Approved':'Approve'}</button></td></tr>
  <tr class="xd" ${o?'':'hidden'}><td colspan="8">${plnDetail(x,E)}</td></tr>`}).join('');
 const b4=ub,af=ua;
 return `<div class="vh"><div><h2>${t('pln')} &amp; resource balancing</h2><p class="ch">Surplus centres (more than 25 days of stock, keeping 21) cover centres under 7 days, topped up to 14 days. Transfers stay within a district; where no donor exists, an order goes to the district drug store.</p></div></div>
 <div class="aks">${kp}</div>
 <div class="ag">
 ${card2('Units by medicine','Donor transfers vs district store orders. Click a bar to filter the table.',medBars)}
 ${card2('How soon recipients run out','Suggested actions by recipient days of stock left',cols(ub2)+`<p class="ch" style="margin-top:10px"><b>${ur[0]}</b> urgent, <b>${ur[1]}</b> high, <b>${ur[2]}</b> medium priority.</p>`)}
 ${card2('Cover before vs after the plan',`Centres under 7 days of <b>${MED[cm][0]}</b>: <b class="bad">${b4}</b> → <b class="good">${af}</b> after the plan`,cch+legend([['var(--cl)','Before'],['var(--okc)','After plan']])+curve+`<p class="ch">Centres ranked from lowest to highest cover (0% = weakest). Store orders are assumed to be delivered. Cover capped at 30 days.</p>`,'w2')}
 ${card2('Busiest districts','Units to move or order. Click a bar to filter every view to that district.',dbars||'<p class="empty" style="padding:24px 0">Nothing to redistribute.</p>','w2')}
 </div>
 <section class="glass ac dbs"><div class="ach row"><div><h3 class="sh2">Redistribution register</h3><p class="ch">${fmt(R.length)} of ${fmt(N)} actions. Click a row for donor, recipient and stock details. Approval is simulated: nothing is dispatched.</p></div>
  <div class="tba"><button class="btn sm" data-ax="apu">Approve all urgent</button><button class="btn sm" data-ax="apv">Approve all shown</button><button class="btn sm" data-ax="xp">Expand all</button><button class="btn sm" data-ax="cp">Collapse all</button><button class="btn sm" data-ax="pcsv">${svg('send',16)} Export CSV</button></div></div>
  <div class="chips sm">${medC.map(([v,l])=>`<button class="chip" data-pm="${v}" aria-pressed="${PS.med==v}">${l}</button>`).join('')}</div>
  <div class="chips sm">${kindC.map(([v,l])=>`<button class="chip" data-pk="${v}" aria-pressed="${PS.kind==v}">${l}</button>`).join('')}${urgC.map(([v,l])=>`<button class="chip" data-pu="${v}" aria-pressed="${PS.urg===v}">${l}</button>`).join('')}</div>
  <div class="tw"><table class="dbt"><thead><tr><th class="cx"></th>${tcol('days','Urgency','l')}${tcol('med','Medicine','l')}${tcol('from','From → To (district)','l')}${tcol('qty','Units')}${tcol('after','Cover before → after')}${tcol('dist','Distance')}<th class="l">Action</th></tr></thead><tbody>${rowsH||'<tr><td colspan="8" class="empty">No stock-outs expected for these filters.</td></tr>'}</tbody></table></div>${more(S.lim,R.length)}</section>`}

/* ============================ events ============================ */
const tip=document.createElement('div');tip.id='tip';tip.setAttribute('role','tooltip');document.body.appendChild(tip);
['pointermove','pointerdown'].forEach(ev=>document.addEventListener(ev,e=>{const x=e.target.closest&&e.target.closest('[data-tip]');if(!x){tip.classList.remove('on');return}
 tip.innerHTML=x.dataset.tip;tip.classList.add('on');const w=tip.offsetWidth,h=tip.offsetHeight;let px=e.clientX+14,py=e.clientY-h-12;if(px+w>innerWidth-8)px=Math.max(8,e.clientX-w-14);if(py<8)py=e.clientY+18;tip.style.transform=`translate(${px}px,${py}px)`}));
addEventListener('scroll',()=>tip.classList.remove('on'),{passive:true});
function toggle(tr){const id=tr.dataset.x,St=S.v=='alr'?AS:PS,key=S.v=='alr'?+id:id,o=!St.open.has(key);o?St.open.add(key):St.open.delete(key);tr.classList.toggle('on',o);tr.setAttribute('aria-expanded',o);tr.nextElementSibling.hidden=!o}
document.addEventListener('click',e=>{const g=s=>e.target.closest(s);let x;
 if(S.v!='alr'&&S.v!='pln')return;
 if(x=g('[data-ap]')){const k=x.dataset.ap;PS.appr.has(k)?PS.appr.delete(k):(PS.appr.add(k),toast('Approved (simulated): nothing is dispatched'));rr();return}
 if(g('[data-fid],[data-notify],[data-jump],[data-more],button.btn')&&!g('[data-ax]'))return;
 if(x=g('[data-ax]')){const a=x.dataset.ax;
  if(a=='clear'){AS.af='';AS.ac='';rr()}
  else if(a=='expand'||a=='xp'){const St=a=='xp'?PS:AS;document.querySelectorAll('tr.xr').forEach(r=>{St.open.add(a=='xp'?r.dataset.x:+r.dataset.x);r.classList.add('on');r.setAttribute('aria-expanded',true);r.nextElementSibling.hidden=false})}
  else if(a=='collapse'||a=='cp'){(a=='cp'?PS:AS).open.clear();document.querySelectorAll('tr.xr').forEach(r=>{r.classList.remove('on');r.setAttribute('aria-expanded',false);r.nextElementSibling.hidden=true})}
  else if(a=='csv')csv('drishti-alerts.csv',[['Centre','Type','State','District','Status','Alerts','Issues','Min stock days','Bed occupancy %','Attendance %','Tests available (of 6)']].concat(LAST.alr.map(([f,a2])=>[f.n,f.t,SM[f.st].n,f.d,CATS[a2.cat],a2.rs.length,a2.rs.map(r=>r[1]).join('; '),a2.mind.toFixed(1),a2.occp,f.att,a2.tests])));
  else if(a=='pcsv')csv('drishti-redistribution.csv',[['Urgency','Medicine','From','To','State','District','Units','Recipient days now','Recipient days after','Distance km','Approved (simulated)']].concat(LAST.pln.map(r=>[URG[r.urg],r.nm,r.f?r.f.n:'District drug store',r.to.n,SM[r.to.st].n,r.to.d,r.mv,r.before.toFixed(1),r.afterAll.toFixed(1),r.f?r.dist.toFixed(0):'',PS.appr.has(r.key)?'Yes':'No'])));
  else if(a=='apu'||a=='apv'){const t2=LAST.pln.filter(r=>a=='apv'||r.urg==0);t2.forEach(r=>PS.appr.add(r.key));toast(`Approved ${t2.length} actions (simulated): nothing is dispatched`);rr()}
  return}
 if(x=g('[data-ac]')){const v=x.dataset.ac===''?'':+x.dataset.ac;AS.ac=AS.ac===v?'':v;S.lim=24;rr();return}
 if(x=g('[data-af]')){AS.af=AS.af==x.dataset.af?'':x.dataset.af;S.lim=24;rr();return}
 if(x=g('[data-am]')){AS.med=+x.dataset.am;rr();return}
 if(x=g('[data-hm]')){const[k,gv]=x.dataset.hm.split('|');AS.af=k;AS.ac='';S.lim=24;if(S.st)go({d:gv});else go({st:gv,d:''});return}
 if(x=g('[data-geo]')){const[st,d]=x.dataset.geo.split('|');go({st,d});return}
 if(x=g('[data-pm]')){PS.med=PS.med==+x.dataset.pm?-1:+x.dataset.pm;S.lim=24;rr();return}
 if(x=g('[data-pk]')){PS.kind=PS.kind==x.dataset.pk?'all':x.dataset.pk;S.lim=24;rr();return}
 if(x=g('[data-pu]')){const v=x.dataset.pu=='all'?'all':+x.dataset.pu;PS.urg=PS.urg===v?'all':v;S.lim=24;rr();return}
 if(x=g('[data-pcm]')){PS.cm=+x.dataset.pcm;rr();return}
 if(x=g('th[data-as]')){const k=x.dataset.as;AS.dir=AS.sort==k?-AS.dir:(k=='name'?1:-1);AS.sort=k;rr();return}
 if(x=g('th[data-ps]')){const k=x.dataset.ps;PS.dir=PS.sort==k?-PS.dir:(k=='days'||k=='med'||k=='from'||k=='to'||k=='dist'?1:-1);PS.sort=k;rr();return}
 if(x=g('tr.xr'))toggle(x)});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const x=e.target.closest&&e.target.closest('tr.xr,th[data-as],th[data-ps]');if(x&&e.target==x){e.preventDefault();x.click()}});
window.vAlr=vAlr;window.vPln=vPln;
})();
