create or replace function public.set_my_display_name(new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare clean_name text;
begin
  clean_name := trim(new_name);
  if clean_name is null or char_length(clean_name) < 2 then
    raise exception 'El nombre debe tener al menos 2 caracteres';
  end if;
  if char_length(clean_name) > 80 then
    raise exception 'El nombre es demasiado largo';
  end if;
  update public.profiles set full_name=clean_name where id=auth.uid();
end;
$$;

revoke all on function public.set_my_display_name(text) from public;
grant execute on function public.set_my_display_name(text) to authenticated;
