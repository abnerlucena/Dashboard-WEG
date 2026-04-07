// ─── CONFIGURE AQUI ───────────────────────────────────────────
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGLTUyqhMPU3jdGLBa9wiT2L59EMm976s_XN-FdNg9P7gjzwJTdnLmc2JgZDBuzc3aHA/exec";

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
const IS = {border:"1px solid #D1D5DB",borderRadius:6,padding:"7px 10px",fontSize:14,background:"#fff",outline:"none",transition:"border-color .15s,box-shadow .15s",fontFamily:"inherit",fontWeight:500};
const SS = {...IS,cursor:"pointer"};
const BTN= (bg,ex={})=>({background:bg,color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontWeight:700,fontSize:14,cursor:"pointer",transition:"filter .15s",fontFamily:"inherit",...ex});
const esc= s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ─── PUSH BUTTON 3D (CSS) ────────────────────────────────────
var FONT_CSS=`
@font-face{font-family:'Sebino';src:url('sebino font/Sebino-Font/Sebino-Regular.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Sebino';src:url('sebino font/sebino-medium_freefontdownload_org/sebino-medium/sebino-medium.ttf') format('truetype');font-weight:500;font-style:normal;font-display:swap}
@font-face{font-family:'Sebino';src:url('sebino font/Sebino-Font-bold/sebino-bold/sebino-bold.ttf') format('truetype');font-weight:700;font-style:normal;font-display:swap}
@font-face{font-family:'Sebino';src:url('sebino font/sebino-heavy_freefontdownload_org/sebino-heavy/sebino-heavy.ttf') format('truetype');font-weight:800;font-style:normal;font-display:swap}
@font-face{font-family:'Sebino';src:url('sebino font/sebino-black_freefontdownload_org/sebino-black/sebino-black.ttf') format('truetype');font-weight:900;font-style:normal;font-display:swap}
@font-face{font-family:'Sebino';src:url('sebino font/sebino-black-italic_freefontdownload_org/sebino-black-italic/sebino-black-italic.ttf') format('truetype');font-weight:900;font-style:italic;font-display:swap}
*,*::before,*::after{font-family:'Sebino','Segoe UI','Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
input,select,button,textarea{font-family:inherit}
input[type="password"]::-ms-reveal,input[type="password"]::-ms-clear{display:none!important}
input::-webkit-credentials-auto-fill-button{display:none!important;visibility:hidden;pointer-events:none}
input::-webkit-contacts-auto-fill-button{display:none!important;visibility:hidden;pointer-events:none}
`;
var TOAST_CSS=`@keyframes toast-in{0%{opacity:0;transform:translateX(-50%) translateY(10px) scale(.95)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}`;
var LOADER_CSS=`.save-loader{position:relative;display:inline-block;width:50px;height:24px}.save-loader .sl-bar,.save-loader .sl-bar:before,.save-loader .sl-bar:after{background:#fff;animation:sl-bounce .8s infinite ease-in-out;width:6px;height:16px;border-radius:2px}.save-loader .sl-bar{display:inline-block;position:relative;animation-delay:.16s!important}.save-loader .sl-bar:before,.save-loader .sl-bar:after{position:absolute;top:0;content:""}.save-loader .sl-bar:before{left:-10px}.save-loader .sl-bar:after{left:10px;animation-delay:.32s!important}@keyframes sl-bounce{0%,80%,100%{opacity:.75;box-shadow:0 0 currentColor;height:16px}40%{opacity:1;box-shadow:0 -4px currentColor;height:20px}}.save-loader-header .sl-bar,.save-loader-header .sl-bar:before,.save-loader-header .sl-bar:after{background:#fde68a;width:4px;height:12px}.save-check{display:inline-flex;align-items:center;justify-content:center}.save-check svg{animation:sl-pop .35s cubic-bezier(.3,.7,.4,1.5)}@keyframes sl-pop{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}`;
var PUSH_CSS=`.push-btn{position:relative;border:none;background:transparent;padding:0;cursor:pointer;outline-offset:4px;transition:filter 250ms;user-select:none;touch-action:manipulation}.push-btn .pb-sh{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:10px;will-change:transform;transform:translateY(2px);transition:transform 600ms cubic-bezier(.3,.7,.4,1)}.push-btn .pb-edge{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:10px}.push-btn .pb-front{display:block;position:relative;padding:8px 20px;border-radius:10px;font-size:13px;font-weight:700;font-family:inherit;letter-spacing:.4px;will-change:transform;transform:translateY(-4px);transition:transform 600ms cubic-bezier(.3,.7,.4,1)}.push-btn:hover{filter:brightness(110%)}.push-btn:hover .pb-front{transform:translateY(-6px);transition:transform 250ms cubic-bezier(.3,.7,.4,1.5)}.push-btn:active .pb-front{transform:translateY(-2px);transition:transform 34ms}.push-btn:hover .pb-sh{transform:translateY(4px);transition:transform 250ms cubic-bezier(.3,.7,.4,1.5)}.push-btn:active .pb-sh{transform:translateY(1px);transition:transform 34ms}.push-btn:focus:not(:focus-visible){outline:none}.push-tv .pb-sh{background:hsl(0deg 0% 0%/.12)}.push-tv .pb-edge{background:linear-gradient(to left,hsl(210 18% 78%) 0%,hsl(210 14% 90%) 8%,hsl(210 14% 90%) 92%,hsl(210 18% 78%) 100%)}.push-tv .pb-front{background:#fff;color:#003366}.push-sair .pb-sh{background:hsl(0deg 0% 0%/.25)}.push-sair .pb-edge{background:linear-gradient(to left,hsl(345 100% 16%) 0%,hsl(345 100% 32%) 8%,hsl(345 100% 32%) 92%,hsl(345 100% 16%) 100%)}.push-sair .pb-front{background:hsl(345 100% 47%);color:#fff}`;

function SaveLoader({header}){
  return el("span",{className:"save-loader"+(header?" save-loader-header":"")},el("span",{className:"sl-bar"}));
}
function SaveCheck({size,color}){
  return el("span",{className:"save-check"},el("svg",{width:size||20,height:size||20,viewBox:"0 0 24 24",fill:"none",stroke:color||"#22C55E",strokeWidth:3,strokeLinecap:"round",strokeLinejoin:"round"},el("polyline",{points:"4 12 10 18 20 6"})));
}

function PushButton({label,variant,onClick,icon}){
  return el("button",{className:"push-btn push-"+variant,onClick:onClick,title:label||variant},
    el("span",{className:"pb-sh"}),
    el("span",{className:"pb-edge"}),
    el("span",{className:"pb-front",style:{minWidth:icon&&!label?44:undefined,minHeight:icon&&!label?44:undefined,display:"flex",alignItems:"center",justifyContent:"center",padding:icon&&!label?"10px":undefined}},
      icon&&!label?el("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",...icon.svgProps},icon.path):label
    )
  );
}

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
function buildExportSections(sections, ctx, opts) {
  var {data,machines,metas,machAgg,totProd,totMeta,dfIni,dfFim,dfTur,dfMac} = ctx;
  var hideEmpty = opts && opts.hideEmpty;
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
      if(hideEmpty) macList = macList.filter(function(m){ var a=machAgg[m.id]; return !!a; });
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

    if(sec==='feedbacks'){
      var fbData = data.filter(function(r){ return r.obs && r.obs.trim(); }).sort(function(a,b){ return b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno); });
      html.push('<h3 style="color:#003366;margin:24px 0 10px;font-size:15px">Feedbacks / Observações <span style="font-weight:400;font-size:13px;color:#6B7280">('+fbData.length+')</span></h3>');
      if(fbData.length===0){
        html.push('<p style="color:#94A3B8;margin:16px 0">Nenhuma observação registrada no período.</p>');
      } else {
        html.push('<table><thead><tr><th>Data</th><th>Turno</th><th>Máquina</th><th style="text-align:center">Produção</th><th style="text-align:center">%</th><th>Registrado por</th><th style="min-width:200px">Observação</th></tr></thead><tbody>');
        for(var fi=0;fi<fbData.length;fi++){
          var fr=fbData[fi], fmac=machines.find(function(m){return m.id===Number(fr.machineId);}), fmeta=num(fr.meta), fprod=num(fr.producao);
          var fpct=fmac&&fmac.hasMeta&&fmeta>0?Math.round(fprod/fmeta*100):null;
          var fcol=fpct===null?'#6B7280':fpct>=100?'#22C55E':fpct>=80?'#F59E0B':'#EF4444';
          var fbg=fi%2===0?'#F8FAFC':'#fff';
          html.push('<tr style="background:'+fbg+'"><td>'+dispD(fr.date)+'</td><td>'+fr.turno+'</td><td style="font-weight:600;color:#003366">'+(fr.machineName||(fmac?fmac.name:''))+'</td>');
          html.push('<td style="text-align:center;font-weight:700">'+fprod.toLocaleString('pt-BR')+'</td>');
          html.push('<td style="text-align:center;font-weight:700;color:'+fcol+'">'+(fpct!==null?fpct+'%':'—')+'</td>');
          html.push('<td style="font-size:12px">'+(fr.editUser||fr.savedBy||'')+'</td>');
          html.push('<td style="background:#eff6ff;border-radius:4px;padding:8px 12px;font-size:12px;color:#003366;line-height:1.5">'+fr.obs+'</td></tr>');
        }
        html.push('</tbody></table>');
      }
    }

    if(sec==='turnos'){
      html.push('<h3 style="color:#003366;margin:24px 0 10px;font-size:15px">Comparativo por Turno</h3>');
      html.push('<table><thead><tr><th>Máquina</th><th style="text-align:center">TURNO 1</th><th style="text-align:center">TURNO 2</th><th style="text-align:center">TURNO 3</th><th style="text-align:center">Total</th><th style="text-align:center">Melhor</th></tr></thead><tbody>');
      var macList2 = machines.filter(function(m){ return dfMac==='TODAS'||m.name===dfMac; });
      if(hideEmpty) macList2 = macList2.filter(function(m){ var a=machAgg[m.id]; return !!a; });
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

function doExport(format, sections, ctx, opts) {
  var {data,machines,metas,machAgg,totProd,totMeta,dfIni,dfFim,dfTur,dfMac} = ctx;
  var hideEmpty = opts && opts.hideEmpty;

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
        if(hideEmpty) macList = macList.filter(function(m){ var a=machAgg[m.id]; return !!a; });
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

      if(sec==='feedbacks'){
        var fbData2 = data.filter(function(r){ return r.obs && r.obs.trim(); }).sort(function(a,b){ return b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno); });
        lines.push('"=== FEEDBACKS / OBSERVAÇÕES ('+fbData2.length+') ==="');
        lines.push('"Data";"Turno";"Máquina";"Produção";"% Meta";"Registrado por";"Observação"');
        for(var fi2=0;fi2<fbData2.length;fi2++){
          var fr2=fbData2[fi2], fmac2=machines.find(function(m){return m.id===Number(fr2.machineId);}), fmeta2=num(fr2.meta), fprod2=num(fr2.producao);
          var fpct2=fmac2&&fmac2.hasMeta&&fmeta2>0?Math.round(fprod2/fmeta2*100)+'%':'';
          lines.push([dispD(fr2.date),fr2.turno,fr2.machineName||(fmac2?fmac2.name:''),fprod2,fpct2,fr2.editUser||fr2.savedBy||'',fr2.obs||''].map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(';'));
        }
        lines.push('');
      }

      if(sec==='turnos'){
        lines.push('"=== COMPARATIVO POR TURNO ==="');
        lines.push('"Máquina";"TURNO 1";"TURNO 2";"TURNO 3";"Total";"Melhor Turno"');
        var macList2 = machines.filter(function(m){ return dfMac==='TODAS'||m.name===dfMac; });
        if(hideEmpty) macList2 = macList2.filter(function(m){ var a=machAgg[m.id]; return !!a; });
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
  var sectionsHtml = buildExportSections(sections, ctx, opts);
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
  var [selected,setSelected] = useState({resumo:true,detalhado:true,feedbacks:true,turnos:false,graficos:false});
  var [order,setOrder] = useState(['resumo','detalhado','feedbacks','turnos','graficos']);
  var [hideEmpty,setHideEmpty] = useState(false);

  var labels = {resumo:'Resumo por Máquina',detalhado:'Dados Detalhados',feedbacks:'Feedbacks / Observações',turnos:'Comparativo por Turno',graficos:'Gráficos'};
  var descriptions = {resumo:'KPIs e tabela agregada por máquina',detalhado:'Todos os apontamentos individuais',feedbacks:'Registros com observações no período',turnos:'Produção comparada entre turnos',graficos:'Imagens dos gráficos (apenas PDF)'};

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
    onExport(format, sections, {hideEmpty:hideEmpty});
    onClose();
  }

  var anySelected = order.some(function(k){ return selected[k]; });

  var cardStyle = {border:'1px solid #D1D5DB',borderRadius:8,padding:'10px 12px',display:'flex',alignItems:'center',gap:10,background:'#fff',boxShadow:'0 1px 2px 0 rgba(0,0,0,0.05)',transition:'all .15s'};
  var cardActiveStyle = {border:'1px solid #0066B3',borderRadius:8,padding:'10px 12px',display:'flex',alignItems:'center',gap:10,background:'#eff6ff',boxShadow:'0 0 0 1px rgba(0,102,179,0.1)',transition:'all .15s'};
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
        return el("button",{key:f[0],onClick:function(){setFormat(f[0]);},style:{
          flex:1,padding:"10px 16px",
          background:isActive?"#eff6ff":"#fff",
          border:isActive?"1px solid #0066B3":"1px solid #D1D5DB",
          borderRadius:8,cursor:"pointer",
          fontSize:14,fontWeight:isActive?700:600,lineHeight:"1.25rem",
          color:isActive?"#003366":"#111827",
          boxShadow:isActive?"0 0 0 1px rgba(0,102,179,0.1)":"0 1px 2px 0 rgba(0,0,0,0.05)",
          transition:"all .15s",fontFamily:"inherit"
        }},f[1]);
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

    // Hide empty toggle
    el("div",{onClick:function(){setHideEmpty(!hideEmpty);},style:{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:hideEmpty?"1px solid #0066B3":"1px solid #D1D5DB",borderRadius:8,cursor:"pointer",background:hideEmpty?"#eff6ff":"#fff",boxShadow:hideEmpty?"0 0 0 1px rgba(0,102,179,0.1)":"0 1px 2px 0 rgba(0,0,0,0.05)",marginBottom:18,transition:"all .15s",userSelect:"none"}},
      el("div",{style:{width:20,height:20,borderRadius:4,border:hideEmpty?"2px solid #0066B3":"2px solid #D1D5DB",background:hideEmpty?"#0066B3":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}},
        hideEmpty?el("svg",{width:12,height:12,viewBox:"0 0 12 12",style:{display:"block"}},el("path",{d:"M2 6l3 3 5-5",stroke:"#fff",strokeWidth:2,fill:"none",strokeLinecap:"round",strokeLinejoin:"round"})):null
      ),
      el("div",null,
        el("div",{style:{fontSize:13,fontWeight:600,color:"#1E293B"}},"Ocultar dados não preenchidos"),
        el("div",{style:{fontSize:11,color:"#94A3B8",marginTop:1}},"Remove máquinas sem nenhum apontamento registrado")
      )
    ),

    // Actions
    el("div",{style:{display:"flex",gap:8}},
      el("button",{onClick:onClose,style:{
        flex:1,background:"#fff",border:"1px solid #D1D5DB",borderRadius:8,
        color:"#111827",fontSize:14,fontWeight:600,lineHeight:"1.25rem",
        padding:"10px 16px",cursor:"pointer",
        boxShadow:"0 1px 2px 0 rgba(0,0,0,0.05)",transition:"all .15s",fontFamily:"inherit"
      }},"Cancelar"),
      el("button",{onClick:handleExport,disabled:!anySelected,style:{
        flex:2,background:"linear-gradient(135deg,#003366,#0066B3)",border:"1px solid #003366",borderRadius:8,
        color:"#fff",fontSize:14,fontWeight:700,lineHeight:"1.25rem",
        padding:"10px 16px",cursor:"pointer",
        boxShadow:"0 1px 2px 0 rgba(0,0,0,0.1)",transition:"all .15s",fontFamily:"inherit",
        opacity:anySelected?1:0.5
      }},
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
  const mob=window.innerWidth<640;
  return el("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center",zIndex:1000,padding:mob?0:16}},
    el("div",{style:{background:"#fff",borderRadius:mob?"20px 20px 0 0":"14px",padding:mob?"28px 20px calc(env(safe-area-inset-bottom,0px) + 28px)":"28px",width:"100%",maxWidth:mob?"100%":"440px",boxShadow:mob?"0 -4px 32px rgba(0,0,0,0.2)":"0 8px 32px rgba(0,0,0,0.3)",maxHeight:"92vh",overflowY:"auto"}},
      mob&&el("div",{style:{width:44,height:5,background:"#CBD5E1",borderRadius:3,margin:"0 auto 18px",flexShrink:0}}),
      ...children
    )
  );
}

