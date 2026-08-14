# Aula Virtual Córdoba Casting · V4

Incluye todo V3:
- Supabase Auth
- Cursos/módulos/contenidos
- PDF nativo
- Foro bidireccional
- Diseño responsive y estética Córdoba Casting

Y agrega:

## Profes
Visible para alumnos, profesores y admin.
Muestra únicamente:
- Nombre
- Avatar
- Cursos a cargo

No expone emails.

## Avatares
Cada usuario puede tocar su foto de avatar en la esquina superior derecha y elegir entre:
- Meryl Streep
- Susan Sarandon
- Stella Adler
- Konstantin Stanislavski
- Viola Davis
- Tilda Swinton

El cambio se realiza mediante una función segura `set_my_avatar`: el usuario no obtiene permisos para cambiar su rol.

Las imágenes se sirven desde Wikimedia Commons.

## Material docente
Sólo profesores y admin ven:
- Biblioteca de ejercicios
- Guiones

Ambas áreas tienen:
- módulos;
- videos;
- PDF;
- Drive;
- enlaces;
- texto.

Profesores:
- crear y editar módulos;
- crear y editar contenido;
- subir PDF.

Administrador:
- todo lo anterior;
- además eliminar módulos/contenidos.

## INSTALACIÓN

Ya deberías tener ejecutados:
1. `supabase_migracion.sql`
2. `supabase_v3_pdf.sql`

Ahora ejecutá:
3. `supabase_v4_profes_bibliotecas.sql`

Después subí todos los archivos V4 a GitHub reemplazando la versión anterior.
