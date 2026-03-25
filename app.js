// ─── CONFIGURE AQUI ───────────────────────────────────────────
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzmBKk-1mvDfuegj3vrJ0dKvJQi6gc_67RlVUYDd8AJ3bCynSX9LOiYDxTp4pZ8qtjug/exec";

// Fallback local — substituído pela lista do servidor via getMachines após login
const MACHINES_DEFAULT = [
  {id:1, name:"HORIZONTAL 1",                       hasMeta:true,  defaultMeta:500},
  {id:2, name:"HORIZONTAL 2",                       hasMeta:true,  defaultMeta:500},
  {id:3, name:"VERTICAL PLACAS / SUP. 1",           hasMeta:true,  defaultMeta:400},
  {id:4, name:"VERTICAL PLACAS / SUP. 2",           hasMeta:true,  defaultMeta:400},
  {id:5, name:"VERTICAL MÓDULOS 1",                 hasMeta:true,  defaultMeta:350},
  {id:6, name:"VERTICAL MÓDULOS 2",                 hasMeta:true,  defaultMeta:350},
  {id:7, name:"A GRANEL",                           hasMeta:true,  defaultMeta:600},
  {id:8, name:"MÁQUINA INTERRUPTOR",                hasMeta:true,  defaultMeta:300},
  {id:9, name:"TESTE INTERRUPTORES",                hasMeta:true,  defaultMeta:250},
  {id:10,name:"MANUAL INTERRUPTOR",                 hasMeta:true,  defaultMeta:200},
  {id:11,name:"MONTAGEM DIVERSOS",                  hasMeta:true,  defaultMeta:150},
  {id:12,name:"MONTAGEM PLACA REFINATTO",           hasMeta:true,  defaultMeta:180},
  {id:13,name:"KIT 1 PARAFUSO",                     hasMeta:true,  defaultMeta:220},
  {id:14,name:"KIT 2 PARAFUSO",                     hasMeta:true,  defaultMeta:220},
  {id:15,name:"MONTAGEM TOMADAS MANUAL",            hasMeta:true,  defaultMeta:160},
  {id:16,name:"MÁQUINA DE TOMADAS AUTOMÁTICA",      hasMeta:true,  defaultMeta:500},
  {id:17,name:"INSERÇÃO DOS CONTATOS INTERRUPTOR",  hasMeta:true, defaultMeta:0},
  {id:18,name:"FECHAMENTO TECLA INTERRUPTORES",     hasMeta:true, defaultMeta:0},
  {id:19,name:"RETRABALHO GERAL",                   hasMeta:true, defaultMeta:0},
];
const TURNOS = ["TURNO 1","TURNO 2","TURNO 3"];
const SESSION_KEY = "prod_session_v3";

// ─── HELPERS ──────────────────────────────────────────────────
const C={green:"#22C55E",yellow:"#F59E0B",red:"#EF4444",blue:"#0066B3",gray:"#6B7280",purple:"#003366",teal:"#0095A8",navy:"#003366",info:"#3B82F6"};
const h = React.createElement;
const {useState,useEffect,useMemo,useCallback,useRef} = React;
// FIX #1: toISOString() retorna UTC — após 21h em BRT (UTC-3), devolvia o dia seguinte.
// Agora usa getters locais para garantir a data no fuso do navegador.
const fmt    = d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today  = ()=>fmt(new Date());
const cellKey= (mId,d,t)=>`${mId}_${d}_${t}`;

// Função compartilhada de parsing — usada por dispD, dispDH e normDate
const parseAny = s => {
  if(!s) return new Date(0);
  if(s instanceof Date) return new Date(s);
  if(typeof s === 'object' && s.getTime) return new Date(s);
  if(typeof s === 'string') {
    // Fast path para ISO (YYYY-MM-DD)
    if(s.length >= 10 && s[4]==='-' && s[7]==='-') return new Date(s.slice(0,10)+'T00:00:00');
    if(s.includes('/')) {
      const parts = s.split(' ')[0].split('/');
      if(parts.length === 3) { const [d,m,y]=parts; return new Date(`${y}-${m}-${d}T00:00:00`); }
    }
    if(s.includes('GMT') || s.includes('Horário')) { try { const d=new Date(s); if(!isNaN(d.getTime())) return d; } catch {} }
  }
  try { const d=new Date(s); if(!isNaN(d.getTime())) return d; } catch {}
  return new Date(0);
};

const parseD  = parseAny; // retrocompatibilidade

const dispD = s => {
  if(!s) return "";
  const d = parseAny(s);
  if(!d.getTime()) return String(s);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const dispDH = s => {
  if(!s) return "";
  const d = parseAny(s);
  if(!d.getTime()) return String(s);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const nowBR  = ()=>new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"});

const normDate = d=>{
  if(!d) return null;
  // Fast path para ISO — sem construção de Date
  if(typeof d==='string' && d.length>=10 && d[4]==='-' && d[7]==='-') return d.slice(0,10);
  const dt = parseAny(d);
  return dt.getTime() ? fmt(dt) : null;
};

const pctCol   = p=>p===null?C.gray:p>=100?C.green:p>=80?C.yellow:C.red;
const num      = v=>{ const x=Number(v); return isNaN(x)?0:x; };
const rowStyle = i=>({background:i%2===0?"#F8FAFC":"#fff",borderBottom:"1px solid #E5E7EB"});
const IS = {border:"1px solid #D1D5DB",borderRadius:6,padding:"7px 10px",fontSize:14,background:"#fff",outline:"none",transition:"border-color .15s,box-shadow .15s"};
const SS = {...IS,cursor:"pointer"};
const BTN= (bg,ex={})=>({background:bg,color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontWeight:700,fontSize:14,cursor:"pointer",transition:"filter .15s",...ex});

// ─── EXPORTAÇÃO ───────────────────────────────────────────────
function captureCharts() {
  const images = [];
  if(typeof echarts === 'undefined') return images;
  var containers = document.querySelectorAll('[_echarts_instance_]');
  for(var i=0;i<containers.length;i++){
    var inst = echarts.getInstanceByDom(containers[i]);
    if(inst){ try{ images.push(inst.getDataURL({type:'png',pixelRatio:2,backgroundColor:'#fff'})); }catch(e){} }
  }
  return images;
}

// Gera seções HTML para o relatório com base nas seleções do usuário
function buildExportSections(sections, ctx) {
  var {data,machines,metas,machAgg,totProd,totMeta,dfIni,dfFim,dfTur,dfMac} = ctx;
  var pctGeral = totMeta>0 ? Math.round(totProd/totMeta*100) : null;
  var pctGeralCol = pctGeral===null?'#6B7280':pctGeral>=100?'#22C55E':pctGeral>=80?'#F59E0B':'#EF4444';
  var html = [];

  for(var si=0;si<sections.length;si++){
    var sec = sections[si];

    if(sec==='resumo'){
      html.push('<h3 style="color:#003366;margin:24px 0 10px;font-size:15px">Resumo por Máquina</h3>');
      html.push('<div class="kpi-row">');
      html.push('<div class="kpi-card"><div class="kpi-label">PRODUÇÃO TOTAL</div><div class="kpi-value" style="color:#0066B3">'+totProd.toLocaleString('pt-BR')+'</div></div>');
      html.push('<div class="kpi-card" style="border-color:#003366"><div class="kpi-label">META TOTAL</div><div class="kpi-value" style="color:#003366">'+(totMeta>0?totMeta.toLocaleString('pt-BR'):'—')+'</div></div>');
      html.push('<div class="kpi-card" style="border-color:'+pctGeralCol+'"><div class="kpi-label">% ATINGIMENTO</div><div class="kpi-value" style="color:'+pctGeralCol+'">'+(pctGeral!==null?pctGeral+'%':'—')+'</div></div>');
      html.push('<div class="kpi-card" style="border-color:#0095A8"><div class="kpi-label">REGISTROS</div><div class="kpi-value" style="color:#0095A8">'+data.length+'</div></div>');
      html.push('</div>');
      html.push('<table><thead><tr><th>Máquina</th><th style="text-align:center">Dias</th><th style="text-align:center">Produção</th><th style="text-align:center">Meta</th><th style="text-align:center">%</th></tr></thead><tbody>');
      var macList = machines.filter(function(m){ return dfMac==='TODAS'||m.name===dfMac; });
      for(var mi=0;mi<macList.length;mi++){
        var m=macList[mi], a=machAgg[m.id];
        var bg = mi%2===0?'#F8FAFC':'#fff';
        var pctM = a&&a.pct!=null?a.pct:null;
        var colM = pctM===null?'#6B7280':pctM>=100?'#22C55E':pctM>=80?'#F59E0B':'#EF4444';
        html.push('<tr style="background:'+bg+'"><td style="font-weight:600;color:#003366">'+m.name+'</td>');
        html.push('<td style="text-align:center">'+(a?a.diasCount:0)+'</td>');
        html.push('<td style="text-align:center;font-weight:700">'+(a?a.totalProd:0).toLocaleString('pt-BR')+'</td>');
        html.push('<td style="text-align:center;color:#94A3B8">'+(m.hasMeta?(a?a.totalMeta:0).toLocaleString('pt-BR'):'—')+'</td>');
        html.push('<td style="text-align:center;font-weight:700;color:'+colM+'">'+(pctM!==null?pctM+'%':'—')+'</td></tr>');
      }
      html.push('</tbody><tfoot><tr><td style="text-align:right;font-weight:700" colspan="2">TOTAL</td><td style="text-align:center;font-weight:700">'+totProd.toLocaleString('pt-BR')+'</td><td style="text-align:center;font-weight:700">'+(totMeta>0?totMeta.toLocaleString('pt-BR'):'—')+'</td><td style="text-align:center;font-weight:700;color:'+pctGeralCol+'">'+(pctGeral!==null?pctGeral+'%':'—')+'</td></tr></tfoot></table>');
    }

    if(sec==='detalhado'){
      html.push('<h3 style="color:#003366;margin:24px 0 10px;font-size:15px">Dados Detalhados</h3>');
      html.push('<table><thead><tr><th>Data</th><th>Turno</th><th>Máquina</th><th style="text-align:center">Meta</th><th style="text-align:center">Produção</th><th style="text-align:center">%</th><th>Apontado por</th><th>Observação</th></tr></thead><tbody>');
      var sorted = data.slice().sort(function(a,b){ return b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno); });
      for(var ri=0;ri<sorted.length;ri++){
        var r=sorted[ri], mac=machines.find(function(m){return m.id===Number(r.machineId);}), meta=num(r.meta), prod=num(r.producao);
        var pctR = mac&&mac.hasMeta&&meta>0?Math.round(prod/meta*100):null;
        var colR = pctR===null?'#6B7280':pctR>=100?'#22C55E':pctR>=80?'#F59E0B':'#EF4444';
        var bgR = ri%2===0?'#F8FAFC':'#fff';
        html.push('<tr style="background:'+bgR+'"><td>'+dispD(r.date)+'</td><td>'+r.turno+'</td><td style="font-weight:600;color:#003366">'+(r.machineName||(mac?mac.name:''))+'</td>');
        html.push('<td style="text-align:center;color:#94A3B8">'+(mac&&mac.hasMeta?meta.toLocaleString('pt-BR'):'—')+'</td>');
        html.push('<td style="text-align:center;font-weight:700">'+prod.toLocaleString('pt-BR')+'</td>');
        html.push('<td style="text-align:center;font-weight:700;color:'+colR+'">'+(pctR!==null?pctR+'%':'—')+'</td>');
        html.push('<td>'+(r.savedBy||'')+'</td><td style="font-size:11px;color:#475569">'+(r.obs||'')+'</td></tr>');
      }
      html.push('</tbody></table>');
    }

    if(sec==='turnos'){
      html.push('<h3 style="color:#003366;margin:24px 0 10px;font-size:15px">Comparativo por Turno</h3>');
      html.push('<table><thead><tr><th>Máquina</th><th style="text-align:center">TURNO 1</th><th style="text-align:center">TURNO 2</th><th style="text-align:center">TURNO 3</th><th style="text-align:center">Total</th><th style="text-align:center">Melhor</th></tr></thead><tbody>');
      var macList2 = machines.filter(function(m){ return dfMac==='TODAS'||m.name===dfMac; });
      for(var ti=0;ti<macList2.length;ti++){
        var m2=macList2[ti], a2=machAgg[m2.id];
        var bg2 = ti%2===0?'#F8FAFC':'#fff';
        var total2 = a2?a2.totalProd:0;
        var bestT='—', bestV=0;
        for(var tt=0;tt<TURNOS.length;tt++){ var tv=a2&&a2.turnos[TURNOS[tt]]?a2.turnos[TURNOS[tt]]:0; if(tv>bestV){bestV=tv;bestT=TURNOS[tt];} }
        html.push('<tr style="background:'+bg2+'"><td style="font-weight:600;color:#003366">'+m2.name+'</td>');
        for(var tt2=0;tt2<TURNOS.length;tt2++){
          var tv2=a2&&a2.turnos[TURNOS[tt2]]?a2.turnos[TURNOS[tt2]]:0;
          html.push('<td style="text-align:center">'+(tv2>0?tv2.toLocaleString('pt-BR'):'—')+'</td>');
        }
        html.push('<td style="text-align:center;font-weight:800">'+( total2>0?total2.toLocaleString('pt-BR'):'—')+'</td>');
        html.push('<td style="text-align:center;color:#22C55E;font-weight:700">'+(bestV>0?bestT:'—')+'</td></tr>');
      }
      html.push('</tbody></table>');
    }

    if(sec==='graficos'){
      var chartImages = captureCharts();
      if(chartImages.length>0){
        html.push('<h3 style="color:#003366;margin:24px 0 12px;font-size:15px">Gráficos</h3>');
        html.push('<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:16px">');
        for(var ci=0;ci<chartImages.length;ci++){
          html.push('<img src="'+chartImages[ci]+'" style="width:100%;max-width:700px;border:1px solid #E8ECF1;border-radius:8px" />');
        }
        html.push('</div>');
      } else {
        html.push('<p style="color:#94A3B8;margin:20px 0">Nenhum gráfico disponível. Navegue até a aba "Gráficos" primeiro para capturar os gráficos.</p>');
      }
    }
  }
  return html.join('\n');
}

function doExport(format, sections, ctx) {
  var {data,machines,metas,machAgg,totProd,totMeta,dfIni,dfFim,dfTur,dfMac} = ctx;

  if(format==='csv'){
    // CSV: gera planilha com as seções selecionadas
    var bom = '\uFEFF';
    var lines = [];
    lines.push('"Relatório de Produção WEG"');
    lines.push('"Período:";"'+dispD(dfIni)+' a '+dispD(dfFim)+'"');
    lines.push('"Produção Total:";"'+totProd.toLocaleString('pt-BR')+'"');
    lines.push('"Meta Total:";"'+(totMeta>0?totMeta.toLocaleString('pt-BR'):'—')+'"');
    lines.push('"% Atingimento:";"'+(totMeta>0?Math.round(totProd/totMeta*100)+'%':'—')+'"');
    lines.push('');

    for(var si=0;si<sections.length;si++){
      var sec=sections[si];

      if(sec==='resumo'){
        lines.push('"=== RESUMO POR MÁQUINA ==="');
        lines.push('"Máquina";"Dias";"Produção";"Meta";"% Meta"');
        var macList = machines.filter(function(m){ return dfMac==='TODAS'||m.name===dfMac; });
        for(var mi=0;mi<macList.length;mi++){
          var m=macList[mi], a=machAgg[m.id];
          lines.push([m.name, a?a.diasCount:0, a?a.totalProd:0, m.hasMeta?(a?a.totalMeta:0):'', a&&a.pct!=null?a.pct+'%':''].map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(';'));
        }
        lines.push('');
      }

      if(sec==='detalhado'){
        lines.push('"=== DADOS DETALHADOS ==="');
        lines.push('"Data";"Turno";"Máquina";"Meta";"Produção";"% Meta";"Apontado por";"Editado por";"Observação"');
        var sorted = data.slice().sort(function(a,b){ return b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno); });
        for(var ri=0;ri<sorted.length;ri++){
          var r=sorted[ri], mac=machines.find(function(m){return m.id===Number(r.machineId);}), meta=num(r.meta), prod=num(r.producao);
          var pctR = mac&&mac.hasMeta&&meta>0?Math.round(prod/meta*100)+'%':'';
          lines.push([dispD(r.date),r.turno,r.machineName||(mac?mac.name:''),mac&&mac.hasMeta?meta:'',prod,pctR,r.savedBy||'',r.editUser||'',r.obs||''].map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(';'));
        }
        lines.push('');
      }

      if(sec==='turnos'){
        lines.push('"=== COMPARATIVO POR TURNO ==="');
        lines.push('"Máquina";"TURNO 1";"TURNO 2";"TURNO 3";"Total";"Melhor Turno"');
        var macList2 = machines.filter(function(m){ return dfMac==='TODAS'||m.name===dfMac; });
        for(var ti=0;ti<macList2.length;ti++){
          var m2=macList2[ti], a2=machAgg[m2.id], total2=a2?a2.totalProd:0;
          var bestT='—', bestV=0;
          for(var tt=0;tt<TURNOS.length;tt++){ var tv=a2&&a2.turnos[TURNOS[tt]]?a2.turnos[TURNOS[tt]]:0; if(tv>bestV){bestV=tv;bestT=TURNOS[tt];} }
          var row2=[m2.name];
          for(var tt2=0;tt2<TURNOS.length;tt2++){ row2.push(a2&&a2.turnos[TURNOS[tt2]]?a2.turnos[TURNOS[tt2]]:0); }
          row2.push(total2); row2.push(bestV>0?bestT:'—');
          lines.push(row2.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(';'));
        }
        lines.push('');
      }

      if(sec==='graficos'){
        lines.push('"=== GRÁFICOS ==="');
        lines.push('"(Gráficos disponíveis apenas no formato PDF)"');
        lines.push('');
      }
    }

    var csv = bom + lines.join('\n');
    var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'producao_'+dfIni+'_a_'+dfFim+'.csv';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000);
    return;
  }

  // PDF/HTML
  var sectionsHtml = buildExportSections(sections, ctx);
  var fullHtml = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório — Dashboard WEG</title>\n'+
  '<style>*{box-sizing:border-box}body{font-family:"Segoe UI","Inter",sans-serif;font-size:12px;color:#1E293B;margin:0;padding:24px}\n'+
  'h2{color:#003366;margin:0 0 4px;font-size:18px}h3{page-break-before:auto}\n'+
  'p{margin:0 0 12px;color:#475569;font-size:12px}\n'+
  'table{width:100%;border-collapse:collapse;margin-bottom:16px}\n'+
  'th{background:#003366;color:#fff;padding:8px 10px;text-align:left;font-size:12px;font-weight:600}\n'+
  'td{padding:7px 10px;border-bottom:1px solid #E5E7EB}\n'+
  'tr:nth-child(even){background:#F8FAFC}\n'+
  'tfoot td{font-weight:700;background:#eff6ff;border-top:2px solid #003366}\n'+
  '.kpi-row{display:flex;gap:12px;margin:12px 0 16px;flex-wrap:wrap}\n'+
  '.kpi-card{background:#F8FAFC;border-radius:8px;padding:10px 16px;border-left:4px solid #0066B3;min-width:140px}\n'+
  '.kpi-label{font-size:10px;color:#6B7280;font-weight:700;letter-spacing:.5px;text-transform:uppercase}\n'+
  '.kpi-value{font-size:20px;font-weight:800;margin-top:2px}\n'+
  '.btn-print{display:inline-block;margin-bottom:14px;padding:8px 20px;background:linear-gradient(135deg,#003366,#0066B3);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600}\n'+
  'img{page-break-inside:avoid}\n'+
  '@media print{.btn-print{display:none}.kpi-row{display:flex!important}}</style></head>\n'+
  '<body>\n'+
  '<h2>Dashboard de Produção WEG</h2>\n'+
  '<p>Período: '+dispD(dfIni)+' a '+dispD(dfFim)+' &nbsp;·&nbsp; '+data.length+' registros</p>\n'+
  '<button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>\n'+
  sectionsHtml+'\n'+
  '</body></html>';

  var blob2 = new Blob([fullHtml], {type:'text/html;charset=utf-8'});
  var url = URL.createObjectURL(blob2);
  var w = window.open(url, '_blank');
  if(!w){ alert('Permita popups para exportar o relatório.'); }
  setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
}

