# Bugs Template Tool (v2)

Herramienta interna para generar reportes de bugs y notas de
regresión. Es un único archivo HTML autocontenido: los campos del
formulario, las listas de datos y las reglas de validación viajan
DENTRO del archivo. No se instala nada, no usa red, no tiene
dependencias.

## Archivos en esta carpeta

  - **`bug_tool.html`** — la herramienta (doble click para abrir).
    Trae integrados los formularios, los datos y las reglas.
  - **`bug_data.csv`** — los VALORES de las listas (mapas, POIs,
    regiones, plataformas, tiers, reglas). Para actualizaciones.
  - **`bug_fields.csv`** — los CAMPOS de los formularios y su
    formato de salida. Para actualizaciones.
  - **`bug_data.README.md`** — guía del CSV de datos.
  - **`bug_fields.README.md`** — guía del CSV de campos.
  - **`DESIGN.md`** — documento de diseño (referencia técnica).

## Flujo para testers

  1. Doble click en `bug_tool.html`. Ya viene todo cargado; no hay
     que abrir ningún CSV.
  2. Llenar los campos. Los tiles de arriba avisan en rojo qué falta
     o qué está mal escrito (click en el tile = saltar al campo).
  3. Copiar el reporte con los botones de la derecha.
  4. El progreso se guarda solo en el navegador; al reabrir el
     archivo se continúa donde se quedó.

## Personalizar los formularios (sin tocar código)

  1. Botón **"✎ Editar formulario"** (arriba del formulario).
  2. Aparecen los controles en cada sección y campo:
     - **▲ ▼** cambia el orden (el orden visual ES el orden del output)
     - **✎** edita etiqueta, tipo, plantilla de salida, validación...
     - **✕** borra (siempre pide confirmación)
     - **+ campo** / **+ Agregar sección** para crecer el formulario
  3. En los dropdowns: la fila **"+ Agregar «...»"** suma opciones a
     la lista y la **✕** de cada opción la borra (con confirmación).
  4. Al terminar: **"Exportar herramienta"** descarga un
     `bug_tool.html` nuevo con todo integrado. Ese archivo se pone en
     el sharefolder y es el que copia el resto del equipo.

Aviso: cuando tu configuración local difiere de la del archivo, la
barra superior muestra **"Config modificada"** para recordarte
exportar.

## Flujo para el equipo de Database

Dos maneras, las dos válidas:

  - **Desde la herramienta**: pestaña **Data** (listas/mapas/POIs/
    tiers/reglas) y **Rules** (validaciones por campo). Al terminar,
    "Exportar herramienta" y reemplazar el HTML del sharefolder.
  - **Desde Excel**: editar `bug_data.csv` y/o `bug_fields.csv`
    (guías en sus README). Quien recibe el CSV lo carga con el menú
    **Datos CSV** de la herramienta — una vez, y listo.

## Pestañas

  - **Bug / Regression** — formularios (se pueden abrir varias
    instancias con el "+", como pestañas de Notepad++).
  - **Data** — edita listas, mapas, POIs, tiers y reglas globales.
  - **Rules** — vista técnica de TODAS las validaciones: obligatorio,
    REGEX (directa o `@regla`), mensaje de error y default por campo.

## Seguridad

  - No se instala nada; todo corre en el navegador.
  - Cero llamadas de red, cero dependencias externas.
  - Todo el código y la configuración son visibles abriendo el
    `.html` con un editor de texto (la config vive en un bloque JSON
    legible al final del archivo).
  - El progreso se guarda localmente (`localStorage`), nunca en un
    servidor. Las únicas escrituras a disco son las descargas que el
    usuario pide con un botón.
