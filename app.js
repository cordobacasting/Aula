
const { url, publishableKey } = window.SUPABASE_CONFIG;
const sb = window.supabase.createClient(url, publishableKey);

const state = {
  user: null, profile: null, courses: [], modules: {},
  view: "dashboard", courseId: null, lessonId: null
};

const app = document.getElementById("app");

function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function initials(name="Usuario"){return name.split(" ").filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase();}
function roleName(role){return role==="admin"?"Administrador":role==="teacher"?"Profesor":"Alumno";}
function toast(msg,error=false){
  const t=document.createElement("div"); t.className="toast"; t.textContent=msg;
  if(error)t.style.background="#8b2e2e"; document.body.appendChild(t); setTimeout(()=>t.remove(),2600);
}
function loadingHTML(msg="Cargando aula..."){
  return `<div style="min-height:100vh;display:grid;place-items:center;padding:30px"><div style="text-align:center">
    <div class="brand-kicker">CÓRDOBA CASTING</div><h2 style="font-family:Manrope;margin:10px 0">${esc(msg)}</h2></div></div>`;
}

async function boot(){
  app.innerHTML=loadingHTML();
  const {data:{session}}=await sb.auth.getSession();
  if(!session){renderLogin();return;}
  await loadAuthenticatedUser(session.user);
}

async function loadAuthenticatedUser(user){
  state.user=user;
  const {data:profile,error}=await sb.from("profiles").select("id,full_name,role,created_at").eq("id",user.id).single();
  if(error||!profile){
    console.error(error);
    app.innerHTML=`<div class="login-panel" style="min-height:100vh"><div class="login-card">
      <h2>No encontramos tu perfil</h2><p>La cuenta existe en Authentication, pero no tiene un perfil asociado.</p>
      <button class="primary" id="logoutBroken">Cerrar sesión</button></div></div>`;
    document.getElementById("logoutBroken").onclick=logout; return;
  }
  state.profile=profile; await loadCourses(); renderShell();
}

async function loadCourses(){
  const {data,error}=await sb.from("courses")
    .select("id,name,code,description,teacher_name,color,is_active,created_at")
    .eq("is_active",true).order("created_at",{ascending:true});
  if(error){console.error(error);toast("No se pudieron cargar los cursos",true);state.courses=[];return;}
  state.courses=data||[];
}

async function loadCourseModules(courseId,force=false){
  if(state.modules[courseId]&&!force)return state.modules[courseId];
  const {data,error}=await sb.from("modules").select(`
    id,course_id,title,description,position,
    lessons(id,module_id,title,description,content_type,content_url,text_content,position,created_by,created_at)
  `).eq("course_id",courseId).order("position",{ascending:true});
  if(error){console.error(error);toast("No se pudo cargar el contenido",true);return [];}
  (data||[]).forEach(m=>m.lessons=(m.lessons||[]).sort((a,b)=>(a.position||0)-(b.position||0)));
  state.modules[courseId]=data||[]; return state.modules[courseId];
}

function renderLogin(){
  app.innerHTML=`<div class="login-page">
    <section class="login-brand"><div><div class="brand-kicker">CÓRDOBA CASTING</div><h1>Aula<br>Virtual</h1>
      <p>Un espacio privado para acceder a cursos, módulos, videos, guiones y materiales de clase.</p></div>
      <div class="brand-kicker">FORMACIÓN AUDIOVISUAL · CÓRDOBA</div></section>
    <section class="login-panel"><form class="login-card" id="loginForm">
      <h2>Ingresar</h2><p>Usá el email y la contraseña de tu cuenta habilitada.</p>
      <div class="field"><label>Email</label><input id="email" type="email" autocomplete="email" required></div>
      <div class="field"><label>Contraseña</label><input id="password" type="password" autocomplete="current-password" required></div>
      <button class="primary" id="loginButton" style="width:100%">Entrar al aula</button>
      <div id="loginError" style="margin-top:12px;color:#8b2e2e;font-size:.82rem"></div>
    </form></section></div>`;
  document.getElementById("loginForm").onsubmit=async e=>{
    e.preventDefault(); const btn=document.getElementById("loginButton"), box=document.getElementById("loginError");
    btn.disabled=true;btn.textContent="Ingresando...";box.textContent="";
    const {data,error}=await sb.auth.signInWithPassword({
      email:document.getElementById("email").value.trim(),
      password:document.getElementById("password").value
    });
    if(error){box.textContent="No pudimos iniciar sesión. Revisá email y contraseña.";btn.disabled=false;btn.textContent="Entrar al aula";return;}
    app.innerHTML=loadingHTML("Ingresando..."); await loadAuthenticatedUser(data.user);
  };
}