// ─── EXPORT MODAL ────────────────────────────────────────────
function ExportModal({onExport,onClose}){
  var [format,setFormat] = useState('pdf');
  var [selected,setSelected] = useState({resumo:true,detalhado:true,turnos:false,graficos:false});
  var [order,setOrder] = useState(['resumo','detalhado','turnos','graficos']);

  var labels = {resumo:'Resumo por Máquina',detalhado:'Dados Detalhados',turnos:'Comparativo por Turno',graficos:'Gráficos'};
  var descriptions = {resumo:'KPIs e tabela agregada por máquina',detalhado:'Todos os apontamentos individuais',turnos:'Produção comparada entre turnos',graficos:'Imagens dos gráficos (apenas PDF)'};

  function toggleSection(key){ setSelected(function(p){ var n={}; for(var k in p) n[k]=p[k]; n[key]=!n[key]; return n; }); }

  function moveItem(idx, dir){
    var newOrder = order.slice();
    var targetIdx = idx + dir;
    if(targetIdx < 0 || targetIdx >= newOrder.length) return;
    var tmp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = tmp;
    setOrder(newOrder);
  }

  function handleExport(){
    var sections = order.filter(function(k){ return selected[k]; });
    if(sections.length===0) return;
    onExport(format, sections);
    onClose();
  }

  var anySelected = order.some(function(k){ return selected[k]; });

  var cardStyle = {border:'1px solid #E8ECF1',borderRadius:8,padding:'10px 12px',display:'flex',alignItems:'center',gap:10,background:'#fff',transition:'border-color .15s,background .15s'};
  var cardActiveStyle = {border:'1px solid #0066B3',borderRadius:8,padding:'10px 12px',display:'flex',alignItems:'center',gap:10,background:'#eff6ff',transition:'border-color .15s,background .15s'};
  var checkStyle = function(on){ return {width:20,height:20,borderRadius:4,border:on?'2px solid #0066B3':'2px solid #D1D5DB',background:on?'#0066B3':'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all .15s'}; };
  var arrowBtn = {background:'none',border:'1px solid #D1D5DB',borderRadius:4,width:26,height:26,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#475569',flexShrink:0,padding:0,lineHeight:1};

  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.navy,marginBottom:4}},"Exportar Relatório"),
    el("div",{style:{fontSize:13,color:"#94A3B8",marginBottom:18}},"Escolha o formato e as seções do documento"),

    // Format selector
    el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}},"FORMATO"),
    el("div",{style:{display:"flex",gap:6,marginBottom:18}},
      ...[['pdf','PDF (Imprimir)'],['csv','CSV (Excel)']].map(function(f){
        var isActive = format===f[0];
        return el("button",{key:f[0],onClick:function(){setFormat(f[0]);},style:{flex:1,padding:"10px",border:isActive?"2px solid #0066B3":"2px solid #E8ECF1",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:isActive?700:500,background:isActive?"#eff6ff":"#fff",color:isActive?"#003366":"#475569",transition:"all .15s",fontFamily:"inherit"}},f[1]);
      })
    ),

    // Sections selector with drag ordering
    el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}},"SEÇÕES (arraste para reordenar)"),
    el("div",{style:{display:"flex",flexDirection:"column",gap:6,marginBottom:18}},
      ...order.map(function(key,idx){
        var on = selected[key];
        var isGraficoCsv = key==='graficos' && format==='csv';
        return el("div",{key:key,style:on&&!isGraficoCsv?cardActiveStyle:Object.assign({},cardStyle,isGraficoCsv?{opacity:0.5}:{})},
          // Checkbox
          el("div",{onClick:function(){ if(!isGraficoCsv) toggleSection(key); },style:checkStyle(on&&!isGraficoCsv)},
            on&&!isGraficoCsv?el("svg",{width:12,height:12,viewBox:"0 0 12 12",style:{display:"block"}},el("path",{d:"M2 6l3 3 5-5",stroke:"#fff",strokeWidth:2,fill:"none",strokeLinecap:"round",strokeLinejoin:"round"})):null
          ),
          // Label
          el("div",{style:{flex:1,cursor:"pointer",minWidth:0},onClick:function(){ if(!isGraficoCsv) toggleSection(key); }},
            el("div",{style:{fontSize:13,fontWeight:600,color:isGraficoCsv?"#94A3B8":"#1E293B"}},labels[key]),
            el("div",{style:{fontSize:11,color:"#94A3B8",marginTop:1}},isGraficoCsv?"Disponível apenas no PDF":descriptions[key])
          ),
          // Reorder arrows
          el("div",{style:{display:"flex",flexDirection:"column",gap:2}},
            el("button",{onClick:function(){ moveItem(idx,-1); },disabled:idx===0,style:Object.assign({},arrowBtn,idx===0?{opacity:0.3,cursor:"default"}:{})},"\u25B2"),
            el("button",{onClick:function(){ moveItem(idx,1); },disabled:idx===order.length-1,style:Object.assign({},arrowBtn,idx===order.length-1?{opacity:0.3,cursor:"default"}:{})},"\u25BC")
          )
        );
      })
    ),

    // Actions
    el("div",{style:{display:"flex",gap:10}},
      el("button",{onClick:onClose,style:{...BTN(C.gray),flex:1}},"Cancelar"),
      el("button",{onClick:handleExport,disabled:!anySelected,style:{...BTN("linear-gradient(135deg,#003366,#0066B3)"),flex:2,opacity:anySelected?1:0.5}},
        format==='csv'?"Exportar CSV":"Exportar PDF"
      )
    )
  );
}

// ─── SESSION ──────────────────────────────────────────────────
const loadSession = ()=>{ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)||"null"); }catch{ return null; } };
const saveSession = u=>{ try{ localStorage.setItem(SESSION_KEY,JSON.stringify(u)); }catch{} };
const clearSession= ()=>{ try{ localStorage.removeItem(SESSION_KEY); }catch{} };

// FIX: localStorage cache para startup instantâneo
const CACHE_KEY = "prod_records_cache";
const CACHE_METAS_KEY = "prod_metas_cache";
function loadCachedRecords(){ try{ return JSON.parse(localStorage.getItem(CACHE_KEY)||"[]"); }catch{ return []; } }
function saveCachedRecords(data){ try{ localStorage.setItem(CACHE_KEY,JSON.stringify(data)); }catch{} }
function loadCachedMetas(){ try{ const m=JSON.parse(localStorage.getItem(CACHE_METAS_KEY)||"null"); return m; }catch{ return null; } }
function saveCachedMetas(m){ try{ localStorage.setItem(CACHE_METAS_KEY,JSON.stringify(m)); }catch{} }

function loadMetasDefaults(machines){
  const m={};
  (machines||MACHINES_DEFAULT).forEach(mac=>{ m[mac.id]=mac.defaultMeta; });
  return m;
}

// ─── API ──────────────────────────────────────────────────────
async function api(action, body={}, userSession=null){
  const payload = {action, ...body};
  if(userSession?.token) payload.token = userSession.token;
  const obj     = JSON.stringify(payload);
  const encoded = btoa(encodeURIComponent(obj).replace(/%([0-9A-F]{2})/g,(_,p)=>String.fromCharCode(parseInt(p,16))));
  const url     = `${SCRIPT_URL}?payload=${encodeURIComponent(encoded)}&t=${Date.now()}`;
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 30000);
  let res;
  try {
    res = await fetch(url, {signal: controller.signal});
  } catch(e) {
    if(e.name === "AbortError") throw new Error("Tempo de resposta excedido. Tente novamente.");
    throw new Error("Não foi possível conectar ao servidor. Verifique sua internet.");
  } finally {
    clearTimeout(timer);
  }
  if(!res.ok) throw new Error("Erro no servidor (HTTP "+res.status+")");
  let j;
  try { j = await res.json(); }
  catch(e) { throw new Error("Resposta inválida do servidor. Tente novamente."); }
  // FIX: sessão expirada → limpa localStorage e recarrega página para forçar re-login
  if(!j.ok && j.error && j.error.includes("Sessão")) {
    clearSession();
    saveCachedRecords([]);
    saveCachedMetas(null);
    window.location.reload();
    throw new Error("Sessão expirada. Reconectando...");
  }
  if(!j.ok) throw new Error(j.error||"Erro no servidor");
  return j;
}

