// ─── CONFIGURE AQUI ───────────────────────────────────────────
const SCRIPT_URL  = "https://script.google.com/macros/s/AKfycbwcezyD7ToulazvzNl2b3MCafnhKk7XMCgycdOipZq0M51-xH15JdJQ_ZLN18rDDYrXNA/exec";
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
const dispDT = s=>{ 
  if(!s) return "";
  try {
    // Tenta parsear formato brasileiro "DD/MM/YYYY HH:MM:SS"
    if(s.includes("/")) return s;
    // Se for ISO, converte
    const date = new Date(s);
    if(isNaN(date.getTime())) return s;
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return s;
  }
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
  const res     = await fetch(url);
  if(!res.ok) throw new Error("HTTP "+res.status);
  const j = await res.json();
  
  // ✅ Tratar erro de sessão expirada
  if(!j.ok && j.error && j.error.includes("Sessão")) {
    // Limpar sessão local
    clearSession();
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }
  
  if(!j.ok) throw new Error(j.error||"Erro no servidor");
  return j;
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
          el("input",{value:codigo,onChange:e=>setCodigo(e.target.value),placeholder:"Código fornecido pelo administrador",style:{...IS,width:"100%"}}),
          el("div",{style:{fontSize:11,color:C.gray,marginTop:3}},"Solicite ao administrador caso não tenha.")
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

// ─── PAINEL ADMIN ─────────────────────────────────────────────
function AdminPanel({user,onClose}){
  const [users,setUsers]    =useState([]);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]        =useState({type:"",text:""});
  const [rTarget,setRTarget]=useState("");
  const [newPw,setNewPw]    =useState("");
  const [resetting,setResetting]=useState(false);

  useEffect(()=>{
    api("listUsers",{token:user.token})
      .then(r=>setUsers(r.users||[]))
      .catch(e=>setMsg({type:"error",text:e.message}))
      .finally(()=>setLoading(false));
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

// ─── APP PRINCIPAL ────────────────────────────────────────────
function App(){
  const [user,setUser]           = useState(()=>loadSession());
  const [metas,setMetasState]    = useState(loadMetas);
  const [records,setRecords]     = useState([]);
  const [tab,setTab]             = useState("entrada");
  const [entryDate,setEntryDate] = useState(today());
  const [entryTurno,setEntryTurno]=useState("TURNO 1");
  const [inputs,setInputs]       = useState({});
  const [syncSt,setSyncSt]       = useState(null);
  const [loading,setLoading]     = useState(false);
  const [lastSync,setLastSync]   = useState(null);
  const [editRec,setEditRec]     = useState(null);
  const [deleteRec,setDeleteRec] = useState(null);
  const [editSaving,setEditSaving]=useState(false);
  const [deleting,setDeleting]   = useState(false);
  const [showAdmin,setShowAdmin] = useState(false);
  const [dfIni,setDfIni]         = useState(()=>{ const d=new Date(); d.setDate(1); return fmt(d); });
  const [dfFim,setDfFim]         = useState(today());
  const [dfMac,setDfMac]         = useState("TODAS");
  const [dfTur,setDfTur]         = useState("TODOS");
  const [dView,setDView]         = useState("resumo");
  const [metaEdit,setMetaEdit]   = useState(false);
  const pollRef=useRef(null);

  function updateMeta(id,val){ const m={...metas,[id]:num(val)}; setMetasState(m); saveMetas(m); }

  const loadAll=useCallback(async(silent=false)=>{
    if(!silent) setLoading(true);
    try{
      const r=await api("getAll",{},user);
      console.log("=== DADOS CARREGADOS ===");
      console.log("Total de registros retornados:", r.data?.length || 0);
      if(r.data && r.data.length > 0) {
        console.log("Primeiro registro:", r.data[0]);
        console.log("Tipo de date:", typeof r.data[0].date);
        console.log("Valor de date:", r.data[0].date);
      }
      setRecords(r.data||[]);
      setLastSync(new Date());
    }catch(e){
      console.error("Erro ao carregar dados:", e);
      if(!silent) setSyncSt("error");
      // Se sessão expirou, fazer logout
      if(e.message.includes("sessão")) {
        handleLogout();
      }
    }
    finally{ if(!silent) setLoading(false); }
  },[user]);

  useEffect(()=>{
    if(user){ 
      loadAll(); 
      pollRef.current=setInterval(()=>loadAll(true),10000); // 10 segundos
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

  async function handleSave(){
    const currentDate  = entryDate;
    const currentTurno = entryTurno;
    const currentInputs= {...inputs};
    const currentMetas = {...metas};
    
    const timestamp = nowBR();
    
    setSyncSt("syncing");
    const toSend=[];
    MACHINES.forEach(m=>{
      const k=cellKey(m.id,currentDate,currentTurno);
      const val=currentInputs[k];
      if(val===undefined||val==="") return;
      const metaVal = m.hasMeta ? (currentMetas[m.id] || m.defaultMeta || 0) : 0;
      toSend.push({
        date:currentDate,  // Mantém formato ISO: YYYY-MM-DD
        turno:currentTurno,
        machineId:m.id,
        machineName:m.name,
        meta:metaVal,
        producao:num(val),
        savedBy:user.nome,
        savedAt:timestamp,  // Timestamp completo em PT-BR
        editUser:"",
        editTime:""
      });
    });
    
    if(!toSend.length){ 
      setSyncSt(null); 
      return; 
    }
    try{
      for(let i=0;i<toSend.length;i+=4) await api("upsert",{records:toSend.slice(i,i+4)},user);
      setInputs(prev=>{ const next={...prev}; toSend.forEach(r=>delete next[cellKey(r.machineId,r.date,r.turno)]); return next; });
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
      
      console.log("Editando registro:", recordToSave);
      
      const result = await api("upsert",{records:[recordToSave]},user);
      
      console.log("Resultado da edição:", result);
      
      if(!result.ok) {
        throw new Error(result.error || "Erro ao editar");
      }
      
      console.log("Registro editado com sucesso, recarregando dados...");
      await loadAll(true); 
      setEditRec(null);
      
      // Feedback visual
      setSyncSt("ok");
      setTimeout(()=>setSyncSt(null), 2000);
    }catch(e){ 
      console.error("Erro ao editar:", e);
      alert("Erro ao editar: "+e.message);
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
      date: deleteRec.date,
      turno: deleteRec.turno,
      machineId: Number(deleteRec.machineId)
    };
    
    console.log("Tentando deletar:", deleteParams);
    
    try{ 
      const result = await api("delete", deleteParams, user); 
      
      console.log("Resultado da deleção:", result);
      
      if(!result.ok) {
        throw new Error(result.error || "Erro ao excluir");
      }
      
      console.log("Registro deletado com sucesso, recarregando dados...");
      await loadAll(true); 
      setDeleteRec(null); 
      
      // Feedback visual
      setSyncSt("ok");
      setTimeout(()=>setSyncSt(null), 2000);
    }
    catch(e){ 
      console.error("Erro ao excluir:", e);
      alert("Erro ao excluir: "+e.message); 
      setSyncSt("error");
      setTimeout(()=>setSyncSt(null), 3000);
    }
    finally{ setDeleting(false); }
  }

  async function handleLogout(){ 
    // ✅ Invalidar token no backend
    try {
      if(user?.token) {
        await api("logout", {}, user);
      }
    } catch(e) {
      console.error("Erro ao fazer logout:", e);
    }
    clearSession(); 
    setUser(null); 
    setRecords([]); 
    clearInterval(pollRef.current); 
  }

  const dashData=useMemo(()=>{
    const dI=dfIni; // Já está em formato ISO: YYYY-MM-DD
    const dF=dfFim; // Já está em formato ISO: YYYY-MM-DD
    
    console.log("=== FILTRO DASHBOARD ===");
    console.log("Data DE:", dI);
    console.log("Data ATÉ:", dF);
    console.log("Turno:", dfTur);
    console.log("Máquina:", dfMac);
    console.log("Total records:", records.length);
    
    const filtered = records.filter(r=>{
      if(!r.date) {
        console.log("Registro sem data:", r);
        return false;
      }
      
      // Normaliza a data do registro para formato ISO (YYYY-MM-DD)
      const recDate = normDate(r.date);
      
      // Debug primeiro registro
      if(records.indexOf(r) === 0) {
        console.log("Primeiro registro:");
        console.log("  r.date original:", r.date);
        console.log("  normDate(r.date):", recDate);
        console.log("  Passa filtro date?:", recDate >= dI && recDate <= dF);
        console.log("  Passa filtro turno?:", dfTur === "TODOS" || r.turno === dfTur);
      }
      
      if(!recDate) {
        console.log("normDate retornou null para:", r.date);
        return false;
      }
      
      // Compara strings no formato ISO
      if(recDate < dI || recDate > dF) return false;
      if(dfTur!=="TODOS" && r.turno!==dfTur) return false;
      if(dfMac!=="TODAS"){ 
        const mac=MACHINES.find(m=>m.id===Number(r.machineId)); 
        if(!mac || mac.name!==dfMac) return false; 
      }
      return true;
    });
    
    console.log("Registros filtrados:", filtered.length);
    
    return filtered;
  },[records,dfIni,dfFim,dfTur,dfMac]);

  // Filtro separado para histórico com mesmas regras
  const histData=useMemo(()=>{
    const dI=dfIni; // Já está em formato ISO: YYYY-MM-DD
    const dF=dfFim; // Já está em formato ISO: YYYY-MM-DD
    
    return records.filter(r=>{
      if(!r.date) return false;
      
      // Normaliza a data do registro para formato ISO (YYYY-MM-DD)
      const recDate = normDate(r.date);
      if(!recDate) return false;
      
      // Compara strings no formato ISO
      if(recDate < dI || recDate > dF) return false;
      if(dfTur!=="TODOS" && r.turno!==dfTur) return false;
      if(dfMac!=="TODAS"){ 
        const mac=MACHINES.find(m=>m.id===Number(r.machineId)); 
        if(!mac || mac.name!==dfMac) return false; 
      }
      return true;
    });
  },[records,dfIni,dfFim,dfTur,dfMac]);

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
  const pendingCount=MACHINES.filter(m=>{ const k=cellKey(m.id,entryDate,entryTurno); return inputs[k]!==undefined&&inputs[k]!==""; }).length;
  const otherPendingKeys=Object.keys(inputs).filter(k=>{
    const idx=k.indexOf("_"); if(idx<0) return false;
    const rest=k.slice(idx+1);
    const idx2=rest.indexOf("_"); if(idx2<0) return false;
    const d=rest.slice(0,idx2); const t=rest.slice(idx2+1);
    return (d!==entryDate||t!==entryTurno)&&inputs[k]!=="";
  });
  const otherPendingDates=[...new Set(otherPendingKeys.map(k=>{
    const idx=k.indexOf("_"); const rest=k.slice(idx+1); const idx2=rest.indexOf("_");
    return `${dispD(rest.slice(0,idx2))} - ${rest.slice(idx2+1)}`;
  }))];

  if(!user) return el(AuthScreen,{onLogin:u=>{ saveSession(u); setUser(u); }});

  // ── header ──
  const header = el("div",{style:{background:"linear-gradient(135deg,#1e3a5f,#2563eb)",padding:"13px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}},
    el("div",null,
      el("div",{style:{color:"#fff",fontSize:20,fontWeight:700}},"🏭 Dashboard de Produção"),
      el("div",{style:{color:"#93c5fd",fontSize:12}},`👤 ${user.nome} · `,(lastSync?`Sync: ${lastSync.toLocaleTimeString("pt-BR")}`:"Conectando..."),loading?" ⏳":"")
    ),
    el("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}},
      syncSt==="syncing"&&el("span",{style:{color:"#fde68a",fontSize:13}},"⏳ Salvando..."),
      syncSt==="ok"    &&el("span",{style:{color:"#86efac",fontSize:13}},"✔ Salvo!"),
      syncSt==="error" &&el("span",{style:{color:"#fca5a5",fontSize:13}},"✘ Erro!"),
      el("button",{onClick:()=>loadAll(),style:{background:"#ffffff22",border:"1px solid #ffffff44",color:"#fff",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12}},"🔄"),
      user.role==="admin"&&el("button",{onClick:()=>setShowAdmin(true),style:{background:"#f59e0b22",border:"1px solid #f59e0b66",color:"#fde68a",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}},"⚙ Admin"),
      el("button",{onClick:handleLogout,style:{background:"#ffffff11",border:"1px solid #ffffff33",color:"#fca5a5",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12}},"Sair")
    )
  );

  // ── tabs ──
  const tabs = el("div",{style:{background:C.navy,display:"flex",paddingLeft:18,overflowX:"auto"}},
    ...[["entrada","📝 Apontamento"],["dashboard","📊 Dashboard"],["historico","📋 Histórico"],["metas","🎯 Metas"]].map(([k,l])=>
      el("button",{key:k,onClick:()=>setTab(k),style:{padding:"10px 18px",border:"none",cursor:"pointer",whiteSpace:"nowrap",fontWeight:tab===k?700:400,background:tab===k?"#f1f5f9":"transparent",color:tab===k?C.navy:"#93c5fd",borderRadius:tab===k?"8px 8px 0 0":0,fontSize:14}},l)
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
        ,otherPendingDates.length>0&&el("div",{style:{fontSize:11,color:"#92400e",fontWeight:600,textAlign:"center",background:"#fef3c7",borderRadius:6,padding:"3px 8px",marginTop:2}},`⚠ Rascunho em: ${otherPendingDates.join(", ")}`)
      )
    ),
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px #0001",overflow:"hidden"}},
      el("table",{style:{width:"100%",borderCollapse:"collapse"}},
        el("thead",null,el("tr",{style:{background:C.navy,color:"#fff"}},
          el("th",{style:{padding:"11px 14px",textAlign:"left",  fontSize:13}},"MÁQUINA"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,width:120}},"META/TURNO"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,width:160}},"PRODUÇÃO"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,width:100}},"% META"),
          el("th",{style:{padding:"11px 14px",textAlign:"center",fontSize:13,width:90}},"STATUS")
        )),
        el("tbody",null,...MACHINES.map((m,i)=>{
          const k=cellKey(m.id,entryDate,entryTurno);
          const val=getVal(m.id);
          const isLocal=inputs[k]!==undefined;
          const isSaved=!isLocal&&records.some(r=>Number(r.machineId)===m.id&&r.date===entryDate&&r.turno===entryTurno);
          const metaVal=metas[m.id]||0;
          const pct=m.hasMeta&&val!==""?Math.round(num(val)/metaVal*100):null;
          const col=pctCol(pct);
          return el("tr",{key:m.id,style:{background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #e5e7eb"}},
            el("td",{style:{padding:"8px 14px",fontSize:13,fontWeight:600,color:C.navy}},m.name,!m.hasMeta&&el("span",{style:{marginLeft:6,fontSize:11,color:C.gray,fontWeight:400}},"sem meta")),
            el("td",{style:{padding:"8px 14px",textAlign:"center",fontSize:14,color:"#374151"}},m.hasMeta?metaVal.toLocaleString("pt-BR"):el("span",{style:{color:"#9ca3af"}},"—")),
            el("td",{style:{padding:"6px 14px",textAlign:"center"}},
              el("input",{type:"number",min:"0",placeholder:"0",value:val,onChange:e=>setVal(m.id,e.target.value),style:{...IS,width:110,textAlign:"center",fontSize:15,fontWeight:700,borderColor:isLocal?C.yellow:isSaved?C.blue:"#d1d5db",borderWidth:isLocal||isSaved?2:1}})
            ),
            el("td",{style:{padding:"8px 14px",textAlign:"center"}},
              pct!==null?el("span",{style:{background:col+"22",color:col,borderRadius:20,padding:"3px 10px",fontSize:13,fontWeight:700}},`${pct}%`):
              val!==""?el("span",{style:{background:"#e0e7ff",color:"#4338ca",borderRadius:20,padding:"3px 10px",fontSize:13,fontWeight:700}},`${num(val).toLocaleString("pt-BR")} pç`):
              el("span",{style:{color:"#d1d5db"}},"—")
            ),
            el("td",{style:{padding:"8px 14px",textAlign:"center",fontSize:12}},
              isLocal?el("span",{style:{color:C.yellow,fontWeight:700}},"● pendente"):
              isSaved?el("span",{style:{color:C.green,fontWeight:700}},"✔ salvo"):
              el("span",{style:{color:"#d1d5db"}},"—")
            )
          );
        }))
      )
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
      el("table",{style:{width:"100%",borderCollapse:"collapse"}},
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
      el("table",{style:{width:"100%",borderCollapse:"collapse"}},
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
    ),
    dView==="graficos"&&el("div",null,
      // ══════════════════════════════════════════════════════════════
      // GRÁFICOS INTERATIVOS - IMPLEMENTAÇÃO SVG NATIVA (SEM DEPENDÊNCIAS)
      // ══════════════════════════════════════════════════════════════
      
      (() => {
        // ─── COMPONENTE: Gráfico de Barras SVG ───
        const BarChartSVG = ({data, width=500, height=300, title, subtitle}) => {
          if(!data || data.length === 0) return null;
          
          const padding = {top:40, right:20, bottom:60, left:60};
          const chartWidth = width - padding.left - padding.right;
          const chartHeight = height - padding.top - padding.bottom;
          
          const maxValue = Math.max(...data.flatMap(d => [d.value1 || 0, d.value2 || 0]));
          const scale = chartHeight / (maxValue * 1.1);
          const barWidth = chartWidth / data.length / 2.5;
          
          const [hoveredBar, setHoveredBar] = useState(null);
          
          return el("div",{style:{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 1px 4px #0001"}},
            title && el("div",{style:{marginBottom:16}},
              el("div",{style:{fontSize:16,fontWeight:700,color:C.navy}},title),
              subtitle && el("div",{style:{fontSize:12,color:C.gray,marginTop:2}},subtitle)
            ),
            el("svg",{width,height,style:{overflow:"visible"}},
              // Grid horizontal
              ...[0,0.25,0.5,0.75,1].map(pct => {
                const y = padding.top + chartHeight - (chartHeight * pct);
                const value = Math.round(maxValue * pct);
                return el("g",{key:pct},
                  el("line",{x1:padding.left,y1:y,x2:width-padding.right,y2:y,stroke:"#f0f0f0",strokeWidth:1}),
                  el("text",{x:padding.left-10,y:y+5,textAnchor:"end",fontSize:11,fill:"#666"},value.toLocaleString("pt-BR"))
                );
              }),
              
              // Barras
              ...data.map((d, i) => {
                const x = padding.left + (i * chartWidth / data.length);
                const h1 = (d.value1 || 0) * scale;
                const h2 = (d.value2 || 0) * scale;
                
                return el("g",{key:i},
                  // Barra 1 (Meta/Cinza)
                  d.value1 && el("rect",{
                    x: x + 10,
                    y: padding.top + chartHeight - h1,
                    width: barWidth,
                    height: h1,
                    fill: hoveredBar === `${i}-1` ? "#9ca3af" : C.gray,
                    rx: 4,
                    style:{cursor:"pointer",transition:"fill 0.2s"},
                    onMouseEnter: () => setHoveredBar(`${i}-1`),
                    onMouseLeave: () => setHoveredBar(null)
                  }),
                  
                  // Barra 2 (Produção/Azul)
                  d.value2 && el("rect",{
                    x: x + 10 + barWidth + 5,
                    y: padding.top + chartHeight - h2,
                    width: barWidth,
                    height: h2,
                    fill: hoveredBar === `${i}-2` ? "#60a5fa" : C.blue,
                    rx: 4,
                    style:{cursor:"pointer",transition:"fill 0.2s"},
                    onMouseEnter: () => setHoveredBar(`${i}-2`),
                    onMouseLeave: () => setHoveredBar(null)
                  }),
                  
                  // Label
                  el("text",{
                    x: x + (chartWidth / data.length) / 2,
                    y: height - padding.bottom + 20,
                    textAnchor: "middle",
                    fontSize: 11,
                    fill: "#374151",
                    transform: `rotate(-15, ${x + (chartWidth / data.length) / 2}, ${height - padding.bottom + 20})`
                  }, d.label)
                );
              }),
              
              // Tooltip
              hoveredBar && (() => {
                const [idx, barNum] = hoveredBar.split('-');
                const d = data[idx];
                const value = barNum === '1' ? d.value1 : d.value2;
                const name = barNum === '1' ? (d.name1 || "Meta") : (d.name2 || "Produção");
                
                return el("g",null,
                  el("rect",{x:10,y:10,width:150,height:50,fill:"#fff",stroke:"#e5e7eb",rx:8,filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.1))"}),
                  el("text",{x:20,y:30,fontSize:12,fontWeight:700,fill:C.navy},d.label),
                  el("text",{x:20,y:50,fontSize:12,fill:"#666"},`${name}: ${value.toLocaleString("pt-BR")}`)
                );
              })()
            ),
            // Legenda
            el("div",{style:{display:"flex",justifyContent:"center",gap:16,marginTop:12}},
              el("div",{style:{display:"flex",alignItems:"center",gap:6}},
                el("div",{style:{width:12,height:12,borderRadius:2,background:C.gray}}),
                el("span",{style:{fontSize:12,color:"#374151"}},data[0]?.name1 || "Meta")
              ),
              el("div",{style:{display:"flex",alignItems:"center",gap:6}},
                el("div",{style:{width:12,height:12,borderRadius:2,background:C.blue}}),
                el("span",{style:{fontSize:12,color:"#374151"}},data[0]?.name2 || "Produção")
              )
            )
          );
        };
        
        // ─── COMPONENTE: Gráfico de Pizza SVG ───
        const PieChartSVG = ({data, width=300, height=300, title, subtitle}) => {
          if(!data || data.length === 0) return null;
          
          const cx = width / 2;
          const cy = height / 2;
          const radius = Math.min(width, height) / 2 - 40;
          
          const total = data.reduce((sum, d) => sum + d.value, 0);
          const colors = [C.blue, C.green, C.yellow, C.purple, C.teal];
          
          const [hoveredSlice, setHoveredSlice] = useState(null);
          
          let currentAngle = -90;
          const slices = data.map((d, i) => {
            const angle = (d.value / total) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            return {
              ...d,
              startAngle,
              endAngle: currentAngle,
              color: colors[i % colors.length],
              pct: Math.round((d.value / total) * 100)
            };
          });
          
          const polarToCartesian = (angle) => {
            const rad = (angle * Math.PI) / 180;
            return {
              x: cx + radius * Math.cos(rad),
              y: cy + radius * Math.sin(rad)
            };
          };
          
          return el("div",{style:{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 1px 4px #0001"}},
            title && el("div",{style:{marginBottom:16}},
              el("div",{style:{fontSize:16,fontWeight:700,color:C.navy}},title),
              subtitle && el("div",{style:{fontSize:12,color:C.gray,marginTop:2}},subtitle)
            ),
            el("svg",{width,height},
              ...slices.map((slice, i) => {
                const start = polarToCartesian(slice.startAngle);
                const end = polarToCartesian(slice.endAngle);
                const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
                
                const path = [
                  `M ${cx} ${cy}`,
                  `L ${start.x} ${start.y}`,
                  `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
                  'Z'
                ].join(' ');
                
                const midAngle = (slice.startAngle + slice.endAngle) / 2;
                const labelPos = polarToCartesian(midAngle);
                const labelX = cx + (radius * 0.7) * Math.cos((midAngle * Math.PI) / 180);
                const labelY = cy + (radius * 0.7) * Math.sin((midAngle * Math.PI) / 180);
                
                return el("g",{key:i},
                  el("path",{
                    d: path,
                    fill: hoveredSlice === i ? slice.color + "cc" : slice.color,
                    stroke: "#fff",
                    strokeWidth: 2,
                    style:{cursor:"pointer",transition:"fill 0.2s"},
                    onMouseEnter: () => setHoveredSlice(i),
                    onMouseLeave: () => setHoveredSlice(null)
                  }),
                  el("text",{
                    x: labelX,
                    y: labelY,
                    textAnchor: "middle",
                    fontSize: 12,
                    fontWeight: 700,
                    fill: "#fff"
                  }, `${slice.pct}%`)
                );
              })
            ),
            el("div",{style:{display:"flex",justifyContent:"center",gap:16,marginTop:12,flexWrap:"wrap"}},
              ...slices.map((s, i) => 
                el("div",{key:i,style:{display:"flex",alignItems:"center",gap:6}},
                  el("div",{style:{width:12,height:12,borderRadius:2,background:s.color}}),
                  el("span",{style:{fontSize:12,color:"#374151"}},`${s.label}: ${s.value.toLocaleString("pt-BR")} (${s.pct}%)`)
                )
              )
            )
          );
        };
        
        // ─── COMPONENTE: Gráfico de Linhas SVG ───
        const LineChartSVG = ({data, width=500, height=300, title, subtitle}) => {
          if(!data || data.length === 0) return null;
          
          const padding = {top:40, right:20, bottom:60, left:60};
          const chartWidth = width - padding.left - padding.right;
          const chartHeight = height - padding.top - padding.bottom;
          
          const maxValue = Math.max(...data.flatMap(d => [d.value1 || 0, d.value2 || 0]));
          const scale = chartHeight / (maxValue * 1.1);
          
          const [hoveredPoint, setHoveredPoint] = useState(null);
          
          const points1 = data.map((d, i) => ({
            x: padding.left + (i * chartWidth / (data.length - 1 || 1)),
            y: padding.top + chartHeight - (d.value1 || 0) * scale
          }));
          
          const points2 = data.map((d, i) => ({
            x: padding.left + (i * chartWidth / (data.length - 1 || 1)),
            y: padding.top + chartHeight - (d.value2 || 0) * scale
          }));
          
          const pathData1 = points1.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const pathData2 = points2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          
          return el("div",{style:{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 1px 4px #0001"}},
            title && el("div",{style:{marginBottom:16}},
              el("div",{style:{fontSize:16,fontWeight:700,color:C.navy}},title),
              subtitle && el("div",{style:{fontSize:12,color:C.gray,marginTop:2}},subtitle)
            ),
            el("svg",{width,height,style:{overflow:"visible"}},
              // Grid
              ...[0,0.25,0.5,0.75,1].map(pct => {
                const y = padding.top + chartHeight - (chartHeight * pct);
                return el("line",{key:pct,x1:padding.left,y1:y,x2:width-padding.right,y2:y,stroke:"#f0f0f0",strokeWidth:1});
              }),
              
              // Linha 1 (Meta - pontilhada)
              el("path",{
                d: pathData1,
                fill: "none",
                stroke: C.purple,
                strokeWidth: 2,
                strokeDasharray: "5 5"
              }),
              
              // Linha 2 (Produção - sólida)
              el("path",{
                d: pathData2,
                fill: "none",
                stroke: C.blue,
                strokeWidth: 3
              }),
              
              // Pontos
              ...points2.map((p, i) => 
                el("circle",{
                  key:i,
                  cx:p.x,
                  cy:p.y,
                  r:hoveredPoint===i?6:4,
                  fill:C.blue,
                  stroke:"#fff",
                  strokeWidth:2,
                  style:{cursor:"pointer",transition:"r 0.2s"},
                  onMouseEnter:()=>setHoveredPoint(i),
                  onMouseLeave:()=>setHoveredPoint(null)
                })
              ),
              
              // Labels X
              ...data.map((d, i) => {
                if(i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) return null;
                const x = padding.left + (i * chartWidth / (data.length - 1 || 1));
                return el("text",{
                  key:i,
                  x,
                  y:height - padding.bottom + 20,
                  textAnchor:"middle",
                  fontSize:11,
                  fill:"#374151",
                  transform:`rotate(-15, ${x}, ${height - padding.bottom + 20})`
                }, d.label);
              })
            )
          );
        };
        
        // ─── PREPARAR DADOS ───
        const prodVsMetaData = MACHINES
          .filter(m => dfMac === "TODAS" || m.name === dfMac)
          .filter(m => m.hasMeta)
          .map(m => {
            const agg = machAgg[m.id] || {};
            return {
              label: m.name.length > 15 ? m.name.substring(0, 13) + "..." : m.name,
              value1: agg.totalMeta || 0,
              value2: agg.totalProd || 0,
              name1: "Meta",
              name2: "Produção"
            };
          })
          .sort((a, b) => b.value2 - a.value2)
          .slice(0, 8);
        
        const turnoData = TURNOS.map(turno => ({
          label: turno,
          value: dashData.filter(r => r.turno === turno).reduce((sum, r) => sum + num(r.producao), 0)
        })).filter(t => t.value > 0);
        
        const tendenciaData = (() => {
          const byDate = {};
          dashData.forEach(r => {
            if(!byDate[r.date]) byDate[r.date] = {prod:0, meta:0};
            byDate[r.date].prod += num(r.producao);
          });
          
          return Object.keys(byDate).sort().map(date => ({
            label: dispD(date),
            value1: Object.values(machAgg).reduce((sum, agg) => {
              const metaDiaria = agg.totalMeta / (agg.diasCount || 1);
              return sum + (agg.byDate && agg.byDate[date] ? metaDiaria : 0);
            }, 0),
            value2: byDate[date].prod
          }));
        })();
        
        const performersData = MACHINES
          .filter(m => dfMac === "TODAS" || m.name === dfMac)
          .filter(m => m.hasMeta)
          .map(m => {
            const agg = machAgg[m.id] || {};
            return {
              label: m.name.length > 20 ? m.name.substring(0, 18) + "..." : m.name,
              value: agg.pct || 0,
              prod: agg.totalProd || 0
            };
          })
          .filter(m => m.prod > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);
        
        return el("div",null,
          el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(500px, 1fr))",gap:16,marginBottom:16}},
            prodVsMetaData.length > 0 && el(BarChartSVG,{
              data:prodVsMetaData,
              title:"📊 Produção vs Meta por Máquina",
              subtitle:"Comparativo entre produção real e meta estabelecida",
              width:550,
              height:320
            }),
            turnoData.length > 0 && el(PieChartSVG,{
              data:turnoData,
              title:"🎯 Distribuição de Produção por Turno",
              subtitle:"Percentual de produção em cada turno",
              width:550,
              height:320
            })
          ),
          el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(500px, 1fr))",gap:16}},
            tendenciaData.length > 0 && el(LineChartSVG,{
              data:tendenciaData,
              title:"📈 Tendência de Produção ao Longo do Tempo",
              subtitle:"Evolução diária da produção no período",
              width:550,
              height:320
            }),
            performersData.length > 0 && el("div",{style:{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 1px 4px #0001"}},
              el("div",{style:{marginBottom:16}},
                el("div",{style:{fontSize:16,fontWeight:700,color:C.navy}},"🏆 Ranking de Performance"),
                el("div",{style:{fontSize:12,color:C.gray,marginTop:2}},"Máquinas ordenadas por % da meta")
              ),
              ...performersData.map((m, i) => {
                const barColor = m.value >= 100 ? C.green : m.value >= 80 ? C.yellow : C.red;
                return el("div",{key:i,style:{marginBottom:10}},
                  el("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4}},
                    el("span",{style:{fontSize:12,fontWeight:600,color:C.navy}},m.label),
                    el("span",{style:{fontSize:12,fontWeight:700,color:barColor}},`${m.value}%`)
                  ),
                  el("div",{style:{background:"#e5e7eb",borderRadius:4,height:8,overflow:"hidden"}},
                    el("div",{style:{width:`${Math.min(m.value,100)}%`,height:"100%",background:barColor,borderRadius:4,transition:"width 0.4s"}})
                  )
                );
              })
            )
          ),
          prodVsMetaData.length === 0 && turnoData.length === 0 && 
          el("div",{style:{background:"#fff",borderRadius:12,padding:40,textAlign:"center"}},
            el("div",{style:{fontSize:48,marginBottom:12}},"📊"),
            el("div",{style:{fontSize:16,color:C.gray,fontWeight:600}},"Nenhum dado disponível para gráficos"),
            el("div",{style:{fontSize:13,color:"#9ca3af",marginTop:4}},"Ajuste os filtros ou adicione apontamentos")
          )
        );
      })()
    )
  );

  // ── tab histórico ──
  const tabHistorico = el("div",null,
    filterBar,
    el("div",{style:{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px #0001",overflow:"hidden"}},
      el("div",{style:{background:C.navy,color:"#fff",padding:"12px 16px",fontWeight:700,display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",null,"📋 Apontamentos Salvos"),
        el("span",{style:{fontSize:12,color:"#93c5fd"}},`${histData.length} registros`)
      ),
      el("div",{style:{overflowX:"auto"}},
        el("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:700}},
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
            histData.length===0&&el("tr",null,el("td",{colSpan:8,style:{padding:32,textAlign:"center",color:"#9ca3af"}},"Nenhum apontamento no período.")),
            ...[...histData].sort((a,b)=>b.date.localeCompare(a.date)||a.turno.localeCompare(b.turno)).map((r,i)=>{
              const mId=Number(r.machineId);
              const mac=MACHINES.find(m=>m.id===mId);
              
              // Usa a meta que foi salva no registro
              const savedMeta=num(r.meta);
              const metaVal = savedMeta > 0 ? savedMeta : (mac?.hasMeta ? (metas[mId] || mac.defaultMeta || 0) : 0);
              
              const prod=num(r.producao);
              const pct=mac?.hasMeta && metaVal > 0 ? Math.round(prod/metaVal*100) : null;
              
              // Pega o nome de quem salvou
              const savedByName = r.savedBy || r.usuario || r.user || "";
              
              return el("tr",{key:r.date+"_"+r.turno+"_"+mId+"_"+i,style:{background:i%2===0?"#f8fafc":"#fff",borderBottom:"1px solid #e5e7eb"}},
                el("td",{style:{padding:"9px 12px",fontSize:13,fontWeight:600}},dispDH(r.savedAt || r.date)),
                el("td",{style:{padding:"9px 12px",fontSize:13}},r.turno),
                el("td",{style:{padding:"9px 12px",fontSize:13,fontWeight:600,color:C.navy}},r.machineName||(mac?.name||"—")),
                el("td",{style:{padding:"9px 12px",textAlign:"center",fontSize:13,color:C.gray}},metaVal>0?metaVal.toLocaleString("pt-BR"):"—"),
                el("td",{style:{padding:"9px 12px",textAlign:"center",fontSize:14,fontWeight:700}},prod.toLocaleString("pt-BR")),
                el("td",{style:{padding:"9px 12px",textAlign:"center"}},pct!==null?el("span",{style:{background:pctCol(pct)+"22",color:pctCol(pct),borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}},`${pct}%`):el("span",{style:{color:"#d1d5db"}},"—")),
                el("td",{style:{padding:"9px 12px",fontSize:12,color:C.gray}},
                  el("div",{style:{fontWeight:600,color:"#374151"}},savedByName||"—"),
                  r.editUser&&el("div",{style:{fontSize:11,color:C.yellow,marginTop:2}},`✏ Editado por ${r.editUser}${r.editTime?" em "+dispDH(r.editTime):""}`)
                ),
                el("td",{style:{padding:"9px 12px",textAlign:"center"}},
                  el("div",{style:{display:"flex",gap:6,justifyContent:"center"}},
                    el("button",{onClick:()=>setEditRec({
                      ...r,
                      machineId:mId,
                      producao:prod,
                      meta:metaVal,
                      savedBy:savedByName
                    }),style:{background:"#e0e7ff",color:"#4338ca",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"✏ Editar"),
                    el("button",{onClick:()=>setDeleteRec({
                      ...r,
                      machineId:mId
                    }),style:{background:C.red+"22",color:C.red,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}},"🗑 Excluir")
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

  return el("div",{style:{fontFamily:"'Segoe UI',sans-serif",background:"#f1f5f9",minHeight:"100vh"}},
    editRec&&el(EditModal,{rec:editRec,metas,onSave:handleEdit,onClose:()=>setEditRec(null),saving:editSaving}),
    deleteRec&&el(DeleteModal,{rec:deleteRec,onConfirm:handleDelete,onClose:()=>setDeleteRec(null),deleting}),
    showAdmin&&el(AdminPanel,{user,onClose:()=>setShowAdmin(false)}),
    header, tabs,
    el("div",{style:{padding:20}},
      tab==="entrada"&&tabEntrada,
      tab==="dashboard"&&tabDashboard,
      tab==="historico"&&tabHistorico,
      tab==="metas"&&tabMetas
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));