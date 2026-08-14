# Aula Virtual Córdoba Casting · Rediseño de marca

## Antes de subir esta versión a GitHub

En Supabase:
1. Abrí **SQL Editor → New query**.
2. Pegá el contenido de `supabase_migracion.sql`.
3. Ejecutá **Run**.
4. Cuando aparezca Success, recién entonces reemplazá los archivos del repositorio de GitHub por los de esta carpeta.

## Cambios incluidos

### Identidad visual
- Paleta principal bordó/rojo oscuro + negro.
- Violeta como acento secundario.
- Dorado usado sólo en llamadas de atención.
- Logo real de Córdoba Casting.
- Portadas basadas en las piezas gráficas proporcionadas.
- Los cursos sin una pieza específica usan un fondo de marca automáticamente.
- Se puede definir una portada personalizada desde “Editar curso” pegando una URL.

### Permisos
Administrador:
- Crear, editar y eliminar cursos.
- Crear, editar y eliminar módulos.
- Crear, editar y eliminar contenidos.
- Gestionar usuarios y accesos.
- Responder en foros.

Profesor:
- Ver sólo cursos asignados.
- Editar datos de esos cursos.
- Editar módulos existentes.
- Subir contenido.
- Editar contenido existente.
- NO crear cursos.
- NO eliminar cursos.
- NO eliminar módulos ni contenidos.
- Responder consultas del foro.

Alumno:
- Ver sólo sus cursos.
- Ver módulos y contenido.
- Crear preguntas o compartir links en el foro.
- NO responder consultas.

### Foro
Cada curso tiene dos pestañas:
- Módulos y contenido
- Foro del curso

Los alumnos crean consultas. Profesores y administradores responden.

### Mobile
- Menú lateral deslizable.
- Tarjetas a una columna.
- Formularios, contenidos y foro adaptados a pantallas pequeñas.

## Archivos nuevos
- `assets/logo.png`
- `assets/curso_actuacion_1.png`
- `assets/curso_actuacion_2.png`
- `assets/curso_direccion.png`
- `supabase_migracion.sql`

## Importante
No borres `supabase-config.js`. Sigue conectado al proyecto actual.