// ─── RESPONSIVE ───────────────────────────────────────────────
function useIsMobile(){
  const [mob,setMob]=useState(window.innerWidth<640);
  useEffect(()=>{
    const fn=()=>setMob(window.innerWidth<640);
    window.addEventListener('resize',fn);
    return ()=>window.removeEventListener('resize',fn);
  },[]);
  return mob;
}

// ─── COMPONENTES BASE ─────────────────────────────────────────
function el(tag,props,...children){ return h(tag,props,...children); }

function WEGLogoSVG({height=32,color="#fff"}){
  const w=Math.round(height*5991/4192);
  const s={fill:color,fillRule:"nonzero"};
  return el("svg",{viewBox:"0 0 5991 4192",width:w,height:height,style:{display:"block",shapeRendering:"geometricPrecision"}},
    el("polygon",{style:s,points:"461,466 461,2795 922,2795 922,932 1383,932 1383,2795 1844,2795 1844,932 2304,932 2304,3261 0,3261 0,0 5991,0 5991,466 "}),
    el("path",{style:s,d:"M4148 2329l0 -1397 -1383 0 0 2329 1383 0 0 -466 -922 0 0 -466 922 0zm-461 -466l-461 0 0 -466 461 0 0 466z"}),
    el("path",{style:s,d:"M5991 932l-1382 0 0 2329 922 0 0 466 -5531 0 0 465 5991 0 0 -3260zm-461 1863l-461 0 0 -1398 461 0 0 1398z"})
  );
}

function MiniBar({pct,color}){
  return el("div",{style:{background:"#E5E7EB",borderRadius:4,height:8,overflow:"hidden",minWidth:80}},
    el("div",{style:{width:`${Math.min(pct??0,100)}%`,height:"100%",background:color,borderRadius:4,transition:"width .4s ease"}})
  );
}

function Alert({type,msg}){
  if(!msg) return null;
  const s={error:{bg:"#fef2f2",br:"#fecaca",tx:"#dc2626"},success:{bg:"#f0fdf4",br:"#bbf7d0",tx:"#16a34a"},info:{bg:"#eff6ff",br:"#bfdbfe",tx:"#2563eb"}}[type]||{bg:"#eff6ff",br:"#bfdbfe",tx:"#2563eb"};
  return el("div",{style:{background:s.bg,border:`1px solid ${s.br}`,borderRadius:6,padding:"10px 14px",fontSize:13,color:s.tx,marginTop:10,fontWeight:500}},
    (type==="error"?"⚠ ":type==="success"?"✔ ":"ℹ ")+msg
  );
}

function Modal({children}){
  return el("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}},
    el("div",{style:{background:"#fff",borderRadius:14,padding:28,width:"100%",maxWidth:440,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",maxHeight:"90vh",overflowY:"auto"}},
      ...children
    )
  );
}

// ─── FILTRO REUTILIZÁVEL ──────────────────────────────────────
function FilterBar({dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines,showTurno=true,extra=null}){
  const lbl={fontSize:11,color:"#6B7280",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"};
  return el("div",{style:{background:"#fff",borderRadius:12,padding:"14px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",marginBottom:16,display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-end"}},
    el("div",null,
      el("div",{style:lbl},"DE"),
      el("input",{type:"date",value:dfIni,onChange:e=>setDfIni(e.target.value),style:{...IS,width:"auto"}})
    ),
    el("div",null,
      el("div",{style:lbl},"ATÉ"),
      el("input",{type:"date",value:dfFim,onChange:e=>setDfFim(e.target.value),style:{...IS,width:"auto"}})
    ),
    el("div",null,
      el("div",{style:lbl},"MÁQUINA"),
      el("select",{value:dfMac,onChange:e=>setDfMac(e.target.value),style:{...SS,maxWidth:200,width:"auto"}},
        el("option",{value:"TODAS"},"TODAS"),
        ...machines.map(m=>el("option",{key:m.id,value:m.name},m.name))
      )
    ),
    showTurno&&el("div",null,
      el("div",{style:lbl},"TURNO"),
      el("select",{value:dfTur,onChange:e=>setDfTur(e.target.value),style:{...SS,width:"auto"}},
        el("option",{value:"TODOS"},"TODOS"),
        ...TURNOS.map(t=>el("option",{key:t,value:t},t))
      )
    ),
    extra
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────
function AuthScreen({onLogin}){
  const [mode,setMode]    = useState("login");
  const [nome,setNome]    = useState("");
  const [senha,setSenha]  = useState("");
  const [senha2,setSenha2]= useState("");
  const [codigo,setCodigo]= useState("");
  const [showPw,setShowPw]= useState(false);
  const [loading,setLoading]=useState(false);
  const [alert,setAlert]  = useState({type:"",msg:""});

  function switchMode(m){ setMode(m); setAlert({type:"",msg:""}); setSenha(""); setSenha2(""); setCodigo(""); }

  async function submit(e){
    e.preventDefault();
    if(!nome||!senha){ setAlert({type:"error",msg:"Preencha todos os campos."}); return; }
    if(mode==="register"){
      if(nome.length<3){ setAlert({type:"error",msg:"Nome muito curto (mín. 3 caracteres)."}); return; }
      if(senha.length<4){ setAlert({type:"error",msg:"Senha muito curta (mín. 4 caracteres)."}); return; }
      if(senha!==senha2){ setAlert({type:"error",msg:"As senhas não coincidem."}); return; }
    }
    setLoading(true); setAlert({type:"",msg:""});
    try{
      const r=await api(mode==="login"?"login":"register",{nome,senha,inviteCode:codigo});
      setAlert({type:"success",msg:mode==="login"?"Bem-vindo!":"Conta criada com sucesso!"});
      const session = {token:r.session.token,nome:r.session.nome,role:r.session.role,expiresAt:r.session.expiresAt};
      setTimeout(()=>{ saveSession(session); onLogin(session); },800);
    }catch(e){ setAlert({type:"error",msg:e.message}); }
    finally{ setLoading(false); }
  }

  const isLogin=mode==="login";
  return el("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#003366 0%,#0066B3 100%)"}},
    el("div",{style:{background:"#fff",borderRadius:12,padding:"36px 32px",width:380,maxWidth:"95vw",boxShadow:"0 12px 48px rgba(0,33,66,0.35)"}},
      el("div",{style:{textAlign:"center",marginBottom:28}},
        el("div",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",background:C.navy,borderRadius:4,padding:"10px 20px",marginBottom:12}},
          el(WEGLogoSVG,{height:38,color:"#fff"})
        ),
        el("div",{style:{fontSize:15,fontWeight:700,color:C.navy,marginTop:2,letterSpacing:0.3}},"Dashboard de Produção"),
        el("div",{style:{fontSize:13,color:"#94A3B8",marginTop:4}},isLogin?"Faça login para continuar":"Crie sua conta de acesso")
      ),
      el("div",{style:{display:"flex",background:"#F0F2F5",borderRadius:4,padding:4,marginBottom:22}},
        ...[["login","Entrar"],["register","Criar Conta"]].map(([k,l])=>
          el("button",{key:k,onClick:()=>switchMode(k),style:{flex:1,padding:"8px",border:"none",borderRadius:3,cursor:"pointer",fontWeight:700,fontSize:14,background:mode===k?"#fff":"transparent",color:mode===k?C.navy:"#94A3B8",boxShadow:mode===k?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all .2s"}},l)
        )
      ),
      el("form",{onSubmit:submit},
        el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#1E293B",marginBottom:5}},"NOME DE USUÁRIO"),
          el("input",{value:nome,onChange:e=>setNome(e.target.value),placeholder:"Seu nome",style:{...IS,width:"100%"},autoFocus:true})
        ),
        el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#1E293B",marginBottom:5}},"SENHA"),
          el("div",{style:{position:"relative"}},
            el("input",{type:showPw?"text":"password",value:senha,onChange:e=>setSenha(e.target.value),placeholder:"Mínimo 4 caracteres",style:{...IS,width:"100%",paddingRight:42}}),
            el("span",{onClick:()=>setShowPw(!showPw),style:{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:16,color:"#94A3B8"}},showPw?"Ocultar":"Mostrar")
          )
        ),
        !isLogin&&el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#1E293B",marginBottom:5}},"CONFIRMAR SENHA"),
          el("input",{type:showPw?"text":"password",value:senha2,onChange:e=>setSenha2(e.target.value),placeholder:"Repita a senha",style:{...IS,width:"100%"}})
        ),
        !isLogin&&el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#1E293B",marginBottom:5}},"CÓDIGO DE ACESSO"),
          el("input",{value:codigo,onChange:e=>setCodigo(e.target.value),placeholder:"Digite o código de acesso",style:{...IS,width:"100%"}}),
          el("div",{style:{fontSize:11,color:"#94A3B8",marginTop:3}},"Solicite o código de acesso ao administrador.")
        ),
        el(Alert,{type:alert.type,msg:alert.msg}),
        el("button",{type:"submit",disabled:loading,style:{...BTN("linear-gradient(135deg,#003366,#0066B3)"),width:"100%",marginTop:18,padding:"11px",fontSize:15,opacity:loading?.7:1}},
          loading?"Aguarde...":(isLogin?"Entrar":"Criar Conta")
        )
      ),
      isLogin&&el("div",{style:{marginTop:14,textAlign:"center",fontSize:12,color:"#94A3B8"}},"Esqueceu a senha? Fale com o ",el("b",null,"administrador"),"."),
    )
  );
}

// ─── MODALS ───────────────────────────────────────────────────
function EditModal({rec,metas,machines,onSave,onClose,saving}){
  const mId=Number(rec.machineId);
  const mac=machines.find(m=>m.id===mId);
  const metaVal=num(rec.meta)>0?num(rec.meta):(mac?.hasMeta?(metas[mId]||mac.defaultMeta||0):0);
  const [val,setVal]=useState(String(rec.producao));
  const pct=mac?.hasMeta&&metaVal>0&&val!==""?Math.round(num(val)/metaVal*100):null;
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.navy,marginBottom:4}},"Editar Apontamento"),
    el("div",{style:{fontSize:13,color:"#94A3B8",marginBottom:18}},`${mac?.name} · ${dispD(rec.date)} · ${rec.turno}`),
    el("div",{style:{marginBottom:14}},
      el("div",{style:{fontSize:12,fontWeight:700,color:"#1E293B",marginBottom:5,textTransform:"uppercase"}},"PRODUÇÃO (peças)"),
      el("input",{type:"number",min:"0",value:val,onChange:e=>setVal(e.target.value),autoFocus:true,style:{...IS,width:"100%",fontSize:22,fontWeight:800,textAlign:"center",padding:"10px"}})
    ),
    pct!==null&&el("div",{style:{textAlign:"center",fontSize:13,color:"#94A3B8",marginBottom:8}},
      `Meta: ${metaVal.toLocaleString("pt-BR")} · `,el("b",{style:{color:pctCol(pct)}},`${pct}% da meta`)
    ),
    rec.savedBy&&el("div",{style:{fontSize:11,color:"#94A3B8",textAlign:"center",marginBottom:14}},
      `Criado por ${rec.savedBy} em ${rec.savedAt}`,
      rec.editUser&&el("span",null,` | Editado por ${rec.editUser} em ${rec.editTime}`)
    ),
    el("div",{style:{display:"flex",gap:10}},
      el("button",{onClick:onClose,style:{...BTN(C.gray),flex:1}},"Cancelar"),
      el("button",{onClick:()=>onSave(num(val)),disabled:saving||val==="",style:{...BTN("linear-gradient(135deg,#003366,#0066B3)"),flex:2,opacity:saving||val===""?.6:1}},
        saving?"Salvando...":"Salvar edição"
      )
    )
  );
}

function DeleteModal({rec,machines,onConfirm,onClose,deleting}){
  const mac=machines.find(m=>m.id===Number(rec.machineId));
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.red,marginBottom:10}},"Excluir Apontamento"),
    el("div",{style:{fontSize:14,color:"#1E293B",marginBottom:20,lineHeight:1.7}},
      "Tem certeza que deseja excluir o apontamento de ",el("b",null,mac?.name)," em ",el("b",null,dispD(rec.date))," — ",el("b",null,rec.turno),"?",
      el("br"),el("span",{style:{color:C.red,fontSize:13}},"Esta ação não pode ser desfeita.")
    ),
    el("div",{style:{display:"flex",gap:10}},
      el("button",{onClick:onClose,style:{...BTN(C.gray),flex:1}},"Cancelar"),
      el("button",{onClick:onConfirm,disabled:deleting,style:{...BTN("linear-gradient(135deg,#dc2626,#EF4444)"),flex:2,opacity:deleting?.6:1}},
        deleting?"Excluindo...":"Confirmar Exclusão"
      )
    )
  );
}

function ObsModal({rec,machines,onSave,onClose,saving}){
  const mac=machines.find(m=>m.id===Number(rec.machineId));
  const [text,setText]=useState(rec.obs||"");
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.navy,marginBottom:4}},"Observação"),
    el("div",{style:{fontSize:13,color:"#94A3B8",marginBottom:14}},`${mac?.name} · ${dispD(rec.date)} · ${rec.turno}`),
    el("textarea",{value:text,onChange:e=>setText(e.target.value),placeholder:"Descreva observações sobre este apontamento...",autoFocus:true,
      style:{...IS,width:"100%",height:100,resize:"vertical",fontFamily:"inherit",fontSize:14}}),
    rec.obs&&el("div",{style:{fontSize:11,color:C.gray,marginTop:4}},"Observação atual: "+rec.obs),
    el("div",{style:{display:"flex",gap:10,marginTop:14}},
      el("button",{onClick:onClose,style:{...BTN(C.gray),flex:1}},"Cancelar"),
      el("button",{onClick:()=>onSave(text),disabled:saving,style:{...BTN("linear-gradient(135deg,#003366,#0066B3)"),flex:2,opacity:saving?.6:1}},
        saving?"Salvando...":"Salvar Observação"
      )
    )
  );
}

