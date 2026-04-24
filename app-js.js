const { useState, useEffect, useCallback } = React;

// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SB_URL = "https://laelsnqvajpbhmaeshoa.supabase.co/rest/v1";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZWxzbnF2YWpwYmhtYWVzaG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDI0OTQsImV4cCI6MjA5MjM3ODQ5NH0.voyevlz2pywjM9pZFpj_AgwJhrsGSNTg4092GfBHn4o";
const HDR = {
  "Content-Type": "application/json",
  "apikey": SB_KEY,
  "Authorization": `Bearer ${SB_KEY}`,
  "Accept": "application/json",
};

async function sbCall(method, table, params = "", body = null) {
  const url = `${SB_URL}/${table}${params ? "?" + params : ""}`;
  const opts = {
    method,
    headers: { ...HDR, ...((method==="POST"||method==="PATCH")?{"Prefer":"return=representation"}:{}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const r = await fetch(url, opts);
  if (!r.ok) { const t = await r.text(); throw new Error(`${r.status}: ${t}`); }
  if (method === "DELETE") return [];
  const txt = await r.text();
  return txt ? JSON.parse(txt) : [];
}

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const VENC_BASE = 7512.03;
const VALOR_PCT = 0.000333;
const MIN_PTS   = 1000;
const MAX_PTS   = 3000;
const MAX_EXC   = 1000;

const CATALOGO = [
  {id:"c01",item:"1",   pts:300, desc:"Informações tributárias – mandado de segurança / ações judiciais"},
  {id:"c02",item:"2.1", pts:120, desc:"Serviço fiscal básico – 1 exercício"},
  {id:"c03",item:"2.2", pts:140, desc:"Serviço fiscal básico – 2 exercícios"},
  {id:"c04",item:"2.3", pts:170, desc:"Serviço fiscal básico – 3 exercícios"},
  {id:"c05",item:"2.4", pts:200, desc:"Serviço fiscal básico – 4+ exercícios"},
  {id:"c06",item:"3.1", pts:10,  desc:"Verificação – livros contábeis (por exercício)"},
  {id:"c07",item:"3.2", pts:20,  desc:"Verificação – relatórios em geral"},
  {id:"c08",item:"3.3", pts:2,   desc:"Verificação – memorandos"},
  {id:"c09",item:"3.4", pts:5,   desc:"Verificação – contratos"},
  {id:"c10",item:"4.1", pts:130, desc:"Arbitramento – não atendimento / notificação"},
  {id:"c11",item:"4.2", pts:145, desc:"Arbitramento – documentos sem condição de conclusão"},
  {id:"c12",item:"4.3", pts:150, desc:"Cálculo por estimativa"},
  {id:"c13",item:"5",   pts:20,  desc:"Diligências por contribuinte"},
  {id:"c14",item:"6.1", pts:10,  desc:"Autorização – inscrição/alteração/cancelamento"},
  {id:"c15",item:"6.2", pts:10,  desc:"Autorização – enquadramento de atividade"},
  {id:"c16",item:"7.1", pts:20,  desc:"Notificação / intimação"},
  {id:"c17",item:"7.2", pts:20,  desc:"Termo de apreensão"},
  {id:"c18",item:"7.3", pts:20,  desc:"Auto de infração"},
  {id:"c19",item:"8.1", pts:200, desc:"Manifestação definitiva – pesquisa doutrina/jurisprudência"},
  {id:"c20",item:"8.2", pts:100, desc:"Manifestação definitiva – fundamentação legal"},
  {id:"c21",item:"9.1", pts:250, desc:"Informações fundamentadas – consulta jurídico-tributária"},
  {id:"c22",item:"9.2", pts:100, desc:"Informações fundamentadas – imunidade/isenção"},
  {id:"c23",item:"9.3", pts:60,  desc:"Informações fundamentadas – Regime Especial"},
  {id:"c24",item:"9.4", pts:20,  desc:"Pontuação adicional – defesa/recurso"},
  {id:"c25",item:"10.1",pts:150, desc:"Fiscalização especial – diurna (jornada integral)"},
  {id:"c26",item:"10.2",pts:75,  desc:"Fiscalização especial – período parcial"},
  {id:"c27",item:"10.3",pts:195, desc:"Fiscalização especial – noturna"},
  {id:"c28",item:"10.4",pts:300, desc:"Fiscalização – feriados ou finais de semana"},
  {id:"c29",item:"11.1",pts:150, desc:"Conferência DIPAM – jornada integral"},
  {id:"c30",item:"11.2",pts:75,  desc:"Conferência DIPAM – período parcial"},
  {id:"c31",item:"12.1",pts:20,  desc:"Emissão/cancelamento – Demonstrativo de Recolhimento"},
  {id:"c32",item:"13.1",pts:50,  desc:"Verificação subempreitada – construção civil"},
  {id:"c33",item:"13.2",pts:15,  desc:"Levantamento fiscal – mão-de-obra própria"},
  {id:"c34",item:"14",  pts:75,  desc:"Comissões / grupos de trabalho – sem prejuízo"},
  {id:"c35",item:"15",  pts:150, desc:"Comissões / grupos de trabalho – com prejuízo"},
  {id:"c36",item:"16.1",pts:150, desc:"Plantão fiscal – jornada integral"},
  {id:"c37",item:"16.2",pts:75,  desc:"Plantão fiscal – período parcial"},
  {id:"c38",item:"17",  pts:300, desc:"Elaboração de parecer técnico-científico"},
  {id:"c39",item:"18",  pts:50,  desc:"Monitoramento tomadores/prestadores"},
  {id:"c40",item:"19",  pts:20,  desc:"Inclusão/alteração/exclusão cadastral"},
  {id:"c41",item:"20.1",pts:20,  desc:"Vistoria – dados proprietário (por UA)"},
  {id:"c42",item:"20.2",pts:30,  desc:"Vistoria – Tipo/Padrão Construtivo (por UA)"},
  {id:"c43",item:"20.3",pts:15,  desc:"Vistoria – Área Construída (por m²)", esp:"m2"},
  {id:"c44",item:"21.1",pts:20,  desc:"Vistoria p/ processo – dados proprietário (por UA)"},
  {id:"c45",item:"21.2",pts:30,  desc:"Vistoria p/ processo – Tipo/Padrão (por UA)"},
  {id:"c46",item:"21.3",pts:15,  desc:"Vistoria p/ processo – Área Construída (por m²)", esp:"m2"},
  {id:"c47",item:"21.4",pts:25,  desc:"Vistoria p/ processo – confirmação de dados (por UA)"},
  {id:"c48",item:"22.1",pts:20,  desc:"Despacho/ficha – Cadastro Imobiliário Fiscal"},
  {id:"c49",item:"22.2",pts:20,  desc:"Desdobro/Englobamento – criação das unidades", esp:"unid"},
  {id:"c50",item:"22.3",pts:40,  desc:"Desdobro/Englobamento – dados avaliativos"},
  {id:"c51",item:"22.4",pts:40,  desc:"Identificação sujeito passivo IPTU"},
  {id:"c52",item:"23.1",pts:1,   desc:"Notificação ISSCC – a cada 50 FMPs lançados", esp:"fmp"},
  {id:"c53",item:"24",  pts:10,  desc:"Ficha de Lançamento / sistemas informatizados"},
  {id:"c54",item:"25",  pts:150, desc:"Pesquisa de Valores Imobiliários (por UA)"},
];

const UNID_COR   = {GFI:"#1d4ed8",GFM:"#7c3aed",GCF:"#059669",GATIF:"#d97706",DT:"#dc2626",ADMIN:"#64748b"};
const ROLE_LBL   = {admin:"Admin",diretor:"Diretor",gerente:"Gerente",encarregado:"Encarregado",colaborador:"Auditor"};
const STATUS_COR = {pend:"#f59e0b",ap_enc:"#3b82f6",ap_ger:"#10b981",rej:"#ef4444"};
const STATUS_LBL = {pend:"Aguard. Encarregado",ap_enc:"Aguard. Gerente",ap_ger:"Aprovado ✓",rej:"Rejeitado"};

const getComp = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const fmtComp = c => { const[y,m]=c.split("-"); return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+m-1]+"/"+y; };
const fmtBRL  = v => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

function calcPts(catId,f){
  const cat=CATALOGO.find(c=>c.id===catId); if(!cat)return 0;
  if(cat.esp==="m2"){const d=(parseFloat(f.m2Nova)||0)-(parseFloat(f.m2Atual)||0);return d>0?Math.round(d*cat.pts):0;}
  if(cat.esp==="unid")return(parseInt(f.qtdUnid)||0)*cat.pts;
  if(cat.esp==="fmp"){const t=parseFloat(f.fmpTot)||0,v=parseFloat(f.fmpVal)||0;return v?Math.floor((t/v)/50)*cat.pts:0;}
  return cat.pts*(parseInt(f.qtd)||1);
}
function calcRes(base,exc){
  const total=base+exc;
  if(total<MIN_PTS)return{total,efetivos:0,excedente:0};
  return{total,efetivos:Math.min(total,MAX_PTS),excedente:Math.min(Math.max(total-MAX_PTS,0),MAX_EXC)};
}
function calcGPFI(ef,vb){return ef*vb*VALOR_PCT;}
function rowToUser(r){return{id:r.id,nome:r.nome,mat:r.mat,email:r.email,cargo:r.cargo,role:r.role,unid:r.unid,vb:parseFloat(r.vb),pw:r.pw,ativo:r.ativo};}
function rowToTarefa(r){return{id:r.id,userId:r.user_id,comp:r.comp,catId:r.cat_id,desc:r.descricao,pts:r.pts,qtd:r.qtd,data:r.data,obs:r.obs,status:r.status,m2Atual:r.m2_atual,m2Nova:r.m2_nova,qtdUnid:r.qtd_unid,fmpTot:r.fmp_tot,fmpVal:r.fmp_val};}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0d1b2a;color:#dde6f0;}
::-webkit-scrollbar{width:6px;height:6px;}::-webkit-scrollbar-track{background:#0d1b2a;}::-webkit-scrollbar-thumb{background:#243448;border-radius:3px;}
.app{display:flex;flex-direction:column;min-height:100vh;}
.hdr{height:56px;background:#111f30;border-bottom:1px solid #1e3148;display:flex;align-items:center;justify-content:space-between;padding:0 16px;position:sticky;top:0;z-index:100;}
.hdr-title{font-weight:900;font-size:14px;color:#7eb8f7;}.hdr-sub{font-size:10px;color:#3a5168;}
.layout{display:flex;flex:1;min-height:0;}
.sbar{width:190px;background:#0f1e2e;border-right:1px solid #1a2e42;flex-shrink:0;display:flex;flex-direction:column;padding:8px 0;}
.sbar-btn{display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;cursor:pointer;font-size:12px;text-align:left;background:transparent;color:#4a6580;border-left:3px solid transparent;transition:all .15s;}
.sbar-btn.active{background:#1d4ed815;color:#7eb8f7;border-left:3px solid #2563eb;font-weight:700;}
.sbar-btn:hover:not(.active){color:#94a3b8;background:#ffffff08;}
.bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:#111f30;border-top:1px solid #1e3148;z-index:100;overflow-x:auto;white-space:nowrap;}
.bnav-btn{display:inline-flex;flex-direction:column;align-items:center;gap:2px;padding:8px 12px;border:none;background:transparent;color:#4a6580;font-size:10px;cursor:pointer;min-width:60px;}
.bnav-btn.active{color:#7eb8f7;}.bnav-btn span{font-size:18px;}
.main{flex:1;padding:16px;overflow-y:auto;max-height:calc(100vh - 56px);}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;}
.kcard{background:#162234;border-radius:10px;padding:14px;border:1px solid #1e3148;}
.card{background:#162234;border-radius:10px;border:1px solid #1e3148;overflow:hidden;margin-bottom:12px;}
.card-head{padding:10px 14px;background:#0f1e2e;border-bottom:1px solid #1e3148;font-weight:700;color:#7eb8f7;font-size:13px;}
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
table{width:100%;border-collapse:collapse;font-size:12px;}
th{padding:8px 10px;text-align:left;color:#4a6580;font-weight:700;font-size:11px;background:#1a2e42;white-space:nowrap;}
td{padding:8px 10px;color:#b8c8d8;vertical-align:middle;border-bottom:1px solid #0f1e2e;}
.field{margin-bottom:10px;}
label.lbl{font-size:11px;color:#4a6580;font-weight:700;display:block;margin-bottom:4px;}
input,select,textarea{width:100%;padding:8px 10px;border-radius:7px;background:#0d1b2a;border:1px solid #1e3148;color:#dde6f0;font-size:13px;outline:none;}
textarea{resize:vertical;min-height:52px;}
.btn{padding:9px 16px;border-radius:7px;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;font-weight:800;font-size:13px;border:none;cursor:pointer;}
.btns{padding:9px 16px;border-radius:7px;background:#1e3148;color:#7eb8f7;font-weight:700;font-size:13px;border:none;cursor:pointer;}
.btnd{padding:9px 16px;border-radius:7px;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;font-weight:800;font-size:13px;border:none;cursor:none;cursor:pointer;}
.btn-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
.badge{font-size:11px;padding:2px 8px;border-radius:20px;font-weight:700;}
.notif{position:fixed;top:14px;right:14px;z-index:9999;padding:10px 18px;border-radius:8px;color:#fff;font-weight:700;font-size:13px;box-shadow:0 4px 20px #0009;max-width:calc(100vw - 28px);}
h2.ph{color:#7eb8f7;font-weight:900;font-size:17px;margin-bottom:14px;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.spinner{width:36px;height:36px;border:3px solid #1e3148;border-top-color:#2563eb;border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.mapa-print{background:#fff;color:#000;border-radius:8px;overflow:hidden;border:2px solid #1d4ed8;font-family:Arial,sans-serif;font-size:12px;}
.mapa-print table{font-size:11px;}.mapa-print th,.mapa-print td{border:1px solid #aaa;padding:4px 7px;}.mapa-print th{background:#dce6f1;}
@media(max-width:640px){
  .sbar{display:none;}.bnav{display:block;}
  .main{padding:12px 10px;padding-bottom:80px;}
  .g2{grid-template-columns:1fr;}
  h2.ph{font-size:15px;}
  .btn,.btns,.btnd{font-size:12px;padding:8px 12px;}
  table{font-size:11px;}th,td{padding:6px 8px;}
}
@media(max-width:400px){.kgrid{grid-template-columns:1fr 1fr;}}
`;

function injectCSS(css){const el=document.createElement("style");el.textContent=css;document.head.appendChild(el);}
injectCSS(CSS);

function Bdg({label,color}){return React.createElement("span",{className:"badge",style:{background:color+"25",color}},label);}
function KCard({icon,label,val,color,sub}){
  return React.createElement("div",{className:"kcard",style:{borderColor:color+"40"}},
    React.createElement("div",{style:{fontSize:20,marginBottom:4}},icon),
    React.createElement("div",{style:{fontSize:19,fontWeight:900,color}},val),
    React.createElement("div",{style:{fontSize:11,color:"#4a6580",marginTop:2}},label),
    sub&&React.createElement("div",{style:{fontSize:10,color:"#3a5168"}},sub)
  );
}
function Notif({n}){
  if(!n)return null;
  return React.createElement("div",{className:"notif",style:{background:n.t==="ok"?"#064e3b":"#7f1d1d"}},n.m);
}

// ── APP ───────────────────────────────────────────────────────────────────────
function App(){
  const[users,  setUsers] =useState([]);
  const[tarefas,setTfas]  =useState([]);
  const[excMap, setExcMap]=useState({});
  const[comps,  setComps] =useState({});
  const[comp,   setComp]  =useState(getComp());
  const[user,   setUser]  =useState(null);
  const[tab,    setTab]   =useState("dash");
  const[lf,     setLF]   =useState({email:"",pw:""});
  const[le,     setLE]   =useState("");
  const[loading,setLoad]  =useState(true);
  const[loadMsg,setLMsg]  =useState("Conectando ao banco...");
  const[notif,  setNotif] =useState(null);

  const notify=(m,t="ok")=>{setNotif({m,t});setTimeout(()=>setNotif(null),3200);};

  useEffect(()=>{
    (async()=>{
      try{
        setLMsg("Carregando usuários...");
        const us=await sbCall("GET","usuarios","order=nome");
        if(Array.isArray(us))setUsers(us.map(rowToUser));

        setLMsg("Carregando tarefas...");
        const ts=await sbCall("GET","tarefas","order=criado_em.desc");
        if(Array.isArray(ts))setTfas(ts.map(rowToTarefa));

        setLMsg("Carregando configurações...");
        const[exs,cfg,cps]=await Promise.all([
          sbCall("GET","excedentes"),
          sbCall("GET","config","chave=eq.comp_ativa"),
          sbCall("GET","competencias"),
        ]);
        if(Array.isArray(exs)){const em={};exs.forEach(e=>{em[`${e.user_id}_${e.comp}`]=e.valor;});setExcMap(em);}
        if(Array.isArray(cfg)&&cfg.length)setComp(cfg[0].valor);
        if(Array.isArray(cps)){const cm={};cps.forEach(c=>{if(!cm[c.comp])cm[c.comp]={};cm[c.comp][c.user_id]={efetivos:c.efetivos,excedente:c.excedente,total:c.total};});setComps(cm);}
      }catch(e){console.error(e);alert("Erro ao conectar: "+e.message);}
      setLoad(false);
    })();
  },[]);

  const getBase =useCallback((uid,c)=>tarefas.filter(t=>t.userId===uid&&t.comp===c&&t.status==="ap_ger").reduce((s,t)=>s+t.pts,0),[tarefas]);
  const getExc  =useCallback((uid,c)=>excMap[`${uid}_${c}`]||0,[excMap]);
  const getR    =useCallback((uid,c)=>calcRes(getBase(uid,c),getExc(uid,c)),[getBase,getExc]);
  const colabs  =useCallback(()=>users.filter(u=>u.role==="colaborador"&&u.ativo),[users]);
  const myColabs=useCallback(()=>{
    if(!user)return[];
    if(user.role==="admin"||user.role==="diretor")return colabs();
    if(user.role==="gerente"||user.role==="encarregado")return users.filter(u=>u.role==="colaborador"&&u.unid===user.unid&&u.ativo);
    return[];
  },[user,users,colabs]);
  const pendentes=useCallback(()=>{
    if(!user)return[];
    if(user.role==="encarregado")return tarefas.filter(t=>{const u=users.find(x=>x.id===t.userId);return u&&u.unid===user.unid&&t.status==="pend";});
    if(user.role==="gerente")    return tarefas.filter(t=>{const u=users.find(x=>x.id===t.userId);return u&&u.unid===user.unid&&t.status==="ap_enc";});
    return[];
  },[user,tarefas,users]);
  const mediaEf=useCallback((c)=>{const cs=colabs();if(!cs.length)return 0;return Math.round(cs.reduce((s,u)=>s+getR(u.id,c).efetivos,0)/cs.length);},[colabs,getR]);

  function doLogin(){
    const u=users.find(x=>x.email.toLowerCase()===lf.email.toLowerCase());
    if(!u){setLE("Usuário não encontrado.");return;}
    if(lf.pw!==u.pw){setLE("Senha incorreta.");return;}
    setUser(u);setLE("");setTab("dash");
  }

  if(loading)return React.createElement("div",{style:{minHeight:"100vh",background:"#0d1b2a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}},
    React.createElement("div",{className:"spinner",style:{width:48,height:48}}),
    React.createElement("span",{style:{color:"#4a6580",fontSize:14}},loadMsg),
    React.createElement("span",{style:{color:"#3a5168",fontSize:11}},"Aguarde...")
  );

  if(!user)return React.createElement("div",{style:{minHeight:"100vh",background:"linear-gradient(135deg,#0d1b2a,#162e45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}},
    React.createElement("div",{style:{width:"100%",maxWidth:420,textAlign:"center"}},
      React.createElement("div",{style:{marginBottom:20}},
        React.createElement("div",{style:{fontSize:44}},"🏛️"),
        React.createElement("div",{style:{fontSize:22,fontWeight:900,color:"#7eb8f7",letterSpacing:2}},"GPFI"),
        React.createElement("div",{style:{fontSize:11,color:"#4a6580",marginTop:4}},"Prefeitura de Santo André — Gratificação de Desempenho")
      ),
      React.createElement("div",{style:{background:"#162234",borderRadius:14,padding:24,border:"1px solid #243448"}},
        React.createElement("div",{className:"field"},
          React.createElement("label",{className:"lbl"},"USUÁRIO"),
          React.createElement("select",{value:lf.email,onChange:e=>setLF(f=>({...f,email:e.target.value}))},
            React.createElement("option",{value:""},"Selecione..."),
            users.map(u=>React.createElement("option",{key:u.id,value:u.email},`${u.nome} — ${u.cargo}`))
          )
        ),
        React.createElement("div",{className:"field"},
          React.createElement("label",{className:"lbl"},"SENHA"),
          React.createElement("input",{type:"password",placeholder:"Senha",value:lf.pw,onChange:e=>setLF(f=>({...f,pw:e.target.value})),onKeyDown:e=>e.key==="Enter"&&doLogin()})
        ),
        le&&React.createElement("div",{style:{color:"#f87171",fontSize:12,marginBottom:10}},le),
        React.createElement("button",{className:"btn",style:{width:"100%",padding:11},onClick:doLogin},"Entrar"),
        React.createElement("div",{style:{color:"#3a5168",fontSize:11,marginTop:10}},
          "Senha padrão: ",React.createElement("b",{style:{color:"#7eb8f7"}},"123456"),
          " | Admin: ",React.createElement("b",{style:{color:"#7eb8f7"}},"admin")
        )
      )
    )
  );

  const nPend=pendentes().length;
  const NAV=[
    {id:"dash",icon:"📊",label:"Dashboard",  roles:["admin","diretor","gerente","encarregado","colaborador"]},
    {id:"trf", icon:"✅",label:"Tarefas",     roles:["colaborador"]},
    {id:"val", icon:"🔍",label:`Val.${nPend>0?` (${nPend})`:""}`,roles:["encarregado","gerente"]},
    {id:"mi",  icon:"📋",label:"Mapa Ind.",   roles:["admin","diretor","gerente","encarregado","colaborador"]},
    {id:"mg",  icon:"📑",label:"Mapa Ger.",   roles:["admin","diretor","gerente","encarregado"]},
    {id:"rel", icon:"📈",label:"Relatórios",  roles:["admin","diretor","gerente","encarregado"]},
    {id:"usr", icon:"👥",label:"Usuários",    roles:["admin"]},
    {id:"comp",icon:"📅",label:"Competência", roles:["admin"]},
  ].filter(n=>n.roles.includes(user.role));

  const props={user,users,setUsers,tarefas,setTarefas:setTfas,comp,setComp,comps,setComps,excMap,setExcMap,getR,getExc,mediaEf,myColabs,pendentes,colabs,notify};

  return React.createElement("div",{className:"app"},
    React.createElement(Notif,{n:notif}),
    React.createElement("header",{className:"hdr"},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
        React.createElement("span",{style:{fontSize:20}},"🏛️"),
        React.createElement("div",null,
          React.createElement("div",{className:"hdr-title"},"GPFI — Gratificação"),
          React.createElement("div",{className:"hdr-sub"},`Santo André • ${fmtComp(comp)}`)
        )
      ),
      React.createElement("button",{className:"btns",style:{fontSize:12,padding:"6px 12px"},onClick:()=>{setUser(null);setLF({email:"",pw:""});}},"Sair")
    ),
    React.createElement("div",{className:"layout"},
      React.createElement("aside",{className:"sbar"},
        NAV.map(n=>React.createElement("button",{key:n.id,className:`sbar-btn${tab===n.id?" active":""}`,onClick:()=>setTab(n.id)},React.createElement("span",null,n.icon),n.label))
      ),
      React.createElement("main",{className:"main"},
        tab==="dash"&&React.createElement(DashView,props),
        tab==="trf" &&user.role==="colaborador"&&React.createElement(TrfView,props),
        tab==="val" &&(user.role==="encarregado"||user.role==="gerente")&&React.createElement(ValView,props),
        tab==="mi"  &&React.createElement(MapaIndView,props),
        tab==="mg"  &&React.createElement(MapaGerView,props),
        tab==="rel" &&React.createElement(RelView,props),
        tab==="usr" &&user.role==="admin"&&React.createElement(UsrView,props),
        tab==="comp"&&user.role==="admin"&&React.createElement(CompView,props),
      )
    ),
    React.createElement("nav",{className:"bnav"},
      NAV.map(n=>React.createElement("button",{key:n.id,className:`bnav-btn${tab===n.id?" active":""}`,onClick:()=>setTab(n.id)},React.createElement("span",null,n.icon),n.label))
    )
  );
}

// ── VIEWS (JSX) ───────────────────────────────────────────────────────────────

function DashView({user,comp,getR,mediaEf,myColabs}){
  const cols=myColabs(),mef=mediaEf(comp);
  if(user.role==="colaborador"){
    const r=getR(user.id,comp),g=calcGPFI(r.efetivos,user.vb);
    return(<div><h2 className="ph">Meu Painel — {fmtComp(comp)}</h2>
      <div className="kgrid">
        <KCard icon="🎯" label="Pontos Produzidos" val={r.total} color="#3b82f6"/>
        <KCard icon="✅" label="Pt. Efetivos" val={r.efetivos} color="#10b981" sub={`Mín ${MIN_PTS} / Máx ${MAX_PTS}`}/>
        <KCard icon="➡️" label="Excedente" val={r.excedente} color="#f59e0b"/>
        <KCard icon="💰" label="GPFI Estimado" val={fmtBRL(g)} color="#a78bfa"/>
      </div>
      <div className="card" style={{padding:14,color:r.efetivos>=MIN_PTS?"#6ee7b7":"#fcd34d",fontWeight:700}}>
        {r.efetivos>=MIN_PTS?"✅ GPFI habilitado":`⚠️ Faltam ${MIN_PTS-r.total} pontos`}
      </div>
    </div>);
  }
  const aptos=cols.filter(u=>getR(u.id,comp).efetivos>=MIN_PTS).length;
  return(<div><h2 className="ph">Dashboard — {fmtComp(comp)}</h2>
    <div className="kgrid">
      <KCard icon="👥" label="Colaboradores" val={cols.length} color="#3b82f6"/>
      <KCard icon="✅" label="Aptos" val={`${aptos}/${cols.length}`} color="#10b981"/>
      <KCard icon="📈" label="Média Pt. Ef." val={mef} color="#7eb8f7"/>
      <KCard icon="💰" label="GPFI/Média" val={fmtBRL(calcGPFI(mef,VENC_BASE))} color="#a78bfa"/>
    </div>
    <div className="card"><div className="card-head">Equipe — {fmtComp(comp)}</div>
      <div className="tbl-wrap"><table><thead><tr>{["Auditor","I.F.","Unid.","Pt.Ef.","Exc.","GPFI","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>{cols.map(u=>{const r=getR(u.id,comp);return(<tr key={u.id}>
          <td style={{fontWeight:700,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.nome}</td>
          <td>{u.mat}</td><td><Bdg label={u.unid} color={UNID_COR[u.unid]||"#555"}/></td>
          <td style={{fontWeight:700,color:r.efetivos>=MIN_PTS?"#6ee7b7":"#fcd34d"}}>{r.efetivos}</td>
          <td>{r.excedente}</td><td style={{whiteSpace:"nowrap"}}>{fmtBRL(calcGPFI(r.efetivos,u.vb))}</td>
          <td><Bdg label={r.efetivos>=MIN_PTS?"Apto":"Abaixo"} color={r.efetivos>=MIN_PTS?"#10b981":"#f59e0b"}/></td>
        </tr>);})}</tbody>
      </table></div>
    </div>
  </div>);
}

function TrfView({user,tarefas,setTarefas,comp,notify}){
  const F0={catId:"",qtd:"1",data:new Date().toISOString().slice(0,10),obs:"",m2Atual:"",m2Nova:"",qtdUnid:"",fmpTot:"",fmpVal:""};
  const[show,setShow]=useState(false);
  const[form,setForm]=useState(F0);
  const[saving,setSaving]=useState(false);
  const cat=CATALOGO.find(c=>c.id===form.catId);
  const pts=cat?calcPts(form.catId,form):0;
  const sf=(k,v)=>setForm(f=>({...f,[k]:v}));
  const mine=tarefas.filter(t=>t.userId===user.id&&t.comp===comp);
  async function add(){
    if(!form.catId){notify("Selecione um item.","err");return;}
    if(pts<=0){notify("Pontuação zero.","err");return;}
    setSaving(true);
    try{
      const row={id:`t${Date.now()}`,user_id:user.id,comp,cat_id:form.catId,descricao:`${cat.item} – ${cat.desc}`,pts,qtd:parseInt(form.qtd)||1,data:form.data,obs:form.obs||null,status:"pend",m2_atual:form.m2Atual||null,m2_nova:form.m2Nova||null,qtd_unid:form.qtdUnid||null,fmp_tot:form.fmpTot||null,fmp_val:form.fmpVal||null};
      const saved=await sbCall("POST","tarefas","",row);
      const t=Array.isArray(saved)?saved[0]:saved;
      setTarefas(p=>[rowToTarefa(t),...p]);
      setForm(F0);setShow(false);notify("Tarefa registrada!");
    }catch(e){notify("Erro ao salvar.","err");}
    setSaving(false);
  }
  async function del(id){
    if(tarefas.find(t=>t.id===id)?.status!=="pend"){notify("Só pendentes podem ser removidas.","err");return;}
    try{await sbCall("DELETE","tarefas",`id=eq.${id}`);setTarefas(p=>p.filter(t=>t.id!==id));}
    catch{notify("Erro ao remover.","err");}
  }
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 className="ph" style={{margin:0}}>Minhas Tarefas</h2>
      <button className="btn" onClick={()=>setShow(!show)}>+ Registrar</button>
    </div>
    {show&&<div className="card" style={{marginBottom:14}}><div className="card-head">Nova Tarefa</div>
      <div style={{padding:14}}>
        <div className="field"><label className="lbl">Item do Catálogo</label>
          <select style={{fontSize:12}} value={form.catId} onChange={e=>setForm({...F0,catId:e.target.value})}>
            <option value="">Selecione...</option>
            {CATALOGO.map(c=><option key={c.id} value={c.id}>Item {c.item} — {c.desc} ({c.pts} pts)</option>)}
          </select>
        </div>
        {cat&&!cat.esp&&<div className="field"><label className="lbl">Quantidade</label><input type="number" min="1" value={form.qtd} onChange={e=>sf("qtd",e.target.value)}/></div>}
        {cat?.esp==="m2"&&<div className="g2"><div className="field"><label className="lbl">Área Atual (m²)</label><input type="number" step="0.01" value={form.m2Atual} onChange={e=>sf("m2Atual",e.target.value)}/></div><div className="field"><label className="lbl">Área Nova (m²)</label><input type="number" step="0.01" value={form.m2Nova} onChange={e=>sf("m2Nova",e.target.value)}/></div></div>}
        {cat?.esp==="unid"&&<div className="field"><label className="lbl">Qtd de Unidades</label><input type="number" min="1" value={form.qtdUnid} onChange={e=>sf("qtdUnid",e.target.value)}/></div>}
        {cat?.esp==="fmp"&&<div className="g2"><div className="field"><label className="lbl">Total de FMPs</label><input type="number" value={form.fmpTot} onChange={e=>sf("fmpTot",e.target.value)}/></div><div className="field"><label className="lbl">Valor FMP (R$)</label><input type="number" step="0.01" value={form.fmpVal} onChange={e=>sf("fmpVal",e.target.value)}/></div></div>}
        {cat&&<><div className="field"><label className="lbl">Data</label><input type="date" value={form.data} onChange={e=>sf("data",e.target.value)}/></div>
          <div className="field"><label className="lbl">Observação</label><textarea value={form.obs} onChange={e=>sf("obs",e.target.value)}/></div>
          <div style={{padding:"8px 10px",background:"#0d1b2a",borderRadius:7,display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{color:"#4a6580",fontSize:12}}>Item {cat.item}</span><span style={{color:"#6ee7b7",fontWeight:900}}>Total: {pts} pts</span>
          </div></>}
        <div className="btn-row"><button className="btn" onClick={add} disabled={saving}>{saving?"Salvando...":"Salvar"}</button><button className="btns" onClick={()=>{setShow(false);setForm(F0);}}>Cancelar</button></div>
      </div>
    </div>}
    <div className="card"><div className="tbl-wrap"><table><thead><tr>{["Data","Item","Pts","Status",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>
        {mine.length===0&&<tr><td colSpan={5} style={{textAlign:"center",color:"#3a5168",padding:16}}>Nenhuma tarefa.</td></tr>}
        {mine.map(t=><tr key={t.id}>
          <td style={{whiteSpace:"nowrap"}}>{t.data}</td>
          <td style={{fontWeight:700,color:"#7eb8f7"}}>{CATALOGO.find(c=>c.id===t.catId)?.item||"—"}</td>
          <td style={{fontWeight:700,color:"#7eb8f7"}}>{t.pts}</td>
          <td><Bdg label={STATUS_LBL[t.status]} color={STATUS_COR[t.status]}/></td>
          <td>{t.status==="pend"&&<button className="btns" style={{padding:"3px 8px",fontSize:11,color:"#f87171"}} onClick={()=>del(t.id)}>✕</button>}</td>
        </tr>)}
      </tbody></table></div>
    </div>
  </div>);
}

function ValView({user,tarefas,setTarefas,users,pendentes,notify}){
  const[obs,setObs]=useState({});
  const pends=pendentes();
  const uMap=Object.fromEntries(users.map(u=>[u.id,u]));
  async function acao(id,tipo){
    const ns=tipo==="ap"?(user.role==="encarregado"?"ap_enc":"ap_ger"):"rej";
    const body=tipo==="ap"?{status:ns,obs_val:obs[id]||null}:{status:"rej",motivo_rej:obs[id]||"Sem motivo."};
    try{
      await sbCall("PATCH","tarefas",`id=eq.${id}`,body);
      setTarefas(p=>p.map(t=>t.id!==id?t:{...t,status:ns}));
      notify(tipo==="ap"?"Aprovado!":"Rejeitado.",tipo==="ap"?"ok":"err");
    }catch{notify("Erro.","err");}
  }
  return(<div><h2 className="ph">Validação</h2>
    {pends.length===0&&<div className="card" style={{padding:20,textAlign:"center",color:"#3a5168"}}>✅ Nenhuma pendência.</div>}
    {pends.map(t=>{const col=uMap[t.userId],cat=CATALOGO.find(c=>c.id===t.catId);return(
      <div key={t.id} className="card" style={{padding:14,marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>Item {cat?.item} — {t.desc}</div>
        <div style={{fontSize:12,color:"#4a6580",marginBottom:8}}><b style={{color:"#e2e8f0"}}>{col?.nome}</b> • {t.data} • <b style={{color:"#7eb8f7"}}>{t.pts} pts</b></div>
        {t.obs&&<div style={{fontSize:11,color:"#7eb8f7",marginBottom:8}}>Obs: {t.obs}</div>}
        <div className="field"><input placeholder="Observação..." value={obs[t.id]||""} onChange={e=>setObs(p=>({...p,[t.id]:e.target.value}))}/></div>
        <div className="btn-row"><button className="btn" onClick={()=>acao(t.id,"ap")}>✓ Aprovar</button><button className="btnd" onClick={()=>acao(t.id,"rej")}>✗ Rejeitar</button></div>
      </div>);})}
  </div>);
}

function MapaIndView({user,users,tarefas,comp,getR,myColabs,getExc}){
  const cols=user.role==="colaborador"?[user]:myColabs();
  const[selId,setSelId]=useState(user.role==="colaborador"?user.id:(cols[0]?.id||""));
  const sel=cols.find(u=>u.id===selId)||cols[0];
  const aprov=sel?tarefas.filter(t=>t.userId===sel.id&&t.comp===comp&&t.status==="ap_ger"):[];
  const ptB=aprov.reduce((s,t)=>s+t.pts,0);
  const excAnt=sel?getExc(sel.id,comp):0;
  const res=sel?getR(sel.id,comp):{total:0,efetivos:0,excedente:0};
  const gpfi=calcGPFI(res.efetivos,sel?.vb||VENC_BASE);
  return(<div>
    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
      <h2 className="ph" style={{margin:0}}>Mapa Individual</h2>
      {user.role!=="colaborador"&&<select style={{maxWidth:260,fontSize:12}} value={selId} onChange={e=>setSelId(e.target.value)}>
        {cols.map(u=><option key={u.id} value={u.id}>{u.nome} — {u.unid}</option>)}
      </select>}
    </div>
    {sel&&<div className="mapa-print">
      <div style={{background:"#dce6f1",padding:"10px 14px",borderBottom:"2px solid #1d4ed8",textAlign:"center"}}><div style={{fontWeight:900,fontSize:15,color:"#1d4ed8"}}>MAPA INDIVIDUAL DE APURAÇÃO</div><div style={{fontSize:10,color:"#444"}}>Prefeitura Municipal de Santo André — GPFI</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",borderBottom:"1px solid #aaa"}}>
        <div style={{padding:"7px 12px",borderRight:"1px solid #aaa"}}><b>NOME: </b>{sel.nome}</div>
        <div style={{padding:"7px 12px",borderRight:"1px solid #aaa",textAlign:"center",minWidth:80}}><div style={{fontSize:9,fontWeight:700}}>I.F.</div><b>{sel.mat}</b></div>
        <div style={{padding:"7px 12px",textAlign:"center",minWidth:90}}><div style={{fontSize:9,fontWeight:700}}>MÊS/ANO</div><b>{fmtComp(comp)}</b></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:"1px solid #aaa"}}>
        <div style={{padding:"8px 12px",borderRight:"1px solid #aaa",textAlign:"center"}}><div style={{fontSize:9,fontWeight:700}}>PP</div><div style={{fontSize:20,fontWeight:900,color:"#1d4ed8"}}>{ptB}</div></div>
        <div style={{padding:"8px 12px",borderRight:"1px solid #aaa",textAlign:"center"}}><div style={{fontSize:9,fontWeight:700}}>Excedente Anterior</div><div style={{fontSize:20,fontWeight:900,color:"#d97706"}}>{excAnt}</div></div>
        <div style={{padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:9,fontWeight:700}}>PN Total</div><div style={{fontSize:20,fontWeight:900,color:res.efetivos>=MIN_PTS?"#059669":"#dc2626"}}>{res.total}</div></div>
      </div>
      <div style={{padding:"10px 12px",borderBottom:"1px solid #aaa"}}>
        <b style={{color:"#1d4ed8",fontSize:12}}>TAREFAS APROVADAS</b>
        <div className="tbl-wrap" style={{marginTop:6}}><table><thead><tr style={{background:"#dce6f1"}}>{["Item","Descrição","Detalhe","Pts/U","Total","Data"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {aprov.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:10,color:"#888"}}>Nenhuma aprovada.</td></tr>}
            {aprov.map(t=>{const cat=CATALOGO.find(c=>c.id===t.catId);let det=`Qtd:${t.qtd||1}`;if(cat?.esp==="m2")det=`Δ${((parseFloat(t.m2Nova)||0)-(parseFloat(t.m2Atual)||0)).toFixed(1)}m²`;if(cat?.esp==="unid")det=`${t.qtdUnid}un.`;if(cat?.esp==="fmp")det=`${t.fmpTot}/R$${t.fmpVal}`;return(<tr key={t.id}><td style={{fontWeight:700,color:"#1d4ed8"}}>{cat?.item||"—"}</td><td style={{maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc}</td><td style={{textAlign:"center"}}>{det}</td><td style={{textAlign:"center"}}>{cat?.pts||0}</td><td style={{textAlign:"center",fontWeight:700}}>{t.pts}</td><td style={{whiteSpace:"nowrap"}}>{t.data}</td></tr>);})}
            <tr style={{background:"#dce6f1",fontWeight:900}}><td colSpan={4} style={{textAlign:"right"}}>TOTAL:</td><td style={{textAlign:"center",fontSize:14}}>{ptB}</td><td></td></tr>
          </tbody>
        </table></div>
      </div>
      <div style={{padding:"10px 12px",borderBottom:"1px solid #aaa"}}>
        <b style={{color:"#1d4ed8",fontSize:12}}>DEMONSTRATIVO</b>
        <table style={{marginTop:6}}><tbody>
          <tr><td style={{width:"60%"}}>Pontos Efetivos (PN)</td><td style={{textAlign:"right",fontWeight:700,color:"#1d4ed8"}}>{res.efetivos}</td></tr>
          <tr><td>Vencimento-Base</td><td style={{textAlign:"right"}}>{fmtBRL(sel.vb)}</td></tr>
          <tr><td>Percentual</td><td style={{textAlign:"right"}}>{(res.efetivos*VALOR_PCT*100).toFixed(4)}%</td></tr>
          <tr style={{background:"#dce6f1",fontWeight:900}}><td>TOTAL A PAGAR</td><td style={{textAlign:"right",fontSize:14,color:"#059669"}}>{fmtBRL(gpfi)}</td></tr>
        </tbody></table>
        <div style={{marginTop:8,padding:"5px 8px",background:res.efetivos>=MIN_PTS?"#dcfce7":"#fef9c3",borderRadius:4,fontWeight:700,fontSize:11,color:res.efetivos>=MIN_PTS?"#166534":"#92400e"}}>{res.efetivos>=MIN_PTS?"✅ GPFI HABILITADO":"⚠️ GPFI NÃO HABILITADO"}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",padding:"18px 12px",gap:16}}>
        <div style={{textAlign:"center"}}><div style={{borderTop:"1px solid #888",paddingTop:6,marginTop:32,fontWeight:700,fontSize:10}}>Ciente — {sel.nome}<br/><span style={{fontWeight:400}}>I.F.: {sel.mat}</span></div></div>
        <div style={{textAlign:"center"}}><div style={{borderTop:"1px solid #888",paddingTop:6,marginTop:32,fontWeight:700,fontSize:10}}>Superior Imediato<br/><span style={{fontWeight:400}}>Dep. de Tributação</span></div></div>
      </div>
    </div>}
  </div>);
}

function MapaGerView({users,comp,getR,mediaEf,myColabs}){
  const cols=myColabs(),gest=users.filter(u=>["gerente","encarregado","diretor"].includes(u.role)&&u.ativo);
  const mef=mediaEf(comp),gM=calcGPFI(mef,VENC_BASE);
  const totAud=cols.reduce((s,u)=>s+calcGPFI(getR(u.id,comp).efetivos,u.vb),0);
  const totAll=totAud+gest.length*gM;
  return(<div><h2 className="ph">Mapa Geral — {fmtComp(comp)}</h2>
    <div className="kgrid"><KCard icon="👥" label="Auditores" val={cols.length} color="#3b82f6"/><KCard icon="📈" label="Média" val={mef} color="#7eb8f7"/><KCard icon="💰" label="GPFI Total" val={fmtBRL(totAll)} color="#10b981"/></div>
    <div className="card"><div className="card-head">Auditores</div><div className="tbl-wrap"><table><thead><tr>{["#","Nome","I.F.","Unid.","Pt.Ef.","GPFI","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{cols.map((u,i)=>{const r=getR(u.id,comp);return(<tr key={u.id}><td>{i+1}</td><td style={{fontWeight:700,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.nome}</td><td>{u.mat}</td><td><Bdg label={u.unid} color={UNID_COR[u.unid]||"#555"}/></td><td style={{fontWeight:700,color:r.efetivos>=MIN_PTS?"#6ee7b7":"#fcd34d"}}>{r.efetivos}</td><td style={{whiteSpace:"nowrap"}}>{fmtBRL(calcGPFI(r.efetivos,u.vb))}</td><td><Bdg label={r.efetivos>=MIN_PTS?"Apto":"Abaixo"} color={r.efetivos>=MIN_PTS?"#10b981":"#f59e0b"}/></td></tr>);})}
        <tr style={{background:"#1a2e42",fontWeight:700}}><td colSpan={5} style={{textAlign:"right"}}>TOTAL:</td><td style={{color:"#6ee7b7"}}>{fmtBRL(totAud)}</td><td></td></tr>
      </tbody></table></div>
    </div>
    <div className="card"><div className="card-head">Gestores — Média ({mef} pts)</div><div className="tbl-wrap"><table><thead><tr>{["Nome","I.F.","Cargo","Unid.","Pt.","GPFI"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{gest.map(g=><tr key={g.id}><td style={{fontWeight:700}}>{g.nome}</td><td>{g.mat}</td><td style={{fontSize:11}}>{g.cargo}</td><td><Bdg label={g.unid} color={UNID_COR[g.unid]||"#555"}/></td><td style={{fontWeight:700,color:"#7eb8f7"}}>{mef}</td><td style={{color:"#6ee7b7",fontWeight:700,whiteSpace:"nowrap"}}>{fmtBRL(gM)}</td></tr>)}
        <tr style={{background:"#1a2e42",fontWeight:700}}><td colSpan={5} style={{textAlign:"right"}}>TOTAL:</td><td style={{color:"#6ee7b7"}}>{fmtBRL(gest.length*gM)}</td></tr>
        <tr style={{background:"#064e3b"}}><td colSpan={5} style={{fontWeight:900}}>TOTAL GERAL:</td><td style={{color:"#6ee7b7",fontWeight:900,whiteSpace:"nowrap"}}>{fmtBRL(totAll)}</td></tr>
      </tbody></table></div>
    </div>
  </div>);
}

function RelView({comp,comps,getR,mediaEf,myColabs}){
  const all=[comp,...Object.keys(comps).filter(c=>c!==comp)].sort().reverse();
  const[cS,setCS]=useState(comp);
  const cols=myColabs(),mef=mediaEf(cS);
  const aptos=cols.filter(u=>getR(u.id,cS).efetivos>=MIN_PTS).length;
  return(<div>
    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
      <h2 className="ph" style={{margin:0}}>Relatórios</h2>
      <select style={{maxWidth:180,marginLeft:"auto"}} value={cS} onChange={e=>setCS(e.target.value)}>{all.map(c=><option key={c} value={c}>{fmtComp(c)}{c===comp?" (ativa)":""}</option>)}</select>
    </div>
    <div className="kgrid"><KCard icon="✅" label="Aptos" val={`${aptos}/${cols.length}`} color="#10b981"/><KCard icon="📈" label="Média" val={mef} color="#3b82f6"/><KCard icon="💰" label="GPFI/Média" val={fmtBRL(calcGPFI(mef,VENC_BASE))} color="#a78bfa"/><KCard icon="📊" label="Total" val={fmtBRL(cols.reduce((s,u)=>s+calcGPFI(getR(u.id,cS).efetivos,u.vb),0))} color="#f59e0b"/></div>
    <div className="card"><div className="card-head">Desempenho — {fmtComp(cS)}</div>
      <div className="tbl-wrap"><table><thead><tr>{["#","Auditor","I.F.","Unid.","Pt.Ef.","Exc.","GPFI","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>{cols.map((u,i)=>{const r=getR(u.id,cS);return(<tr key={u.id}><td>{i+1}</td><td style={{fontWeight:700,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.nome}</td><td>{u.mat}</td><td><Bdg label={u.unid} color={UNID_COR[u.unid]||"#555"}/></td><td style={{fontWeight:700,color:r.efetivos>=MIN_PTS?"#6ee7b7":"#fcd34d"}}>{r.efetivos}</td><td>{r.excedente}</td><td style={{whiteSpace:"nowrap"}}>{fmtBRL(calcGPFI(r.efetivos,u.vb))}</td><td><Bdg label={r.efetivos>=MIN_PTS?"Apto":"Abaixo"} color={r.efetivos>=MIN_PTS?"#10b981":"#f59e0b"}/></td></tr>);})}
        </tbody></table></div>
    </div>
  </div>);
}

function UsrView({users,setUsers,notify}){
  const[eId,setEId]=useState(null);
  const[eD,setED]=useState({});
  const[saving,setSaving]=useState(false);
  function startEdit(u){setEId(u.id);setED({nome:u.nome,cargo:u.cargo,email:u.email,mat:u.mat,vb:u.vb.toString(),pw:"",ativo:u.ativo});}
  async function save(id){
    const vb=parseFloat(eD.vb.replace(",","."));
    if(isNaN(vb)||vb<=0){notify("Vencimento inválido.","err");return;}
    setSaving(true);
    const body={nome:eD.nome,cargo:eD.cargo,email:eD.email,mat:eD.mat,vb,ativo:eD.ativo};
    if(eD.pw.trim())body.pw=eD.pw.trim();
    try{await sbCall("PATCH","usuarios",`id=eq.${id}`,body);setUsers(p=>p.map(u=>u.id!==id?u:{...u,...body}));setEId(null);notify("Atualizado!");}
    catch{notify("Erro.","err");}
    setSaving(false);
  }
  const se=(k,v)=>setED(p=>({...p,[k]:v}));
  return(<div><h2 className="ph">Usuários — {users.filter(u=>u.ativo).length} ativos</h2>
    {users.map(u=><div key={u.id} className="card" style={{marginBottom:8}}>
      {eId===u.id?(<div style={{padding:14}}>
        <div style={{fontWeight:700,color:"#7eb8f7",marginBottom:12}}>Editando: {u.nome}</div>
        <div className="g2">
          <div className="field"><label className="lbl">Nome</label><input value={eD.nome} onChange={e=>se("nome",e.target.value)}/></div>
          <div className="field"><label className="lbl">Cargo</label><input value={eD.cargo} onChange={e=>se("cargo",e.target.value)}/></div>
          <div className="field"><label className="lbl">Matrícula</label><input value={eD.mat} onChange={e=>se("mat",e.target.value)}/></div>
          <div className="field"><label className="lbl">E-mail</label><input value={eD.email} onChange={e=>se("email",e.target.value)}/></div>
          <div className="field"><label className="lbl">Nova Senha</label><input type="password" value={eD.pw} onChange={e=>se("pw",e.target.value)} placeholder="Em branco = manter"/></div>
          <div className="field"><label className="lbl">Vencimento (R$)</label><input type="number" step="0.01" value={eD.vb} onChange={e=>se("vb",e.target.value)}/></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,marginTop:10}}>
          <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
            <input type="checkbox" checked={eD.ativo} onChange={e=>se("ativo",e.target.checked)} style={{width:15,height:15}}/>
            <span style={{color:eD.ativo?"#6ee7b7":"#f87171",fontWeight:700}}>{eD.ativo?"Ativo":"Inativo"}</span>
          </label>
          <div style={{marginLeft:"auto"}} className="btn-row">
            <button className="btn" onClick={()=>save(u.id)} disabled={saving}>{saving?"Salvando...":"💾 Salvar"}</button>
            <button className="btns" onClick={()=>setEId(null)}>Cancelar</button>
          </div>
        </div>
      </div>):(
        <div style={{display:"flex",alignItems:"center",padding:"10px 14px",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:180}}><div style={{fontWeight:700,fontSize:13}}>{u.nome}</div><div style={{fontSize:11,color:"#4a6580"}}>{u.mat} • {u.cargo}</div></div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <Bdg label={ROLE_LBL[u.role]||u.role} color={u.role==="admin"?"#ef4444":u.role==="diretor"?"#f97316":u.role==="gerente"?"#eab308":u.role==="encarregado"?"#3b82f6":"#10b981"}/>
            <Bdg label={u.unid} color={UNID_COR[u.unid]||"#555"}/>
            <Bdg label={u.ativo?"Ativo":"Inativo"} color={u.ativo?"#10b981":"#ef4444"}/>
            <button className="btns" style={{padding:"4px 10px",fontSize:11}} onClick={()=>startEdit(u)}>✏️ Editar</button>
          </div>
        </div>
      )}
    </div>)}
  </div>);
}

function CompView({comp,setComp,users,comps,setComps,excMap,setExcMap,getR,notify}){
  const[confirm,setConfirm]=useState(false);
  const[saving,setSaving]=useState(false);
  function nextComp(c){const[y,m]=c.split("-").map(Number);const d=new Date(y,m,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
  async function encerrar(){
    setSaving(true);
    try{
      const nc=nextComp(comp);
      const rows=users.map(u=>{const r=getR(u.id,comp);return{comp,user_id:u.id,efetivos:r.efetivos,excedente:r.excedente,total:r.total};});
      await sbCall("POST","competencias","",rows);
      const excRows=users.filter(u=>getR(u.id,comp).excedente>0).map(u=>{const r=getR(u.id,comp);return{user_id:u.id,comp:nc,valor:r.excedente};});
      if(excRows.length)await sbCall("POST","excedentes","on_conflict=user_id,comp",excRows);
      await sbCall("PATCH","config","chave=eq.comp_ativa",{valor:nc});
      const ne={...excMap};users.forEach(u=>{const r=getR(u.id,comp);if(r.excedente>0)ne[`${u.id}_${nc}`]=r.excedente;});setExcMap(ne);
      const snap={};users.forEach(u=>{snap[u.id]=getR(u.id,comp);});setComps(p=>({...p,[comp]:snap}));
      setComp(nc);setConfirm(false);notify(`Competência ${fmtComp(comp)} encerrada!`);
    }catch(e){notify("Erro: "+e.message,"err");}
    setSaving(false);
  }
  const hist=Object.keys(comps).sort().reverse();
  return(<div><h2 className="ph">Gestão de Competência</h2>
    <div className="card" style={{padding:18,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>Ativa: <span style={{color:"#3b82f6"}}>{fmtComp(comp)}</span></div>
      <p style={{color:"#4a6580",fontSize:13,marginBottom:14}}>Encerrar salva snapshot, transfere excedentes e avança o período.</p>
      {!confirm?<button className="btnd" onClick={()=>setConfirm(true)}>🔒 Encerrar {fmtComp(comp)}</button>
        :<div style={{background:"#1a0000",border:"1px solid #dc2626",borderRadius:8,padding:14}}>
          <p style={{color:"#fca5a5",fontWeight:700,marginBottom:10}}>⚠️ Confirma? Ação irreversível.</p>
          <div className="btn-row"><button className="btnd" onClick={encerrar} disabled={saving}>{saving?"Processando...":"Confirmar"}</button><button className="btns" onClick={()=>setConfirm(false)}>Cancelar</button></div>
        </div>}
    </div>
    {hist.length>0&&<div className="card"><div className="card-head">Histórico ({hist.length})</div>
      <div className="tbl-wrap"><table><thead><tr>{["Competência","Colaboradores","Média","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>{hist.map(c=>{const s=comps[c],ids=Object.keys(s);const med=ids.length?Math.round(ids.reduce((a,id)=>a+(s[id]?.efetivos||0),0)/ids.length):0;return(<tr key={c}><td style={{fontWeight:700,color:"#7eb8f7"}}>{fmtComp(c)}</td><td>{ids.length}</td><td style={{fontWeight:700,color:"#3b82f6"}}>{med}</td><td><Bdg label="Encerrada" color="#10b981"/></td></tr>);})}</tbody>
      </table></div>
    </div>}
  </div>);
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
