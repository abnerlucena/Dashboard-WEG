// ─── CONFIGURE AQUI ───────────────────────────────────────────
const SCRIPT_URL  = "https://script.google.com/macros/s/AKfycbxgTE8hzPPmRYuuXEFvhB0UUtFu4Ve2FJXJEyUBRQX7YkZiVN5AxRem11wcIOQ7u-1ABg/exec";
// ⚠️ CÓDIGO DE CONVITE REMOVIDO DO FRONTEND POR SEGURANÇA
// Agora é validado apenas no backend

const MACHINES = [
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
  {id:17,name:"INSERÇÃO DOS CONTATOS INTERRUPTOR",  hasMeta:false, defaultMeta:0},
  {id:18,name:"FECHAMENTO TECLA INTERRUPTORES",     hasMeta:false, defaultMeta:0},
  {id:19,name:"RETRABALHO GERAL",                   hasMeta:false, defaultMeta:0},
];
const TURNOS = ["TURNO 1","TURNO 2","TURNO 3"];
const META_KEY = "prod_metas_v1";
const SESSION_KEY = "prod_session_v3"; // v3 = secure com tokens

// ─── HELPERS ──────────────────────────────────────────────────
const C={green:"#22c55e",yellow:"#f59e0b",red:"#ef4444",blue:"#3b82f6",gray:"#6b7280",purple:"#8b5cf6",teal:"#14b8a6",navy:"#1e3a5f"};
const h = React.createElement;
const {useState,useEffect,useMemo,useCallback,useRef} = React;
const fmt    = d=>d.toISOString().slice(0,10);
const today  = ()=>fmt(new Date());
const parseD = s=>{
  if(!s) return new Date(0);
  if(s instanceof Date) return s;
  if(typeof s === 'object' && s.getTime) return new Date(s);
  // Se for string em formato ISO (YYYY-MM-DD)
  if(typeof s === 'string' && s.includes('-')) return new Date(s+"T00:00:00");
  // Se for string em formato brasileiro (DD/MM/YYYY)
  if(typeof s === 'string' && s.includes('/')) {
    const parts = s.split(' ')[0].split('/');
    if(parts.length === 3) {
      const [d,m,y] = parts;
      return new Date(`${y}-${m}-${d}T00:00:00`);
    }
  }
  return new Date(s);
};
const dispD  = s=>{ 
  if(!s) return "";
  
  // Se é um objeto Date do JavaScript
  if(s instanceof Date || (typeof s === 'object' && s.getTime)) {
    const d = new Date(s);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // Se é string no formato brasileiro DD/MM/YYYY
  if(typeof s === 'string' && s.includes("/")) {
    return s.split(" ")[0]; // Remove hora se houver
  }
  
  // Se é string no formato ISO YYYY-MM-DD
  if(typeof s === 'string' && s.includes("-")) {
    const[y,m,d]=s.split("-"); 
    return`${d}/${m}/${y}`;
  }
  
  // Tenta converter para Date como último recurso
  try {
    const d = new Date(s);
    if(!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch(e) {}
  
  return String(s);
};

const dispDH = s=>{ 
  if(!s) return "";
  
  // Se é string e contém GMT ou fuso horário, limpa
  if(typeof s === 'string' && (s.includes('GMT') || s.includes('Horário'))) {
    try {
      const d = new Date(s);
      if(!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hour = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hour}:${min}`;
      }
    } catch(e) {}
  }
  
  // Se é um objeto Date
  if(s instanceof Date || (typeof s === 'object' && s.getTime)) {
    const d = new Date(s);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${min}`;
  }
  
  // Se já está em formato brasileiro
  if(typeof s === 'string' && s.includes("/")) {
    // Se já tem hora, retorna apenas data e hora (sem segundos)
    if(s.includes(":")) {
      const parts = s.split(" ");
      if(parts.length >= 2) {
        const date = parts[0];
        const timeParts = parts[1].split(":");
        const time = `${timeParts[0]}:${timeParts[1]}`;
        return `${date} ${time}`;
      }
      return s;
    }
    // Se não tem hora, adiciona 00:00
    return s + " 00:00";
  }
  
  // Tenta converter para Date
  try {
    const d = new Date(s);
    if(!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hour = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hour}:${min}`;
    }
  } catch(e) {}
  
  return String(s);
};
const nowBR = ()=>new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"});
const normDate = d=>{ 
  if(!d) return null;
  if(d instanceof Date) return fmt(d);
  if(typeof d === 'string' && d.includes('-')) return d.slice(0,10);
  if(typeof d === 'string' && d.includes('/')) {
    const[day,month,year]=d.split(' ')[0].split('/');
    return `${year}-${month}-${day}`;
  }
  try{ const dt=new Date(d); if(!isNaN(dt.getTime())) return fmt(dt); }catch{}
  return null;
};
const pctCol = p=>p===null?C.gray:p>=100?C.green:p>=80?C.yellow:C.red;
const num    = v=>{ const x=Number(v); return isNaN(x)?0:x; };
const IS = {border:"1px solid #d1d5db",borderRadius:6,padding:"7px 10px",fontSize:14,background:"#fff",outline:"none"};
const SS = {...IS,cursor:"pointer"};
const BTN= (bg,ex={})=>({background:bg,color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontWeight:700,fontSize:14,cursor:"pointer",...ex});

// ─── SESSION / METAS ──────────────────────────────────────────
const loadSession = ()=>{ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)||"null"); }catch{ return null; } };
const saveSession = u=>{ try{ localStorage.setItem(SESSION_KEY,JSON.stringify(u)); }catch{} };
const clearSession= ()=>{ try{ localStorage.removeItem(SESSION_KEY); }catch{} };

function loadMetas(){
  try{
    const saved=JSON.parse(localStorage.getItem(META_KEY)||"{}");
    const m={};
    MACHINES.forEach(mac=>{ m[mac.id]=saved[mac.id]!==undefined?saved[mac.id]:mac.defaultMeta; });
    return m;
  }catch{ const m={}; MACHINES.forEach(mac=>m[mac.id]=mac.defaultMeta); return m; }
}
function saveMetas(m){ try{ localStorage.setItem(META_KEY,JSON.stringify(m)); }catch{} }

// ─── API ──────────────────────────────────────────────────────
async function api(action, body={}, userSession=null){
  // ✅ SEGURO: Adicionar token automaticamente se fornecido
  const payload = {action, ...body};
  if(userSession?.token) {
    payload.token = userSession.token;
  }
  
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
  
  // ✅ Tratar erro de sessão expirada
  if(!j.ok && j.error && j.error.includes("Sessão")) {
    // Limpar sessão local
    clearSession();
    throw new Error("Sua sessão expirou. Faça login novamente.");
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

function MiniBar({pct,color}){
  return el("div",{style:{background:"#e5e7eb",borderRadius:4,height:10,overflow:"hidden"}},
    el("div",{style:{width:`${Math.min(pct??0,100)}%`,height:"100%",background:color,borderRadius:4,transition:"width .4s"}})
  );
}

function Alert({type,msg}){
  if(!msg) return null;
  const s={error:{bg:"#fef2f2",br:"#fca5a5",tx:C.red},success:{bg:"#f0fdf4",br:"#86efac",tx:"#16a34a"},info:{bg:"#eff6ff",br:"#bfdbfe",tx:"#1d4ed8"}}[type]||{bg:"#eff6ff",br:"#bfdbfe",tx:"#1d4ed8"};
  return el("div",{style:{background:s.bg,border:`1px solid ${s.br}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:s.tx,marginTop:10,fontWeight:500}},
    (type==="error"?"⚠ ":type==="success"?"✔ ":"ℹ ")+msg
  );
}

function Modal({children}){
  return el("div",{style:{position:"fixed",inset:0,background:"#0008",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}},
    el("div",{style:{background:"#fff",borderRadius:14,padding:28,width:"100%",maxWidth:420,boxShadow:"0 8px 32px #0005",maxHeight:"90vh",overflowY:"auto"}},
      ...children
    )
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
      // ✅ SEGURO: Salvar apenas token e dados não sensíveis
      const session = {
        token: r.session.token,
        nome: r.session.nome,
        role: r.session.role,
        expiresAt: r.session.expiresAt
      };
      setTimeout(()=>{ saveSession(session); onLogin(session); },800);
    }catch(e){ setAlert({type:"error",msg:e.message}); }
    finally{ setLoading(false); }
  }

  const isLogin=mode==="login";
  return el("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#1e3a5f,#2563eb)"}},
    el("div",{style:{background:"#fff",borderRadius:18,padding:"36px 32px",width:380,boxShadow:"0 12px 40px #0005"}},
      el("div",{style:{textAlign:"center",marginBottom:26}},
        el("div",{style:{fontSize:42}},"🏭"),
        el("div",{style:{fontSize:21,fontWeight:800,color:C.navy,marginTop:6}},"Dashboard de Produção"),
        el("div",{style:{fontSize:13,color:C.gray,marginTop:3}},isLogin?"Faça login para continuar":"Crie sua conta de acesso")
      ),
      el("div",{style:{display:"flex",background:"#f1f5f9",borderRadius:10,padding:4,marginBottom:22}},
        ...[["login","Entrar"],["register","Criar Conta"]].map(([k,l])=>
          el("button",{key:k,onClick:()=>switchMode(k),style:{flex:1,padding:"8px",border:"none",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:14,background:mode===k?"#fff":"transparent",color:mode===k?C.navy:C.gray,boxShadow:mode===k?"0 1px 4px #0002":"none",transition:"all .2s"}},l)
        )
      ),
      el("form",{onSubmit:submit},
        el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}},"NOME DE USUÁRIO"),
          el("input",{value:nome,onChange:e=>setNome(e.target.value),placeholder:"Seu nome",style:{...IS,width:"100%"},autoFocus:true})
        ),
        el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}},"SENHA"),
          el("div",{style:{position:"relative"}},
            el("input",{type:showPw?"text":"password",value:senha,onChange:e=>setSenha(e.target.value),placeholder:"Mínimo 4 caracteres",style:{...IS,width:"100%",paddingRight:42}}),
            el("span",{onClick:()=>setShowPw(!showPw),style:{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:18}},showPw?"🙈":"👁")
          )
        ),
        !isLogin&&el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}},"CONFIRMAR SENHA"),
          el("input",{type:showPw?"text":"password",value:senha2,onChange:e=>setSenha2(e.target.value),placeholder:"Repita a senha",style:{...IS,width:"100%"}})
        ),
        !isLogin&&el("div",{style:{marginBottom:14}},
          el("div",{style:{fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}},"CÓDIGO DE ACESSO"),
          el("input",{value:codigo,onChange:e=>setCodigo(e.target.value),placeholder:"Digite o código de acesso",style:{...IS,width:"100%"}}),
          el("div",{style:{fontSize:11,color:C.gray,marginTop:3}},"Solicite o código de acesso ao administrador.")
        ),
        el(Alert,{type:alert.type,msg:alert.msg}),
        el("button",{type:"submit",disabled:loading,style:{...BTN("#2563eb"),width:"100%",marginTop:18,padding:"11px",fontSize:15,opacity:loading?.7:1}},
          loading?"⏳ Aguarde...":(isLogin?"Entrar →":"Criar Conta")
        )
      ),
      isLogin&&el("div",{style:{marginTop:14,textAlign:"center",fontSize:12,color:C.gray}},"Esqueceu a senha? Fale com o ",el("b",null,"administrador"),"."),
    )
  );
}

