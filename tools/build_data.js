/* DRISHTI sample-data builder (Node 18+).  Run from the project root:  node tools/build_data.js
   Writes data/sample_facilities.js (3-9 SIMULATED PHCs/CHCs per listed district) and adds doctor/equipment fields to data/hospitals.js.
   Every record is checked against the real status logic in js/store.js, so each state/UT gets a realistic mix of
   Critical Loss, High Risk, Low Performance, Warning and Stable centres. Output is deterministic (seeded). */
const fs=require('fs'),vm=require('vm'),rd=f=>fs.readFileSync(f,'utf8');
const cx=vm.createContext({console});
const run=s=>vm.runInContext(s.replace(/^const /gm,'var ').replace(/^let /gm,'var '),cx);
['data/meta.js','data/states.js','data/hospitals.js','data/districts.js'].forEach(f=>run(rd(f)));
const st=rd('js/store.js');const th0=st.indexOf('const THRESH='),th1=st.indexOf('};',th0)+2; /* the thresholds first, then the forecast + status logic */
run('var SM=Object.fromEntries(ST.map(s=>[s.c,s]));'+st.slice(th0,th1)+st.slice(st.indexOf('/** Forecast daily usage'),st.indexOf('/** Redistribution plan')));
const {ST,HOSPITALS,DIST_XY,MED,TESTS,EQ}=vm.runInContext('({ST,HOSPITALS,DIST_XY,MED,TESTS,EQ})',cx);
const an=f=>vm.runInContext('an',cx)({...f,_a:0,med:f.med.map(m=>({q:m[0],h:m[1]}))});
const hash=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const mk=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const U=(r,a,b)=>a+(b-a)*r(),I=(r,a,b)=>Math.floor(U(r,a,b+1)),P=(r,a)=>a[Math.floor(r()*a.length)];
const SPEC=['General Medicine','Paediatrics','Obstetrics & Gynaecology','General Surgery','Anaesthesia','Orthopaedics','Medical Officer (MBBS)'];
const INC=['Power outage since morning','Road access cut by flooding','Disease outbreak surge in catchment area','Heavy rain, ward waterlogging','Staff shortage after local strike','Mass-casualty road accident, extra load'];
const use=m=>.6*(m[4]+m[5]+m[6])/3+.4*m.reduce((a,b)=>a+b,0)/7;
function series(r,base,trend){return Array.from({length:7},(_,k)=>Math.max(1,Math.round(base*(1+trend*(k-3)/3)*U(r,.93,1.07))))}
function docs(r,t,n,att,onDuty){/* n doctors, mean attendance ~att, >=1 on duty today unless onDuty===0 */
 const out=[];for(let i=0;i<n;i++)out.push([t=='CHC'?(i==0?'General Medicine':P(r,SPEC)):(i==0?'Medical Officer (MBBS)':'Medical Officer (AYUSH)'),'D',0]);
 let tot=att*n;out.forEach((d,i)=>{const left=n-i-1,v=i==n-1?tot:Math.max(0,Math.min(100,Math.round(att+U(r,-9,9))));d[2]=Math.max(0,Math.min(100,i==n-1?Math.round(tot):v));tot-=d[2]});
 out.forEach((d,i)=>{if(i==0&&onDuty!==0)return;const x=r();d[1]=onDuty===0?(x<.5?'L':'O'):x<.74?'D':x<.82?'C':x<.91?'O':'L'});
 if(onDuty!==0&&!out.some(d=>d[1]=='D'))out[0][1]='D';if(onDuty===0)out.forEach(d=>{if(d[1]=='D')d[1]='O'});return out}
function eq(r,t,bad){const e=EQ.map(([n,k],i)=>t=='PHC'&&[5,6,7].includes(i)?2:1);bad.forEach(i=>{e[i]=0});return e}
/* targets: 4 Critical Loss, 3 High Risk, 2 Low Performance, 1 Warning, 0 Stable */
function build(r,t,tgt){const C=t=='CHC',fo0=C?U(r,230,420):U(r,60,140),tr=U(r,-.06,.1),beds=C?P(r,[30,50,50,60]):I(r,4,10);
 const fo=series(r,fo0,tr),avg=fo.reduce((a,b)=>a+b)/7;
 const issues=new Set(),crit=tgt==4,K={4:()=>{issues.add(r()<.62?'S3':'D0');if(r()<.5)issues.add(P(r,['B','Q','I','A']))},3:()=>{const a=['S','B','Q','I'].sort(()=>r()-.5);a.slice(0,2).forEach(x=>issues.add(x));if(r()<.3)issues.add('T')},2:()=>{const x=r();if(x<.45)issues.add('A');else if(x<.8)issues.add('T');else{issues.add('A');issues.add('T')}},1:()=>issues.add(P(r,['S','B','Q','I'])),0:()=>{}};K[tgt]();
 const med=MED.map(([n,fac],i)=>{const h=series(r,avg*fac*(C?1:1.05),U(r,-.05,.1));let d=U(r,11,44);return [h,d]});
 if(issues.has('S'))med[I(r,0,4)][1]=U(r,3.3,6.7);
 if(issues.has('S3'))med[I(r,0,4)][1]=U(r,.7,2.7);
 const meds=med.map(([h,d])=>[Math.round(d*use(h)),h]);
 const occ=issues.has('B')?Math.min(beds,Math.ceil(beds*U(r,.92,1))):Math.floor(beds*U(r,.3,.82));
 const tests=TESTS.map(()=>1);if(issues.has('T')){tests.fill(0);[...Array(6).keys()].sort(()=>r()-.5).slice(0,I(r,1,3)).forEach(i=>tests[i]=1)}
 else if(r()<.4)tests[I(r,0,5)]=0;
 const nd=issues.has('D0')?0:C?I(r,3,7):I(r,1,3),att=issues.has('A')?I(r,38,58):I(r,80,98);
 const dd=nd?docs(r,t,nd,att):[],bad=[];
 if(issues.has('Q')){const ks=[0,1,2,3,4];bad.push(...ks.sort(()=>r()-.5).slice(0,I(r,1,2)))}
 const rec={t,beds,occ,doc:nd,att:nd?Math.round(dd.reduce((a,d)=>a+d[2],0)/nd):0,staff:C?I(r,28,70):I(r,6,16),fo,med:meds,tests,docs:dd,eq:eq(r,t,bad),inc:issues.has('I')?P(r,INC):null};
 return rec}
