# Aula Virtual Córdoba Casting · V16

Versión estática para GitHub Pages + Supabase.

## V16
El administrador puede crear usuarios directamente desde **Usuarios y accesos** con nombre, email, rol, contraseña y cursos. La contraseña asignada no expira automáticamente.

La creación real de cuentas se realiza con la Edge Function `admin-create-user`, evitando exponer credenciales administrativas en el frontend.

Instalación: ver `LEEME_V16.txt`.
