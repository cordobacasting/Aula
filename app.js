
const { url, publishableKey } = window.SUPABASE_CONFIG;
const sb = window.supabase.createClient(url, publishableKey);

const state = {
  user:null, profile:null, courses:[], modules:{}, forum:{},
  view:"dashboard", courseId:null, lessonId:null, courseTab:"content"
};

const app=document.getElementById("app");

function esc(v=""){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function initials(name="Usuario"){return name.split(" ").filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase();}
function roleName(role){return role==="admin"?"Administrador":role==="teacher"?"Profesor":"Alumno";}
function isStaff(){return ["admin","teacher"].includes(state.profile?.role);}
function isAdmin(){return state.profile?.role==="admin";}
function toast(msg,error=false){const t=document.createElement("div");t.className="toast";t.textContent=msg;if(error)t.style.background="#8b1635";document.body.appendChild(t);setTimeout(()=>t.remove(),2800);}
function loadingHTML(msg="Cargando aula..."){return `<div style="min-height:100vh;display:grid;place-items:center"><div style="text-align:center"><img src="assets/logo.png" style="width:84px;height:90px;object-fit:contain;background:#111;border-radius:18px;padding:8px"><h2 style="font-family:Manrope;color:#4d0015">${esc(msg)}</h2></div></div>`;}

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
}
async function loadAuthenticatedUser(user){
  state.user=user;
  const {data:profile,error}=await sb.from("profiles").select("id,full_name,role,created_at").eq("id",user.id).single();
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
  const {data,error}=await sb.from("modules").select(`id,course_id,title,description,position,lessons(id,module_id,title,description,content_type,content_url,text_content,position,created_by,created_at)`).eq("course_id",courseId).order("position",{ascending:true});
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
      <button class="primary" id="loginButton" style="width:100%">Entrar al aula</button><div id="loginError" style="margin-top:12px;color:#8b1635;font-size:.82rem"></div></form></section></div>`;
  document.getElementById("loginForm").onsubmit=async e=>{
    e.preventDefault();const btn=document.getElementById("loginButton"),box=document.getElementById("loginError");btn.disabled=true;btn.textContent="Ingresando...";box.textContent="";
    const {data,error}=await sb.auth.signInWithPassword({email:document.getElementById("email").value.trim(),password:document.getElementById("password").value});
    if(error){box.textContent="No pudimos iniciar sesión. Revisá email y contraseña.";btn.disabled=false;btn.textContent="Entrar al aula";return;}
    app.innerHTML=loadingHTML("Ingresando...");await loadAuthenticatedUser(data.user);
  };
}
async function logout(){await sb.auth.signOut();state.user=null;state.profile=null;state.courses=[];state.modules={};state.forum={};state.view="dashboard";renderLogin();}

function sidebarHTML(){
  const role=state.profile.role;
  let h=`<div class="sidebar-logo"><img src="assets/logo.png"><strong>Córdoba Casting</strong></div>
  <div class="nav-section"><div class="nav-title">Aula</div>
    <button class="nav-item ${state.view==="dashboard"?"active":""}" data-view="dashboard"><span>⌂</span><span>Inicio</span></button>
    <button class="nav-item ${["courses","course","lesson"].includes(state.view)?"active":""}" data-view="courses"><span>▦</span><span>Mis cursos</span></button></div>`;
  if(role==="teacher") h+=`<div class="nav-section"><div class="nav-title">Profesor</div>
    <button class="nav-item ${state.view==="manage"?"active":""}" data-view="manage"><span>✎</span><span>Gestionar cursos</span></button>
    <button class="nav-item ${state.view==="upload"?"active":""}" data-view="upload"><span>＋</span><span>Subir contenido</span></button></div>`;
  if(role==="admin") h+=`<div class="nav-section"><div class="nav-title">Administración</div>
    <button class="nav-item ${state.view==="admin"?"active":""}" data-view="admin"><span>⚙</span><span>Panel general</span></button>
    <button class="nav-item ${state.view==="users"?"active":""}" data-view="users"><span>◎</span><span>Usuarios</span></button>
    <button class="nav-item ${state.view==="manage"?"active":""}" data-view="manage"><span>✎</span><span>Cursos y contenido</span></button></div>`;
  h+=`<div class="nav-section"><div class="nav-title">Cuenta</div><button class="nav-item" id="logout"><span>↪</span><span>Cerrar sesión</span></button></div>`;
  return h;
}
function renderShell(){
  const p=state.profile;
  app.innerHTML=`<div class="shell"><header class="topbar"><div class="topbar-left"><button class="mobile-menu" id="mobileMenu">☰</button><img class="top-logo" src="assets/logo.png"><div class="logo-word">CÓRDOBA CASTING</div><div class="role-badge">${roleName(p.role)}</div></div>
    <div class="userbox"><div><strong>${esc(p.full_name)}</strong><div style="font-size:.72rem;color:var(--muted)">${esc(state.user.email||"")}</div></div><div class="avatar">${initials(p.full_name)}</div></div></header>
    <div class="mobile-drawer-backdrop" id="drawerBackdrop"></div><div class="layout"><aside class="sidebar">${sidebarHTML()}</aside><main class="content" id="content"></main></div></div>`;
  document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{state.view=b.dataset.view;state.courseId=null;state.lessonId=null;state.courseTab="content";document.body.classList.remove("menu-open");renderShell();});
  document.getElementById("logout").onclick=logout;
  document.getElementById("mobileMenu").onclick=()=>document.body.classList.toggle("menu-open");
  document.getElementById("drawerBackdrop").onclick=()=>document.body.classList.remove("menu-open");
  renderContent();
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
  return `<div class="forum-layout"><div>
    ${threads.length?threads.map(t=>`<article class="forum-thread">
      <div class="forum-meta"><strong>${esc(t.author?.full_name||"Alumno")}</strong><span>${new Date(t.created_at).toLocaleString("es-AR",{dateStyle:"medium",timeStyle:"short"})}</span></div>
      <h3>${esc(t.title)}</h3><div class="forum-body">${esc(t.body)}</div>${t.link_url?`<a class="forum-link" href="${esc(t.link_url)}" target="_blank" rel="noopener">Abrir enlace ↗</a>`:""}
      <div class="reply-list">${(t.replies||[]).length?t.replies.map(r=>`<div class="forum-reply"><strong>${esc(r.author?.full_name||"Equipo docente")} · ${esc(roleName(r.author?.role||"teacher"))}</strong><p>${esc(r.body)}</p>${r.link_url?`<a class="forum-link" href="${esc(r.link_url)}" target="_blank" rel="noopener">Abrir enlace ↗</a>`:""}</div>`).join(""):`<div style="font-size:.8rem;color:var(--muted);padding:8px 0">Todavía no hay respuesta.</div>`}</div>
      <form class="reply-form" data-thread="${t.id}" data-course="${course.id}"><textarea name="body" required placeholder="${student?"Dejá tu respuesta o link acá...":"Responder como "+roleName(state.profile.role)+"..."}"></textarea><input name="link_url" type="url" placeholder="Link opcional: https://..." style="flex:1;border:1px solid var(--line);border-radius:10px;padding:9px"><button class="primary mini">Responder</button></form>
    </article>`).join(""):`<div class="empty">Todavía no hay consultas en este curso.</div>`}
  </div><aside class="forum-side"><div class="forum-composer">
    <h3>${student?"Nueva consulta":"Nueva instancia"}</h3><p style="font-size:.8rem;color:var(--muted)">${student?"Abrí una consulta, compartí un trabajo o dejá un enlace.":"Abrí una consigna, tarea, tema de conversación o espacio para recibir trabajos y links de los alumnos."}</p><form id="newThreadForm" data-course="${course.id}">
      <div class="field"><label>Título</label><input name="title" required maxlength="160" placeholder="${student?"Ej: Duda sobre la escena":"Ej: Entrega de monólogo — Clase 4"}"></div>
      <div class="field"><label>${student?"Pregunta / comentario":"Consigna / descripción"}</label><textarea name="body" required></textarea></div>
      <div class="field"><label>Enlace opcional</label><input name="link_url" type="url" placeholder="https://..."></div>
      <button class="primary" style="width:100%">${student?"Publicar":"Abrir instancia"}</button></form>
  </div></aside></div>`;
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
  <section class="panel"><form id="uploadForm"><div class="field"><label>Curso y módulo</label><select id="upTarget" required>${opts}</select></div><div class="field"><label>Título</label><input id="upTitle" required></div><div class="field"><label>Descripción</label><textarea id="upDesc"></textarea></div><div class="field"><label>Tipo</label><select id="upType"><option value="video">Video de YouTube</option><option value="pdf">PDF</option><option value="drive">Material de Drive</option><option value="link">Otro enlace</option></select></div><div class="field" id="upUrlField"><label>Enlace</label><input id="upUrl" type="url"></div><div class="field hidden" id="upPdfField"><label>Archivo PDF</label><input id="upPdf" type="file" accept="application/pdf,.pdf"><div style="font-size:.74rem;color:var(--muted)">El PDF se guardará en el Aula Virtual y podrá leerse dentro del curso.</div></div><button class="primary">Publicar contenido</button></form></section>`;
}
async function adminHTML(){
  const [{count:pc},{count:mc},{count:lc}]=await Promise.all([sb.from("profiles").select("*",{count:"exact",head:true}),sb.from("modules").select("*",{count:"exact",head:true}),sb.from("lessons").select("*",{count:"exact",head:true})]);
  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">Administración</div><h1>Panel general</h1><p>Vista rápida del Aula Virtual de Córdoba Casting.</p></div></div><section class="stats"><div class="stat"><strong>${pc??"—"}</strong><span>usuarios</span></div><div class="stat"><strong>${state.courses.length}</strong><span>cursos activos</span></div><div class="stat"><strong>${mc??"—"}</strong><span>módulos</span></div><div class="stat"><strong>${lc??"—"}</strong><span>contenidos</span></div></section><div class="admin-grid"><section class="panel"><div class="panel-head"><h2>Gestión</h2></div><div class="login-actions"><button class="secondary" data-viewjump="users">Usuarios y accesos</button><button class="secondary" data-viewjump="manage">Cursos y contenido</button></div></section><section class="panel"><div class="panel-head"><h2>Permisos</h2></div><p style="font-size:.86rem;color:var(--muted)">Los profesores pueden editar sus cursos, módulos y contenidos, y subir material. Sólo el administrador puede crear o eliminar cursos.</p></section></div>`;
}
async function usersHTML(){
  if(!isAdmin())return `<div class="empty">Sin permiso.</div>`;
  const {data:profiles,error}=await sb.from("profiles").select("id,full_name,role,created_at").order("created_at");if(error)return `<div class="empty">No se pudieron cargar usuarios.</div>`;
  const {data:rows}=await sb.from("course_members").select("user_id,course_id");const memberships={};(rows||[]).forEach(r=>{memberships[r.user_id]??=[];memberships[r.user_id].push(r.course_id);});
  return `<div class="hero"><div><div class="brand-kicker" style="color:#7b0826">Administración</div><h1>Usuarios y accesos</h1><p>Asigná cursos a usuarios existentes.</p></div></div><div class="notice" style="margin-bottom:18px">Las cuentas nuevas todavía se crean desde Supabase → Authentication → Users. Después podés asignarlas desde acá.</div><section class="panel">${profiles.map(p=>`<div class="module"><div class="module-head"><div><strong>${esc(p.full_name)}</strong><div style="font-size:.75rem;color:var(--muted)">${roleName(p.role)}</div></div></div><div style="padding:14px 16px">${state.courses.map(c=>`<label style="display:flex;gap:8px;align-items:center;margin:8px 0;font-size:.85rem"><input class="membership-check" type="checkbox" data-user="${p.id}" data-course="${c.id}" ${(memberships[p.id]||[]).includes(c.id)?"checked":""}>${esc(c.name)} · ${esc(c.code||"")}</label>`).join("")}</div></div>`).join("")}</section>`;
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

function showModal(title,body,onSubmit){
  const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.innerHTML=`<div class="modal-card"><div class="modal-head"><h2>${esc(title)}</h2><button class="modal-close">×</button></div><form id="modalForm">${body}<div class="modal-actions"><button type="button" class="secondary modal-cancel">Cancelar</button><button class="primary">Guardar</button></div></form></div>`;document.body.appendChild(wrap);
  const close=()=>wrap.remove();wrap.querySelector(".modal-close").onclick=close;wrap.querySelector(".modal-cancel").onclick=close;wrap.onclick=e=>{if(e.target===wrap)close();};
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
function lessonForm(l={}){return `<div class="field"><label>Título</label><input name="title" required value="${esc(l.title||"")}"></div><div class="field"><label>Descripción</label><textarea name="description">${esc(l.description||"")}</textarea></div><div class="field"><label>Tipo</label><select name="content_type" class="lesson-type-select"><option value="video" ${l.content_type==="video"?"selected":""}>Video de YouTube</option><option value="pdf" ${l.content_type==="pdf"?"selected":""}>PDF</option><option value="drive" ${l.content_type==="drive"?"selected":""}>Drive</option><option value="link" ${l.content_type==="link"?"selected":""}>Enlace</option><option value="text" ${l.content_type==="text"?"selected":""}>Texto</option></select></div><div class="field lesson-url-field ${l.content_type==="pdf"||l.content_type==="text"?"hidden":""}"><label>URL</label><input name="content_url" type="url" value="${l.content_type==="pdf"?"":esc(l.content_url||"")}"></div><div class="field lesson-pdf-field ${l.content_type==="pdf"?"":"hidden"}"><label>${l.content_type==="pdf"?"Reemplazar PDF (opcional)":"Archivo PDF"}</label><input name="pdf_file" type="file" accept="application/pdf,.pdf">${l.content_type==="pdf"?`<div style="font-size:.74rem;color:var(--muted)">Si no seleccionás otro archivo, se conserva el PDF actual.</div>`:""}</div><div class="field lesson-text-field ${l.content_type==="text"?"":"hidden"}"><label>Texto</label><textarea name="text_content">${esc(l.text_content||"")}</textarea></div><div class="field"><label>Orden</label><input name="position" type="number" min="1" value="${Number(l.position||1)}"></div>`;}

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
  bindContent();
}
function bindContent(){
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
      const payload={module_id:Number(mid),title:document.getElementById("upTitle").value.trim(),description:document.getElementById("upDesc").value.trim(),content_type:type,content_url,position:(m?.lessons?.length||0)+1,created_by:state.user.id};
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

  const nc=document.getElementById("newCourse");if(nc)nc.onclick=()=>showModal("Nuevo curso",courseForm(),async fd=>{const p=Object.fromEntries(fd);if(!p.cover_image_url)delete p.cover_image_url;const {error}=await sb.from("courses").insert({...p,is_active:true});if(error){toast(error.message,true);return false;}await loadCourses();toast("Curso creado");renderShell();});
  document.querySelectorAll(".edit-course").forEach(b=>b.onclick=()=>{const course=state.courses.find(x=>String(x.id)===b.dataset.course);showModal("Editar curso",courseForm(course),async fd=>{const p=Object.fromEntries(fd);if(!p.cover_image_url)p.cover_image_url=null;const {error}=await sb.from("courses").update(p).eq("id",course.id);if(error){toast(error.message,true);return false;}await loadCourses();toast("Curso actualizado");renderShell();});});
  document.querySelectorAll(".delete-course").forEach(b=>b.onclick=async()=>{if(!isAdmin())return;const c=state.courses.find(x=>String(x.id)===b.dataset.course);if(!confirm(`¿Eliminar el curso “${c.name}”?`))return;const {error}=await sb.from("courses").delete().eq("id",c.id);if(error){toast(error.message,true);return;}delete state.modules[c.id];await loadCourses();toast("Curso eliminado");renderShell();});

  document.querySelectorAll(".add-module").forEach(b=>b.onclick=async()=>{if(!isAdmin())return;const cid=Number(b.dataset.course),mods=await loadCourseModules(cid);showModal("Nuevo módulo",moduleForm({position:mods.length+1}),async fd=>{const p=Object.fromEntries(fd);p.course_id=cid;p.position=Number(p.position);const {error}=await sb.from("modules").insert(p);if(error){toast(error.message,true);return false;}delete state.modules[cid];toast("Módulo creado");renderShell();});});
  document.querySelectorAll(".edit-module").forEach(b=>b.onclick=async()=>{const cid=Number(b.dataset.course),mods=await loadCourseModules(cid),m=mods.find(x=>String(x.id)===b.dataset.module);showModal("Editar módulo",moduleForm(m),async fd=>{const p=Object.fromEntries(fd);p.position=Number(p.position);const {error}=await sb.from("modules").update(p).eq("id",m.id);if(error){toast(error.message,true);return false;}delete state.modules[cid];toast("Módulo actualizado");renderShell();});});
  document.querySelectorAll(".delete-module").forEach(b=>b.onclick=async()=>{if(!isAdmin())return;const cid=Number(b.dataset.course),mods=await loadCourseModules(cid),m=mods.find(x=>String(x.id)===b.dataset.module);if(!confirm(`¿Eliminar el módulo “${m.title}”?`))return;const {error}=await sb.from("modules").delete().eq("id",m.id);if(error){toast(error.message,true);return;}delete state.modules[cid];toast("Módulo eliminado");renderShell();});

  document.querySelectorAll(".add-lesson").forEach(b=>b.onclick=async()=>{
    const cid=Number(b.dataset.course),mid=Number(b.dataset.module),mods=await loadCourseModules(cid),m=mods.find(x=>x.id===mid);
    showModal("Agregar contenido",lessonForm({content_type:"video",position:m.lessons.length+1}),async fd=>{
      const p=Object.fromEntries(fd);const file=fd.get("pdf_file");delete p.pdf_file;
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
      const p=Object.fromEntries(fd);const file=fd.get("pdf_file");delete p.pdf_file;p.position=Number(p.position);
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
}
sb.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT"&&state.user){state.user=null;state.profile=null;renderLogin();}});
boot();
