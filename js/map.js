/* ===== INDIA MAP: one map for the homepage and the India Map view ===== */
const RK=['l','m','h'],RN=['Low risk','Moderate risk','High risk'],RCOL={l:'#2e9e5b',m:'#ff8a1f',h:'#d12f40'};
/* facility risk: High = Critical Loss or High Risk, Moderate = Warning or Low Performance, Low = Stable */
const riskOf=f=>{const c=an(f).cat;return c>=3?2:c>=1?1:0};
/* footfall tertiles over all centres (last-day patients): High = top third, Low = bottom third */
const FF=(()=>{const v=DB.rows.map(f=>f.fo[6]).sort((a,b)=>a-b);return{lo:v[Math.floor(v.length/3)],hi:v[Math.floor(2*v.length/3)]}})();
const AVAIL=[['all','Any availability'],['beds','Beds available'],['doc','Doctor on duty'],['med','Medicines in stock (7+ days)'],['tests','All 6 tests available']];
const availOk=(f,k)=>{const a=an(f);return k=='beds'?a.occp<THRESH.bedsPct&&f.occ<f.beds:k=='doc'?f.doc>0&&f.att>0:k=='med'?!a.low.length:k=='tests'?a.tests==6:true};
const mapFilt=a=>a.filter(f=>availOk(f,S.av)&&(S.risk=='all'||RK[riskOf(f)]==S.risk)&&(S.ff=='all'||(S.ff=='hi'?f.fo[6]>=FF.hi:f.fo[6]<=FF.lo)));
function mapRows(){return mapFilt(DB.q({reg:S.reg,st:S.st,d:S.d,t:S.type,q:S.q,c:S.cat}))}
const stRisk=a=>{const s=stats(a),sh=(s.cats[3]+s.cats[4])/s.n;return sh>=.25?2:sh>=.1?1:0};
const dot=r=>`<i class="rd" style="background:${RCOL[RK[r]]}"></i>`;
const pickState=(c,toggle)=>go({st:toggle&&S.st==c?'':c,d:''});
/* everything shown for a state or for the whole selection */
function sm(a){const s=stats(a),A=a.map(an);return{n:a.length,chc:a.filter(f=>f.t=='CHC').length,phc:a.filter(f=>f.t=='PHC').length,rk:[0,1,2].map(r=>a.filter(f=>riskOf(f)==r).length),fo:a.reduce((x,f)=>x+f.fo[6],0),free:a.reduce((x,f)=>x+f.beds-f.occ,0),beds:a.reduce((x,f)=>x+f.beds,0),doc:a.filter(f=>f.doc>0).length,att:s.att,med:A.filter(x=>!x.low.length).length,tst:s.tst}}

