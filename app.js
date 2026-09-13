
const { url, publishableKey } = window.SUPABASE_CONFIG;
const sb = window.supabase.createClient(url, publishableKey);

const state = {
  user:null, profile:null, courses:[], modules:{}, forum:{}, teachers:[], staffSpaces:[], staffModules:{},
  view:"dashboard", courseId:null, lessonId:null, courseTab:"content", challengeDraw:null, unreadChallengeCount:0
};

const app=document.getElementById("app");
const AVATARS = {
  meryl:{
    name:"Meryl Streep",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Meryl_Streep_February_2016.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Meryl_Streep_February_2016.jpg"
  },
  susan:{
    name:"Susan Sarandon",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Susan_Sarandon%2C_Festival_de_Sitges_2017_%28cropped%29.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Susan_Sarandon,_Festival_de_Sitges_2017_(cropped).jpg"
  },
  stella:{
    name:"Stella Adler",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Stella_Adler_in_Shadow_of_The_Thin_Man_trailer.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Stella_Adler_in_Shadow_of_The_Thin_Man_trailer.jpg"
  },
  stanislavski:{
    name:"Stanislavski",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Stanislavsky.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Stanislavsky.jpg"
  },
  viola:{
    name:"Viola Davis",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Viola_Davis_by_Gage_Skidmore.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Viola_Davis_by_Gage_Skidmore.jpg"
  },
  tilda:{
    name:"Tilda Swinton",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Tilda_Swinton-60999_%28cropped%29.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Tilda_Swinton-60999_(cropped).jpg"
  },
  pacino:{
    name:"Al Pacino",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Al_Pacino_in_2016.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Al_Pacino_in_2016.jpg"
  },
  dicaprio:{
    name:"Leonardo DiCaprio",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Leonardo_DiCaprio_2010.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Leonardo_DiCaprio_2010.jpg"
  },
  mcdormand:{
    name:"Frances McDormand",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Frances_McDormand_2015_%28cropped%29.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Frances_McDormand_2015_(cropped).jpg"
  },
  dafoe:{
    name:"Willem Dafoe",
    image:"https://commons.wikimedia.org/wiki/Special:FilePath/Willem_Dafoe_by_Sasha_Kargaltsev.jpg",
    source:"https://commons.wikimedia.org/wiki/File:Willem_Dafoe_by_Sasha_Kargaltsev.jpg"
  }
};
function avatarInfo(key){return AVATARS[key]||AVATARS.meryl;}
function avatarHTML(key,name="",className="avatar"){
  const a=avatarInfo(key);
  return `<img class="${className}" src="${esc(a.image)}" alt="Avatar ${esc(a.name)}" title="${esc(name||a.name)}">`;
}


function esc(v=""){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function initials(name="Usuario"){return name.split(" ").filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase();}
function roleName(role){return role==="admin"?"Administrador":role==="teacher"?"Profesor":"Alumno";}
function isStaff(){return ["admin","teacher"].includes(state.profile?.role);}
function isAdmin(){return state.profile?.role==="admin";}
function toast(msg,error=false){const t=document.createElement("div");t.className="toast";t.textContent=msg;if(error)t.style.background="#8b1635";document.body.appendChild(t);setTimeout(()=>t.remove(),2800);}
function loadingHTML(msg="Cargando aula..."){return `<div style="min-height:100vh;display:grid;place-items:center"><div style="text-align:center"><img src="assets/logo.png" style="width:84px;height:90px;object-fit:contain;background:#111;border-radius:18px;padding:8px"><h2 style="font-family:Manrope;color:#4d0015">${esc(msg)}</h2></div></div>`;}


function sanitizeSupportHtml(html=""){
  const parser=new DOMParser();
  const doc=parser.parseFromString(`<div>${html}</div>`,"text/html");
  const root=doc.body.firstElementChild;
  const allowed=new Set(["P","BR","STRONG","B","EM","I","U","H2","H3","UL","OL","LI","BLOCKQUOTE","A"]);
  const clean=(node)=>{
    [...node.children].forEach(child=>{
      if(!allowed.has(child.tagName)){ child.replaceWith(...child.childNodes); return; }
      [...child.attributes].forEach(attr=>{
        const name=attr.name.toLowerCase();
        if(child.tagName==="A" && name==="href"){
          const href=child.getAttribute("href")||"";
          if(!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href))child.removeAttribute("href");
        } else if(!(child.tagName==="A" && ["target","rel"].includes(name))){
          child.removeAttribute(attr.name);
        }
      });
      if(child.tagName==="A"){child.setAttribute("target","_blank");child.setAttribute("rel","noopener");}
      clean(child);
    });
  };
  clean(root);
  return root.innerHTML.trim();
}
function supportEditorHTML(value=""){
  const safe=sanitizeSupportHtml(value||"");
  return `<div class="support-editor-wrap">
    <div class="support-toolbar">
      <button type="button" data-cmd="bold"><strong>B</strong></button>
      <button type="button" data-cmd="italic"><em>I</em></button>
      <button type="button" data-cmd="underline"><u>U</u></button>
      <span class="support-toolbar-sep"></span>
      <button type="button" data-block="p">Texto</button>
      <button type="button" data-block="h2">Título</button>
      <button type="button" data-block="h3">Subtítulo</button>
      <span class="support-toolbar-sep"></span>
      <button type="button" data-cmd="insertUnorderedList">• Lista</button>
      <button type="button" data-cmd="insertOrderedList">1. Lista</button>
      <button type="button" data-block="blockquote">❝</button>
      <button type="button" data-link="1">🔗</button>
      <button type="button" data-clear="1">Limpiar</button>
    </div>
    <div class="support-editor" contenteditable="true" data-placeholder="Escribí acá el texto que acompañará al material...">${safe}</div>
    <textarea class="support-editor-value hidden" name="support_text_html">${esc(safe)}</textarea>
    <div class="support-editor-hint">Opcional · se mostrará antes del material principal.</div>
  </div>`;
}
function bindSupportEditors(root=document){
  root.querySelectorAll(".support-editor-wrap:not([data-ready])").forEach(wrap=>{
    wrap.dataset.ready="1";
    const editor=wrap.querySelector(".support-editor"), hidden=wrap.querySelector(".support-editor-value");
    const sync=()=>hidden.value=sanitizeSupportHtml(editor.innerHTML);
    editor.addEventListener("input",sync); editor.addEventListener("blur",sync);
    wrap.querySelectorAll("[data-cmd]").forEach(b=>b.onclick=()=>{editor.focus();document.execCommand(b.dataset.cmd,false,null);sync();});
    wrap.querySelectorAll("[data-block]").forEach(b=>b.onclick=()=>{editor.focus();document.execCommand("formatBlock",false,b.dataset.block);sync();});
    wrap.querySelector("[data-link]")?.addEventListener("click",()=>{const u=prompt("Pegá el enlace:");if(!u)return;editor.focus();document.execCommand("createLink",false,u);sync();});
    wrap.querySelector("[data-clear]")?.addEventListener("click",()=>{editor.focus();document.execCommand("removeFormat",false,null);sync();});
    sync();
  });
}
function supportTextBlock(html=""){
  const clean=sanitizeSupportHtml(html||"");
  return clean?`<section class="support-text-card"><div class="support-text-kicker">Material de apoyo</div><div class="support-text-content">${clean}</div></section>`:"";
}
function courseImage(c){
  if(c.cover_image_url) return c.cover_image_url;
  const text=(c.name+" "+(c.code||"")).toLowerCase();
  if(text.includes("direcci")) return "assets/curso_direccion.png";
  if(text.includes("actuación frente") || text.includes("actuacion frente")){
    if(text.includes("nivel 2") || text.includes("n2")) return "assets/curso_actuacion_1.png";
    return "assets/curso_actuacion_2.png";
  }
  return "";
}

async function boot(){
  app.innerHTML=loadingHTML();
  const {data:{session}}=await sb.auth.getSession();
  if(!session){renderLogin();return;}
  await loadAuthenticatedUser(session.user);
  if(new URLSearchParams(window.location.search).get("recovery")==="1")setTimeout(showRecoveryPassword,150);
}
async function loadAuthenticatedUser(user){
  state.user=user;
  const {data:profile,error}=await sb.from("profiles").select("id,full_name,role,avatar_key,created_at").eq("id",user.id).single();
  if(error||!profile){
    app.innerHTML=`<div class="login-panel" style="min-height:100vh"><div class="login-card"><h2>No encontramos tu perfil</h2><p>La cuenta existe, pero no tiene un perfil asociado.</p><button class="primary" id="logoutBroken">Cerrar sesión</button></div></div>`;
    document.getElementById("logoutBroken").onclick=logout;return;
  }
  state.profile=profile;await loadCourses();renderShell();
}
async function loadCourses(){
  const {data,error}=await sb.from("courses").select("id,name,code,description,teacher_name,color,is_active,created_at,cover_image_url").eq("is_active",true).order("created_at",{ascending:true});
  if(error){
    // Compatibilidad si aún no se ejecutó la migración que agrega cover_image_url
    const fallback=await sb.from("courses").select("id,name,code,description,teacher_name,color,is_active,created_at").eq("is_active",true).order("created_at",{ascending:true});
    if(fallback.error){toast("No se pudieron cargar los cursos",true);state.courses=[];return;}
    state.courses=fallback.data||[];return;
  }
  state.courses=data||[];
}
async function loadCourseModules(courseId,force=false){
  if(state.modules[courseId]&&!force)return state.modules[courseId];
  const {data,error}=await sb.from("modules").select(`id,course_id,title,description,position,lessons(id,module_id,title,description,content_type,content_url,text_content,support_text_html,position,created_by,created_at)`).eq("course_id",courseId).order("position",{ascending:true});
  if(error){toast("No se pudo cargar el contenido",true);return [];}
  (data||[]).forEach(m=>m.lessons=(m.lessons||[]).sort((a,b)=>(a.position||0)-(b.position||0)));
  state.modules[courseId]=data||[];return state.modules[courseId];
}

function renderLogin(){
  app.innerHTML=`<div class="login-page">
    <section class="login-brand"><div><img class="login-logo" src="assets/logo.png"><div class="brand-kicker" style="margin-top:28px">Córdoba Casting</div><h1>Aula<br>Virtual</h1><p>Clases, materiales, videos y acompañamiento para continuar tu formación también fuera del aula.</p></div><div class="brand-kicker">Formación audiovisual · Córdoba</div></section>
    <section class="login-panel"><form class="login-card" id="loginForm"><div class="brand-kicker" style="color:#7b0826">Acceso exclusivo</div><h2>Ingresar</h2><p>Usá el email y la contraseña de tu cuenta habilitada.</p>
      <div class="field"><label>Email</label><input id="email" type="email" autocomplete="email" required></div>
      <div class="field"><label>Contraseña</label><input id="password" type="password" autocomplete="current-password" required></div>
      <button class="primary" id="loginButton" style="width:100%">Entrar al aula</button><button type="button" class="forgot-password" id="forgotPassword">¿Olvidaste tu contraseña?</button><div id="loginError" style="margin-top:12px;color:#8b1635;font-size:.82rem"></div></form></section></div>`;
  document.getElementById("loginForm").onsubmit=async e=>{
    e.preventDefault();const btn=document.getElementById("loginButton"),box=document.getElementById("loginError");btn.disabled=true;btn.textContent="Ingresando...";box.textContent="";
    const {data,error}=await sb.auth.signInWithPassword({email:document.getElementById("email").value.trim(),password:document.getElementById("password").value});
    if(error){box.textContent="No pudimos iniciar sesión. Revisá email y contraseña.";btn.disabled=false;btn.textContent="Entrar al aula";return;}
    app.innerHTML=loadingHTML("Ingresando...");await loadAuthenticatedUser(data.user);
  };
  const forgotBtn=document.getElementById("forgotPassword");if(forgotBtn)forgotBtn.onclick=showForgotPassword;
}
async function logout(){await sb.auth.signOut();state.user=null;state.profile=null;state.courses=[];state.modules={};state.forum={};state.view="dashboard";renderLogin();}

function sidebarHTML(){
  const role=state.profile.role;
  let h=`<div class="sidebar-logo"><img src="assets/logo.png"><strong>Córdoba Casting</strong></div>
  <div class="nav-section"><div class="nav-title">Aula</div>
    <button class="nav-item ${state.view==="dashboard"?"active":""}" data-view="dashboard"><span>⌂</span><span>Inicio</span></button>
    <button class="nav-item ${["courses","course","lesson"].includes(state.view)?"active":""}" data-view="courses"><span>▦</span><span>Mis cursos</span></button>
    <button class="nav-item ${state.view==="teachers"?"active":""}" data-view="teachers"><span>★</span><span>Profes</span></button>
    <button class="nav-item ${state.view==="challenges"?"active":""}" data-view="challenges"><span>⚡</span><span>Desafíos</span></button>
    <button class="nav-item ${state.view==="notifications"?"active":""}" data-view="notifications"><span>🔔</span><span>Notificaciones</span>${state.unreadChallengeCount?`<b class="nav-badge">${state.unreadChallengeCount}</b>`:""}</button></div>`;
  if(["admin","teacher"].includes(role)) h+=`<div class="nav-section"><div class="nav-title">Material docente</div>
    <button class="nav-item ${state.view==="exercise-library"?"active":""}" data-view="exercise-library"><span>◇</span><span>Biblioteca de ejercicios</span></button>
    <button class="nav-item ${state.view==="scripts-library"?"active":""}" data-view="scripts-library"><span>▤</span><span>Guiones</span></button></div>`;
  if(role==="teacher") h+=`<div class="nav-section"><div class="nav-title">Profesor</div>
    <button class="nav-item ${state.view==="manage"?"active":""}" data-view="manage"><span>✎</span><span>Gestionar cursos</span></button>
    <button class="nav-item ${state.view==="upload"?"active":""}" data-view="upload"><span>＋</span><span>Subir contenido</span></button></div>`;
  if(role==="admin") h+=`<div class="nav-section"><div class="nav-title">Administración</div>
    <button class="nav-item ${state.view==="admin"?"active":""}" data-view="admin"><span>⚙</span><span>Panel general</span></button>
    <button class="nav-item ${state.view==="users"?"active":""}" data-view="users"><span>◎</span><span>Usuarios</span></button>
    <button class="nav-item ${state.view==="manage"?"active":""}" data-view="manage"><span>✎</span><span>Cursos y contenido</span></button>
    <button class="nav-item ${state.view==="challenge-admin"?"active":""}" data-view="challenge-admin"><span>⚡</span><span>Gestionar desafíos</span></button></div>`;
  
  return h;
}
function renderShell(){
  const p=state.profile;
  app.innerHTML=`<div class="shell"><header class="topbar"><div class="topbar-left"><button class="mobile-menu" id="mobileMenu">☰</button><img class="top-logo" src="assets/logo.png"><div class="logo-word">CÓRDOBA CASTING</div><div class="role-badge">${roleName(p.role)}</div></div>
    <button class="userbox profile-menu-trigger" id="profileMenuTrigger" type="button"><div><strong>${esc(p.full_name)}</strong><div style="font-size:.72rem;color:var(--muted)">${esc(state.user.email||"")}</div></div>${avatarHTML(p.avatar_key,p.full_name,"avatar")}<span class="profile-caret">⌄</span></button><div class="profile-dropdown hidden" id="profileDropdown"><button type="button" id="openMyProfile"><span>◎</span><div><strong>Mi perfil</strong><small>Nombre, avatar y contraseña</small></div></button><div class="profile-dropdown-sep"></div><button type="button" id="topLogout"><span>↪</span><div><strong>Cerrar sesión</strong></div></button></div></header>
    <div class="mobile-drawer-backdrop" id="drawerBackdrop"></div><div class="layout"><aside class="sidebar">${sidebarHTML()}</aside><main class="content" id="content"></main></div></div>`;
  document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{state.view=b.dataset.view;state.courseId=null;state.lessonId=null;state.courseTab="content";document.body.classList.remove("menu-open");renderShell();});
  const sidebarLogout=document.getElementById("logout"); if(sidebarLogout)sidebarLogout.onclick=logout;
  document.getElementById("mobileMenu").onclick=()=>document.body.classList.toggle("menu-open");
  document.getElementById("drawerBackdrop").onclick=()=>document.body.classList.remove("menu-open");
  const profileTrigger=document.getElementById("profileMenuTrigger");
  const profileDropdown=document.getElementById("profileDropdown");
  if(profileTrigger && profileDropdown){
    profileTrigger.onclick=(e)=>{e.stopPropagation();profileDropdown.classList.toggle("hidden");};
    document.addEventListener("click",(e)=>{if(!profileDropdown.contains(e.target) && !profileTrigger.contains(e.target))profileDropdown.classList.add("hidden");},{once:true});
  }
  document.getElementById("openMyProfile")?.addEventListener("click",()=>{profileDropdown?.classList.add("hidden");showMyProfile();});
  document.getElementById("topLogout")?.addEventListener("click",logout);
  renderContent();
}



