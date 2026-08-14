-- CÓRDOBA CASTING · AJUSTE DE FORO V2
-- Permite:
-- • Alumno, profesor y admin: abrir instancias/hilos.
-- • Alumno, profesor y admin: responder dentro de cursos a los que tienen acceso.
-- • Esto habilita tareas creadas por docentes para recibir links/videos de alumnos.

drop policy if exists "Students can create forum threads" on public.forum_threads;
drop policy if exists "Course members can create forum threads" on public.forum_threads;

create policy "Course members can create forum threads"
on public.forum_threads
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    public.is_admin()
    or public.user_belongs_to_course(course_id)
  )
);

drop policy if exists "Staff can reply to forum threads" on public.forum_replies;
drop policy if exists "Course members can reply to forum threads" on public.forum_replies;

create policy "Course members can reply to forum threads"
on public.forum_replies
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1
      from public.forum_threads t
      where t.id = forum_replies.thread_id
        and public.user_belongs_to_course(t.course_id)
    )
  )
);