// ─── CONFLICT MODAL ──────────────────────────────────────
// FIX: Modal de conflito — quando o usuário salva sobre registro existente,
// pode escolher substituir (upsert) ou criar novo apontamento (append com justificativa obrigatória)
function ConflictModal({conflicts,onReplace,onAppend,onClose}){
  const [obs,setObs]=useState("");
  const count=conflicts?conflicts.length:0;
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.yellow,marginBottom:8}},"Conflito de Apontamento"),
    el("div",{style:{fontSize:13,color:"#1E293B",marginBottom:14,lineHeight:1.7}},
      `${count} máquina(s) já ${count===1?"possui":"possuem"} apontamento para esta data/turno.`
    ),
    el("div",{style:{background:"#FFF8E7",borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:"#92400e",border:"1px solid #FDE68A"}},
      "Escolha como deseja proceder:"
    ),
    el("button",{onClick:onReplace,style:{...BTN("linear-gradient(135deg,#003366,#0066B3)"),width:"100%",marginBottom:10,padding:"11px",fontSize:14}},
      "Substituir apontamentos existentes"
    ),
    el("div",{style:{marginBottom:10}},
      el("div",{style:{fontSize:12,fontWeight:700,color:"#1E293B",marginBottom:5,textTransform:"uppercase"}},"JUSTIFICATIVA (obrigatória para novo apontamento)"),
      el("textarea",{value:obs,onChange:e=>setObs(e.target.value),placeholder:"Descreva o motivo do novo apontamento...",
        style:{...IS,width:"100%",height:70,resize:"vertical",fontFamily:"inherit",fontSize:13}})
    ),
    el("button",{onClick:()=>onAppend(obs),disabled:!obs.trim(),style:{...BTN("linear-gradient(135deg,#16a34a,#22C55E)"),width:"100%",marginBottom:10,padding:"11px",fontSize:14,opacity:obs.trim()?"1":"0.5"}},
      "Criar novo apontamento (manter o existente)"
    ),
    el("button",{onClick:onClose,style:{...BTN(C.gray),width:"100%",padding:"9px",fontSize:13}},
      "Cancelar"
    )
  );
}

// ─── PAINEL ADMIN ─────────────────────────────────────────────
function AdminPanel({user,onClose}){
  const [users,setUsers]       =useState([]);
  const [loading,setLoading]   =useState(true);
  const [msg,setMsg]           =useState({type:"",text:""});
  const [rTarget,setRTarget]   =useState("");
  const [newPw,setNewPw]       =useState("");
  const [resetting,setResetting]=useState(false);
  const [cNome,setCNome]       =useState("");
  const [cSenha,setCSenha]     =useState("");
  const [creating,setCreating] =useState(false);

  function reloadUsers(){ return api("listUsers",{token:user.token}).then(r=>setUsers(r.users||[])); }

  useEffect(()=>{
    reloadUsers().catch(e=>setMsg({type:"error",text:e.message})).finally(()=>setLoading(false));
  },[]);

  async function toggle(nome){
    try{
      const r=await api("toggleUser",{token:user.token,targetNome:nome});
      setUsers(u=>u.map(x=>x.nome===nome?{...x,status:r.newStatus}:x));
      setMsg({type:"success",text:`${nome} ${r.newStatus==="ativo"?"ativado":"bloqueado"}.`});
    }catch(e){ setMsg({type:"error",text:e.message}); }
  }

  async function resetPw(){
    if(!rTarget||!newPw){ setMsg({type:"error",text:"Selecione o usuário e informe a nova senha."}); return; }
    setResetting(true);
    try{
      await api("resetPassword",{token:user.token,targetNome:rTarget,novaSenha:newPw});
      setMsg({type:"success",text:`Senha de "${rTarget}" redefinida.`});
      setRTarget(""); setNewPw("");
    }catch(e){ setMsg({type:"error",text:e.message}); }
    finally{ setResetting(false); }
  }

  async function createUser(){
    if(!cNome||!cSenha){ setMsg({type:"error",text:"Preencha nome e senha."}); return; }
    if(cNome.length<3){ setMsg({type:"error",text:"Nome deve ter pelo menos 3 caracteres."}); return; }
    if(cSenha.length<4){ setMsg({type:"error",text:"Senha deve ter pelo menos 4 caracteres."}); return; }
    setCreating(true);
    try{
      await api("adminCreateUser",{token:user.token,nome:cNome,senha:cSenha});
      setMsg({type:"success",text:`Usuário "${cNome}" criado com sucesso!`});
      setCNome(""); setCSenha("");
      await reloadUsers();
    }catch(e){ setMsg({type:"error",text:e.message}); }
    finally{ setCreating(false); }
  }

  return el("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}},
    el("div",{style:{background:"#fff",borderRadius:14,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"16px 20px",borderRadius:"14px 14px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",{style:{fontWeight:700,fontSize:15,letterSpacing:0.3}},"Painel do Administrador"),
        el("button",{onClick:onClose,style:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:6,padding:"4px 12px",cursor:"pointer",fontWeight:700}},"✕")
      ),
      el("div",{style:{padding:22}},
        el(Alert,{type:msg.type,msg:msg.text}),
        el("div",{style:{fontWeight:700,fontSize:15,color:C.navy,margin:"16px 0 10px"}},"Usuários"),
        loading?el("div",{style:{color:"#94A3B8",textAlign:"center",padding:20}},"Carregando..."):
        el("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:13}},
          el("thead",null,el("tr",{style:{background:"#F8FAFC"}},
            el("th",{style:{padding:"8px 10px",textAlign:"left",fontSize:12,fontWeight:600,color:"#475569"}},"Nome"),
            el("th",{style:{padding:"8px 10px",textAlign:"center",fontSize:12,fontWeight:600,color:"#475569"}},"Perfil"),
            el("th",{style:{padding:"8px 10px",textAlign:"center",fontSize:12,fontWeight:600,color:"#475569"}},"Status"),
            el("th",{style:{padding:"8px 10px",textAlign:"center",fontSize:12,fontWeight:600,color:"#475569"}},"Ação")
          )),
          el("tbody",null,...users.map((u,i)=>
            el("tr",{key:u.nome,style:rowStyle(i)},
              el("td",{style:{padding:"8px 10px",fontWeight:600,color:C.navy}},u.nome),
              el("td",{style:{padding:"8px 10px",textAlign:"center"}},
                el("span",{style:{background:u.role==="admin"?"#fef3c7":"#eff6ff",color:u.role==="admin"?"#92400e":"#003366",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600}},u.role==="admin"?"Admin":"Operador")
              ),
              el("td",{style:{padding:"8px 10px",textAlign:"center"}},
                el("span",{style:{background:u.status==="ativo"?C.green+"1e":C.red+"1e",color:u.status==="ativo"?"#16a34a":"#dc2626",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},u.status==="ativo"?"Ativo":"Bloqueado")
              ),
              el("td",{style:{padding:"8px 10px",textAlign:"center"}},
                u.nome!=="Admin"&&el("button",{onClick:()=>toggle(u.nome),style:{background:u.status==="ativo"?C.red+"1e":"#f0fdf4",color:u.status==="ativo"?"#dc2626":"#16a34a",border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},u.status==="ativo"?"Bloquear":"Ativar")
              )
            )
          ))
        ),
        el("div",{style:{marginTop:22,padding:16,background:"#F8FAFC",borderRadius:12,border:"1px solid #E8ECF1"}},
          el("div",{style:{fontWeight:700,color:C.navy,marginBottom:12}},"Criar Novo Usuário"),
          el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"NOME"),
              el("input",{value:cNome,onChange:e=>setCNome(e.target.value),placeholder:"Nome do usuário",style:{...IS,width:"100%"}})
            ),
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"SENHA INICIAL"),
              el("input",{type:"password",value:cSenha,onChange:e=>setCSenha(e.target.value),placeholder:"Mín. 4 caracteres",style:{...IS,width:"100%"}})
            )
          ),
          el("button",{onClick:createUser,disabled:creating,style:{...BTN("linear-gradient(135deg,#16a34a,#22C55E)"),opacity:creating?.7:1}},creating?"Criando...":"Criar Usuário")
        ),
        el("div",{style:{marginTop:14,padding:16,background:"#F8FAFC",borderRadius:12,border:"1px solid #E8ECF1"}},
          el("div",{style:{fontWeight:700,color:C.navy,marginBottom:12}},"Redefinir Senha"),
          el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"USUÁRIO"),
              el("select",{value:rTarget,onChange:e=>setRTarget(e.target.value),style:{...SS,width:"100%"}},
                el("option",{value:""},"Selecione..."),
                ...users.filter(u=>u.nome!==user.nome).map(u=>el("option",{key:u.nome},u.nome))
              )
            ),
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"NOVA SENHA"),
              el("input",{value:newPw,onChange:e=>setNewPw(e.target.value),placeholder:"Mín. 4 caracteres",style:{...IS,width:"100%"}})
            )
          ),
          el("button",{onClick:resetPw,disabled:resetting,style:{...BTN("linear-gradient(135deg,#003366,#0066B3)"),opacity:resetting?.7:1}},resetting?"Redefinindo...":"Redefinir")
        )
      )
    )
  );
}

// ─── ECHARTS: CONFIGURAÇÕES DE GRÁFICOS ───────────────────────
function getChartOption(type, data, mobile) {
  var m = !!mobile;
  var fs = m ? 10 : 11;
  var tooltipBase = {
    backgroundColor: '#fff', borderColor: '#D0DEE8', borderWidth: 1,
    borderRadius: 8, padding: m ? [6, 10] : [8, 12],
    textStyle: {color: '#2D3E4E', fontSize: m ? 11 : 12},
    confine: true
  };

  if (type === 'bar') {
    if (m) {
      // Mobile: horizontal bars — machine names readable on Y axis
      var needZoomM = data.length > 5;
      var optM = {
        animation: true, animationDuration: 750, animationEasing: 'cubicOut',
        tooltip: {
          ...tooltipBase, trigger: 'axis', axisPointer: {type: 'shadow'},
          formatter: params => {
            var idx = params[0].dataIndex;
            var d = data[data.length - 1 - idx];
            return '<b>'+d.name+'</b><br/>Meta: '+d.meta.toLocaleString('pt-BR')+'<br/>Produção: '+d.producao.toLocaleString('pt-BR');
          }
        },
        legend: {data: ['Meta', 'Produção'], top: 0, right: 0, textStyle: {fontSize: fs}},
        grid: {top: 30, right: 10, bottom: needZoomM ? 40 : 8, left: 8, containLabel: true},
        yAxis: {type: 'category', data: data.slice().reverse().map(d=>d.name), axisLabel: {fontSize: fs, width: 100, overflow: 'truncate', lineHeight: 14}},
        xAxis: {type: 'value', axisLabel: {formatter: v=>v>=1000?(v/1000).toFixed(0)+'k':String(v), fontSize: fs}},
        series: [
          {name:'Meta',     type:'bar', data:data.slice().reverse().map(d=>d.meta),     itemStyle:{color:C.gray,  borderRadius:[0,4,4,0]}, barMaxWidth: 16},
          {name:'Produção', type:'bar', data:data.slice().reverse().map(d=>d.producao),  itemStyle:{color:C.blue,  borderRadius:[0,4,4,0]}, barMaxWidth: 16}
        ]
      };
      if (needZoomM) {
        optM.dataZoom = [{type:'slider',yAxisIndex:0,start:0,end:Math.min(100,Math.round(5/data.length*100)),right:0,width:16,borderColor:'#D1D5DB',fillerColor:'rgba(0,102,179,0.12)',handleStyle:{color:'#0066B3'}}];
      }
      return optM;
    }
    // Desktop: vertical bars
    var opt = {
      animation: true, animationDuration: 750, animationEasing: 'cubicOut',
      tooltip: {
        ...tooltipBase, trigger: 'axis',
        axisPointer: {type: 'shadow', shadowStyle: {color: 'rgba(0,0,0,0.05)'}},
        formatter: params => {
          const d = data[params[0].dataIndex];
          return `<b>${d.name}</b><br/>Meta: ${d.meta.toLocaleString('pt-BR')}<br/>Produção: ${d.producao.toLocaleString('pt-BR')}`;
        }
      },
      legend: {data: ['Meta', 'Produção'], top: 0, right: 0, textStyle: {fontSize: fs}},
      grid: {top: 40, right: 30, bottom: 70, left: 60},
      xAxis: {type: 'category', data: data.map(d=>d.name), axisLabel: {rotate: 15, fontSize: fs, interval: 0}},
      yAxis: {type: 'value', axisLabel: {formatter: v=>v.toLocaleString('pt-BR'), fontSize: fs}},
      series: [
        {name:'Meta',     type:'bar', data:data.map(d=>d.meta),    itemStyle:{color:C.gray,  borderRadius:[4,4,0,0]}, barMaxWidth: 40},
        {name:'Produção', type:'bar', data:data.map(d=>d.producao), itemStyle:{color:C.blue, borderRadius:[4,4,0,0]}, barMaxWidth: 40}
      ]
    };
    return opt;
  }

  if (type === 'pie') {
    return {
      animation: true, animationDuration: 750,
      tooltip: {
        ...tooltipBase, trigger: 'item',
        formatter: p=>`<b>${p.name}</b><br/>${p.value.toLocaleString('pt-BR')} peças<br/>${p.percent.toFixed(0)}%`
      },
      legend: {orient: 'horizontal', bottom: 0, textStyle: {fontSize: fs}, itemWidth: m ? 12 : 25, itemHeight: m ? 10 : 14, itemGap: m ? 8 : 10},
      color: [C.blue, C.green, C.yellow, C.purple, C.teal],
      series: [{
        type: 'pie', radius: m ? ['30%', '58%'] : ['35%', '65%'], center: ['50%', m ? '42%' : '45%'],
        data: data.map(d=>({name:d.name, value:d.value})),
        label: m ? {show: false} : {formatter: '{b}: {d}%', fontSize: 12},
        emphasis: {
          label: {show: true, fontSize: m ? 12 : 14, fontWeight: 'bold'},
          itemStyle: {shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)'}
        }
      }]
    };
  }

  if (type === 'line') {
    var needZoom2 = m && data.length > 7;
    var opt2 = {
      animation: true, animationDuration: 750, animationEasing: 'cubicOut',
      tooltip: {
        ...tooltipBase, trigger: 'axis',
        axisPointer: {type: 'shadow', shadowStyle: {color: 'rgba(0,0,0,0.05)'}},
        formatter: params => {
          const lines = params.map(p=>`${p.seriesName}: ${Number(p.value).toLocaleString('pt-BR')}`).join('<br/>');
          return `<b>${params[0]?.axisValue}</b><br/>${lines}`;
        }
      },
      legend: {data: ['Produção Real', 'Meta'], top: 0, right: 0, textStyle: {fontSize: fs}},
      grid: {top: 40, right: m ? 10 : 30, bottom: needZoom2 ? 80 : (m ? 50 : 60), left: m ? 40 : 65},
      xAxis: {type: 'category', data: data.map(d=>d.date), axisLabel: {rotate: m ? 45 : 15, fontSize: fs, formatter: m ? function(v){return v.length>5?v.slice(5):v;} : undefined}},
      yAxis: {type: 'value', axisLabel: {formatter: v=> m ? (v>=1000?(v/1000).toFixed(0)+'k':v) : v.toLocaleString('pt-BR'), fontSize: fs}},
      series: [
        {
          name: 'Produção Real', type: 'line', data: data.map(d=>d.producao),
          smooth: true, symbol: m ? 'none' : 'circle', symbolSize: 6,
          lineStyle: {color: C.blue, width: m ? 2 : 3}, itemStyle: {color: C.blue},
          areaStyle: {color: {type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:C.blue+'44'},{offset:1,color:C.blue+'00'}]}}
        },
        {
          name: 'Meta', type: 'line', data: data.map(d=>Math.round(d.meta)),
          smooth: true, lineStyle: {color: C.purple, width: 2, type: 'dashed'},
          itemStyle: {color: C.purple}, symbol: 'none'
        }
      ]
    };
    if (needZoom2) {
      opt2.dataZoom = [{type:'slider',start:0,end:Math.min(100,Math.round(7/data.length*100)),bottom:10,height:22,borderColor:'#D1D5DB',fillerColor:'rgba(0,102,179,0.12)',handleStyle:{color:'#0066B3'}}];
    }
    return opt2;
  }

  if (type === 'horizontalBar') {
    const colors = data.map(d=>d.pct>=100?C.green:d.pct>=80?C.yellow:C.red);
    var needZoomH = m && data.length > 5;
    var opt3 = {
      animation: true, animationDuration: 750, animationEasing: 'cubicOut',
      tooltip: {
        ...tooltipBase, trigger: 'axis', axisPointer: {type: 'shadow'},
        formatter: params=>`<b>${params[0].name}</b><br/>% da Meta: ${params[0].value}%`
      },
      grid: {top: 10, right: m ? 45 : 60, bottom: needZoomH ? 40 : 10, left: 10, containLabel: true},
      xAxis: {type:'value', axisLabel:{formatter:'{value}%',fontSize:fs}, max:v=>Math.max(v.max*1.1,110)},
      yAxis: {type:'category', data:data.map(d=>d.name), axisLabel:{fontSize:fs, width: m ? 70 : 130, overflow:'truncate'}},
      series: [{
        type: 'bar', barMaxWidth: m ? 18 : 30,
        data: data.map((d,i)=>({value:d.pct, itemStyle:{color:colors[i],borderRadius:[0,4,4,0]}})),
        label: {show:true, position:'right', formatter:'{c}%', fontSize:fs, color:'#2D3E4E'}
      }]
    };
    if (needZoomH) {
      opt3.dataZoom = [{type:'slider',yAxisIndex:0,start:0,end:Math.min(100,Math.round(5/data.length*100)),right:0,width:16,borderColor:'#D1D5DB',fillerColor:'rgba(0,102,179,0.12)',handleStyle:{color:'#0066B3'}}];
    }
    return opt3;
  }
  return {};
}

