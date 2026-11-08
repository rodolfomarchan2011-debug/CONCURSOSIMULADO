function perms(arr){ if(arr.length<=1) return [arr]; const out=[]; arr.forEach((x,i)=>{ const rest=arr.slice(0,i).concat(arr.slice(i+1)); perms(rest).forEach(p=>out.push([x,...p])); }); return out; }

// Q68
const nomes=['Larson','Leandro','Liam','Lorenzo','Luciano'];
const sols=[];
for(const p of perms(nomes)){
  const pos=Object.fromEntries(p.map((n,i)=>[n,i+1]));
  const falas={
    Larson: pos.Larson!==1,
    Leandro: pos.Liam===3,
    Liam: pos.Lorenzo<pos.Larson,
    Lorenzo: pos.Luciano===4,
    Luciano: pos.Lorenzo!==1,
  };
  const ok=Object.entries(pos).every(([n,i])=> (i<=3)===falas[n]);
  if(ok) sols.push(p);
}
console.log('Q68 solucoes:', sols.length, sols.map(s=>s.join(' > ')));
if(sols.length===1){ const s=sols[0]; console.log('terceiro:', s[2]); }

// Q66
const pessoas=['Ana','Eva','Bruno','Davi','Carla','Fabio'];
const viz=[['Eva','Carla'],['Bruno','Ana'],['Davi','Eva'],['Carla','Bruno'],['Ana','Davi']]; // na ordem Ana..Carla
const antigos=Object.fromEntries(pessoas.slice(0,5).map((p,i)=>[p,viz[i]]));
const valid=[];
for(const p of perms(pessoas)){
  if(p[0]!=='Fabio') continue; // fixa rotação
  const idx=Object.fromEntries(p.map((n,i)=>[n,i]));
  const n=6;
  const left=(x)=>p[(idx[x]+1)%n], right=(x)=>p[(idx[x]+n-1)%n];
  let ok=true;
  for(const x of pessoas.slice(0,5)){
    for(const v of [left(x),right(x)]) if(antigos[x].includes(v)) ok=false;
  }
  if(left('Davi')===right('Carla')) ok=false;
  if(right('Ana')==='Davi') ok=false;
  if(left('Eva')==='Carla'||right('Eva')==='Carla') ok=false;
  if(ok) valid.push(p);
}
console.log('Q66 solucoes:', valid.length);
const ops=['Bruno e Davi','Carla e Eva','Ana e Carla','Davi e Ana','Eva e Bruno'];
for(const p of valid){
  const i=p.indexOf('Fabio');
  const pair=[p[(i+1)%6],p[(i+5)%6]].sort().join(' e ');
  console.log('  Fabio vizinhos:', pair, '| ordem:', p.join(','));
}
