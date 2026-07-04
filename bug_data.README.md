# bug_data.csv — Guía rápida para el equipo de Database

## ¿Qué es este archivo?

Es la **fuente única de verdad** para todas las listas y reglas
que usa la herramienta de bug reports (`bug_tool.html`). Se edita
en Excel como cualquier otro CSV.

## Estructura

El archivo tiene **3 columnas**:

  | category | key        | value                          |
  |----------|------------|--------------------------------|
  | list     | regions    | NA                             |
  | list     | platforms  | PC(MSS)                        |
  | map      | -          | Highrise                       |
  | poi      | Highrise   | Office A                       |
  | tier     | T1         | Gameplay                       |
  | rule     | kw_count   | 5                              |

## Categorías y cómo editarlas

### `list` — listas planas (dropdowns simples)
Misma `key` = mismo grupo. Para agregar un valor, agrega una fila
con la misma `key` y un nuevo `value`.

Ejemplo: agregar la región "OCE"
| list | regions | OCE |

### `map` — lista de mapas
Ignorar la columna `key` (usar `-`). Cada fila es un mapa.

| map | - | NewMap_42 |

### `poi` — POIs agrupados por mapa
`key` = nombre del mapa (debe existir en la categoría `map`).
`value` = nombre del POI dentro de ese mapa.

| poi | NewMap_42 | Spawn |
| poi | NewMap_42 | Tower |
| poi | NewMap_42 | Courtyard |

Si borras un mapa en la categoría `map`, los POIs huérfanos se
marcaran en rojo en la pestaña Data de la herramienta y tendrás
que borrarlos a mano.

### `tier` — tiers / categorías amplias
Pares `key` (código) y `value` (descripción).

### `rule` — reglas de validación
Pares `key` (nombre de la regla) y `value` (valor).

Las reglas disponibles son:
  - `kw_count`        — número de keywords (por defecto 5)
  - `coord_fmt`       — texto de ayuda para el campo coordenadas
  - `coord_re`        — regex de validación de coordenadas
  - `repro_re`        — regex de tasa de reproducción (ej. 5/5)
  - `buildUrl_prefix` — prefijo de las URLs de build
  - `default_tz`      — zona horaria por defecto
  - `default_executable` — ejecutable por defecto

## Cómo editar el archivo

  1. Abrir `bug_data.csv` con doble click. Se abrirá en Excel.
  2. Agregar, borrar o editar filas. **No cambiar los encabezados
     de columna** (la primera fila debe ser siempre
     `category,key,value`).
  3. **No usar comas dentro de los valores** a menos que el valor
     esté entre comillas dobles (ej. `"value, with comma"`).
  4. **No usar comillas dobles dentro de los valores** a menos que
     se escapen como `""` (dos comillas dobles).
  5. Guardar como **CSV (separado por comas)** con el mismo
     nombre `bug_data.csv` (sobrescribir el archivo existente).
  6. Avisar al equipo para que recargue los datos en la
     herramienta (botón "Load latest" en `bug_tool.html`).

## Edición multi-persona

El archivo es texto plano, así que múltiples personas pueden
abrirlo a la vez. Excel bloqueará la primera persona en guardar y
avisará a las demás al intentar guardar. La convención es:
  - Si solo agregas filas nuevas, no hay conflicto.
  - Si modificas filas existentes, avisa por chat antes de
    guardar para coordinar.
  - El último en guardar "gana" las celdas modificadas — no hay
    merge automático.

## Cómo verificar que el archivo está bien

Antes de sobrescribir, abrir en un editor de texto plano
(TextEdit, Notepad, VSCode) y confirmar que:
  - La primera línea es exactamente: `category,key,value`
  - Cada fila tiene exactamente 2 comas separadoras
  - No hay líneas en blanco
  - No hay filas con celdas vacías (excepto el `-` permitido en
    la columna `key` de la categoría `map`)

## Respaldo

Antes de hacer cambios grandes, hacer una copia del archivo
(`bug_data_backup_YYYYMMDD.csv`). No es automático, pero es una
buena costumbre.