// ─── MODAL EDIÇÃO ─────────────────────────────────────────────
function EditModal({rec,metas,onSave,onClose,saving}){
  const mId=Number(rec.machineId);
  const mac=MACHINES.find(m=>m.id===mId);
  const metaVal=num(rec.meta)>0?num(rec.meta):(mac?.hasMeta?(metas[mId]||mac.defaultMeta||0):0);
  const [val,setVal]=useState(String(rec.producao));
  const pct=mac?.hasMeta&&metaVal>0&&val!==""?Math.round(num(val)/metaVal*100):null;
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.navy,marginBottom:4}},"✏️ Editar Apontamento"),
    el("div",{style:{fontSize:13,color:C.gray,marginBottom:18}},`${mac?.name} · ${dispD(rec.date)} · ${rec.turno}`),
    el("div",{style:{marginBottom:14}},
      el("div",{style:{fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}},"PRODUÇÃO (peças)"),
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
      el("button",{onClick:()=>onSave(num(val)),disabled:saving||val==="",style:{...BTN("#2563eb"),flex:2,opacity:saving||val===""?.6:1}},
        saving?"⏳ Salvando...":"💾 Salvar edição"
      )
    )
  );
}

// ─── MODAL EXCLUIR ────────────────────────────────────────────
function DeleteModal({rec,onConfirm,onClose,deleting}){
  const mac=MACHINES.find(m=>m.id===Number(rec.machineId));
  return el(Modal,{},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.red,marginBottom:10}},"🗑️ Excluir Apontamento"),
    el("div",{style:{fontSize:14,color:"#374151",marginBottom:20,lineHeight:1.7}},
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

// ─── MODAL OBSERVAÇÃO ─────────────────────────────────────────
function ObsModal({rec, onSave, onClose, saving}) {
  const mac = MACHINES.find(m => m.id === Number(rec.machineId));
  const [text, setText] = useState(rec.obs || "");
  return el(Modal, {},
    el("div",{style:{fontWeight:800,fontSize:17,color:C.navy,marginBottom:4}},"💬 Observação"),
    el("div",{style:{fontSize:13,color:C.gray,marginBottom:14}},`${mac?.name} · ${dispD(rec.date)} · ${rec.turno}`),
    el("textarea",{
      value: text,
      onChange: e => setText(e.target.value),
      placeholder: "Descreva observações sobre este apontamento...",
      autoFocus: true,
      style: {...IS, width:"100%", height:100, resize:"vertical", fontFamily:"inherit", fontSize:14}
    }),
    rec.obs && el("div",{style:{fontSize:11,color:C.gray,marginTop:4}},"Observação atual: "+rec.obs),
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

  return el("div",{style:{position:"fixed",inset:0,background:"#0008",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}},
    el("div",{style:{background:"#fff",borderRadius:14,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px #0005"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"16px 20px",borderRadius:"14px 14px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",{style:{fontWeight:800,fontSize:16}},"⚙️ Painel do Administrador"),
        el("button",{onClick:onClose,style:{background:"#ffffff22",border:"none",color:"#fff",borderRadius:6,padding:"4px 12px",cursor:"pointer",fontWeight:700}},"✕")
      ),
      el("div",{style:{padding:22}},
        el(Alert,{type:msg.type,msg:msg.text}),
        el("div",{style:{fontWeight:700,fontSize:15,color:C.navy,margin:"16px 0 10px"}},"👥 Usuários"),
        loading?el("div",{style:{color:C.gray,textAlign:"center",padding:20}},"⏳ Carregando..."):
        el("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:13}},
          el("thead",null,el("tr",{style:{background:"#f1f5f9"}},
            el("th",{style:{padding:"8px 10px",textAlign:"left"}},"Nome"),
            el("th",{style:{padding:"8px 10px",textAlign:"center"}},"Perfil"),
            el("th",{style:{padding:"8px 10px",textAlign:"center"}},"Status"),
            el("th",{style:{padding:"8px 10px",textAlign:"center"}},"Ação")
          )),
          el("tbody",null,...users.map((u,i)=>
            el("tr",{key:u.nome,style:{background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #e5e7eb"}},
              el("td",{style:{padding:"8px 10px",fontWeight:600,color:C.navy}},u.nome),
              el("td",{style:{padding:"8px 10px",textAlign:"center"}},
                el("span",{style:{background:u.role==="admin"?"#fef3c7":"#e0e7ff",color:u.role==="admin"?"#92400e":"#3730a3",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600}},u.role==="admin"?"Admin":"Operador")
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
        el("div",{style:{marginTop:22,padding:16,background:"#fafafa",borderRadius:10,border:"1px solid #e5e7eb"}},
          el("div",{style:{fontWeight:700,color:C.navy,marginBottom:12}},"➕ Criar Novo Usuário"),
          el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}},"NOME"),
              el("input",{value:cNome,onChange:e=>setCNome(e.target.value),placeholder:"Nome do usuário",style:{...IS,width:"100%"}})
            ),
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}},"SENHA INICIAL"),
              el("input",{type:"password",value:cSenha,onChange:e=>setCSenha(e.target.value),placeholder:"Mín. 4 caracteres",style:{...IS,width:"100%"}})
            )
          ),
          el("button",{onClick:createUser,disabled:creating,style:{...BTN(C.green),opacity:creating?.7:1}},creating?"⏳ Criando...":"➕ Criar Usuário")
        ),
        el("div",{style:{marginTop:14,padding:16,background:"#fafafa",borderRadius:10,border:"1px solid #e5e7eb"}},
          el("div",{style:{fontWeight:700,color:C.navy,marginBottom:12}},"🔑 Redefinir Senha"),
          el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}},"USUÁRIO"),
              el("select",{value:rTarget,onChange:e=>setRTarget(e.target.value),style:{...SS,width:"100%"}},
                el("option",{value:""},"Selecione..."),
                ...users.filter(u=>u.nome!==user.nome).map(u=>el("option",{key:u.nome},u.nome))
              )
            ),
            el("div",null,
              el("div",{style:{fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}},"NOVA SENHA"),
              el("input",{value:newPw,onChange:e=>setNewPw(e.target.value),placeholder:"Mín. 4 caracteres",style:{...IS,width:"100%"}})
            )
          ),
          el("button",{onClick:resetPw,disabled:resetting,style:{...BTN("#2563eb"),opacity:resetting?.7:1}},resetting?"⏳ Redefinindo...":"🔑 Redefinir")
        )
      )
    )
  );
}