const ok=(rec,tgt)=>{try{return an({...rec,id:0}).cat==tgt}catch(e){return false}};
const mkFac=(r,t,tgt)=>{for(let i=0;i<60;i++){const x=build(r,t,tgt);if(ok(x,tgt))return x}throw new Error('no fit '+t+tgt)};
/* ---- 1. add doctors/equipment to the 9 hand-entered centres (values already there are kept) ---- */
const hand=HOSPITALS.map(h=>{const r=mk(hash('h'+h.id));const dd=h.doc?docs(r,h.t,h.doc,h.att):[];const e=eq(r,h.t,[]);return {...h,docs:dd,eq:e,inc:null}});
hand.forEach(h=>{const a=an(h),o=an(HOSPITALS.find(x=>x.id==h.id));if(a.cat!=o.cat)console.log('WARN category changed for',h.id,o.cat,'->',a.cat)});
const hdr=rd('data/hospitals.js').split('const HOSPITALS=')[0].split('\n   docs [[')[0].replace(/\s*\*\/\s*$/,'');
/* ---- 2. sample facilities ---- */
const small=['CH','DL','PY','LD'],byD={};hand.forEach(h=>byD[h.st+'|'+h.d]=(byD[h.st+'|'+h.d]||0)+1);
const out=[];let id=1001;const tally={};
ST.forEach(s=>{const plan=[];s.d.forEach(d=>{const key=s.c+'|'+d,r=mk(hash(key));let n=P(r,[3,4,4,5,5,6,6,7,7,8,9]);if(s.d.length==1)n=Math.max(n,6);if(s.d.length==2)n=Math.max(n,5);n=Math.max(0,n-(byD[key]||0));
  const nc=Math.max(1,Math.round(n*U(r,.25,.4)));for(let i=0;i<n;i++)plan.push({d,key,t:i<nc?'CHC':'PHC',k:i<nc?i+1:i-nc+1,b:i+1+(byD[key]||0)})});
 const wr=mk(hash('prof'+s.c)),W=[[0,.46],[1,.2],[2,.12],[3,.12],[4,.10]];
 const prof=plan.map(()=>{let x=wr(),a=0;for(const[c,w]of W){a+=w;if(x<a)return c}return 0});
 [4,3,2,1].forEach(c=>{if(plan.length>=6&&!prof.includes(c)){const i=prof.findIndex(x=>x==0);if(i>=0)prof[i]=c}});
 plan.forEach((p,i)=>{const r=mk(hash(p.key+p.t+p.k)),f=mkFac(r,p.t,prof[i]),hq=DIST_XY[p.key];if(!hq)throw new Error('no coords '+p.key);
  const rad=small.includes(s.c)?.07:U(r,.1,.5),ang=U(r,0,6.283),lat=+(hq[0]+rad*Math.sin(ang)).toFixed(3),lng=+(hq[1]+rad*Math.cos(ang)).toFixed(3);
  out.push({id:id++,tpl:1,n:`${p.d} ${p.t} ${p.k}`,t:p.t,st:s.c,d:p.d,loc:`${p.d}, sample block ${p.b}`,lat,lng,...f,t:p.t});
  const T=tally[s.c]=tally[s.c]||[0,0,0,0,0];T[an(out[out.length-1]).cat]++})});
const J=o=>JSON.stringify(o);
fs.writeFileSync('data/sample_facilities.js',`/* SAMPLE FACILITIES (SIMULATED, generated by tools/build_data.js). ${out.length} PHCs/CHCs, 3-9 per listed district, for all ${ST.length} states/UTs.
   Names are generic ("<District> CHC 1"), coordinates are approximate positions near the district HQ and every figure is invented for demonstration.
   Nothing here is real facility data. Replace with verified records (same fields as data/hospitals.js) when available. Fields: tpl:1 marks a generated placeholder. */
const SAMPLE_FACILITIES=[\n${out.map(o=>J(o)).join(',\n')}\n];\n`);
fs.writeFileSync('data/hospitals.js',hdr+`\n   docs [[specialty, duty D|C|O|L, 7-day attendance %]] one entry per posted doctor (duty codes in data/meta.js), eq status per EQ item (data/meta.js: 1 working, 0 not working, 2 not provisioned),\n   inc active incident text or null. All values are SIMULATED. */\nconst HOSPITALS=[\n${hand.map(h=>J(h)).join(',\n')}\n];\n`);
console.log('facilities',out.length,'+',hand.length,'hand-entered');
const tot=[0,0,0,0,0];Object.entries(tally).forEach(([k,v])=>{v.forEach((x,i)=>tot[i]+=x)});console.log('categories S/W/LP/HR/CL',tot.join(' '));
console.log('states missing a category:',Object.entries(tally).filter(([k,v])=>v.slice(1).some(x=>!x)).map(([k,v])=>k+':'+v.join('/')).join(' ')||'none');
