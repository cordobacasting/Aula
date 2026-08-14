# Aula Virtual Córdoba Casting — Supabase

Esta versión ya está conectada a tu proyecto real de Supabase.

## Para probar
No abras el HTML con doble clic. Servilo con un servidor local o publicalo.

En esta carpeta:
python -m http.server 8000

Luego abrí:
http://localhost:8000

Entrá con el usuario administrador real que creaste en Supabase.

## Ya funciona
- login real;
- lectura del rol desde profiles;
- cursos según RLS;
- módulos y lessons;
- profesor puede insertar lessons en sus cursos;
- administrador puede crear cursos/módulos;
- administrador puede asignar cursos a usuarios existentes;
- YouTube embebido y enlaces externos/Drive.

## Alta de usuarios
Por ahora crealos en Supabase → Authentication → Users → Add user.
El trigger crea su profile. Después cambiá role a teacher si corresponde y asignale cursos desde el aula.

Para que el administrador pueda invitar usuarios desde la propia web necesitaremos una Edge Function segura. No pongas una Secret Key/service_role dentro del frontend.

## Configuración
`supabase-config.js` contiene únicamente la URL del proyecto y la Publishable Key, ambas destinadas al cliente web cuando RLS está correctamente configurado.
