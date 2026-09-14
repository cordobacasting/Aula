-- ============================================================
-- CÓRDOBA CASTING · AULA VIRTUAL · V16
-- Alta de usuarios desde el panel de administración
-- Ejecutar UNA sola vez en Supabase > SQL Editor > New query.
-- Es seguro volver a ejecutarlo.
-- ============================================================

-- Guardamos una copia del email en profiles para poder mostrarlo
-- y buscarlo desde "Usuarios y accesos". La autenticación real
-- sigue estando en auth.users.
alter table public.profiles
  add column if not exists email text;

-- Completa los emails de las cuentas que ya existían antes de V16.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email is distinct from u.email);

-- Índice auxiliar para el panel administrativo.
create index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));