// ─── ECHARTS: CONFIGURAÇÕES DE GRÁFICOS ───────────────────────
function getChartOption(type, data) {
  const tooltipBase = {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    padding: [8, 12],
    textStyle: {color: '#374151', fontSize: 12}
  };

  if (type === 'bar') {
    return {
      animation: true,
      animationDuration: 750,
      animationEasing: 'cubicOut',
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        axisPointer: {type: 'shadow', shadowStyle: {color: 'rgba(0,0,0,0.05)'}},
        formatter: params => {
          const d = data[params[0].dataIndex];
          return `<b>${d.name}</b><br/>Meta: ${d.meta.toLocaleString('pt-BR')}<br/>Produção: ${d.producao.toLocaleString('pt-BR')}`;
        }
      },
      legend: {data: ['Meta', 'Produção'], top: 0, right: 0},
      grid: {top: 40, right: 30, bottom: 70, left: 60},
      xAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLabel: {rotate: 15, fontSize: 11, interval: 0}
      },
      yAxis: {
        type: 'value',
        axisLabel: {formatter: v => v.toLocaleString('pt-BR'), fontSize: 11}
      },
      series: [
        {
          name: 'Meta',
          type: 'bar',
          data: data.map(d => d.meta),
          itemStyle: {color: C.gray, borderRadius: [4, 4, 0, 0]}
        },
        {
          name: 'Produção',
          type: 'bar',
          data: data.map(d => d.producao),
          itemStyle: {color: C.blue, borderRadius: [4, 4, 0, 0]}
        }
      ]
    };
  }

  if (type === 'pie') {
    return {
      animation: true,
      animationDuration: 750,
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: p => `<b>${p.name}</b><br/>${p.value.toLocaleString('pt-BR')} peças<br/>${p.percent.toFixed(0)}%`
      },
      legend: {orient: 'horizontal', bottom: 0},
      color: [C.blue, C.green, C.yellow, C.purple, C.teal],
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        data: data.map(d => ({name: d.name, value: d.value})),
        label: {formatter: '{b}: {d}%', fontSize: 12},
        emphasis: {itemStyle: {shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)'}}
      }]
    };
  }

  if (type === 'line') {
    return {
      animation: true,
      animationDuration: 750,
      animationEasing: 'cubicOut',
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        axisPointer: {type: 'shadow', shadowStyle: {color: 'rgba(0,0,0,0.05)'}},
        formatter: params => {
          const lines = params.map(p => `${p.seriesName}: ${Number(p.value).toLocaleString('pt-BR')}`).join('<br/>');
          return `<b>${params[0]?.axisValue}</b><br/>${lines}`;
        }
      },
      legend: {data: ['Produção Real', 'Meta'], top: 0, right: 0},
      grid: {top: 40, right: 30, bottom: 60, left: 65},
      xAxis: {
        type: 'category',
        data: data.map(d => d.date),
        axisLabel: {rotate: 15, fontSize: 11}
      },
      yAxis: {
        type: 'value',
        axisLabel: {formatter: v => v.toLocaleString('pt-BR'), fontSize: 11}
      },
      series: [
        {
          name: 'Produção Real',
          type: 'line',
          data: data.map(d => d.producao),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {color: C.blue, width: 3},
          itemStyle: {color: C.blue},
          areaStyle: {color: {type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{offset: 0, color: C.blue + '44'}, {offset: 1, color: C.blue + '00'}]}}
        },
        {
          name: 'Meta',
          type: 'line',
          data: data.map(d => Math.round(d.meta)),
          smooth: true,
          lineStyle: {color: C.purple, width: 2, type: 'dashed'},
          itemStyle: {color: C.purple},
          symbol: 'none'
        }
      ]
    };
  }

  if (type === 'horizontalBar') {
    const colors = data.map(d => d.pct >= 100 ? C.green : d.pct >= 80 ? C.yellow : C.red);
    return {
      animation: true,
      animationDuration: 750,
      animationEasing: 'cubicOut',
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        axisPointer: {type: 'shadow'},
        formatter: params => `<b>${params[0].name}</b><br/>% da Meta: ${params[0].value}%`
      },
      grid: {top: 10, right: 60, bottom: 10, left: 10, containLabel: true},
      xAxis: {
        type: 'value',
        axisLabel: {formatter: '{value}%', fontSize: 11},
        max: v => Math.max(v.max * 1.1, 110)
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLabel: {fontSize: 11, width: 130, overflow: 'truncate'}
      },
      series: [{
        type: 'bar',
        data: data.map((d, i) => ({value: d.pct, itemStyle: {color: colors[i], borderRadius: [0, 4, 4, 0]}})),
        label: {show: true, position: 'right', formatter: '{c}%', fontSize: 11, color: '#374151'}
      }]
    };
  }

  return {};
}