// ─── ECHARTS: COMPONENTE REUTILIZÁVEL ─────────────────────────
function EChartsComponent({title, subtitle, data, type, height=350, isMobile}){
  const chartRef  = useRef(null);
  const instanceRef = useRef(null);
  var m = !!isMobile;
  var dLen = (data||[]).length;
  var effectiveHeight = m ? (type==='horizontalBar' ? Math.max(260, dLen*38) : type==='bar' ? Math.max(280, dLen*48) : type==='pie' ? 280 : 280) : height;

  useEffect(()=>{
    if(!chartRef.current || typeof echarts==='undefined') return;
    instanceRef.current = echarts.init(chartRef.current);
    return()=>{ if(instanceRef.current){ instanceRef.current.dispose(); instanceRef.current=null; } };
  },[]);

  useEffect(()=>{
    if(!instanceRef.current||!data||data.length===0) return;
    instanceRef.current.setOption(getChartOption(type,data,m),true);
  },[data,type,m]);

  useEffect(()=>{
    const fn=()=>{ if(instanceRef.current) instanceRef.current.resize(); };
    window.addEventListener('resize',fn);
    return()=>window.removeEventListener('resize',fn);
  },[]);

  if(!data||data.length===0){
    return el("div",{style:{background:"#fff",borderRadius:12,padding:m?24:40,textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}},
      el("div",{style:{fontSize:m?14:16,color:C.gray,fontWeight:600}},"Nenhum dado disponível"),
      el("div",{style:{fontSize:m?12:13,color:"#94A3B8",marginTop:4}},"Ajuste os filtros ou adicione apontamentos")
    );
  }
  return el("div",{style:{background:"#fff",borderRadius:12,padding:m?12:20,boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}},
    title&&el("div",{style:{marginBottom:m?8:12}},
      el("div",{style:{fontSize:m?14:16,fontWeight:700,color:C.navy}},title),
      subtitle&&el("div",{style:{fontSize:m?11:12,color:"#94A3B8",marginTop:2}},subtitle)
    ),
    el("div",{ref:chartRef,style:{width:"100%",height:effectiveHeight}})
  );
}

// ─── TAB APONTAMENTO ──────────────────────────────────────────
// FIX: TabEntrada refatorada — inputs chaveados por mId (persistem entre filtros),
// sem exibição de "já apontado" (tabela é apenas para inserção de dados)
function TabEntrada({machines,metas,inputs,obsInputs,entryDate,setEntryDate,entryTurno,setEntryTurno,syncSt,pendingCount,handleSave,setInputs,setObsInputs}){
  function getVal(mId){ return inputs[mId]!==undefined?inputs[mId]:""; }
  function getObsVal(mId){ return obsInputs[mId]!==undefined?obsInputs[mId]:""; }
  function setVal(mId,val){ setInputs(p=>({...p,[mId]:val})); }
  function setObsVal(mId,val){ setObsInputs(p=>({...p,[mId]:val})); }

  const lbl={fontSize:11,color:"#6B7280",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"};
  return el("div",null,
    el("div",{style:{background:"#fff",borderRadius:12,padding:"14px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",marginBottom:16,display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-end"}},
      el("div",null,el("div",{style:lbl},"DATA"),el("input",{type:"date",value:entryDate,onChange:e=>setEntryDate(e.target.value),style:{...IS,width:"auto"}})),
      el("div",null,el("div",{style:lbl},"TURNO"),
        el("select",{value:entryTurno,onChange:e=>setEntryTurno(e.target.value),style:{...SS,width:"auto"}},
          ...TURNOS.map(t=>el("option",{key:t,value:t},t))
        )
      ),
      el("div",{style:{display:"flex",flexDirection:"column",gap:4}},
        el("button",{onClick:handleSave,disabled:syncSt==="syncing"||pendingCount===0,style:BTN(syncSt==="ok"?"linear-gradient(135deg,#16a34a,#22C55E)":syncSt==="error"?"linear-gradient(135deg,#dc2626,#EF4444)":"linear-gradient(135deg,#003366,#0066B3)",{fontSize:15,padding:"9px 28px",opacity:pendingCount===0?.5:1})},
          syncSt==="syncing"?"Salvando...":syncSt==="ok"?"Salvo!":syncSt==="error"?"Erro!":("Salvar"+(pendingCount>0?` (${pendingCount})`:"")))
        ,pendingCount>0&&el("div",{style:{fontSize:11,color:C.yellow,fontWeight:600,textAlign:"center"}},`${pendingCount} não salvo(s)`)
      )
    ),
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",overflow:"hidden"}},
      el("div",{style:{overflowX:"auto"}},
      el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:660}},
        el("thead",null,el("tr",{style:{background:C.navy,color:"#fff"}},
          el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:12,fontWeight:600,letterSpacing:"0.3px"}},"MÁQUINA"),
          el("th",{style:{padding:"11px 10px",textAlign:"center",fontSize:12,fontWeight:600,width:90}},"META"),
          el("th",{style:{padding:"11px 10px",textAlign:"center",fontSize:12,fontWeight:600,width:130}},"PRODUÇÃO"),
          el("th",{style:{padding:"11px 10px",textAlign:"center",fontSize:12,fontWeight:600,width:80}},"% META"),
          el("th",{style:{padding:"11px 10px",textAlign:"left",  fontSize:12,fontWeight:600}},"OBSERVAÇÃO"),
          el("th",{style:{padding:"11px 10px",textAlign:"center",fontSize:12,fontWeight:600,width:75}},"STATUS")
        )),
        el("tbody",null,...machines.map((m,i)=>{
          const val=getVal(m.id);
          const obsVal=getObsVal(m.id);
          const hasPending=val!==""||obsVal!=="";
          const metaVal=metas[m.id]||0;
          const pct=m.hasMeta&&metaVal>0&&val!==""?Math.round(num(val)/metaVal*100):null;
          const col=pctCol(pct);
          return el("tr",{key:m.id,style:rowStyle(i)},
            el("td",{style:{padding:"10px 14px",fontSize:13,fontWeight:600,color:C.navy}},m.name,!m.hasMeta&&el("span",{style:{marginLeft:6,fontSize:11,color:"#94A3B8",fontWeight:400}},"sem meta")),
            el("td",{style:{padding:"10px 10px",textAlign:"center",fontSize:13,color:"#475569"}},m.hasMeta?metaVal.toLocaleString("pt-BR"):el("span",{style:{color:"#C8D8E4"}},"—")),
            el("td",{style:{padding:"6px 10px",textAlign:"center"}},
              el("input",{type:"number",min:"0",placeholder:"0",value:val,onChange:e=>setVal(m.id,e.target.value),style:{...IS,width:100,textAlign:"center",fontSize:15,fontWeight:700,borderColor:hasPending?C.yellow:"#D1D5DB",borderWidth:hasPending?2:1}})
            ),
            el("td",{style:{padding:"10px 10px",textAlign:"center"}},
              pct!==null?el("span",{style:{background:col+"1e",color:pct>=100?"#16a34a":pct>=80?"#d97706":"#dc2626",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},`${pct}%`):
              val!==""?el("span",{style:{background:"#eff6ff",color:"#0066B3",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},`${num(val).toLocaleString("pt-BR")} pç`):
              el("span",{style:{color:"#C8D8E4"}},"—")
            ),
            el("td",{style:{padding:"6px 10px"}},
              el("input",{type:"text",placeholder:"Observação...",value:obsVal,onChange:e=>setObsVal(m.id,e.target.value),style:{...IS,width:"100%",minWidth:140,fontSize:12,borderColor:obsVal!==""?C.blue:"#D1D5DB",borderWidth:obsVal!==""?2:1}})
            ),
            el("td",{style:{padding:"10px 10px",textAlign:"center",fontSize:12}},
              hasPending?el("span",{style:{color:"#d97706",fontWeight:700}},"● pend."):
              el("span",{style:{color:"#C8D8E4"}},"—")
            )
          );
        }))
      )
      )
    )
  );
}

