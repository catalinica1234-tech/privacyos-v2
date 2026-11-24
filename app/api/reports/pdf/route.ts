import { NextResponse } from "next/server";
import { Analysis } from "@/lib/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type A = typeof Analysis extends { _output: infer T } ? T : never;
const W = 595.28, H = 841.89;
const C = {
  forest: [0.10,0.27,0.21], green: [0.16,0.38,0.30], mint: [0.91,0.96,0.93],
  paper: [0.97,0.97,0.95], ink: [0.12,0.16,0.14], muted: [0.39,0.44,0.41],
  line: [0.86,0.89,0.87], white: [1,1,1], red: [0.69,0.20,0.18],
  orange: [0.72,0.43,0.13], yellow: [0.66,0.53,0.16]
};
const rgb = (c:number[]) => c.map(v=>v.toFixed(3)).join(" ");
const clean = (v:unknown) => String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[–—]/g,"-").replace(/[•·]/g,"-").replace(/[^\x20-\x7E]/g," ");
const esc = (v:unknown) => clean(v).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
function wrap(v:unknown,max:number,size:number) {
  const words=clean(v).split(/\s+/).filter(Boolean), lines:string[]=[]; let line="";
  for(const word of words){const next=line?line+" "+word:word;if(next.length*size*.51>max&&line){lines.push(line);line=word;}else line=next;}
  if(line)lines.push(line);return lines.length?lines:[""];
}
function fmt(v:string){const d=new Date(v);return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat("es-CL",{dateStyle:"long",timeStyle:"short"}).format(d);}
function sevColor(s:string){return s==="critico"?C.red:s==="alto"?C.orange:s==="medio"?C.yellow:C.green;}
function makePdf(a:A):Uint8Array{
  const pages:string[]=[];let ops:string[]=[];let y=0;let page=0;
  const rect=(x:number,t:number,w:number,h:number,c:number[],stroke?:number[])=>{ops.push(rgb(c)+" rg "+x+" "+(H-t-h)+" "+w+" "+h+" re f");if(stroke)ops.push(rgb(stroke)+" RG 0.7 w "+x+" "+(H-t-h)+" "+w+" "+h+" re S");};
  const text=(v:unknown,x:number,t:number,s=9,b=false,c=C.ink)=>ops.push(rgb(c)+" rg BT /"+(b?"F2":"F1")+" "+s+" Tf 1 0 0 1 "+x+" "+(H-t-s)+" Tm ("+esc(v)+") Tj ET");
  const rule=(t:number)=>ops.push(rgb(C.line)+" RG 0.7 w 42 "+(H-t)+" m "+(W-42)+" "+(H-t)+" l S");
  const para=(v:unknown,x:number,t:number,w:number,s=9,lead=13,c=C.muted)=>{const ls=wrap(v,w,s);ls.forEach((l,i)=>text(l,x,t+i*lead,s,false,c));return t+ls.length*lead;};
  const footer=()=>{rule(802);text("PRIVACYOS  |  Informe tecnico de privacidad",42,811,7,false,C.muted);text("Pagina "+page,W-82,811,7,true,C.forest);};
  const start=()=>{if(ops.length)pages.push(ops.join("\n"));ops=[];page++;rect(0,0,W,7,C.forest);text("PRIVACYOS",42,22,9,true,C.forest);text("INTELIGENCIA DE PRIVACIDAD DIGITAL",42,37,7,false,C.muted);rule(57);y=75;};
  const ensure=(h:number)=>{if(y+h>780)start();};
  const section=(title:string,sub?:string)=>{ensure(sub?52:36);y+=8;rect(42,y,4,22,C.green);text(title.toUpperCase(),54,y+2,11,true,C.forest);y+=29;if(sub)y=para(sub,54,y,485,8,11)+7;else y+=4;};
  const card=(title:string,body:string[],accent=C.green)=>{const count=body.reduce((n,v)=>n+wrap(v,470,8.6).length,0);const h=29+count*12+12;ensure(h+7);rect(42,y,511,h,C.paper,C.line);rect(42,y,3,h,accent);text(title,55,y+10,9.2,true,C.ink);let cy=y+27;for(const v of body)cy=para(v,55,cy,475,8.6,12,C.muted)+3;y+=h+7;};
  const metric=(x:number,t:number,w:number,label:string,value:string)=>{rect(x,t,w,64,C.paper,C.line);rect(x,t,w,3,C.green);text(label.toUpperCase(),x+11,t+11,7,true,C.muted);text(value,x+11,t+28,17,true,C.forest);};

  // Portada
  page=1;rect(0,0,W,305,C.forest);rect(42,42,39,39,C.white);text("P",54,46,24,true,C.forest);text("PRIVACYOS",93,44,17,true,C.white);text("INTELIGENCIA DE PRIVACIDAD DIGITAL",94,67,7,true,[.8,.89,.83]);
  text("INFORME TECNICO",44,137,9,true,[.8,.89,.83]);text("Evaluacion de",42,164,26,true,C.white);
  wrap(a.input.host,480,25).slice(0,2).forEach((l,i)=>text(l,42,198+i*32,25,true,C.white));para(a.input.url,44,270,480,8,11,[.84,.9,.86]);
  rect(42,330,511,108,C.paper,C.line);text("PRIVACY SCORE",60,347,8,true,C.muted);text(String(a.score),59,365,42,true,C.forest);text("/ 100",117,390,10,true,C.muted);
  rect(370,361,151,27,sevColor(a.riskLevel??"bajo"));text("RIESGO "+String(a.riskLevel??"NO DEFINIDO").toUpperCase(),381,369,8,true,C.white);
  text(a.dataMode==="live"?"ANALISIS REAL":"MUESTRA ILUSTRATIVA",60,416,8,true,a.dataMode==="live"?C.green:C.orange);
  metric(42,458,158,"Hallazgos",String(a.findings.length));metric(219,458,158,"Evidencias",String(a.evidence.length));metric(396,458,157,"Dimensiones",String(a.dimensions.filter(d=>d.evaluated).length));
  text("DATOS DEL DOCUMENTO",44,548,8,true,C.forest);rule(566);
  const meta:[string,string][]=[["Identificador",a.id],["Fecha del analisis",fmt(a.createdAt)],["Fecha de emision",fmt(new Date().toISOString())],["Version del motor",a.engineVersion],["Marcos seleccionados",a.input.frameworkIds.join(", ")||"No especificados"],["Accesibilidad",(a.accessibility.reachable?"Alcanzable":"No alcanzable")+" | HTTP "+(a.accessibility.httpStatus??"s/d")]];
  meta.forEach((m,i)=>{const yy=580+i*29;text(m[0].toUpperCase(),44,yy,6.8,true,C.muted);text(m[1],190,yy,8,true,C.ink);if(i<meta.length-1)rule(yy+18);});
  if(a.dataMode==="sample"){rect(42,778,511,32,[1,.95,.88]);text("ADVERTENCIA: los datos son ilustrativos y no representan resultados reales.",52,789,7,true,C.orange);}else text("Documento tecnico de apoyo; no constituye certificacion ni dictamen juridico.",44,790,7,false,C.muted);
  pages.push(ops.join("\n"));ops=[];

  // Resumen ejecutivo
  start();section("01 | Resumen ejecutivo","Sintesis de los resultados observados durante la ejecucion del motor PRIVACYOS.");
  const total=a.findings.length,critical=a.findings.filter(f=>f.severity==="critico").length,high=a.findings.filter(f=>f.severity==="alto").length,confirmed=a.findings.filter(f=>f.status==="confirmado").length;
  const coverage=Math.round(a.dimensions.filter(d=>d.evaluated).reduce((s,d)=>s+d.weight,0)*100);
  card("Lectura general",["El analisis obtuvo un Privacy Score de "+a.score+"/100 y un nivel de riesgo "+(a.riskLevel??"no determinado")+".","Se registraron "+total+" hallazgos: "+critical+" criticos, "+high+" altos y "+confirmed+" confirmados.","Se incorporaron "+a.evidence.length+" evidencias y se alcanzo una cobertura ponderada de "+coverage+"% de las dimensiones configuradas.",a.dataMode==="live"?"Los resultados corresponden a una ejecucion real del motor sobre el sitio indicado.":"Los resultados corresponden a una muestra ilustrativa y no deben interpretarse como evaluacion real."],sevColor(a.riskLevel??"bajo"));
  card("Criterios de interpretacion",["El Privacy Score resume las dimensiones evaluadas; no equivale por si solo a una certificacion de cumplimiento.","La severidad expresa la prioridad tecnica de cada hallazgo. Un riesgo alto puede coexistir con un promedio general favorable.","Los estados distinguen evidencia confirmada, indicios que requieren revision y observaciones preventivas."]);
  section("02 | Condiciones y alcance","Contexto tecnico de la ejecucion y marcos seleccionados.");
  card("Accesibilidad y respuesta",["Estado: "+(a.accessibility.reachable?"sitio alcanzable":"no fue posible confirmar el acceso")+"; codigo HTTP: "+(a.accessibility.httpStatus??"no disponible")+".","Tiempo de respuesta: "+(a.accessibility.durationMs??"no disponible")+" ms; bytes recibidos: "+(a.accessibility.responseBytes??"no disponible")+".","Redirecciones registradas: "+a.accessibility.redirects.length+". URL final: "+(a.accessibility.finalUrl??a.input.url)+"."]);
  card("Marcos considerados",[a.input.frameworkIds.length?"Marcos incluidos: "+a.input.frameworkIds.join(", ")+".":"No se seleccionaron marcos normativos.","Las relaciones normativas son indicativas y requieren validacion contextual y juridica."]);

  // Dimensiones
  start();section("03 | Evaluacion por dimensiones","Resultados por area de revision. Las dimensiones no evaluadas se identifican expresamente y no se interpretan como aprobadas.");
  for(const d of a.dimensions){const accent=!d.evaluated?C.muted:d.value<40?C.red:d.value<65?C.orange:C.green;ensure(76);rect(42,y,511,69,C.paper,C.line);text(d.label,55,y+9,9.2,true,C.ink);text(d.evaluated?d.value+"/100":"NO EVALUADA",453,y+9,8.5,true,accent);rect(55,y+29,480,6,C.line);if(d.evaluated)rect(55,y+29,480*Math.max(0,Math.min(100,d.value))/100,6,accent);para("Peso: "+Math.round(d.weight*100)+"%. "+d.note,55,y+43,475,7.8,10,C.muted);y+=77;}

  // Hallazgos
  start();section("04 | Hallazgos y riesgos","Cada registro incluye estado, severidad, prioridad, impacto, evidencia asociada y recomendacion. La clasificacion no sustituye una revision humana.");
  if(!a.findings.length)card("Sin hallazgos registrados",["El motor no registro hallazgos. Esto no demuestra ausencia de riesgos fuera del alcance evaluado."]);
  for(const f of a.findings){const status=({confirmado:"Confirmado",posible:"Posible - requiere revision",riesgo_tecnico:"Riesgo tecnico",insuficiente:"Evidencia insuficiente",preventivo:"Preventivo"} as Record<string,string>)[f.status]??f.status;const sev=String(f.severity).toUpperCase();card(f.id+" | "+f.title,["Estado: "+status+"  |  Severidad: "+sev+"  |  Prioridad: "+f.priority,"Categoria: "+f.category+"  |  Evidencias: "+f.evidenceIds.join(", "),"Analisis: "+f.explanation,"Impacto potencial: "+f.businessImpact,"Accion recomendada: "+f.recommendation,...(f.frameworks.length?["Referencias: "+f.frameworks.map(fr=>fr.id+" "+fr.ref+" - "+fr.relation).join(" | ")]:[]),...(f.limitation?["Alcance y limitacion: "+f.limitation]:[])],sevColor(f.severity));}

  // Evidencias
  start();section("05 | Registro de evidencias","Trazabilidad de los elementos observados por el motor. Las evidencias describen observaciones tecnicas; su interpretacion depende del contexto.");
  if(!a.evidence.length)card("Sin evidencias registradas",["No se registraron evidencias en esta ejecucion."]);
  for(const e of a.evidence)card(e.id+" | "+e.title,["Tipo: "+e.kind+"  |  Observada: "+fmt(e.observedAt),"Detalle observado: "+e.detail,"Fuente: "+e.source]);

  // Plan de accion
  start();section("06 | Plan de accion recomendado","Las acciones se agrupan por urgencia declarada por el motor. Los plazos son orientativos y deben validarse con responsables y capacidad operativa.");
  const groups:[string,string][]=[["inmediata","Atencion inmediata"],["30_dias","Horizonte de 30 dias"],["90_dias","Horizonte de 90 dias"],["continua","Mejora continua"]];
  if(!a.recommendations.length)card("Sin recomendaciones pendientes",["Esta ejecucion no genero acciones recomendadas."]);
  for(const g of groups){const items=a.recommendations.filter(r=>r.urgencia===g[0]);if(!items.length)continue;section(g[1],items.length+" accion(es) en este horizonte.");for(const r of items)card(r.id+" | "+r.title,[r.action,"Impacto: "+r.impact+"  |  Esfuerzo estimado: "+r.effort+(r.relatedFindingId?"  |  Hallazgo relacionado: "+r.relatedFindingId:"")],g[0]==="inmediata"?C.red:C.green);}

  // Normativa y cierre
  start();section("07 | Referencias normativas","Relacion orientativa entre hallazgos y marcos seleccionados. La inclusion de una referencia no determina automaticamente cumplimiento o incumplimiento.");
  for(const id of a.input.frameworkIds){const refs=a.findings.flatMap(f=>f.frameworks.filter(fr=>fr.id===id).map(fr=>f.id+": "+fr.ref+" - "+fr.relation));card(id,refs.length?refs:["No se registraron disposiciones relacionadas para este marco en los hallazgos."]);}
  section("08 | Limitaciones y consideraciones");
  card("Notas declaradas por el motor",a.engineNotes.length?a.engineNotes:["El motor no declaro notas adicionales."]);
  card("Uso responsable del informe",["Este documento refleja exclusivamente los datos y evidencias disponibles en la ejecucion identificada; no acredita una auditoria exhaustiva.","La ausencia de un hallazgo no demuestra que una practica no exista. Puede responder a limites de acceso, alcance, observabilidad o informacion disponible.","Las referencias regulatorias son informativas. La determinacion de obligaciones aplicables requiere analisis juridico y contextual."]);
  if(ops.length){footer();pages.push(ops.join("\n"));ops=[];}

  const objs:string[]=[];const add=(v:string)=>{objs.push(v);return objs.length;};
  const catalog=add(""),kids=add(""),f1=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),f2=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");const ids:number[]=[];
  for(const content of pages){const stream=content;const cid=add("<< /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream");ids.push(add("<< /Type /Page /Parent "+kids+" 0 R /MediaBox [0 0 "+W+" "+H+"] /Resources << /Font << /F1 "+f1+" 0 R /F2 "+f2+" 0 R >> >> /Contents "+cid+" 0 R >>"));}
  objs[catalog-1]="<< /Type /Catalog /Pages "+kids+" 0 R >>";objs[kids-1]="<< /Type /Pages /Kids ["+ids.map(i=>i+" 0 R").join(" ")+"] /Count "+ids.length+" >>";
  let pdf="%PDF-1.4\n%PRIVACYOS\n";const offsets=[0];objs.forEach((v,i)=>{offsets.push(pdf.length);pdf+=(i+1)+" 0 obj\n"+v+"\nendobj\n";});const xref=pdf.length;pdf+="xref\n0 "+(objs.length+1)+"\n0000000000 65535 f \n";for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";pdf+="trailer\n<< /Size "+(objs.length+1)+" /Root "+catalog+" 0 R >>\nstartxref\n"+xref+"\n%%EOF";return new TextEncoder().encode(pdf);
}

export async function POST(req:Request){
  try{
    const parsed=Analysis.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({message:"Los datos del informe no son validos."},{status:400});
    const bytes=makePdf(parsed.data);const body=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
    return new NextResponse(body,{headers:{"Content-Type":"application/pdf","Content-Disposition":'inline; filename="'+parsed.data.id+'-informe-privacyos.pdf"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }catch{return NextResponse.json({message:"No fue posible generar el PDF."},{status:400});}
}