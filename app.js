// ─── CONFIGURE AQUI ───────────────────────────────────────────
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwW8-pj3QPY8ZpMTvmfiHvixRV3PWvMymXbjEWkZc7BtEoEtqF5Hd53j3PewndZiZPN/exec";

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
const C={green:"#27AE60",yellow:"#E87722",red:"#C8102E",blue:"#0064A6",gray:"#5E6E78",purple:"#004A80",teal:"#0095A8",navy:"#003057"};
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
const rowStyle = i=>({background:i%2===0?"#F5F8FA":"#fff",borderBottom:"1px solid #D0DEE8"});
const IS = {border:"1px solid #C8D8E4",borderRadius:4,padding:"7px 10px",fontSize:14,background:"#fff",outline:"none"};
const SS = {...IS,cursor:"pointer"};
const BTN= (bg,ex={})=>({background:bg,color:"#fff",border:"none",borderRadius:4,padding:"9px 22px",fontWeight:700,fontSize:14,cursor:"pointer",...ex});

// ─── EXPORTAÇÃO ───────────────────────────────────────────────
function exportCSV(data, machines, dfIni, dfFim, extras) {
  const bom = '\uFEFF';
  const totProd = extras?.totProd ?? data.reduce((s,r)=>s+num(r.producao),0);
  const totMeta = extras?.totMeta ?? 0;
  const pctGeral = totMeta > 0 ? Math.round(totProd/totMeta*100)+'%' : '—';
  // Resumo KPI no topo
  const summary = [
    `"Relatório de Produção WEG"`,
    `"Período:";"${dispD(dfIni)} a ${dispD(dfFim)}"`,
    `"Produção Total:";"${totProd.toLocaleString('pt-BR')}"`,
    `"Meta Total:";"${totMeta > 0 ? totMeta.toLocaleString('pt-BR') : '—'}"`,
    `"% Atingimento:";"${pctGeral}"`,
    `"Registros:";"${data.length}"`,
    ``
  ];
  const header = ['Data','Turno','Máquina','Meta (turno)','Produção','% Meta','Apontado por','Editado por','Observação'];
  const rows = data.map(r => {
    const mac = machines.find(m => m.id === Number(r.machineId));
    const meta = num(r.meta);
    const prod = num(r.producao);
    const pct  = mac?.hasMeta && meta > 0 ? Math.round(prod/meta*100)+'%' : '';
    return [
      dispD(r.date), r.turno, r.machineName||(mac?.name||''),
      mac?.hasMeta ? meta : '', prod, pct,
      r.savedBy||'', r.editUser||'', r.obs||''
    ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';');
  });
  const csv = bom + [...summary, header.map(h=>`"${h}"`).join(';'), ...rows].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8;'})),
    download: `producao_${dfIni}_a_${dfFim}.csv`
  });
  a.click(); URL.revokeObjectURL(a.href);
}

function captureCharts() {
  const images = [];
  if(typeof echarts === 'undefined') return images;
  const containers = document.querySelectorAll('[_echarts_instance_]');
  containers.forEach(dom => {
    const inst = echarts.getInstanceByDom(dom);
    if(inst){
      try{
        const url = inst.getDataURL({type:'png', pixelRatio:2, backgroundColor:'#fff'});
        images.push(url);
      }catch(e){ console.warn('Chart capture failed:', e); }
    }
  });
  return images;
}

function printReport(data, machines, dfIni, dfFim, extras) {
  const totProd = extras?.totProd ?? data.reduce((s,r)=>s+num(r.producao),0);
  const totMeta = extras?.totMeta ?? 0;
  const pctGeral = totMeta > 0 ? Math.round(totProd/totMeta*100) : null;
  const pctGeralCol = pctGeral===null?'#666':pctGeral>=100?'#27AE60':pctGeral>=80?'#E87722':'#C8102E';

  // Capturar gráficos ECharts como imagens
  const chartImages = captureCharts();
  const chartsHtml = chartImages.length > 0
    ? `<h3 style="color:#003057;margin:24px 0 12px">Gráficos</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:16px">${chartImages.map(src=>`<img src="${src}" style="width:100%;max-width:700px;border:1px solid #eee;border-radius:8px" />`).join('')}</div>`
    : '';

  const rows = data.map(r => {
    const mac = machines.find(m => m.id === Number(r.machineId));
    const meta = num(r.meta)||0;
    const prod = num(r.producao);
    const pct  = mac?.hasMeta && meta > 0 ? Math.round(prod/meta*100) : null;
    const col  = pct===null?'#666':pct>=100?'#27AE60':pct>=80?'#E87722':'#C8102E';
    return `<tr><td>${dispD(r.date)}</td><td>${r.turno}</td><td>${r.machineName||(mac?.name||'')}</td><td align="center">${mac?.hasMeta?meta.toLocaleString('pt-BR'):'—'}</td><td align="center" style="font-weight:700">${prod.toLocaleString('pt-BR')}</td><td align="center" style="color:${col};font-weight:700">${pct!==null?pct+'%':'—'}</td></tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório — Dashboard WEG</title>
<style>*{box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;font-size:12px;color:#222;margin:0;padding:20px}
h2{color:#003057;margin:0 0 4px}h3{page-break-before:auto}p{margin:0 0 12px;color:#555;font-size:12px}
table{width:100%;border-collapse:collapse}
th{background:#003057;color:#fff;padding:7px 10px;text-align:left;font-size:12px}
td{padding:6px 10px;border-bottom:1px solid #eee}
tr:nth-child(even){background:#f5f8fa}
tfoot td{font-weight:700;background:#E0EFF8;border-top:2px solid #003057}
.kpi-row{display:flex;gap:12px;margin:12px 0 16px;flex-wrap:wrap}
.kpi-card{background:#f5f8fa;border-radius:8px;padding:10px 16px;border-left:4px solid #0064A6;min-width:140px}
.kpi-label{font-size:10px;color:#5E6E78;font-weight:700;letter-spacing:.5px}
.kpi-value{font-size:20px;font-weight:800;margin-top:2px}
.btn{display:inline-block;margin-bottom:14px;padding:8px 20px;background:#0064A6;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px}
img{page-break-inside:avoid}
@media print{.btn{display:none}.kpi-row{display:flex!important}}</style></head>
<body>
<h2>Dashboard de Produção WEG</h2>
<p>Período: ${dispD(dfIni)} a ${dispD(dfFim)} &nbsp;·&nbsp; ${data.length} registros</p>
<div class="kpi-row">
  <div class="kpi-card"><div class="kpi-label">PRODUÇÃO TOTAL</div><div class="kpi-value" style="color:#0064A6">${totProd.toLocaleString('pt-BR')}</div></div>
  <div class="kpi-card" style="border-color:#004A80"><div class="kpi-label">META TOTAL</div><div class="kpi-value" style="color:#004A80">${totMeta>0?totMeta.toLocaleString('pt-BR'):'—'}</div></div>
  <div class="kpi-card" style="border-color:${pctGeralCol}"><div class="kpi-label">% ATINGIMENTO</div><div class="kpi-value" style="color:${pctGeralCol}">${pctGeral!==null?pctGeral+'%':'—'}</div></div>
  <div class="kpi-card" style="border-color:#0095A8"><div class="kpi-label">REGISTROS</div><div class="kpi-value" style="color:#0095A8">${data.length}</div></div>
</div>
<button class="btn" onclick="window.print()">Imprimir / Salvar PDF</button>
${chartsHtml}
<h3 style="color:#003057;margin:20px 0 10px">Dados Detalhados</h3>
<table><thead><tr><th>Data</th><th>Turno</th><th>Máquina</th><th>Meta</th><th>Produção</th><th>%</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="4" style="text-align:right;padding:7px 10px">TOTAL</td><td align="center">${totProd.toLocaleString('pt-BR')}</td><td align="center" style="color:${pctGeralCol};font-weight:700">${pctGeral!==null?pctGeral+'%':''}</td></tr></tfoot>
</table></body></html>`;
  const url = URL.createObjectURL(new Blob([html], {type:'text/html;charset=utf-8'}));
  const w = window.open(url, '_blank');
  if(!w){ alert('Permita popups para exportar o relatório PDF.'); }
  setTimeout(()=>URL.revokeObjectURL(url), 60000);
}

// ─── SESSION ──────────────────────────────────────────────────
const loadSession = ()=>{ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)||"null"); }catch{ return null; } };
const saveSession = u=>{ try{ localStorage.setItem(SESSION_KEY,JSON.stringify(u)); }catch{} };
const clearSession= ()=>{ try{ localStorage.removeItem(SESSION_KEY); }catch{} };