// ─── TAB DASHBOARD ────────────────────────────────────────────
function TabDashboard({machines,metas,dashData,machAgg,totProd,totMeta,chartProdVsMeta,chartTurnoData,chartTendencia,chartPerformers,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,dView,setDView,isMobile,onOpenExport}){
  const kpis = el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:16}},
    ...[
      {label:"PRODUÇÃO TOTAL",  value:totProd.toLocaleString("pt-BR"),                              sub:"peças",       color:C.blue},
      {label:"META TOTAL",      value:totMeta.toLocaleString("pt-BR"),                              sub:"peças",       color:C.navy},
      {label:"% ATINGIMENTO",   value:totMeta>0?`${Math.round(totProd/totMeta*100)}%`:"—",          sub:"geral",       color:totMeta>0?pctCol(Math.round(totProd/totMeta*100)):C.gray},
      {label:"REGISTROS",       value:dashData.length,                                              sub:"lançamentos", color:C.teal},
      {label:"MÁQUINAS ATIVAS", value:Object.keys(machAgg).length,                                  sub:`de ${machines.length}`, color:C.yellow},
    ].map(k=>el("div",{key:k.label,style:{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",borderLeft:`4px solid ${k.color}`}},
      el("div",{style:{fontSize:10.5,color:"#6B7280",fontWeight:700,letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:6}},k.label),
      el("div",{style:{fontSize:26,fontWeight:800,color:k.color,lineHeight:1.1,marginBottom:3}},k.value),
      el("div",{style:{fontSize:11,color:"#94A3B8"}},k.sub)
    ))
  );

  const viewButtons = el("div",{style:{display:"flex",gap:2,background:"#F0F2F5",borderRadius:6,padding:3,marginLeft:"auto"}},
    ...[["resumo","Resumo"],["detalhado","Detalhado"],["comparativo","Turnos"],["graficos","Gráficos"]].map(([k,l])=>
      el("button",{key:k,onClick:()=>setDView(k),style:{padding:"6px 14px",border:"none",borderRadius:4,cursor:"pointer",fontSize:13,fontWeight:dView===k?700:500,background:dView===k?C.navy:"transparent",color:dView===k?"#fff":"#475569",transition:"all .2s",boxShadow:dView===k?"0 1px 3px rgba(0,51,102,0.2)":"none"}},l)
    )
  );

  const exportBar = el("div",{style:{background:"#fff",borderRadius:8,padding:"10px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",marginBottom:16,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}},
    el("button",{onClick:()=>onOpenExport(),disabled:dashData.length===0,style:{...BTN("linear-gradient(135deg,#003366,#0066B3)",{fontSize:13,padding:"8px 22px"}),opacity:dashData.length===0?.5:1}},"Exportar")
  );

  return el("div",null,
    el(FilterBar,{dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines,extra:viewButtons}),
    kpis,
    exportBar,
    dView==="resumo"&&el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",overflow:"hidden"}},
      el("div",{style:{overflowX:"auto"}},
      el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:520}},
        el("thead",null,el("tr",{style:{background:C.navy,color:"#fff"}},
          el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:12,fontWeight:600,letterSpacing:"0.3px"}},"MÁQUINA"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:12,fontWeight:600}},"DIAS"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:12,fontWeight:600}},"PRODUÇÃO"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:12,fontWeight:600}},"META"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:12,fontWeight:600}},"%"),
          el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:12,fontWeight:600,minWidth:100}},"PROGRESSO")
        )),
        el("tbody",null,...machines.filter(m=>dfMac==="TODAS"||m.name===dfMac).map((m,i)=>{
          const a=machAgg[m.id];
          return el("tr",{key:m.id,style:rowStyle(i)},
            el("td",{style:{padding:"10px 14px",fontSize:13,fontWeight:600,color:C.navy}},m.name),
            el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:13}},a?.diasCount??0),
            el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:14,fontWeight:700,color:C.navy}},(a?.totalProd??0).toLocaleString("pt-BR")),
            el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:13,color:"#94A3B8"}},m.hasMeta?(a?.totalMeta??0).toLocaleString("pt-BR"):"—"),
            el("td",{style:{padding:"10px 14px",textAlign:"center"}},a?.pct!=null?el("span",{style:{background:pctCol(a.pct)+"1e",color:a.pct>=100?"#16a34a":a.pct>=80?"#d97706":"#dc2626",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},`${a.pct}%`):el("span",{style:{color:"#C8D8E4"}},"—")),
            el("td",{style:{padding:"10px 14px"}},a?.pct!=null?el(MiniBar,{pct:a.pct,color:pctCol(a.pct)}):el("span",{style:{color:"#C8D8E4",fontSize:11}},"sem meta"))
          );
        }))
      )
      )
    ),
    dView==="detalhado"&&el("div",null,
      ...Object.values(machAgg).sort((a,b)=>a.name.localeCompare(b.name)).map(a=>
        el("div",{key:a.name,style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",marginBottom:12,overflow:"hidden"}},
          el("div",{style:{background:C.navy,color:"#fff",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
            el("span",{style:{fontWeight:700,fontSize:14}},a.name),
            el("span",{style:{fontSize:13,color:"#8BACC8",fontWeight:500}},`Total: ${a.totalProd.toLocaleString("pt-BR")} pç${a.pct!=null?` — ${a.pct}% meta`:""}`)
          ),
          el("div",{style:{overflowX:"auto"}},
            el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:400}},
              el("thead",null,el("tr",{style:{background:"#F8FAFC"}},
                el("th",{style:{padding:"7px 14px",textAlign:"left",fontSize:12,color:"#475569",fontWeight:600}},"DATA"),
                ...TURNOS.map(t=>el("th",{key:t,style:{padding:"7px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},t)),
                el("th",{style:{padding:"7px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"TOTAL DIA")
              )),
              el("tbody",null,...Object.keys(a.byDate).sort().reverse().map((date,i)=>{
                const dt=TURNOS.reduce((s,t)=>s+(a.byDate[date][t]||0),0);
                return el("tr",{key:date,style:rowStyle(i)},
                  el("td",{style:{padding:"7px 14px",fontSize:13,fontWeight:600}},dispD(date)),
                  ...TURNOS.map(t=>el("td",{key:t,style:{padding:"7px 14px",textAlign:"center",fontSize:13}},a.byDate[date][t]!==undefined?a.byDate[date][t].toLocaleString("pt-BR"):el("span",{style:{color:"#B8CDD8"}},"—"))),
                  el("td",{style:{padding:"7px 14px",textAlign:"center",fontWeight:700}},dt.toLocaleString("pt-BR"))
                );
              }))
            )
          )
        )
      ),
      Object.keys(machAgg).length===0&&el("div",{style:{background:"#fff",borderRadius:8,padding:40,textAlign:"center",color:"#8FA4B2"}},"Nenhum dado encontrado.")
    ),
    dView==="comparativo"&&el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"12px 18px",fontWeight:700,fontSize:14,letterSpacing:"0.2px"}},"Comparativo por Turno"),
      el("div",{style:{overflowX:"auto"}},
      el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:440}},
        el("thead",null,el("tr",{style:{background:"#F8FAFC"}},
          el("th",{style:{padding:"10px 14px",textAlign:"left",  fontSize:12,color:"#475569",fontWeight:600}},"MÁQUINA"),
          ...TURNOS.map(t=>el("th",{key:t,style:{padding:"10px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},t)),
          el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"TOTAL"),
          el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"MELHOR")
        )),
        el("tbody",null,...machines.filter(m=>dfMac==="TODAS"||m.name===dfMac).map((m,i)=>{
          const a=machAgg[m.id];
          const tp=TURNOS.map(t=>({t,v:a?.turnos[t]||0}));
          const best=tp.reduce((b,x)=>x.v>b.v?x:b,{t:"—",v:-1});
          const total=a?.totalProd??0;
          return el("tr",{key:m.id,style:rowStyle(i)},
            el("td",{style:{padding:"9px 14px",fontSize:13,fontWeight:600,color:C.navy}},m.name),
            ...tp.map(({t,v})=>el("td",{key:t,style:{padding:"9px 14px",textAlign:"center",fontSize:13}},
              v>0?el("div",null,el("div",{style:{fontWeight:700}},v.toLocaleString("pt-BR")),total>0&&el("div",{style:{fontSize:10,color:C.gray}},`${Math.round(v/total*100)}%`)):el("span",{style:{color:"#B8CDD8"}},"—")
            )),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontWeight:800,fontSize:14,color:C.navy}},total>0?total.toLocaleString("pt-BR"):"—"),
            el("td",{style:{padding:"9px 14px",textAlign:"center"}},best.v>0?el("span",{style:{background:C.green+"22",color:C.green,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},best.t):el("span",{style:{color:"#B8CDD8"}},"—"))
          );
        }))
      )
      )
    ),
    dView==="graficos"&&(
      chartProdVsMeta.length===0&&chartTurnoData.length===0
        ? el("div",{style:{background:"#fff",borderRadius:12,padding:40,textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}},
            el("div",{style:{fontSize:16,color:C.gray,fontWeight:600,marginBottom:4}},"Nenhum dado disponível para gráficos"),
            el("div",{style:{fontSize:13,color:"#94A3B8",marginTop:4}},"Ajuste os filtros ou adicione apontamentos")
          )
        : el("div",{style:{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit, minmax(550px, 1fr))",gap:isMobile?12:16}},
            el(EChartsComponent,{title:"Produção vs Meta por Máquina",subtitle:"Comparativo entre produção real e meta estabelecida",data:chartProdVsMeta,type:"bar",height:350,isMobile}),
            el(EChartsComponent,{title:"Distribuição por Turno",subtitle:"Percentual de produção em cada turno",data:chartTurnoData,type:"pie",height:350,isMobile}),
            el(EChartsComponent,{title:"Tendência de Produção",subtitle:"Evolução diária da produção no período",data:chartTendencia,type:"line",height:350,isMobile}),
            el(EChartsComponent,{title:"Ranking de Performance",subtitle:"Máquinas ordenadas por % da meta",data:chartPerformers,type:"horizontalBar",height:350,isMobile})
          )
    )
  );
}

// ─── TAB HISTÓRICO ────────────────────────────────────────────
function TabHistorico({machines,metas,sortedHistorico,dashData,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,setEditRec,setDeleteRec,setObsRec}){
  return el("div",null,
    el(FilterBar,{dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines}),
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"12px 18px",fontWeight:700,display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",{style:{fontSize:14,letterSpacing:"0.2px"}},"Apontamentos Salvos"),
        el("span",{style:{fontSize:12,color:"#8BACC8",fontWeight:500}},`${dashData.length} registros`)
      ),
      el("div",{style:{overflowX:"auto"}},
        el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:760}},
          el("thead",null,el("tr",{style:{background:C.navy,color:"#fff"}},
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,fontWeight:600,letterSpacing:"0.3px"}},"DATA"),
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,fontWeight:600}},"TURNO"),
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,fontWeight:600}},"MÁQUINA"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,fontWeight:600}},"META"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,fontWeight:600}},"PRODUÇÃO"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,fontWeight:600}},"%"),
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,fontWeight:600}},"APONTADO POR"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,fontWeight:600}},"AÇÕES")
          )),
          el("tbody",null,
            sortedHistorico.length===0&&el("tr",null,el("td",{colSpan:8,style:{padding:32,textAlign:"center",color:"#8FA4B2"}},"Nenhum apontamento no período.")),
            ...sortedHistorico.map((r,i)=>{
              const mId=Number(r.machineId);
              const mac=machines.find(m=>m.id===mId);
              const savedMeta=num(r.meta);
              const metaVal=savedMeta>0?savedMeta:(mac?.hasMeta?(metas[mId]||mac.defaultMeta||0):0);
              const prod=num(r.producao);
              const pct=mac?.hasMeta&&metaVal>0?Math.round(prod/metaVal*100):null;
              const savedByName=r.savedBy||"";
              return el("tr",{key:r.id||r.date+"_"+r.turno+"_"+mId,style:rowStyle(i)},
                el("td",{style:{padding:"9px 12px",fontSize:13,fontWeight:600}},dispDH(r.savedAt||r.date)),
                el("td",{style:{padding:"9px 12px",fontSize:13}},r.turno),
                el("td",{style:{padding:"9px 12px",fontSize:13,fontWeight:600,color:C.navy}},r.machineName||(mac?.name||"—")),
                el("td",{style:{padding:"9px 12px",textAlign:"center",fontSize:13,color:C.gray}},metaVal>0?metaVal.toLocaleString("pt-BR"):"—"),
                el("td",{style:{padding:"10px 12px",textAlign:"center",fontSize:14,fontWeight:700}},prod.toLocaleString("pt-BR")),
                el("td",{style:{padding:"10px 12px",textAlign:"center"}},pct!==null?el("span",{style:{background:pctCol(pct)+"1e",color:pct>=100?"#16a34a":pct>=80?"#d97706":"#dc2626",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},`${pct}%`):el("span",{style:{color:"#C8D8E4"}},"—")),
                el("td",{style:{padding:"10px 12px",fontSize:12}},
                  el("div",{style:{fontWeight:600,color:"#1E293B"}},savedByName||"—"),
                  r.editUser&&el("div",{style:{fontSize:11,color:"#d97706",marginTop:2}},`Editado por ${r.editUser}${r.editTime?" · "+dispDH(r.editTime):""}`),
                  r.obs&&el("div",{style:{fontSize:11,color:"#0066B3",marginTop:3,background:"#eff6ff",borderRadius:4,padding:"2px 6px",display:"inline-block"}},r.obs)
                ),
                el("td",{style:{padding:"10px 12px",textAlign:"center"}},
                  el("div",{style:{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}},
                    el("button",{onClick:()=>setEditRec({...r,machineId:mId,producao:prod,meta:metaVal,savedBy:savedByName}),style:{background:"#eff6ff",color:"#0066B3",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"Editar"),
                    el("button",{onClick:()=>setObsRec({...r,machineId:mId,producao:prod,meta:metaVal,savedBy:savedByName}),title:"Observação",style:{background:r.obs?"#eff6ff":"#f0fdf4",color:r.obs?"#0066B3":"#16a34a",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"Obs"),
                    el("button",{onClick:()=>setDeleteRec({...r,machineId:mId}),style:{background:C.red+"1e",color:"#dc2626",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"Excluir")
                  )
                )
              );
            })
          )
        )
      )
    )
  );
}

// ─── TAB METAS ────────────────────────────────────────────────
function TabMetas({machines,metas,metasInfo,updateMeta,metasLoading,metasSaving,metaEdit,setMetaEdit,saveMetasToServer}){
  return el("div",null,
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}},
        el("span",{style:{fontWeight:700,fontSize:14,letterSpacing:"0.2px"}},"Metas por Máquina"+(metasLoading?" ...":"")),
        el("div",{style:{display:"flex",gap:8,alignItems:"center"}},
          metaEdit&&el("button",{onClick:()=>setMetaEdit(false),disabled:metasSaving,style:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:6,padding:"5px 14px",cursor:"pointer",fontSize:13,fontWeight:600}},"Cancelar"),
          el("button",{
            onClick:metaEdit?saveMetasToServer:()=>setMetaEdit(true),
            disabled:metasLoading||metasSaving,
            style:{background:metaEdit?"rgba(34,197,94,0.25)":"rgba(255,255,255,0.08)",border:`1px solid ${metaEdit?"rgba(34,197,94,0.5)":"rgba(255,255,255,0.15)"}`,color:"#fff",borderRadius:6,padding:"5px 14px",cursor:(metasLoading||metasSaving)?"not-allowed":"pointer",fontSize:13,fontWeight:600}
          },metasSaving?"Salvando...":metaEdit?"Salvar Metas":"Editar Metas")
        )
      ),
      metasLoading
        ? el("div",{style:{padding:40,textAlign:"center",color:"#94A3B8",fontSize:14}},"Carregando metas do servidor...")
        : el("div",{style:{overflowX:"auto"}},
            el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:580}},
              el("thead",null,el("tr",{style:{background:"#F8FAFC"}},
                el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:12,color:"#475569",fontWeight:600}},"MÁQUINA"),
                el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"META / TURNO"),
                el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"META / DIA"),
                el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"META / MÊS (22 dias)"),
                el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"VIGENTE DESDE")
              )),
              el("tbody",null,...machines.map((m,i)=>{
                const info = metasInfo?.[m.id];
                const vigencia = info?.vigenciaInicio ? dispD(info.vigenciaInicio) : (info?.updatedAt ? dispD(info.updatedAt) : "—");
                const updatedBy = info?.updatedBy || "";
                return el("tr",{key:m.id,style:rowStyle(i)},
                  el("td",{style:{padding:"10px 14px",fontSize:13,fontWeight:600,color:C.navy}},
                    m.name,!m.hasMeta&&el("span",{style:{marginLeft:6,fontSize:11,color:"#94A3B8",fontWeight:400}},"sem meta")
                  ),
                  el("td",{style:{padding:"7px 14px",textAlign:"center"}},
                    metaEdit&&m.hasMeta
                      ?el("input",{type:"number",min:"0",value:metas[m.id]??0,onChange:e=>updateMeta(m.id,e.target.value),style:{...IS,width:100,textAlign:"center",fontWeight:700,fontSize:15}})
                      :el("span",{style:{fontSize:15,fontWeight:700,color:m.hasMeta?C.navy:"#94A3B8"}},m.hasMeta?(metas[m.id]||0).toLocaleString("pt-BR"):"—")
                  ),
                  el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:14,color:"#475569"}},m.hasMeta?((metas[m.id]||0)*3).toLocaleString("pt-BR"):"—"),
                  el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:14,color:"#475569"}},m.hasMeta?((metas[m.id]||0)*3*22).toLocaleString("pt-BR"):"—"),
                  el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:12}},
                    m.hasMeta
                      ? el("div",null,
                          el("div",{style:{fontWeight:600,color:"#1E293B"}},vigencia),
                          updatedBy&&el("div",{style:{fontSize:11,color:"#94A3B8",marginTop:2}},`por ${updatedBy}`)
                        )
                      : el("span",{style:{color:"#C8D8E4"}},"—")
                  )
                );
              }))
            )
          ),
      el("div",{style:{padding:"12px 18px",background:"#F8FAFC",borderTop:"1px solid #E8ECF1",fontSize:12,color:"#94A3B8"}},
        "Metas são ",el("b",null,"globais")," — todos os usuários verão as mesmas metas simultaneamente. Clique em ",el("b",null,"Editar Metas")," para alterar e em ",el("b",null,"Salvar Metas")," para aplicar a todos."
      )
    )
  );
}

