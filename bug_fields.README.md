# bug_fields.csv — Guía para editar los CAMPOS de los formularios

## ¿Qué es este archivo?

Define **qué campos y secciones tienen los formularios** (Bug,
Regression, y los que se agreguen) y **cómo se arma el texto del
output**. Es la pareja de `bug_data.csv`:

  - `bug_data.csv`   → los VALORES de las listas (mapas, regiones...)
  - `bug_fields.csv` → los CAMPOS del formulario y su formato de salida

Normalmente **no hace falta editarlo a mano**: se edita desde la
propia herramienta (botón "✎ Editar formulario") y se exporta con
*Datos CSV → Exportar bug_fields.csv*. Este archivo sirve para
compartir esos cambios o para editarlos en Excel si se prefiere.

## Cómo se aplica

En `bug_tool.html`: **Datos CSV → Cargar bug_fields.csv…**
Esto reemplaza TODOS los formularios (pide confirmación). Lo escrito
en las pestañas abiertas se conserva donde los ids coincidan.

## Estructura

Tres tipos de fila, identificados por la columna `type`:

  1. `type=form`    → declara un formulario (una pestaña superior).
  2. `type=section` → declara una sección dentro del último form.
  3. cualquier otro `type` → un campo dentro de esa sección.

**El orden de las filas es el orden en pantalla y en el output.**

## Columnas

| columna   | en filas de campo                                        | en filas de section            |
|-----------|----------------------------------------------------------|--------------------------------|
| form      | id del formulario (bug, regression...)                   | igual                          |
| section   | id de la sección a la que pertenece                      | id de la sección               |
| field     | id único del campo (sin espacios)                        | (vacío)                        |
| label     | etiqueta que ve el tester                                 | nombre de la sección           |
| type      | text / textarea / autocomplete / keywords / mirror       | la palabra `section`           |
| source    | autocomplete: lista (`regions`, `maps`, `pois:map`...) — mirror: id del campo que copia | modo: `lines` o `joined` |
| size      | ancho en el formulario: vacío(=full) / half / third      | (vacío)                        |
| template  | cómo sale en el output; `{value}` = lo escrito. Ej: `* *Perfil:* {value}` | encabezado de la sección, ej. `+Notas:+` |
| sep       | separador ANTES del campo (secciones joined). `NONE` = pegado sin separador | separador por defecto de la sección |
| joinprev  | `yes` = continúa en la línea anterior (ej. tz tras timestamp) | (vacío)                    |
| perline   | `yes` = aplica la plantilla a CADA línea escrita (ej. `# {value}` en repro steps) | (vacío)  |
| rows      | renglones visibles (solo textarea)                        | (vacío)                        |
| required  | `yes` = obligatorio                                       | (vacío)                        |
| regex     | validación: regex de JavaScript o `@regla` de bug_data (ej. `@coord_re`) | (vacío)         |
| regexmsg  | mensaje de error si no cumple la regex                    | (vacío)                        |
| default   | valor inicial; acepta `@regla` (ej. `@default_tz`)        | (vacío)                        |
| emptyas   | si el campo queda vacío, imprimir esto (ej. `N/A`). Vacío = omitir la línea | (vacío)      |
| omitvalue | si el valor es exactamente esto, NO imprimir la línea (ej. `N/A` en BSP CL) | (vacío)      |
| nogap     | (vacío)                                                   | `yes` = sin línea en blanco después de la sección |
| help      | texto de ayuda bajo el campo                              | (vacío)                        |

## Tipos de campo

  - `text`         — caja de texto de una línea.
  - `textarea`     — texto de varias líneas.
  - `autocomplete` — texto + dropdown autocompletable. La lista sale
                     de `source`. El dropdown tiene "+ Agregar..." al
                     final y una ✕ por opción para borrarla.
  - `keywords`     — chips de palabras clave. Valida cantidad
                     (regla `kw_count`), unicidad y que no aparezcan
                     en el cuerpo del bug.
  - `mirror`       — no se llena: copia el valor de otro campo
                     (columna `source`) para repetirlo en el output
                     (ej. el CCS en el bloque de Notas).

## Valores de `source` para autocomplete

  - nombre de una lista de `bug_data.csv` (ej. `regions`, `platforms`,
    o cualquier lista nueva que crees en la pestaña Data)
  - `maps` — la lista de mapas
  - `pois:<idDeCampo>` — POIs filtrados por el mapa elegido en el
    campo indicado (ej. `pois:map`)

## Consejos al editar en Excel

  - No cambiar la fila de encabezados.
  - Si un valor lleva comas o espacios al inicio/final (como el
    separador `" - "`), va entre comillas dobles.
  - Ids (`form`, `section`, `field`): sin espacios ni acentos.
  - Antes de repartirlo, cargarlo una vez en la herramienta: si algo
    está mal, dirá exactamente qué línea tiene el problema y no
    aplicará nada.