function avatarPickerHTML(current){
  return `<div class="avatar-picker-grid">${Object.entries(AVATARS).map(([key,a])=>`
    <button type="button" class="avatar-option ${current===key?"selected":""}" data-avatar="${key}">
      <img src="${esc(a.image)}" alt="${esc(a.name)}"><span>${esc(a.name)}</span>
    </button>`).join("")}</div>`;
}

function showMyProfile(){
  const current=state.profile.avatar_key||"meryl";
  const wrap=document.createElement("div");
  wrap.className="modal-backdrop";
  wrap.innerHTML=`<div class="modal-card profile-modal">
    <div class="modal-head"><div><h2>Mi perfil</h2><p>Personalizá cómo aparecés dentro del Aula.</p></div><button class="modal-close">×</button></div>
    <form id="profileForm">
      <div class="profile-summary">${avatarHTML(current,state.profile.full_name,"profile-current-avatar")}<div><strong>${esc(state.profile.full_name)}</strong><span>${esc(state.user.email||"")}</span></div></div>
      <div class="field"><label>Nombre visible</label><input name="full_name" value="${esc(state.profile.full_name||"")}" minlength="2" maxlength="80" required></div>
      <div class="field"><label>Email</label><input value="${esc(state.user.email||"")}" disabled><div class="locked-field-note">🔒 El email de acceso es fijo y no se puede modificar desde el Aula.</div></div>
      <div class="field"><label>Avatar</label>${avatarPickerHTML(current)}<input type="hidden" name="avatar_key" value="${esc(current)}"></div>
      <div class="profile-section-title">Cambiar contraseña <span>opcional</span></div>
      <div class="field"><label>Nueva contraseña</label><input name="password" type="password" minlength="6" autocomplete="new-password" placeholder="Dejá vacío si no querés cambiarla"></div>
      <div class="field"><label>Repetir contraseña</label><input name="password_repeat" type="password" minlength="6" autocomplete="new-password" placeholder="Repetí la nueva contraseña"></div>
      <div class="modal-actions"><button type="button" class="secondary modal-cancel">Cancelar</button><button class="primary">Guardar cambios</button></div>
    </form></div>`;
  document.body.appendChild(wrap);
  const close=()=>wrap.remove();
  wrap.querySelector(".modal-close").onclick=close;
  wrap.querySelector(".modal-cancel").onclick=close;
  wrap.onclick=e=>{if(e.target===wrap)close();};

  const hidden=wrap.querySelector('input[name="avatar_key"]');
  wrap.querySelectorAll(".avatar-option").forEach(btn=>btn.onclick=()=>{
    wrap.querySelectorAll(".avatar-option").forEach(x=>x.classList.remove("selected"));
    btn.classList.add("selected");
    hidden.value=btn.dataset.avatar;
  });

  wrap.querySelector("#profileForm").onsubmit=async e=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const fullName=String(fd.get("full_name")||"").trim();
    const avatarKey=String(fd.get("avatar_key")||"meryl");
    const password=String(fd.get("password")||"");
    const repeat=String(fd.get("password_repeat")||"");
    if(fullName.length<2){toast("El nombre es demasiado corto.",true);return;}
    if(password && password.length<6){toast("La contraseña debe tener al menos 6 caracteres.",true);return;}
    if(password!==repeat){toast("Las contraseñas no coinciden.",true);return;}
    const submit=e.target.querySelector(".primary");
    submit.disabled=true;submit.textContent="Guardando...";
    try{
      if(fullName!==state.profile.full_name){
        const {error}=await sb.rpc("set_my_display_name",{new_name:fullName});
        if(error)throw error;
        state.profile.full_name=fullName;
      }
      if(avatarKey!==state.profile.avatar_key){
        const {error}=await sb.rpc("set_my_avatar",{new_avatar_key:avatarKey});
        if(error)throw error;
        state.profile.avatar_key=avatarKey;
      }
      if(password){
        const {error}=await sb.auth.updateUser({password});
        if(error)throw error;
      }
      toast("Perfil actualizado");
      close();
      renderShell();
    }catch(err){
      toast("No se pudo actualizar el perfil: "+(err.message||err),true);
      submit.disabled=false;submit.textContent="Guardar cambios";
    }
  };
}

function showForgotPassword(){
  const wrap=document.createElement("div");
  wrap.className="modal-backdrop";
  wrap.innerHTML=`<div class="modal-card auth-modal">
    <div class="modal-head"><div><h2>Recuperar contraseña</h2><p>Te enviaremos un enlace para elegir una nueva clave.</p></div><button class="modal-close">×</button></div>
    <form id="forgotForm"><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"></div>
    <div class="modal-actions"><button type="button" class="secondary modal-cancel">Cancelar</button><button class="primary">Enviar enlace</button></div></form></div>`;
  document.body.appendChild(wrap);
  const close=()=>wrap.remove();
  wrap.querySelector(".modal-close").onclick=close;
  wrap.querySelector(".modal-cancel").onclick=close;
  wrap.onclick=e=>{if(e.target===wrap)close();};
  wrap.querySelector("#forgotForm").onsubmit=async e=>{
    e.preventDefault();
    const email=String(new FormData(e.target).get("email")||"").trim();
    const redirectTo=`${window.location.origin}${window.location.pathname}?recovery=1`;
    const btn=e.target.querySelector(".primary");btn.disabled=true;btn.textContent="Enviando...";
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});
    if(error){toast("No se pudo enviar el email: "+error.message,true);btn.disabled=false;btn.textContent="Enviar enlace";return;}
    close();toast("Revisá tu email para continuar.");
  };
}

function showRecoveryPassword(){
  if(document.querySelector(".recovery-modal-open"))return;
  const wrap=document.createElement("div");
  wrap.className="modal-backdrop recovery-modal-open";
  wrap.innerHTML=`<div class="modal-card auth-modal">
    <div class="modal-head"><div><h2>Nueva contraseña</h2><p>Elegí la nueva clave para tu cuenta.</p></div></div>
    <form id="recoveryForm"><div class="field"><label>Nueva contraseña</label><input name="password" type="password" minlength="6" required autocomplete="new-password"></div>
    <div class="field"><label>Repetir contraseña</label><input name="repeat" type="password" minlength="6" required autocomplete="new-password"></div>
    <div class="modal-actions"><button class="primary">Guardar contraseña</button></div></form></div>`;
  document.body.appendChild(wrap);
  wrap.querySelector("#recoveryForm").onsubmit=async e=>{
    e.preventDefault();
    const fd=new FormData(e.target),password=String(fd.get("password")||""),repeat=String(fd.get("repeat")||"");
    if(password!==repeat){toast("Las contraseñas no coinciden.",true);return;}
    const btn=e.target.querySelector(".primary");btn.disabled=true;btn.textContent="Guardando...";
    const {error}=await sb.auth.updateUser({password});
    if(error){toast("No se pudo cambiar la contraseña: "+error.message,true);btn.disabled=false;btn.textContent="Guardar contraseña";return;}
    history.replaceState({},document.title,window.location.pathname);
    wrap.remove();toast("Contraseña actualizada");
  };
}

