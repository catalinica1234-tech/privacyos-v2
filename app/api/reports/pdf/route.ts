import { NextResponse } from "next/server";
import { Analysis } from "@/lib/contracts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function ascii(s: string) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[–—]/g,"-").replace(/[^\x20-\x7E]/g," "); }
function esc(s: string) { return ascii(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)"); }
function wrap(s: string, n=92) { const out:string[]=[]; let line=""; for(const w of ascii(s).split(/\s+/)){if(!w)continue;if((line+" "+w).trim().length>n&&line){out.push(line);line=w;}else line=(line+" "+w).trim();}if(line)out.push(line);return out.length?out:[""]; }
function makePdf(a: any): Uint8Array {
 const L:Array<{t:string;s:number;b?:boolean;g?:number}>=[];
 const add=(t:string,s=10,b=false,g=3)=>wrap(t,s>=16?54:s>=12?74:92).forEach(x=>L.push({t:x,s,b,g}));
 const sec=(t:string)=>{L.push({t:"",s:8,g:6});add(t.toUpperCase(),13,true,7);};
 add("PRIVACYOS",22,true,2);add("INTELIGENCIA DE PRIVACIDAD DIGITAL",9,true,12);
 add("INFORME TECNICO DE PRIVACIDAD",16,true,8);add(a.input.host,20,true,4);add(a.input.url,9,false,8);
 add("ID: "+a.id+" | Emitido: "+new Date().toLocaleString("es-CL"));add("Fecha de analisis: "+new Date(a.createdAt).toLocaleString("es-CL"));
 add("Motor: "+a.engineVersion+" | "+(a.dataMode==="live"?"Analisis real":"Muestra ilustrativa"));
 add("PRIVACY SCORE: "+a.score+"/100"+(a.riskLevel?" | Riesgo "+a.riskLevel:""),15,true,12);
 if(a.dataMode==="sample")add("MUESTRA ILUSTRATIVA: no representa resultados reales del sitio.",10,true,8);
 sec("Resumen ejecutivo");add("Evidencias observadas: "+a.evidence.length+" | Hallazgos: "+a.findings.length);
 add("Accesibilidad: "+(a.accessibility.reachable?"Alcanzable":"No alcanzable")+" | HTTP "+(a.accessibility.httpStatus??"s/d")+" | Duracion "+(a.accessibility.durationMs??"s/d")+" ms");
 add("Cobertura evaluada: "+Math.round(a.dimensions.filter((d:any)=>d.evaluated).reduce((s:number,d:any)=>s+d.weight,0)*100)+"%");
 sec("Dimensiones");a.dimensions.forEach((d:any)=>add(d.label+": "+(d.evaluated?d.value+"/100":"No evaluada")+" | Peso "+Math.round(d.weight*100)+"% | "+d.note));
 sec("Hallazgos");if(!a.findings.length)add("No se registraron hallazgos.");
 a.findings.forEach((f:any)=>{add(f.id+" | "+f.title,11,true,2);add("Estado: "+f.status+" | Severidad: "+f.severity+" | Prioridad: "+f.priority);add("Descripcion: "+f.explanation);add("Impacto: "+f.businessImpact);add("Evidencias: "+f.evidenceIds.join(", "));add("Recomendacion: "+f.recommendation);if(f.limitation)add("Limitacion: "+f.limitation);f.frameworks.forEach((x:any)=>add("Marco "+x.id+" / "+x.ref+": "+x.relation));});
 sec("Evidencias");if(!a.evidence.length)add("No se registraron evidencias.");
 a.evidence.forEach((e:any)=>{add(e.id+" | "+e.title,10,true,2);add("Tipo: "+e.kind+" | Fecha: "+new Date(e.observedAt).toLocaleString("es-CL"));add(e.detail);add("Fuente: "+e.source);});
 sec("Plan de accion");if(!a.recommendations.length)add("No hay recomendaciones.");
 a.recommendations.forEach((r:any)=>{add(r.id+" | "+r.title,10,true,2);add("Urgencia: "+r.urgencia+" | Impacto: "+r.impact+" | Esfuerzo: "+r.effort);add(r.action);});
 sec("Normativa");add("Marcos seleccionados: "+a.input.frameworkIds.join(", "));
 a.input.frameworkIds.forEach((id:string)=>{const refs=a.findings.flatMap((f:any)=>f.frameworks.filter((x:any)=>x.id===id).map((x:any)=>x.ref+": "+x.relation));add(id,10,true,2);refs.length?refs.forEach((x:string)=>add(x)):add("Sin disposiciones relacionadas registradas.");});
 sec("Limitaciones");a.engineNotes.forEach((x:string)=>add("- "+x));add("Las referencias normativas son indicativas y requieren revision juridica.",8);
 const pages:typeof L[]=[];let p:typeof L=[];let used=0;for(const x of L){const h=x.s*1.45+(x.g??3);if(used+h>690&&p.length){pages.push(p);p=[];used=0;}p.push(x);used+=h;}if(p.length)pages.push(p);
 const O:string[]=[];const obj=(x:string)=>{O.push(x);return O.length;};const cat=obj("");const kids=obj("");const f1=obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");const f2=obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");const ids:number[]=[];
 pages.forEach((pg,i)=>{let y=790;const c=["0.12 0.30 0.24 rg","BT /F2 9 Tf 42 808 Td (PRIVACYOS | INFORME DE PRIVACIDAD) Tj ET","0 0 0 rg"];pg.forEach(x=>{y-=x.s*1.45+(x.g??3);if(y>48)c.push("BT /"+(x.b?"F2":"F1")+" "+x.s+" Tf 42 "+y.toFixed(2)+" Td ("+esc(x.t)+") Tj ET");});c.push("BT /F1 8 Tf 42 28 Td (Informe "+esc(a.id)+") Tj ET");c.push("BT /F1 8 Tf 535 28 Td ("+(i+1)+"/"+pages.length+") Tj ET");const stream=c.join("\n");const co=obj("<< /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream");ids.push(obj("<< /Type /Page /Parent "+kids+" 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 "+f1+" 0 R /F2 "+f2+" 0 R >> >> /Contents "+co+" 0 R >>"));});
 O[cat-1]="<< /Type /Catalog /Pages "+kids+" 0 R >>";O[kids-1]="<< /Type /Pages /Kids ["+ids.map(x=>x+" 0 R").join(" ")+"] /Count "+ids.length+" >>";
 let pdf="%PDF-1.4\n%PRIVACYOS\n";const off=[0];O.forEach((x,i)=>{off.push(pdf.length);pdf+=(i+1)+" 0 obj\n"+x+"\nendobj\n";});const x=pdf.length;pdf+="xref\n0 "+(O.length+1)+"\n0000000000 65535 f \n";for(let i=1;i<off.length;i++)pdf+=String(off[i]).padStart(10,"0")+" 00000 n \n";pdf+="trailer\n<< /Size "+(O.length+1)+" /Root "+cat+" 0 R >>\nstartxref\n"+x+"\n%%EOF";return new TextEncoder().encode(pdf);
}
export async function POST(req:Request){try{const parsed=Analysis.safeParse(await req.json());if(!parsed.success)return NextResponse.json({message:"Los datos del informe no son validos."},{status:400});const bytes=makePdf(parsed.data);const body=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;return new NextResponse(body,{headers:{"Content-Type":"application/pdf","Content-Disposition":'inline; filename="'+parsed.data.id+'-informe.pdf"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}catch{return NextResponse.json({message:"No fue posible generar el PDF."},{status:400});}}