async function logout(){
  await sb.auth.signOut(); state.user=null;state.profile=null;state.courses=[];state.modules={};
  state.view="dashboard";state.courseId=null;state.lessonId=null;renderLogin();
}

function sidebarHTML(){
  const role=state.profile.role;
  let h=`<div class="nav-section"><div class="nav-title">Aula</div>
    <button class="nav-item ${state.view==="dashboard"?"active":""}" data-view="dashboard"><span>⌂</span><span>Inicio</span></button>
    <button class="nav-item ${["courses","course","lesson"].includes(state.view)?"active":""}" data-view="courses"><span>▦</span><span>Mis cursos</span></button></div>`;
  if(role==="teacher")h+=`<div class="nav-section"><div class="nav-title">Profesor</div>
    <button class="nav-item ${state.view==="upload"?"active":""}" data-view="upload"><span>＋</span><span>Subir contenido</span></button></div>`;
  if(role==="admin")h+=`<div class="nav-section"><div class="nav-title">Administración</div>
    <button class="nav-item ${state.view==="admin"?"active":""}" data-view="admin"><span>⚙</span><span>Panel general</span></button>
    <button class="nav-item ${state.view==="users"?"active":""}" data-view="users"><span>◎</span><span>Usuarios</span></button>
    <button class="nav-item ${state.view==="manage"?"active":""}" data-view="manage"><span>✎</span><span>Cursos y módulos</span></button></div>`;
  h+=`<div class="nav-section"><div class="nav-title">Cuenta</div>
    <button class="nav-item" id="logout"><span>↪</span><span>Cerrar sesión</span></button></div>`; return h;
}

function renderShell(){
  const p=state.profile;
  app.innerHTML=`<div class="shell"><header class="topbar">
    <div class="topbar-left"><div class="logo">CÓRDOBA CASTING</div><div class="role-badge">${roleName(p.role)}</div></div>
    <div class="userbox"><div><strong>${esc(p.full_name)}</strong><div style="font-size:.72rem;color:var(--muted)">${esc(state.user.email||"")}</div></div>
    <div class="avatar">${initials(p.full_name)}</div></div></header>
    <div class="layout"><aside class="sidebar">${sidebarHTML()}</aside><main class="content" id="content"></main></div></div>`;
  document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{state.view=b.dataset.view;state.courseId=null;state.lessonId=null;renderShell();});
  document.getElementById("logout").onclick=logout; renderContent();
}

