# ROADMAP — ideas pendientes (a grandes rasgos)

Cosas anunciadas en las notas grises de la herramienta o conversadas,
aún no implementadas. Sin fechas: se van tomando por iteración.

## 1. Tiles personalizados — HECHO (iteración 5)

Implementado: en la pestaña **Rules** hay una tabla de tiles por
formulario (`form.tiles`) con texto (admite `{idCampo}`), condición
propia (mismo motor de expresiones; vacía = siempre visible), color de
una paleta con nombre (15 colores), severidad (error bloquea el "listo
para copiar"; aviso/info solo informan) y orden reordenable con ▲▼. Los
tiles automáticos por campo se conservan y su color también es editable
(columna Color en "Validaciones por campo"). La barra tiene dos líneas:
1ª = automáticos (orden del form), 2ª = personalizados (orden de la
tabla de Rules); cada una hasta 3 renglones y luego scroll. Se colapsa
por banda con la "llave" (▾) —patrón reutilizado también en las
secciones del form— y, al pasar el mouse por un campo, resalta los tiles
que lo mencionan y atenúa el resto. Viajan en `bug_fields.csv` como
filas `type=tile`. Ver ADDENDUM de DESIGN.md (iteración 5).

Queda para después: agrupación visual por categoría y color por grupo
(el dato `group` ya existe, sin UI por ahora).

## 2. Más conexiones media ↔ Rules

Ya editable: el formato (`media_fmt`) y los tipos (`mediaTypes`),
y desde la iteración 3 la lista y el formato **por sección/formulario**
(`form.media`, con el lápiz del panel de media; regresión puede llevar
prefijo `Open_`). Falta (Rubén dará detalle de lo que necesita el
equipo):

  - Condiciones sobre media, p. ej. "si el tipo de bug es Crash,
    exigir ConsoleLog" (tile o error si falta la Key). Reutilizaría el
    motor de expresiones de la iteración 3.
  - Formatos distintos por **tipo de media** (hoy: por sección).
  - Validar la Key del ticket con una REGEX (formato de la
    plataforma de issues del cliente).

## 3. Ideas menores anotadas

  - Botón de copia por sección (hoy: todo / summary / description).
  - Duplicar un formulario o una sección completa en modo edición.
  - Duplicar una instancia (mismo bug para otra plataforma).
  - Aviso al abrir si el HTML del sharefolder es más nuevo que la
    config local (hoy solo existe el chip "Config modificada").

## Cómo se decide qué entra

Cada punto se detalla en una conversación (como el caso LOD), se
implementa, se prueba en el navegador y se actualiza el ADDENDUM de
DESIGN.md. Nada de esto rompe los CSV ni los HTML ya distribuidos:
las configs viejas se completan solas al abrir (migración automática).