async function loadTeachers(){
  const {data,error}=await sb.rpc("get_teacher_directory");
  if(error){console.error(error);toast("No se pudieron cargar los profes",true);return [];}
  state.teachers=data||[];return state.teachers;
}
async function teachersHTML(){
  const rows=await loadTeachers();
  const grouped={};
  for(const r of rows){
    if(!grouped[r.user_id]) grouped[r.user_id]={id:r.user_id,name:r.full_name,role:r.role,avatar_key:r.avatar_key,courses:[]};
    if(r.course_id) grouped[r.user_id].courses.push({id:r.course_id,name:r.course_name,code:r.course_code});
  }
  const teachers=Object.values(grouped);
  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">Equipo docente</div><h1>Profes</h1><p>Conocé quiénes están a cargo de los cursos del Aula Virtual.</p></div></div>
  <div class="teacher-grid">${teachers.length?teachers.map(t=>`<article class="teacher-card">
    ${avatarHTML(t.avatar_key,t.name,"teacher-avatar")}
    <div><h3>${esc(t.name)}</h3><div class="teacher-role">${t.role==="admin"?"Administración · Docencia":"Profesor/a"}</div>
    <div class="teacher-course-list">${t.courses.length?t.courses.map(c=>`<span>${esc(c.name)}${c.code?` · ${esc(c.code)}`:""}</span>`).join(""):`<span>Sin cursos asignados actualmente</span>`}</div></div>
  </article>`).join(""):`<div class="empty">Todavía no hay profesores cargados.</div>`}</div>`;
}

async function loadStaffSpaces(){
  const {data,error}=await sb.from("staff_spaces").select("id,slug,title,description").order("id");
  if(error){toast("No se pudieron cargar los espacios docentes",true);return [];}
  state.staffSpaces=data||[];return state.staffSpaces;
}
async function loadStaffModules(spaceId,force=false){
  if(state.staffModules[spaceId]&&!force)return state.staffModules[spaceId];
  const {data,error}=await sb.from("staff_modules").select(`
    id,space_id,title,description,position,
    staff_lessons(id,module_id,title,description,content_type,content_url,text_content,support_text_html,position,created_by,created_at)
  `).eq("space_id",spaceId).order("position",{ascending:true});
  if(error){toast("No se pudo cargar el material docente",true);return [];}
  (data||[]).forEach(m=>m.staff_lessons=(m.staff_lessons||[]).sort((a,b)=>(a.position||0)-(b.position||0)));
  state.staffModules[spaceId]=data||[];return state.staffModules[spaceId];
}
async function uploadStaffPdfFile(file,spaceId,moduleId){
  if(!file)throw new Error("Seleccioná un archivo PDF.");
  if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf"))throw new Error("El archivo debe ser PDF.");
  const safe=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-");
  const path=`${spaceId}/${moduleId}/${Date.now()}-${safe}`;
  const {error}=await sb.storage.from("staff-pdfs").upload(path,file,{contentType:"application/pdf",upsert:false});
  if(error)throw error;return path;
}
async function getStaffPdfSignedUrl(path){
  const {data,error}=await sb.storage.from("staff-pdfs").createSignedUrl(path,3600);
  if(error)return null;return data?.signedUrl||null;
}
async function staffLibraryHTML(slug){
  if(!isStaff())return `<div class="empty">Esta sección es exclusiva para profesores y administración.</div>`;
  if(!state.staffSpaces.length)await loadStaffSpaces();
  const space=state.staffSpaces.find(s=>s.slug===slug);
  if(!space)return `<div class="empty">Espacio no encontrado.</div>`;
  const mods=await loadStaffModules(space.id);
  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">Material docente</div><h1>${esc(space.title)}</h1><p>${esc(space.description||"")}</p></div>
    <button class="primary add-staff-module" data-space="${space.id}">+ Nuevo módulo</button></div>
    <section class="panel">${mods.length?mods.map((m,i)=>`<div class="module">
      <div class="module-head"><div class="module-title"><div class="module-number">${i+1}</div><div><strong>${esc(m.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${m.staff_lessons.length} contenidos</div></div></div>
      <div class="admin-actions"><button class="secondary mini edit-staff-module" data-space="${space.id}" data-module="${m.id}">Editar módulo</button>${isAdmin()?`<button class="danger mini delete-staff-module" data-space="${space.id}" data-module="${m.id}">Eliminar</button>`:""}<button class="gold-button mini add-staff-lesson" data-space="${space.id}" data-module="${m.id}">+ Contenido</button></div></div>
      ${m.staff_lessons.map((l,j)=>`<div class="lesson-admin-row"><div class="lesson-index">${String(j+1).padStart(2,"0")}</div><div><strong>${esc(l.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${typeLabel(l.content_type)}</div></div>
      <div class="admin-actions"><button class="secondary mini view-staff-lesson" data-space="${space.id}" data-module="${m.id}" data-lesson="${l.id}">Ver</button><button class="secondary mini edit-staff-lesson" data-space="${space.id}" data-module="${m.id}" data-lesson="${l.id}">Editar</button>${isAdmin()?`<button class="danger mini delete-staff-lesson" data-space="${space.id}" data-module="${m.id}" data-lesson="${l.id}">Eliminar</button>`:""}</div></div>`).join("")}
    </div>`).join(""):`<div class="empty">Todavía no hay módulos.</div>`}</section>`;
}
async function staffLessonViewer(spaceId,moduleId,lessonId){
  const mods=await loadStaffModules(spaceId);
  const m=mods.find(x=>String(x.id)===String(moduleId));const l=m?.staff_lessons.find(x=>String(x.id)===String(lessonId));
  if(!l)return;
  let body="";
  if(l.content_type==="video")body=`<iframe class="video-frame" src="${esc(youtubeEmbed(l.content_url||""))}" allowfullscreen></iframe>`;
  else if(l.content_type==="pdf"){const u=await getStaffPdfSignedUrl(l.content_url);body=u?`<div class="pdf-shell"><div class="pdf-toolbar"><strong>${esc(l.title)}</strong><a class="secondary mini" href="${esc(u)}" target="_blank">Descargar PDF</a></div><iframe class="pdf-frame" src="${esc(u)}"></iframe></div>`:`<div class="empty">No se pudo abrir el PDF.</div>`;}
  else if(l.content_type==="text")body=`<div class="material-box" style="text-align:left;white-space:pre-wrap">${esc(l.text_content||"")}</div>`;
  else body=`<div class="material-box"><a class="primary" target="_blank" href="${esc(l.content_url||"#")}">Abrir material ↗</a></div>`;
  showModal(l.title,`${supportTextBlock(l.support_text_html)}${body}`,async()=>true,true);
}
function courseCard(c){
  const image=courseImage(c);
  const style=image?`background-image:url('${esc(image)}')`:`background:linear-gradient(140deg,${esc(c.color||"#7b0826")},#7650c8)`;
  return `<article class="course-card"><div class="course-cover ${image?"has-image":""}" style="${style}"><span class="course-code">${esc(c.code||"CURSO")}</span><span class="course-arrow">↗</span></div>
    <div class="course-body"><h3>${esc(c.name)}</h3><p>${esc(c.description||"")}</p><div class="meta"><span>${esc(c.teacher_name||"Córdoba Casting")}</span></div><div class="course-actions"><button class="primary open-course" data-course="${c.id}">Entrar al curso</button></div></div></article>`;
}
function dashboardHTML(){
  const r=state.profile.role;
  const title=r==="student"?"Tus cursos":r==="teacher"?"Cursos asignados":"Panel del aula";
  const sub=r==="student"?"Accedé a los módulos, materiales y consultas de cada curso.":r==="teacher"?"Consultá y actualizá el material de los cursos que tenés asignados.":"Administrá cursos, módulos, contenido, usuarios y actividad del aula.";
  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">Aula Virtual</div><h1>${title}</h1><p>${sub}</p></div></div><div class="grid">${state.courses.length?state.courses.map(courseCard).join(""):`<div class="empty">Todavía no hay cursos disponibles.</div>`}</div>`;
}
function coursesHTML(){return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">Formación</div><h1>Mis cursos</h1><p>Tu acceso se actualiza automáticamente según las comisiones y cursos que tengas asignados.</p></div></div><div class="grid">${state.courses.length?state.courses.map(courseCard).join(""):`<div class="empty">No tenés cursos asignados.</div>`}</div>`;}
function typeLabel(t){return t==="video"?"Video":t==="drive"?"Drive":t==="pdf"?"PDF":t==="text"?"Texto":"Enlace";}
function moduleHTML(m,i,cid){
  return `<div class="module"><div class="module-head"><div class="module-title"><div class="module-number">${i+1}</div><div><strong>${esc(m.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${m.lessons.length} contenidos</div></div></div></div>
    ${m.lessons.map((l,j)=>`<div class="lesson"><div class="lesson-index">${String(j+1).padStart(2,"0")}</div><div><h4>${esc(l.title)}</h4><p>${esc(l.description||"")}</p></div><div style="display:flex;gap:8px;align-items:center"><span class="lesson-type">${typeLabel(l.content_type)}</span><button class="lesson-view open-lesson" data-course="${cid}" data-lesson="${l.id}">Ver →</button></div></div>`).join("")}</div>`;
}

async function loadForum(courseId,force=false){
  if(state.forum[courseId]&&!force)return state.forum[courseId];
  const {data,error}=await sb.from("forum_threads").select(`
    id,course_id,user_id,title,body,link_url,created_at,
    author:profiles!forum_threads_user_id_fkey(full_name,role),
    replies:forum_replies(id,thread_id,user_id,body,link_url,created_at,author:profiles!forum_replies_user_id_fkey(full_name,role))
  `).eq("course_id",courseId).order("created_at",{ascending:false});
  if(error){console.error(error);state.forum[courseId]=[];return [];}
  (data||[]).forEach(t=>t.replies=(t.replies||[]).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)));
  state.forum[courseId]=data||[];return state.forum[courseId];
}
function forumHTML(course,threads){
  const student=state.profile.role==="student";
  const canEditForum=isStaff();
  const threadActions=(t)=>canEditForum?`<div class="forum-edit-actions"><button class="forum-mini-action edit-thread" data-thread="${t.id}" data-course="${course.id}" type="button">Editar publicación</button>${isAdmin()?`<button class="forum-mini-action danger delete-thread" data-thread="${t.id}" data-course="${course.id}" type="button">Borrar</button>`:""}</div>`:"";
  const replyHTML=(r)=>`<div class="forum-reply"><div class="forum-reply-head"><strong>${esc(r.author?.full_name||"Equipo docente")} · ${esc(roleName(r.author?.role||"teacher"))}</strong>${canEditForum?`<div class="forum-edit-actions"><button class="forum-mini-action edit-reply" data-reply="${r.id}" data-thread="${r.thread_id}" data-course="${course.id}" type="button">Editar</button>${isAdmin()?`<button class="forum-mini-action danger delete-reply" data-reply="${r.id}" data-course="${course.id}" type="button">Borrar</button>`:""}</div>`:""}</div><p>${esc(r.body)}</p>${r.link_url?`<a class="forum-link" href="${esc(r.link_url)}" target="_blank" rel="noopener">Abrir enlace ↗</a>`:""}</div>`;
  return `<div class="forum-layout"><div>${threads.length?threads.map(t=>`<article class="forum-thread"><div class="forum-thread-top"><div class="forum-meta"><strong>${esc(t.author?.full_name||"Alumno")}</strong><span>${new Date(t.created_at).toLocaleString("es-AR",{dateStyle:"medium",timeStyle:"short"})}</span></div>${threadActions(t)}</div><h3>${esc(t.title)}</h3><div class="forum-body">${esc(t.body)}</div>${t.link_url?`<a class="forum-link" href="${esc(t.link_url)}" target="_blank" rel="noopener">Abrir enlace ↗</a>`:""}<div class="reply-list">${(t.replies||[]).length?t.replies.map(replyHTML).join(""):`<div style="font-size:.8rem;color:var(--muted);padding:8px 0">Todavía no hay respuesta.</div>`}</div><form class="reply-form" data-thread="${t.id}" data-course="${course.id}"><textarea name="body" required placeholder="${student?"Dejá tu respuesta o link acá...":"Responder como "+roleName(state.profile.role)+"..."}"></textarea><input name="link_url" type="url" placeholder="Link opcional: https://..." style="flex:1;border:1px solid var(--line);border-radius:10px;padding:9px"><button class="primary mini">Responder</button></form></article>`).join(""):`<div class="empty">Todavía no hay consultas en este curso.</div>`}</div><aside class="forum-side"><div class="forum-composer"><h3>${student?"Nueva consulta":"Nueva instancia"}</h3><p style="font-size:.8rem;color:var(--muted)">${student?"Abrí una consulta, compartí un trabajo o dejá un enlace.":"Abrí una consigna, tarea, tema de conversación o espacio para recibir trabajos y links de los alumnos."}</p><form id="newThreadForm" data-course="${course.id}"><div class="field"><label>Título</label><input name="title" required maxlength="160" placeholder="${student?"Ej: Duda sobre la escena":"Ej: Entrega de monólogo — Clase 4"}"></div><div class="field"><label>${student?"Pregunta / comentario":"Consigna / descripción"}</label><textarea name="body" required></textarea></div><div class="field"><label>Enlace opcional</label><input name="link_url" type="url" placeholder="https://..."></div><button class="primary" style="width:100%">${student?"Publicar":"Abrir instancia"}</button></form></div></aside></div>`;
}
function openForumEditModal(kind,item,courseId){
  if(!isStaff())return;
  const isThread=kind==="thread";
  const body=isThread?`<div class="field"><label>Título</label><input name="title" required maxlength="160" value="${esc(item.title||"")}"></div><div class="field"><label>Texto</label><textarea name="body" required>${esc(item.body||"")}</textarea></div><div class="field"><label>Enlace opcional</label><input name="link_url" type="url" value="${esc(item.link_url||"")}" placeholder="https://..."></div>`:`<div class="field"><label>Respuesta</label><textarea name="body" required>${esc(item.body||"")}</textarea></div><div class="field"><label>Enlace opcional</label><input name="link_url" type="url" value="${esc(item.link_url||"")}" placeholder="https://..."></div>`;
  showModal(isThread?"Editar publicación":"Editar respuesta",body,async fd=>{
    const payload=Object.fromEntries(fd);payload.body=String(payload.body||"").trim();payload.link_url=String(payload.link_url||"").trim()||null;if(isThread)payload.title=String(payload.title||"").trim();
    if(!payload.body||(isThread&&!payload.title)){toast("Completá los campos obligatorios.",true);return false;}
    const table=isThread?"forum_threads":"forum_replies";const {error}=await sb.from(table).update(payload).eq("id",item.id);if(error){toast("No se pudo editar: "+error.message,true);return false;}
    delete state.forum[Number(courseId)];toast(isThread?"Publicación actualizada":"Respuesta actualizada");renderShell();
  });
}

async function courseHTML(id){
  const c=state.courses.find(x=>String(x.id)===String(id));if(!c)return `<div class="empty">No tenés acceso a este curso.</div>`;
  const image=courseImage(c);
  let inner="";
  if(state.courseTab==="forum"){
    const threads=await loadForum(c.id);
    inner=forumHTML(c,threads);
  }else{
    const mods=await loadCourseModules(c.id);
    inner=`<section class="panel"><div class="panel-head"><h2>Contenido del curso</h2><span class="tag">${mods.length} módulos</span></div>${mods.length?mods.map((m,i)=>moduleHTML(m,i,c.id)).join(""):`<div class="empty">Todavía no hay módulos publicados.</div>`}</section>`;
  }
  return `<div class="breadcrumb"><button class="lesson-view" data-back="courses">Mis cursos</button> / ${esc(c.name)}</div>
  <div class="hero"><div><div class="brand-kicker" style="color:#7b0826">${esc(c.code||"CURSO")}</div><h1>${esc(c.name)}</h1><p>${esc(c.description||"")}</p></div></div>
  <div class="course-tabs"><button class="course-tab ${state.courseTab==="content"?"active":""}" data-course-tab="content">Módulos y contenido</button><button class="course-tab ${state.courseTab==="forum"?"active":""}" data-course-tab="forum">Foro del curso</button></div>${inner}`;
}
function youtubeEmbed(url=""){if(url.includes("youtube.com/embed/"))return url;let m=url.match(/[?&]v=([^&#]+)/);if(m)return `https://www.youtube.com/embed/${m[1]}`;m=url.match(/youtu\.be\/([^?&#]+)/);if(m)return `https://www.youtube.com/embed/${m[1]}`;return url;}
async function getPdfSignedUrl(path){
  if(!path) return null;
  const {data,error}=await sb.storage.from("course-pdfs").createSignedUrl(path,3600);
  if(error){console.error(error);return null;}
  return data?.signedUrl||null;
}
async function uploadPdfFile(file,courseId,moduleId){
  if(!file) throw new Error("Seleccioná un archivo PDF.");
  if(file.type!=="application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) throw new Error("El archivo debe ser un PDF.");
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-");
  const path=`${courseId}/${moduleId}/${Date.now()}-${safeName}`;
  const {error}=await sb.storage.from("course-pdfs").upload(path,file,{contentType:"application/pdf",upsert:false});
  if(error) throw error;
  return path;
}
async function lessonHTML(cid,lid){
  const c=state.courses.find(x=>String(x.id)===String(cid)),mods=await loadCourseModules(c.id);let lesson=null,module=null;
  for(const m of mods){const f=m.lessons.find(l=>String(l.id)===String(lid));if(f){lesson=f;module=m;break;}}
  if(!lesson)return `<div class="empty">Contenido no encontrado.</div>`;
  let body="";
  if(lesson.content_type==="video"){
    body=`<iframe class="video-frame" src="${esc(youtubeEmbed(lesson.content_url||""))}" allowfullscreen></iframe>`;
  }else if(lesson.content_type==="pdf"){
    const pdfUrl=await getPdfSignedUrl(lesson.content_url);
    body=pdfUrl
      ? `<div class="pdf-shell"><div class="pdf-toolbar"><strong>${esc(lesson.title)}</strong><a class="secondary mini" href="${esc(pdfUrl)}" target="_blank" rel="noopener" download>Descargar PDF</a></div><iframe class="pdf-frame" src="${esc(pdfUrl)}#toolbar=1&navpanes=0" title="${esc(lesson.title)}"></iframe></div>`
      : `<div class="empty">No se pudo abrir el PDF. Probá nuevamente en unos segundos.</div>`;
  }else if(lesson.content_type==="text"){
    body=`<div class="material-box" style="text-align:left;white-space:pre-wrap">${esc(lesson.text_content||"")}</div>`;
  }else{
    body=`<div class="material-box"><h3>${esc(lesson.title)}</h3><p>${esc(lesson.description||"")}</p><a class="primary" style="display:inline-block;text-decoration:none" href="${esc(lesson.content_url||"#")}" target="_blank" rel="noopener">Abrir material ↗</a></div>`;
  }
  return `<div class="breadcrumb"><button class="lesson-view" data-course-back="${c.id}">${esc(c.name)}</button> / ${esc(module.title)}</div><div class="hero"><div><div class="brand-kicker" style="color:#7b0826">${typeLabel(lesson.content_type)}</div><h1>${esc(lesson.title)}</h1><p>${esc(lesson.description||"")}</p></div></div><section class="panel">${body}</section>`;
}

async function uploadHTML(){
  if(!isStaff())return `<div class="empty">Sin permiso.</div>`;
  let opts="";for(const c of state.courses){const mods=await loadCourseModules(c.id);for(const m of mods)opts+=`<option value="${c.id}|${m.id}">${esc(c.name)} — ${esc(m.title)}</option>`;}
  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">Contenido</div><h1>Subir material</h1><p>Agregá videos, documentos de Drive, textos o enlaces a los módulos de tus cursos.</p></div></div>
  <section class="panel"><form id="uploadForm"><div class="field"><label>Curso y módulo</label><select id="upTarget" required>${opts}</select></div><div class="field"><label>Título</label><input id="upTitle" required></div><div class="field"><label>Descripción</label><textarea id="upDesc"></textarea></div><div class="field"><label>Tipo</label><select id="upType"><option value="video">Video de YouTube</option><option value="pdf">PDF</option><option value="drive">Material de Drive</option><option value="link">Otro enlace</option></select></div><div class="field" id="upUrlField"><label>Enlace</label><input id="upUrl" type="url"></div><div class="field hidden" id="upPdfField"><label>Archivo PDF</label><input id="upPdf" type="file" accept="application/pdf,.pdf"><div style="font-size:.74rem;color:var(--muted)">El PDF se guardará en el Aula Virtual y podrá leerse dentro del curso.</div></div><div class="field"><label>Texto de apoyo</label>${supportEditorHTML("")}</div><button class="primary">Publicar contenido</button></form></section>`;
}
async function adminHTML(){
  const [{count:pc},{count:mc},{count:lc}]=await Promise.all([sb.from("profiles").select("*",{count:"exact",head:true}),sb.from("modules").select("*",{count:"exact",head:true}),sb.from("lessons").select("*",{count:"exact",head:true})]);
  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">Administración</div><h1>Panel general</h1><p>Vista rápida del Aula Virtual de Córdoba Casting.</p></div></div><section class="stats"><div class="stat"><strong>${pc??"—"}</strong><span>usuarios</span></div><div class="stat"><strong>${state.courses.length}</strong><span>cursos activos</span></div><div class="stat"><strong>${mc??"—"}</strong><span>módulos</span></div><div class="stat"><strong>${lc??"—"}</strong><span>contenidos</span></div></section><div class="admin-grid"><section class="panel"><div class="panel-head"><h2>Gestión</h2></div><div class="login-actions"><button class="secondary" data-viewjump="users">Usuarios y accesos</button><button class="secondary" data-viewjump="manage">Cursos y contenido</button></div></section><section class="panel"><div class="panel-head"><h2>Permisos</h2></div><p style="font-size:.86rem;color:var(--muted)">Los profesores pueden editar sus cursos, módulos y contenidos, y subir material. Sólo el administrador puede crear o eliminar cursos.</p></section></div>`;
}




async function usersHTML(){
  if(!isAdmin())return `<div class="empty">Sin permiso.</div>`;

  const {data:profiles,error}=await sb
    .from("profiles")
    .select("id,full_name,role,avatar_key,created_at")
    .order("created_at");

  if(error)return `<div class="empty">No se pudieron cargar los usuarios.</div>`;

  const {data:rows}=await sb.from("course_members").select("user_id,course_id");
  const memberships={};
  (rows||[]).forEach(r=>{
    memberships[r.user_id]??=[];
    memberships[r.user_id].push(r.course_id);
  });

  const order={admin:0,teacher:1,student:2};
  const sorted=[...(profiles||[])].sort((a,b)=>{
    const roleDiff=(order[a.role]??9)-(order[b.role]??9);
    if(roleDiff!==0)return roleDiff;
    return (a.full_name||"").localeCompare(b.full_name||"","es");
  });

  const renderUserCard=(p)=> {
    const userCourses=state.courses.filter(c=>(memberships[p.id]||[]).includes(c.id));
    const courseSummary=userCourses.length
      ? userCourses.slice(0,2).map(c=>esc(c.code||c.name)).join(" · ") + (userCourses.length>2?` +${userCourses.length-2}`:"")
      : "Sin cursos asignados";

    return `<article class="user-mini-card" data-user-search="${esc((p.full_name||"").toLowerCase())}">
      <button class="user-mini-main user-toggle-access" data-user="${p.id}" type="button">
        ${avatarHTML(p.avatar_key,p.full_name,"user-mini-avatar")}
        <span class="user-mini-copy">
          <strong>${esc(p.full_name)}</strong>
          <small>${esc(courseSummary)}</small>
        </span>
        <span class="user-chevron">⌄</span>
      </button>
      <div class="user-access-panel" data-access-panel="${p.id}">
        ${p.role!=="admin"?`<div class="user-role-manager"><div><span class="user-access-title">Tipo de usuario</span><small>${p.role==="teacher"?"Esta persona tiene permisos docentes.":"Esta persona actualmente es alumno/a."}</small></div><button class="${p.role==="teacher"?"secondary":"gold-button"} mini change-user-role" type="button" data-user="${p.id}" data-name="${esc(p.full_name)}" data-current-role="${p.role}" data-new-role="${p.role==="teacher"?"student":"teacher"}">${p.role==="teacher"?"Pasar a alumno/a":"Convertir en profesor/a"}</button></div>`:`<div class="user-role-manager admin-locked"><div><span class="user-access-title">Tipo de usuario</span><small>Administrador · permisos totales</small></div><span class="role-lock">Protegido</span></div>`}
        <div class="user-access-title">Cursos habilitados</div>
        ${state.courses.length
          ? state.courses.map(c=>`<label class="course-check compact">
              <input class="membership-check" type="checkbox" data-user="${p.id}" data-course="${c.id}" ${(memberships[p.id]||[]).includes(c.id)?"checked":""}>
              <span><strong>${esc(c.name)}</strong><small>${esc(c.code||"")}</small></span>
            </label>`).join("")
          : `<div class="empty compact-empty">No hay cursos activos.</div>`}
      </div>
    </article>`;
  };

  const group=(role,title,subtitle)=>{
    const items=sorted.filter(p=>p.role===role);
    return `<section class="user-role-section" data-role-section="${role}">
      <div class="user-role-heading">
        <div><h2>${title}</h2><p>${subtitle}</p></div>
        <span class="user-count">${items.length}</span>
      </div>
      <div class="user-mini-grid">
        ${items.length?items.map(renderUserCard).join(""):`<div class="empty">No hay usuarios en esta categoría.</div>`}
      </div>
    </section>`;
  };

  return `<div class="hero user-hero">
    <div>
      <div class="brand-kicker" style="color:#7b0826">Administración</div>
      <h1>Usuarios y accesos</h1>
      <p>Buscá personas, administrá sus cursos y definí quiénes son alumnos o profesores. Las cuentas nuevas se siguen creando desde Supabase.</p>
    </div>
  </div>

  <div class="user-search-wrap">
    <span class="user-search-icon">⌕</span>
    <input id="userSearch" type="search" placeholder="Buscar usuario por nombre..." autocomplete="off">
    <button id="clearUserSearch" class="user-search-clear hidden" type="button">×</button>
  </div>
  <div id="userSearchStatus" class="user-search-status"></div>

  <div id="userDirectory">
    ${group("admin","Administradores","Control total del Aula Virtual")}
    ${group("teacher","Profesores","Equipo docente y cursos asignados")}
    ${group("student","Alumnos","Usuarios inscriptos en cursos")}
  </div>`;
}

function manageModuleHTML(c,m,i){
  const teacher=!isAdmin();
  return `<div class="module"><div class="module-head"><div class="module-title"><div class="module-number">${i+1}</div><div><strong>${esc(m.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${m.lessons.length} contenidos</div></div></div>
  <div class="admin-actions"><button class="secondary mini edit-module" data-course="${c.id}" data-module="${m.id}">Editar módulo</button>${isAdmin()?`<button class="danger mini delete-module" data-course="${c.id}" data-module="${m.id}">Eliminar</button>`:""}<button class="gold-button mini add-lesson" data-course="${c.id}" data-module="${m.id}">+ Contenido</button></div></div>
  ${m.lessons.map((l,j)=>`<div class="lesson-admin-row"><div class="lesson-index">${String(j+1).padStart(2,"0")}</div><div><strong>${esc(l.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${typeLabel(l.content_type)} · Orden ${l.position}</div></div><div class="admin-actions"><button class="secondary mini edit-lesson" data-course="${c.id}" data-module="${m.id}" data-lesson="${l.id}">Editar</button>${isAdmin()?`<button class="danger mini delete-lesson" data-course="${c.id}" data-module="${m.id}" data-lesson="${l.id}">Eliminar</button>`:""}</div></div>`).join("")}</div>`;
}
async function manageHTML(){
  if(!isStaff())return `<div class="empty">Sin permiso.</div>`;
  let h="";
  for(const c of state.courses){const mods=await loadCourseModules(c.id);h+=`<section class="panel"><div class="panel-head"><div><h2>${esc(c.name)} · ${esc(c.code||"")}</h2><div style="font-size:.8rem;color:var(--muted)">${esc(c.teacher_name||"")}</div></div><div class="admin-actions"><button class="secondary edit-course" data-course="${c.id}">Editar curso</button>${isAdmin()?`<button class="gold-button add-module" data-course="${c.id}">+ Módulo</button><button class="danger delete-course" data-course="${c.id}">Eliminar curso</button>`:""}</div></div>${mods.length?mods.map((m,i)=>manageModuleHTML(c,m,i)).join(""):`<div class="empty">Sin módulos.</div>`}</section>`;}
  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">${isAdmin()?"Administración":"Profesor"}</div><h1>Cursos y contenido</h1><p>${isAdmin()?"Creá, editá y organizá toda la estructura del aula.":"Podés editar los cursos que tenés asignados, sus módulos y su contenido."}</p></div>${isAdmin()?`<button class="primary" id="newCourse">+ Nuevo curso</button>`:""}</div>${h}`;
}

function showModal(title,body,onSubmit,viewer=false){
  const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.innerHTML=`<div class="modal-card"><div class="modal-head"><h2>${esc(title)}</h2><button class="modal-close">×</button></div>${viewer?`<div>${body}</div>`:`<form id="modalForm">${body}<div class="modal-actions"><button type="button" class="secondary modal-cancel">Cancelar</button><button class="primary">Guardar</button></div></form>`}</div>`;document.body.appendChild(wrap);
  const close=()=>wrap.remove();wrap.querySelector(".modal-close").onclick=close;if(wrap.querySelector(".modal-cancel"))wrap.querySelector(".modal-cancel").onclick=close;wrap.onclick=e=>{if(e.target===wrap)close();};
  if(viewer)return;
  bindSupportEditors(wrap);
  const typeSelect=wrap.querySelector(".lesson-type-select");
  if(typeSelect){
    const syncType=()=>{
      const type=typeSelect.value;
      wrap.querySelector(".lesson-url-field")?.classList.toggle("hidden",type==="pdf"||type==="text");
      wrap.querySelector(".lesson-pdf-field")?.classList.toggle("hidden",type!=="pdf");
      wrap.querySelector(".lesson-text-field")?.classList.toggle("hidden",type!=="text");
    };
    typeSelect.onchange=syncType;syncType();
  }
  wrap.querySelector("#modalForm").onsubmit=async e=>{e.preventDefault();const ok=await onSubmit(new FormData(e.target));if(ok!==false)close();};
}
function courseForm(c={}){return `<div class="field"><label>Nombre</label><input name="name" required value="${esc(c.name||"")}"></div><div class="field"><label>Código / nivel</label><input name="code" value="${esc(c.code||"")}"></div><div class="field"><label>Descripción</label><textarea name="description">${esc(c.description||"")}</textarea></div><div class="field"><label>Docente</label><input name="teacher_name" value="${esc(c.teacher_name||"Córdoba Casting")}"></div><div class="field"><label>Color base</label><input name="color" type="color" value="${esc(c.color||"#7b0826")}"></div><div class="field"><label>Imagen de portada opcional (URL)</label><input name="cover_image_url" type="url" value="${esc(c.cover_image_url||"")}" placeholder="https://..."></div>`;}
function moduleForm(m={}){return `<div class="field"><label>Título</label><input name="title" required value="${esc(m.title||"")}"></div><div class="field"><label>Descripción</label><textarea name="description">${esc(m.description||"")}</textarea></div><div class="field"><label>Orden</label><input name="position" type="number" min="1" value="${Number(m.position||1)}"></div>`;}
function lessonForm(l={}){return `<div class="field"><label>Título</label><input name="title" required value="${esc(l.title||"")}"></div><div class="field"><label>Descripción</label><textarea name="description">${esc(l.description||"")}</textarea></div><div class="field"><label>Tipo</label><select name="content_type" class="lesson-type-select"><option value="video" ${l.content_type==="video"?"selected":""}>Video de YouTube</option><option value="pdf" ${l.content_type==="pdf"?"selected":""}>PDF</option><option value="drive" ${l.content_type==="drive"?"selected":""}>Drive</option><option value="link" ${l.content_type==="link"?"selected":""}>Enlace</option><option value="text" ${l.content_type==="text"?"selected":""}>Texto</option></select></div><div class="field lesson-url-field ${l.content_type==="pdf"||l.content_type==="text"?"hidden":""}"><label>URL</label><input name="content_url" type="url" value="${l.content_type==="pdf"?"":esc(l.content_url||"")}"></div><div class="field lesson-pdf-field ${l.content_type==="pdf"?"":"hidden"}"><label>${l.content_type==="pdf"?"Reemplazar PDF (opcional)":"Archivo PDF"}</label><input name="pdf_file" type="file" accept="application/pdf,.pdf">${l.content_type==="pdf"?`<div style="font-size:.74rem;color:var(--muted)">Si no seleccionás otro archivo, se conserva el PDF actual.</div>`:""}</div><div class="field lesson-text-field ${l.content_type==="text"?"":"hidden"}"><label>Texto</label><textarea name="text_content">${esc(l.text_content||"")}</textarea></div><div class="field"><label>Texto de apoyo</label>${supportEditorHTML(l.support_text_html||"")}</div><div class="field"><label>Orden</label><input name="position" type="number" min="1" value="${Number(l.position||1)}"></div>`;}


/* ==========================================================
   V12 · ENTRENAMIENTO + DESAFÍOS
   ========================================================== */

function randomOf(arr){return arr[Math.floor(Math.random()*arr.length)];}

async function loadPublishedChallenges(){
  const {data,error}=await sb.from("challenge_cards").select("*").eq("is_published",true).order("position",{ascending:true});
  if(error)return {data:[],error};
  return {data:data||[],error:null};
}
async function loadChallengeSettings(){
  const {data}=await sb.from("challenge_settings").select("*").eq("id",1).maybeSingle();
  return data||{
    kicker:"DESAFÍOS DE LA COMUNIDAD",
    hero_title:"Una consigna. Una línea. Tu toma.",
    hero_description:"Córdoba Casting va activando nuevos desafíos semanales. Cualquier alumno puede participar, sin importar qué curso esté haciendo."
  };
}
function normalizeLines(v){
  return String(v||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
}
function cardWithoutLine(c){
  return {
    db_id:c.id,
    title:c.title||"Desafío",
    category:c.category||"Actuación",
    time:c.duration_label||"",
    focus:c.focus||"",
    prompt:c.prompt||"",
    rules:Array.isArray(c.rules)?c.rules:[],
    lines:Array.isArray(c.dialogue_lines)?c.dialogue_lines:[],
    line:null
  };
}
function challengeCardHTML(draw){
  if(!draw)return "";
  return `<article class="challenge-draw-card">
    <div class="challenge-draw-top"><span>${esc(draw.category||"Desafío")}</span><span>${esc(draw.time||"")}</span></div>
    <h2 class="challenge-card-title">${esc(draw.title||"Desafío")}</h2>
    ${draw.line
      ? `<div class="challenge-line-label">TU FRASE</div><blockquote class="challenge-line">“${esc(draw.line)}”</blockquote>`
      : `<div class="challenge-no-line"><span>FRASE ALEATORIA</span><strong>Todavía no sacaste tu frase.</strong></div>`}
    <p class="challenge-prompt">${esc(draw.prompt||"")}</p>
    <div class="challenge-rules">${(draw.rules||[]).map(x=>`<div><span>✓</span>${esc(x)}</div>`).join("")}</div>
    <div class="challenge-focus"><small>FOCO</small><strong>${esc(draw.focus||"")}</strong></div>
    <div class="challenge-card-actions">
      ${draw.line
        ? `<button class="secondary pick-phrase" type="button">↻ Sortear otra frase</button><button class="primary open-challenge-submit" type="button">Entregar desafío</button>`
        : `<button class="gold-button pick-phrase" type="button">Sacar mi frase</button>`}
    </div>
  </article>`;
}
function openPhrasePicker(draw){
  if(!draw?.lines?.length){toast("Este desafío todavía no tiene frases cargadas.",true);return;}
  const overlay=document.createElement("div");
  overlay.className="phrase-picker-overlay";
  const count=Math.max(7,Math.min(12,draw.lines.length*2));
  overlay.innerHTML=`<div class="phrase-picker-box">
    <button class="phrase-picker-close" type="button">×</button>
    <div class="phrase-picker-copy"><span>SORTEO DE FRASE</span><h2>Elegí una esfera</h2><p>Las frases están mezcladas. Tocá una para descubrir cuál te tocó.</p></div>
    <div class="phrase-orbit">${Array.from({length:count},(_,i)=>`<button class="phrase-ball" type="button" style="--i:${i};--n:${count}"><img src="assets/logo.png" alt=""></button>`).join("")}</div>
  </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(()=>overlay.classList.add("show"));
  overlay.querySelector(".phrase-picker-close").onclick=()=>overlay.remove();
  overlay.querySelectorAll(".phrase-ball").forEach(ball=>ball.onclick=()=>{
    const selected=randomOf(draw.lines);
    state.challengeDraw={...draw,line:selected};
    overlay.classList.add("picked");
    overlay.querySelector(".phrase-picker-copy").innerHTML=`<span>TU FRASE</span><h2>“${esc(selected)}”</h2><p>Esta frase queda asignada a este intento.</p>`;
    overlay.querySelectorAll(".phrase-ball").forEach(x=>x.disabled=true);
    setTimeout(()=>{overlay.remove();renderShell();},1100);
  });
}
async function loadChallengeNotificationState(){
  if(!state.user){state.unreadChallengeCount=0;return;}
  const [{data:published},{data:seen}]=await Promise.all([
    sb.from("challenge_cards").select("id,published_at").eq("is_published",true).not("published_at","is",null),
    sb.from("challenge_seen").select("challenge_id").eq("user_id",state.user.id)
  ]);
  const seenIds=new Set((seen||[]).map(x=>String(x.challenge_id)));
  state.unreadChallengeCount=(published||[]).filter(x=>!seenIds.has(String(x.id))).length;
}
async function markChallengeSeen(challengeId){
  if(!state.user||!challengeId)return;
  await sb.from("challenge_seen").upsert({
    user_id:state.user.id,
    challenge_id:Number(challengeId),
    seen_at:new Date().toISOString()
  },{onConflict:"user_id,challenge_id"});
  await loadChallengeNotificationState();
}
async function notificationsHTML(){
  const [{data:cards,error},{data:seen}]=await Promise.all([
    sb.from("challenge_cards").select("id,title,category,duration_label,focus,prompt,published_at,is_published").eq("is_published",true).order("published_at",{ascending:false}),
    sb.from("challenge_seen").select("challenge_id,seen_at").eq("user_id",state.user.id)
  ]);
  if(error)return `<div class="empty">No se pudieron cargar las notificaciones.<br>${esc(error.message)}</div>`;
  const seenIds=new Set((seen||[]).map(x=>String(x.challenge_id)));
  const unread=(cards||[]).filter(c=>!seenIds.has(String(c.id)));
  return `<div class="notifications-hero">
    <div><div class="brand-kicker">NOTIFICACIONES</div><h1>${unread.length?`${unread.length} ${unread.length===1?"novedad":"novedades"}`:"Estás al día"}</h1><p>Acá te avisamos cuando Córdoba Casting activa un nuevo desafío para la comunidad.</p></div>
    <div class="notification-bell">🔔</div>
  </div>
  <section class="notifications-list">${(cards||[]).length?(cards||[]).map(c=>{
    const fresh=!seenIds.has(String(c.id));
    return `<article class="notification-card ${fresh?"unread":""}">
      <div class="notification-dot">${fresh?"●":"✓"}</div>
      <div class="notification-copy">
        <div class="notification-meta">${fresh?"NUEVO DESAFÍO":"DESAFÍO"} · ${esc(c.category||"Actuación")}</div>
        <h3>${esc(c.title||"Desafío disponible")}</h3>
        <p>${esc(c.prompt)}</p>
        <small>${c.published_at?new Date(c.published_at).toLocaleDateString("es-AR",{day:"numeric",month:"long"}):""}${c.duration_label?` · ${esc(c.duration_label)}`:""}</small>
      </div>
      <button class="${fresh?"gold-button":"secondary"} open-notification-challenge" data-id="${c.id}" type="button">Ver desafío</button>
    </article>`;
  }).join(""):`<div class="empty">Todavía no hay notificaciones.</div>`}</section>`;
}
async function challengesHTML(){
  const [{data,error},settings]=await Promise.all([loadPublishedChallenges(),loadChallengeSettings()]);
  if(error)return `<div class="empty">No se pudieron cargar los desafíos.<br>${esc(error.message)}</div>`;
  if(!state.challengeDraw && data.length)state.challengeDraw=cardWithoutLine(data[0]);
  if(state.challengeDraw && !data.some(x=>String(x.id)===String(state.challengeDraw.db_id)))state.challengeDraw=data.length?cardWithoutLine(data[0]):null;
  const {data:attempts}=await sb.from("challenge_attempts").select("id,challenge_id,status,feedback,created_at").eq("user_id",state.user.id).order("created_at",{ascending:false}).limit(8);
  return `<div class="practice-hero challenge-hero"><div><div class="brand-kicker">${esc(settings.kicker||"DESAFÍOS")}</div><h1>${esc(settings.hero_title||"Desafíos")}</h1><p>${esc(settings.hero_description||"")}</p></div><div class="practice-orbit">⚡</div></div>
  ${data.length?`<section class="practice-controls"><div><strong>${data.length} ${data.length===1?"desafío activo":"desafíos activos"}</strong><span> Elegí uno y después sorteá tu frase.</span></div>${data.length>1?`<select id="activeChallengeSelect">${data.map(c=>`<option value="${c.id}" ${String(state.challengeDraw?.db_id)===String(c.id)?"selected":""}>${esc(c.title||c.category||"Desafío")}</option>`).join("")}</select>`:""}</section><div id="challengeDraw">${challengeCardHTML(state.challengeDraw)}</div>`:`<div class="empty">Todavía no hay desafíos publicados.</div>`}
  <section class="panel challenge-history"><div class="panel-head"><h2>Mis entregas</h2></div>${attempts?.length?attempts.map(a=>`<div class="attempt-row"><div><strong>${a.status==="reviewed"?"Con devolución":a.status==="completed"?"Completado":"Entregado"}</strong><small>${new Date(a.created_at).toLocaleDateString("es-AR")}</small></div>${a.feedback?`<p>${esc(a.feedback)}</p>`:"<span>Esperando devolución</span>"}</div>`).join(""):`<div class="empty">Todavía no entregaste desafíos.</div>`}</section>`;
}
function challengeSubmitModal(draw){
  if(!draw?.db_id||!draw?.line){toast("Primero sacá una frase.",true);return;}
  markChallengeSeen(draw.db_id);
  showModal("Entregar desafío",`<div class="submission-summary"><span>${esc(draw.title||draw.category)}</span><blockquote>“${esc(draw.line)}”</blockquote></div>
    <div class="field"><label>Link de tu toma</label><input name="submission_url" type="url" required placeholder="https://drive.google.com/..."></div>
    <div class="field"><label>¿Qué descubriste? <small>(opcional)</small></label><textarea name="reflection" placeholder="Una o dos líneas sobre la toma..."></textarea></div>`,async fd=>{
      const v=Object.fromEntries(fd);
      const {error}=await sb.from("challenge_attempts").insert({challenge_id:draw.db_id,user_id:state.user.id,dialogue_line:draw.line,submission_url:v.submission_url,reflection:v.reflection||null,status:"submitted"});
      if(error){toast("No se pudo entregar: "+error.message,true);return false;}
      toast("Desafío entregado ✓");state.challengeDraw={...draw,line:null};renderShell();
  });
}
function challengeEditorModal(card=null){
  if(!isAdmin())return;
  const editing=!!card;
  const rules=(card?.rules||[]).join("\n");
  const lines=(card?.dialogue_lines||[]).join("\n");
  showModal(editing?"Editar desafío":"Nuevo desafío",`<div class="challenge-editor-grid">
    <div class="field wide"><label>Título del desafío</label><input name="title" required value="${esc(card?.title||"")}" placeholder="Ej: La espera"></div>
    <div class="field"><label>Categoría</label><input name="category" required value="${esc(card?.category||"Cámara")}"></div>
    <div class="field"><label>Duración</label><input name="duration_label" value="${esc(card?.duration_label||"10 min")}"></div>
    <div class="field wide"><label>Descripción / consigna</label><textarea name="prompt" required>${esc(card?.prompt||"")}</textarea></div>
    <div class="field wide"><label>Foco</label><input name="focus" required value="${esc(card?.focus||"")}"></div>
    <div class="field wide"><label>Reglas <small>una por línea</small></label><textarea name="rules_text">${esc(rules)}</textarea></div>
    <div class="field wide"><label>Frases aleatorias <small>una por línea</small></label><textarea name="lines_text" class="challenge-lines-editor" required>${esc(lines)}</textarea><small>Si querés que siempre salga la misma frase, dejá una sola.</small></div>
    <div class="field"><label>Orden</label><input name="position" type="number" min="1" value="${Number(card?.position||1)}"></div>
    <label class="challenge-publish-check"><input type="checkbox" name="is_published" ${card?.is_published?"checked":""}> Publicado para alumnos</label>
  </div>`,async fd=>{
    const v=Object.fromEntries(fd);
    const dialogue_lines=normalizeLines(v.lines_text);
    if(!dialogue_lines.length){toast("Agregá al menos una frase.",true);return false;}
    const publishing=v.is_published==="on";
    const payload={
      title:String(v.title||"").trim(),
      category:String(v.category||"").trim(),
      duration_label:String(v.duration_label||"").trim()||null,
      prompt:String(v.prompt||"").trim(),
      focus:String(v.focus||"").trim(),
      rules:normalizeLines(v.rules_text),
      dialogue_lines,
      position:Number(v.position||1),
      is_published:publishing
    };
    if(publishing&&!card?.is_published)payload.published_at=new Date().toISOString();
    if(!publishing)payload.published_at=card?.published_at||null;
    const query=editing?sb.from("challenge_cards").update(payload).eq("id",card.id):sb.from("challenge_cards").insert(payload);
    const {error}=await query;
    if(error){toast("No se pudo guardar: "+error.message,true);return false;}
    toast(editing?"Desafío actualizado":"Desafío creado");state.challengeDraw=null;renderShell();
  });
}
async function challengeHeroEditor(){
  if(!isAdmin())return;
  const s=await loadChallengeSettings();
  showModal("Editar presentación de Desafíos",`<div class="field"><label>Texto superior</label><input name="kicker" value="${esc(s.kicker||"")}"></div><div class="field"><label>Título principal</label><input name="hero_title" required value="${esc(s.hero_title||"")}"></div><div class="field"><label>Descripción</label><textarea name="hero_description" required>${esc(s.hero_description||"")}</textarea></div>`,async fd=>{
    const v=Object.fromEntries(fd);
    const {error}=await sb.from("challenge_settings").upsert({id:1,kicker:String(v.kicker||"").trim(),hero_title:String(v.hero_title||"").trim(),hero_description:String(v.hero_description||"").trim(),updated_at:new Date().toISOString()});
    if(error){toast(error.message,true);return false;}
    toast("Presentación actualizada");renderShell();
  });
}
async function challengeAdminHTML(){
  if(!isAdmin())return `<div class="empty">Sin permiso.</div>`;
  const [{data,error},settings]=await Promise.all([
    sb.from("challenge_cards").select("*").order("position",{ascending:true}),
    loadChallengeSettings()
  ]);
  if(error)return `<div class="empty">Ejecutá primero supabase_v15_UNICA.sql.<br>${esc(error.message)}</div>`;
  const {data:attempts}=await sb.from("challenge_attempts").select("id,challenge_id,user_id,dialogue_line,submission_url,reflection,status,feedback,created_at,profiles:user_id(full_name)").order("created_at",{ascending:false}).limit(30);
  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">Administración</div><h1>Gestionar desafíos</h1><p>Creá tarjetas, editá toda la consigna y sus frases, y decidí cuál está activo para los alumnos.</p></div><div class="hero-actions"><button class="secondary edit-challenge-hero">Editar presentación</button><button class="primary new-challenge">+ Nuevo desafío</button></div></div>
  <div class="challenge-admin-message"><small>ASÍ LO VEN LOS ALUMNOS</small><strong>${esc(settings.hero_title||"")}</strong><span>${esc(settings.hero_description||"")}</span></div>
  <section class="challenge-admin-grid">${(data||[]).map(c=>`<article class="challenge-admin-card ${c.is_published?"published":""}">
    <div><span>${esc(c.category)} · ${esc(c.duration_label||"")}</span><h3>${esc(c.title||"Desafío")}</h3><p>${esc(c.prompt)}</p>
      <div class="admin-lines-preview"><small>FRASES (${(c.dialogue_lines||[]).length})</small>${(c.dialogue_lines||[]).slice(0,5).map(x=>`<em>“${esc(x)}”</em>`).join("")}${(c.dialogue_lines||[]).length>5?`<b>+ ${(c.dialogue_lines||[]).length-5} más</b>`:""}</div>
    </div>
    <div class="challenge-admin-actions"><button class="secondary edit-challenge" data-id="${c.id}">Editar todo</button><button class="${c.is_published?"secondary":"gold-button"} toggle-challenge" data-id="${c.id}" data-published="${c.is_published}">${c.is_published?"Pausar":"Publicar"}</button><button class="danger-button delete-challenge" data-id="${c.id}" data-title="${esc(c.title||"Desafío")}">Borrar</button></div>
  </article>`).join("")}</section>
  <section class="panel"><div class="panel-head"><h2>Entregas recientes</h2></div>${attempts?.length?attempts.map(a=>`<div class="challenge-review-row"><div><strong>${esc(a.profiles?.full_name||"Alumno")}</strong><span>“${esc(a.dialogue_line)}”</span>${a.reflection?`<small>${esc(a.reflection)}</small>`:""}</div><div class="review-actions"><a class="secondary mini" href="${esc(a.submission_url)}" target="_blank" rel="noopener">Ver toma ↗</a><button class="primary mini review-challenge" data-id="${a.id}" data-feedback="${esc(a.feedback||"")}">${a.status==="reviewed"?"Editar devolución":"Devolver"}</button></div></div>`).join(""):`<div class="empty">Todavía no hay entregas.</div>`}</section>`;
}

async function renderContent(){
  const c=document.getElementById("content");c.innerHTML=`<div class="empty">Cargando...</div>`;
  if(state.view==="dashboard")c.innerHTML=dashboardHTML();
  else if(state.view==="courses")c.innerHTML=coursesHTML();
  else if(state.view==="course")c.innerHTML=await courseHTML(state.courseId);
  else if(state.view==="lesson")c.innerHTML=await lessonHTML(state.courseId,state.lessonId);
  else if(state.view==="upload")c.innerHTML=await uploadHTML();
  else if(state.view==="admin")c.innerHTML=await adminHTML();
  else if(state.view==="users")c.innerHTML=await usersHTML();
  else if(state.view==="manage")c.innerHTML=await manageHTML();
  else if(state.view==="teachers")c.innerHTML=await teachersHTML();
  else if(state.view==="exercise-library")c.innerHTML=await staffLibraryHTML("exercise-library");
  else if(state.view==="scripts-library")c.innerHTML=await staffLibraryHTML("scripts");
  else if(state.view==="challenges")c.innerHTML=await challengesHTML();
  else if(state.view==="notifications")c.innerHTML=await notificationsHTML();
  else if(state.view==="challenge-admin")c.innerHTML=await challengeAdminHTML();
  bindContent();
}
function bindContent(){
  bindSupportEditors(document);
  document.querySelectorAll(".open-course").forEach(b=>b.onclick=()=>{state.courseId=b.dataset.course;state.view="course";state.courseTab="content";renderShell();});
  document.querySelectorAll(".open-lesson").forEach(b=>b.onclick=()=>{state.courseId=b.dataset.course;state.lessonId=b.dataset.lesson;state.view="lesson";renderShell();});
  document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>{state.view=b.dataset.back;renderShell();});
  document.querySelectorAll("[data-course-back]").forEach(b=>b.onclick=()=>{state.courseId=b.dataset.courseBack;state.view="course";state.courseTab="content";renderShell();});
  document.querySelectorAll("[data-viewjump]").forEach(b=>b.onclick=()=>{state.view=b.dataset.viewjump;renderShell();});
  document.querySelectorAll("[data-course-tab]").forEach(b=>b.onclick=()=>{state.courseTab=b.dataset.courseTab;renderShell();});

  const upload=document.getElementById("uploadForm");
  const upType=document.getElementById("upType");
  if(upType){
    const syncUploadType=()=>{
      const isPdf=upType.value==="pdf";
      document.getElementById("upUrlField")?.classList.toggle("hidden",isPdf);
      document.getElementById("upPdfField")?.classList.toggle("hidden",!isPdf);
    };
    upType.onchange=syncUploadType;syncUploadType();
  }
  if(upload)upload.onsubmit=async e=>{
    e.preventDefault();
    const [cid,mid]=document.getElementById("upTarget").value.split("|");
    const mods=await loadCourseModules(cid),m=mods.find(x=>String(x.id)===String(mid));
    const type=document.getElementById("upType").value;
    let content_url=document.getElementById("upUrl").value.trim();
    try{
      if(type==="pdf") content_url=await uploadPdfFile(document.getElementById("upPdf").files[0],cid,mid);
      if(type!=="pdf" && !content_url){toast("Agregá un enlace.",true);return;}
      const payload={module_id:Number(mid),title:document.getElementById("upTitle").value.trim(),description:document.getElementById("upDesc").value.trim(),content_type:type,content_url,support_text_html:sanitizeSupportHtml(upload.querySelector('[name="support_text_html"]')?.value||""),position:(m?.lessons?.length||0)+1,created_by:state.user.id};
      const {error}=await sb.from("lessons").insert(payload);
      if(error){toast(error.message,true);return;}
      delete state.modules[cid];toast("Contenido publicado");upload.reset();
      if(upType)syncUploadType();
    }catch(err){toast(err.message||"No se pudo subir el PDF",true);}
  };

  const nt=document.getElementById("newThreadForm");
  if(nt)nt.onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);const payload=Object.fromEntries(fd);payload.course_id=Number(e.target.dataset.course);payload.user_id=state.user.id;if(!payload.link_url)payload.link_url=null;const {error}=await sb.from("forum_threads").insert(payload);if(error){toast("No se pudo publicar: "+error.message,true);return;}delete state.forum[payload.course_id];toast("Consulta publicada");renderShell();};
  document.querySelectorAll(".reply-form").forEach(f=>f.onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);const body=fd.get("body");const link_url=fd.get("link_url")?.trim()||null;const courseId=Number(e.target.dataset.course);const {error}=await sb.from("forum_replies").insert({thread_id:Number(e.target.dataset.thread),user_id:state.user.id,body,link_url});if(error){toast("No se pudo responder: "+error.message,true);return;}delete state.forum[courseId];toast("Respuesta publicada");renderShell();});

  document.querySelectorAll(".membership-check").forEach(ch=>ch.onchange=async()=>{const user_id=ch.dataset.user,course_id=Number(ch.dataset.course);ch.disabled=true;let error;if(ch.checked)({error}=await sb.from("course_members").insert({user_id,course_id}));else({error}=await sb.from("course_members").delete().eq("user_id",user_id).eq("course_id",course_id));ch.disabled=false;if(error){ch.checked=!ch.checked;toast(error.message,true);}else toast("Acceso actualizado");});

  document.querySelectorAll(".user-toggle-access").forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.user;
    const panel=document.querySelector(`[data-access-panel="${id}"]`);
    const card=btn.closest(".user-mini-card");
    const wasOpen=card?.classList.contains("open");
    document.querySelectorAll(".user-mini-card.open").forEach(x=>x.classList.remove("open"));
    document.querySelectorAll(".user-access-panel.open").forEach(x=>x.classList.remove("open"));
    if(!wasOpen){card?.classList.add("open");panel?.classList.add("open");}
  });

  const userSearch=document.getElementById("userSearch");
  const clearUserSearch=document.getElementById("clearUserSearch");
  const searchStatus=document.getElementById("userSearchStatus");
  if(userSearch){
    const runUserSearch=()=>{
      const term=userSearch.value.trim().toLowerCase();
      let visible=0;
      document.querySelectorAll(".user-mini-card").forEach(card=>{
        const match=!term || (card.dataset.userSearch||"").includes(term);
        card.classList.toggle("search-hidden",!match);
        if(match)visible++;
      });
      document.querySelectorAll(".user-role-section").forEach(section=>{
        const hasVisible=[...section.querySelectorAll(".user-mini-card")].some(c=>!c.classList.contains("search-hidden"));
        section.classList.toggle("search-hidden",!hasVisible && !!term);
      });
      clearUserSearch?.classList.toggle("hidden",!term);
      if(searchStatus)searchStatus.textContent=term?`${visible} resultado${visible===1?"":"s"}`:"";
    };
    userSearch.oninput=runUserSearch;
    clearUserSearch.onclick=()=>{userSearch.value="";runUserSearch();userSearch.focus();};
  }


  const nc=document.getElementById("newCourse");if(nc)nc.onclick=()=>showModal("Nuevo curso",courseForm(),async fd=>{const p=Object.fromEntries(fd);if(!p.cover_image_url)delete p.cover_image_url;const {error}=await sb.from("courses").insert({...p,is_active:true});if(error){toast(error.message,true);return false;}await loadCourses();toast("Curso creado");renderShell();});
  document.querySelectorAll(".edit-course").forEach(b=>b.onclick=()=>{const course=state.courses.find(x=>String(x.id)===b.dataset.course);showModal("Editar curso",courseForm(course),async fd=>{const p=Object.fromEntries(fd);if(!p.cover_image_url)p.cover_image_url=null;const {error}=await sb.from("courses").update(p).eq("id",course.id);if(error){toast(error.message,true);return false;}await loadCourses();toast("Curso actualizado");renderShell();});});
  document.querySelectorAll(".delete-course").forEach(b=>b.onclick=async()=>{if(!isAdmin())return;const c=state.courses.find(x=>String(x.id)===b.dataset.course);if(!confirm(`¿Eliminar el curso “${c.name}”?`))return;const {error}=await sb.from("courses").delete().eq("id",c.id);if(error){toast(error.message,true);return;}delete state.modules[c.id];await loadCourses();toast("Curso eliminado");renderShell();});

  document.querySelectorAll(".add-module").forEach(b=>b.onclick=async()=>{if(!isAdmin())return;const cid=Number(b.dataset.course),mods=await loadCourseModules(cid);showModal("Nuevo módulo",moduleForm({position:mods.length+1}),async fd=>{const p=Object.fromEntries(fd);p.course_id=cid;p.position=Number(p.position);const {error}=await sb.from("modules").insert(p);if(error){toast(error.message,true);return false;}delete state.modules[cid];toast("Módulo creado");renderShell();});});
  document.querySelectorAll(".edit-module").forEach(b=>b.onclick=async()=>{const cid=Number(b.dataset.course),mods=await loadCourseModules(cid),m=mods.find(x=>String(x.id)===b.dataset.module);showModal("Editar módulo",moduleForm(m),async fd=>{const p=Object.fromEntries(fd);p.position=Number(p.position);const {error}=await sb.from("modules").update(p).eq("id",m.id);if(error){toast(error.message,true);return false;}delete state.modules[cid];toast("Módulo actualizado");renderShell();});});
  document.querySelectorAll(".delete-module").forEach(b=>b.onclick=async()=>{if(!isAdmin())return;const cid=Number(b.dataset.course),mods=await loadCourseModules(cid),m=mods.find(x=>String(x.id)===b.dataset.module);if(!confirm(`¿Eliminar el módulo “${m.title}”?`))return;const {error}=await sb.from("modules").delete().eq("id",m.id);if(error){toast(error.message,true);return;}delete state.modules[cid];toast("Módulo eliminado");renderShell();});

  document.querySelectorAll(".add-lesson").forEach(b=>b.onclick=async()=>{
    const cid=Number(b.dataset.course),mid=Number(b.dataset.module),mods=await loadCourseModules(cid),m=mods.find(x=>x.id===mid);
    showModal("Agregar contenido",lessonForm({content_type:"video",position:m.lessons.length+1}),async fd=>{
      const p=Object.fromEntries(fd);const file=fd.get("pdf_file");delete p.pdf_file;p.support_text_html=sanitizeSupportHtml(p.support_text_html||"");
      p.module_id=mid;p.position=Number(p.position);p.created_by=state.user.id;
      try{
        if(p.content_type==="pdf") p.content_url=await uploadPdfFile(file,cid,mid);
        else if(p.content_type==="text") p.content_url=null;
        else if(!p.content_url){toast("Agregá una URL",true);return false;}
        const {error}=await sb.from("lessons").insert(p);
        if(error){toast(error.message,true);return false;}
        delete state.modules[cid];toast("Contenido agregado");renderShell();
      }catch(err){toast(err.message||"No se pudo subir el PDF",true);return false;}
    });
  });
  document.querySelectorAll(".edit-lesson").forEach(b=>b.onclick=async()=>{
    const cid=Number(b.dataset.course),mid=Number(b.dataset.module),mods=await loadCourseModules(cid),m=mods.find(x=>x.id===mid),l=m.lessons.find(x=>String(x.id)===b.dataset.lesson);
    showModal("Editar contenido",lessonForm(l),async fd=>{
      const p=Object.fromEntries(fd);const file=fd.get("pdf_file");delete p.pdf_file;p.support_text_html=sanitizeSupportHtml(p.support_text_html||"");p.position=Number(p.position);
      try{
        if(p.content_type==="pdf"){
          if(file && file.size) p.content_url=await uploadPdfFile(file,cid,mid);
          else p.content_url=l.content_type==="pdf"?l.content_url:null;
          if(!p.content_url){toast("Seleccioná un PDF.",true);return false;}
        }else if(p.content_type==="text"){
          p.content_url=null;
        }else if(!p.content_url){
          toast("Agregá una URL",true);return false;
        }
        const {error}=await sb.from("lessons").update(p).eq("id",l.id);
        if(error){toast(error.message,true);return false;}
        delete state.modules[cid];toast("Contenido actualizado");renderShell();
      }catch(err){toast(err.message||"No se pudo subir el PDF",true);return false;}
    });
  });
  document.querySelectorAll(".delete-lesson").forEach(b=>b.onclick=async()=>{if(!isAdmin())return;const cid=Number(b.dataset.course),mid=Number(b.dataset.module),mods=await loadCourseModules(cid),m=mods.find(x=>x.id===mid),l=m.lessons.find(x=>String(x.id)===b.dataset.lesson);if(!confirm(`¿Eliminar “${l.title}”?`))return;const {error}=await sb.from("lessons").delete().eq("id",l.id);if(error){toast(error.message,true);return;}delete state.modules[cid];toast("Contenido eliminado");renderShell();});

  document.querySelectorAll(".add-staff-module").forEach(b=>b.onclick=async()=>{
    const sid=Number(b.dataset.space),mods=await loadStaffModules(sid);
    showModal("Nuevo módulo",moduleForm({position:mods.length+1}),async fd=>{const p=Object.fromEntries(fd);p.space_id=sid;p.position=Number(p.position);const {error}=await sb.from("staff_modules").insert(p);if(error){toast(error.message,true);return false;}delete state.staffModules[sid];toast("Módulo creado");renderShell();});
  });
  document.querySelectorAll(".edit-staff-module").forEach(b=>b.onclick=async()=>{
    const sid=Number(b.dataset.space),mods=await loadStaffModules(sid),m=mods.find(x=>String(x.id)===b.dataset.module);
    showModal("Editar módulo",moduleForm(m),async fd=>{const p=Object.fromEntries(fd);p.position=Number(p.position);const {error}=await sb.from("staff_modules").update(p).eq("id",m.id);if(error){toast(error.message,true);return false;}delete state.staffModules[sid];toast("Módulo actualizado");renderShell();});
  });
  document.querySelectorAll(".delete-staff-module").forEach(b=>b.onclick=async()=>{
    if(!isAdmin())return;const sid=Number(b.dataset.space),mods=await loadStaffModules(sid),m=mods.find(x=>String(x.id)===b.dataset.module);if(!confirm(`¿Eliminar “${m.title}”?`))return;
    const {error}=await sb.from("staff_modules").delete().eq("id",m.id);if(error){toast(error.message,true);return;}delete state.staffModules[sid];toast("Módulo eliminado");renderShell();
  });
  document.querySelectorAll(".add-staff-lesson").forEach(b=>b.onclick=async()=>{
    const sid=Number(b.dataset.space),mid=Number(b.dataset.module),mods=await loadStaffModules(sid),m=mods.find(x=>x.id===mid);
    showModal("Agregar contenido",lessonForm({content_type:"video",position:m.staff_lessons.length+1}),async fd=>{
      const p=Object.fromEntries(fd),file=fd.get("pdf_file");delete p.pdf_file;p.support_text_html=sanitizeSupportHtml(p.support_text_html||"");p.module_id=mid;p.position=Number(p.position);p.created_by=state.user.id;
      try{
        if(p.content_type==="pdf")p.content_url=await uploadStaffPdfFile(file,sid,mid);
        else if(p.content_type==="text")p.content_url=null;
        else if(!p.content_url){toast("Agregá una URL",true);return false;}
        const {error}=await sb.from("staff_lessons").insert(p);if(error){toast(error.message,true);return false;}
        delete state.staffModules[sid];toast("Contenido agregado");renderShell();
      }catch(err){toast(err.message,true);return false;}
    });
  });
  document.querySelectorAll(".edit-staff-lesson").forEach(b=>b.onclick=async()=>{
    const sid=Number(b.dataset.space),mid=Number(b.dataset.module),mods=await loadStaffModules(sid),m=mods.find(x=>x.id===mid),l=m.staff_lessons.find(x=>String(x.id)===b.dataset.lesson);
    showModal("Editar contenido",lessonForm(l),async fd=>{
      const p=Object.fromEntries(fd),file=fd.get("pdf_file");delete p.pdf_file;p.support_text_html=sanitizeSupportHtml(p.support_text_html||"");p.position=Number(p.position);
      try{
        if(p.content_type==="pdf"){if(file&&file.size)p.content_url=await uploadStaffPdfFile(file,sid,mid);else p.content_url=l.content_type==="pdf"?l.content_url:null;if(!p.content_url){toast("Seleccioná un PDF",true);return false;}}
        else if(p.content_type==="text")p.content_url=null; else if(!p.content_url){toast("Agregá una URL",true);return false;}
        const {error}=await sb.from("staff_lessons").update(p).eq("id",l.id);if(error){toast(error.message,true);return false;}
        delete state.staffModules[sid];toast("Contenido actualizado");renderShell();
      }catch(err){toast(err.message,true);return false;}
    });
  });
  document.querySelectorAll(".delete-staff-lesson").forEach(b=>b.onclick=async()=>{
    if(!isAdmin())return;const sid=Number(b.dataset.space),mid=Number(b.dataset.module),mods=await loadStaffModules(sid),m=mods.find(x=>x.id===mid),l=m.staff_lessons.find(x=>String(x.id)===b.dataset.lesson);
    if(!confirm(`¿Eliminar “${l.title}”?`))return;const {error}=await sb.from("staff_lessons").delete().eq("id",l.id);if(error){toast(error.message,true);return;}delete state.staffModules[sid];toast("Contenido eliminado");renderShell();
  });
  document.querySelectorAll(".view-staff-lesson").forEach(b=>b.onclick=()=>staffLessonViewer(Number(b.dataset.space),Number(b.dataset.module),Number(b.dataset.lesson)));
}

/* ==========================================================
   V9 · PROGRESO + ARCHIVO + CUESTIONARIOS
   ========================================================== */

state.allCourses = [];
state.archivedCourses = [];
state.lessonProgress = new Set();
state.quizAttempts = new Map();
state.courseUnits = {};
state.quizId = null;
state.quizCache = {};

function progressForCourse(courseId){
  const units=state.courseUnits[String(courseId)]||{lessons:[],quizzes:[]};
  const total=units.lessons.length+units.quizzes.length;
  const doneLessons=units.lessons.filter(id=>state.lessonProgress.has(Number(id))).length;
  const doneQuizzes=units.quizzes.filter(id=>state.quizAttempts.has(Number(id))).length;
  const done=doneLessons+doneQuizzes;
  return {total,done,pct:total?Math.round(done/total*100):0};
}

async function loadCoursesV9(){
  const {data,error}=await sb.from("courses")
    .select("id,name,code,description,teacher_name,color,is_active,created_at,cover_image_url,archived_at")
    .eq("is_active",true)
    .order("created_at",{ascending:true});

  if(error){
    console.error(error);
    toast("No se pudieron cargar los cursos. ¿Ejecutaste la migración V9?",true);
    state.courses=[];state.allCourses=[];state.archivedCourses=[];
    return;
  }
  state.allCourses=data||[];
  state.archivedCourses=state.allCourses.filter(c=>!!c.archived_at);
  state.courses=state.allCourses.filter(c=>!c.archived_at);
}

loadCourses = loadCoursesV9;

async function loadLearningState(){
  state.lessonProgress=new Set();
  state.quizAttempts=new Map();
  state.courseUnits={};

  const activeIds=state.courses.map(c=>Number(c.id));
  if(!activeIds.length)return;

  const [{data:structure,error:structureError},{data:progress},{data:attempts}]=await Promise.all([
    sb.from("modules").select("id,course_id,lessons(id),quizzes(id,is_published)").in("course_id",activeIds),
    sb.from("lesson_progress").select("lesson_id").eq("user_id",state.user.id),
    sb.from("quiz_attempts").select("quiz_id,score,total,completed_at").eq("user_id",state.user.id).order("completed_at",{ascending:false})
  ]);

  if(structureError)console.error(structureError);

  (progress||[]).forEach(r=>state.lessonProgress.add(Number(r.lesson_id)));

  (attempts||[]).forEach(a=>{
    const id=Number(a.quiz_id);
    if(!state.quizAttempts.has(id))state.quizAttempts.set(id,{score:Number(a.score),total:Number(a.total),completed_at:a.completed_at});
  });

  (structure||[]).forEach(m=>{
    const key=String(m.course_id);
    state.courseUnits[key]??={lessons:[],quizzes:[]};
    (m.lessons||[]).forEach(l=>state.courseUnits[key].lessons.push(Number(l.id)));
    (m.quizzes||[]).filter(q=>q.is_published!==false).forEach(q=>state.courseUnits[key].quizzes.push(Number(q.id)));
  });
}

loadAuthenticatedUser = async function(user){
  state.user=user;
  const {data:profile,error}=await sb.from("profiles").select("id,full_name,role,avatar_key,created_at").eq("id",user.id).single();
  if(error||!profile){
    app.innerHTML=`<div class="login-panel" style="min-height:100vh"><div class="login-card"><h2>No encontramos tu perfil</h2><p>La cuenta existe, pero no tiene un perfil asociado.</p><button class="primary" id="logoutBroken">Cerrar sesión</button></div></div>`;
    document.getElementById("logoutBroken").onclick=logout;return;
  }
  state.profile=profile;
  await loadCourses();
  await loadLearningState();
  await loadChallengeNotificationState();
  renderShell();
};

loadCourseModules = async function(courseId,force=false){
  if(state.modules[courseId]&&!force)return state.modules[courseId];
  const {data,error}=await sb.from("modules").select(`
    id,course_id,title,description,position,
    lessons(id,module_id,title,description,content_type,content_url,text_content,support_text_html,position,created_by,created_at),
    quizzes(id,module_id,title,description,position,is_published,created_by,created_at)
  `).eq("course_id",courseId).order("position",{ascending:true});
  if(error){console.error(error);toast("No se pudo cargar el contenido",true);return [];}
  (data||[]).forEach(m=>{
    m.lessons=(m.lessons||[]).sort((a,b)=>(a.position||0)-(b.position||0));
    m.quizzes=(m.quizzes||[]).sort((a,b)=>(a.position||0)-(b.position||0));
  });
  state.modules[courseId]=data||[];
  return state.modules[courseId];
};

function progressVisual(courseId,compact=false){
  if(state.profile.role!=="student")return "";
  const p=progressForCourse(courseId);
  if(!p.total)return `<div class="course-progress empty-progress"><span>Sin actividades todavía</span></div>`;
  return `<div class="course-progress ${compact?"compact-progress":""}">
    <div class="course-progress-top"><strong>${p.pct}%</strong><span>${p.done} de ${p.total} completados</span></div>
    <div class="course-progress-track"><i style="width:${p.pct}%"></i></div>
  </div>`;
}

courseCard = function(c){
  const image=courseImage(c);
  const style=image?`background-image:url('${esc(image)}')`:`background:linear-gradient(140deg,${esc(c.color||"#7b0826")},#7650c8)`;
  return `<article class="course-card">
    <div class="course-cover ${image?"has-image":""}" style="${style}">
      <span class="course-code">${esc(c.code||"CURSO")}</span><span class="course-arrow">↗</span>
    </div>
    <div class="course-body">
      <h3>${esc(c.name)}</h3><p>${esc(c.description||"")}</p>
      ${progressVisual(c.id,true)}
      <div class="meta"><span>${esc(c.teacher_name||"Córdoba Casting")}</span></div>
      <div class="course-actions"><button class="primary open-course" data-course="${c.id}">Entrar al curso</button></div>
    </div>
  </article>`;
};

function learningItemHTML(item,index,cid){
  if(item.kind==="lesson"){
    const done=state.lessonProgress.has(Number(item.data.id));
    return `<div class="lesson learning-row ${done?"is-complete":""}">
      <div class="learning-status">${done?"✓":String(index+1).padStart(2,"0")}</div>
      <div><h4>${esc(item.data.title)}</h4><p>${esc(item.data.description||"")}</p></div>
      <div class="learning-actions"><span class="lesson-type">${typeLabel(item.data.content_type)}</span><button class="lesson-view open-lesson" data-course="${cid}" data-lesson="${item.data.id}">Ver →</button></div>
    </div>`;
  }

  const attempt=state.quizAttempts.get(Number(item.data.id));
  return `<div class="lesson learning-row quiz-row ${attempt?"is-complete":""}">
    <div class="learning-status quiz-status">${attempt?"✓":"?"}</div>
    <div><h4>${esc(item.data.title)}</h4><p>${esc(item.data.description||"Cuestionario interactivo")}</p>
      ${attempt?`<div class="quiz-last-score">Último resultado: <strong>${attempt.score}/${attempt.total}</strong></div>`:""}
    </div>
    <div class="learning-actions"><span class="lesson-type quiz-type">Cuestionario</span><button class="lesson-view open-quiz" data-course="${cid}" data-quiz="${item.data.id}">${attempt?"Repetir":"Hacer"} →</button></div>
  </div>`;
}

moduleHTML = function(m,i,cid){
  const mixed=[
    ...(m.lessons||[]).map(x=>({kind:"lesson",position:Number(x.position||0),data:x})),
    ...(m.quizzes||[]).filter(q=>q.is_published!==false).map(x=>({kind:"quiz",position:Number(x.position||0),data:x}))
  ].sort((a,b)=>a.position-b.position || (a.kind==="lesson"?-1:1));

  return `<div class="module">
    <div class="module-head">
      <div class="module-title"><div class="module-number">${i+1}</div><div><strong>${esc(m.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${mixed.length} actividades</div></div></div>
    </div>
    ${mixed.length?mixed.map((item,j)=>learningItemHTML(item,j,cid)).join(""):`<div class="empty compact-empty">Todavía no hay actividades.</div>`}
  </div>`;
};

courseHTML = async function(id){
  const c=state.courses.find(x=>String(x.id)===String(id));
  if(!c)return `<div class="empty">No tenés acceso a este curso.</div>`;
  let inner="";
  if(state.courseTab==="forum"){
    const threads=await loadForum(c.id);
    inner=forumHTML(c,threads);
  }else{
    const mods=await loadCourseModules(c.id);
    inner=`${progressVisual(c.id)}
      <section class="panel">
        <div class="panel-head"><h2>Contenido del curso</h2><span class="tag">${mods.length} módulos</span></div>
        ${mods.length?mods.map((m,i)=>moduleHTML(m,i,c.id)).join(""):`<div class="empty">Todavía no hay módulos publicados.</div>`}
      </section>`;
  }
  return `<div class="breadcrumb"><button class="lesson-view" data-back="courses">Mis cursos</button> / ${esc(c.name)}</div>
    <div class="hero"><div><div class="brand-kicker" style="color:#7b0826">${esc(c.code||"CURSO")}</div><h1>${esc(c.name)}</h1><p>${esc(c.description||"")}</p></div></div>
    <div class="course-tabs"><button class="course-tab ${state.courseTab==="content"?"active":""}" data-course-tab="content">Módulos y contenido</button><button class="course-tab ${state.courseTab==="forum"?"active":""}" data-course-tab="forum">Foro del curso</button></div>${inner}`;
};

lessonHTML = async function(cid,lid){
  const c=state.courses.find(x=>String(x.id)===String(cid));
  const mods=await loadCourseModules(c.id);
  let lesson=null,module=null;
  for(const m of mods){const f=m.lessons.find(l=>String(l.id)===String(lid));if(f){lesson=f;module=m;break;}}
  if(!lesson)return `<div class="empty">Contenido no encontrado.</div>`;

  let body="";
  if(lesson.content_type==="video")body=`<iframe class="video-frame" src="${esc(youtubeEmbed(lesson.content_url||""))}" allowfullscreen></iframe>`;
  else if(lesson.content_type==="pdf"){
    const pdfUrl=await getPdfSignedUrl(lesson.content_url);
    body=pdfUrl?`<div class="pdf-shell"><div class="pdf-toolbar"><strong>${esc(lesson.title)}</strong><a class="secondary mini" href="${esc(pdfUrl)}" target="_blank" rel="noopener">Descargar PDF</a></div><iframe class="pdf-frame" src="${esc(pdfUrl)}#toolbar=1&navpanes=0"></iframe></div>`:`<div class="empty">No se pudo abrir el PDF.</div>`;
  }else if(lesson.content_type==="text")body=`<div class="material-box" style="text-align:left;white-space:pre-wrap">${esc(lesson.text_content||"")}</div>`;
  else body=`<div class="material-box"><h3>${esc(lesson.title)}</h3><p>${esc(lesson.description||"")}</p><a class="primary" style="display:inline-block;text-decoration:none" href="${esc(lesson.content_url||"#")}" target="_blank" rel="noopener">Abrir material ↗</a></div>`;

  const done=state.lessonProgress.has(Number(lesson.id));
  const completion=state.profile.role==="student"?`<div class="completion-card ${done?"done":""}">
    <div><span class="completion-icon">${done?"✓":"○"}</span><div><strong>${done?"Contenido visto":"¿Terminaste este contenido?"}</strong><small>${done?"Podés desmarcarlo si querés volver a tenerlo pendiente.":"Marcá el material como visto para actualizar tu progreso."}</small></div></div>
    <button class="${done?"secondary":"primary"} toggle-seen" data-lesson="${lesson.id}" data-course="${c.id}">${done?"Marcar pendiente":"Marcar como visto"}</button>
  </div>`:"";

  return `<div class="breadcrumb"><button class="lesson-view" data-course-back="${c.id}">${esc(c.name)}</button> / ${esc(module.title)}</div>
    <div class="hero"><div><div class="brand-kicker" style="color:#7b0826">${typeLabel(lesson.content_type)}</div><h1>${esc(lesson.title)}</h1><p>${esc(lesson.description||"")}</p></div></div>
    ${completion}${supportTextBlock(lesson.support_text_html)}<section class="panel">${body}</section>`;
};

/* ---------- Cuestionarios ---------- */

async function loadQuizPublic(quizId,force=false){
  if(state.quizCache[quizId]&&!force)return state.quizCache[quizId];
  const {data,error}=await sb.rpc("get_quiz_for_user",{p_quiz_id:Number(quizId)});
  if(error){console.error(error);throw error;}
  state.quizCache[quizId]=data;
  return data;
}

async function quizHTML(cid,qid){
  try{
    const q=await loadQuizPublic(qid,true);
    if(!q)return `<div class="empty">Cuestionario no disponible.</div>`;
    const attempt=state.quizAttempts.get(Number(qid));
    return `<div class="breadcrumb"><button class="lesson-view" data-course-back="${cid}">Volver al curso</button> / Cuestionario</div>
      <div class="quiz-hero">
        <div class="quiz-hero-icon">?</div>
        <div><div class="brand-kicker" style="color:#7650c8">Tarea interactiva</div><h1>${esc(q.title)}</h1><p>${esc(q.description||"Elegí una opción en cada pregunta.")}</p></div>
        ${attempt?`<div class="quiz-score-pill">Último: ${attempt.score}/${attempt.total}</div>`:""}
      </div>
      <form id="quizForm" data-quiz="${q.id}" data-course="${cid}" class="quiz-form">
        ${(q.questions||[]).map((question,i)=>`<section class="quiz-question-card">
          <div class="quiz-question-number">${i+1}</div>
          <h3>${esc(question.prompt)}</h3>
          <div class="quiz-options">${(question.options||[]).map((o,j)=>`<label class="quiz-option"><input type="radio" name="q_${question.id}" value="${o.id}" required><span class="quiz-option-letter">${String.fromCharCode(65+j)}</span><span>${esc(o.label)}</span></label>`).join("")}</div>
        </section>`).join("")}
        <div class="quiz-submit-bar"><div><strong>${(q.questions||[]).length} preguntas</strong><span>Podés repetir el cuestionario después.</span></div><button class="primary">Entregar cuestionario</button></div>
      </form>`;
  }catch(err){
    return `<div class="empty">No se pudo cargar el cuestionario: ${esc(err.message||"Error")}</div>`;
  }
}

function quizResultModal(result){
  const pct=result.total?Math.round(result.score/result.total*100):0;
  const wrap=document.createElement("div");wrap.className="modal-backdrop";
  wrap.innerHTML=`<div class="modal-card quiz-result-modal">
    <div class="quiz-result-ring" style="--score:${pct}"><div><strong>${pct}%</strong><span>${result.score} de ${result.total}</span></div></div>
    <h2>${pct>=70?"¡Muy bien!":"Cuestionario completado"}</h2>
    <p>${pct>=70?"Buen trabajo. Tu resultado quedó guardado.":"Tu resultado quedó guardado. Podés revisar el material y volver a intentarlo."}</p>
    <button class="primary quiz-result-close">Volver al curso</button>
  </div>`;
  document.body.appendChild(wrap);
  wrap.querySelector(".quiz-result-close").onclick=()=>{wrap.remove();state.view="course";state.courseTab="content";renderShell();};
}

function blankQuizQuestion(){
  return {prompt:"",options:["","","",""],correct_index:0};
}

async function getQuizForEdit(quizId){
  if(!quizId)return null;
  const {data:q,error}=await sb.from("quizzes").select("id,module_id,title,description,position,is_published").eq("id",quizId).single();
  if(error)throw error;
  const {data:questions,error:qe}=await sb.from("quiz_questions").select("id,prompt,position,quiz_options(id,label,is_correct,position)").eq("quiz_id",quizId).order("position");
  if(qe)throw qe;
  return {
    ...q,
    questions:(questions||[]).map(x=>({
      prompt:x.prompt,
      options:(x.quiz_options||[]).sort((a,b)=>a.position-b.position).map(o=>o.label),
      correct_index:Math.max(0,(x.quiz_options||[]).sort((a,b)=>a.position-b.position).findIndex(o=>o.is_correct))
    }))
  };
}

function quizQuestionBuilderHTML(q,index){
  const opts=[...(q.options||[])];while(opts.length<4)opts.push("");
  return `<div class="quiz-builder-question" data-question-index="${index}">
    <div class="quiz-builder-head"><strong>Pregunta ${index+1}</strong><button type="button" class="danger mini remove-quiz-question">Quitar</button></div>
    <div class="field"><label>Pregunta</label><input class="qb-prompt" value="${esc(q.prompt||"")}" required></div>
    <div class="quiz-builder-options">${opts.slice(0,4).map((o,i)=>`<div class="qb-option-row"><label><input type="radio" class="qb-correct" name="correct_${index}" value="${i}" ${Number(q.correct_index)===i?"checked":""}><span>Correcta</span></label><input class="qb-option" value="${esc(o)}" placeholder="Opción ${i+1}" ${i<2?"required":""}></div>`).join("")}</div>
  </div>`;
}

async function openQuizBuilder(courseId,moduleId,quizId=null){
  let quiz=quizId?await getQuizForEdit(quizId):{title:"",description:"",position:1,is_published:true,questions:[blankQuizQuestion()]};
  if(!quiz.questions?.length)quiz.questions=[blankQuizQuestion()];

  const wrap=document.createElement("div");wrap.className="modal-backdrop";
  wrap.innerHTML=`<div class="modal-card quiz-builder-modal">
    <div class="modal-head"><div><h2>${quizId?"Editar":"Nuevo"} cuestionario</h2><p>Multiple choice simple para usar como tarea interactiva.</p></div><button class="modal-close">×</button></div>
    <form id="quizBuilderForm">
      <div class="field"><label>Título</label><input name="title" value="${esc(quiz.title||"")}" required></div>
      <div class="field"><label>Descripción</label><textarea name="description">${esc(quiz.description||"")}</textarea></div>
      <div class="field"><label>Orden dentro del módulo</label><input name="position" type="number" min="1" value="${Number(quiz.position||1)}"></div>
      <label class="quiz-publish-toggle"><input name="is_published" type="checkbox" ${quiz.is_published!==false?"checked":""}><span>Publicado para alumnos</span></label>
      <div class="quiz-builder-title"><strong>Preguntas</strong><button type="button" class="secondary mini" id="addQuizQuestion">+ Agregar pregunta</button></div>
      <div id="quizQuestionsBuilder"></div>
      <div class="modal-actions"><button type="button" class="secondary modal-cancel">Cancelar</button><button class="primary">Guardar cuestionario</button></div>
    </form>
  </div>`;
  document.body.appendChild(wrap);
  const close=()=>wrap.remove();
  wrap.querySelector(".modal-close").onclick=close;wrap.querySelector(".modal-cancel").onclick=close;

  let questions=quiz.questions.map(x=>({...x,options:[...(x.options||[])]}));
  const box=wrap.querySelector("#quizQuestionsBuilder");

  const renderQuestions=()=>{
    box.innerHTML=questions.map((q,i)=>quizQuestionBuilderHTML(q,i)).join("");
    box.querySelectorAll(".remove-quiz-question").forEach((b,i)=>b.onclick=()=>{if(questions.length===1){toast("El cuestionario necesita al menos una pregunta.",true);return;}questions.splice(i,1);renderQuestions();});
  };
  renderQuestions();

  wrap.querySelector("#addQuizQuestion").onclick=()=>{if(questions.length>=20){toast("Máximo 20 preguntas por cuestionario.",true);return;}questions.push(blankQuizQuestion());renderQuestions();};

  wrap.querySelector("#quizBuilderForm").onsubmit=async e=>{
    e.preventDefault();
    const cards=[...box.querySelectorAll(".quiz-builder-question")];
    const payloadQuestions=[];
    for(const card of cards){
      const prompt=card.querySelector(".qb-prompt").value.trim();
      const options=[...card.querySelectorAll(".qb-option")].map(x=>x.value.trim()).filter(Boolean);
      const selected=card.querySelector(".qb-correct:checked");
      const originalIndex=selected?Number(selected.value):0;
      const all=[...card.querySelectorAll(".qb-option")].map(x=>x.value.trim());
      const correctText=all[originalIndex];
      const correctIndex=options.findIndex(x=>x===correctText);
      if(!prompt||options.length<2||correctIndex<0){toast("Cada pregunta necesita texto, al menos dos opciones y una respuesta correcta.",true);return;}
      payloadQuestions.push({prompt,options,correct_index:correctIndex});
    }

    const fd=new FormData(e.target);
    const btn=e.target.querySelector(".primary");btn.disabled=true;btn.textContent="Guardando...";
    const {data,error}=await sb.rpc("save_quiz",{
      p_quiz_id:quizId?Number(quizId):null,
      p_module_id:Number(moduleId),
      p_title:String(fd.get("title")||"").trim(),
      p_description:String(fd.get("description")||"").trim(),
      p_position:Number(fd.get("position")||1),
      p_is_published:fd.get("is_published")==="on",
      p_questions:payloadQuestions
    });
    if(error){console.error(error);toast("No se pudo guardar el cuestionario: "+error.message,true);btn.disabled=false;btn.textContent="Guardar cuestionario";return;}
    delete state.modules[courseId];delete state.quizCache[Number(data)];
    await loadLearningState();
    toast("Cuestionario guardado");
    close();renderShell();
  };
}

/* ---------- Gestión / archivado ---------- */

manageModuleHTML = function(c,m,i){
  return `<div class="module"><div class="module-head"><div class="module-title"><div class="module-number">${i+1}</div><div><strong>${esc(m.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${(m.lessons||[]).length+(m.quizzes||[]).length} actividades</div></div></div>
    <div class="admin-actions"><button class="secondary mini edit-module" data-course="${c.id}" data-module="${m.id}">Editar módulo</button>${isAdmin()?`<button class="danger mini delete-module" data-course="${c.id}" data-module="${m.id}">Eliminar</button>`:""}<button class="gold-button mini add-lesson" data-course="${c.id}" data-module="${m.id}">+ Material</button><button class="secondary mini add-quiz" data-course="${c.id}" data-module="${m.id}">+ Cuestionario</button></div></div>
    ${(m.lessons||[]).map((l,j)=>`<div class="lesson-admin-row"><div class="lesson-index">${String(j+1).padStart(2,"0")}</div><div><strong>${esc(l.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${typeLabel(l.content_type)} · Orden ${l.position}</div></div><div class="admin-actions"><button class="secondary mini edit-lesson" data-course="${c.id}" data-module="${m.id}" data-lesson="${l.id}">Editar</button>${isAdmin()?`<button class="danger mini delete-lesson" data-course="${c.id}" data-module="${m.id}" data-lesson="${l.id}">Eliminar</button>`:""}</div></div>`).join("")}
    ${(m.quizzes||[]).map(q=>`<div class="lesson-admin-row quiz-admin-row"><div class="lesson-index">?</div><div><strong>${esc(q.title)}</strong><div style="font-size:.75rem;color:var(--muted)">Cuestionario · Orden ${q.position} · ${q.is_published===false?"Borrador":"Publicado"}</div></div><div class="admin-actions"><button class="secondary mini edit-quiz" data-course="${c.id}" data-module="${m.id}" data-quiz="${q.id}">Editar</button>${isAdmin()?`<button class="danger mini delete-quiz" data-course="${c.id}" data-quiz="${q.id}">Eliminar</button>`:""}</div></div>`).join("")}
  </div>`;
};

manageHTML = async function(){
  if(!isStaff())return `<div class="empty">Sin permiso.</div>`;
  let active="";
  for(const c of state.courses){
    const mods=await loadCourseModules(c.id);
    active+=`<section class="panel"><div class="panel-head"><div><h2>${esc(c.name)} · ${esc(c.code||"")}</h2><div style="font-size:.8rem;color:var(--muted)">${esc(c.teacher_name||"")}</div></div>
      <div class="admin-actions"><button class="secondary edit-course" data-course="${c.id}">Editar curso</button>${isAdmin()?`<button class="gold-button add-module" data-course="${c.id}">+ Módulo</button><button class="secondary archive-course" data-course="${c.id}">Archivar</button><button class="danger delete-course" data-course="${c.id}">Eliminar</button>`:""}</div></div>
      ${mods.length?mods.map((m,i)=>manageModuleHTML(c,m,i)).join(""):`<div class="empty">Sin módulos.</div>`}</section>`;
  }

  let archived="";
  if(isAdmin()&&state.archivedCourses.length){
    archived=`<section class="archive-section"><div class="archive-heading"><div><div class="brand-kicker" style="color:#7650c8">Historial</div><h2>Cursos archivados</h2><p>Conservan alumnos, módulos, foros, progreso y materiales, pero ya no aparecen como cursos activos.</p></div><span>${state.archivedCourses.length}</span></div>
      <div class="archive-grid">${state.archivedCourses.map(c=>`<article class="archive-card"><div><span class="tag">Archivado</span><h3>${esc(c.name)}</h3><p>${esc(c.code||"")} · ${esc(c.teacher_name||"Córdoba Casting")}</p></div><button class="secondary restore-course" data-course="${c.id}">Restaurar curso</button></article>`).join("")}</div>
    </section>`;
  }

  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">${isAdmin()?"Administración":"Profesor"}</div><h1>Cursos y contenido</h1><p>${isAdmin()?"Organizá cursos, cuestionarios y materiales. Cuando una comisión termina, archivala en vez de eliminarla.":"Podés editar los cursos asignados, sus módulos, materiales y cuestionarios."}</p></div>${isAdmin()?`<button class="primary" id="newCourse">+ Nuevo curso</button>`:""}</div>
    ${active||`<div class="empty">No hay cursos activos.</div>`}${archived}`;
};

/* ---------- Mostrar contraseña ---------- */

function enhancePasswordInputs(root=document){
  root.querySelectorAll('input[type="password"]:not([data-toggle-ready])').forEach(input=>{
    input.dataset.toggleReady="1";
    const label=document.createElement("label");label.className="show-password-toggle";
    label.innerHTML=`<input type="checkbox"><span>Mostrar contraseña</span>`;
    input.insertAdjacentElement("afterend",label);
    label.querySelector("input").onchange=e=>input.type=e.target.checked?"text":"password";
  });
}
const passwordObserver=new MutationObserver(()=>{enhancePasswordInputs(document);bindSupportEditors(document);});
passwordObserver.observe(document.body,{childList:true,subtree:true});
setTimeout(()=>{enhancePasswordInputs(document);bindSupportEditors(document);},100);

/* ---------- Extensión de render / bindings ---------- */

const renderContentV8=renderContent;
renderContent = async function(){
  if(state.view==="quiz"){
    const c=document.getElementById("content");c.innerHTML=`<div class="empty">Cargando cuestionario...</div>`;
    c.innerHTML=await quizHTML(state.courseId,state.quizId);
    bindContent();
    return;
  }
  await renderContentV8();
};

const bindContentV8=bindContent;
bindContent = function(){
  bindContentV8();

  document.querySelectorAll(".toggle-seen").forEach(btn=>btn.onclick=async()=>{
    const lessonId=Number(btn.dataset.lesson),courseId=Number(btn.dataset.course);
    btn.disabled=true;
    let error=null;
    if(state.lessonProgress.has(lessonId)){
      ({error}=await sb.from("lesson_progress").delete().eq("user_id",state.user.id).eq("lesson_id",lessonId));
      if(!error)state.lessonProgress.delete(lessonId);
    }else{
      ({error}=await sb.from("lesson_progress").insert({user_id:state.user.id,lesson_id:lessonId}));
      if(!error)state.lessonProgress.add(lessonId);
    }
    if(error){toast("No se pudo actualizar el progreso: "+error.message,true);btn.disabled=false;return;}
    toast(state.lessonProgress.has(lessonId)?"Marcado como visto":"Marcado como pendiente");
    renderShell();
  });

  document.querySelectorAll(".open-quiz").forEach(btn=>btn.onclick=()=>{
    state.courseId=btn.dataset.course;state.quizId=Number(btn.dataset.quiz);state.view="quiz";renderShell();
  });

  const quizForm=document.getElementById("quizForm");
  if(quizForm)quizForm.onsubmit=async e=>{
    e.preventDefault();
    const q=await loadQuizPublic(Number(e.target.dataset.quiz));
    const answers={};
    for(const question of q.questions||[]){
      const picked=e.target.querySelector(`input[name="q_${question.id}"]:checked`);
      if(!picked){toast("Respondé todas las preguntas.",true);return;}
      answers[String(question.id)]=Number(picked.value);
    }
    const btn=e.target.querySelector(".primary");btn.disabled=true;btn.textContent="Corrigiendo...";
    const {data,error}=await sb.rpc("submit_quiz",{p_quiz_id:Number(e.target.dataset.quiz),p_answers:answers});
    if(error){toast("No se pudo entregar: "+error.message,true);btn.disabled=false;btn.textContent="Entregar cuestionario";return;}
    state.quizAttempts.set(Number(e.target.dataset.quiz),{score:Number(data.score),total:Number(data.total),completed_at:new Date().toISOString()});
    await loadLearningState();
    quizResultModal(data);
  };

  document.querySelectorAll(".add-quiz").forEach(b=>b.onclick=()=>openQuizBuilder(Number(b.dataset.course),Number(b.dataset.module)));
  document.querySelectorAll(".edit-quiz").forEach(b=>b.onclick=()=>openQuizBuilder(Number(b.dataset.course),Number(b.dataset.module),Number(b.dataset.quiz)));
  document.querySelectorAll(".delete-quiz").forEach(b=>b.onclick=async()=>{
    if(!isAdmin())return;
    if(!confirm("¿Eliminar este cuestionario y sus intentos?"))return;
    const {error}=await sb.from("quizzes").delete().eq("id",Number(b.dataset.quiz));
    if(error){toast(error.message,true);return;}
    delete state.modules[Number(b.dataset.course)];
    await loadLearningState();toast("Cuestionario eliminado");renderShell();
  });

  document.querySelectorAll(".archive-course").forEach(b=>b.onclick=async()=>{
    if(!isAdmin())return;
    const course=state.courses.find(c=>String(c.id)===String(b.dataset.course));
    if(!confirm(`¿Archivar “${course?.name||"este curso"}”?\n\nDejará de aparecer a alumnos y profesores, pero conservará todo su contenido e historial.`))return;
    const {error}=await sb.from("courses").update({archived_at:new Date().toISOString()}).eq("id",Number(b.dataset.course));
    if(error){toast(error.message,true);return;}
    delete state.modules[Number(b.dataset.course)];
    await loadCourses();await loadLearningState();toast("Curso archivado");renderShell();
  });

  document.querySelectorAll(".edit-thread").forEach(btn=>btn.onclick=async()=>{if(!isStaff())return;const courseId=Number(btn.dataset.course);const threads=await loadForum(courseId);const item=threads.find(t=>String(t.id)===String(btn.dataset.thread));if(item)openForumEditModal("thread",item,courseId);});
  document.querySelectorAll(".edit-reply").forEach(btn=>btn.onclick=async()=>{if(!isStaff())return;const courseId=Number(btn.dataset.course);const threads=await loadForum(courseId);let item=null;for(const t of threads){item=(t.replies||[]).find(r=>String(r.id)===String(btn.dataset.reply));if(item)break;}if(item)openForumEditModal("reply",item,courseId);});
  document.querySelectorAll(".delete-thread").forEach(btn=>btn.onclick=async()=>{
    if(!isAdmin())return;
    if(!confirm("¿Borrar esta publicación del foro? También se borrarán todas sus respuestas. Esta acción no se puede deshacer."))return;
    const courseId=Number(btn.dataset.course);
    const {error}=await sb.from("forum_threads").delete().eq("id",Number(btn.dataset.thread));
    if(error){toast("No se pudo borrar: "+error.message,true);return;}
    delete state.forum[courseId];toast("Publicación borrada");renderShell();
  });
  document.querySelectorAll(".delete-reply").forEach(btn=>btn.onclick=async()=>{
    if(!isAdmin())return;
    if(!confirm("¿Borrar esta respuesta? Esta acción no se puede deshacer."))return;
    const courseId=Number(btn.dataset.course);
    const {error}=await sb.from("forum_replies").delete().eq("id",Number(btn.dataset.reply));
    if(error){toast("No se pudo borrar: "+error.message,true);return;}
    delete state.forum[courseId];toast("Respuesta borrada");renderShell();
  });

  document.querySelectorAll(".change-user-role").forEach(btn=>btn.onclick=async()=>{if(!isAdmin())return;const targetRole=btn.dataset.newRole,person=btn.dataset.name||"este usuario";const action=targetRole==="teacher"?"convertir en profesor/a":"volver a alumno/a";const extra=targetRole==="teacher"?"\\n\\nComo profesor/a podrá acceder a herramientas docentes y editar los cursos que tenga asignados.":"\\n\\nPerderá las herramientas docentes, pero conservará sus accesos a cursos.";if(!confirm(`¿Querés ${action} a “${person}”?${extra}`))return;btn.disabled=true;const {error}=await sb.rpc("admin_set_user_role",{target_user_id:btn.dataset.user,new_role:targetRole});if(error){toast("No se pudo cambiar el rol: "+error.message,true);btn.disabled=false;return;}toast(targetRole==="teacher"?"Ahora es profesor/a":"Ahora es alumno/a");renderShell();});


  document.getElementById("activeChallengeSelect")?.addEventListener("change",async e=>{
    const {data}=await sb.from("challenge_cards").select("*").eq("id",Number(e.target.value)).single();
    if(data){state.challengeDraw=cardWithoutLine(data);await markChallengeSeen(data.id);renderShell();}
  });
  document.querySelector(".pick-phrase")?.addEventListener("click",()=>openPhrasePicker(state.challengeDraw));
  document.querySelector(".open-challenge-submit")?.addEventListener("click",()=>challengeSubmitModal(state.challengeDraw));

  document.querySelector(".new-challenge")?.addEventListener("click",()=>challengeEditorModal());
  document.querySelector(".edit-challenge-hero")?.addEventListener("click",()=>challengeHeroEditor());
  document.querySelectorAll(".edit-challenge").forEach(b=>b.onclick=async()=>{
    const {data,error}=await sb.from("challenge_cards").select("*").eq("id",Number(b.dataset.id)).single();
    if(error){toast(error.message,true);return;}challengeEditorModal(data);
  });
  document.querySelectorAll(".delete-challenge").forEach(b=>b.onclick=async()=>{
    if(!confirm(`¿Borrar “${b.dataset.title}”? También se borrarán sus entregas asociadas. Esta acción no se puede deshacer.`))return;
    const {error}=await sb.from("challenge_cards").delete().eq("id",Number(b.dataset.id));
    if(error){toast(error.message,true);return;}toast("Desafío borrado");state.challengeDraw=null;renderShell();
  });
  document.querySelectorAll(".toggle-challenge").forEach(b=>b.onclick=async()=>{
    const next=b.dataset.published!=="true";
    const payload=next?{is_published:true,published_at:new Date().toISOString()}:{is_published:false};
    const {error}=await sb.from("challenge_cards").update(payload).eq("id",Number(b.dataset.id));
    if(error){toast(error.message,true);return;}toast(next?"Desafío publicado":"Desafío pausado");state.challengeDraw=null;renderShell();
  });
  document.querySelectorAll(".review-challenge").forEach(b=>b.onclick=()=>{
    showModal("Devolución del desafío",`<div class="field"><label>Devolución para el alumno</label><textarea name="feedback" required>${esc(b.dataset.feedback||"")}</textarea></div>`,async fd=>{
      const feedback=String(fd.get("feedback")||"").trim();if(!feedback)return false;
      const {error}=await sb.from("challenge_attempts").update({feedback,status:"reviewed",reviewed_at:new Date().toISOString(),reviewed_by:state.user.id}).eq("id",Number(b.dataset.id));
      if(error){toast(error.message,true);return false;}toast("Devolución guardada");renderShell();
    });
  });

  document.querySelectorAll(".open-notification-challenge").forEach(b=>b.onclick=async()=>{
    const id=Number(b.dataset.id);
    await markChallengeSeen(id);
    const {data}=await sb.from("challenge_cards").select("*").eq("id",id).single();
    if(data)state.challengeDraw=cardWithoutLine(data);
    state.view="challenges";
    renderShell();
  });

  document.querySelectorAll(".restore-course").forEach(b=>b.onclick=async()=>{
    if(!isAdmin())return;
    const {error}=await sb.from("courses").update({archived_at:null}).eq("id",Number(b.dataset.course));
    if(error){toast(error.message,true);return;}
    await loadCourses();await loadLearningState();toast("Curso restaurado");renderShell();
  });
};

sb.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT"&&state.user){state.user=null;state.profile=null;renderLogin();}});
boot();
