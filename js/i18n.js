const DICT=Object.fromEntries(TR.map(([l,s])=>[l,Object.fromEntries(s.split('|').map((v,i)=>[KEYS[i],v]))]));
const t=k=>(DICT[S.lang]&&DICT[S.lang][k])||DICT.en[k];