// ─── TOAST ────────────────────────────────────────────────────
function Toast({msg,type}){
  if(!msg) return null;
  const bg=type==="ok"?"#16a34a":type==="error"?"#dc2626":"#003366";
  return el("div",{style:{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:bg,color:"#fff",borderRadius:30,padding:"12px 28px",fontSize:14,fontWeight:700,letterSpacing:"0.3px",boxShadow:"0 4px 20px rgba(0,0,0,0.25)",whiteSpace:"nowrap",pointerEvents:"none",animation:"toast-in 0.25s cubic-bezier(.3,.7,.4,1.5)"}},
    type==="ok"?"✓ Salvo com sucesso!":type==="error"?"✕ Erro ao salvar. Tente novamente.":msg
  );
}

// ─── FILTRO REUTILIZÁVEL ──────────────────────────────────────
function FilterBar({dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines,showTurno=true,extra=null}){
  const mob=useIsMobile();
  const [open,setOpen]=useState(!mob);
  const lbl={fontSize:11,color:"#6B7280",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"};
  const inner=el("div",{style:{display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-end",marginTop:mob?12:0}},
    el("div",null,
      el("div",{style:lbl},"DE"),
      el("input",{type:"date",value:dfIni,onChange:e=>setDfIni(e.target.value),style:{...IS,width:"auto",minHeight:44}})
    ),
    el("div",null,
      el("div",{style:lbl},"ATÉ"),
      el("input",{type:"date",value:dfFim,onChange:e=>setDfFim(e.target.value),style:{...IS,width:"auto",minHeight:44}})
    ),
    el("div",null,
      el("div",{style:lbl},"MÁQUINA"),
      el("select",{value:dfMac,onChange:e=>setDfMac(e.target.value),style:{...SS,maxWidth:200,width:"auto",minHeight:44}},
        el("option",{value:"TODAS"},"TODAS"),
        ...machines.map(m=>el("option",{key:m.id,value:m.name},m.name))
      )
    ),
    showTurno&&el("div",null,
      el("div",{style:lbl},"TURNO"),
      el("select",{value:dfTur,onChange:e=>setDfTur(e.target.value),style:{...SS,width:"auto",minHeight:44}},
        el("option",{value:"TODOS"},"TODOS"),
        ...TURNOS.map(t=>el("option",{key:t,value:t},t))
      )
    ),
    extra
  );
  return el("div",{style:{background:"#fff",borderRadius:12,padding:"12px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",marginBottom:16}},
    mob&&el("button",{onClick:()=>setOpen(!open),style:{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",width:"100%",padding:0}},
      el("span",{style:{fontSize:13,fontWeight:700,color:"#1E293B",flex:1,textAlign:"left"}},"Filtros"),
      el("span",{style:{fontSize:11,color:"#94A3B8"}},[dfIni&&dfIni!==dfFim?`${dispD(dfIni)} – ${dispD(dfFim)}`:dispD(dfIni)," · ",dfMac==="TODAS"?"Todas":dfMac," · ",dfTur==="TODOS"?"Todos os turnos":dfTur].join("")),
      el("span",{style:{color:"#94A3B8",fontSize:16,marginLeft:6}},open?"▲":"▼")
    ),
    (!mob||open)&&inner
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
  return el("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#001D3D 0%,#003366 40%,#004E8C 100%)",fontFamily:"'Sebino','Segoe UI',sans-serif"}},
    el("div",{style:{background:"#fff",borderRadius:14,padding:"40px 36px",width:390,maxWidth:"95vw",boxShadow:"0 16px 64px rgba(0,20,60,0.4)"}},
      el("div",{style:{textAlign:"center",marginBottom:28}},
        el("div",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",background:C.navy,borderRadius:4,padding:"10px 20px",marginBottom:12}},
          el(WEGLogoSVG,{height:38,color:"#fff"})
        ),
        el("div",{style:{fontSize:16,fontWeight:800,color:C.navy,marginTop:2,letterSpacing:0.4}},"Dashboard de Produção"),
        el("div",{style:{fontSize:13,fontWeight:400,color:"#94A3B8",marginTop:4}},isLogin?"Faça login para continuar":"Crie sua conta de acesso")
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
          el("div",{style:{position:"relative",overflow:"hidden",borderRadius:6}},
            el("input",{type:showPw?"text":"password",value:senha,onChange:e=>setSenha(e.target.value),placeholder:"Mínimo 4 caracteres",autoComplete:"current-password",style:{...IS,width:"100%",paddingRight:72,borderRadius:6}}),
            el("button",{type:"button",onClick:()=>setShowPw(!showPw),style:{position:"absolute",right:0,top:0,bottom:0,background:"transparent",border:"none",borderLeft:"1px solid #E5E7EB",padding:"0 12px",cursor:"pointer",fontSize:12,fontWeight:600,color:"#94A3B8",whiteSpace:"nowrap",fontFamily:"inherit"}},showPw?"Ocultar":"Mostrar")
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
function AdminPanel({user,onClose,reloadMachines}){
  const [adminTab,setAdminTab]   =useState("users");
  const [users,setUsers]         =useState([]);
  const [loading,setLoading]     =useState(true);
  const [msg,setMsg]             =useState({type:"",text:""});
  const [rTarget,setRTarget]     =useState("");
  const [newPw,setNewPw]         =useState("");
  const [resetting,setResetting] =useState(false);
  const [cNome,setCNome]         =useState("");
  const [cSenha,setCSenha]       =useState("");
  const [creating,setCreating]   =useState(false);
  // Machine state
  const [allMachines,setAllMachines]=useState([]);
  const [machLoading,setMachLoading]=useState(true);
  const [mName,setMName]         =useState("");
  const [mMeta,setMMeta]         =useState("");
  const [mAdding,setMAdding]     =useState(false);
  const [editingMach,setEditingMach]=useState(null);
  const [eName,setEName]         =useState("");
  const [eMeta,setEMeta]         =useState("");
  const [eSaving,setESaving]     =useState(false);

  function reloadUsers(){ return api("listUsers",{token:user.token}).then(r=>setUsers(r.users||[])); }
  function reloadAllMachines(){
    return api("getMachines",{},user).then(r=>{
      if(r.ok&&r.allMachines) setAllMachines(r.allMachines);
      else if(r.ok&&r.machines) setAllMachines(r.machines);
    });
  }

  useEffect(()=>{
    reloadUsers().catch(e=>setMsg({type:"error",text:e.message})).finally(()=>setLoading(false));
    reloadAllMachines().catch(()=>{}).finally(()=>setMachLoading(false));
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

  async function addMachine(){
    if(!mName.trim()){ setMsg({type:"error",text:"Informe o nome da máquina."}); return; }
    setMAdding(true);
    try{
      const r=await api("addMachine",{token:user.token,name:mName.trim(),hasMeta:true,defaultMeta:Number(mMeta)||0});
      if(!r.ok){ setMsg({type:"error",text:r.error||"Erro ao adicionar."}); return; }
      setMsg({type:"success",text:`Máquina "${mName.trim()}" adicionada!`});
      setMName(""); setMMeta("");
      await reloadAllMachines();
      if(reloadMachines) reloadMachines();
    }catch(e){ setMsg({type:"error",text:e.message}); }
    finally{ setMAdding(false); }
  }

  async function toggleMachine(mId){
    try{
      const r=await api("toggleMachine",{token:user.token,machineId:mId});
      if(!r.ok){ setMsg({type:"error",text:r.error||"Erro."}); return; }
      setAllMachines(prev=>prev.map(m=>m.id===mId?{...m,status:r.newStatus}:m));
      setMsg({type:"success",text:`Máquina ${r.newStatus==="ativo"?"ativada":"desativada"}.`});
      if(reloadMachines) reloadMachines();
    }catch(e){ setMsg({type:"error",text:e.message}); }
  }

  function startEdit(m){ setEditingMach(m.id); setEName(m.name); setEMeta(String(m.defaultMeta||0)); }
  function cancelEdit(){ setEditingMach(null); setEName(""); setEMeta(""); }
  async function saveEdit(){
    if(!eName.trim()){ setMsg({type:"error",text:"Nome não pode ser vazio."}); return; }
    setESaving(true);
    try{
      const r=await api("updateMachine",{token:user.token,machineId:editingMach,name:eName.trim(),hasMeta:true,defaultMeta:Number(eMeta)||0});
      if(!r.ok){ setMsg({type:"error",text:r.error||"Erro ao salvar."}); return; }
      setMsg({type:"success",text:"Máquina atualizada!"});
      cancelEdit();
      await reloadAllMachines();
      if(reloadMachines) reloadMachines();
    }catch(e){ setMsg({type:"error",text:e.message}); }
    finally{ setESaving(false); }
  }

  const adminTabStyle=(key)=>({
    background:adminTab===key?"#eff6ff":"#fff",
    border:adminTab===key?"1px solid #0066B3":"1px solid #D1D5DB",
    borderRadius:8,color:adminTab===key?"#003366":"#111827",
    fontSize:13,fontWeight:adminTab===key?700:600,padding:"8px 16px",
    cursor:"pointer",fontFamily:"inherit",transition:"all .15s"
  });

  const thS={padding:"8px 10px",textAlign:"left",fontSize:12,fontWeight:600,color:"#475569"};
  const thC={...thS,textAlign:"center"};

  return el("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}},
    el("div",{style:{background:"#fff",borderRadius:14,width:"100%",maxWidth:620,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"16px 20px",borderRadius:"14px 14px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",{style:{fontWeight:700,fontSize:15,letterSpacing:0.3}},"Painel do Administrador"),
        el("button",{onClick:onClose,style:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:6,padding:"4px 12px",cursor:"pointer",fontWeight:700}},"X")
      ),
      el("div",{style:{display:"flex",gap:6,padding:"12px 22px 0",borderBottom:"1px solid #E5E7EB"}},
        el("button",{onClick:()=>{setAdminTab("users");setMsg({type:"",text:""});},style:adminTabStyle("users")},"Usuarios"),
        el("button",{onClick:()=>{setAdminTab("machines");setMsg({type:"",text:""});},style:adminTabStyle("machines")},"Maquinas")
      ),
      el("div",{style:{padding:22}},
        el(Alert,{type:msg.type,msg:msg.text}),

        // ─── ABA USUÁRIOS ───
        adminTab==="users"&&el("div",null,
          el("div",{style:{fontWeight:700,fontSize:15,color:C.navy,margin:"12px 0 10px"}},"Usuarios"),
          loading?el("div",{style:{color:"#94A3B8",textAlign:"center",padding:20}},"Carregando..."):
          el("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:13}},
            el("thead",null,el("tr",{style:{background:"#F8FAFC"}},
              el("th",{style:thS},"Nome"),
              el("th",{style:thC},"Perfil"),
              el("th",{style:thC},"Status"),
              el("th",{style:thC},"Acao")
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
            el("div",{style:{fontWeight:700,color:C.navy,marginBottom:12}},"Criar Novo Usuario"),
            el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
              el("div",null,
                el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"NOME"),
                el("input",{value:cNome,onChange:e=>setCNome(e.target.value),placeholder:"Nome do usuario",style:{...IS,width:"100%"}})
              ),
              el("div",null,
                el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"SENHA INICIAL"),
                el("input",{type:"password",value:cSenha,onChange:e=>setCSenha(e.target.value),placeholder:"Min. 4 caracteres",style:{...IS,width:"100%"}})
              )
            ),
            el("button",{onClick:createUser,disabled:creating,style:{...BTN("linear-gradient(135deg,#16a34a,#22C55E)"),opacity:creating?.7:1}},creating?"Criando...":"Criar Usuario")
          ),
          el("div",{style:{marginTop:14,padding:16,background:"#F8FAFC",borderRadius:12,border:"1px solid #E8ECF1"}},
            el("div",{style:{fontWeight:700,color:C.navy,marginBottom:12}},"Redefinir Senha"),
            el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
              el("div",null,
                el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"USUARIO"),
                el("select",{value:rTarget,onChange:e=>setRTarget(e.target.value),style:{...SS,width:"100%"}},
                  el("option",{value:""},"Selecione..."),
                  ...users.filter(u=>u.nome!==user.nome).map(u=>el("option",{key:u.nome},u.nome))
                )
              ),
              el("div",null,
                el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"NOVA SENHA"),
                el("input",{value:newPw,onChange:e=>setNewPw(e.target.value),placeholder:"Min. 4 caracteres",style:{...IS,width:"100%"}})
              )
            ),
            el("button",{onClick:resetPw,disabled:resetting,style:{...BTN("linear-gradient(135deg,#003366,#0066B3)"),opacity:resetting?.7:1}},resetting?"Redefinindo...":"Redefinir")
          )
        ),

        // ─── ABA MÁQUINAS ───
        adminTab==="machines"&&el("div",null,
          el("div",{style:{fontWeight:700,fontSize:15,color:C.navy,margin:"12px 0 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
            el("span",null,"Maquinas"),
            el("span",{style:{fontSize:12,fontWeight:600,color:"#475569"}},allMachines.filter(m=>m.status==="ativo").length+" ativas / "+allMachines.length+" total")
          ),
          machLoading?el("div",{style:{color:"#94A3B8",textAlign:"center",padding:20}},"Carregando..."):
          el("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:13}},
            el("thead",null,el("tr",{style:{background:"#F8FAFC"}},
              el("th",{style:{...thS,width:36}},"ID"),
              el("th",{style:thS},"Nome"),
              el("th",{style:{...thC,width:70}},"Meta"),
              el("th",{style:{...thC,width:70}},"Status"),
              el("th",{style:{...thC,width:120}},"Acoes")
            )),
            el("tbody",null,...allMachines.map((m,i)=>{
              const isEdit=editingMach===m.id;
              return el("tr",{key:m.id,style:{...rowStyle(i),opacity:m.status==="inativo"?0.55:1}},
                el("td",{style:{padding:"6px 10px",fontWeight:600,color:"#94A3B8",fontSize:12}},m.id),
                el("td",{style:{padding:"6px 10px",fontWeight:600,color:C.navy}},
                  isEdit?el("input",{value:eName,onChange:e=>setEName(e.target.value),style:{...IS,width:"100%",padding:"4px 8px",fontSize:13}}):m.name
                ),
                el("td",{style:{padding:"6px 10px",textAlign:"center"}},
                  isEdit?el("input",{type:"number",value:eMeta,onChange:e=>setEMeta(e.target.value),style:{...IS,width:60,padding:"4px 6px",fontSize:13,textAlign:"center"}}):
                  el("span",{style:{fontSize:12,color:"#475569"}},m.defaultMeta||"—")
                ),
                el("td",{style:{padding:"6px 10px",textAlign:"center"}},
                  el("span",{style:{background:m.status==="ativo"?C.green+"1e":C.red+"1e",color:m.status==="ativo"?"#16a34a":"#dc2626",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700}},m.status==="ativo"?"Ativa":"Inativa")
                ),
                el("td",{style:{padding:"6px 10px",textAlign:"center",display:"flex",gap:4,justifyContent:"center"}},
                  isEdit?el("div",{style:{display:"flex",gap:4}},
                    el("button",{onClick:saveEdit,disabled:eSaving,style:{background:"#f0fdf4",color:"#16a34a",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,fontWeight:600}},eSaving?"...":"Salvar"),
                    el("button",{onClick:cancelEdit,style:{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,fontWeight:600}},"Cancelar")
                  ):el("div",{style:{display:"flex",gap:4}},
                    el("button",{onClick:()=>startEdit(m),style:{background:"#eff6ff",color:"#0066B3",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,fontWeight:600}},"Editar"),
                    el("button",{onClick:()=>toggleMachine(m.id),style:{background:m.status==="ativo"?C.red+"1e":"#f0fdf4",color:m.status==="ativo"?"#dc2626":"#16a34a",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,fontWeight:600}},m.status==="ativo"?"Desativar":"Ativar")
                  )
                )
              );
            }))
          ),
          el("div",{style:{marginTop:22,padding:16,background:"#F8FAFC",borderRadius:12,border:"1px solid #E8ECF1"}},
            el("div",{style:{fontWeight:700,color:C.navy,marginBottom:12}},"Adicionar Nova Maquina"),
            el("div",{style:{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10,marginBottom:10}},
              el("div",null,
                el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"NOME DA MAQUINA"),
                el("input",{value:mName,onChange:e=>setMName(e.target.value),placeholder:"Ex: HORIZONTAL 3",style:{...IS,width:"100%"}})
              ),
              el("div",null,
                el("div",{style:{fontSize:12,fontWeight:600,color:"#1E293B",marginBottom:4}},"META PADRAO"),
                el("input",{type:"number",value:mMeta,onChange:e=>setMMeta(e.target.value),placeholder:"0",style:{...IS,width:"100%"}})
              )
            ),
            el("button",{onClick:addMachine,disabled:mAdding,style:{...BTN("linear-gradient(135deg,#16a34a,#22C55E)"),opacity:mAdding?.7:1}},mAdding?"Adicionando...":"Adicionar Maquina")
          )
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
            return '<b>'+esc(d.name)+'</b><br/>Meta: '+d.meta.toLocaleString('pt-BR')+'<br/>Produção: '+d.producao.toLocaleString('pt-BR');
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
          return `<b>${esc(d.name)}</b><br/>Meta: ${d.meta.toLocaleString('pt-BR')}<br/>Produção: ${d.producao.toLocaleString('pt-BR')}`;
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
        formatter: p=>`<b>${esc(p.name)}</b><br/>${p.value.toLocaleString('pt-BR')} peças<br/>${p.percent.toFixed(0)}%`
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
          return `<b>${esc(params[0]?.axisValue||'')}</b><br/>${lines}`;
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
        formatter: params=>`<b>${esc(params[0].name)}</b><br/>% da Meta: ${params[0].value}%`
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

  // ─── HEATMAP: máquina × dia, cor = % meta ───
  if (type === 'heatmap') {
    var hmDays = data.days||[], hmMachines = data.machines||[], hmValues = data.values||[];
    var hmMax = 150;
    return {
      animation: true, animationDuration: 500,
      tooltip: { ...tooltipBase, position: 'top',
        formatter: function(p){ return '<b>'+esc(hmMachines[p.value[1]])+'</b><br/>'+esc(hmDays[p.value[0]])+'<br/>'+p.value[2]+'% da meta'; }
      },
      grid: { top: 10, right: m?10:30, bottom: m?60:70, left: m?10:20, containLabel: true },
      xAxis: { type:'category', data:hmDays, splitArea:{show:true}, axisLabel:{fontSize:m?9:fs, rotate:m?45:30, interval:0} },
      yAxis: { type:'category', data:hmMachines, splitArea:{show:true}, axisLabel:{fontSize:m?9:fs, width:m?80:140, overflow:'truncate'} },
      visualMap: { min:0, max:hmMax, calculable:true, orient:m?'horizontal':'vertical', left:m?'center':undefined, right:m?undefined:0, bottom:m?0:undefined, top:m?undefined:'center',
        inRange:{ color:['#dc2626','#f97316','#facc15','#86efac','#22c55e'] },
        textStyle:{fontSize:m?10:12},
        formatter: function(v){ return Math.round(v)+'%'; }
      },
      series: [{ type:'heatmap', data:hmValues, label:{show:!m,fontSize:m?8:10,formatter:function(p){return p.value[2]+'%';}},
        emphasis:{ itemStyle:{shadowBlur:10,shadowColor:'rgba(0,0,0,0.3)'} }
      }]
    };
  }

  // ─── PARETO: gap absoluto por máquina ───
  if (type === 'pareto') {
    var pNames=data.map(d=>d.name), pGaps=data.map(d=>d.gap), pAccum=data.map(d=>d.accumPct);
    return {
      animation: true, animationDuration: 750,
      tooltip: { ...tooltipBase, trigger:'axis',
        formatter: function(params){
          var idx=params[0].dataIndex; var d=data[idx];
          return '<b>'+esc(d.name)+'</b><br/>Gap: '+d.gap.toLocaleString('pt-BR')+' pç<br/>Acumulado: '+d.accumPct+'%';
        }
      },
      legend: { data:['Gap (pç)','% Acumulado'], top:0, textStyle:{fontSize:fs} },
      grid: { top:40, right:m?40:60, bottom:m?70:80, left:m?40:60 },
      xAxis: { type:'category', data:pNames, axisLabel:{rotate:m?45:25, fontSize:m?9:fs, interval:0} },
      yAxis: [
        { type:'value', name:'Gap (pç)', axisLabel:{fontSize:fs, formatter:function(v){return v>=1000?(v/1000).toFixed(0)+'k':v;}} },
        { type:'value', name:'% Acumulado', max:100, axisLabel:{fontSize:fs, formatter:'{value}%'} }
      ],
      series: [
        { name:'Gap (pç)', type:'bar', data:pGaps.map(function(v,i){return {value:v,itemStyle:{color:pAccum[i]<=80?C.red:C.yellow,borderRadius:[4,4,0,0]}};}), barMaxWidth:m?24:40 },
        { name:'% Acumulado', type:'line', yAxisIndex:1, data:pAccum, smooth:true, symbol:'circle', symbolSize:6,
          lineStyle:{color:C.navy,width:2}, itemStyle:{color:C.navy},
          markLine:{silent:true, data:[{yAxis:80,label:{formatter:'80%',fontSize:fs},lineStyle:{color:C.red,type:'dashed',width:1.5}}]}
        }
      ]
    };
  }

  // ─── BOX-PLOT por turno ───
  if (type === 'boxplot') {
    var bpTurnos=data.turnos||[], bpBoxData=data.boxData||[], bpOutliers=data.outliers||[];
    return {
      animation: true, animationDuration: 750,
      tooltip: { ...tooltipBase, trigger:'item',
        formatter: function(p){
          if(p.seriesType==='boxplot'){
            return '<b>'+esc(p.name)+'</b><br/>Máx: '+Math.round(p.value[5]).toLocaleString('pt-BR')+'<br/>Q3: '+Math.round(p.value[4]).toLocaleString('pt-BR')+'<br/>Mediana: '+Math.round(p.value[3]).toLocaleString('pt-BR')+'<br/>Q1: '+Math.round(p.value[2]).toLocaleString('pt-BR')+'<br/>Mín: '+Math.round(p.value[1]).toLocaleString('pt-BR');
          }
          return esc(p.name)+': '+Number(p.value[1]).toLocaleString('pt-BR');
        }
      },
      grid: { top:20, right:m?10:30, bottom:m?40:50, left:m?40:60 },
      xAxis: { type:'category', data:bpTurnos, axisLabel:{fontSize:fs} },
      yAxis: { type:'value', name:'Produção', axisLabel:{fontSize:fs, formatter:function(v){return v>=1000?(v/1000).toFixed(0)+'k':v;}} },
      series: [
        { name:'Produção', type:'boxplot', data:bpBoxData,
          itemStyle:{color:'#eff6ff',borderColor:C.blue,borderWidth:2},
          emphasis:{itemStyle:{borderColor:C.navy,borderWidth:3}}
        },
        { name:'Outliers', type:'scatter', data:bpOutliers, itemStyle:{color:C.red} }
      ]
    };
  }

  // ─── TREND com média móvel 7 dias ───
  if (type === 'trendMA') {
    var trDates=data.map(d=>d.date), trProd=data.map(d=>d.producao), trMA=data.map(d=>d.ma7), trMeta=data.map(d=>d.metaGlobal);
    return {
      animation: true, animationDuration: 750,
      tooltip: { ...tooltipBase, trigger:'axis',
        formatter: function(params){
          var lines=params.map(function(p){return esc(p.seriesName)+': '+(p.value!=null?Number(p.value).toLocaleString('pt-BR'):'—');});
          return '<b>'+esc(params[0].axisValue)+'</b><br/>'+lines.join('<br/>');
        }
      },
      legend: { data:['Produção Diária','Média Móvel 7d','Meta 60k'], top:0, textStyle:{fontSize:fs} },
      grid: { top:40, right:m?10:30, bottom:m?60:60, left:m?40:65 },
      xAxis: { type:'category', data:trDates, axisLabel:{rotate:m?45:15,fontSize:m?9:fs} },
      yAxis: { type:'value', axisLabel:{fontSize:fs, formatter:function(v){return v>=1000?(v/1000).toFixed(0)+'k':v;}} },
      series: [
        { name:'Produção Diária', type:'bar', data:trProd, itemStyle:{color:C.blue+'88',borderRadius:[4,4,0,0]}, barMaxWidth:m?12:24 },
        { name:'Média Móvel 7d', type:'line', data:trMA, smooth:true, symbol:'none', lineStyle:{color:C.navy,width:3}, z:10 },
        { name:'Meta 60k', type:'line', data:trMeta, symbol:'none', lineStyle:{color:C.red,width:2,type:'dashed'} }
      ]
    };
  }

  // ─── STACKED BAR: contribuição por turno ───
  if (type === 'stackedBar') {
    var sbDates=data.dates||[], sbTurnos=data.turnos||[], sbSeries=data.series||[];
    var sbColors=[C.blue, C.green, C.yellow, C.purple, C.teal];
    return {
      animation: true, animationDuration: 750,
      tooltip: { ...tooltipBase, trigger:'axis', axisPointer:{type:'shadow'},
        formatter: function(params){
          var total=0; var lines=params.map(function(p){total+=p.value;return '<span style="color:'+esc(p.color)+'">●</span> '+esc(p.seriesName)+': '+Number(p.value).toLocaleString('pt-BR');});
          return '<b>'+esc(params[0].axisValue)+'</b><br/>'+lines.join('<br/>')+'<br/><b>Total: '+total.toLocaleString('pt-BR')+'</b>';
        }
      },
      legend: { data:sbTurnos, top:0, textStyle:{fontSize:fs} },
      grid: { top:40, right:m?10:30, bottom:m?60:60, left:m?40:65 },
      xAxis: { type:'category', data:sbDates, axisLabel:{rotate:m?45:15,fontSize:m?9:fs} },
      yAxis: { type:'value', axisLabel:{fontSize:fs, formatter:function(v){return v>=1000?(v/1000).toFixed(0)+'k':v;}} },
      series: sbSeries.map(function(s,i){ return { name:s.name, type:'bar', stack:'total', data:s.data, itemStyle:{color:sbColors[i%sbColors.length],borderRadius:i===sbSeries.length-1?[4,4,0,0]:0}, barMaxWidth:m?20:36 }; })
    };
  }

  // ─── SCATTER: produção vs meta ───
  if (type === 'scatter') {
    return {
      animation: true, animationDuration: 750,
      tooltip: { ...tooltipBase, trigger:'item',
        formatter: function(p){ return '<b>'+esc(p.data[3])+'</b><br/>Meta: '+Number(p.data[0]).toLocaleString('pt-BR')+'<br/>Produção: '+Number(p.data[1]).toLocaleString('pt-BR')+'<br/>Registros: '+p.data[2]; }
      },
      grid: { top:20, right:m?10:30, bottom:m?40:50, left:m?40:65 },
      xAxis: { type:'value', name:'Meta', axisLabel:{fontSize:fs,formatter:function(v){return v>=1000?(v/1000).toFixed(0)+'k':v;}} },
      yAxis: { type:'value', name:'Produção', axisLabel:{fontSize:fs,formatter:function(v){return v>=1000?(v/1000).toFixed(0)+'k':v;}} },
      series: [
        { type:'scatter', data:data.points||[], symbolSize:function(d){return Math.max(8,Math.min(40,d[2]*3));},
          itemStyle:{color:C.blue+'cc'}, emphasis:{itemStyle:{color:C.blue,shadowBlur:10}}
        },
        { type:'line', data:data.diagonal||[], symbol:'none', lineStyle:{color:C.gray,type:'dashed',width:1.5}, tooltip:{show:false} }
      ]
    };
  }

  return {};
}

// ─── CHART VIEWER: VISUALIZADOR FULLSCREEN ESTILO DESMOS ─────
function ChartViewer({title, subtitle, data, type, onClose}){
  var viewerChartRef = useRef(null);
  var viewerInstanceRef = useRef(null);
  var [zoomLevel, setZoomLevel] = useState(100);
  var [isPanning, setIsPanning] = useState(false);
  var [showGrid, setShowGrid] = useState(true);
  var [darkMode, setDarkMode] = useState(false);
  var [isClosing, setIsClosing] = useState(false);
  var [isReady, setIsReady] = useState(false);

  function getViewerOption(){
    var base = getChartOption(type, data, false);
    if(!base || !base.series) return base;
    var opt = JSON.parse(JSON.stringify(base));

    opt.grid = { top: 60, right: 60, bottom: 80, left: 80, containLabel: false };

    if(opt.xAxis){
      var xa = Array.isArray(opt.xAxis) ? opt.xAxis : [opt.xAxis];
      xa.forEach(function(ax){ if(ax.axisLabel) { ax.axisLabel.fontSize = 13; ax.axisLabel.rotate = ax.axisLabel.rotate ? Math.min(ax.axisLabel.rotate, 25) : 0; } });
      opt.xAxis = xa.length === 1 ? xa[0] : xa;
    }
    if(opt.yAxis){
      var ya = Array.isArray(opt.yAxis) ? opt.yAxis : [opt.yAxis];
      ya.forEach(function(ax){ if(ax.axisLabel) ax.axisLabel.fontSize = 13; });
      opt.yAxis = ya.length === 1 ? ya[0] : ya;
    }
    if(opt.legend) { opt.legend.textStyle = { fontSize: 13 }; opt.legend.itemWidth = 25; opt.legend.itemHeight = 14; opt.legend.top = 10; }
    if(opt.tooltip) { opt.tooltip.textStyle = { color: '#2D3E4E', fontSize: 13 }; opt.tooltip.padding = [10, 14]; }

    if(showGrid){
      if(opt.xAxis && !Array.isArray(opt.xAxis)) opt.xAxis.splitLine = { show: true, lineStyle: { color: darkMode ? '#333' : '#f0f0f0', type: 'dashed' } };
      if(opt.yAxis && !Array.isArray(opt.yAxis)) opt.yAxis.splitLine = { show: true, lineStyle: { color: darkMode ? '#333' : '#f0f0f0', type: 'dashed' } };
    }

    if(type !== 'pie'){
      opt.dataZoom = [
        { type: 'inside', xAxisIndex: opt.xAxis ? 0 : undefined, yAxisIndex: opt.yAxis && !opt.xAxis ? 0 : undefined, zoomOnMouseWheel: true, moveOnMouseMove: isPanning, moveOnMouseWheel: false, preventDefaultMouseMove: isPanning },
        { type: 'slider', xAxisIndex: opt.xAxis && (Array.isArray(opt.xAxis) ? opt.xAxis[0] : opt.xAxis).type === 'category' ? 0 : undefined, bottom: 12, height: 24, borderColor: '#D1D5DB', fillerColor: 'rgba(0,102,179,0.12)', handleStyle: { color: '#0066B3', borderColor: '#003366' }, textStyle: { fontSize: 12 }, dataBackground: { lineStyle: { color: '#0066B3', opacity: 0.3 }, areaStyle: { color: '#0066B3', opacity: 0.08 } } }
      ];
      if(type !== 'heatmap' && type !== 'horizontalBar'){
        opt.dataZoom.push(
          { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseMove: false },
          { type: 'slider', yAxisIndex: 0, right: 8, width: 24, borderColor: '#D1D5DB', fillerColor: 'rgba(0,102,179,0.12)', handleStyle: { color: '#0066B3', borderColor: '#003366' }, textStyle: { fontSize: 12 } }
        );
        opt.grid.right = 90;
        opt.grid.bottom = 60;
      }
    }

    (opt.series || []).forEach(function(s){
      if(s.type === 'bar') { s.barMaxWidth = 60; if(s.itemStyle && s.itemStyle.borderRadius) s.itemStyle.borderRadius = s.itemStyle.borderRadius.map(function(r){ return r > 0 ? 6 : 0; }); }
      if(s.type === 'line') { if(s.lineStyle) s.lineStyle.width = (s.lineStyle.width || 2) + 1; if(s.symbolSize) s.symbolSize = 8; s.symbol = s.symbol === 'none' ? 'none' : 'circle'; }
    });

    opt.animationDuration = 600;
    opt.animationEasing = 'cubicOut';

    if(darkMode){
      opt.backgroundColor = '#1a1a2e';
      if(opt.tooltip) { opt.tooltip.backgroundColor = '#2a2a3e'; opt.tooltip.borderColor = '#444'; opt.tooltip.textStyle = { color: '#e0e0e0', fontSize: 13 }; }
      if(opt.legend) opt.legend.textStyle = { color: '#ccc', fontSize: 13 };
      if(opt.xAxis && !Array.isArray(opt.xAxis)) { opt.xAxis.axisLabel = Object.assign({}, opt.xAxis.axisLabel||{}, {color:'#aaa'}); opt.xAxis.axisLine = { lineStyle: { color: '#444' } }; }
      if(opt.yAxis && !Array.isArray(opt.yAxis)) { opt.yAxis.axisLabel = Object.assign({}, opt.yAxis.axisLabel||{}, {color:'#aaa'}); opt.yAxis.axisLine = { lineStyle: { color: '#444' } }; }
      if(Array.isArray(opt.yAxis)) opt.yAxis.forEach(function(ax){ ax.axisLabel = Object.assign({}, ax.axisLabel||{}, {color:'#aaa'}); ax.axisLine = { lineStyle: { color: '#444' } }; ax.nameTextStyle = {color:'#aaa'}; });
      if(opt.visualMap) opt.visualMap.textStyle = { color: '#ccc' };
    }

    opt.toolbox = {
      show: true, right: 20, top: 10, iconStyle: { borderColor: darkMode ? '#aaa' : '#666' },
      emphasis: { iconStyle: { borderColor: '#0066B3' } },
      feature: {
        dataZoom: { show: type !== 'pie', title: { zoom: 'Zoom Area', back: 'Restaurar' } },
        restore: { show: true, title: 'Restaurar' },
        saveAsImage: { show: true, title: 'Salvar PNG', pixelRatio: 3, backgroundColor: darkMode ? '#1a1a2e' : '#fff' }
      }
    };

    return opt;
  }

  useEffect(function(){
    if(!viewerChartRef.current || typeof echarts === 'undefined') return;
    viewerInstanceRef.current = echarts.init(viewerChartRef.current, darkMode ? 'dark' : null);
    var opt = getViewerOption();
    if(opt) viewerInstanceRef.current.setOption(opt, true);
    setTimeout(function(){ setIsReady(true); }, 50);
    return function(){ if(viewerInstanceRef.current){ viewerInstanceRef.current.dispose(); viewerInstanceRef.current = null; } };
  }, []);

  useEffect(function(){
    if(!viewerInstanceRef.current) return;
    var dom = viewerChartRef.current;
    if(!dom) return;
    viewerInstanceRef.current.dispose();
    viewerInstanceRef.current = echarts.init(dom, darkMode ? 'dark' : null);
    var opt = getViewerOption();
    if(opt) viewerInstanceRef.current.setOption(opt, true);
  }, [data, type, showGrid, darkMode, isPanning]);

  useEffect(function(){
    var fn = function(){ if(viewerInstanceRef.current) viewerInstanceRef.current.resize(); };
    window.addEventListener('resize', fn);
    var t = setTimeout(fn, 350);
    return function(){ window.removeEventListener('resize', fn); clearTimeout(t); };
  }, []);

  useEffect(function(){
    function onKey(e){
      if(e.key === 'Escape') handleClose();
      if(e.key === 'r' || e.key === 'R') handleReset();
      if(e.key === 'g' || e.key === 'G') setShowGrid(function(v){ return !v; });
      if(e.key === 'd' || e.key === 'D') setDarkMode(function(v){ return !v; });
      if(e.key === 'p' || e.key === 'P') setIsPanning(function(v){ return !v; });
    }
    window.addEventListener('keydown', onKey);
    return function(){ window.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(function(){
    var prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return function(){ document.body.style.overflow = prev; };
  }, []);

  function handleClose(){
    setIsClosing(true);
    setTimeout(function(){ onClose(); }, 250);
  }

  function handleReset(){
    if(!viewerInstanceRef.current) return;
    viewerInstanceRef.current.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
    viewerInstanceRef.current.dispatchAction({ type: 'restore' });
    setZoomLevel(100);
  }

  function handleZoomIn(){
    if(!viewerInstanceRef.current) return;
    var z = Math.min(zoomLevel + 25, 400);
    setZoomLevel(z);
    var range = Math.max(10, 100 * 100 / z);
    var s = Math.max(0, 50 - range / 2);
    var e = Math.min(100, 50 + range / 2);
    viewerInstanceRef.current.dispatchAction({ type: 'dataZoom', start: s, end: e });
  }

  function handleZoomOut(){
    if(!viewerInstanceRef.current) return;
    var z = Math.max(25, zoomLevel - 25);
    setZoomLevel(z);
    var range = Math.min(100, 100 * 100 / z);
    var s = Math.max(0, 50 - range / 2);
    var e = Math.min(100, 50 + range / 2);
    viewerInstanceRef.current.dispatchAction({ type: 'dataZoom', start: s, end: e });
  }

  useEffect(function(){
    if(document.getElementById('chart-viewer-keyframes')) return;
    var style = document.createElement('style');
    style.id = 'chart-viewer-keyframes';
    style.textContent = [
      '@keyframes cvFadeIn { from { opacity:0; } to { opacity:1; } }',
      '@keyframes cvFadeOut { from { opacity:1; } to { opacity:0; } }',
      '@keyframes cvSlideUp { from { opacity:0; transform:translateY(40px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }',
      '@keyframes cvSlideDown { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(40px) scale(0.96); } }',
      '.cv-toolbar-btn { display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid transparent;background:transparent;color:#d1d5db;cursor:pointer;transition:all .15s;font-size:16px;font-family:inherit;padding:0; }',
      '.cv-toolbar-btn:hover { background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.15); }',
      '.cv-toolbar-btn.active { background:rgba(0,102,179,0.3);color:#60a5fa;border-color:rgba(0,102,179,0.5); }',
      '.cv-toolbar-sep { width:1px;height:24px;background:rgba(255,255,255,0.12);margin:0 4px; }',
      '.cv-zoom-display { font-size:12px;color:#94a3b8;font-weight:600;min-width:42px;text-align:center;font-variant-numeric:tabular-nums; }',
      '.cv-shortcut { display:inline-block;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:4px;padding:1px 5px;font-size:10px;color:#94a3b8;margin-left:6px;font-weight:500;line-height:1.4; }'
    ].join('\n');
    document.head.appendChild(style);
  }, []);

  var overlayAnim = isClosing ? 'cvFadeOut 0.25s ease forwards' : 'cvFadeIn 0.3s ease forwards';
  var panelAnim = isClosing ? 'cvSlideDown 0.25s ease forwards' : 'cvSlideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards';

  function IconZoomIn(){ return el("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},el("circle",{cx:11,cy:11,r:8}),el("line",{x1:21,y1:21,x2:16.65,y2:16.65}),el("line",{x1:11,y1:8,x2:11,y2:14}),el("line",{x1:8,y1:11,x2:14,y2:11})); }
  function IconZoomOut(){ return el("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},el("circle",{cx:11,cy:11,r:8}),el("line",{x1:21,y1:21,x2:16.65,y2:16.65}),el("line",{x1:8,y1:11,x2:14,y2:11})); }
  function IconReset(){ return el("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},el("polyline",{points:"1 4 1 10 7 10"}),el("path",{d:"M3.51 15a9 9 0 1 0 2.13-9.36L1 10"})); }
  function IconGridSvg(){ return el("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},el("rect",{x:3,y:3,width:18,height:18,rx:2,ry:2}),el("line",{x1:3,y1:9,x2:21,y2:9}),el("line",{x1:3,y1:15,x2:21,y2:15}),el("line",{x1:9,y1:3,x2:9,y2:21}),el("line",{x1:15,y1:3,x2:15,y2:21})); }
  function IconPan(){ return el("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},el("polyline",{points:"5 9 2 12 5 15"}),el("polyline",{points:"9 5 12 2 15 5"}),el("polyline",{points:"15 19 12 22 9 19"}),el("polyline",{points:"19 9 22 12 19 15"}),el("line",{x1:2,y1:12,x2:22,y2:12}),el("line",{x1:12,y1:2,x2:12,y2:22})); }
  function IconDark(){ return el("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},el("path",{d:"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"})); }
  function IconClose(){ return el("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round"},el("line",{x1:18,y1:6,x2:6,y2:18}),el("line",{x1:6,y1:6,x2:18,y2:18})); }

  return ReactDOM.createPortal(
    el("div",{style:{
      position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:99999,
      background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',
      display:'flex',flexDirection:'column',animation:overlayAnim
    }},
      el("div",{style:{
        flex:1,display:'flex',flexDirection:'column',margin:0,
        animation:panelAnim,overflow:'hidden'
      }},
        // Toolbar
        el("div",{style:{
          background:'linear-gradient(135deg,#0f172a,#1e293b)',
          borderBottom:'1px solid rgba(255,255,255,0.08)',
          padding:'0 20px',height:56,display:'flex',alignItems:'center',gap:8,flexShrink:0
        }},
          el("div",{style:{flex:1,display:'flex',alignItems:'center',gap:12,minWidth:0}},
            el("div",{style:{width:4,height:28,borderRadius:2,background:'linear-gradient(180deg,#0066B3,#003366)',flexShrink:0}}),
            el("div",{style:{minWidth:0}},
              el("div",{style:{fontSize:15,fontWeight:700,color:'#f1f5f9',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.3}}, title||'Grafico'),
              subtitle && el("div",{style:{fontSize:11,color:'#64748b',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.3}}, subtitle)
            )
          ),
          el("button",{className:'cv-toolbar-btn',onClick:handleZoomOut,title:'Diminuir zoom'}, el(IconZoomOut)),
          el("div",{className:'cv-zoom-display'}, zoomLevel+'%'),
          el("button",{className:'cv-toolbar-btn',onClick:handleZoomIn,title:'Aumentar zoom'}, el(IconZoomIn)),
          el("div",{className:'cv-toolbar-sep'}),
          el("button",{className:'cv-toolbar-btn'+(isPanning?' active':''),onClick:function(){setIsPanning(!isPanning);},title:'Modo arrastar (P)'}, el(IconPan)),
          el("button",{className:'cv-toolbar-btn'+(showGrid?' active':''),onClick:function(){setShowGrid(!showGrid);},title:'Grade (G)'}, el(IconGridSvg)),
          el("button",{className:'cv-toolbar-btn'+(darkMode?' active':''),onClick:function(){setDarkMode(!darkMode);},title:'Modo escuro (D)'}, el(IconDark)),
          el("div",{className:'cv-toolbar-sep'}),
          el("button",{className:'cv-toolbar-btn',onClick:handleReset,title:'Restaurar vista (R)'}, el(IconReset)),
          el("div",{className:'cv-toolbar-sep'}),
          el("button",{className:'cv-toolbar-btn',onClick:handleClose,title:'Fechar (Esc)',style:{color:'#f87171'}}, el(IconClose))
        ),
        // Chart area
        el("div",{style:{
          flex:1,position:'relative',background:darkMode?'#1a1a2e':'#fafbfc',
          transition:'background 0.3s ease'
        }},
          el("div",{ref:viewerChartRef,style:{
            position:'absolute',top:0,left:0,right:0,bottom:0,
            cursor:isPanning?'grab':'crosshair'
          }}),
          // Help hint
          el("div",{style:{
            position:'absolute',bottom:50,left:'50%',transform:'translateX(-50%)',
            background:'rgba(15,23,42,0.85)',borderRadius:10,padding:'10px 18px',
            display:'flex',gap:16,alignItems:'center',
            opacity:isReady?0:0.9,transition:'opacity 1.5s ease 1s',pointerEvents:'none'
          }},
            el("span",{style:{fontSize:12,color:'#cbd5e1'}},'Scroll para zoom',el("span",{className:'cv-shortcut'},'Scroll')),
            el("span",{style:{fontSize:12,color:'#cbd5e1'}},'Arrastar',el("span",{className:'cv-shortcut'},'P')),
            el("span",{style:{fontSize:12,color:'#cbd5e1'}},'Restaurar',el("span",{className:'cv-shortcut'},'R')),
            el("span",{style:{fontSize:12,color:'#cbd5e1'}},'Fechar',el("span",{className:'cv-shortcut'},'Esc'))
          )
        )
      )
    ),
    document.body
  );
}

// ─── ECHARTS: COMPONENTE REUTILIZÁVEL ─────────────────────────
function EChartsComponent({title, subtitle, data, type, height=350, isMobile}){
  const chartRef  = useRef(null);
  const instanceRef = useRef(null);
  var [viewerOpen, setViewerOpen] = useState(false);
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

  function ExpandIcon(){ return el("svg",{width:15,height:15,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},el("polyline",{points:"15 3 21 3 21 9"}),el("polyline",{points:"9 21 3 21 3 15"}),el("line",{x1:21,y1:3,x2:14,y2:10}),el("line",{x1:3,y1:21,x2:10,y2:14})); }

  return el("div",{style:{background:"#fff",borderRadius:12,padding:m?12:20,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",position:'relative'}},
    title&&el("div",{style:{marginBottom:m?8:12,display:'flex',alignItems:'flex-start',justifyContent:'space-between'}},
      el("div",{style:{flex:1,minWidth:0}},
        el("div",{style:{fontSize:m?14:16,fontWeight:700,color:C.navy}},title),
        subtitle&&el("div",{style:{fontSize:m?11:12,color:"#94A3B8",marginTop:2}},subtitle)
      ),
      el("button",{
        onClick:function(){ setViewerOpen(true); },
        title:'Visualizar em tela cheia',
        onMouseEnter:function(e){ e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.borderColor='#0066B3'; e.currentTarget.style.color='#0066B3'; },
        onMouseLeave:function(e){ e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#94a3b8'; },
        style:{
          display:'flex',alignItems:'center',justifyContent:'center',gap:5,
          background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,
          padding:'6px 10px',cursor:'pointer',color:'#94a3b8',
          fontSize:11,fontWeight:600,fontFamily:'inherit',
          transition:'all .2s ease',flexShrink:0,marginLeft:8
        }
      }, el(ExpandIcon), !m && "Expandir")
    ),
    el("div",{ref:chartRef,style:{width:"100%",height:effectiveHeight}}),
    viewerOpen && el(ChartViewer,{title:title,subtitle:subtitle,data:data,type:type,onClose:function(){setViewerOpen(false);}})
  );
}

// ─── TAB APONTAMENTO ──────────────────────────────────────────
// FIX: TabEntrada refatorada — inputs chaveados por mId (persistem entre filtros),
// sem exibição de "já apontado" (tabela é apenas para inserção de dados)
function TabEntrada({machines,metas,inputs,obsInputs,entryDate,setEntryDate,entryTurno,setEntryTurno,syncSt,pendingCount,handleSave,setInputs,setObsInputs}){
  const mob=useIsMobile();
  function getVal(mId){ return inputs[mId]!==undefined?inputs[mId]:""; }
  function getObsVal(mId){ return obsInputs[mId]!==undefined?obsInputs[mId]:""; }
  function setVal(mId,val){ setInputs(p=>({...p,[mId]:val})); }
  function setObsVal(mId,val){ setObsInputs(p=>({...p,[mId]:val})); }

  const lbl={fontSize:11,color:"#6B7280",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"};
  const btnSaveColor=syncSt==="ok"?"linear-gradient(135deg,#16a34a,#22C55E)":syncSt==="error"?"linear-gradient(135deg,#dc2626,#EF4444)":"linear-gradient(135deg,#003366,#0066B3)";

  // ── controles de data/turno ──
  const controls=el("div",{style:{background:"#fff",borderRadius:mob?0:12,padding:mob?"10px 14px":"14px 18px",boxShadow:mob?"none":"0 1px 3px rgba(0,0,0,0.08)",marginBottom:mob?0:16,display:"flex",gap:mob?10:14,flexWrap:"wrap",alignItems:"flex-end",position:mob?"sticky":"relative",top:mob?0:"auto",zIndex:mob?20:"auto",borderBottom:mob?"1px solid #E5E7EB":"none"}},
    el("div",{style:mob?{flex:1}:{}},
      el("div",{style:lbl},"Data"),
      el("input",{type:"date",value:entryDate,onChange:e=>setEntryDate(e.target.value),style:{...IS,width:mob?"100%":"auto",minHeight:mob?44:36,fontSize:mob?15:14,fontWeight:mob?600:500}})
    ),
    el("div",{style:mob?{flex:1}:{}},
      el("div",{style:lbl},"Turno"),
      el("select",{value:entryTurno,onChange:e=>setEntryTurno(e.target.value),style:{...SS,width:mob?"100%":"auto",minHeight:mob?44:36,fontSize:mob?15:14,fontWeight:mob?600:500}},
        ...TURNOS.map(t=>el("option",{key:t,value:t},t))
      )
    ),
    !mob&&el("div",{style:{display:"flex",flexDirection:"column",gap:4}},
      el("button",{onClick:handleSave,disabled:syncSt==="syncing"||pendingCount===0,style:BTN(btnSaveColor,{fontSize:15,padding:"9px 28px",opacity:pendingCount===0?.5:1})},
        syncSt==="syncing"?el(SaveLoader):syncSt==="ok"?el(SaveCheck,{size:22,color:"#fff"}):syncSt==="error"?"Erro!":("Salvar"+(pendingCount>0?` (${pendingCount})`:""))),
      pendingCount>0&&el("div",{style:{fontSize:11,color:C.yellow,fontWeight:600,textAlign:"center"}},`${pendingCount} não salvo(s)`)
    )
  );

  // ── layout MOBILE ──
  if(mob){
    return el("div",{style:{paddingBottom:80}},
      controls,
      el("div",{style:{display:"flex",flexDirection:"column",gap:10,paddingTop:12}},
        ...machines.map((m,i)=>{
          const val=getVal(m.id);
          const obsVal=getObsVal(m.id);
          const hasPending=val!==""||obsVal!=="";
          const metaVal=metas[m.id]||0;
          const pct=m.hasMeta&&metaVal>0&&val!==""?Math.round(num(val)/metaVal*100):null;
          const col=pctCol(pct);
          return el("div",{key:m.id,style:{background:"#fff",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",border:"1px solid "+(hasPending?"#F59E0B":"#E5E7EB")}},
            el("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}},
              el("div",{style:{fontSize:14,fontWeight:700,color:C.navy}},m.name),
              hasPending&&el("span",{style:{fontSize:11,fontWeight:700,color:"#d97706"}},"● pendente")
            ),
            el("div",{style:{display:"flex",alignItems:"center",gap:12}},
              el("input",{type:"number",inputMode:"numeric",pattern:"[0-9]*",min:"0",placeholder:"0",value:val,onChange:e=>setVal(m.id,e.target.value),
                style:{...IS,flex:1,fontSize:24,fontWeight:800,textAlign:"center",padding:"10px",minHeight:52,borderColor:hasPending?C.yellow:"#D1D5DB",borderWidth:hasPending?2:1}}),
              m.hasMeta&&el("div",{style:{textAlign:"right",minWidth:60,flexShrink:0}},
                el("div",{style:{fontSize:10,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}},"Meta"),
                el("div",{style:{fontSize:15,fontWeight:700,color:"#475569"}},metaVal.toLocaleString("pt-BR")),
                pct!==null&&el("div",{style:{fontSize:14,fontWeight:800,color:pct>=100?"#16a34a":pct>=80?"#d97706":"#dc2626"}},(pct)+"%")
              )
            ),
            el("input",{type:"text",placeholder:"Observação...",value:obsVal,onChange:e=>setObsVal(m.id,e.target.value),
              style:{...IS,width:"100%",marginTop:10,fontSize:13,borderColor:obsVal!==""?C.blue:"#D1D5DB",borderWidth:obsVal!==""?2:1}})
          );
        })
      ),
      el("div",{style:{position:"fixed",bottom:"calc(env(safe-area-inset-bottom,0px) + 72px)",right:16,zIndex:100}},
        el("button",{onClick:handleSave,disabled:syncSt==="syncing"||pendingCount===0,
          style:{width:56,height:56,borderRadius:28,background:btnSaveColor,border:"none",
            boxShadow:"0 4px 16px rgba(0,51,102,0.3)",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            opacity:pendingCount===0?.4:1,transition:"opacity .2s"}},
          syncSt==="syncing"?el(SaveLoader):syncSt==="ok"?el(SaveCheck,{size:24,color:"#fff"}):
          el("svg",{width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:"#fff",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round"},el("polyline",{points:"20 6 9 17 4 12"}))
        )
      )
    );
  }

  // ── layout DESKTOP: tabela ──
  return el("div",null,
    controls,
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
              el("input",{type:"number",inputMode:"numeric",pattern:"[0-9]*",min:"0",placeholder:"0",value:val,onChange:e=>setVal(m.id,e.target.value),style:{...IS,width:100,textAlign:"center",fontSize:15,fontWeight:700,borderColor:hasPending?C.yellow:"#D1D5DB",borderWidth:hasPending?2:1}})
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
function TabDashboard({machines,metas,dashData,machAgg,totProd,totMeta,chartProdVsMeta,chartTurnoData,chartTendencia,chartPerformers,analytics,chartHeatmap,chartPareto,chartBoxplot,chartTrendMA,chartStacked,chartScatter,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,dView,setDView,isMobile,onOpenExport}){
  var an=analytics||{};
  var oeeCol=an.oee!=null?pctCol(an.oee):C.gray;

  const kpis = el("div",{style:{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fit,minmax(150px,1fr))",gap:isMobile?8:14,marginBottom:16}},
    ...[
      {label:"PRODUÇÃO TOTAL",  value:totProd.toLocaleString("pt-BR"),                              sub:"peças",       color:C.blue},
      {label:"META TOTAL",      value:totMeta.toLocaleString("pt-BR"),                              sub:"peças",       color:C.navy},
      {label:"OEE GLOBAL",      value:an.oee!=null?an.oee+"%":"—",                                  sub:"eficiência ponderada", color:oeeCol},
      {label:"TENDÊNCIA",       value:an.trendPct!=null?(an.trendUp?"+":"")+an.trendPct+"%":"—",    sub:"vs mês anterior",      color:an.trendUp?C.green:C.red,arrow:an.trendUp},
      {label:"TX. APONTAMENTO", value:(an.taxaApontamento||0)+"%",                                  sub:"disciplina operac.",   color:an.taxaApontamento>=80?C.green:an.taxaApontamento>=50?C.yellow:C.red},
      {label:"DIAS CONSECUTIVOS",value:String(an.consecutive||0),                                   sub:an.consecutiveAbove?"acima de 90%":"abaixo de 90%", color:an.consecutiveAbove?C.green:C.red},
      {label:"REGISTROS",       value:dashData.length,                                              sub:"lançamentos", color:C.teal},
      {label:"MÁQUINAS ATIVAS", value:Object.keys(machAgg).length,                                  sub:`de ${machines.length}`, color:C.yellow},
    ].map(k=>el("div",{key:k.label,style:{background:"#fff",borderRadius:12,padding:isMobile?"12px 14px":"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",borderLeft:`4px solid ${k.color}`}},
      el("div",{style:{fontSize:10.5,color:"#6B7280",fontWeight:700,letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:6}},k.label),
      el("div",{style:{fontSize:isMobile?22:28,fontWeight:900,color:k.color,lineHeight:1.05,marginBottom:3,display:"flex",alignItems:"center",gap:6,letterSpacing:"0.5px"}},
        k.value,
        k.arrow!==undefined&&el("span",{style:{fontSize:14}},k.arrow?"▲":"▼")
      ),
      el("div",{style:{fontSize:11,color:"#94A3B8"}},k.sub)
    ))
  );

  // ── Ranking Top 3 / Bottom 3 ──
  var rankSection=el("div",{style:{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:16}},
    el("div",{style:{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}},
      el("div",{style:{fontSize:12,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}},"TOP 3 MELHORES"),
      ...(an.top3||[]).map(function(m,i){return el("div",{key:m.name,style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<2?"1px solid #f1f5f9":"none"}},
        el("div",{style:{display:"flex",alignItems:"center",gap:8}},
          el("span",{style:{background:C.green+"22",color:C.green,borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}},i+1),
          el("span",{style:{fontSize:13,fontWeight:600,color:C.navy}},m.name)
        ),
        el("span",{style:{background:C.green+"1e",color:"#16a34a",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},m.pct+"%")
      );})
    ),
    el("div",{style:{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}},
      el("div",{style:{fontSize:12,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}},"3 QUE MAIS PRECISAM DE ATENÇÃO"),
      ...(an.bottom3||[]).map(function(m,i){return el("div",{key:m.name,style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<2?"1px solid #f1f5f9":"none"}},
        el("div",{style:{display:"flex",alignItems:"center",gap:8}},
          el("span",{style:{background:C.red+"22",color:C.red,borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}},i+1),
          el("span",{style:{fontSize:13,fontWeight:600,color:C.navy}},m.name)
        ),
        el("span",{style:{background:C.red+"1e",color:"#dc2626",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},m.pct+"%")
      );})
    )
  );

  const viewButtons = el("div",{style:{display:"flex",gap:6,marginLeft:"auto",flexWrap:"wrap"}},
    ...[["resumo","Resumo"],["detalhado","Detalhado"],["comparativo","Turnos"],["graficos","Gráficos"],["analytics","Analytics"]].map(([k,l])=>{
      var isOn=dView===k;
      return el("button",{key:k,onClick:()=>setDView(k),
        onMouseEnter:function(e){if(!isOn)e.currentTarget.style.background="#f9fafb";},
        onMouseLeave:function(e){if(!isOn)e.currentTarget.style.background="#fff";},
        style:{
          background:isOn?"#eff6ff":"#fff",
          border:isOn?"1px solid #0066B3":"1px solid #D1D5DB",
          borderRadius:8,color:isOn?"#003366":"#111827",
          fontSize:13,fontWeight:isOn?700:600,lineHeight:"1.25rem",
          padding:"8px 14px",
          boxShadow:isOn?"0 0 0 1px rgba(0,102,179,0.1)":"0 1px 2px 0 rgba(0,0,0,0.05)",
          cursor:"pointer",userSelect:"none",transition:"all .15s",fontFamily:"inherit"
        }},l);
    })
  );

  const exportBar = el("div",{style:{background:"#fff",borderRadius:8,padding:"10px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",marginBottom:16,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}},
    el("button",{onClick:()=>onOpenExport(),disabled:dashData.length===0,style:{
      background:"linear-gradient(135deg,#003366,#0066B3)",border:"1px solid #003366",borderRadius:8,
      color:"#fff",fontSize:14,fontWeight:700,lineHeight:"1.25rem",
      padding:"10px 18px",cursor:"pointer",
      boxShadow:"0 1px 2px 0 rgba(0,0,0,0.1)",transition:"all .15s",fontFamily:"inherit",
      opacity:dashData.length===0?.5:1
    }},"Exportar")
  );

  return el("div",null,
    el(FilterBar,{dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines,extra:viewButtons}),
    kpis,
    rankSection,
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
    ),
    // ─── VIEW ANALYTICS ───
    dView==="analytics"&&el("div",null,
      // Tendência 30 dias com média móvel
      el("div",{style:{marginBottom:16}},
        el(EChartsComponent,{title:"Tendência 30 dias + Média Móvel 7d",subtitle:"Produção diária vs meta global de 60.000 peças",data:chartTrendMA,type:"trendMA",height:isMobile?300:380,isMobile})
      ),
      // Heatmap + Pareto lado a lado
      el("div",{style:{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}},
        el(EChartsComponent,{title:"Heatmap Semanal",subtitle:"% meta por máquina × dia (últimos 7 dias)",data:chartHeatmap,type:"heatmap",height:isMobile?300:Math.max(350,machines.length*28+80),isMobile}),
        el(EChartsComponent,{title:"Pareto de Perdas",subtitle:"Máquinas ordenadas por gap absoluto (meta − produção)",data:chartPareto,type:"pareto",height:isMobile?300:380,isMobile})
      ),
      // Box-plot + Stacked Bar lado a lado
      el("div",{style:{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}},
        el(EChartsComponent,{title:"Box-Plot por Turno",subtitle:"Dispersão da produção — revela instabilidade por turno",data:chartBoxplot,type:"boxplot",height:isMobile?280:350,isMobile}),
        el(EChartsComponent,{title:"Contribuição por Turno",subtitle:"Produção empilhada T1+T2+T3 por dia (últimos 14 dias)",data:chartStacked,type:"stackedBar",height:isMobile?280:350,isMobile})
      ),
      // Scatter
      el("div",{style:{marginBottom:16}},
        el(EChartsComponent,{title:"Produção vs Meta por Máquina",subtitle:"Acima da diagonal = acima da meta. Tamanho = frequência de registros",data:chartScatter,type:"scatter",height:isMobile?300:380,isMobile})
      ),
      // Dados derivados cards
      el("div",{style:{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}},
        // Variabilidade
        el("div",{style:{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}},
          el("div",{style:{fontSize:12,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}},"Variabilidade (30 dias)"),
          ...(an.machVar?machines.filter(function(m){return an.machVar[m.id];}).sort(function(a,b){return (an.machVar[b.id]?.stdDev||0)-(an.machVar[a.id]?.stdDev||0);}).slice(0,6).map(function(m){
            var v=an.machVar[m.id];
            return el("div",{key:m.id,style:{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px solid #f8fafc"}},
              el("span",{style:{color:"#475569",fontWeight:600}},m.name.length>20?m.name.slice(0,20)+"...":m.name),
              el("span",{style:{color:C.navy,fontWeight:700}},"\u03c3 "+v.stdDev+" (avg "+v.avg+")")
            );
          }):[])
        ),
        // Melhor/Pior dia
        el("div",{style:{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}},
          el("div",{style:{fontSize:12,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}},"Desempenho por Dia da Semana"),
          an.bestWeekday&&el("div",{style:{display:"flex",justifyContent:"space-between",fontSize:13,padding:"8px 0",borderBottom:"1px solid #f1f5f9"}},
            el("span",{style:{color:C.green,fontWeight:700}},"Melhor: "+an.bestWeekday.day),
            el("span",{style:{color:"#475569"}},an.bestWeekday.avg.toLocaleString("pt-BR")+" pç/dia")
          ),
          an.worstWeekday&&el("div",{style:{display:"flex",justifyContent:"space-between",fontSize:13,padding:"8px 0"}},
            el("span",{style:{color:C.red,fontWeight:700}},"Pior: "+an.worstWeekday.day),
            el("span",{style:{color:"#475569"}},an.worstWeekday.avg.toLocaleString("pt-BR")+" pç/dia")
          ),
          el("div",{style:{marginTop:12,fontSize:11,color:"#94A3B8"}},"Baseado em todos os registros disponíveis")
        ),
        // Frequência de feedbacks
        el("div",{style:{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}},
          el("div",{style:{fontSize:12,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}},"Frequência de Feedbacks"),
          ...(an.fbFreq?machines.filter(function(m){return an.fbFreq[m.id];}).sort(function(a,b){return (an.fbFreq[b.id]||0)-(an.fbFreq[a.id]||0);}).slice(0,6).map(function(m){
            return el("div",{key:m.id,style:{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px solid #f8fafc"}},
              el("span",{style:{color:"#475569",fontWeight:600}},m.name.length>20?m.name.slice(0,20)+"...":m.name),
              el("span",{style:{color:C.yellow,fontWeight:700}},an.fbFreq[m.id]+" obs")
            );
          }):[])
        )
      )
    )
  );
}

// ─── TAB HISTÓRICO ────────────────────────────────────────────
function TabHistorico({machines,metas,records,setEditRec,setDeleteRec,setObsRec,isMobile}){
  var [hView,setHView] = useState("calendario");
  var [calMonth,setCalMonth] = useState(()=>{ var d=new Date(); return {year:d.getFullYear(),month:d.getMonth()}; });
  var [selectedDay,setSelectedDay] = useState(null); // {date,turno} or null
  var [animDir,setAnimDir] = useState(0); // -1 left, 1 right, 0 none

  // Build lookup: date -> {turno -> [records]}
  var calData = useMemo(()=>{
    var map = {};
    records.forEach(r=>{
      if(!r.date) return;
      var nd = normDate(r.date);
      if(!nd) return;
      if(!map[nd]) map[nd] = {};
      if(!map[nd][r.turno]) map[nd][r.turno] = [];
      map[nd][r.turno].push(r);
    });
    return map;
  },[records]);

  // Sorted records for table view
  var sortedTable = useMemo(()=>
    records.filter(r=>r.date&&normDate(r.date)).slice().sort((a,b)=>b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno))
  ,[records]);

  // Calendar grid generation
  var calGrid = useMemo(()=>{
    var y=calMonth.year, m=calMonth.month;
    var first = new Date(y,m,1);
    var startDay = first.getDay(); // 0=Sun
    var daysInMonth = new Date(y,m+1,0).getDate();
    var cells = [];
    // Empty cells before first day
    for(var i=0;i<startDay;i++) cells.push(null);
    for(var d=1;d<=daysInMonth;d++) cells.push(d);
    return cells;
  },[calMonth]);

  var monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  var dayNames = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  function navMonth(dir){
    setAnimDir(dir);
    setTimeout(()=>{ setAnimDir(0); },300);
    setCalMonth(prev=>{
      var nm = prev.month+dir;
      var ny = prev.year;
      if(nm<0){ nm=11; ny--; } else if(nm>11){ nm=0; ny++; }
      return {year:ny,month:nm};
    });
    setSelectedDay(null);
  }

  function goToday(){
    var d=new Date();
    setCalMonth({year:d.getFullYear(),month:d.getMonth()});
    setSelectedDay(null);
  }

  function dateStr(day){
    return fmt(new Date(calMonth.year,calMonth.month,day));
  }

  function selectDay(day,turno){
    var ds=dateStr(day);
    if(selectedDay && selectedDay.date===ds && selectedDay.turno===turno){
      setSelectedDay(null);
    } else {
      setSelectedDay({date:ds,turno:turno});
    }
  }

  // Records for the selected day/turno
  var selectedRecords = useMemo(()=>{
    if(!selectedDay) return [];
    var dayData = calData[selectedDay.date];
    if(!dayData) return [];
    var recs = dayData[selectedDay.turno] || [];
    return recs.slice().sort((a,b)=>(a.machineName||"").localeCompare(b.machineName||""));
  },[selectedDay,calData]);

  // View toggle bar
  var viewToggle = el("div",{style:{display:"flex",gap:6,marginBottom:16}},
    ...[["calendario","Calendário"],["tabela","Tabela"]].map(([k,l])=>{
      var isOn=hView===k;
      return el("button",{key:k,onClick:()=>setHView(k),
        onMouseEnter:function(e){if(!isOn)e.currentTarget.style.background="#f9fafb";},
        onMouseLeave:function(e){if(!isOn)e.currentTarget.style.background="#fff";},
        style:{
          background:isOn?"#eff6ff":"#fff",
          border:isOn?"1px solid #0066B3":"1px solid #D1D5DB",
          borderRadius:8,color:isOn?"#003366":"#111827",
          fontSize:14,fontWeight:isOn?700:600,lineHeight:"1.25rem",
          padding:"10px 18px",
          boxShadow:isOn?"0 0 0 1px rgba(0,102,179,0.1)":"0 1px 2px 0 rgba(0,0,0,0.05)",
          cursor:"pointer",userSelect:"none",transition:"all .15s",fontFamily:"inherit"
        }},l);
    })
  );

  // ── Calendar View ──
  var calendarView = el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",overflow:"hidden"}},
    // Month header with nav
    el("div",{style:{background:C.navy,color:"#fff",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
      el("button",{onClick:()=>navMonth(-1),style:{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"},onMouseEnter:e=>{e.target.style.background="rgba(255,255,255,0.2)";},onMouseLeave:e=>{e.target.style.background="rgba(255,255,255,0.1)";}},"<"),
      el("div",{style:{textAlign:"center"}},
        el("div",{style:{fontSize:17,fontWeight:700,letterSpacing:"0.3px"}},monthNames[calMonth.month]+" "+calMonth.year),
        el("button",{onClick:goToday,style:{background:"rgba(0,102,179,0.3)",border:"none",color:"#8BACC8",borderRadius:4,padding:"2px 10px",cursor:"pointer",fontSize:11,fontWeight:600,marginTop:4,transition:"all .2s"}},"Hoje")
      ),
      el("button",{onClick:()=>navMonth(1),style:{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"},onMouseEnter:e=>{e.target.style.background="rgba(255,255,255,0.2)";},onMouseLeave:e=>{e.target.style.background="rgba(255,255,255,0.1)";}},">" )
    ),

    // Day names header
    el("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#F8FAFC",borderBottom:"1px solid #E5E7EB"}},
      ...dayNames.map(dn=>el("div",{key:dn,style:{padding:"8px 0",textAlign:"center",fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.5px"}},dn))
    ),

    // Calendar grid with animation
    el("div",{style:{
      display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:0,padding:0,
      transition:"transform .3s ease, opacity .3s ease",
      transform:animDir!==0?"translateX("+(animDir*30)+"px)":"translateX(0)",
      opacity:animDir!==0?0.6:1
    }},
      ...calGrid.map((day,idx)=>{
        if(day===null) return el("div",{key:"e"+idx,style:{minHeight:isMobile?70:90,borderRight:"1px solid #F0F2F5",borderBottom:"1px solid #F0F2F5"}});
        var ds = dateStr(day);
        var dayRecs = calData[ds];
        var isToday = ds===today();
        var hasTurno1 = dayRecs && dayRecs["TURNO 1"] && dayRecs["TURNO 1"].length>0;
        var hasTurno2 = dayRecs && dayRecs["TURNO 2"] && dayRecs["TURNO 2"].length>0;
        var isSelected = selectedDay && selectedDay.date===ds;
        var totalProd = 0;
        if(dayRecs){ Object.values(dayRecs).forEach(arr=>arr.forEach(r=>{ totalProd+=num(r.producao); })); }

        return el("div",{key:day,style:{
          minHeight:isMobile?70:90,borderRight:"1px solid #F0F2F5",borderBottom:"1px solid #F0F2F5",
          padding:isMobile?"4px 3px":"6px 8px",
          background:isToday?"#eff6ff":isSelected?"#f0f9ff":"#fff",
          transition:"background .2s",cursor:dayRecs?"pointer":"default",
          position:"relative"
        }},
          // Day number
          el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}},
            el("span",{style:{
              fontSize:isMobile?12:14,fontWeight:isToday?800:600,
              color:isToday?"#0066B3":"#1E293B",
              background:isToday?"#0066B3":"transparent",
              color:isToday?"#fff":"#1E293B",
              width:isToday?24:undefined,height:isToday?24:undefined,
              borderRadius:isToday?"50%":undefined,
              display:isToday?"flex":"inline",alignItems:"center",justifyContent:"center",
              fontSize:isToday?(isMobile?11:12):(isMobile?12:14)
            }},day),
            totalProd>0&&el("span",{style:{fontSize:9,color:"#94A3B8",fontWeight:600}},totalProd>=1000?(totalProd/1000).toFixed(1)+"k":totalProd)
          ),

          // Turno pills
          hasTurno1&&el("div",{onClick:e=>{e.stopPropagation();selectDay(day,"TURNO 1");},style:{
            background:isSelected&&selectedDay.turno==="TURNO 1"?"#0066B3":"#dbeafe",
            color:isSelected&&selectedDay.turno==="TURNO 1"?"#fff":"#1e40af",
            borderRadius:6,padding:isMobile?"3px 5px":"4px 8px",fontSize:isMobile?9:11,fontWeight:600,
            marginBottom:3,cursor:"pointer",transition:"all .2s",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
          }},isMobile?"T1 ("+dayRecs["TURNO 1"].length+")":"Turno 1 · "+dayRecs["TURNO 1"].length+" apt"),

          hasTurno2&&el("div",{onClick:e=>{e.stopPropagation();selectDay(day,"TURNO 2");},style:{
            background:isSelected&&selectedDay.turno==="TURNO 2"?"#0066B3":"#e0e7ff",
            color:isSelected&&selectedDay.turno==="TURNO 2"?"#fff":"#3730a3",
            borderRadius:6,padding:isMobile?"3px 5px":"4px 8px",fontSize:isMobile?9:11,fontWeight:600,
            marginBottom:3,cursor:"pointer",transition:"all .2s",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
          }},isMobile?"T2 ("+dayRecs["TURNO 2"].length+")":"Turno 2 · "+dayRecs["TURNO 2"].length+" apt"),

          // TURNO 3 if exists
          dayRecs&&dayRecs["TURNO 3"]&&dayRecs["TURNO 3"].length>0&&el("div",{onClick:e=>{e.stopPropagation();selectDay(day,"TURNO 3");},style:{
            background:isSelected&&selectedDay.turno==="TURNO 3"?"#0066B3":"#fef3c7",
            color:isSelected&&selectedDay.turno==="TURNO 3"?"#fff":"#92400e",
            borderRadius:6,padding:isMobile?"3px 5px":"4px 8px",fontSize:isMobile?9:11,fontWeight:600,
            cursor:"pointer",transition:"all .2s",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
          }},isMobile?"T3 ("+dayRecs["TURNO 3"].length+")":"Turno 3 · "+dayRecs["TURNO 3"].length+" apt")
        );
      })
    )
  );

  // ── Selected day detail panel ──
  var detailPanel = selectedDay ? el("div",{style:{
    marginTop:16,background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
    overflow:"hidden",animation:"fadeSlideIn .3s ease"
  }},
    el("style",null,"@keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}"),
    el("div",{style:{background:C.navy,color:"#fff",padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}},
      el("div",null,
        el("span",{style:{fontWeight:700,fontSize:14}},dispD(selectedDay.date)+" · "+selectedDay.turno),
        el("span",{style:{fontSize:12,color:"#8BACC8",marginLeft:10}},selectedRecords.length+" apontamento"+(selectedRecords.length!==1?"s":""))
      ),
      el("button",{onClick:()=>setSelectedDay(null),style:{background:"rgba(255,255,255,0.1)",border:"none",color:"#8BACC8",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600,transition:"background .2s"}},"Fechar")
    ),
    selectedRecords.length===0
      ? el("div",{style:{padding:32,textAlign:"center",color:"#94A3B8",fontSize:13}},"Nenhum apontamento neste turno.")
      : el("div",{style:{overflowX:"auto"}},
          el("table",{style:{width:"100%",borderCollapse:"collapse"}},
            el("thead",null,el("tr",{style:{background:"#F8FAFC"}},
              el("th",{style:{padding:"10px 14px",textAlign:"left",fontSize:12,color:"#475569",fontWeight:600}},"MÁQUINA"),
              el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"META"),
              el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"PRODUÇÃO"),
              el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"%"),
              el("th",{style:{padding:"10px 14px",textAlign:"left",fontSize:12,color:"#475569",fontWeight:600}},"POR"),
              el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:12,color:"#475569",fontWeight:600}},"AÇÕES")
            )),
            el("tbody",null,...selectedRecords.map((r,i)=>{
              var mId=Number(r.machineId);
              var mac=machines.find(m=>m.id===mId);
              var savedMeta=num(r.meta);
              var metaVal=savedMeta>0?savedMeta:(mac?.hasMeta?(metas[mId]||mac?.defaultMeta||0):0);
              var prod=num(r.producao);
              var pct=mac?.hasMeta&&metaVal>0?Math.round(prod/metaVal*100):null;
              return el("tr",{key:r.id||r.machineId,style:{...rowStyle(i),animation:"fadeSlideIn .3s ease "+(i*0.05)+"s both"}},
                el("td",{style:{padding:"10px 14px",fontSize:13,fontWeight:600,color:C.navy}},r.machineName||(mac?.name||"—")),
                el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:13,color:C.gray}},metaVal>0?metaVal.toLocaleString("pt-BR"):"—"),
                el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:14,fontWeight:700}},prod.toLocaleString("pt-BR")),
                el("td",{style:{padding:"10px 14px",textAlign:"center"}},pct!==null?el("span",{style:{background:pctCol(pct)+"1e",color:pct>=100?"#16a34a":pct>=80?"#d97706":"#dc2626",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},pct+"%"):el("span",{style:{color:"#C8D8E4"}},"—")),
                el("td",{style:{padding:"10px 14px",fontSize:12}},
                  el("div",{style:{fontWeight:600,color:"#1E293B"}},r.savedBy||"—"),
                  r.obs&&el("div",{style:{fontSize:11,color:"#0066B3",marginTop:2,background:"#eff6ff",borderRadius:4,padding:"2px 6px",display:"inline-block"}},r.obs)
                ),
                el("td",{style:{padding:"10px 14px",textAlign:"center"}},
                  el("div",{style:{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}},
                    el("button",{onClick:()=>setEditRec({...r,machineId:mId,producao:prod,meta:metaVal,savedBy:r.savedBy||""}),style:{background:"#eff6ff",color:"#0066B3",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"Editar"),
                    el("button",{onClick:()=>setObsRec({...r,machineId:mId,producao:prod,meta:metaVal,savedBy:r.savedBy||""}),style:{background:r.obs?"#eff6ff":"#f0fdf4",color:r.obs?"#0066B3":"#16a34a",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"Obs"),
                    el("button",{onClick:()=>setDeleteRec({...r,machineId:mId}),style:{background:C.red+"1e",color:"#dc2626",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"Excluir")
                  )
                )
              );
            }))
          )
        )
  ) : null;

  // ── Table View (original) ──
  var tableView = el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",overflow:"hidden"}},
    el("div",{style:{background:C.navy,color:"#fff",padding:"12px 18px",fontWeight:700,display:"flex",justifyContent:"space-between",alignItems:"center"}},
      el("span",{style:{fontSize:14,letterSpacing:"0.2px"}},"Apontamentos Salvos"),
      el("span",{style:{fontSize:12,color:"#8BACC8",fontWeight:500}},`${sortedTable.length} registros`)
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
          sortedTable.length===0&&el("tr",null,el("td",{colSpan:8,style:{padding:32,textAlign:"center",color:"#8FA4B2"}},"Nenhum apontamento registrado.")),
          ...sortedTable.map((r,i)=>{
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
  );

  return el("div",{style:{maxWidth:1100,margin:"0 auto"}},
    viewToggle,
    hView==="calendario" ? el(React.Fragment,null,calendarView,detailPanel) : tableView
  );
}

// ─── TAB METAS ────────────────────────────────────────────────
function TabMetas({machines,metas,metasInfo,updateMeta,metasLoading,metasSaving,metaEdit,setMetaEdit,saveMetasToServer,metaTurnos,setMetaTurnos}){
  return el("div",null,
    // Shift selector card
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",padding:"16px 18px",marginBottom:16}},
      el("div",{style:{fontSize:12,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}},"Tipo de Meta Aplicada no Dashboard"),
      el("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
        ...[1,2,3].map(n=>{
          var isOn=metaTurnos===n;
          return el("button",{key:n,onClick:()=>setMetaTurnos(n),
            onMouseEnter:function(e){if(!isOn)e.currentTarget.style.background="#f9fafb";},
            onMouseLeave:function(e){if(!isOn)e.currentTarget.style.background="#fff";},
            style:{
              flex:1,minWidth:100,padding:"12px 16px",textAlign:"center",
              background:isOn?"#eff6ff":"#fff",
              border:isOn?"1px solid #0066B3":"1px solid #D1D5DB",
              borderRadius:8,cursor:"pointer",
              boxShadow:isOn?"0 0 0 1px rgba(0,102,179,0.1)":"0 1px 2px 0 rgba(0,0,0,0.05)",
              transition:"all .15s",fontFamily:"inherit"
            }},
            el("div",{style:{fontSize:18,fontWeight:800,color:isOn?"#003366":"#94A3B8"}},n),
            el("div",{style:{fontSize:12,fontWeight:600,color:isOn?"#0066B3":"#6B7280",marginTop:2}},n===1?"Turno":"Turnos")
          );
        })
      ),
      el("div",{style:{fontSize:12,color:"#94A3B8",marginTop:10}},"Meta/Dia = Meta/Turno x "+metaTurnos+" · Afeta o cálculo de % atingimento no Dashboard em tempo real")
    ),

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
                  el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:14,color:"#475569"}},m.hasMeta?((metas[m.id]||0)*metaTurnos).toLocaleString("pt-BR"):"—"),
                  el("td",{style:{padding:"10px 14px",textAlign:"center",fontSize:14,color:"#475569"}},m.hasMeta?((metas[m.id]||0)*metaTurnos*22).toLocaleString("pt-BR"):"—"),
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

// ─── TV MODE (APRESENTAÇÃO) ──────────────────────────────────
function TVMode({machines,metas,dashData,machAgg,totProd,totMeta,chartProdVsMeta,chartTurnoData,chartTendencia,chartPerformers,metaTurnos,onClose}){
  var [slide,setSlide] = useState(0);
  var [fade,setFade] = useState(true);
  var [clock,setClock] = useState(new Date());
  var containerRef = useRef(null);

  // Clock tick
  useEffect(()=>{
    var t=setInterval(()=>setClock(new Date()),1000);
    return()=>clearInterval(t);
  },[]);

  // Request fullscreen on mount
  useEffect(()=>{
    var el=containerRef.current;
    if(el){
      try{
        if(el.requestFullscreen) el.requestFullscreen();
        else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if(el.msRequestFullscreen) el.msRequestFullscreen();
      }catch(e){}
    }
    function onFsChange(){
      if(!document.fullscreenElement&&!document.webkitFullscreenElement&&!document.msFullscreenElement){
        onClose();
      }
    }
    document.addEventListener("fullscreenchange",onFsChange);
    document.addEventListener("webkitfullscreenchange",onFsChange);
    return()=>{
      document.removeEventListener("fullscreenchange",onFsChange);
      document.removeEventListener("webkitfullscreenchange",onFsChange);
    };
  },[]);

  // Build slides data
  var pctGeral=totMeta>0?Math.round(totProd/totMeta*100):null;

  // Machine table rows for summary slide
  var machRows=machines.map(m=>{
    var a=machAgg[m.id];
    return {name:m.name,prod:a?a.totalProd:0,meta:a?a.totalMeta:0,pct:a?a.pct:null,dias:a?a.diasCount:0};
  }).filter(r=>r.prod>0||r.meta>0).sort((a,b)=>b.prod-a.prod);

  // Top performers
  var topPerf=machRows.filter(r=>r.pct!==null).sort((a,b)=>b.pct-a.pct).slice(0,5);

  // Turno totals
  var turnoTotals={};
  dashData.forEach(r=>{ turnoTotals[r.turno]=(turnoTotals[r.turno]||0)+num(r.producao); });

  var SLIDE_DURATION=12000; // 12 seconds per slide
  var TRANSITION_MS=600;
  var totalSlides=5; // 0:KPIs+Top, 1:ProdVsMeta chart, 2:Turnos pie, 3:Tendencia line, 4:Table

  // Auto-advance slides — resets when slide changes (manual nav)
  useEffect(()=>{
    var t=setInterval(()=>{
      setFade(false);
      setTimeout(()=>{
        setSlide(s=>(s+1)%totalSlides);
        setFade(true);
      },TRANSITION_MS);
    },SLIDE_DURATION);
    return()=>clearInterval(t);
  },[slide,totalSlides]);

  // ESC to close
  useEffect(()=>{
    function onKey(e){ if(e.key==="Escape") onClose(); }
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[]);

  var timeStr=clock.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  var dateStr2=clock.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});

  // Capitalize first letter of each word properly
  function capitalize(str){ return str.replace(/\b\w/g,function(c){return c.toUpperCase();}); }
  var dateFormatted=capitalize(dateStr2);

  var slideSubtitles=["Indicadores Gerais","Produção vs Meta por Máquina","Distribuição por Turno","Tendência de Produção","Resumo por Máquina"];

  // Header bar (persistent across all slides)
  var tvHeader=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"24px 48px 20px",flexShrink:0}},
    // Left: Section name + slide subtitle
    el("div",null,
      el("div",{style:{fontSize:13,color:"#94A3B8",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase"}},"Seção"),
      el("div",{style:{fontSize:24,fontWeight:800,color:C.navy,marginTop:4,letterSpacing:"0.3px"}},"Tomadas e Interruptores (Itajaí)"),
      el("div",{style:{fontSize:14,color:"#0066B3",fontWeight:600,marginTop:4}},slideSubtitles[slide])
    ),
    // Right: WEG logo + clock
    el("div",{style:{display:"flex",alignItems:"center",gap:24}},
      el("div",{style:{textAlign:"right"}},
        el("div",{style:{fontSize:36,fontWeight:800,color:C.navy,fontFamily:"'Segoe UI',monospace",letterSpacing:"2px",lineHeight:1}},timeStr),
        el("div",{style:{fontSize:13,color:"#6B7280",marginTop:6,fontWeight:500}},dateFormatted)
      ),
      el(WEGLogoSVG,{height:44,color:"#003366"})
    )
  );

  // Slide progress dots
  var dots=el("div",{style:{display:"flex",justifyContent:"center",gap:10,padding:"12px 0",flexShrink:0}},
    ...Array.from({length:totalSlides}).map((_,i)=>
      el("div",{key:i,style:{width:slide===i?32:10,height:10,borderRadius:5,background:slide===i?"#0066B3":"#D1D5DB",transition:"all .4s ease",cursor:"pointer"},onClick:()=>{setFade(false);setTimeout(()=>{setSlide(i);setFade(true);},300);}})
    )
  );

  // ── Slide 0: KPIs + Top Performers ──
  function renderSlide0(){
    return el("div",{style:{display:"flex",gap:30,height:"100%",alignItems:"stretch"}},
      // Left: KPIs grid
      el("div",{style:{flex:1.2,display:"flex",flexDirection:"column",gap:16}},
        el("div",{style:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,flex:1}},
          ...[
            {label:"Produção Total",value:totProd.toLocaleString("pt-BR"),unit:"Peças Produzidas",color:C.blue,big:true},
            {label:"Meta Total",value:totMeta>0?totMeta.toLocaleString("pt-BR"):"—",unit:"Peças Planejadas",color:C.navy,big:true},
            {label:"Atingimento",value:pctGeral!==null?pctGeral+"%":"—",unit:"Meta Geral",color:pctGeral!==null?pctCol(pctGeral):C.gray,big:true},
            {label:"Registros",value:String(dashData.length),unit:"Apontamentos",color:C.teal,big:false},
            {label:"Máquinas Ativas",value:String(Object.keys(machAgg).length)+"/"+machines.length,unit:"Em Operação",color:C.yellow,big:false},
            {label:"Turnos Calculados",value:String(metaTurnos),unit:metaTurnos===1?"Turno":"Turnos",color:C.info,big:false},
          ].map(k=>el("div",{key:k.label,style:{background:"#fff",borderRadius:16,padding:"22px 26px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",borderLeft:"5px solid "+k.color,display:"flex",flexDirection:"column",justifyContent:"center"}},
            el("div",{style:{fontSize:12,color:"#6B7280",fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}},k.label),
            el("div",{style:{fontSize:k.big?44:36,fontWeight:900,color:k.color,lineHeight:1}},k.value),
            el("div",{style:{fontSize:12,color:"#94A3B8",marginTop:6,fontWeight:500}},k.unit)
          ))
        )
      ),
      // Right: Top performers
      el("div",{style:{flex:0.8,background:"#fff",borderRadius:16,padding:"24px 28px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column"}},
        el("div",{style:{fontSize:18,fontWeight:800,color:C.navy,letterSpacing:"0.5px",marginBottom:20}},"Ranking de Performance"),
        el("div",{style:{flex:1,display:"flex",flexDirection:"column",gap:12,justifyContent:"center"}},
          ...topPerf.map((r,i)=>{
            var col=pctCol(r.pct);
            return el("div",{key:r.name,style:{display:"flex",alignItems:"center",gap:14}},
              el("div",{style:{width:32,height:32,borderRadius:"50%",background:i===0?"#0066B3":i===1?"#004E8C":i===2?"#003366":"#E8ECF1",color:i<3?"#fff":"#475569",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,flexShrink:0}},i+1),
              el("div",{style:{flex:1,minWidth:0}},
                el("div",{style:{fontSize:14,fontWeight:700,color:C.navy,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},r.name),
                el("div",{style:{background:"#F0F2F5",borderRadius:6,height:10,marginTop:4,overflow:"hidden"}},
                  el("div",{style:{width:Math.min(r.pct,100)+"%",height:"100%",background:col,borderRadius:6,transition:"width 1s ease"}})
                )
              ),
              el("div",{style:{fontSize:18,fontWeight:800,color:col,minWidth:56,textAlign:"right"}},r.pct!==null?r.pct+"%":"—")
            );
          }),
          topPerf.length===0&&el("div",{style:{color:"#94A3B8",fontSize:14,textAlign:"center",fontWeight:500}},"Nenhum Dado de Performance Disponível")
        )
      )
    );
  }

  // ── Slide 1: Prod vs Meta Bar Chart ──
  function renderSlide1(){
    return el("div",{style:{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center"}},
      el(EChartsComponent,{data:chartProdVsMeta,type:"bar",height:500})
    );
  }

  // ── Slide 2: Turnos Pie (70%) + Turno cards (30%) ──
  function renderSlide2(){
    var totalTurnoProd=Object.values(turnoTotals).reduce((s,v)=>s+v,0);
    return el("div",{style:{height:"100%",display:"flex",gap:30,alignItems:"stretch"}},
      // Left: Pie chart — 70%
      el("div",{style:{flex:7,display:"flex",flexDirection:"column",justifyContent:"center"}},
        el(EChartsComponent,{data:chartTurnoData,type:"pie",height:520})
      ),
      // Right: Turno cards — 30%
      el("div",{style:{flex:3,background:"#fff",borderRadius:16,padding:"28px 28px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",justifyContent:"center",gap:24}},
        ...TURNOS.map((t,i)=>{
          var val=turnoTotals[t]||0;
          var pct2=totalTurnoProd>0?Math.round(val/totalTurnoProd*100):0;
          var colors=["#0066B3","#004E8C","#F59E0B"];
          return el("div",{key:t,style:{borderLeft:"5px solid "+colors[i],paddingLeft:20}},
            el("div",{style:{fontSize:12,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.8px"}},t),
            el("div",{style:{fontSize:40,fontWeight:900,color:colors[i],marginTop:6,lineHeight:1}},val.toLocaleString("pt-BR")),
            el("div",{style:{display:"flex",alignItems:"center",gap:10,marginTop:8}},
              el("div",{style:{background:"#F0F2F5",borderRadius:6,height:10,flex:1,overflow:"hidden"}},
                el("div",{style:{width:pct2+"%",height:"100%",background:colors[i],borderRadius:6,transition:"width 1s ease"}})
              ),
              el("div",{style:{fontSize:16,fontWeight:800,color:colors[i],minWidth:48,textAlign:"right"}},pct2+"%")
            )
          );
        })
      )
    );
  }

  // ── Slide 3: Tendência Line Chart ──
  function renderSlide3(){
    return el("div",{style:{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center"}},
      el(EChartsComponent,{data:chartTendencia,type:"line",height:500})
    );
  }

  // ── Slide 4: Full machine table ──
  function renderSlide4(){
    return el("div",{style:{height:"100%",display:"flex",flexDirection:"column"}},
      el("div",{style:{flex:1,overflowY:"auto",borderRadius:12,background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}},
        el("table",{style:{width:"100%",borderCollapse:"collapse"}},
          el("thead",null,el("tr",{style:{background:C.navy,color:"#fff",position:"sticky",top:0}},
            el("th",{style:{padding:"14px 24px",textAlign:"left",fontSize:14,fontWeight:700,letterSpacing:"0.3px"}},"Máquina"),
            el("th",{style:{padding:"14px 20px",textAlign:"center",fontSize:14,fontWeight:700}},"Dias"),
            el("th",{style:{padding:"14px 20px",textAlign:"center",fontSize:14,fontWeight:700}},"Produção"),
            el("th",{style:{padding:"14px 20px",textAlign:"center",fontSize:14,fontWeight:700}},"Meta"),
            el("th",{style:{padding:"14px 20px",textAlign:"center",fontSize:14,fontWeight:700}},"Atingimento"),
            el("th",{style:{padding:"14px 20px",textAlign:"left",fontSize:14,fontWeight:700,minWidth:180}},"Progresso")
          )),
          el("tbody",null,...machRows.map((r,i)=>
            el("tr",{key:r.name,style:{background:i%2===0?"#F8FAFC":"#fff",borderBottom:"1px solid #E5E7EB"}},
              el("td",{style:{padding:"12px 20px",fontSize:15,fontWeight:700,color:C.navy}},r.name),
              el("td",{style:{padding:"12px 20px",textAlign:"center",fontSize:15}},r.dias),
              el("td",{style:{padding:"12px 20px",textAlign:"center",fontSize:16,fontWeight:800,color:C.blue}},r.prod.toLocaleString("pt-BR")),
              el("td",{style:{padding:"12px 20px",textAlign:"center",fontSize:15,color:"#94A3B8"}},r.meta>0?r.meta.toLocaleString("pt-BR"):"—"),
              el("td",{style:{padding:"12px 20px",textAlign:"center"}},r.pct!==null?el("span",{style:{background:pctCol(r.pct)+"1a",color:r.pct>=100?"#16a34a":r.pct>=80?"#d97706":"#dc2626",borderRadius:20,padding:"4px 14px",fontSize:15,fontWeight:800}},r.pct+"%"):el("span",{style:{color:"#C8D8E4"}},"—")),
              el("td",{style:{padding:"12px 20px"}},r.pct!==null?el("div",{style:{background:"#E5E7EB",borderRadius:6,height:12,overflow:"hidden",minWidth:120}},el("div",{style:{width:Math.min(r.pct,100)+"%",height:"100%",background:pctCol(r.pct),borderRadius:6,transition:"width 1s ease"}})):null)
            )
          ))
        )
      )
    );
  }

  var slides=[renderSlide0,renderSlide1,renderSlide2,renderSlide3,renderSlide4];

  return el("div",{ref:containerRef,style:{
    position:"fixed",inset:0,zIndex:9999,background:"#F5F6FA",
    display:"flex",flexDirection:"column",fontFamily:"'Segoe UI','Inter',-apple-system,sans-serif",
    overflow:"hidden"
  }},
    tvHeader,

    // Main slide area
    el("div",{style:{
      flex:1,padding:"0 40px 16px",overflow:"hidden",
      opacity:fade?1:0,
      transform:fade?"translateY(0)":"translateY(20px)",
      transition:"opacity "+TRANSITION_MS+"ms ease, transform "+TRANSITION_MS+"ms ease"
    }},
      slides[slide]()
    ),

    dots
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
  const [showTV,setShowTV]           = useState(false);
  const [dfIni,setDfIni]             = useState(()=>{ const d=new Date(); d.setDate(1); return fmt(d); });
  const [dfFim,setDfFim]             = useState(today());
  const [dfMac,setDfMac]             = useState("TODAS");
  const [dfTur,setDfTur]             = useState("TODOS");
  const [dView,setDView]             = useState("resumo");
  const [metaEdit,setMetaEdit]       = useState(false);
  const [metasInfo,setMetasInfo]     = useState({});
  const [metaTurnos,setMetaTurnos]   = useState(()=>{ try{ return Number(localStorage.getItem('prod_meta_turnos'))||3; }catch{ return 3; } });
  const pollRef    = useRef(null);
  const metaEditRef= useRef(false);
  const userRef    = useRef(user);
  const isMobile   = useIsMobile();

  useEffect(()=>{ metaEditRef.current=metaEdit; },[metaEdit]);
  useEffect(()=>{ try{ localStorage.setItem('prod_meta_turnos',String(metaTurnos)); }catch{} },[metaTurnos]);
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
      a.totalMeta=a.hasMeta?(metas[nId]||0)*a.diasCount*(dfTur==="TODOS"?metaTurnos:1):0;
      a.pct=a.totalMeta>0?Math.round(a.totalProd/a.totalMeta*100):null;
    });
    return agg;
  },[dashData,metas,dfTur,metaTurnos,machines]);

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

  // ── Analytics derivados ──
  const analytics=useMemo(()=>{
    // OEE simplificado (ponderado por meta, não média simples)
    var oee=totMeta>0?Math.round(totProd/totMeta*100):null;

    // Tendência vs mês anterior
    var todayStr=today();
    var thisMonth=todayStr.slice(0,7);
    var prevD=new Date(); prevD.setMonth(prevD.getMonth()-1);
    var prevMonth=fmt(prevD).slice(0,7);
    var dayOfMonth=new Date().getDate();
    var curMonthProd=0,prevMonthProd=0,curMonthMeta=0,prevMonthMeta=0;
    records.forEach(function(r){
      var nd=normDate(r.date); if(!nd) return;
      var ym=nd.slice(0,7); var dom=parseInt(nd.slice(8,10),10);
      if(ym===thisMonth&&dom<=dayOfMonth){ curMonthProd+=num(r.producao); var mac=machines.find(function(m){return m.id===Number(r.machineId);}); if(mac&&mac.hasMeta) curMonthMeta+=metas[mac.id]||0; }
      if(ym===prevMonth&&dom<=dayOfMonth){ prevMonthProd+=num(r.producao); var mac2=machines.find(function(m){return m.id===Number(r.machineId);}); if(mac2&&mac2.hasMeta) prevMonthMeta+=metas[mac2.id]||0; }
    });
    var trendPct=prevMonthProd>0?Math.round((curMonthProd-prevMonthProd)/prevMonthProd*100):null;
    var trendUp=trendPct!==null?trendPct>=0:null;

    // Ranking top 3 / bottom 3
    var ranked=machines.map(function(m){ var a=machAgg[m.id]; return {name:m.name,pct:a?a.pct:null,prod:a?a.totalProd:0}; })
      .filter(function(x){return x.pct!==null;}).sort(function(a,b){return b.pct-a.pct;});
    var top3=ranked.slice(0,3);
    var bottom3=ranked.slice(-3).reverse();

    // Taxa de apontamento
    var uniqueDays=new Set(); records.forEach(function(r){ var nd=normDate(r.date); if(nd&&nd>=dfIni&&nd<=dfFim) uniqueDays.add(nd); });
    var nDays=uniqueDays.size||1;
    var activeMachines=machines.length;
    var turnosCount=dfTur==="TODOS"?3:1;
    var totalPossible=nDays*activeMachines*turnosCount;
    var filledCells=dashData.length;
    var taxaApontamento=totalPossible>0?Math.round(filledCells/totalPossible*100):0;

    // Dias consecutivos acima/abaixo de 90% da meta global
    var dailyTotals={}; var dailyMetas={};
    records.forEach(function(r){
      var nd=normDate(r.date); if(!nd) return;
      dailyTotals[nd]=(dailyTotals[nd]||0)+num(r.producao);
      var mac=machines.find(function(m){return m.id===Number(r.machineId);});
      if(mac&&mac.hasMeta) dailyMetas[nd]=(dailyMetas[nd]||0)+(metas[mac.id]||0);
    });
    var sortedDays=Object.keys(dailyTotals).sort().reverse();
    var consecutive=0; var consecutiveAbove=true;
    for(var di=0;di<sortedDays.length;di++){
      var dd=sortedDays[di]; var dm=dailyMetas[dd]||1; var dpct=Math.round(dailyTotals[dd]/dm*100);
      if(di===0){ consecutiveAbove=dpct>=90; }
      if((dpct>=90)===consecutiveAbove) consecutive++; else break;
    }

    // Variabilidade por máquina (desvio padrão últimos 30 dias)
    var thirtyAgo=fmt(new Date(Date.now()-30*24*3600*1000));
    var machVar={};
    records.forEach(function(r){
      var nd=normDate(r.date); if(!nd||nd<thirtyAgo) return;
      var mid=Number(r.machineId);
      if(!machVar[mid]) machVar[mid]=[];
      machVar[mid].push(num(r.producao));
    });
    Object.keys(machVar).forEach(function(mid){
      var arr=machVar[mid]; var avg=arr.reduce(function(s,v){return s+v;},0)/arr.length;
      var variance=arr.reduce(function(s,v){return s+(v-avg)*(v-avg);},0)/arr.length;
      machVar[mid]={stdDev:Math.round(Math.sqrt(variance)),avg:Math.round(avg),count:arr.length};
    });

    // Melhor/pior dia da semana
    var weekdayNames=["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];
    var wdTotals={}; var wdCounts={};
    Object.keys(dailyTotals).forEach(function(nd){
      var d=new Date(nd+"T00:00:00"); var wd=d.getDay();
      wdTotals[wd]=(wdTotals[wd]||0)+dailyTotals[nd];
      wdCounts[wd]=(wdCounts[wd]||0)+1;
    });
    var wdAvgs=[0,1,2,3,4,5,6].map(function(wd){return {day:weekdayNames[wd],avg:wdCounts[wd]?Math.round(wdTotals[wd]/wdCounts[wd]):0};});
    var bestWeekday=wdAvgs.filter(function(w){return w.avg>0;}).sort(function(a,b){return b.avg-a.avg;})[0];
    var worstWeekday=wdAvgs.filter(function(w){return w.avg>0;}).sort(function(a,b){return a.avg-b.avg;})[0];

    // Frequência de feedbacks por máquina
    var fbFreq={};
    records.forEach(function(r){
      if(!r.obs||!r.obs.trim()) return;
      var mid=Number(r.machineId); fbFreq[mid]=(fbFreq[mid]||0)+1;
    });

    return {oee,trendPct,trendUp,top3,bottom3,taxaApontamento,consecutive,consecutiveAbove,machVar,bestWeekday,worstWeekday,fbFreq,curMonthProd,prevMonthProd};
  },[records,machines,metas,machAgg,totProd,totMeta,dashData,dfIni,dfFim,dfTur]);

  // ── Dados para gráficos analíticos ──
  const chartHeatmap=useMemo(function(){
    var last7=[];
    var d=new Date(); for(var i=6;i>=0;i--){ var dd=new Date(d); dd.setDate(dd.getDate()-i); last7.push(fmt(dd)); }
    var days=last7.map(function(nd){return dispD(nd);});
    var machNames=machines.map(function(m){return m.name;});
    var values=[];
    machines.forEach(function(m,mi){
      last7.forEach(function(nd,di){
        var dayProd=0,dayMeta=0;
        records.forEach(function(r){
          if(normDate(r.date)===nd&&Number(r.machineId)===m.id){ dayProd+=num(r.producao); }
        });
        dayMeta=m.hasMeta?(metas[m.id]||0)*(dfTur==="TODOS"?3:1):0;
        var pct=dayMeta>0?Math.round(dayProd/dayMeta*100):0;
        values.push([di,mi,pct]);
      });
    });
    return {days:days,machines:machNames,values:values};
  },[records,machines,metas,dfTur]);

  const chartPareto=useMemo(function(){
    var gaps=machines.map(function(m){
      var a=machAgg[m.id]; if(!a||!a.hasMeta||!a.totalMeta) return null;
      var gap=Math.max(0,a.totalMeta-a.totalProd);
      return {name:m.name,gap:gap};
    }).filter(Boolean).sort(function(a,b){return b.gap-a.gap;});
    var totalGap=gaps.reduce(function(s,g){return s+g.gap;},0);
    var accum=0;
    return gaps.map(function(g){ accum+=g.gap; return {name:g.name,gap:g.gap,accumPct:totalGap>0?Math.round(accum/totalGap*100):0}; });
  },[machines,machAgg]);

  const chartBoxplot=useMemo(function(){
    var turnoData={};
    TURNOS.forEach(function(t){ turnoData[t]=[]; });
    dashData.forEach(function(r){ if(turnoData[r.turno]) turnoData[r.turno].push(num(r.producao)); });
    function calcBox(arr){
      if(arr.length===0) return [0,0,0,0,0];
      arr.sort(function(a,b){return a-b;});
      var n=arr.length;
      var q1=arr[Math.floor(n*0.25)],median=arr[Math.floor(n*0.5)],q3=arr[Math.floor(n*0.75)];
      var iqr=q3-q1; var lo=Math.max(arr[0],q1-1.5*iqr); var hi=Math.min(arr[n-1],q3+1.5*iqr);
      return [lo,q1,median,q3,hi];
    }
    var boxData=[]; var outliers=[];
    TURNOS.forEach(function(t,ti){
      var arr=turnoData[t]; var box=calcBox(arr); boxData.push(box);
      arr.forEach(function(v){ if(v<box[0]||v>box[4]) outliers.push([ti,v]); });
    });
    return {turnos:TURNOS,boxData:boxData,outliers:outliers};
  },[dashData]);

  const chartTrendMA=useMemo(function(){
    var dailyMap={};
    records.forEach(function(r){
      var nd=normDate(r.date); if(!nd) return;
      dailyMap[nd]=(dailyMap[nd]||0)+num(r.producao);
    });
    var sorted=Object.keys(dailyMap).sort().slice(-30);
    var result=sorted.map(function(nd,i){
      var start=Math.max(0,i-6);
      var window=sorted.slice(start,i+1);
      var sum=window.reduce(function(s,d){return s+dailyMap[d];},0);
      return {date:dispD(nd),producao:dailyMap[nd],ma7:Math.round(sum/window.length),metaGlobal:60000};
    });
    return result;
  },[records]);

  const chartStacked=useMemo(function(){
    var dailyTurno={};
    dashData.forEach(function(r){
      var nd=normDate(r.date); if(!nd) return;
      if(!dailyTurno[nd]) dailyTurno[nd]={};
      dailyTurno[nd][r.turno]=(dailyTurno[nd][r.turno]||0)+num(r.producao);
    });
    var dates=Object.keys(dailyTurno).sort().slice(-14);
    return {
      dates:dates.map(function(d){return dispD(d);}),
      turnos:TURNOS,
      series:TURNOS.map(function(t){return {name:t,data:dates.map(function(d){return dailyTurno[d][t]||0;})};})
    };
  },[dashData]);

  const chartScatter=useMemo(function(){
    var machData={};
    dashData.forEach(function(r){
      var mid=Number(r.machineId); var mac=machines.find(function(m){return m.id===mid;});
      if(!mac||!mac.hasMeta) return;
      if(!machData[mid]) machData[mid]={name:mac.name,totalMeta:0,totalProd:0,count:0};
      machData[mid].totalProd+=num(r.producao);
      machData[mid].totalMeta+=(metas[mid]||0);
      machData[mid].count++;
    });
    var points=Object.values(machData).map(function(d){return [d.totalMeta,d.totalProd,d.count,d.name];});
    var maxVal=points.reduce(function(mx,p){return Math.max(mx,p[0],p[1]);},0)*1.1||1;
    return {points:points,diagonal:[[0,0],[maxVal,maxVal]]};
  },[dashData,machines,metas]);

  const feedbacksData=useMemo(()=>
    records.filter(r=>{
      if(!r.obs||!r.obs.trim()) return false;
      const recDate=normDate(r.date);
      if(!recDate||recDate<dfIni||recDate>dfFim) return false;
      if(dfMac!=="TODAS"){ const mac=machines.find(m=>m.id===Number(r.machineId)); if(!mac||mac.name!==dfMac) return false; }
      return true;
    }).sort((a,b)=>b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno))
  ,[records,dfIni,dfFim,dfMac,machines]);

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
        el("div",{style:{color:"#fff",fontSize:isMobile?13:15,fontWeight:700,letterSpacing:"0.3px"}},(isMobile?"Dashboard":"Dashboard de Produção")),
        el("div",{style:{color:"#8BACC8",fontSize:11,marginTop:1}},`${user.nome}`+(isMobile?"":" · "+(lastSync?`Atualizado às ${lastSync.toLocaleTimeString("pt-BR")}`:"Conectando...")),loading?" ...":"")
      )
    ),
    el("div",{style:{display:"flex",gap:10,alignItems:"center",padding:isMobile?"0":"0 20px 0 0"}},
      syncSt==="syncing"&&el(SaveLoader,{header:true}),
      syncSt==="ok"    &&el(SaveCheck,{size:18,color:"#86efac"}),
      syncSt==="error" &&el("span",{style:{color:"#fca5a5",fontSize:11,fontWeight:500}},"Erro"),
      el(PushButton,{label:"TV",variant:"tv",onClick:()=>setShowTV(true)}),
      user.role==="admin"&&el("button",{onClick:()=>setShowAdmin(true),style:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#C8D8E8",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:600,lineHeight:"1.25rem",transition:"all .15s",fontFamily:"inherit"}},"Admin"),
      el(PushButton,{label:"Sair",variant:"sair",onClick:handleLogout})
    )
  );

  // ── tabs (desktop top bar) ──
  const tabLabels=[["entrada","Apontamento"],["dashboard","Dashboard"],["historico","Histórico"],["metas","Metas"],["feedbacks","Feedbacks"]];
  const tabs=!isMobile&&el("div",{style:{background:"#fff",display:"flex",gap:6,padding:"10px 24px",overflowX:"auto",borderBottom:"1px solid #E5E7EB"}},
    ...tabLabels.map(([k,l])=>{
      var isActive=tab===k;
      return el("button",{key:k,onClick:()=>setTab(k),
        onMouseEnter:function(e){if(!isActive)e.currentTarget.style.background="#f9fafb";},
        onMouseLeave:function(e){if(!isActive)e.currentTarget.style.background="#fff";},
        style:{
          background:isActive?"#eff6ff":"#fff",
          border:isActive?"1px solid #0066B3":"1px solid #D1D5DB",
          borderRadius:8,
          color:isActive?"#003366":"#111827",
          fontSize:14,fontWeight:isActive?700:600,lineHeight:"1.25rem",
          padding:"10px 18px",
          textAlign:"center",whiteSpace:"nowrap",
          boxShadow:isActive?"0 0 0 1px rgba(0,102,179,0.1)":"0 1px 2px 0 rgba(0,0,0,0.05)",
          cursor:"pointer",userSelect:"none",
          transition:"all .15s",fontFamily:"inherit",letterSpacing:"0.2px"
        }},l);
    })
  );

  // ── bottom nav (mobile only) ──
  const mobileNavItems=[
    {k:"entrada",  label:"Apontar",   svgD:["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"]},
    {k:"dashboard",label:"Dashboard", svgD:["M18 20V10","M12 20V4","M6 20v-6"]},
    {k:"historico",label:"Histórico", svgD:["M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2","M13 5H11a2 2 0 00-2 2v0a2 2 0 002 2h2a2 2 0 002-2v0a2 2 0 00-2-2z","M9 12h6","M9 16h4"]},
    {k:"metas",    label:"Metas",     svgD:["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z","M12 8v4l3 3"]},
    {k:"feedbacks",label:"Obs",       svgD:["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"]}
  ];
  const bottomNav=isMobile&&el("div",{style:{
    position:"fixed",bottom:0,left:0,right:0,zIndex:50,
    background:"#fff",
    borderTop:"1px solid #E8ECF1",
    display:"flex",
    boxShadow:"0 -4px 20px rgba(0,0,0,0.08)",
    paddingBottom:"env(safe-area-inset-bottom,0px)"
  }},
    ...mobileNavItems.map(({k,label,svgD})=>{
      var isActive=tab===k;
      var hasBadge=k==="entrada"&&pendingCount>0;
      return el("button",{key:k,onClick:()=>setTab(k),style:{
        flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:"10px 4px 10px",background:"none",border:"none",cursor:"pointer",
        color:isActive?"#0066B3":"#9EAFBF",
        position:"relative",minHeight:58,
        transition:"color .2s"
      }},
        // Active indicator pill
        isActive&&el("div",{style:{
          position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
          width:32,height:3,borderRadius:"0 0 3px 3px",background:"#0066B3"
        }}),
        el("div",{style:{position:"relative",marginBottom:3}},
          el("svg",{width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:isActive?2.5:1.75,strokeLinecap:"round",strokeLinejoin:"round"},
            ...svgD.map((d,i)=>el("path",{key:i,d}))
          ),
          hasBadge&&el("div",{style:{
            position:"absolute",top:-5,right:-8,
            background:"#EF4444",color:"#fff",borderRadius:10,
            minWidth:17,height:17,fontSize:10,fontWeight:800,
            display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",
            boxShadow:"0 1px 4px rgba(239,68,68,0.4)"
          }},pendingCount>9?"9+":pendingCount)
        ),
        el("div",{style:{fontSize:10,fontWeight:isActive?700:400,letterSpacing:"0.1px",lineHeight:1}},label)
      );
    })
  );

  return el("div",{style:{fontFamily:"'Sebino','Segoe UI','Inter',-apple-system,sans-serif",background:"#F5F6FA",minHeight:"100vh"}},
    el("style",null,FONT_CSS+PUSH_CSS+LOADER_CSS+TOAST_CSS),
    isMobile&&(syncSt==="ok"||syncSt==="error")&&el(Toast,{msg:"",type:syncSt}),
    editRec  &&el(EditModal,  {rec:editRec,  metas,machines,onSave:handleEdit,    onClose:()=>setEditRec(null),  saving:editSaving}),
    deleteRec&&el(DeleteModal,{rec:deleteRec,machines,     onConfirm:handleDelete,onClose:()=>setDeleteRec(null),deleting}),
    obsRec   &&el(ObsModal,   {rec:obsRec,   machines,     onSave:handleSaveObs,  onClose:()=>setObsRec(null),  saving:obsSaving}),
    conflictInfo&&el(ConflictModal,{conflicts:conflictInfo.conflicts,onReplace:handleConflictReplace,onAppend:handleConflictAppend,onClose:()=>setConflictInfo(null)}),
    showAdmin&&el(AdminPanel,{user,onClose:()=>setShowAdmin(false),reloadMachines:loadMachines}),
    showExport&&el(ExportModal,{onClose:()=>setShowExport(false),onExport:(format,sections,opts)=>{setShowExport(false);doExport(format,sections,{data:dashData,machines,metas,machAgg,totProd,totMeta,dfIni,dfFim,dfTur,dfMac},opts);}}),
    showTV&&el(TVMode,{machines,metas,dashData,machAgg,totProd,totMeta,chartProdVsMeta,chartTurnoData,chartTendencia,chartPerformers,metaTurnos,onClose:()=>setShowTV(false)}),
    header, tabs,
    el("div",{style:{padding:isMobile?"0 0 calc(env(safe-area-inset-bottom,0px) + 70px)":"16px 24px",maxWidth:1400,margin:"0 auto",width:"100%",boxSizing:"border-box"}},
      tab==="entrada"   &&el(TabEntrada,{machines,metas,inputs,obsInputs,entryDate,setEntryDate,entryTurno,setEntryTurno,syncSt,pendingCount,handleSave,setInputs,setObsInputs}),
      tab==="dashboard" &&el("div",{style:{padding:isMobile?"12px 10px":"0"}},el(TabDashboard, {machines,metas,dashData,machAgg,totProd,totMeta,chartProdVsMeta,chartTurnoData,chartTendencia,chartPerformers,analytics,chartHeatmap,chartPareto,chartBoxplot,chartTrendMA,chartStacked,chartScatter,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,dView,setDView,isMobile,onOpenExport:()=>setShowExport(true)})),
      tab==="historico" &&el("div",{style:{padding:isMobile?"12px 10px":"0"}},el(TabHistorico, {machines,metas,records,setEditRec,setDeleteRec,setObsRec,isMobile})),
      tab==="metas"     &&el("div",{style:{padding:isMobile?"12px 10px":"0"}},el(TabMetas,     {machines,metas,metasInfo,updateMeta,metasLoading,metasSaving,metaEdit,setMetaEdit,saveMetasToServer,metaTurnos,setMetaTurnos})),
      tab==="feedbacks" &&el("div",{style:{padding:isMobile?"12px 10px":"0"}},el(TabFeedbacks, {machines,metas,feedbacksData,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,setObsRec,setDeleteRec}))
    ),
    bottomNav
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
