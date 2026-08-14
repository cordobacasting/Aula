# Aula Virtual Córdoba Casting · V3 con PDF

Esta versión contiene TODO lo de la versión anterior más:

- Login con fondo degradado, sin fotografía promocional.
- Foro bidireccional:
  - alumnos, profesores y admin pueden abrir instancias;
  - todos los miembros del curso pueden responder;
  - sirve para preguntas, consignas y entregas mediante links.
- PDF como contenido nativo:
  - admin/profesor selecciona un PDF desde su computadora;
  - se sube a Supabase Storage;
  - el alumno lo lee dentro de la página;
  - tiene botón para descargarlo;
  - el bucket es privado y requiere acceso al curso.

## IMPORTANTE: orden de actualización

Si YA ejecutaste `supabase_migracion.sql` de la versión de marca:
1. Abrí Supabase → SQL Editor → New query.
2. Pegá y ejecutá SOLO `supabase_v3_pdf.sql`.
   - Este archivo YA incluye el ajuste del foro V2.
   - No necesitás ejecutar `supabase_foro_v2.sql`.

Si todavía NO ejecutaste nunca `supabase_migracion.sql`:
1. Ejecutá `supabase_migracion.sql`.
2. Después ejecutá `supabase_v3_pdf.sql`.

Cuando ambos correspondan y den Success:
3. Reemplazá en GitHub los archivos por los de esta V3.
4. Esperá el deployment de Pages.
5. Hacé Ctrl + Shift + R.

## PDF

El bucket se llama `course-pdfs`, es privado y acepta solamente `application/pdf`.
Límite configurado: 50 MB por archivo.

Los PDFs se guardan con esta estructura:
`ID_CURSO/ID_MODULO/timestamp-nombre.pdf`

La web crea una URL firmada temporal cuando un usuario autorizado abre el PDF.

## Seguridad

La Publishable Key continúa siendo la única clave presente en frontend.
No se agrega ninguna Secret Key ni service_role.