// ─── TAB FEEDBACKS ────────────────────────────────────────────
function TabFeedbacks({machines,metas,feedbacksData,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,setObsRec,setDeleteRec}){
  const counter = el("div",{style:{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}},
    el("div",{style:{background:"rgba(0,102,179,0.08)",border:"1px solid rgba(0,102,179,0.2)",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,color:C.blue}},
      `${feedbacksData.length} observaç${feedbacksData.length!==1?"ões":"ão"}`
    )
  );

  return el("div",null,
    el(FilterBar,{dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines,showTurno:false,extra:counter}),
    feedbacksData.length===0
      ? el("div",{style:{background:"#fff",borderRadius:12,padding:60,textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}},
          el("div",{style:{fontSize:17,fontWeight:700,color:C.navy,marginBottom:6}},"Nenhuma observação no período"),
          el("div",{style:{fontSize:13,color:"#94A3B8"}},"Adicione observações nos apontamentos pelo ",el("b",null,"Histórico")," (botão Obs em cada linha)")
        )
      : el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}},
          ...feedbacksData.map(r=>{
            const mac=machines.find(m=>m.id===Number(r.machineId));
            const prod=num(r.producao);
            const savedMeta=num(r.meta);
            const metaVal=savedMeta>0?savedMeta:(mac?.hasMeta?(metas[r.machineId]||0):0);
            const pct=mac?.hasMeta&&metaVal>0?Math.round(prod/metaVal*100):null;
            const savedByName=r.savedBy||"";
            const regBy   = r.editUser||r.savedBy||"—";
            const regDate = r.editTime?dispDH(r.editTime):dispDH(r.savedAt);
            return el("div",{key:r.id||r.date+"_"+r.turno+"_"+r.machineId,style:{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",borderLeft:`4px solid ${C.blue}`,display:"flex",flexDirection:"column",gap:10}},
              el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}},
                el("div",null,
                  el("div",{style:{fontWeight:700,fontSize:14,color:C.navy}},r.machineName||(mac?.name||"—")),
                  el("div",{style:{fontSize:12,color:"#94A3B8",marginTop:2}},`Apontamento: ${dispD(r.date)} · ${r.turno}`)
                ),
                pct!==null&&el("span",{style:{background:pctCol(pct)+"1e",color:pct>=100?"#16a34a":pct>=80?"#d97706":"#dc2626",borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}},`${pct}%`)
              ),
              el("div",{style:{background:"#eff6ff",borderRadius:8,padding:"10px 14px",fontSize:13,color:C.navy,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}},r.obs),
              el("div",{style:{borderTop:"1px solid #F0F2F5",paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}},
                el("div",{style:{fontSize:11,color:"#94A3B8"}},`Registrado por ${regBy} em ${regDate}`),
                el("div",{style:{display:"flex",gap:6}},
                  el("button",{onClick:()=>setObsRec({...r,machineId:Number(r.machineId),producao:prod,meta:metaVal,savedBy:savedByName}),style:{background:"#eff6ff",color:"#0066B3",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"Editar"),
                  el("button",{onClick:()=>setDeleteRec({...r,machineId:Number(r.machineId)}),style:{background:C.red+"1e",color:"#dc2626",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"Excluir")
                )
              )
            );
          })
        )
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────
function App(){
  const [user,setUser]               = useState(()=>loadSession());
  const [machines,setMachines]       = useState(MACHINES_DEFAULT);
  const [metas,setMetasState]        = useState(()=>{
    const cached=loadCachedMetas(); return cached||loadMetasDefaults(MACHINES_DEFAULT);
  });
  const [metasLoading,setMetasLoading] = useState(false);
  const [metasSaving,setMetasSaving]   = useState(false);
  const [records,setRecords]         = useState(()=>loadCachedRecords());
  const [conflictInfo,setConflictInfo] = useState(null); // {toSend, conflicts}
  const [tab,setTab]                 = useState("entrada");
  const [entryDate,setEntryDate]     = useState(today());
  const [entryTurno,setEntryTurno]   = useState("TURNO 1");
  const [inputs,setInputs]           = useState({});
  const [obsInputs,setObsInputs]     = useState({});
  const [syncSt,setSyncSt]           = useState(null);
  const [loading,setLoading]         = useState(false);
  const [lastSync,setLastSync]       = useState(null);
  const [editRec,setEditRec]         = useState(null);
  const [deleteRec,setDeleteRec]     = useState(null);
  const [editSaving,setEditSaving]   = useState(false);
  const [deleting,setDeleting]       = useState(false);
  const [obsRec,setObsRec]           = useState(null);
  const [obsSaving,setObsSaving]     = useState(false);
  const [showAdmin,setShowAdmin]     = useState(false);
  const [showExport,setShowExport]   = useState(false);
  const [dfIni,setDfIni]             = useState(()=>{ const d=new Date(); d.setDate(1); return fmt(d); });
  const [dfFim,setDfFim]             = useState(today());
  const [dfMac,setDfMac]             = useState("TODAS");
  const [dfTur,setDfTur]             = useState("TODOS");
  const [dView,setDView]             = useState("resumo");
  const [metaEdit,setMetaEdit]       = useState(false);
  const [metasInfo,setMetasInfo]     = useState({});
  const pollRef    = useRef(null);
  const metaEditRef= useRef(false);
  const userRef    = useRef(user);
  const isMobile   = useIsMobile();

  useEffect(()=>{ metaEditRef.current=metaEdit; },[metaEdit]);
  useEffect(()=>{ userRef.current=user; },[user]);

  function updateMeta(id,val){ setMetasState(m=>({...m,[id]:num(val)})); }

  const loadAll=useCallback(async(silent=false)=>{
    if(!silent) setLoading(true);
    try{
      const r=await api("getAll",{},userRef.current);
      const data=r.data||[];
      setRecords(data);
      saveCachedRecords(data); // FIX: persiste no cache para startup instantâneo
      setLastSync(new Date());
    }catch(e){
      console.error("Erro ao carregar dados:", e);
      if(!silent) setSyncSt("error");
      // FIX: api() já faz clearSession+reload em erro de sessão — não precisa handleLogout aqui
    }
    finally{ if(!silent) setLoading(false); }
  },[]); // eslint-disable-line

  const loadMetasFromServer=useCallback(async(silent=false)=>{
    if(metaEditRef.current) return;
    if(!silent) setMetasLoading(true);
    try{
      const r=await api("getMetas",{},userRef.current);
      if(r.ok&&r.metas){
        const m={};
        MACHINES_DEFAULT.forEach(mac=>{ m[mac.id]=r.metas[mac.id]!==undefined?r.metas[mac.id]:mac.defaultMeta; });
        setMetasState(m);
        saveCachedMetas(m); // FIX: persiste no cache
        if(r.metasInfo) setMetasInfo(r.metasInfo);
      }
    }catch(e){ console.error("Erro ao carregar metas:", e); }
    finally{ if(!silent) setMetasLoading(false); }
  },[]); // eslint-disable-line

  const loadMachines=useCallback(async()=>{
    try{
      const r=await api("getMachines",{},userRef.current);
      if(r.ok&&r.machines&&r.machines.length>0) setMachines(r.machines);
    }catch(e){ console.warn("getMachines falhou, usando fallback local:", e.message); }
  },[]); // eslint-disable-line

  async function saveMetasToServer(){
    setMetasSaving(true);
    try{
      const r=await api("saveMetas",{metas},userRef.current);
      if(r.ok){
        setMetaEdit(false);
        await loadMetasFromServer();
      } else{ alert("Erro ao salvar metas: "+(r.error||"Tente novamente.")); }
    }catch(e){ alert("Erro ao salvar metas. Verifique sua conexão."); }
    finally{ setMetasSaving(false); }
  }

  useEffect(()=>{
    if(user){
      loadAll();
      loadMetasFromServer();
      loadMachines();
      pollRef.current=setInterval(()=>{ loadAll(true); loadMetasFromServer(true); },30000); // Auto-update: 30s polling
    }
    return()=>clearInterval(pollRef.current);
  },[user]); // eslint-disable-line

  // FIX: buildToSend usa entryDate/entryTurno correntes para TODOS os inputs pendentes (chaveados por mId)
  function buildToSend(overrideObs){
    const currentInputs   = {...inputs};
    const currentObsInputs= {...obsInputs};
    const currentMetas    = {...metas};
    const timestamp = nowBR();
    const date = entryDate;
    const turno = entryTurno;

    // Coleta mIds únicos com input ou obs pendente
    const pendingMIds=new Set();
    Object.keys(currentInputs).forEach(k=>{ if(currentInputs[k]!==undefined&&currentInputs[k]!=="") pendingMIds.add(Number(k)); });
    Object.keys(currentObsInputs).forEach(k=>{ if(currentObsInputs[k]!==undefined&&currentObsInputs[k]!=="") pendingMIds.add(Number(k)); });

    const toSend=[];
    pendingMIds.forEach(mId=>{
      const m=machines.find(mc=>mc.id===mId); if(!m) return;
      const val=currentInputs[mId];
      if(val===undefined||val==="") return; // só envia se tem produção digitada
      const metaVal=m.hasMeta?(currentMetas[m.id]||m.defaultMeta||0):0;
      const obsVal=overrideObs!==undefined?overrideObs:(currentObsInputs[mId]||undefined);
      toSend.push({
        date, turno, machineId:m.id, machineName:m.name,
        meta:metaVal, producao:num(val), savedBy:user.nome, savedAt:timestamp,
        editUser:"", editTime:"",
        obs:(obsVal!==undefined&&obsVal!=="")?obsVal:undefined
      });
    });
    return toSend;
  }

  // FIX: doSave — aceita action "upsert" ou "append", limpa inputs por mId
  async function doSave(toSend, action){
    const apiAction = action || "upsert";
    if(!toSend.length){ setSyncSt(null); return; }
    setSyncSt("syncing");
    const saved=[];
    try{
      for(let i=0;i<toSend.length;i+=4){
        await api(apiAction,{records:toSend.slice(i,i+4)},user);
        saved.push(...toSend.slice(i,i+4));
      }
      await loadAll(true);
      setSyncSt("ok"); setTimeout(()=>setSyncSt(null),3000);
    }catch(e){
      console.error("Erro ao salvar:", e);
      setSyncSt("error");
      setTimeout(()=>setSyncSt(null),4000);
    }finally{
      if(saved.length>0){
        // FIX: limpa por machineId (não por cellKey)
        setInputs(prev=>{ const next={...prev}; saved.forEach(r=>delete next[r.machineId]); return next; });
        setObsInputs(prev=>{ const next={...prev}; saved.forEach(r=>delete next[r.machineId]); return next; });
        if(saved.length<toSend.length) loadAll(true);
      }
    }
  }

  // FIX: handleSave com detecção de conflito
  async function handleSave(){
    const toSend = buildToSend();
    if(!toSend.length){ setSyncSt(null); return; }

    // Detectar conflitos: registros que já existem para date/turno/machineId
    const conflicts=toSend.filter(r=>{
      return records.some(ex=>Number(ex.machineId)===r.machineId && normDate(ex.date)===r.date && ex.turno===r.turno);
    });

    if(conflicts.length>0){
      // Mostrar modal de conflito
      setConflictInfo({toSend, conflicts});
    } else {
      // Sem conflito — upsert direto
      await doSave(toSend, "upsert");
    }
  }

  // Ações do ConflictModal
  function handleConflictReplace(){
    if(!conflictInfo) return;
    setConflictInfo(null);
    doSave(conflictInfo.toSend, "upsert");
  }
  function handleConflictAppend(obs){
    if(!conflictInfo) return;
    // Adiciona justificativa obrigatória a todos os registros
    const toSend=conflictInfo.toSend.map(r=>({...r, obs: obs||r.obs||""}));
    setConflictInfo(null);
    doSave(toSend, "append");
  }

  async function handleEdit(newVal){
    if(!editRec) return;
    const timestamp = nowBR();
    setEditSaving(true);
    try{
      const mId=Number(editRec.machineId);
      const mac=machines.find(m=>m.id===mId);
      const metaToSave=num(editRec.meta)>0?num(editRec.meta):(mac?.hasMeta?(metas[mId]||mac.defaultMeta||0):0);
      const result=await api("upsert",{records:[{
        date:editRec.date, turno:editRec.turno, machineId:mId,
        machineName:mac?.name||editRec.machineName||"",
        meta:metaToSave, producao:newVal,
        savedBy:editRec.savedBy||user.nome, savedAt:editRec.savedAt||timestamp,
        editUser:user.nome, editTime:timestamp
      }]},user);
      if(!result.ok) throw new Error(result.error||"Erro ao editar");
      await loadAll(true);
      setEditRec(null);
      setSyncSt("ok"); setTimeout(()=>setSyncSt(null),2000);
    }catch(e){
      console.error("Erro ao editar:", e);
      setSyncSt("error"); setTimeout(()=>setSyncSt(null),3000);
    }
    finally{ setEditSaving(false); }
  }

  async function handleDelete(){
    if(!deleteRec) return;
    setDeleting(true);
    try{
      const result=await api("delete",{id:deleteRec.id,date:deleteRec.date,turno:deleteRec.turno,machineId:Number(deleteRec.machineId)},user);
      if(!result.ok) throw new Error(result.error||"Erro ao excluir");
      await loadAll(true);
      setDeleteRec(null);
      setSyncSt("ok"); setTimeout(()=>setSyncSt(null),2000);
    }catch(e){
      console.error("Erro ao excluir:", e);
      setSyncSt("error"); setTimeout(()=>setSyncSt(null),3000);
    }
    finally{ setDeleting(false); }
  }

  async function handleSaveObs(text){
    if(!obsRec) return;
    setObsSaving(true);
    try{
      const mId=Number(obsRec.machineId);
      const mac=machines.find(m=>m.id===mId);
      const metaToSave=num(obsRec.meta)>0?num(obsRec.meta):(mac?.hasMeta?(metas[mId]||mac.defaultMeta||0):0);
      const now=nowBR();
      await api("upsert",{records:[{
        date:obsRec.date, turno:obsRec.turno, machineId:mId,
        machineName:mac?.name||obsRec.machineName||"",
        meta:metaToSave, producao:num(obsRec.producao),
        savedBy:obsRec.savedBy||user.nome, savedAt:obsRec.savedAt||now,
        editUser:user.nome, editTime:now,
        obs:text
      }]},user);
      await loadAll(true);
      setObsRec(null);
      setSyncSt("ok"); setTimeout(()=>setSyncSt(null),2000);
    }catch(e){ console.error("Erro ao salvar obs:", e); setSyncSt("error"); setTimeout(()=>setSyncSt(null),3000); }
    finally{ setObsSaving(false); }
  }

  function handleLogout(){
    const token=user?.token;
    clearSession();
    saveCachedRecords([]); // FIX: limpa cache ao sair
    saveCachedMetas(null);
    setUser(null);
    setRecords([]);
    clearInterval(pollRef.current);
    if(token) api("logout",{token}).catch(()=>{});
  }

  // ── dados filtrados ──
  const dashData=useMemo(()=>records.filter(r=>{
    if(!r.date) return false;
    const recDate=normDate(r.date);
    if(!recDate) return false;
    if(recDate<dfIni||recDate>dfFim) return false;
    if(dfTur!=="TODOS"&&r.turno!==dfTur) return false;
    if(dfMac!=="TODAS"){ const mac=machines.find(m=>m.name===dfMac); if(!mac||Number(r.machineId)!==mac.id) return false; }
    return true;
  }),[records,dfIni,dfFim,dfTur,dfMac,machines]);

  const machAgg=useMemo(()=>{
    const agg={};
    dashData.forEach(r=>{
      const id=Number(r.machineId);
      const nd=normDate(r.date);
      if(!agg[id]){ const mac=machines.find(m=>m.id===id); agg[id]={name:r.machineName||mac?.name||"Máquina "+id,hasMeta:mac?.hasMeta??false,totalProd:0,dias:new Set(),turnos:{},byDate:{}}; }
      agg[id].totalProd+=num(r.producao);
      agg[id].dias.add(nd);
      agg[id].turnos[r.turno]=(agg[id].turnos[r.turno]||0)+num(r.producao);
      if(!agg[id].byDate[nd]) agg[id].byDate[nd]={};
      agg[id].byDate[nd][r.turno]=num(r.producao);
    });
    Object.entries(agg).forEach(([id,a])=>{
      const nId=Number(id);
      a.diasCount=a.dias.size;
      a.totalMeta=a.hasMeta?(metas[nId]||0)*a.diasCount*(dfTur==="TODOS"?TURNOS.length:1):0;
      a.pct=a.totalMeta>0?Math.round(a.totalProd/a.totalMeta*100):null;
    });
    return agg;
  },[dashData,metas,dfTur,machines]);

  const totProd=useMemo(()=>dashData.reduce((s,r)=>s+num(r.producao),0),[dashData]);
  const totMeta=useMemo(()=>Object.values(machAgg).reduce((s,a)=>s+a.totalMeta,0),[machAgg]);

  const chartProdVsMeta=useMemo(()=>
    machines.filter(m=>dfMac==="TODAS"||m.name===dfMac)
      .map(m=>{ const a=machAgg[m.id]||{}; return {name:m.name,meta:a.totalMeta||0,producao:a.totalProd||0}; })
      .filter(m=>m.meta>0||m.producao>0)
      .sort((a,b)=>b.producao-a.producao).slice(0,10)
  ,[machAgg,dfMac,machines]);

  const chartTurnoData=useMemo(()=>{
    const totals={};
    dashData.forEach(r=>{ totals[r.turno]=(totals[r.turno]||0)+num(r.producao); });
    return TURNOS.map(t=>({name:t,value:totals[t]||0})).filter(t=>t.value>0);
  },[dashData]);

  const chartTendencia=useMemo(()=>{
    const byDate={};
    dashData.forEach(r=>{ const nd=normDate(r.date); if(!nd) return; if(!byDate[nd]) byDate[nd]={prod:0}; byDate[nd].prod+=num(r.producao); });
    return Object.keys(byDate).sort().map(date=>({
      date:dispD(date), producao:byDate[date].prod,
      meta:Object.values(machAgg).reduce((s,a)=>s+(a.byDate&&a.byDate[date]?a.totalMeta/(a.diasCount||1):0),0)
    }));
  },[dashData,machAgg]);

  const chartPerformers=useMemo(()=>
    machines.filter(m=>dfMac==="TODAS"||m.name===dfMac)
      .map(m=>{ const a=machAgg[m.id]||{}; return {name:m.name,pct:a.pct||0,producao:a.totalProd||0}; })
      .filter(m=>m.producao>0).sort((a,b)=>b.pct-a.pct).slice(0,8)
  ,[machAgg,dfMac,machines]);

  const feedbacksData=useMemo(()=>
    records.filter(r=>{
      if(!r.obs||!r.obs.trim()) return false;
      const recDate=normDate(r.date);
      if(!recDate||recDate<dfIni||recDate>dfFim) return false;
      if(dfMac!=="TODAS"){ const mac=machines.find(m=>m.id===Number(r.machineId)); if(!mac||mac.name!==dfMac) return false; }
      return true;
    }).sort((a,b)=>b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno))
  ,[records,dfIni,dfFim,dfMac,machines]);

  const sortedHistorico=useMemo(()=>
    [...dashData].sort((a,b)=>b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno))
  ,[dashData]);

  // FIX: pendingCount conta mIds únicos (não double-conta input+obs da mesma máquina)
  const pendingCount=useMemo(()=>{
    const mIds=new Set();
    Object.keys(inputs).forEach(k=>{ if(inputs[k]!==undefined&&inputs[k]!=="") mIds.add(k); });
    Object.keys(obsInputs).forEach(k=>{ if(obsInputs[k]!==undefined&&obsInputs[k]!=="") mIds.add(k); });
    return mIds.size;
  },[inputs,obsInputs]);

  if(!user) return el(AuthScreen,{onLogin:u=>{ saveSession(u); setUser(u); }});

  // ── header ──
  const header=el("div",{style:{background:"linear-gradient(135deg,#003366 0%,#004E8C 100%)",height:isMobile?"auto":60,padding:isMobile?"8px 12px":"0",display:"flex",alignItems:"stretch",justifyContent:"space-between",flexWrap:"wrap",gap:0,borderBottom:"3px solid #0066B3"}},
    el("div",{style:{display:"flex",alignItems:"center",gap:0,height:"100%"}},
      el("div",{style:{background:"#0066B3",height:"100%",padding:isMobile?"10px 14px":"0 24px",display:"flex",alignItems:"center",justifyContent:"center"}},
        el(WEGLogoSVG,{height:isMobile?22:26,color:"#fff"})
      ),
      el("div",{style:{padding:isMobile?"8px 0":"0 16px"}},
        el("div",{style:{color:"#fff",fontSize:isMobile?13:15,fontWeight:600,letterSpacing:"0.3px"}},(isMobile?"Dashboard":"Dashboard de Produção")),
        el("div",{style:{color:"#8BACC8",fontSize:11,marginTop:1}},`${user.nome}`+(isMobile?"":" · "+(lastSync?`Atualizado às ${lastSync.toLocaleTimeString("pt-BR")}`:"Conectando...")),loading?" ...":"")
      )
    ),
    el("div",{style:{display:"flex",gap:10,alignItems:"center",padding:isMobile?"0":"0 20px 0 0"}},
      syncSt==="syncing"&&el("span",{style:{color:"#fde68a",fontSize:11,fontWeight:500}},"Sincronizando..."),
      syncSt==="ok"    &&el("span",{style:{color:"#86efac",fontSize:11,fontWeight:500}},"Salvo"),
      syncSt==="error" &&el("span",{style:{color:"#fca5a5",fontSize:11,fontWeight:500}},"Erro"),
      user.role==="admin"&&el("button",{onClick:()=>setShowAdmin(true),style:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#C8D8E8",borderRadius:6,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600,transition:"background .15s"}},isMobile?"Admin":"Admin"),
      el("button",{onClick:handleLogout,style:{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",color:"#fca5a5",borderRadius:6,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600,transition:"background .15s"}},isMobile?"Sair":"Sair")
    )
  );

  // ── tabs ──
  const tabLabels=[["entrada",isMobile?"Apontar":"Apontamento"],["dashboard",isMobile?"Dash":"Dashboard"],["historico",isMobile?"Hist.":"Histórico"],["metas",isMobile?"Metas":"Metas"],["feedbacks",isMobile?"Obs":"Feedbacks"]];
  const tabs=el("div",{style:{background:"#002548",display:"flex",paddingLeft:0,overflowX:"auto"}},
    ...tabLabels.map(([k,l])=>
      el("button",{key:k,onClick:()=>setTab(k),style:{padding:isMobile?"10px 14px":"13px 24px",border:"none",borderBottom:tab===k?"3px solid #0066B3":"3px solid transparent",cursor:"pointer",whiteSpace:"nowrap",fontWeight:tab===k?700:500,background:tab===k?"rgba(0,102,179,0.15)":"transparent",color:tab===k?"#fff":"#8BACC8",borderRadius:0,fontSize:isMobile?13:14,transition:"all .2s",letterSpacing:"0.2px",fontFamily:"inherit"}},l)
    )
  );

  return el("div",{style:{fontFamily:"'Segoe UI','Inter',-apple-system,sans-serif",background:"#F5F6FA",minHeight:"100vh"}},
    editRec  &&el(EditModal,  {rec:editRec,  metas,machines,onSave:handleEdit,    onClose:()=>setEditRec(null),  saving:editSaving}),
    deleteRec&&el(DeleteModal,{rec:deleteRec,machines,     onConfirm:handleDelete,onClose:()=>setDeleteRec(null),deleting}),
    obsRec   &&el(ObsModal,   {rec:obsRec,   machines,     onSave:handleSaveObs,  onClose:()=>setObsRec(null),  saving:obsSaving}),
    conflictInfo&&el(ConflictModal,{conflicts:conflictInfo.conflicts,onReplace:handleConflictReplace,onAppend:handleConflictAppend,onClose:()=>setConflictInfo(null)}),
    showAdmin&&el(AdminPanel,{user,onClose:()=>setShowAdmin(false)}),
    showExport&&el(ExportModal,{onClose:()=>setShowExport(false),onExport:(format,sections)=>{setShowExport(false);doExport(format,sections,{data:dashData,machines,metas,machAgg,totProd,totMeta,dfIni,dfFim,dfTur,dfMac});}}),
    header, tabs,
    el("div",{style:{padding:isMobile?"12px 10px":"16px 24px",maxWidth:1400,margin:"0 auto",width:"100%",boxSizing:"border-box"}},
      tab==="entrada"   &&el(TabEntrada,   {machines,metas,inputs,obsInputs,entryDate,setEntryDate,entryTurno,setEntryTurno,syncSt,pendingCount,handleSave,setInputs,setObsInputs}),
      tab==="dashboard" &&el(TabDashboard, {machines,metas,dashData,machAgg,totProd,totMeta,chartProdVsMeta,chartTurnoData,chartTendencia,chartPerformers,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,dView,setDView,isMobile,onOpenExport:()=>setShowExport(true)}),
      tab==="historico" &&el(TabHistorico, {machines,metas,sortedHistorico,dashData,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,setEditRec,setDeleteRec,setObsRec}),
      tab==="metas"     &&el(TabMetas,     {machines,metas,metasInfo,updateMeta,metasLoading,metasSaving,metaEdit,setMetaEdit,saveMetasToServer}),
      tab==="feedbacks" &&el(TabFeedbacks, {machines,metas,feedbacksData,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,setObsRec,setDeleteRec})
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