function courseCard(c){
  return `<article class="course-card"><div class="course-cover" style="background:${esc(c.color||"#171717")}">
    <span class="course-code">${esc(c.code||"CURSO")}</span><span>↗</span></div>
    <div class="course-body"><h3>${esc(c.name)}</h3><p>${esc(c.description||"")}</p>
    <div class="meta"><span>${esc(c.teacher_name||"Córdoba Casting")}</span></div>
    <div class="course-actions"><button class="primary open-course" data-course="${c.id}">Entrar al curso</button></div></div></article>`;
}
function dashboardHTML(){
  const r=state.profile.role;
  const title=r==="student"?"Mis cursos":r==="teacher"?"Cursos asignados":"Panel del aula";
  const sub=r==="student"?"Accedé al material disponible para tus clases.":r==="teacher"?"Consultá tus cursos y publicá nuevo contenido.":"Administrá la estructura del aula virtual.";
  return `<div class="hero"><div><div class="brand-kicker">AULA VIRTUAL</div><h1>${title}</h1><p>${sub}</p></div></div>
  <div class="grid">${state.courses.length?state.courses.map(courseCard).join(""):`<div class="empty">Todavía no hay cursos disponibles para esta cuenta.</div>`}</div>`;
}
function coursesHTML(){
  return `<div class="hero"><div><div class="brand-kicker">FORMACIÓN</div><h1>Mis cursos</h1><p>El acceso se determina automáticamente según tu cuenta.</p></div></div>
  <div class="grid">${state.courses.length?state.courses.map(courseCard).join(""):`<div class="empty">No tenés cursos asignados.</div>`}</div>`;
}
function typeLabel(t){return t==="video"?"Video":t==="drive"?"Drive":t==="text"?"Texto":"Enlace";}
function moduleHTML(m,i,cid){
  return `<div class="module"><div class="module-head"><div class="module-title"><div class="module-number">${i+1}</div>
    <div><strong>${esc(m.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${m.lessons.length} contenidos</div></div></div></div>
    ${m.lessons.map((l,j)=>`<div class="lesson"><div class="lesson-index">${String(j+1).padStart(2,"0")}</div>
      <div><h4>${esc(l.title)}</h4><p>${esc(l.description||"")}</p></div><div style="display:flex;gap:8px;align-items:center">
      <span class="lesson-type">${esc(typeLabel(l.content_type))}</span><button class="lesson-view open-lesson" data-course="${cid}" data-lesson="${l.id}">Ver →</button></div></div>`).join("")}
  </div>`;
}
async function courseHTML(id){
  const c=state.courses.find(x=>String(x.id)===String(id)); if(!c)return `<div class="empty">No tenés acceso a este curso.</div>`;
  const mods=await loadCourseModules(c.id);
  return `<div class="breadcrumb"><button class="lesson-view" data-back="courses">Mis cursos</button> / ${esc(c.name)}</div>
  <div class="hero"><div><div class="brand-kicker">${esc(c.code||"CURSO")}</div><h1>${esc(c.name)}</h1><p>${esc(c.description||"")}</p></div></div>
  <section class="panel"><div class="panel-head"><h2>Contenido del curso</h2><span class="tag">${mods.length} módulos</span></div>
  ${mods.length?mods.map((m,i)=>moduleHTML(m,i,c.id)).join(""):`<div class="empty">Todavía no hay módulos publicados.</div>`}</section>`;
}
function youtubeEmbed(url=""){
  if(url.includes("youtube.com/embed/"))return url;
  let m=url.match(/[?&]v=([^&#]+)/); if(m)return `https://www.youtube.com/embed/${m[1]}`;
  m=url.match(/youtu\.be\/([^?&#]+)/); if(m)return `https://www.youtube.com/embed/${m[1]}`; return url;
}
async function lessonHTML(cid,lid){
  const c=state.courses.find(x=>String(x.id)===String(cid)); const mods=await loadCourseModules(c.id);
  let lesson=null,module=null; for(const m of mods){const f=m.lessons.find(l=>String(l.id)===String(lid));if(f){lesson=f;module=m;break;}}
  if(!lesson)return `<div class="empty">Contenido no encontrado o sin permiso de acceso.</div>`;
  let body="";
  if(lesson.content_type==="video")body=`<iframe class="video-frame" src="${esc(youtubeEmbed(lesson.content_url||""))}" title="${esc(lesson.title)}" allowfullscreen></iframe>`;
  else if(lesson.content_type==="text")body=`<div class="material-box" style="text-align:left;white-space:pre-wrap">${esc(lesson.text_content||"")}</div>`;
  else body=`<div class="material-box"><h3>${esc(lesson.title)}</h3><p>${esc(lesson.description||"")}</p>
    <a class="primary" style="display:inline-block;text-decoration:none" href="${esc(lesson.content_url||"#")}" target="_blank" rel="noopener">Abrir material ↗</a></div>`;
  return `<div class="breadcrumb"><button class="lesson-view" data-course-back="${c.id}">${esc(c.name)}</button> / ${esc(module.title)}</div>
    <div class="hero"><div><div class="brand-kicker">${esc(typeLabel(lesson.content_type))}</div><h1>${esc(lesson.title)}</h1><p>${esc(lesson.description||"")}</p></div></div>
    <section class="panel">${body}</section>`;
}
async function uploadHTML(){
  let opts=""; for(const c of state.courses){const mods=await loadCourseModules(c.id);for(const m of mods)opts+=`<option value="${c.id}|${m.id}">${esc(c.name)} — ${esc(m.title)}</option>`;}
  return `<div class="hero"><div><div class="brand-kicker">PROFESOR</div><h1>Subir contenido</h1><p>Podés agregar contenido a módulos existentes de tus cursos.</p></div></div>
  <div class="panel teacher-note notice">No podés crear, editar ni borrar cursos, módulos, usuarios o permisos.</div>
  <section class="panel"><form id="uploadForm">
    <div class="field"><label>Curso y módulo</label><select id="upTarget" required>${opts}</select></div>
    <div class="field"><label>Título</label><input id="upTitle" required></div>
    <div class="field"><label>Descripción</label><textarea id="upDesc"></textarea></div>
    <div class="field"><label>Tipo</label><select id="upType"><option value="video">Video de YouTube</option><option value="drive">Material de Drive</option><option value="link">Otro enlace</option></select></div>
    <div class="field"><label>Enlace</label><input id="upUrl" type="url" required></div><button class="primary">Publicar contenido</button>
  </form></section>`;
}
async function adminHTML(){
  const {count:pc}=await sb.from("profiles").select("*",{count:"exact",head:true});
  const {count:mc}=await sb.from("modules").select("*",{count:"exact",head:true});
  const {count:lc}=await sb.from("lessons").select("*",{count:"exact",head:true});
  return `<div class="hero"><div><div class="brand-kicker">ADMINISTRACIÓN</div><h1>Panel general</h1><p>Control de la estructura del aula.</p></div></div>
    <section class="stats"><div class="stat"><strong>${pc??"—"}</strong><span>usuarios</span></div>
    <div class="stat"><strong>${state.courses.length}</strong><span>cursos activos</span></div><div class="stat"><strong>${mc??"—"}</strong><span>módulos</span></div>
    <div class="stat"><strong>${lc??"—"}</strong><span>contenidos</span></div></section>
    <div class="admin-grid"><section class="panel"><div class="panel-head"><h2>Gestión</h2></div><div class="login-actions">
    <button class="secondary" data-viewjump="users">Usuarios y accesos</button><button class="secondary" data-viewjump="manage">Cursos y módulos</button></div></section>
    <section class="panel"><div class="panel-head"><h2>Seguridad</h2></div><p style="color:var(--muted);font-size:.87rem">Los permisos se validan con RLS en Supabase.</p></section></div>`;
}
async function usersHTML(){
  const {data:profiles,error}=await sb.from("profiles").select("id,full_name,role,created_at").order("created_at");
  if(error)return `<div class="empty">No se pudieron cargar usuarios.</div>`;
  const {data:rows}=await sb.from("course_members").select("user_id,course_id"); const memberships={};
  (rows||[]).forEach(r=>{memberships[r.user_id]??=[];memberships[r.user_id].push(r.course_id);});
  return `<div class="hero"><div><div class="brand-kicker">ADMINISTRACIÓN</div><h1>Usuarios y accesos</h1><p>Asigná cursos a usuarios existentes.</p></div></div>
  <div class="notice" style="margin-bottom:18px">La creación de cuentas se hará mediante una función segura. Por ahora podés crearlas en Authentication → Users y administrar acá sus accesos.</div>
  <section class="panel">${profiles.map(p=>`<div class="module"><div class="module-head"><div><strong>${esc(p.full_name)}</strong>
    <div style="font-size:.75rem;color:var(--muted)">${esc(roleName(p.role))}</div></div></div><div style="padding:14px 16px">
    ${state.courses.map(c=>`<label style="display:flex;gap:8px;align-items:center;margin:8px 0;font-size:.85rem">
      <input class="membership-check" type="checkbox" data-user="${p.id}" data-course="${c.id}" ${(memberships[p.id]||[]).includes(c.id)?"checked":""}>
      ${esc(c.name)} · ${esc(c.code||"")}</label>`).join("")}</div></div>`).join("")}</section>`;
}
async function manageHTML(){
  let h=""; for(const c of state.courses){const mods=await loadCourseModules(c.id);h+=`<section class="panel"><div class="panel-head">
    <div><h2>${esc(c.name)} · ${esc(c.code||"")}</h2><div style="font-size:.8rem;color:var(--muted)">${esc(c.teacher_name||"")}</div></div>
    <button class="secondary add-module" data-course="${c.id}">+ Módulo</button></div>
    ${mods.length?mods.map((m,i)=>`<div class="module"><div class="module-head"><div class="module-title"><div class="module-number">${i+1}</div>
    <div><strong>${esc(m.title)}</strong><div style="font-size:.75rem;color:var(--muted)">${m.lessons.length} contenidos</div></div></div></div></div>`).join(""):`<div class="empty">Sin módulos.</div>`}</section>`;}
  return `<div class="hero"><div><div class="brand-kicker">ADMINISTRACIÓN</div><h1>Cursos y módulos</h1><p>Creá la estructura académica del aula.</p></div>
    <button class="primary" id="newCourse">+ Nuevo curso</button></div>${h}`;
}
async function renderContent(){
  const c=document.getElementById("content"); c.innerHTML=`<div class="empty">Cargando...</div>`;
  if(state.view==="dashboard")c.innerHTML=dashboardHTML();
  else if(state.view==="courses")c.innerHTML=coursesHTML();
  else if(state.view==="course")c.innerHTML=await courseHTML(state.courseId);
  else if(state.view==="lesson")c.innerHTML=await lessonHTML(state.courseId,state.lessonId);
  else if(state.view==="upload")c.innerHTML=await uploadHTML();
  else if(state.view==="admin")c.innerHTML=await adminHTML();
  else if(state.view==="users")c.innerHTML=await usersHTML();
  else if(state.view==="manage")c.innerHTML=await manageHTML();
  bindContent();
}
function bindContent(){
  document.querySelectorAll(".open-course").forEach(b=>b.onclick=()=>{state.courseId=b.dataset.course;state.view="course";renderShell();});
  document.querySelectorAll(".open-lesson").forEach(b=>b.onclick=()=>{state.courseId=b.dataset.course;state.lessonId=b.dataset.lesson;state.view="lesson";renderShell();});
  document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>{state.view=b.dataset.back;renderShell();});
  document.querySelectorAll("[data-course-back]").forEach(b=>b.onclick=()=>{state.courseId=b.dataset.courseBack;state.view="course";renderShell();});
  document.querySelectorAll("[data-viewjump]").forEach(b=>b.onclick=()=>{state.view=b.dataset.viewjump;renderShell();});
  const f=document.getElementById("uploadForm");
  if(f)f.onsubmit=async e=>{
    e.preventDefault();const [cid,mid]=document.getElementById("upTarget").value.split("|");const mods=await loadCourseModules(cid);
    const m=mods.find(x=>String(x.id)===String(mid)); const payload={module_id:Number(mid),title:document.getElementById("upTitle").value.trim(),
    description:document.getElementById("upDesc").value.trim(),content_type:document.getElementById("upType").value,
    content_url:document.getElementById("upUrl").value.trim(),position:(m?.lessons?.length||0)+1,created_by:state.user.id};
    const {error}=await sb.from("lessons").insert(payload);if(error){toast("No se pudo publicar: "+error.message,true);return;}
    delete state.modules[cid];toast("Contenido publicado");f.reset();
  };
  document.querySelectorAll(".membership-check").forEach(ch=>ch.onchange=async()=>{
    const user_id=ch.dataset.user,course_id=Number(ch.dataset.course);ch.disabled=true;let error;
    if(ch.checked)({error}=await sb.from("course_members").insert({user_id,course_id}));
    else({error}=await sb.from("course_members").delete().eq("user_id",user_id).eq("course_id",course_id));
    ch.disabled=false;if(error){ch.checked=!ch.checked;toast("No se pudo cambiar el acceso: "+error.message,true);}else toast("Acceso actualizado");
  });
  const nc=document.getElementById("newCourse");if(nc)nc.onclick=async()=>{
    const name=prompt("Nombre del curso:");if(!name)return;const code=prompt("Código o nivel:")||"CURSO";
    const {error}=await sb.from("courses").insert({name,code,description:"",teacher_name:"Córdoba Casting",color:"#171717",is_active:true});
    if(error){toast("No se pudo crear: "+error.message,true);return;}await loadCourses();toast("Curso creado");renderShell();
  };
  document.querySelectorAll(".add-module").forEach(b=>b.onclick=async()=>{
    const title=prompt("Nombre del módulo:");if(!title)return;const cid=Number(b.dataset.course);const mods=await loadCourseModules(cid);
    const {error}=await sb.from("modules").insert({course_id:cid,title,description:"",position:mods.length+1});
    if(error){toast("No se pudo crear: "+error.message,true);return;}delete state.modules[cid];toast("Módulo creado");renderShell();
  });
}
sb.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"&&state.user){state.user=null;state.profile=null;renderLogin();}});
boot();
