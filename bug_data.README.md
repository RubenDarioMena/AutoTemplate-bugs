# bug_data.csv — Guía rápida para el equipo de Database

## ¿Qué es este archivo?

Contiene las listas y reglas que usa la herramienta de bug reports
(`bug_tool.html`). Se edita en Excel como cualquier otro CSV.

**Nota v2:** la herramienta ya trae estos datos integrados dentro
del HTML; este CSV sirve para *actualizarlos* (menú **Datos CSV →
Cargar bug_data.csv** en la herramienta) o para editarlos en Excel.
También se puede editar todo directo en la pestaña **Data** de la
herramienta y luego usar "Exportar herramienta" o "Exportar
bug_data.csv". Los CAMPOS del formulario van en el otro archivo,
`bug_fields.csv` (ver su propio README).

**Nota v2 sobre listas:** la columna `key` de la categoría `list`
acepta cualquier nombre nuevo — si agregas filas
`list,weapons,AK-47`, la lista `weapons` se crea sola y queda
disponible como fuente para campos dropdown.

**Nota v3 sobre listas correlacionadas:** cualquier lista puede tener
*listas dependientes* (hijas), como `POI` depende de `Mapa`. Ya no hay
un par built-in especial: `Mapa` es una lista raíz normal (`list,map,…`)
y `POI` es su dependiente (`childlist,poi,map`). Una lista puede ser
padre de varias hijas, y una hija puede a su vez ser padre → árbol a
cualquier profundidad (Región → Mapa → POI → …). Los CSV viejos con
`map`/`poi`/`link`/`linkparent`/`linkchild` se **siguen leyendo** al
cargar (se migran solos al árbol); al exportar se escribe el formato nuevo.

## Estructura

El archivo tiene **4 columnas**. `child` solo se usa en las filas
`childval`; queda vacío en las demás:

  | category  | key        | value    | child    |
  |-----------|------------|----------|----------|
  | list      | regions    | NA       |          |
  | list      | map        | Highrise |          |
  | childlist | poi        | map      |          |
  | childval  | poi        | Highrise | Office A |
  | listlabel | poi        | POI      |          |
  | rule      | kw_count   | >=5      |          |

La importación también acepta archivos anteriores de tres columnas, donde
`childval` guardaba `padre :: hijo` dentro de `value`.

## Categorías y cómo editarlas

### `list` — listas planas (dropdowns simples)
Misma `key` = mismo grupo. Para agregar un valor, agrega una fila
con la misma `key` y un nuevo `value`.

Ejemplo: agregar la región "OCE"
| list | regions | OCE |

### `childlist` — declara una lista dependiente y su padre
`key` = id de la lista hija. `value` = id de la lista padre (raíz o a su
vez dependiente). Una fila por lista dependiente.

| childlist | poi | map |

Aquí `poi` depende de `map`. Para encadenar (Región → Mapa → POI): la
lista `map` sería `childlist,map,region` y `poi` seguiría siendo
`childlist,poi,map`.

### `childval` — valores de una lista dependiente
`key` = id de la lista hija, `value` = nombre del valor padre y
`child` = valor hijo.

| childval | poi | Highrise | Office A |
| childval | poi | Highrise | Helipad  |
| childval | poi | Skyline  | Rooftop  |

Si borras un valor del padre, sus hijos quedan *huérfanos* y se marcan
en rojo en la pestaña Data de la herramienta. Borrar el padre entero
(o su lista) arrastra a todas sus dependientes en cascada.

### `listlabel` — etiqueta bonita de una lista (opcional)
`key` = id de la lista. `value` = nombre visible (p. ej. `map` → `Mapa`).
Si no hay `listlabel`, se muestra el id tal cual.

| listlabel | map | Mapa |
| listlabel | poi | POI  |

### `rule` — reglas de validación
Pares `key` (nombre de la regla) y `value` (valor).

Las reglas disponibles son:
  - `kw_count`        — cantidad exacta (`5`) o mínima (`>=5`) de keywords
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
     `category,key,value,child`).
  3. **No usar comas dentro de los valores** a menos que el valor
     esté entre comillas dobles (ej. `"value, with comma"`).
  4. **No usar comillas dobles dentro de los valores** a menos que
     se escapen como `""` (dos comillas dobles).
  5. Guardar como **CSV (separado por comas)** con el mismo
     nombre `bug_data.csv` (sobrescribir el archivo existente).
  6. Avisar al equipo para que lo cargue en la herramienta
     (menú **Datos CSV → Cargar bug_data.csv** en `bug_tool.html`),
     o mejor: cargarlo tú y repartir el HTML con
     "Exportar herramienta" para que nadie más tenga que hacerlo.

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
  - La primera línea es exactamente: `category,key,value,child`
  - Cada fila tiene exactamente 3 comas separadoras
  - No hay líneas en blanco
  - `category`, `key` y `value` no están vacíos; `child` solo tiene
    contenido en las filas `childval`
  - En `childval`, `value` contiene el padre y `child` contiene el hijo

## Respaldo

Antes de hacer cambios grandes, hacer una copia del archivo
(`bug_data_backup_YYYYMMDD.csv`). No es automático, pero es una
buena costumbre.
