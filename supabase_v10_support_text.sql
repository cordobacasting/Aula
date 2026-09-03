-- CÓRDOBA CASTING · V10 · TEXTO DE APOYO
alter table public.lessons
add column if not exists support_text_html text;

alter table public.staff_lessons
add column if not exists support_text_html text;