// ─── CACHE LOCAL (carregamento instantâneo) ──────────────────
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
  if(!j.ok && j.error && j.error.includes("Sessão")) {
    throw new Error("Erro de sessão. Tente recarregar a página.");
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
  return el("div",{style:{background:"#D0DEE8",borderRadius:4,height:10,overflow:"hidden"}},
    el("div",{style:{width:`${Math.min(pct??0,100)}%`,height:"100%",background:color,borderRadius:4,transition:"width .4s"}})
  );
}

function Alert({type,msg}){
  if(!msg) return null;
  const s={error:{bg:"#fef2f2",br:"#fca5a5",tx:C.red},success:{bg:"#f0fdf4",br:"#86efac",tx:"#16a34a"},info:{bg:"#EAF4FB",br:"#AAD0EA",tx:"#0064A6"}}[type]||{bg:"#EAF4FB",br:"#AAD0EA",tx:"#0064A6"};
  return el("div",{style:{background:s.bg,border:`1px solid ${s.br}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:s.tx,marginTop:10,fontWeight:500}},
    (type==="error"?"⚠ ":type==="success"?"✔ ":"ℹ ")+msg
  );
}

function Modal({children}){
  return el("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}},
    el("div",{style:{background:"#fff",borderRadius:6,padding:28,width:"100%",maxWidth:420,boxShadow:"0 8px 40px rgba(0,48,87,0.25)",maxHeight:"90vh",overflowY:"auto"}},
      ...children
    )
  );
}

// ─── FILTRO REUTILIZÁVEL ──────────────────────────────────────
function FilterBar({dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines,showTurno=true,extra=null}){
  return el("div",{style:{background:"#fff",borderRadius:12,padding:14,boxShadow:"0 2px 8px rgba(0,48,87,0.08)",marginBottom:14,display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}},
    el("div",null,
      el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"DE"),
      el("input",{type:"date",value:dfIni,onChange:e=>setDfIni(e.target.value),style:{...IS,width:"auto"}})
    ),
    el("div",null,
      el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"ATÉ"),
      el("input",{type:"date",value:dfFim,onChange:e=>setDfFim(e.target.value),style:{...IS,width:"auto"}})
    ),
    el("div",null,
      el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"MÁQUINA"),
      el("select",{value:dfMac,onChange:e=>setDfMac(e.target.value),style:{...SS,maxWidth:200,width:"auto"}},
        el("option",{value:"TODAS"},"TODAS"),
        ...machines.map(m=>el("option",{key:m.id,value:m.name},m.name))
      )
    ),
    showTurno&&el("div",null,
      el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"TURNO"),
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
  return el("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#003057 0%,#0064A6 100%)"}},
    el("div",{style:{background:"#fff",borderRadius:6,padding:"36px 32px",width:380,boxShadow:"0 12px 48px rgba(0,48,87,0.35)"}},
      el("div",{style:{textAlign:"center",marginBottom:28}},
        el("div",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",background:C.navy,borderRadius:3,padding:"10px 20px",marginBottom:12}},
          el(WEGLogoSVG,{height:38,color:"#fff"})
        ),
        el("div",{style:{fontSize:15,fontWeight:700,color:C.navy,marginTop:2,letterSpacing:0.3}},"Dashboard de Produção"),
        el("div",{style:{fontSize:13,color:C.gray,marginTop:4}},isLogin?"Faça login para continuar":"Crie sua conta de acesso")
      ),
      el("div",{style:{display:"flex",background:"#F0F2F5",borderRadius:4,padding:4,marginBottom:22}},
        ...[["login","Entrar"],["register","Criar Conta"]].map(([k,l])=>
          el("button",{key:k,onClick:()=>switchMode(k),style:{flex:1,padding:"8px",border:"none",borderRadius:3,cursor:"pointer",fontWeight:700,fontSize:14,background:mode===k?"#fff":"transparent",color:mode===k?C.navy:C.gray,boxShadow:mode===k?"0 1px 4px #0002":"none",transition:"all .2s"}},l)
        )
      ),
      el("form",{onSubmit:submit},
        el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#2D3E4E",marginBottom:5}},"NOME DE USUÁRIO"),
          el("input",{value:nome,onChange:e=>setNome(e.target.value),placeholder:"Seu nome",style:{...IS,width:"100%"},autoFocus:true})
        ),
        el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#2D3E4E",marginBottom:5}},"SENHA"),
          el("div",{style:{position:"relative"}},
            el("input",{type:showPw?"text":"password",value:senha,onChange:e=>setSenha(e.target.value),placeholder:"Mínimo 4 caracteres",style:{...IS,width:"100%",paddingRight:42}}),
            el("span",{onClick:()=>setShowPw(!showPw),style:{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:18}},showPw?"🙈":"👁")
          )
        ),
        !isLogin&&el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#2D3E4E",marginBottom:5}},"CONFIRMAR SENHA"),
          el("input",{type:showPw?"text":"password",value:senha2,onChange:e=>setSenha2(e.target.value),placeholder:"Repita a senha",style:{...IS,width:"100%"}})
        ),
        !isLogin&&el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#2D3E4E",marginBottom:5}},"CÓDIGO DE ACESSO"),
          el("input",{value:codigo,onChange:e=>setCodigo(e.target.value),placeholder:"Digite o código de acesso",style:{...IS,width:"100%"}}),
          el("div",{style:{fontSize:11,color:C.gray,marginTop:3}},"Solicite o código de acesso ao administrador.")
        ),
        el(Alert,{type:alert.type,msg:alert.msg}),
        el("button",{type:"submit",disabled:loading,style:{...BTN("#0064A6"),width:"100%",marginTop:18,padding:"11px",fontSize:15,opacity:loading?.7:1}},
          loading?"⏳ Aguarde...":(isLogin?"Entrar →":"Criar Conta")
        )
      ),
      isLogin&&el("div",{style:{marginTop:14,textAlign:"center",fontSize:12,color:C.gray}},"Esqueceu a senha? Fale com o ",el("b",null,"administrador"),"."),
    )
  );
}

// ─── MODALS ───────────────────────────────────────────────────
function ConflictModal({conflicts,onReplace,onAddWithObs,onClose}){
  const [obsMap,setObsMap]=useState(()=>{const m={};conflicts.forEach(c=>{m[c.key]=""});return m;});
  const [mode,setMode]=useState(null); // null, "replace", "addObs"
  const allObsFilled=conflicts.every(c=>obsMap[c.key]&&obsMap[c.key].trim().length>0);
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.navy,marginBottom:4}},"⚠️ Conflito de Apontamento"),
    el("div",{style:{fontSize:13,color:C.gray,marginBottom:14}},"Os seguintes apontamentos já existem no sistema:"),
    el("div",{style:{maxHeight:200,overflowY:"auto",marginBottom:16}},
      ...conflicts.map(c=>el("div",{key:c.key,style:{background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:8,padding:"10px 14px",marginBottom:8}},
        el("div",{style:{fontWeight:700,fontSize:13,color:C.navy}},c.machineName),
        el("div",{style:{fontSize:12,color:C.gray,marginTop:2}},`${dispD(c.date)} · ${c.turno}`),
        el("div",{style:{fontSize:12,marginTop:4,display:"flex",gap:16}},
          el("span",null,"Salvo: ",el("b",{style:{color:C.blue}},`${c.existingProd.toLocaleString("pt-BR")} pç`)),
          el("span",null,"Novo: ",el("b",{style:{color:C.yellow}},`${c.newProd.toLocaleString("pt-BR")} pç`))
        ),
        mode==="addObs"&&el("div",{style:{marginTop:8}},
          el("input",{type:"text",placeholder:"Justificativa do novo apontamento (obrigatório)...",value:obsMap[c.key]||"",onChange:e=>setObsMap(p=>({...p,[c.key]:e.target.value})),style:{...IS,width:"100%",fontSize:12,borderColor:obsMap[c.key]?.trim()?"#27AE60":"#E87722",borderWidth:2}})
        )
      ))
    ),
    !mode&&el("div",{style:{display:"flex",flexDirection:"column",gap:10}},
      el("div",{style:{fontSize:13,fontWeight:700,color:"#2D3E4E",marginBottom:4}},"O que deseja fazer?"),
      el("button",{onClick:()=>setMode("replace"),style:BTN("#E87722",{width:"100%",textAlign:"left",padding:"12px 16px"})},
        el("div",{style:{fontWeight:700}},"Substituir apontamentos existentes"),
        el("div",{style:{fontSize:11,fontWeight:400,marginTop:2,opacity:.85}},"Os valores antigos serão sobrescritos pelos novos")
      ),
      el("button",{onClick:()=>setMode("addObs"),style:BTN(C.blue,{width:"100%",textAlign:"left",padding:"12px 16px"})},
        el("div",{style:{fontWeight:700}},"Criar novo apontamento (manter o existente)"),
        el("div",{style:{fontSize:11,fontWeight:400,marginTop:2,opacity:.85}},"Ambos os registros serão mantidos — justificativa obrigatória")
      ),
      el("button",{onClick:onClose,style:{background:"#F0F2F5",color:"#5E6E78",border:"1px solid #C8D8E4",borderRadius:4,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:14,width:"100%"}},"Cancelar")
    ),
    mode==="replace"&&el("div",{style:{display:"flex",flexDirection:"column",gap:10}},
      el("div",{style:{fontSize:13,color:C.gray}},"Confirma a substituição de ",el("b",null,conflicts.length)," registro(s)?"),
      el("div",{style:{display:"flex",gap:8}},
        el("button",{onClick:()=>onReplace(),style:BTN("#E87722",{flex:1})},"Confirmar Substituição"),
        el("button",{onClick:()=>setMode(null),style:{background:"#F0F2F5",color:"#5E6E78",border:"1px solid #C8D8E4",borderRadius:4,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14,flex:1}},"Voltar")
      )
    ),
    mode==="addObs"&&el("div",{style:{display:"flex",flexDirection:"column",gap:10}},
      !allObsFilled&&el("div",{style:{fontSize:12,color:"#E87722",fontWeight:600}},"Preencha a justificativa de todos os registros acima."),
      el("div",{style:{display:"flex",gap:8}},
        el("button",{onClick:()=>onAddWithObs(obsMap),disabled:!allObsFilled,style:{...BTN(C.blue,{flex:1}),opacity:allObsFilled?1:.5}},"Confirmar Novo Apontamento"),
        el("button",{onClick:()=>setMode(null),style:{background:"#F0F2F5",color:"#5E6E78",border:"1px solid #C8D8E4",borderRadius:4,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14,flex:1}},"Voltar")
      )
    )
  );
}

function EditModal({rec,metas,machines,onSave,onClose,saving}){
  const mId=Number(rec.machineId);
  const mac=machines.find(m=>m.id===mId);
  const metaVal=num(rec.meta)>0?num(rec.meta):(mac?.hasMeta?(metas[mId]||mac.defaultMeta||0):0);
  const [val,setVal]=useState(String(rec.producao));
  const pct=mac?.hasMeta&&metaVal>0&&val!==""?Math.round(num(val)/metaVal*100):null;
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.navy,marginBottom:4}},"✏️ Editar Apontamento"),
    el("div",{style:{fontSize:13,color:C.gray,marginBottom:18}},`${mac?.name} · ${dispD(rec.date)} · ${rec.turno}`),
    el("div",{style:{marginBottom:14}},
      el("div",{style:{fontSize:12,fontWeight:700,color:"#2D3E4E",marginBottom:5}},"PRODUÇÃO (peças)"),
      el("input",{type:"number",min:"0",value:val,onChange:e=>setVal(e.target.value),autoFocus:true,style:{...IS,width:"100%",fontSize:22,fontWeight:800,textAlign:"center",padding:"10px"}})
    ),
    pct!==null&&el("div",{style:{textAlign:"center",fontSize:13,color:C.gray,marginBottom:8}},
      `Meta: ${metaVal.toLocaleString("pt-BR")} · `,el("b",{style:{color:pctCol(pct)}},`${pct}% da meta`)
    ),
    rec.savedBy&&el("div",{style:{fontSize:11,color:C.gray,textAlign:"center",marginBottom:14}},
      `Criado por ${rec.savedBy} em ${rec.savedAt}`,
      rec.editUser&&el("span",null,` | Editado por ${rec.editUser} em ${rec.editTime}`)
    ),
    el("div",{style:{display:"flex",gap:10}},
      el("button",{onClick:onClose,style:{...BTN(C.gray),flex:1}},"Cancelar"),
      el("button",{onClick:()=>onSave(num(val)),disabled:saving||val==="",style:{...BTN("#0064A6"),flex:2,opacity:saving||val===""?.6:1}},
        saving?"⏳ Salvando...":"💾 Salvar edição"
      )
    )
  );
}

function DeleteModal({rec,machines,onConfirm,onClose,deleting}){
  const mac=machines.find(m=>m.id===Number(rec.machineId));
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.red,marginBottom:10}},"🗑️ Excluir Apontamento"),
    el("div",{style:{fontSize:14,color:"#2D3E4E",marginBottom:20,lineHeight:1.7}},
      "Tem certeza que deseja excluir o apontamento de ",el("b",null,mac?.name)," em ",el("b",null,dispD(rec.date))," — ",el("b",null,rec.turno),"?",
      el("br"),el("span",{style:{color:C.red,fontSize:13}},"Esta ação não pode ser desfeita.")
    ),
    el("div",{style:{display:"flex",gap:10}},
      el("button",{onClick:onClose,style:{...BTN(C.gray),flex:1}},"Cancelar"),
      el("button",{onClick:onConfirm,disabled:deleting,style:{...BTN(C.red),flex:2,opacity:deleting?.6:1}},
        deleting?"⏳ Excluindo...":"🗑️ Confirmar Exclusão"
      )
    )
  );
}

function ObsModal({rec,machines,onSave,onClose,saving}){
  const mac=machines.find(m=>m.id===Number(rec.machineId));
  const [text,setText]=useState(rec.obs||"");
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.navy,marginBottom:4}},"💬 Observação"),
    el("div",{style:{fontSize:13,color:C.gray,marginBottom:14}},`${mac?.name} · ${dispD(rec.date)} · ${rec.turno}`),
    el("textarea",{value:text,onChange:e=>setText(e.target.value),placeholder:"Descreva observações sobre este apontamento...",autoFocus:true,
      style:{...IS,width:"100%",height:100,resize:"vertical",fontFamily:"inherit",fontSize:14}}),
    rec.obs&&el("div",{style:{fontSize:11,color:C.gray,marginTop:4}},"Observação atual: "+rec.obs),
    el("div",{style:{display:"flex",gap:10,marginTop:14}},
      el("button",{onClick:onClose,style:{...BTN(C.gray),flex:1}},"Cancelar"),
      el("button",{onClick:()=>onSave(text),disabled:saving,style:{...BTN(C.blue),flex:2,opacity:saving?.6:1}},
        saving?"⏳ Salvando...":"💬 Salvar Observação"
      )
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

  return el("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}},
    el("div",{style:{background:"#fff",borderRadius:6,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,48,87,0.25)"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"16px 20px",borderRadius:"6px 6px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",{style:{fontWeight:700,fontSize:15,letterSpacing:0.3}},"⚙️ Painel do Administrador"),
        el("button",{onClick:onClose,style:{background:"#ffffff22",border:"none",color:"#fff",borderRadius:4,padding:"4px 12px",cursor:"pointer",fontWeight:700}},"✕")
      ),
      el("div",{style:{padding:22}},
        el(Alert,{type:msg.type,msg:msg.text}),
        el("div",{style:{fontWeight:700,fontSize:15,color:C.navy,margin:"16px 0 10px"}},"👥 Usuários"),
        loading?el("div",{style:{color:C.gray,textAlign:"center",padding:20}},"⏳ Carregando..."):
        el("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:13}},
          el("thead",null,el("tr",{style:{background:"#F0F2F5"}},
            el("th",{style:{padding:"8px 10px",textAlign:"left"}},"Nome"),
            el("th",{style:{padding:"8px 10px",textAlign:"center"}},"Perfil"),
            el("th",{style:{padding:"8px 10px",textAlign:"center"}},"Status"),
            el("th",{style:{padding:"8px 10px",textAlign:"center"}},"Ação")
          )),
          el("tbody",null,...users.map((u,i)=>
            el("tr",{key:u.nome,style:rowStyle(i)},
              el("td",{style:{padding:"8px 10px",fontWeight:600,color:C.navy}},u.nome),
              el("td",{style:{padding:"8px 10px",textAlign:"center"}},
                el("span",{style:{background:u.role==="admin"?"#fef3c7":"#E0EFF8",color:u.role==="admin"?"#92400e":"#003057",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600}},u.role==="admin"?"Admin":"Operador")
              ),
              el("td",{style:{padding:"8px 10px",textAlign:"center"}},
                el("span",{style:{background:u.status==="ativo"?C.green+"22":C.red+"22",color:u.status==="ativo"?C.green:C.red,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},u.status==="ativo"?"✔ Ativo":"✘ Bloqueado")
              ),
              el("td",{style:{padding:"8px 10px",textAlign:"center"}},
                u.nome!=="Admin"&&el("button",{onClick:()=>toggle(u.nome),style:{background:u.status==="ativo"?C.red+"22":"#f0fdf4",color:u.status==="ativo"?C.red:C.green,border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},u.status==="ativo"?"Bloquear":"Ativar")
              )
            )
          ))
        ),
        el("div",{style:{marginTop:22,padding:16,background:"#F5F8FA",borderRadius:10,border:"1px solid #D0DEE8"}},
          el("div",{style:{fontWeight:700,color:C.navy,marginBottom:12}},"➕ Criar Novo Usuário"),
          el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#2D3E4E",marginBottom:4}},"NOME"),
              el("input",{value:cNome,onChange:e=>setCNome(e.target.value),placeholder:"Nome do usuário",style:{...IS,width:"100%"}})
            ),
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#2D3E4E",marginBottom:4}},"SENHA INICIAL"),
              el("input",{type:"password",value:cSenha,onChange:e=>setCSenha(e.target.value),placeholder:"Mín. 4 caracteres",style:{...IS,width:"100%"}})
            )
          ),
          el("button",{onClick:createUser,disabled:creating,style:{...BTN(C.green),opacity:creating?.7:1}},creating?"⏳ Criando...":"➕ Criar Usuário")
        ),
        el("div",{style:{marginTop:14,padding:16,background:"#F5F8FA",borderRadius:10,border:"1px solid #D0DEE8"}},
          el("div",{style:{fontWeight:700,color:C.navy,marginBottom:12}},"🔑 Redefinir Senha"),
          el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#2D3E4E",marginBottom:4}},"USUÁRIO"),
              el("select",{value:rTarget,onChange:e=>setRTarget(e.target.value),style:{...SS,width:"100%"}},
                el("option",{value:""},"Selecione..."),
                ...users.filter(u=>u.nome!==user.nome).map(u=>el("option",{key:u.nome},u.nome))
              )
            ),
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#2D3E4E",marginBottom:4}},"NOVA SENHA"),
              el("input",{value:newPw,onChange:e=>setNewPw(e.target.value),placeholder:"Mín. 4 caracteres",style:{...IS,width:"100%"}})
            )
          ),
          el("button",{onClick:resetPw,disabled:resetting,style:{...BTN("#0064A6"),opacity:resetting?.7:1}},resetting?"⏳ Redefinindo...":"🔑 Redefinir")
        )
      )
    )
  );
}

// ─── ECHARTS: CONFIGURAÇÕES DE GRÁFICOS ───────────────────────
function getChartOption(type, data) {
  const tooltipBase = {
    backgroundColor: '#fff', borderColor: '#D0DEE8', borderWidth: 1,
    borderRadius: 8, padding: [8, 12], textStyle: {color: '#2D3E4E', fontSize: 12}
  };

  if (type === 'bar') {
    return {
      animation: true, animationDuration: 750, animationEasing: 'cubicOut',
      tooltip: {
        ...tooltipBase, trigger: 'axis',
        axisPointer: {type: 'shadow', shadowStyle: {color: 'rgba(0,0,0,0.05)'}},
        formatter: params => {
          const d = data[params[0].dataIndex];
          return `<b>${d.name}</b><br/>Meta: ${d.meta.toLocaleString('pt-BR')}<br/>Produção: ${d.producao.toLocaleString('pt-BR')}`;
        }
      },
      legend: {data: ['Meta', 'Produção'], top: 0, right: 0},
      grid: {top: 40, right: 30, bottom: 70, left: 60},
      xAxis: {type: 'category', data: data.map(d=>d.name), axisLabel: {rotate: 15, fontSize: 11, interval: 0}},
      yAxis: {type: 'value', axisLabel: {formatter: v=>v.toLocaleString('pt-BR'), fontSize: 11}},
      series: [
        {name:'Meta',     type:'bar', data:data.map(d=>d.meta),    itemStyle:{color:C.gray,  borderRadius:[4,4,0,0]}},
        {name:'Produção', type:'bar', data:data.map(d=>d.producao), itemStyle:{color:C.blue, borderRadius:[4,4,0,0]}}
      ]
    };
  }

  if (type === 'pie') {
    return {
      animation: true, animationDuration: 750,
      tooltip: {
        ...tooltipBase, trigger: 'item',
        formatter: p=>`<b>${p.name}</b><br/>${p.value.toLocaleString('pt-BR')} peças<br/>${p.percent.toFixed(0)}%`
      },
      legend: {orient: 'horizontal', bottom: 0},
      color: [C.blue, C.green, C.yellow, C.purple, C.teal],
      series: [{
        type: 'pie', radius: ['35%', '65%'], center: ['50%', '45%'],
        data: data.map(d=>({name:d.name, value:d.value})),
        label: {formatter: '{b}: {d}%', fontSize: 12},
        emphasis: {itemStyle: {shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)'}}
      }]
    };
  }

  if (type === 'line') {
    return {
      animation: true, animationDuration: 750, animationEasing: 'cubicOut',
      tooltip: {
        ...tooltipBase, trigger: 'axis',
        axisPointer: {type: 'shadow', shadowStyle: {color: 'rgba(0,0,0,0.05)'}},
        formatter: params => {
          const lines = params.map(p=>`${p.seriesName}: ${Number(p.value).toLocaleString('pt-BR')}`).join('<br/>');
          return `<b>${params[0]?.axisValue}</b><br/>${lines}`;
        }
      },
      legend: {data: ['Produção Real', 'Meta'], top: 0, right: 0},
      grid: {top: 40, right: 30, bottom: 60, left: 65},
      xAxis: {type: 'category', data: data.map(d=>d.date), axisLabel: {rotate: 15, fontSize: 11}},
      yAxis: {type: 'value', axisLabel: {formatter: v=>v.toLocaleString('pt-BR'), fontSize: 11}},
      series: [
        {
          name: 'Produção Real', type: 'line', data: data.map(d=>d.producao),
          smooth: true, symbol: 'circle', symbolSize: 6,
          lineStyle: {color: C.blue, width: 3}, itemStyle: {color: C.blue},
          areaStyle: {color: {type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:C.blue+'44'},{offset:1,color:C.blue+'00'}]}}
        },
        {
          name: 'Meta', type: 'line', data: data.map(d=>Math.round(d.meta)),
          smooth: true, lineStyle: {color: C.purple, width: 2, type: 'dashed'},
          itemStyle: {color: C.purple}, symbol: 'none'
        }
      ]
    };
  }

  if (type === 'horizontalBar') {
    const colors = data.map(d=>d.pct>=100?C.green:d.pct>=80?C.yellow:C.red);
    return {
      animation: true, animationDuration: 750, animationEasing: 'cubicOut',
      tooltip: {
        ...tooltipBase, trigger: 'axis', axisPointer: {type: 'shadow'},
        formatter: params=>`<b>${params[0].name}</b><br/>% da Meta: ${params[0].value}%`
      },
      grid: {top: 10, right: 60, bottom: 10, left: 10, containLabel: true},
      xAxis: {type:'value', axisLabel:{formatter:'{value}%',fontSize:11}, max:v=>Math.max(v.max*1.1,110)},
      yAxis: {type:'category', data:data.map(d=>d.name), axisLabel:{fontSize:11,width:130,overflow:'truncate'}},
      series: [{
        type: 'bar',
        data: data.map((d,i)=>({value:d.pct, itemStyle:{color:colors[i],borderRadius:[0,4,4,0]}})),
        label: {show:true, position:'right', formatter:'{c}%', fontSize:11, color:'#2D3E4E'}
      }]
    };
  }
  return {};
}

// ─── ECHARTS: COMPONENTE REUTILIZÁVEL ─────────────────────────
function EChartsComponent({title, subtitle, data, type, height=350}){
  const chartRef  = useRef(null);
  const instanceRef = useRef(null);

  useEffect(()=>{
    if(!chartRef.current || typeof echarts==='undefined') return;
    instanceRef.current = echarts.init(chartRef.current);
    return()=>{ if(instanceRef.current){ instanceRef.current.dispose(); instanceRef.current=null; } };
  },[]);

  useEffect(()=>{
    if(!instanceRef.current||!data||data.length===0) return;
    instanceRef.current.setOption(getChartOption(type,data),true);
  },[data,type]);

  useEffect(()=>{
    const fn=()=>{ if(instanceRef.current) instanceRef.current.resize(); };
    window.addEventListener('resize',fn);
    return()=>window.removeEventListener('resize',fn);
  },[]);

  if(!data||data.length===0){
    return el("div",{style:{background:"#fff",borderRadius:12,padding:40,textAlign:"center",boxShadow:"0 2px 8px rgba(0,48,87,0.08)"}},
      el("div",{style:{fontSize:48,marginBottom:12}},"📊"),
      el("div",{style:{fontSize:16,color:C.gray,fontWeight:600}},"Nenhum dado disponível"),
      el("div",{style:{fontSize:13,color:"#8FA4B2",marginTop:4}},"Ajuste os filtros ou adicione apontamentos")
    );
  }
  return el("div",{style:{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 2px 8px rgba(0,48,87,0.08)"}},
    title&&el("div",{style:{marginBottom:12}},
      el("div",{style:{fontSize:16,fontWeight:700,color:C.navy}},title),
      subtitle&&el("div",{style:{fontSize:12,color:C.gray,marginTop:2}},subtitle)
    ),
    el("div",{ref:chartRef,style:{width:"100%",height}})
  );
}

// ─── TAB APONTAMENTO ──────────────────────────────────────────
function TabEntrada({machines,metas,inputs,obsInputs,recordsLookup,entryDate,setEntryDate,entryTurno,setEntryTurno,syncSt,pendingCount,handleSave,setInputs,setObsInputs}){
  function getVal(mId){ return inputs[mId]!==undefined?inputs[mId]:""; }
  function getObsVal(mId){ return obsInputs[mId]!==undefined?obsInputs[mId]:""; }
  function setVal(mId,val){ setInputs(p=>({...p,[mId]:val})); }
  function setObsVal(mId,val){ setObsInputs(p=>({...p,[mId]:val})); }
  function hasSavedRecord(mId){ return !!recordsLookup[cellKey(mId,entryDate,entryTurno)]; }
  function getSavedProd(mId){ const s=recordsLookup[cellKey(mId,entryDate,entryTurno)]; return s?num(s.producao):null; }

  return el("div",null,
    el("div",{style:{background:"#fff",borderRadius:12,padding:14,boxShadow:"0 2px 8px rgba(0,48,87,0.08)",marginBottom:14,display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-end"}},
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"DATA"),el("input",{type:"date",value:entryDate,onChange:e=>setEntryDate(e.target.value),style:{...IS,width:"auto"}})),
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"TURNO"),
        el("select",{value:entryTurno,onChange:e=>setEntryTurno(e.target.value),style:{...SS,width:"auto"}},
          ...TURNOS.map(t=>el("option",{key:t,value:t},t))
        )
      ),
      el("div",{style:{display:"flex",flexDirection:"column",gap:4}},
        el("button",{onClick:handleSave,disabled:syncSt==="syncing"||pendingCount===0,style:BTN(syncSt==="ok"?C.green:syncSt==="error"?C.red:"#0064A6",{fontSize:15,padding:"9px 28px",opacity:pendingCount===0?.5:1})},
          syncSt==="syncing"?"⏳ Salvando...":syncSt==="ok"?"✔ Salvo!":syncSt==="error"?"✘ Erro!":`💾 Salvar${pendingCount>0?` (${pendingCount})`:""}`)
        ,pendingCount>0&&el("div",{style:{fontSize:11,color:C.yellow,fontWeight:600,textAlign:"center"}},`⚠ ${pendingCount} não salvo(s)`)
      )
    ),
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,48,87,0.08)",overflow:"hidden"}},
      el("div",{style:{overflowX:"auto"}},
      el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:660}},
        el("thead",null,el("tr",{style:{background:C.navy,color:"#fff"}},
          el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:13}},"MÁQUINA"),
          el("th",{style:{padding:"11px 10px",textAlign:"center",fontSize:13,width:90}},"META"),
          el("th",{style:{padding:"11px 10px",textAlign:"center",fontSize:13,width:130}},"PRODUÇÃO"),
          el("th",{style:{padding:"11px 10px",textAlign:"center",fontSize:13,width:80}},"% META"),
          el("th",{style:{padding:"11px 10px",textAlign:"left",  fontSize:13}},"OBSERVAÇÃO"),
          el("th",{style:{padding:"11px 10px",textAlign:"center",fontSize:13,width:75}},"STATUS")
        )),
        el("tbody",null,...machines.map((m,i)=>{
          const val=getVal(m.id);
          const obsVal=getObsVal(m.id);
          const isLocal=inputs[m.id]!==undefined&&inputs[m.id]!=="";
          const isObsLocal=obsInputs[m.id]!==undefined&&obsInputs[m.id]!=="";
          const saved=hasSavedRecord(m.id);
          const savedProd=getSavedProd(m.id);
          const metaVal=metas[m.id]||0;
          const pct=m.hasMeta&&metaVal>0&&val!==""?Math.round(num(val)/metaVal*100):null;
          const col=pctCol(pct);
          return el("tr",{key:m.id,style:rowStyle(i)},
            el("td",{style:{padding:"8px 14px",fontSize:13,fontWeight:600,color:C.navy}},
              m.name,
              !m.hasMeta&&el("span",{style:{marginLeft:6,fontSize:11,color:C.gray,fontWeight:400}},"sem meta"),
              saved&&el("div",{style:{fontSize:10,color:C.blue,fontWeight:600,marginTop:2}},`já apontado: ${savedProd!==null?savedProd.toLocaleString("pt-BR"):""} pç`)
            ),
            el("td",{style:{padding:"8px 10px",textAlign:"center",fontSize:13,color:"#2D3E4E"}},m.hasMeta?metaVal.toLocaleString("pt-BR"):el("span",{style:{color:"#8FA4B2"}},"—")),
            el("td",{style:{padding:"6px 10px",textAlign:"center"}},
              el("input",{type:"number",min:"0",placeholder:"0",value:val,onChange:e=>setVal(m.id,e.target.value),style:{...IS,width:100,textAlign:"center",fontSize:15,fontWeight:700,borderColor:isLocal?C.yellow:"#B8CDD8",borderWidth:isLocal?2:1}})
            ),
            el("td",{style:{padding:"8px 10px",textAlign:"center"}},
              pct!==null?el("span",{style:{background:col+"22",color:col,borderRadius:20,padding:"3px 8px",fontSize:12,fontWeight:700}},`${pct}%`):
              val!==""?el("span",{style:{background:"#E0EFF8",color:"#0064A6",borderRadius:20,padding:"3px 8px",fontSize:12,fontWeight:700}},`${num(val).toLocaleString("pt-BR")} pç`):
              el("span",{style:{color:"#B8CDD8"}},"—")
            ),
            el("td",{style:{padding:"6px 10px"}},
              el("input",{type:"text",placeholder:"Observação...",value:obsVal,onChange:e=>setObsVal(m.id,e.target.value),style:{...IS,width:"100%",minWidth:140,fontSize:12,borderColor:isObsLocal?C.blue:"#B8CDD8",borderWidth:isObsLocal?2:1}})
            ),
            el("td",{style:{padding:"8px 10px",textAlign:"center",fontSize:12}},
              isLocal||isObsLocal?el("span",{style:{color:C.yellow,fontWeight:700}},"● pend."):
              saved?el("span",{style:{color:C.blue,fontWeight:600}},"✔ salvo"):
              el("span",{style:{color:"#B8CDD8"}},"—")
            )
          );
        }))
      )
      )
    )
  );
}

// ─── TAB DASHBOARD ────────────────────────────────────────────
function TabDashboard({machines,metas,dashData,machAgg,totProd,totMeta,chartProdVsMeta,chartTurnoData,chartTendencia,chartPerformers,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,dView,setDView,isMobile}){
  const kpis = el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:16}},
    ...[
      {label:"PRODUÇÃO TOTAL",  value:totProd.toLocaleString("pt-BR"),                              sub:"peças",       color:C.blue},
      {label:"META TOTAL",      value:totMeta.toLocaleString("pt-BR"),                              sub:"peças",       color:C.purple},
      {label:"% ATINGIMENTO",   value:totMeta>0?`${Math.round(totProd/totMeta*100)}%`:"—",          sub:"geral",       color:totMeta>0?pctCol(Math.round(totProd/totMeta*100)):C.gray},
      {label:"REGISTROS",       value:dashData.length,                                              sub:"lançamentos", color:C.teal},
      {label:"MÁQUINAS ATIVAS", value:Object.keys(machAgg).length,                                  sub:`de ${machines.length}`, color:C.yellow},
    ].map(k=>el("div",{key:k.label,style:{background:"#fff",borderRadius:12,padding:"12px 14px",boxShadow:"0 2px 8px rgba(0,48,87,0.08)",borderLeft:`4px solid ${k.color}`}},
      el("div",{style:{fontSize:10,color:C.gray,fontWeight:700,letterSpacing:.5}},k.label),
      el("div",{style:{fontSize:22,fontWeight:800,color:k.color,marginTop:4}},k.value),
      el("div",{style:{fontSize:11,color:"#8FA4B2"}},k.sub)
    ))
  );

  const viewButtons = el("div",{style:{display:"flex",gap:6}},
    ...[["resumo","📋 Resumo"],["detalhado","🔍 Detalhado"],["comparativo","📊 Turnos"],["graficos","📈 Gráficos"]].map(([k,l])=>
      el("button",{key:k,onClick:()=>setDView(k),style:{padding:"6px 14px",border:`1px solid ${dView===k?"#0064A6":"#C8D8E4"}`,borderRadius:4,cursor:"pointer",fontSize:13,fontWeight:600,background:dView===k?"#0064A6":"#fff",color:dView===k?"#fff":"#5E6E78"}},l)
    )
  );

  const exportBar = el("div",{style:{background:"#fff",borderRadius:8,padding:"8px 14px",boxShadow:"0 2px 8px rgba(0,48,87,0.08)",marginBottom:14,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}},
    el("span",{style:{fontSize:12,color:C.gray,fontWeight:600,marginRight:2}},"📥 EXPORTAR:"),
    el("button",{onClick:()=>exportCSV(dashData,machines,dfIni,dfFim,{totProd,totMeta}),disabled:dashData.length===0,style:{...BTN(C.teal,{fontSize:12,padding:"5px 14px"}),opacity:dashData.length===0?.5:1}},"CSV (Excel)"),
    el("button",{onClick:()=>printReport(dashData,machines,dfIni,dfFim,{totProd,totMeta}),disabled:dashData.length===0,style:{...BTN(C.purple,{fontSize:12,padding:"5px 14px"}),opacity:dashData.length===0?.5:1}},"🖨️ PDF")
  );

  return el("div",null,
    el(FilterBar,{dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines,extra:viewButtons}),
    kpis,
    exportBar,
    dView==="resumo"&&el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,48,87,0.08)",overflow:"hidden"}},
      el("div",{style:{overflowX:"auto"}},
      el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:520}},
        el("thead",null,el("tr",{style:{background:C.navy,color:"#fff"}},
          el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:13}},"MÁQUINA"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13}},"DIAS"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13}},"PRODUÇÃO"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13}},"META"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13}},"%"),
          el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:13,minWidth:100}},"PROGRESSO")
        )),
        el("tbody",null,...machines.filter(m=>dfMac==="TODAS"||m.name===dfMac).map((m,i)=>{
          const a=machAgg[m.id];
          return el("tr",{key:m.id,style:rowStyle(i)},
            el("td",{style:{padding:"9px 14px",fontSize:13,fontWeight:600,color:C.navy}},m.name),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:13}},a?.diasCount??0),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:15,fontWeight:700,color:C.navy}},(a?.totalProd??0).toLocaleString("pt-BR")),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:13,color:C.gray}},m.hasMeta?(a?.totalMeta??0).toLocaleString("pt-BR"):"—"),
            el("td",{style:{padding:"9px 14px",textAlign:"center"}},a?.pct!=null?el("span",{style:{background:pctCol(a.pct)+"22",color:pctCol(a.pct),borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},`${a.pct}%`):el("span",{style:{color:"#B8CDD8"}},"—")),
            el("td",{style:{padding:"9px 14px"}},a?.pct!=null?el(MiniBar,{pct:a.pct,color:pctCol(a.pct)}):el("span",{style:{color:"#B8CDD8",fontSize:11}},"sem meta"))
          );
        }))
      )
      )
    ),
    dView==="detalhado"&&el("div",null,
      ...Object.values(machAgg).sort((a,b)=>a.name.localeCompare(b.name)).map(a=>
        el("div",{key:a.name,style:{background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,48,87,0.08)",marginBottom:12,overflow:"hidden"}},
          el("div",{style:{background:C.navy,color:"#fff",padding:"10px 16px",display:"flex",justifyContent:"space-between"}},
            el("span",{style:{fontWeight:700}},a.name),
            el("span",{style:{fontSize:13,color:"#A8C6D8"}},`Total: ${a.totalProd.toLocaleString("pt-BR")} pç${a.pct!=null?` — ${a.pct}% meta`:""}`)
          ),
          el("div",{style:{overflowX:"auto"}},
            el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:400}},
              el("thead",null,el("tr",{style:{background:"#E0EFF8"}},
                el("th",{style:{padding:"7px 14px",textAlign:"left",fontSize:12,color:"#003057"}},"DATA"),
                ...TURNOS.map(t=>el("th",{key:t,style:{padding:"7px 14px",textAlign:"center",fontSize:12,color:"#003057"}},t)),
                el("th",{style:{padding:"7px 14px",textAlign:"center",fontSize:12,color:"#003057"}},"TOTAL DIA")
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
      Object.keys(machAgg).length===0&&el("div",{style:{background:"#fff",borderRadius:12,padding:40,textAlign:"center",color:"#8FA4B2"}},"Nenhum dado encontrado.")
    ),
    dView==="comparativo"&&el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,48,87,0.08)",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"11px 16px",fontWeight:700}},"Comparativo por Turno"),
      el("div",{style:{overflowX:"auto"}},
      el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:440}},
        el("thead",null,el("tr",{style:{background:"#E0EFF8"}},
          el("th",{style:{padding:"10px 14px",textAlign:"left",  fontSize:13,color:"#003057"}},"MÁQUINA"),
          ...TURNOS.map(t=>el("th",{key:t,style:{padding:"10px 14px",textAlign:"center",fontSize:13,color:"#003057"}},t)),
          el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:13,color:"#003057"}},"TOTAL"),
          el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:13,color:"#003057"}},"MELHOR")
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
        ? el("div",{style:{background:"#fff",borderRadius:12,padding:40,textAlign:"center",boxShadow:"0 2px 8px rgba(0,48,87,0.08)"}},
            el("div",{style:{fontSize:48,marginBottom:12}},"📊"),
            el("div",{style:{fontSize:16,color:C.gray,fontWeight:600}},"Nenhum dado disponível para gráficos"),
            el("div",{style:{fontSize:13,color:"#8FA4B2",marginTop:4}},"Ajuste os filtros ou adicione apontamentos")
          )
        : el("div",{style:{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit, minmax(550px, 1fr))",gap:16}},
            el(EChartsComponent,{title:"📊 Produção vs Meta por Máquina",subtitle:"Comparativo entre produção real e meta estabelecida",data:chartProdVsMeta,type:"bar",height:350}),
            el(EChartsComponent,{title:"🎯 Distribuição de Produção por Turno",subtitle:"Percentual de produção em cada turno",data:chartTurnoData,type:"pie",height:350}),
            el(EChartsComponent,{title:"📈 Tendência de Produção ao Longo do Tempo",subtitle:"Evolução diária da produção no período",data:chartTendencia,type:"line",height:350}),
            el(EChartsComponent,{title:"🏆 Ranking de Performance",subtitle:"Máquinas ordenadas por % da meta",data:chartPerformers,type:"horizontalBar",height:350})
          )
    )
  );
}

// ─── TAB HISTÓRICO ────────────────────────────────────────────
function TabHistorico({machines,metas,sortedHistorico,dashData,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,setEditRec,setDeleteRec,setObsRec}){
  return el("div",null,
    el(FilterBar,{dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines}),
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,48,87,0.08)",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"12px 16px",fontWeight:700,display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",null,"📋 Apontamentos Salvos"),
        el("span",{style:{fontSize:12,color:"#A8C6D8"}},`${dashData.length} registros`)
      ),
      el("div",{style:{overflowX:"auto"}},
        el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:760}},
          el("thead",null,el("tr",{style:{background:"#E0EFF8"}},
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,color:"#003057"}},"DATA"),
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,color:"#003057"}},"TURNO"),
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,color:"#003057"}},"MÁQUINA"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#003057"}},"META"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#003057"}},"PRODUÇÃO"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#003057"}},"%"),
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,color:"#003057"}},"APONTADO POR"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#003057"}},"AÇÕES")
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
                el("td",{style:{padding:"9px 12px",textAlign:"center",fontSize:14,fontWeight:700}},prod.toLocaleString("pt-BR")),
                el("td",{style:{padding:"9px 12px",textAlign:"center"}},pct!==null?el("span",{style:{background:pctCol(pct)+"22",color:pctCol(pct),borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},`${pct}%`):el("span",{style:{color:"#B8CDD8"}},"—")),
                el("td",{style:{padding:"9px 12px",fontSize:12,color:C.gray}},
                  el("div",{style:{fontWeight:600,color:"#2D3E4E"}},savedByName||"—"),
                  r.editUser&&el("div",{style:{fontSize:11,color:C.yellow,marginTop:2}},`✏ ${r.editUser}${r.editTime?" · "+dispDH(r.editTime):""}`),
                  r.obs&&el("div",{style:{fontSize:11,color:"#005A96",marginTop:3,background:"#E0EFF8",borderRadius:4,padding:"2px 6px",display:"inline-block"}},`💬 ${r.obs}`)
                ),
                el("td",{style:{padding:"9px 12px",textAlign:"center"}},
                  el("div",{style:{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}},
                    el("button",{onClick:()=>setEditRec({...r,machineId:mId,producao:prod,meta:metaVal,savedBy:savedByName}),style:{background:"#E0EFF8",color:"#0064A6",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,fontWeight:600}},"✏"),
                    el("button",{onClick:()=>setObsRec({...r,machineId:mId,producao:prod,meta:metaVal,savedBy:savedByName}),title:"Observação",style:{background:r.obs?"#E0EFF8":"#f0fdf4",color:r.obs?"#005A96":"#16a34a",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,fontWeight:600}},"💬"),
                    el("button",{onClick:()=>setDeleteRec({...r,machineId:mId}),style:{background:C.red+"22",color:C.red,border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,fontWeight:600}},"🗑")
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
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,48,87,0.08)",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}},
        el("span",{style:{fontWeight:700,fontSize:15}},"🎯 Metas por Máquina"+(metasLoading?" ⏳":"")),
        el("div",{style:{display:"flex",gap:8,alignItems:"center"}},
          metaEdit&&el("button",{onClick:()=>setMetaEdit(false),disabled:metasSaving,style:{background:"#ffffff22",border:"1px solid #ffffff44",color:"#fff",borderRadius:4,padding:"5px 14px",cursor:"pointer",fontSize:13,fontWeight:600}},"✕ Cancelar"),
          el("button",{
            onClick:metaEdit?saveMetasToServer:()=>setMetaEdit(true),
            disabled:metasLoading||metasSaving,
            style:{background:metaEdit?C.green+"cc":"#ffffff22",border:`1px solid ${metaEdit?C.green:"#ffffff44"}`,color:"#fff",borderRadius:4,padding:"5px 14px",cursor:(metasLoading||metasSaving)?"not-allowed":"pointer",fontSize:13,fontWeight:600}
          },metasSaving?"⏳ Salvando...":metaEdit?"💾 Salvar Metas":"✏ Editar Metas")
        )
      ),
      metasLoading
        ? el("div",{style:{padding:40,textAlign:"center",color:C.gray,fontSize:14}},"⏳ Carregando metas do servidor...")
        : el("div",{style:{overflowX:"auto"}},
            el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:580}},
              el("thead",null,el("tr",{style:{background:"#E0EFF8"}},
                el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:13,color:"#003057"}},"MÁQUINA"),
                el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,color:"#003057"}},"META / TURNO"),
                el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,color:"#003057"}},"META / DIA"),
                el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,color:"#003057"}},"META / MÊS (22 dias)"),
                el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,color:"#003057"}},"VIGENTE DESDE")
              )),
              el("tbody",null,...machines.map((m,i)=>{
                const info = metasInfo?.[m.id];
                const vigencia = info?.vigenciaInicio ? dispD(info.vigenciaInicio) : (info?.updatedAt ? dispD(info.updatedAt) : "—");
                const updatedBy = info?.updatedBy || "";
                return el("tr",{key:m.id,style:rowStyle(i)},
                  el("td",{style:{padding:"9px 14px",fontSize:13,fontWeight:600,color:C.navy}},
                    m.name,!m.hasMeta&&el("span",{style:{marginLeft:6,fontSize:11,color:C.gray,fontWeight:400}},"sem meta")
                  ),
                  el("td",{style:{padding:"7px 14px",textAlign:"center"}},
                    metaEdit&&m.hasMeta
                      ?el("input",{type:"number",min:"0",value:metas[m.id]??0,onChange:e=>updateMeta(m.id,e.target.value),style:{...IS,width:100,textAlign:"center",fontWeight:700,fontSize:15}})
                      :el("span",{style:{fontSize:15,fontWeight:700,color:m.hasMeta?C.navy:"#8FA4B2"}},m.hasMeta?(metas[m.id]||0).toLocaleString("pt-BR"):"—")
                  ),
                  el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:14,color:"#2D3E4E"}},m.hasMeta?((metas[m.id]||0)*3).toLocaleString("pt-BR"):"—"),
                  el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:14,color:"#2D3E4E"}},m.hasMeta?((metas[m.id]||0)*3*22).toLocaleString("pt-BR"):"—"),
                  el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:12,color:C.gray}},
                    m.hasMeta
                      ? el("div",null,
                          el("div",{style:{fontWeight:600,color:"#2D3E4E"}},vigencia),
                          updatedBy&&el("div",{style:{fontSize:11,color:C.gray,marginTop:2}},`por ${updatedBy}`)
                        )
                      : el("span",{style:{color:"#B8CDD8"}},"—")
                  )
                );
              }))
            )
          ),
      el("div",{style:{padding:"12px 16px",background:"#F5F8FA",borderTop:"1px solid #D0DEE8",fontSize:12,color:C.gray}},
        "🌐 Metas são ",el("b",null,"globais")," — todos os usuários verão as mesmas metas simultaneamente. Clique em ",el("b",null,"Editar Metas")," para alterar e em ",el("b",null,"Salvar Metas")," para aplicar a todos."
      )
    )
  );
}

// ─── TAB FEEDBACKS ────────────────────────────────────────────
function TabFeedbacks({machines,metas,feedbacksData,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,setObsRec,setDeleteRec}){
  const counter = el("div",{style:{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}},
    el("div",{style:{background:C.blue+"11",border:`1px solid ${C.blue}33`,borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,color:C.blue}},
      `${feedbacksData.length} observaç${feedbacksData.length!==1?"ões":"ão"}`
    )
  );

  return el("div",null,
    el(FilterBar,{dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,machines,showTurno:false,extra:counter}),
    feedbacksData.length===0
      ? el("div",{style:{background:"#fff",borderRadius:12,padding:60,textAlign:"center",boxShadow:"0 2px 8px rgba(0,48,87,0.08)"}},
          el("div",{style:{fontSize:52,marginBottom:14}},"💬"),
          el("div",{style:{fontSize:17,fontWeight:700,color:C.navy,marginBottom:6}},"Nenhuma observação no período"),
          el("div",{style:{fontSize:13,color:C.gray}},"Adicione observações nos apontamentos pelo ",el("b",null,"Histórico")," (botão 💬 em cada linha)")
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
            return el("div",{key:r.id||r.date+"_"+r.turno+"_"+r.machineId,style:{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 2px 8px rgba(0,48,87,0.08)",borderLeft:`4px solid ${C.blue}`,display:"flex",flexDirection:"column",gap:10}},
              el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}},
                el("div",null,
                  el("div",{style:{fontWeight:700,fontSize:14,color:C.navy}},r.machineName||(mac?.name||"—")),
                  el("div",{style:{fontSize:12,color:C.gray,marginTop:2}},`📅 Apontamento: ${dispD(r.date)} · ${r.turno}`)
                ),
                pct!==null&&el("span",{style:{background:pctCol(pct)+"22",color:pctCol(pct),borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}},`${pct}%`)
              ),
              el("div",{style:{background:"#EAF4FB",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#003057",lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}},r.obs),
              el("div",{style:{borderTop:"1px solid #F0F2F5",paddingTop:8,display:"flex",flexDirection:"column",gap:6}},
                el("div",{style:{fontSize:11,color:C.gray}},
                  el("span",null,`👤 Registrado por ${regBy} em ${regDate}`)),
                el("div",{style:{display:"flex",gap:6,justifyContent:"flex-end"}},
                  el("button",{onClick:()=>setObsRec({...r,machineId:Number(r.machineId),producao:prod,meta:metaVal,savedBy:savedByName}),style:{background:"#E0EFF8",color:"#005A96",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"✏ Editar"),
                  el("button",{onClick:()=>setDeleteRec({...r,machineId:Number(r.machineId)}),style:{background:C.red+"22",color:C.red,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"🗑 Excluir")
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
  const [metas,setMetasState]        = useState(()=>loadCachedMetas()||loadMetasDefaults(MACHINES_DEFAULT));
  const [metasLoading,setMetasLoading] = useState(false);
  const [metasSaving,setMetasSaving]   = useState(false);
  const [records,setRecords]         = useState(()=>loadCachedRecords());
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
  const [conflictInfo,setConflictInfo] = useState(null);
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
      saveCachedRecords(data);
      setLastSync(new Date());
    }catch(e){
      console.error("Erro ao carregar dados:", e);
      if(!silent) setSyncSt("error");
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
        saveCachedMetas(m);
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
      pollRef.current=setInterval(()=>{ loadAll(true); loadMetasFromServer(true); },60000);
    }
    return()=>clearInterval(pollRef.current);
  },[user]); // eslint-disable-line

  function buildToSend(overrideObs){
    const currentInputs   = {...inputs};
    const currentObsInputs= {...obsInputs};
    const currentMetas    = {...metas};
    const timestamp = nowBR();
    const date = entryDate;
    const turno = entryTurno;
    const toSend=[];
    // Iterar por mId — inputs keyed por machine ID
    const pendingMIds=new Set([
      ...Object.keys(currentInputs).filter(k=>currentInputs[k]!==undefined&&currentInputs[k]!==""),
      ...Object.keys(currentObsInputs).filter(k=>currentObsInputs[k]!==undefined&&currentObsInputs[k]!=="")
    ]);
    pendingMIds.forEach(mIdStr=>{
      const mId=Number(mIdStr);
      const m=machines.find(mc=>mc.id===mId); if(!m) return;
      const val=currentInputs[mIdStr];
      if(val===undefined||val==="") return;
      const producao=num(val);
      const metaVal=m.hasMeta?(currentMetas[m.id]||m.defaultMeta||0):0;
      let obs=currentObsInputs[mIdStr];
      if(overrideObs&&overrideObs[mIdStr]) obs=(obs?obs+" | ":"")+overrideObs[mIdStr];
      toSend.push({
        date, turno, machineId:m.id, machineName:m.name,
        meta:metaVal, producao, savedBy:user.nome, savedAt:timestamp,
        editUser:"", editTime:"",
        obs:(obs!==undefined&&obs!=="")?obs:undefined,
        _key:mIdStr
      });
    });
    return toSend;
  }

  async function doSave(toSend, action){
    const apiAction = action || "upsert";
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
        setInputs(prev=>{ const next={...prev}; saved.forEach(r=>delete next[r.machineId]); return next; });
        setObsInputs(prev=>{ const next={...prev}; saved.forEach(r=>delete next[r.machineId]); return next; });
        if(saved.length<toSend.length) loadAll(true);
      }
    }
  }

  async function handleSave(){
    const toSend=buildToSend();
    if(!toSend.length){ setSyncSt(null); return; }

    // Detectar conflitos com registros já salvos
    const rl=recordsLookup;
    const conflicts=[];
    toSend.forEach(r=>{
      const k=cellKey(r.machineId,r.date,r.turno);
      const existing=rl[k];
      if(existing){
        conflicts.push({key:r._key,date:r.date,turno:r.turno,machineId:r.machineId,machineName:r.machineName,existingProd:num(existing.producao),newProd:r.producao});
      }
    });

    if(conflicts.length>0){
      setConflictInfo({conflicts,toSend});
      return;
    }

    await doSave(toSend);
  }

  function handleConflictReplace(){
    const toSend=conflictInfo.toSend;
    setConflictInfo(null);
    doSave(toSend);
  }

  function handleConflictAddObs(obsMap){
    const toSend=buildToSend(obsMap);
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
    saveCachedRecords([]);
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
    machines.filter(m=>dfMac==="TODAS"||m.name===dfMac).filter(m=>m.hasMeta)
      .map(m=>{ const a=machAgg[m.id]||{}; return {name:m.name.length>15?m.name.substring(0,13)+"...":m.name,meta:a.totalMeta||0,producao:a.totalProd||0}; })
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
    machines.filter(m=>dfMac==="TODAS"||m.name===dfMac).filter(m=>m.hasMeta)
      .map(m=>{ const a=machAgg[m.id]||{}; return {name:m.name.length>22?m.name.substring(0,20)+"...":m.name,pct:a.pct||0,producao:a.totalProd||0}; })
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

  // O(1) lookup para TabEntrada
  const recordsLookup=useMemo(()=>{
    const m={};
    records.forEach(r=>{ const nd=normDate(r.date); if(nd) m[`${r.machineId}_${nd}_${r.turno}`]=r; });
    return m;
  },[records]);

  const sortedHistorico=useMemo(()=>
    [...dashData].sort((a,b)=>b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno))
  ,[dashData]);

  const pendingCount=useMemo(()=>{
    const mIds=new Set([
      ...Object.keys(inputs).filter(k=>inputs[k]!==undefined&&inputs[k]!==""),
      ...Object.keys(obsInputs).filter(k=>obsInputs[k]!==undefined&&obsInputs[k]!=="")
    ]);
    return mIds.size;
  },[inputs,obsInputs]);

  if(!user) return el(AuthScreen,{onLogin:u=>{ saveSession(u); setUser(u); }});

  // ── header ──
  const header=el("div",{style:{background:"#003057",padding:isMobile?"8px 12px":"0",display:"flex",alignItems:"stretch",justifyContent:"space-between",flexWrap:"wrap",gap:0,borderBottom:"3px solid #0064A6"}},
    el("div",{style:{display:"flex",alignItems:"center",gap:0}},
      el("div",{style:{background:"#0064A6",padding:isMobile?"10px 14px":"14px 24px",display:"flex",alignItems:"center",justifyContent:"center",marginRight:16}},
        el(WEGLogoSVG,{height:isMobile?22:28,color:"#fff"})
      ),
      el("div",{style:{padding:isMobile?"8px 0":"14px 0"}},
        el("div",{style:{color:"#fff",fontSize:isMobile?13:16,fontWeight:600,letterSpacing:0.2}},(isMobile?"Dashboard":"Dashboard de Produção")),
        el("div",{style:{color:"#A8C6D8",fontSize:11,marginTop:2}},`${user.nome}`+(isMobile?"":" · "+(lastSync?`Sync: ${lastSync.toLocaleTimeString("pt-BR")}`:"Conectando...")),loading?" ⏳":"")
      )
    ),
    el("div",{style:{display:"flex",gap:6,alignItems:"center"}},
      syncSt==="syncing"&&el("span",{style:{color:"#fde68a",fontSize:12}},"⏳"),
      syncSt==="ok"    &&el("span",{style:{color:"#86efac",fontSize:12}},"✔"),
      syncSt==="error" &&el("span",{style:{color:"#fca5a5",fontSize:12}},"✘"),
      el("button",{onClick:()=>loadAll(),title:"Recarregar",style:{background:"#3498db",border:"1px solid #FFFFFF33",color:"#A8C6D8",borderRadius:4,padding:"5px 10px",cursor:"pointer",fontSize:12,transition:"background .15s"}},"🔄"),
      user.role==="admin"&&el("button",{onClick:()=>setShowAdmin(true),style:{background:"#E8772222",border:"1px solid #E8772244",color:"#F5C98A",borderRadius:4,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},isMobile?"⚙":"⚙ Admin"),
      el("button",{onClick:handleLogout,style:{background:"#e74c3c",border:"1px solid #C8102E55",color:"#ffffff",borderRadius:4,padding:"5px 10px",cursor:"pointer",fontSize:12}},isMobile?"⏏":"Sair")
    )
  );

  // ── tabs ──
  const tabLabels=[["entrada",isMobile?"📝":"📝 Apontamento"],["dashboard",isMobile?"📊":"📊 Dashboard"],["historico",isMobile?"📋":"📋 Histórico"],["metas",isMobile?"🎯":"🎯 Metas"],["feedbacks",isMobile?"💬":"💬 Feedbacks"]];
  const tabs=el("div",{style:{background:"#002548",display:"flex",paddingLeft:0,overflowX:"auto",borderBottom:"1px solid #003E6B"}},
    ...tabLabels.map(([k,l])=>
      el("button",{key:k,onClick:()=>setTab(k),style:{padding:isMobile?"10px 14px":"11px 20px",border:"none",borderBottom:tab===k?"3px solid #0064A6":"3px solid transparent",cursor:"pointer",whiteSpace:"nowrap",fontWeight:tab===k?700:400,background:"transparent",color:tab===k?"#fff":"#A8C6D8",borderRadius:0,fontSize:isMobile?13:14,transition:"color .15s,border-color .15s",marginBottom:"-1px"}},l)
    )
  );

  return el("div",{style:{fontFamily:"'Segoe UI',sans-serif",background:"#F0F2F5",minHeight:"100vh"}},
    editRec  &&el(EditModal,  {rec:editRec,  metas,machines,onSave:handleEdit,    onClose:()=>setEditRec(null),  saving:editSaving}),
    deleteRec&&el(DeleteModal,{rec:deleteRec,machines,     onConfirm:handleDelete,onClose:()=>setDeleteRec(null),deleting}),
    obsRec   &&el(ObsModal,   {rec:obsRec,   machines,     onSave:handleSaveObs,  onClose:()=>setObsRec(null),  saving:obsSaving}),
    conflictInfo&&el(ConflictModal,{conflicts:conflictInfo.conflicts,onReplace:handleConflictReplace,onAddWithObs:handleConflictAddObs,onClose:()=>setConflictInfo(null)}),
    showAdmin&&el(AdminPanel,{user,onClose:()=>setShowAdmin(false)}),
    header, tabs,
    el("div",{style:{padding:isMobile?10:20}},
      tab==="entrada"   &&el(TabEntrada,   {machines,metas,inputs,obsInputs,recordsLookup,entryDate,setEntryDate,entryTurno,setEntryTurno,syncSt,pendingCount,handleSave,setInputs,setObsInputs}),
      tab==="dashboard" &&el(TabDashboard, {machines,metas,dashData,machAgg,totProd,totMeta,chartProdVsMeta,chartTurnoData,chartTendencia,chartPerformers,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,dView,setDView,isMobile}),
      tab==="historico" &&el(TabHistorico, {machines,metas,sortedHistorico,dashData,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,setEditRec,setDeleteRec,setObsRec}),
      tab==="metas"     &&el(TabMetas,     {machines,metas,metasInfo,updateMeta,metasLoading,metasSaving,metaEdit,setMetaEdit,saveMetasToServer}),
      tab==="feedbacks" &&el(TabFeedbacks, {machines,metas,feedbacksData,dfIni,setDfIni,dfFim,setDfFim,dfMac,setDfMac,dfTur,setDfTur,setObsRec,setDeleteRec})
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
