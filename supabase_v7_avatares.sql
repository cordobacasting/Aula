-- CÓRDOBA CASTING · V7 AVATARES
-- Actualiza únicamente la función que permite que cada usuario elija su propio avatar.
-- No modifica cursos, perfiles ni contenido.

create or replace function public.set_my_avatar(new_avatar_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_avatar_key not in (
    'meryl',
    'susan',
    'stella',
    'stanislavski',
    'viola',
    'tilda',
    'pacino',
    'dicaprio',
    'mcdormand',
    'dafoe'
  ) then
    raise exception 'Avatar no válido';
  end if;

  update public.profiles
  set avatar_key = new_avatar_key
  where id = auth.uid();
end;
$$;

revoke all on function public.set_my_avatar(text) from public;
grant execute on function public.set_my_avatar(text) to authenticated;
