/* ===== STORE: one hospital dataset feeds every view ===== */
const SM=Object.fromEntries(ST.map(s=>[s.c,s]));
const TODAY=new Date(),DAY=864e5;
/* healthcare status categories (index = severity). Replaces the generic Stable / Watch / Intervene tags */
const CATS=['Stable','Warning','Low Performance','High Risk','Critical Loss'],CC=['ok','w','lp','hr','cl'];
const CAT_HELP=['No issues','One issue to watch','Doctor attendance below 60% or fewer than 4 of 6 tests available','Several issues at once (stock, beds, staffing)','Stock-out within 3 days or no doctor posted'];
const TYPE_FULL={PHC:'Primary Health Centre',CHC:'Community Health Centre'};
const ALL=[...HOSPITALS,...SAMPLE_FACILITIES];
const dxy=h=>{const p=DIST_XY[h.st+'|'+h.d];return p&&h.lat==null?{lat:+(p[0]+(h.t=='CHC'?.03:-.05)).toFixed(3),lng:+(p[1]+(h.t=='CHC'?.04:-.06)).toFixed(3)}:{}};
const norm=h=>({...h,...dxy(h),loc:h.tpl?h.d:h.loc,med:h.med.map(m=>({q:m[0],h:m[1]}))});
const DB={rows:ALL.map(norm),
 q({reg,st,d,t,q,c}){return this.rows.filter(f=>(!reg||SM[f.st].r==reg)&&(!st||f.st==st)&&(!d||f.d==d)&&(t=='All'||f.t==t)&&(c===''||c==null||an(f).cat==c)&&(!q||(f.n+f.d+f.loc+SM[f.st].n).toLowerCase().includes(q)))}};
/* ===== FORECAST + FLAGS (runs in the browser; weighted moving average, labelled in the UI) ===== */
const use=m=>Math.max(.1,.6*(m.h[4]+m.h[5]+m.h[6])/3+.4*m.h.reduce((a,b)=>a+b,0)/7);
function an(f){if(f._a)return f._a;
 const ms=f.med.map((m,i)=>({n:MED[i][0],u:use(m),d:m.q/use(m)})),low=ms.filter(x=>x.d<7),tests=f.tests.filter(Boolean).length,occp=Math.round(100*f.occ/f.beds),rs=[];
 low.forEach(x=>rs.push([x.d<3?2:1,`${x.n}: ${x.d.toFixed(1)}d left`,'s']));
 if(occp>=90)rs.push([1,`Beds ${occp}% full`,'b']);
 if(f.att<60)rs.push([f.doc?1:2,f.doc?`Attendance ${f.att}%`:'No doctor posted','a']);
 const dn=(f.docs||[]).filter(d=>d[1]=='D').length;
 if((f.docs||[]).length&&!dn)rs.push([1,'No doctor on duty today','a']);
 if(tests<4)rs.push([1,`${tests}/6 tests available`,'t']);
 const eqd=EQ.filter((e,i)=>e[1]&&f.eq&&f.eq[i]===0).map(e=>e[0]);
 if(eqd.length)rs.push([1,'Equipment down: '+eqd.join(', '),'q']);
 if(f.inc)rs.push([1,'Active incident: '+f.inc,'i']);
 rs.sort((x,y)=>y[0]-x[0]);
 /* category: any severe item -> Critical Loss; only attendance/test issues -> Low Performance; several issues -> High Risk; one -> Warning */
 const cat=!rs.length?0:rs.some(r=>r[0]==2)?4:rs.every(r=>r[2]=='a'||r[2]=='t')?2:rs.length>1?3:1;
 const h=f.fo;return f._a={ms,low,tests,occp,rs,cat,eqd,dn,lvl:rs.some(r=>r[0]==2)||rs.length>=2?2:rs.length?1:0,mind:Math.min(...ms.map(x=>x.d)),fc:Math.round(.6*(h[4]+h[5]+h[6])/3+.4*h.reduce((a,b)=>a+b,0)/7+(h[6]-h[0])/6)}}
/* redistribution: within a district, surplus centres (>25d, keep 21d) cover centres under 7d up to 14d */
function plan(L){const out=[],g={};L.forEach(f=>(g[f.d+f.st]=g[f.d+f.st]||[]).push(f));
 Object.values(g).forEach(a=>MED.forEach(([nm],i)=>{
  const dn=a.filter(f=>an(f).ms[i].d>25).map(f=>({f,s:f.med[i].q-an(f).ms[i].u*21})).sort((x,y)=>y.s-x.s);
  a.filter(f=>an(f).ms[i].d<7).forEach(r=>{let need=Math.round(an(r).ms[i].u*14-r.med[i].q);const days=an(r).ms[i].d;
   for(const d of dn){if(need<10)break;const mv=Math.floor(Math.min(need,d.s));if(mv<10)continue;d.s-=mv;need-=mv;out.push({nm,f:d.f,to:r,mv,days})}
   if(need>=10)out.push({nm,f:null,to:r,mv:need,days})})}));
 return out.sort((x,y)=>x.days-y.days)}
function stats(L){const n=L.length,A=L.map(an),bd=L.reduce((a,f)=>a+f.beds,0);
 return{n,cats:CC.map((_,i)=>A.filter(a=>a.cat==i).length),flag:A.filter(a=>a.lvl==2).length,watch:A.filter(a=>a.lvl==1).length,so:A.filter(a=>a.low.length).length,occ:bd?Math.round(100*L.reduce((a,f)=>a+f.occ,0)/bd):0,att:n?Math.round(L.reduce((a,f)=>a+f.att,0)/n):0,fo:L.reduce((a,f)=>a+f.fo[6],0),fc:A.reduce((a,x)=>a+x.fc,0),tst:n?Math.round(100*A.reduce((a,x)=>a+x.tests,0)/(6*n)):0}}


/* recommended interventions, one per kind of flag (s stock, b beds, a doctors, t tests, q equipment, i incident) */
const REC={s:'Raise an emergency indent with the district drug store, or accept a transfer from a donor centre (see Redistribution).',b:'Divert new admissions to the nearest centre with free beds; arrange temporary beds and review discharges.',a:'District Health Officer to review attendance and arrange a locum or rotation duty.',t:'Restock test kits or set up sample referral to the nearest CHC laboratory.',q:'Log a repair or replacement request with the district biomedical engineer and arrange backup in the meantime.',i:'Inform the district control room and confirm the emergency response plan for this centre.'};
const recs=a=>[...new Map(a.rs.map(r=>[r[2],r[1]=='No doctor posted'?'Deploy a doctor immediately: rotation from the nearest CHC or an emergency locum.':REC[r[2]]])).values()];
