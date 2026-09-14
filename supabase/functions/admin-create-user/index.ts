import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ ok: false, error: "Falta configuración interna de Supabase." }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return json({ ok: false, error: "Sesión no válida." }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ ok: false, error: "Sesión vencida o inválida." }, 401);

  const { data: requester, error: requesterError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();
  if (requesterError || requester?.role !== "admin") {
    return json({ ok: false, error: "Sólo un administrador puede crear usuarios." }, 403);
  }

  let payload: any;
  try { payload = await req.json(); }
  catch { return json({ ok: false, error: "Datos inválidos." }, 400); }

  const fullName = String(payload?.full_name || "").trim();
  const email = String(payload?.email || "").trim().toLowerCase();
  const password = String(payload?.password || "");
  const role = String(payload?.role || "student");
  const courseIds = Array.isArray(payload?.course_ids)
    ? [...new Set(payload.course_ids.map((x: unknown) => Number(x)).filter((x: number) => Number.isInteger(x) && x > 0))]
    : [];

  if (!fullName) return json({ ok: false, error: "Ingresá el nombre y apellido." }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ ok: false, error: "Ingresá un email válido." }, 400);
  if (password.length < 6) return json({ ok: false, error: "La clave debe tener al menos 6 caracteres." }, 400);
  if (!["student", "teacher"].includes(role)) return json({ ok: false, error: "El tipo de usuario no es válido." }, 400);

  if (courseIds.length) {
    const { data: validCourses, error: courseError } = await adminClient
      .from("courses")
      .select("id")
      .in("id", courseIds);
    if (courseError) return json({ ok: false, error: "No se pudieron validar los cursos." }, 500);
    const validIds = new Set((validCourses || []).map((c: any) => Number(c.id)));
    if (courseIds.some((id: number) => !validIds.has(id))) {
      return json({ ok: false, error: "Uno de los cursos seleccionados ya no existe." }, 400);
    }
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (createError || !created.user) {
    const msg = createError?.message || "No se pudo crear el usuario.";
    const friendly = /already|registered|exists/i.test(msg)
      ? "Ya existe una cuenta con ese email."
      : msg;
    return json({ ok: false, error: friendly }, 400);
  }

  const userId = created.user.id;
  try {
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      email,
      role,
    }, { onConflict: "id" });
    if (profileError) throw profileError;

    if (courseIds.length) {
      const memberships = courseIds.map((courseId: number) => ({ user_id: userId, course_id: courseId }));
      const { error: memberError } = await adminClient.from("course_members").upsert(memberships, {
        onConflict: "user_id,course_id",
      });
      if (memberError) throw memberError;
    }
  } catch (err) {
    await adminClient.auth.admin.deleteUser(userId);
    const message = err instanceof Error ? err.message : "No se pudo completar la creación del usuario.";
    return json({ ok: false, error: message }, 500);
  }

  return json({ ok: true, user_id: userId, email, full_name: fullName, role, course_ids: courseIds });
});
