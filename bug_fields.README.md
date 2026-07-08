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

Cuatro tipos de fila, identificados por la columna `type`:

  1. `type=form`    → declara un formulario (una pestaña superior).
  2. `type=section` → declara una sección dentro del último form.
  3. `type=cond`    → una condición entre campos (ver abajo).
  4. cualquier otro `type` → un campo dentro de esa sección.

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
| hidden    | `yes` = oculto por defecto (aparece solo por una condición) | (vacío)                     |
| kwcount   | solo chips: cantidad exacta, número o `@regla` (vacío = sin límite) | (vacío)             |
| kwoverlap | solo chips: `yes` = prohibir que aparezcan en el cuerpo del bug | (vacío)                 |

En `template`, `sep` y el encabezado de sección se puede escribir
`\n` o `<br>` para forzar un salto de línea en el output.

## Tipos de campo

  - `text`         — caja de texto de una línea.
  - `textarea`     — texto de varias líneas.
  - `autocomplete` — texto + dropdown autocompletable. La lista sale
                     de `source`. El dropdown tiene "+ Agregar..." al
                     final y una ✕ por opción para borrarla.
  - `keywords`     — chips (etiquetas). La validación es POR CAMPO:
                     `kwcount` = cantidad exacta (vacío = libre) y
                     `kwoverlap` = prohibir que aparezcan en el
                     cuerpo del bug. Un campo chips nuevo sin esas
                     columnas no exige nada.
  - `mirror`       — no se llena: copia el valor de otro campo
                     (columna `source`) para repetirlo en el output
                     (ej. el CCS en el bloque de Notas).

## Filas `type=cond` — condiciones entre campos

Reglas del tipo *SI (expresión) ENTONCES (acción sobre un campo)*. Lo
normal es editarlas en la pestaña **Rules** de la herramienta; en el
CSV viajan con este mapeo de columnas (el resto quedan vacías):

  | columna  | contiene                                                    |
  |----------|-------------------------------------------------------------|
  | form     | id del formulario                                           |
  | source   | EXPRESIÓN booleana de la condición (el "si") — ver abajo     |
  | regex    | acción: show / hide / disable / setDefault / error          |
  | regexmsg | campo destino (el "entonces")                               |
  | emptyas  | valor de la acción (default a poner, o mensaje de error)    |

La **expresión** (columna `source`) es texto y admite `AND`, `OR`,
`NOT` y paréntesis, anidados a cualquier profundidad. Comparaciones:

  - `campo empty` / `campo notEmpty`
  - `campo = "valor"` / `campo != "valor"`
  - `campo matches @regla` (o una regex directa)
  - `campoA = campoB` — compara dos campos por id (ambos no vacíos)
  - `@regla` suelta = evalúa esa regla booleana; se pueden concatenar
    (`@esLod OR @esVlod`)

El input se pone en rojo en la pestaña Rules si la sintaxis es inválida.

Ejemplos reales:
  - *BSP CL igual a CL → error*:
    `bug,,,,cond,bspCl = cl,,,,,,,,error,bspCl,,BSP CL debe ser distinto de CL,...`
  - *Descripción corta contiene "LOD" → mostrar LOD number*: campo
    `lodNumber` creado con `hidden=yes`, y una fila cond con
    `source=shortDescription matches @lod` (o `matches "LOD"`),
    `regex=show`, `regexmsg=lodNumber`.

> Compatibilidad: los CSV de la iteración 2 traían el operador en
> `template` y el valor en `default` (formato campo/op/valor); se
> siguen leyendo al importar y se reescriben como expresión al
> exportar. No hay que migrar nada a mano.

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