// ─── ECHARTS: COMPONENTE REUTILIZÁVEL ─────────────────────────
function EChartsComponent({title, subtitle, data, type, height = 350}) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);

  // Inicializa instância apenas uma vez (mount/unmount)
  useEffect(() => {
    if (!chartRef.current || typeof echarts === 'undefined') return;
    instanceRef.current = echarts.init(chartRef.current);
    return () => {
      if (instanceRef.current) { instanceRef.current.dispose(); instanceRef.current = null; }
    };
  }, []);

  // Atualiza opções apenas quando dados ou tipo mudam
  useEffect(() => {
    if (!instanceRef.current || !data || data.length === 0) return;
    instanceRef.current.setOption(getChartOption(type, data), true);
  }, [data, type]);

  useEffect(() => {
    const handleResize = () => { if (instanceRef.current) instanceRef.current.resize(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!data || data.length === 0) {
    return el("div", {style: {background:"#fff",borderRadius:12,padding:40,textAlign:"center",boxShadow:"0 1px 4px #0001"}},
      el("div",{style:{fontSize:48,marginBottom:12}},"📊"),
      el("div",{style:{fontSize:16,color:C.gray,fontWeight:600}},"Nenhum dado disponível"),
      el("div",{style:{fontSize:13,color:"#9ca3af",marginTop:4}},"Ajuste os filtros ou adicione apontamentos")
    );
  }

  return el("div",{style:{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 1px 4px #0001"}},
    title && el("div",{style:{marginBottom:12}},
      el("div",{style:{fontSize:16,fontWeight:700,color:C.navy}},title),
      subtitle && el("div",{style:{fontSize:12,color:C.gray,marginTop:2}},subtitle)
    ),
    el("div",{ref:chartRef,style:{width:"100%",height}})
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────
function App(){
  const [user,setUser]           = useState(()=>loadSession());
  const [metas,setMetasState]    = useState(loadMetas);
  const [records,setRecords]     = useState([]);
  const [tab,setTab]             = useState("entrada");
  const [entryDate,setEntryDate] = useState(today());
  const [entryTurno,setEntryTurno]=useState("TURNO 1");
  const [inputs,setInputs]       = useState({});
  const [obsInputs,setObsInputs] = useState({});
  const [syncSt,setSyncSt]       = useState(null);
  const [loading,setLoading]     = useState(false);
  const [lastSync,setLastSync]   = useState(null);
  const [editRec,setEditRec]     = useState(null);
  const [deleteRec,setDeleteRec] = useState(null);
  const [editSaving,setEditSaving]=useState(false);
  const [deleting,setDeleting]   = useState(false);
  const [obsRec,setObsRec]       = useState(null);
  const [obsSaving,setObsSaving] = useState(false);
  const [showAdmin,setShowAdmin] = useState(false);
  const [dfIni,setDfIni]         = useState(()=>{ const d=new Date(); d.setDate(1); return fmt(d); });
  const [dfFim,setDfFim]         = useState(today());
  const [dfMac,setDfMac]         = useState("TODAS");
  const [dfTur,setDfTur]         = useState("TODOS");
  const [dView,setDView]         = useState("resumo");
  const [metaEdit,setMetaEdit]   = useState(false);
  const pollRef=useRef(null);
  const isMobile=useIsMobile();

  function updateMeta(id,val){ const m={...metas,[id]:num(val)}; setMetasState(m); saveMetas(m); }

  const loadAll=useCallback(async(silent=false)=>{
    if(!silent) setLoading(true);
    try{
      const r=await api("getAll",{},user);
      setRecords(r.data||[]);
      setLastSync(new Date());
    }catch(e){
      console.error("Erro ao carregar dados:", e);
      if(!silent) setSyncSt("error");
      if(e.message.toLowerCase().includes("sessão")||e.message.toLowerCase().includes("sessao")||e.message.includes("expirou")){
        handleLogout();
      }
    }
    finally{ if(!silent) setLoading(false); }
  },[user]);

  useEffect(()=>{
    if(user){ 
      loadAll(); 
      pollRef.current=setInterval(()=>loadAll(true),30000); // 30 segundos
    }
    return()=>clearInterval(pollRef.current);
  },[user,loadAll]);

  // refs removed - handleSave now reads state directly

  const cellKey=(mId,d,t)=>`${mId}_${d}_${t}`;

  function getVal(mId){
    const k=cellKey(mId,entryDate,entryTurno);
    if(inputs[k]!==undefined) return inputs[k];
    
    // Busca no banco comparando date normalizado
    const s=records.find(r=>{
      if(Number(r.machineId)!==Number(mId)) return false;
      if(r.turno!==entryTurno) return false;
      
      // Normaliza data do registro e compara com data de entrada
      const recDate = normDate(r.date);
      return recDate === entryDate;
    });
    
    return s?String(s.producao):"";
  }

  function setVal(mId,val){ setInputs(p=>({...p,[cellKey(mId,entryDate,entryTurno)]:val})); }

  function getObsVal(mId){
    const k=cellKey(mId,entryDate,entryTurno);
    if(obsInputs[k]!==undefined) return obsInputs[k];
    const s=records.find(r=>Number(r.machineId)===Number(mId)&&r.turno===entryTurno&&normDate(r.date)===entryDate);
    return s?(s.obs||""):"";
  }
  function setObsVal(mId,val){ setObsInputs(p=>({...p,[cellKey(mId,entryDate,entryTurno)]:val})); }

  async function handleSave(){
    const currentInputs   = {...inputs};
    const currentObsInputs= {...obsInputs};
    const currentMetas    = {...metas};
    const timestamp = nowBR();

    // Coleta todas as chaves com valores pendentes (qualquer data/turno)
    const pendingKeys=new Set([
      ...Object.keys(currentInputs).filter(k=>currentInputs[k]!==undefined&&currentInputs[k]!==""),
      ...Object.keys(currentObsInputs).filter(k=>currentObsInputs[k]!==undefined&&currentObsInputs[k]!=="")
    ]);

    setSyncSt("syncing");
    const toSend=[];
    pendingKeys.forEach(k=>{
      const firstIdx=k.indexOf("_"); if(firstIdx<0) return;
      const mId=Number(k.substring(0,firstIdx));
      const rest=k.substring(firstIdx+1);
      const date=rest.substring(0,10);
      const turno=rest.substring(11);
      const m=MACHINES.find(mc=>mc.id===mId); if(!m) return;
      const val=currentInputs[k];
      if(val===undefined||val==="") return;
      const metaVal=m.hasMeta?(currentMetas[m.id]||m.defaultMeta||0):0;
      const obs=currentObsInputs[k];
      toSend.push({
        date, turno, machineId:m.id, machineName:m.name,
        meta:metaVal, producao:num(val), savedBy:user.nome, savedAt:timestamp,
        editUser:"", editTime:"",
        obs:(obs!==undefined&&obs!=="")?obs:undefined
      });
    });
    
    if(!toSend.length){
      setSyncSt(null);
      return;
    }
    try{
      const saved=[];
      for(let i=0;i<toSend.length;i+=4){
        await api("upsert",{records:toSend.slice(i,i+4)},user);
        saved.push(...toSend.slice(i,i+4)); // só marca como salvo após sucesso do lote
      }
      setInputs(prev=>{ const next={...prev}; saved.forEach(r=>delete next[cellKey(r.machineId,r.date,r.turno)]); return next; });
      setObsInputs(prev=>{ const next={...prev}; saved.forEach(r=>delete next[cellKey(r.machineId,r.date,r.turno)]); return next; });
      await loadAll(true);
      setSyncSt("ok"); setTimeout(()=>setSyncSt(null),3000);
    }catch(e){
      console.error("Erro ao salvar:", e);
      setSyncSt("error");
      setTimeout(()=>setSyncSt(null),4000);
    }
  }

  async function handleEdit(newVal){
    if(!editRec) {
      console.error("Nenhum registro selecionado para editar");
      return;
    }
    
    const timestamp = nowBR();
    
    setEditSaving(true);
    try{
      const mId=Number(editRec.machineId);
      const mac=MACHINES.find(m=>m.id===mId);
      
      // Usa a meta que já estava salva no registro, ou a atual se não houver
      const metaToSave = num(editRec.meta) > 0 
        ? num(editRec.meta) 
        : (mac?.hasMeta ? (metas[mId] || mac.defaultMeta || 0) : 0);
      
      const nameToSave = mac?.name || editRec.machineName || "";
      
      const recordToSave = {
        date: editRec.date,
        turno: editRec.turno,
        machineId: mId,
        machineName: nameToSave,
        meta: metaToSave,
        producao: newVal,
        savedBy: editRec.savedBy || user.nome,
        savedAt: editRec.savedAt || timestamp,
        editUser: user.nome,
        editTime: timestamp
      };
      
      const result = await api("upsert",{records:[recordToSave]},user);
      if(!result.ok) throw new Error(result.error || "Erro ao editar");
      await loadAll(true); 
      setEditRec(null);
      
      // Feedback visual
      setSyncSt("ok");
      setTimeout(()=>setSyncSt(null), 2000);
    }catch(e){
      console.error("Erro ao editar:", e);
      setSyncSt("error");
      setTimeout(()=>setSyncSt(null), 3000);
    }
    finally{ setEditSaving(false); }
  }

  async function handleDelete(){
    if(!deleteRec) {
      console.error("Nenhum registro selecionado para deletar");
      return;
    }
    
    setDeleting(true);
    
    const deleteParams = {
      id: deleteRec.id,
      date: deleteRec.date,
      turno: deleteRec.turno,
      machineId: Number(deleteRec.machineId)
    };

    try{
      const result = await api("delete", deleteParams, user);
      if(!result.ok) throw new Error(result.error || "Erro ao excluir");
      await loadAll(true); 
      setDeleteRec(null); 
      
      // Feedback visual
      setSyncSt("ok");
      setTimeout(()=>setSyncSt(null), 2000);
    }
    catch(e){
      console.error("Erro ao excluir:", e);
      setSyncSt("error");
      setTimeout(()=>setSyncSt(null), 3000);
    }
    finally{ setDeleting(false); }
  }

  async function handleSaveObs(text){
    if(!obsRec) return;
    setObsSaving(true);
    try{
      const mId=Number(obsRec.machineId);
      const mac=MACHINES.find(m=>m.id===mId);
      const metaToSave=num(obsRec.meta)>0?num(obsRec.meta):(mac?.hasMeta?(metas[mId]||mac.defaultMeta||0):0);
      await api("upsert",{records:[{
        date:obsRec.date, turno:obsRec.turno, machineId:mId,
        machineName:mac?.name||obsRec.machineName||"",
        meta:metaToSave, producao:num(obsRec.producao),
        savedBy:obsRec.savedBy||user.nome, savedAt:obsRec.savedAt||nowBR(),
        editUser:user.nome, editTime:nowBR(),
        obs:text
      }]},user);
      await loadAll(true);
      setObsRec(null);
      setSyncSt("ok"); setTimeout(()=>setSyncSt(null),2000);
    }catch(e){ console.error("Erro ao salvar obs:", e); setSyncSt("error"); setTimeout(()=>setSyncSt(null),3000); }
    finally{ setObsSaving(false); }
  }

  function handleLogout(){
    // Limpa UI imediatamente — sem esperar resposta do servidor
    clearSession();
    setUser(null);
    setRecords([]);
    clearInterval(pollRef.current);
    // Invalida token no backend em background (fire-and-forget)
    if(user?.token) api("logout",{},user).catch(()=>{});
  }

  const dashData=useMemo(()=>records.filter(r=>{
    if(!r.date) return false;
    const recDate=normDate(r.date);
    if(!recDate) return false;
    if(recDate<dfIni||recDate>dfFim) return false;
    if(dfTur!=="TODOS"&&r.turno!==dfTur) return false;
    if(dfMac!=="TODAS"){ const mac=MACHINES.find(m=>m.id===Number(r.machineId)); if(!mac||mac.name!==dfMac) return false; }
    return true;
  }),[records,dfIni,dfFim,dfTur,dfMac]);

  const machAgg=useMemo(()=>{
    const agg={};
    dashData.forEach(r=>{
      const id=Number(r.machineId);
      if(!agg[id]){ const mac=MACHINES.find(m=>m.id===id); agg[id]={name:r.machineName||mac?.name||"Máquina "+id,hasMeta:mac?.hasMeta??false,totalProd:0,dias:new Set(),turnos:{},byDate:{}}; }
      agg[id].totalProd+=num(r.producao);
      agg[id].dias.add(r.date);
      agg[id].turnos[r.turno]=(agg[id].turnos[r.turno]||0)+num(r.producao);
      if(!agg[id].byDate[r.date]) agg[id].byDate[r.date]={};
      agg[id].byDate[r.date][r.turno]=num(r.producao);
    });
    Object.entries(agg).forEach(([id,a])=>{
      const nId=Number(id);
      a.diasCount=a.dias.size;
      a.totalMeta=a.hasMeta?(metas[nId]||0)*a.diasCount*(dfTur==="TODOS"?TURNOS.length:1):0;
      a.pct=a.totalMeta>0?Math.round(a.totalProd/a.totalMeta*100):null;
    });
    return agg;
  },[dashData,metas,dfTur]);

  const totProd=useMemo(()=>dashData.reduce((s,r)=>s+num(r.producao),0),[dashData]);
  const totMeta=useMemo(()=>Object.values(machAgg).reduce((s,a)=>s+a.totalMeta,0),[machAgg]);

  // ── dados dos gráficos (memoizados: só recalculam quando filtros/dados mudam) ──
  const chartProdVsMeta=useMemo(()=>
    MACHINES.filter(m=>dfMac==="TODAS"||m.name===dfMac).filter(m=>m.hasMeta)
      .map(m=>{ const a=machAgg[m.id]||{}; return {name:m.name.length>15?m.name.substring(0,13)+"...":m.name,meta:a.totalMeta||0,producao:a.totalProd||0}; })
      .sort((a,b)=>b.producao-a.producao).slice(0,10)
  ,[machAgg,dfMac]);

  const chartTurnoData=useMemo(()=>
    TURNOS.map(turno=>({name:turno,value:dashData.filter(r=>r.turno===turno).reduce((s,r)=>s+num(r.producao),0)})).filter(t=>t.value>0)
  ,[dashData]);

  const chartTendencia=useMemo(()=>{
    const byDate={};
    dashData.forEach(r=>{ if(!byDate[r.date]) byDate[r.date]={prod:0}; byDate[r.date].prod+=num(r.producao); });
    return Object.keys(byDate).sort().map(date=>({
      date:dispD(date), producao:byDate[date].prod,
      meta:Object.values(machAgg).reduce((s,a)=>s+(a.byDate&&a.byDate[date]?a.totalMeta/(a.diasCount||1):0),0)
    }));
  },[dashData,machAgg]);

  const chartPerformers=useMemo(()=>
    MACHINES.filter(m=>dfMac==="TODAS"||m.name===dfMac).filter(m=>m.hasMeta)
      .map(m=>{ const a=machAgg[m.id]||{}; return {name:m.name.length>22?m.name.substring(0,20)+"...":m.name,pct:a.pct||0,producao:a.totalProd||0}; })
      .filter(m=>m.producao>0).sort((a,b)=>b.pct-a.pct).slice(0,8)
  ,[machAgg,dfMac]);

  // feedbacks: todos os registros com observação no período filtrado
  const feedbacksData=useMemo(()=>
    records.filter(r=>{
      if(!r.obs||!r.obs.trim()) return false;
      const recDate=normDate(r.date);
      if(!recDate||recDate<dfIni||recDate>dfFim) return false;
      if(dfMac!=="TODAS"){ const mac=MACHINES.find(m=>m.id===Number(r.machineId)); if(!mac||mac.name!==dfMac) return false; }
      return true;
    }).sort((a,b)=>b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno))
  ,[records,dfIni,dfFim,dfMac]);

  const pendingCount=Object.values(inputs).filter(v=>v!==undefined&&v!=="").length;

  if(!user) return el(AuthScreen,{onLogin:u=>{ saveSession(u); setUser(u); }});

  // ── header ──
  const header = el("div",{style:{background:"linear-gradient(135deg,#1e3a5f,#2563eb)",padding:isMobile?"8px 12px":"13px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}},
    el("div",null,
      el("div",{style:{color:"#fff",fontSize:isMobile?15:20,fontWeight:700}},"🏭 "+(isMobile?"Dashboard":"Dashboard de Produção")),
      el("div",{style:{color:"#93c5fd",fontSize:11}},`👤 ${user.nome}`+(isMobile?"":" · "+(lastSync?`Sync: ${lastSync.toLocaleTimeString("pt-BR")}`:"Conectando...")),loading?" ⏳":"")
    ),
    el("div",{style:{display:"flex",gap:6,alignItems:"center"}},
      syncSt==="syncing"&&el("span",{style:{color:"#fde68a",fontSize:12}},"⏳"),
      syncSt==="ok"    &&el("span",{style:{color:"#86efac",fontSize:12}},"✔"),
      syncSt==="error" &&el("span",{style:{color:"#fca5a5",fontSize:12}},"✘"),
      el("button",{onClick:()=>loadAll(),title:"Recarregar",style:{background:"#ffffff22",border:"1px solid #ffffff44",color:"#fff",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12}},"🔄"),
      user.role==="admin"&&el("button",{onClick:()=>setShowAdmin(true),style:{background:"#f59e0b22",border:"1px solid #f59e0b66",color:"#fde68a",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},isMobile?"⚙":"⚙ Admin"),
      el("button",{onClick:handleLogout,style:{background:"#ffffff11",border:"1px solid #ffffff33",color:"#fca5a5",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12}},isMobile?"⏏":"Sair")
    )
  );

  // ── tabs ──
  const tabLabels=[["entrada",isMobile?"📝":"📝 Apontamento"],["dashboard",isMobile?"📊":"📊 Dashboard"],["historico",isMobile?"📋":"📋 Histórico"],["metas",isMobile?"🎯":"🎯 Metas"],["feedbacks",isMobile?"💬":"💬 Feedbacks"]];
  const tabs = el("div",{style:{background:C.navy,display:"flex",paddingLeft:isMobile?4:18,overflowX:"auto"}},
    ...tabLabels.map(([k,l])=>
      el("button",{key:k,onClick:()=>setTab(k),style:{padding:isMobile?"10px 12px":"10px 18px",border:"none",cursor:"pointer",whiteSpace:"nowrap",fontWeight:tab===k?700:400,background:tab===k?"#f1f5f9":"transparent",color:tab===k?C.navy:"#93c5fd",borderRadius:tab===k?"8px 8px 0 0":0,fontSize:isMobile?13:14}},l)
    )
  );

  // ── filtros ──
  const filterBar = el("div",{style:{background:"#fff",borderRadius:12,padding:14,boxShadow:"0 1px 4px #0001",marginBottom:14,display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}},
    el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"DE"),el("input",{type:"date",value:dfIni,onChange:e=>setDfIni(e.target.value),style:{...IS,width:"auto"}})),
    el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"ATÉ"),el("input",{type:"date",value:dfFim,onChange:e=>setDfFim(e.target.value),style:{...IS,width:"auto"}})),
    el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"MÁQUINA"),
      el("select",{value:dfMac,onChange:e=>setDfMac(e.target.value),style:{...SS,maxWidth:200,width:"auto"}},
        el("option",{value:"TODAS"},"TODAS"),
        ...MACHINES.map(m=>el("option",{key:m.id,value:m.name},m.name))
      )
    ),
    el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"TURNO"),
      el("select",{value:dfTur,onChange:e=>setDfTur(e.target.value),style:{...SS,width:"auto"}},
        el("option",{value:"TODOS"},"TODOS"),
        ...TURNOS.map(t=>el("option",{key:t,value:t},t))
      )
    )
  );

  // ── KPIs ──
  const kpis = el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:16}},
    ...[
      {label:"PRODUÇÃO TOTAL",value:totProd.toLocaleString("pt-BR"),sub:"peças",    color:C.blue},
      {label:"META TOTAL",    value:totMeta.toLocaleString("pt-BR"),sub:"peças",    color:C.purple},
      {label:"% ATINGIMENTO", value:totMeta>0?`${Math.round(totProd/totMeta*100)}%`:"—",sub:"geral",color:totMeta>0?pctCol(Math.round(totProd/totMeta*100)):C.gray},
      {label:"REGISTROS",     value:dashData.length,               sub:"lançamentos",color:C.teal},
      {label:"MÁQUINAS ATIVAS",value:Object.keys(machAgg).length,  sub:`de ${MACHINES.length}`,color:C.yellow},
    ].map(k=>el("div",{key:k.label,style:{background:"#fff",borderRadius:12,padding:"12px 14px",boxShadow:"0 1px 4px #0001",borderLeft:`4px solid ${k.color}`}},
      el("div",{style:{fontSize:10,color:C.gray,fontWeight:700,letterSpacing:.5}},k.label),
      el("div",{style:{fontSize:22,fontWeight:800,color:k.color,marginTop:4}},k.value),
      el("div",{style:{fontSize:11,color:"#9ca3af"}},k.sub)
    ))
  );

  // ── tab entrada ──
  const tabEntrada = el("div",null,
    el("div",{style:{background:"#fff",borderRadius:12,padding:14,boxShadow:"0 1px 4px #0001",marginBottom:14,display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-end"}},
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"DATA"),el("input",{type:"date",value:entryDate,onChange:e=>setEntryDate(e.target.value),style:{...IS,width:"auto"}})),
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"TURNO"),
        el("select",{value:entryTurno,onChange:e=>setEntryTurno(e.target.value),style:{...SS,width:"auto"}},
          ...TURNOS.map(t=>el("option",{key:t,value:t},t))
        )
      ),
      el("div",{style:{display:"flex",flexDirection:"column",gap:4}},
        el("button",{onClick:handleSave,disabled:syncSt==="syncing"||pendingCount===0,style:BTN(syncSt==="ok"?C.green:syncSt==="error"?C.red:"#2563eb",{fontSize:15,padding:"9px 28px",opacity:pendingCount===0?.5:1})},
          syncSt==="syncing"?"⏳ Salvando...":syncSt==="ok"?"✔ Salvo!":syncSt==="error"?"✘ Erro!":`💾 Salvar${pendingCount>0?` (${pendingCount})`:""}`)
        ,pendingCount>0&&el("div",{style:{fontSize:11,color:C.yellow,fontWeight:600,textAlign:"center"}},`⚠ ${pendingCount} não salvo(s)`)
      )
    ),
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px #0001",overflow:"hidden"}},
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
        el("tbody",null,...MACHINES.map((m,i)=>{
          const k=cellKey(m.id,entryDate,entryTurno);
          const val=getVal(m.id);
          const obsVal=getObsVal(m.id);
          const isLocal=inputs[k]!==undefined;
          const isObsLocal=obsInputs[k]!==undefined;
          const isSaved=!isLocal&&records.some(r=>Number(r.machineId)===m.id&&normDate(r.date)===entryDate&&r.turno===entryTurno);
          const metaVal=metas[m.id]||0;
          const pct=m.hasMeta&&val!==""?Math.round(num(val)/metaVal*100):null;
          const col=pctCol(pct);
          return el("tr",{key:m.id,style:{background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #e5e7eb"}},
            el("td",{style:{padding:"8px 14px",fontSize:13,fontWeight:600,color:C.navy}},m.name,!m.hasMeta&&el("span",{style:{marginLeft:6,fontSize:11,color:C.gray,fontWeight:400}},"sem meta")),
            el("td",{style:{padding:"8px 10px",textAlign:"center",fontSize:13,color:"#374151"}},m.hasMeta?metaVal.toLocaleString("pt-BR"):el("span",{style:{color:"#9ca3af"}},"—")),
            el("td",{style:{padding:"6px 10px",textAlign:"center"}},
              el("input",{type:"number",min:"0",placeholder:"0",value:val,onChange:e=>setVal(m.id,e.target.value),style:{...IS,width:100,textAlign:"center",fontSize:15,fontWeight:700,borderColor:isLocal?C.yellow:isSaved?C.blue:"#d1d5db",borderWidth:isLocal||isSaved?2:1}})
            ),
            el("td",{style:{padding:"8px 10px",textAlign:"center"}},
              pct!==null?el("span",{style:{background:col+"22",color:col,borderRadius:20,padding:"3px 8px",fontSize:12,fontWeight:700}},`${pct}%`):
              val!==""?el("span",{style:{background:"#e0e7ff",color:"#4338ca",borderRadius:20,padding:"3px 8px",fontSize:12,fontWeight:700}},`${num(val).toLocaleString("pt-BR")} pç`):
              el("span",{style:{color:"#d1d5db"}},"—")
            ),
            el("td",{style:{padding:"6px 10px"}},
              el("input",{type:"text",placeholder:"Observação...",value:obsVal,onChange:e=>setObsVal(m.id,e.target.value),style:{...IS,width:"100%",minWidth:140,fontSize:12,borderColor:isObsLocal?C.blue:"#d1d5db",borderWidth:isObsLocal?2:1}})
            ),
            el("td",{style:{padding:"8px 10px",textAlign:"center",fontSize:12}},
              isLocal||isObsLocal?el("span",{style:{color:C.yellow,fontWeight:700}},"● pend."):
              isSaved?el("span",{style:{color:C.green,fontWeight:700}},"✔"):
              el("span",{style:{color:"#d1d5db"}},"—")
            )
          );
        }))
      )
      ) // fecha overflowX wrapper
    )
  );

  // ── tab dashboard ──
  const tabDashboard = el("div",null,
    el("div",{style:{background:"#fff",borderRadius:12,padding:14,boxShadow:"0 1px 4px #0001",marginBottom:14,display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}},
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"DE"),el("input",{type:"date",value:dfIni,onChange:e=>setDfIni(e.target.value),style:{...IS,width:"auto"}})),
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"ATÉ"),el("input",{type:"date",value:dfFim,onChange:e=>setDfFim(e.target.value),style:{...IS,width:"auto"}})),
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"MÁQUINA"),
        el("select",{value:dfMac,onChange:e=>setDfMac(e.target.value),style:{...SS,maxWidth:200,width:"auto"}},
          el("option",{value:"TODAS"},"TODAS"),
          ...MACHINES.map(m=>el("option",{key:m.id,value:m.name},m.name))
        )
      ),
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"TURNO"),
        el("select",{value:dfTur,onChange:e=>setDfTur(e.target.value),style:{...SS,width:"auto"}},
          el("option",{value:"TODOS"},"TODOS"),
          ...TURNOS.map(t=>el("option",{key:t,value:t},t))
        )
      ),
      el("div",{style:{display:"flex",gap:6}},
        ...[["resumo","📋 Resumo"],["detalhado","🔍 Detalhado"],["comparativo","📊 Turnos"],["graficos","📈 Gráficos"]].map(([k,l])=>
          el("button",{key:k,onClick:()=>setDView(k),style:{padding:"6px 12px",border:`2px solid ${dView===k?"#2563eb":"#e5e7eb"}`,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,background:dView===k?"#2563eb":"#fff",color:dView===k?"#fff":"#374151"}},l)
        )
      )
    ),
    kpis,
    dView==="resumo"&&el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px #0001",overflow:"hidden"}},
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
        el("tbody",null,...MACHINES.filter(m=>dfMac==="TODAS"||m.name===dfMac).map((m,i)=>{
          const a=machAgg[m.id];
          return el("tr",{key:m.id,style:{background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #e5e7eb"}},
            el("td",{style:{padding:"9px 14px",fontSize:13,fontWeight:600,color:C.navy}},m.name),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:13}},a?.diasCount??0),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:15,fontWeight:700,color:C.navy}},(a?.totalProd??0).toLocaleString("pt-BR")),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:13,color:C.gray}},m.hasMeta?(a?.totalMeta??0).toLocaleString("pt-BR"):"—"),
            el("td",{style:{padding:"9px 14px",textAlign:"center"}},a?.pct!=null?el("span",{style:{background:pctCol(a.pct)+"22",color:pctCol(a.pct),borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},`${a.pct}%`):el("span",{style:{color:"#d1d5db"}},"—")),
            el("td",{style:{padding:"9px 14px"}},a?.pct!=null?el(MiniBar,{pct:a.pct,color:pctCol(a.pct)}):el("span",{style:{color:"#d1d5db",fontSize:11}},"sem meta"))
          );
        }))
      )
      ) // fecha overflowX
    ),
    dView==="detalhado"&&el("div",null,
      ...Object.values(machAgg).sort((a,b)=>a.name.localeCompare(b.name)).map(a=>
        el("div",{key:a.name,style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px #0001",marginBottom:12,overflow:"hidden"}},
          el("div",{style:{background:C.navy,color:"#fff",padding:"10px 16px",display:"flex",justifyContent:"space-between"}},
            el("span",{style:{fontWeight:700}},a.name),
            el("span",{style:{fontSize:13,color:"#93c5fd"}},`Total: ${a.totalProd.toLocaleString("pt-BR")} pç${a.pct!=null?` — ${a.pct}% meta`:""}`)
          ),
          el("div",{style:{overflowX:"auto"}},
            el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:400}},
              el("thead",null,el("tr",{style:{background:"#e0e7ff"}},
                el("th",{style:{padding:"7px 14px",textAlign:"left",fontSize:12,color:"#3730a3"}},"DATA"),
                ...TURNOS.map(t=>el("th",{key:t,style:{padding:"7px 14px",textAlign:"center",fontSize:12,color:"#3730a3"}},t)),
                el("th",{style:{padding:"7px 14px",textAlign:"center",fontSize:12,color:"#3730a3"}},"TOTAL DIA")
              )),
              el("tbody",null,...Object.keys(a.byDate).sort().reverse().map((date,i)=>{
                const dt=TURNOS.reduce((s,t)=>s+(a.byDate[date][t]||0),0);
                return el("tr",{key:date,style:{background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #e5e7eb"}},
                  el("td",{style:{padding:"7px 14px",fontSize:13,fontWeight:600}},dispD(date)),
                  ...TURNOS.map(t=>el("td",{key:t,style:{padding:"7px 14px",textAlign:"center",fontSize:13}},a.byDate[date][t]!==undefined?a.byDate[date][t].toLocaleString("pt-BR"):el("span",{style:{color:"#d1d5db"}},"—"))),
                  el("td",{style:{padding:"7px 14px",textAlign:"center",fontWeight:700}},dt.toLocaleString("pt-BR"))
                );
              }))
            )
          )
        )
      ),
      Object.keys(machAgg).length===0&&el("div",{style:{background:"#fff",borderRadius:12,padding:40,textAlign:"center",color:"#9ca3af"}},"Nenhum dado encontrado.")
    ),
    dView==="comparativo"&&el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px #0001",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"11px 16px",fontWeight:700}},"Comparativo por Turno"),
      el("div",{style:{overflowX:"auto"}},
      el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:440}},
        el("thead",null,el("tr",{style:{background:"#e0e7ff"}},
          el("th",{style:{padding:"10px 14px",textAlign:"left",  fontSize:13,color:"#3730a3"}},"MÁQUINA"),
          ...TURNOS.map(t=>el("th",{key:t,style:{padding:"10px 14px",textAlign:"center",fontSize:13,color:"#3730a3"}},t)),
          el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:13,color:"#3730a3"}},"TOTAL"),
          el("th",{style:{padding:"10px 14px",textAlign:"center",fontSize:13,color:"#3730a3"}},"MELHOR")
        )),
        el("tbody",null,...MACHINES.filter(m=>dfMac==="TODAS"||m.name===dfMac).map((m,i)=>{
          const a=machAgg[m.id];
          const tp=TURNOS.map(t=>({t,v:a?.turnos[t]||0}));
          const best=tp.reduce((b,x)=>x.v>b.v?x:b,{t:"—",v:-1});
          const total=a?.totalProd??0;
          return el("tr",{key:m.id,style:{background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #e5e7eb"}},
            el("td",{style:{padding:"9px 14px",fontSize:13,fontWeight:600,color:C.navy}},m.name),
            ...tp.map(({t,v})=>el("td",{key:t,style:{padding:"9px 14px",textAlign:"center",fontSize:13}},
              v>0?el("div",null,el("div",{style:{fontWeight:700}},v.toLocaleString("pt-BR")),total>0&&el("div",{style:{fontSize:10,color:C.gray}},`${Math.round(v/total*100)}%`)):el("span",{style:{color:"#d1d5db"}},"—")
            )),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontWeight:800,fontSize:14,color:C.navy}},total>0?total.toLocaleString("pt-BR"):"—"),
            el("td",{style:{padding:"9px 14px",textAlign:"center"}},best.v>0?el("span",{style:{background:C.green+"22",color:C.green,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},best.t):el("span",{style:{color:"#d1d5db"}},"—"))
          );
        }))
      )
      ) // fecha overflowX comparativo
    ),
    dView==="graficos"&&(
      chartProdVsMeta.length===0&&chartTurnoData.length===0
        ? el("div",{style:{background:"#fff",borderRadius:12,padding:40,textAlign:"center",boxShadow:"0 1px 4px #0001"}},
            el("div",{style:{fontSize:48,marginBottom:12}},"📊"),
            el("div",{style:{fontSize:16,color:C.gray,fontWeight:600}},"Nenhum dado disponível para gráficos"),
            el("div",{style:{fontSize:13,color:"#9ca3af",marginTop:4}},"Ajuste os filtros ou adicione apontamentos")
          )
        : el("div",{style:{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit, minmax(550px, 1fr))",gap:16}},
            el(EChartsComponent,{title:"📊 Produção vs Meta por Máquina",subtitle:"Comparativo entre produção real e meta estabelecida",data:chartProdVsMeta,type:"bar",height:350}),
            el(EChartsComponent,{title:"🎯 Distribuição de Produção por Turno",subtitle:"Percentual de produção em cada turno",data:chartTurnoData,type:"pie",height:350}),
            el(EChartsComponent,{title:"📈 Tendência de Produção ao Longo do Tempo",subtitle:"Evolução diária da produção no período",data:chartTendencia,type:"line",height:350}),
            el(EChartsComponent,{title:"🏆 Ranking de Performance",subtitle:"Máquinas ordenadas por % da meta",data:chartPerformers,type:"horizontalBar",height:350})
          )
    )
  );

  // ── tab histórico ──
  const tabHistorico = el("div",null,
    filterBar,
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px #0001",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"12px 16px",fontWeight:700,display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",null,"📋 Apontamentos Salvos"),
        el("span",{style:{fontSize:12,color:"#93c5fd"}},`${dashData.length} registros`)
      ),
      el("div",{style:{overflowX:"auto"}},
        el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:760}},
          el("thead",null,el("tr",{style:{background:"#e0e7ff"}},
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,color:"#3730a3"}},"DATA"),
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,color:"#3730a3"}},"TURNO"),
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,color:"#3730a3"}},"MÁQUINA"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#3730a3"}},"META"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#3730a3"}},"PRODUÇÃO"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#3730a3"}},"%"),
            el("th",{style:{padding:"10px 12px",textAlign:"left",  fontSize:12,color:"#3730a3"}},"APONTADO POR"),
            el("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#3730a3"}},"AÇÕES")
          )),
          el("tbody",null,
            dashData.length===0&&el("tr",null,el("td",{colSpan:8,style:{padding:32,textAlign:"center",color:"#9ca3af"}},"Nenhum apontamento no período.")),
            ...[...dashData].sort((a,b)=>b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno)).map((r,i)=>{
              const mId=Number(r.machineId);
              const mac=MACHINES.find(m=>m.id===mId);
              const savedMeta=num(r.meta);
              const metaVal=savedMeta>0?savedMeta:(mac?.hasMeta?(metas[mId]||mac.defaultMeta||0):0);
              const prod=num(r.producao);
              const pct=mac?.hasMeta&&metaVal>0?Math.round(prod/metaVal*100):null;
              const savedByName=r.savedBy||"";
              return el("tr",{key:r.id||r.date+"_"+r.turno+"_"+mId,style:{background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #e5e7eb"}},
                el("td",{style:{padding:"9px 12px",fontSize:13,fontWeight:600}},dispDH(r.savedAt||r.date)),
                el("td",{style:{padding:"9px 12px",fontSize:13}},r.turno),
                el("td",{style:{padding:"9px 12px",fontSize:13,fontWeight:600,color:C.navy}},r.machineName||(mac?.name||"—")),
                el("td",{style:{padding:"9px 12px",textAlign:"center",fontSize:13,color:C.gray}},metaVal>0?metaVal.toLocaleString("pt-BR"):"—"),
                el("td",{style:{padding:"9px 12px",textAlign:"center",fontSize:14,fontWeight:700}},prod.toLocaleString("pt-BR")),
                el("td",{style:{padding:"9px 12px",textAlign:"center"}},pct!==null?el("span",{style:{background:pctCol(pct)+"22",color:pctCol(pct),borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},`${pct}%`):el("span",{style:{color:"#d1d5db"}},"—")),
                el("td",{style:{padding:"9px 12px",fontSize:12,color:C.gray}},
                  el("div",{style:{fontWeight:600,color:"#374151"}},savedByName||"—"),
                  r.editUser&&el("div",{style:{fontSize:11,color:C.yellow,marginTop:2}},`✏ ${r.editUser}${r.editTime?" · "+dispDH(r.editTime):""}`),
                  r.obs&&el("div",{style:{fontSize:11,color:"#0369a1",marginTop:3,background:"#e0f2fe",borderRadius:4,padding:"2px 6px",display:"inline-block"}},`💬 ${r.obs}`)
                ),
                el("td",{style:{padding:"9px 12px",textAlign:"center"}},
                  el("div",{style:{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}},
                    el("button",{onClick:()=>setEditRec({...r,machineId:mId,producao:prod,meta:metaVal,savedBy:savedByName}),style:{background:"#e0e7ff",color:"#4338ca",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,fontWeight:600}},"✏"),
                    el("button",{onClick:()=>setObsRec({...r,machineId:mId,producao:prod,meta:metaVal,savedBy:savedByName}),title:"Observação",style:{background:r.obs?"#e0f2fe":"#f0fdf4",color:r.obs?"#0369a1":"#16a34a",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,fontWeight:600}},"💬"),
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

  // ── tab metas ──
  const tabMetas = el("div",null,
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px #0001",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",{style:{fontWeight:700,fontSize:15}},"🎯 Metas por Máquina"),
        el("button",{onClick:()=>setMetaEdit(!metaEdit),style:{background:metaEdit?"#22c55e22":"#ffffff22",border:`1px solid ${metaEdit?"#22c55e":"#ffffff44"}`,color:metaEdit?"#86efac":"#fff",borderRadius:7,padding:"5px 14px",cursor:"pointer",fontSize:13,fontWeight:600}},
          metaEdit?"✔ Salvo automaticamente":"✏ Editar Metas"
        )
      ),
      el("table",{style:{width:"100%",borderCollapse:"collapse"}},
        el("thead",null,el("tr",{style:{background:"#e0e7ff"}},
          el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:13,color:"#3730a3"}},"MÁQUINA"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,color:"#3730a3"}},"META / TURNO"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,color:"#3730a3"}},"META / DIA"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,color:"#3730a3"}},"META / MÊS (22 dias)")
        )),
        el("tbody",null,...MACHINES.map((m,i)=>
          el("tr",{key:m.id,style:{background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #e5e7eb"}},
            el("td",{style:{padding:"9px 14px",fontSize:13,fontWeight:600,color:C.navy}},
              m.name,!m.hasMeta&&el("span",{style:{marginLeft:6,fontSize:11,color:C.gray,fontWeight:400}},"sem meta")
            ),
            el("td",{style:{padding:"7px 14px",textAlign:"center"}},
              metaEdit&&m.hasMeta
                ?el("input",{type:"number",min:"0",value:metas[m.id]??0,onChange:e=>updateMeta(m.id,e.target.value),style:{...IS,width:100,textAlign:"center",fontWeight:700,fontSize:15}})
                :el("span",{style:{fontSize:15,fontWeight:700,color:m.hasMeta?C.navy:"#9ca3af"}},m.hasMeta?(metas[m.id]||0).toLocaleString("pt-BR"):"—")
            ),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:14,color:"#374151"}},m.hasMeta?((metas[m.id]||0)*3).toLocaleString("pt-BR"):"—"),
            el("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:14,color:"#374151"}},m.hasMeta?((metas[m.id]||0)*3*22).toLocaleString("pt-BR"):"—")
          )
        ))
      ),
      el("div",{style:{padding:"12px 16px",background:"#f8fafc",borderTop:"1px solid #e5e7eb",fontSize:12,color:C.gray}},
        "💡 Metas ficam salvas neste navegador. Clique em ",el("b",null,"Editar Metas")," para alterar."
      )
    )
  );

  // ── tab feedbacks ──
  const tabFeedbacks = el("div",null,
    el("div",{style:{background:"#fff",borderRadius:12,padding:14,boxShadow:"0 1px 4px #0001",marginBottom:14,display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}},
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"DE"),el("input",{type:"date",value:dfIni,onChange:e=>setDfIni(e.target.value),style:{...IS,width:"auto"}})),
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"ATÉ"),el("input",{type:"date",value:dfFim,onChange:e=>setDfFim(e.target.value),style:{...IS,width:"auto"}})),
      el("div",null,el("div",{style:{fontSize:11,color:C.gray,marginBottom:3,fontWeight:600}},"MÁQUINA"),
        el("select",{value:dfMac,onChange:e=>setDfMac(e.target.value),style:{...SS,maxWidth:200,width:"auto"}},
          el("option",{value:"TODAS"},"TODAS"),
          ...MACHINES.map(m=>el("option",{key:m.id,value:m.name},m.name))
        )
      ),
      el("div",{style:{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}},
        el("div",{style:{background:C.blue+"11",border:`1px solid ${C.blue}33`,borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,color:C.blue}},
          `${feedbacksData.length} observaç${feedbacksData.length!==1?"ões":"ão"}`
        )
      )
    ),
    feedbacksData.length===0
      ? el("div",{style:{background:"#fff",borderRadius:12,padding:60,textAlign:"center",boxShadow:"0 1px 4px #0001"}},
          el("div",{style:{fontSize:52,marginBottom:14}},"💬"),
          el("div",{style:{fontSize:17,fontWeight:700,color:C.navy,marginBottom:6}},"Nenhuma observação no período"),
          el("div",{style:{fontSize:13,color:C.gray}},"Adicione observações nos apontamentos pelo ",el("b",null,"Histórico")," (botão 💬 em cada linha)")
        )
      : el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}},
          ...feedbacksData.map(r=>{
            const mac=MACHINES.find(m=>m.id===Number(r.machineId));
            const prod=num(r.producao);
            const savedMeta=num(r.meta);
            const metaVal=savedMeta>0?savedMeta:(mac?.hasMeta?(metas[r.machineId]||0):0);
            const pct=mac?.hasMeta&&metaVal>0?Math.round(prod/metaVal*100):null;
            const savedByName=r.savedBy||"";
            const regBy   = r.editUser || r.savedBy || "—";
            const regDate = r.editTime ? dispDH(r.editTime) : dispDH(r.savedAt);
            return el("div",{key:r.id||r.date+"_"+r.turno+"_"+r.machineId,style:{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 4px #0001",borderLeft:`4px solid ${C.blue}`,display:"flex",flexDirection:"column",gap:10}},
              el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}},
                el("div",null,
                  el("div",{style:{fontWeight:700,fontSize:14,color:C.navy}},r.machineName||(mac?.name||"—")),
                  el("div",{style:{fontSize:12,color:C.gray,marginTop:2}},`📅 Apontamento: ${dispD(r.date)} · ${r.turno}`)
                ),
                pct!==null&&el("span",{style:{background:pctCol(pct)+"22",color:pctCol(pct),borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}},`${pct}%`)
              ),
              el("div",{style:{background:"#eff6ff",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#1e40af",lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}},r.obs),
              el("div",{style:{borderTop:"1px solid #f1f5f9",paddingTop:8,display:"flex",flexDirection:"column",gap:6}},
                el("div",{style:{fontSize:11,color:"#6b7280"}},
                  el("span",null,`👤 Registrado por ${regBy} em ${regDate}`)),
                el("div",{style:{display:"flex",gap:6,justifyContent:"flex-end"}},
                  el("button",{onClick:()=>setObsRec({...r,machineId:Number(r.machineId),producao:prod,meta:metaVal,savedBy:savedByName}),style:{background:"#e0f2fe",color:"#0369a1",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"✏ Editar"),
                  el("button",{onClick:()=>setDeleteRec({...r,machineId:Number(r.machineId)}),style:{background:C.red+"22",color:C.red,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"🗑 Excluir")
                )
              )
            );
          })
        )
  );

  return el("div",{style:{fontFamily:"'Segoe UI',sans-serif",background:"#f1f5f9",minHeight:"100vh"}},
    editRec&&el(EditModal,{rec:editRec,metas,onSave:handleEdit,onClose:()=>setEditRec(null),saving:editSaving}),
    deleteRec&&el(DeleteModal,{rec:deleteRec,onConfirm:handleDelete,onClose:()=>setDeleteRec(null),deleting}),
    obsRec&&el(ObsModal,{rec:obsRec,onSave:handleSaveObs,onClose:()=>setObsRec(null),saving:obsSaving}),
    showAdmin&&el(AdminPanel,{user,onClose:()=>setShowAdmin(false)}),
    header, tabs,
    el("div",{style:{padding:isMobile?10:20}},
      tab==="entrada"&&tabEntrada,
      tab==="dashboard"&&tabDashboard,
      tab==="historico"&&tabHistorico,
      tab==="metas"&&tabMetas,
      tab==="feedbacks"&&tabFeedbacks
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));