/* ---- view (HTML) ---- */
function vMap(){const rows=mapRows(),T=sm(rows),st=S.st&&SM[S.st];
 const sel=(id,lab,opts,cur)=>`<select id="${id}" aria-label="${lab}">${opts.map(([v,l])=>`<option value="${esc(v)}"${cur==v?' selected':''}>${esc(l)}</option>`).join('')}</select>`,
 chip=(k,v,cur,l)=>`<button class="chip" data-${k}="${v}" aria-pressed="${cur==v}">${l}</button>`,
 kv=(l,v)=>`<div class="kvr"><span>${l}</span><b>${v}</b></div>`;
 const block=(x,title)=>`<h3 class="sh2" aria-level="2">${title}</h3>${[2,1,0].map(r=>`<div class="rkr">${dot(r)}<span>${RN[r]}</span><b>${x.rk[r]}</b></div>`).join('')}
  ${kv('Facilities',`${x.n} (${x.chc} CHC &middot; ${x.phc} PHC)`)}${kv('Patient footfall (latest day)',fmt(x.fo))}${kv('Beds available',`${fmt(x.free)} of ${fmt(x.beds)}`)}${kv('Doctor on duty',`${x.doc} of ${x.n} centres`)}${kv('Doctor attendance',x.att+'%')}${kv('Medicines in stock (7+ days)',`${x.med} of ${x.n} centres`)}${kv('Tests available',x.tst+'%')}`;
 let pn;
 if(st){const a=rows.filter(f=>f.st==S.st);pn=a.length?block(sm(a),esc(st.n))+`<p class="ch" style="margin:6px 0 0">${REG[st.r]}</p>
  <h3 class="sh2" aria-level="2" style="margin-top:16px">District administration</h3>${st.d.map(d=>`<div class="dro"><b>${esc(d)}</b><span>${ADMIN_TITLE} &middot; name not provided</span></div>`).join('')}
  <h3 class="sh2" aria-level="2" style="margin-top:16px">Facilities</h3>${a.map(f=>`<button class="dr" data-fid="${f.id}"><span>${esc(f.n)}</span><span class="ch" style="margin:0;display:flex;gap:6px;align-items:center">${tyTag(f)}${catTag(an(f))}</span></button>`).join('')}`
  :`<h3 class="sh2" aria-level="2">${esc(st.n)}</h3><p class="ch">No facilities match the current filters.</p>`}
 else pn=block(T,'All states &amp; UTs')+`<p class="ch" style="margin-top:12px">Select a state in the filters or a table row to zoom in and see its facilities and district officials.</p>`;
 const tr=ST.map(s=>{const a=rows.filter(f=>f.st==s.c);if(!a.length)return'';const x=sm(a);return `<tr data-pick="${s.c}" class="${S.st==s.c?'on':''}" tabindex="0" aria-label="Show ${esc(s.n)} on the map"><td>${dot(stRisk(a))}${esc(s.n)}</td><td>${x.n}</td><td>${x.chc}</td><td>${x.phc}</td><td>${x.rk[2]}</td><td>${x.rk[1]}</td><td>${x.rk[0]}</td><td>${fmt(x.fo)}</td><td>${fmt(x.free)}</td><td>${x.att}%</td><td>${x.med}/${x.n}</td><td>${x.tst}%</td></tr>`}).join('');
 return `<div class="bar mf">${sel('mA','Facility availability',AVAIL,S.av)}
  <span class="chips" role="group" aria-label="Risk">${chip('rk','all',S.risk,'All risk')}${chip('rk','h',S.risk,'High risk')}${chip('rk','m',S.risk,'Moderate')}${chip('rk','l',S.risk,'Low risk')}</span>
  <span class="chips" role="group" aria-label="Footfall">${chip('ff','all',S.ff,'Any footfall')}${chip('ff','hi',S.ff,'High footfall (≥'+FF.hi+'/day)')}${chip('ff','lo',S.ff,'Low (≤'+FF.lo+'/day)')}</span></div>
 <div class="mw"><div class="mapcol">${mapCard('India map',rows)}<p class="ch">Each dot is one centre, coloured by risk: green low, orange moderate, red high (high risk also pulses). Larger dot = CHC, smaller = PHC. Select a state or district to zoom in. Positions are approximate.</p></div><div class="pn">${pn}</div></div>
 <h3 class="sh2" aria-level="2" style="margin-top:22px">State-wise summary</h3><div class="tw"><table class="stt"><caption class="sr-only">State-wise summary of centres, risk, footfall, beds, attendance, medicines and tests</caption><thead><tr><th scope="col">State / UT</th><th scope="col">Facilities</th><th scope="col">CHC</th><th scope="col">PHC</th><th scope="col">High</th><th scope="col">Moderate</th><th scope="col">Low</th><th scope="col">Footfall</th><th scope="col">Beds free</th><th scope="col">Dr attendance</th><th scope="col">Meds in stock</th><th scope="col">Tests</th></tr></thead><tbody>${tr||'<tr><td colspan="12">No facilities match these filters.</td></tr>'}</tbody></table></div>`}

/* assets/map.webp with one dot per centre. Pixel positions come from data/map_xy.js (made by tools/place_on_map.py);
   a centre missing there falls back to a plain lat/lng fit. With a state or district selected the view zooms to its centres. */
const MAP_W=1293,MAP_H=1217,mxy=f=>MAP_XY[f.id]||[37.043*f.lng-2431.9,1518.15-40.283*f.lat];
function indiaMap(L){
 const P=L.map(f=>({f,r:riskOf(f),p:mxy(f)}));let x=0,y=0,w=MAP_W;
 if((S.st||S.d)&&P.length){const X=P.map(o=>o.p[0]),Y=P.map(o=>o.p[1]),x0=Math.min(...X)-60,x1=Math.max(...X)+60,y0=Math.min(...Y)-60,y1=Math.max(...Y)+60;
  w=Math.min(MAP_W,Math.max(300,x1-x0,(y1-y0)*MAP_W/MAP_H));const h=w*MAP_H/MAP_W;
  x=Math.min(Math.max((x0+x1)/2-w/2,0),MAP_W-w);y=Math.min(Math.max((y0+y1)/2-h/2,0),MAP_H-h)}
 const k=Math.sqrt(w/MAP_W),at=o=>`cx="${o.p[0]}" cy="${o.p[1]}"`,ds=[...P].sort((a,b)=>a.r-b.r);
 return `<svg class="imap" viewBox="${x.toFixed(0)} ${y.toFixed(0)} ${w.toFixed(0)} ${(w*MAP_H/MAP_W).toFixed(0)}" role="group" aria-label="Map of India with ${L.length} centres coloured by risk. Each dot is a button that opens the centre."><image href="assets/map.webp" width="${MAP_W}" height="${MAP_H}"/>${ds.filter(o=>o.r==2).slice(0,26).map(o=>`<circle class="pulse" ${at(o)} r="${9*k}"/>`).join('')}${ds.map(o=>`<circle class="d ${['dl','dm1','dh'][o.r]}" ${at(o)} r="${(o.f.t=='CHC'?9:6.5)*k}" data-fid="${o.f.id}" tabindex="0" role="button" aria-label="${esc(o.f.n)}"><title>${esc(o.f.n)}, ${esc(o.f.d)}: ${CATS[an(o.f).cat]}</title></circle>`).join('')}</svg>`}
const mapCard=(title,L)=>`<div class="glass dm"><h3 class="sh2" aria-level="2">${title}</h3>${indiaMap(L)}</div>`;
