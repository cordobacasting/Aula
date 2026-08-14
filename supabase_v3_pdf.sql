-- ==========================================================
-- CÓRDOBA CASTING · AULA VIRTUAL · V3 PDF
-- Ejecutar DESPUÉS de la migración base de marca.
-- Incluye también los permisos de foro V2 para que no tengas
-- que ejecutar ese archivo por separado si todavía no lo hiciste.
-- ==========================================================

-- 1) FORO V2: cualquier miembro puede abrir hilos y responder.
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

-- 2) Lessons admite PDF.
alter table public.lessons
drop constraint if exists lessons_content_type_check;

alter table public.lessons
add constraint lessons_content_type_check
check (content_type in ('video','drive','link','text','pdf'));

-- 3) Bucket PRIVADO para PDFs.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'course-pdfs',
  'course-pdfs',
  false,
  52428800,
  array['application/pdf']
)
on conflict (id) do update
set public=false,
    file_size_limit=52428800,
    allowed_mime_types=array['application/pdf'];

-- La ruta de cada archivo comienza por el ID del curso:
-- course_id/module_id/timestamp-archivo.pdf

-- 4) Lectura: admin o miembro del curso.
drop policy if exists "Course members can read course pdfs" on storage.objects;
create policy "Course members can read course pdfs"
on storage.objects
for select
to authenticated
using (
  bucket_id='course-pdfs'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.course_members cm
      where cm.user_id=auth.uid()
        and (storage.foldername(name))[1] = cm.course_id::text
    )
  )
);

-- 5) Subida: admin o profesor asignado al curso.
drop policy if exists "Staff can upload course pdfs" on storage.objects;
create policy "Staff can upload course pdfs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id='course-pdfs'
  and (
    public.is_admin()
    or (
      public.current_user_role()='teacher'
      and exists (
        select 1
        from public.course_members cm
        where cm.user_id=auth.uid()
          and (storage.foldername(name))[1] = cm.course_id::text
      )
    )
  )
);

-- 6) Admin puede eliminar PDFs desde Storage si más adelante
-- agregamos limpieza automática desde la interfaz.
drop policy if exists "Admin can delete course pdfs" on storage.objects;
create policy "Admin can delete course pdfs"
on storage.objects
for delete
to authenticated
using (
  bucket_id='course-pdfs'
  and public.is_admin()
);
