# Bugs Template Tool

Herramienta interna para generar reportes de bugs y notas de
regresión. Cada versión se distribuye como un archivo HTML autocontenido: los
campos del formulario, las listas de datos y las reglas de validación viajan
DENTRO del archivo. No se instala nada, no usa red, no tiene dependencias de
ejecución.

## Archivos en esta carpeta

  - **`bug_tool_multilanguage.html`** — la herramienta canónica (doble click
    para abrir), con selector de idioma español/inglés y cuatro estilos.
    Exporta una copia autocontenida bajo ese mismo nombre.
  - **`bug_tool.html`** — versión histórica de compatibilidad. No es la
    distribución que se debe modificar ni repartir por defecto.
  - **`bug_data.csv`** — los VALORES de las listas (mapas, POIs,
    regiones, plataformas, tiers, reglas). Para actualizaciones.
  - **`bug_fields.csv`** — los CAMPOS de los formularios y su
    formato de salida. Para actualizaciones.
  - **`bug_data.README.md`** — guía del CSV de datos.
  - **`bug_fields.README.md`** — guía del CSV de campos.
  - **`DESIGN.md`** — documento de diseño (referencia técnica).
  - **`Directorio-Monolito.MD`** y
    **`Directorio-Monolito-Multilanguage.MD`** — mapas de mantenimiento de
    cada monolito.
  - **`TESTING.md`** — pruebas de regresión para mantenimiento.

## Idioma y estilo

En `bug_tool_multilanguage.html`, los dos selectores de la barra superior se
aplican inmediatamente:

  - **Idioma:** Español o English. Traduce la interfaz y presenta en inglés
    los labels, ayudas y mensajes distribuidos que la variante reconoce.
  - **Estilo:** Día, Noche, Otoño o Neon (internamente `light`, `dark`,
    `autumn` y `neon`). Sólo cambia la apariencia; no modifica datos ni
    reportes.

Ambas preferencias se guardan localmente en el navegador y se restauran antes
del primer render. El idioma es una capa de presentación: no traduce IDs,
valores de DATA, expresiones de RULES, placeholders, plantillas, CSV, texto
escrito por el tester ni el output canónico. Los textos personalizados que no
tengan una traducción distribuida se muestran tal como fueron escritos.

## Flujo para testers

  1. Doble click en `bug_tool_multilanguage.html`. Viene lista y no requiere
     cargar un CSV.
  2. Llenar los campos. Los tiles de arriba avisan en rojo qué falta
     o qué está mal escrito (click en el tile = saltar al campo).
  3. El output se puede corregir antes de copiar. Si cambias texto generado
     por una plantilla, un aviso rojo indica cuántos campos quedaron
     desconectados; los demás se siguen actualizando y los botones de copia
     respetan tu corrección. En cada campo desconectado aparece **Reconectar**:
     restaura sólo su fragmento desde la plantilla y conserva las demás
     correcciones manuales. **Regenerar** vuelve a conectarlos todos. En la
     variante multilenguaje, un click en el output o en su preview localiza el
     campo de origen; un doble click en Jira/Markdown también entra a editarlo.
     Al enfocar un campo, Jira/Markdown enmarca el fragmento que ese campo
     genera directamente, sin modificar visualmente el textarea Plain.
  4. Copiar el reporte con los botones de la derecha.
  5. El progreso se guarda solo en el navegador; al reabrir el
     archivo se continúa donde se quedó.

## Personalizar los formularios (sin tocar código)

  1. Botón **"✎ Editar formulario"** (arriba del formulario).
  2. Aparecen los controles en cada sección y campo:
     - **▲ ▼** cambia el orden (el orden visual ES el orden del output).
     - En computadora, marca **Arrastrar campos** para sustituir las flechas de cada campo por el asa **⠿**. Mientras arrastras, una tarjeta sigue el puntero y el placeholder «Soltar aquí» muestra la posición final antes de cambiar el reporte. La elección se conserva al salir y volver al modo edición.
     - **✎** edita etiqueta, tipo, plantilla de salida, validación...
     - **✕** borra (siempre pide confirmación)
     - **+ campo** / **+ Agregar sección** para crecer el formulario
  3. En los dropdowns: la fila **"+ Agregar «...»"** suma opciones a
     la lista y la **✕** de cada opción la borra (con confirmación).
     Los checklists también tienen **+** para crear y marcar una opción.
     Los campos de chips pueden enlazarse opcionalmente a una lista para
     sugerencias, aceptar texto libre, editar chips con doble clic y salir
     en modo **Unida** o **Líneas**.
  4. Al terminar: **"Exportar herramienta"** descarga una copia nueva con
     todo integrado. Conserva el nombre `bug_tool_multilanguage.html`. Ese
     archivo se pone en el sharefolder y es el que copia el resto del equipo.

Aviso: cuando tu configuración local difiere de la del archivo, la
barra superior muestra **"Config modificada"** para recordarte
exportar.

## Importar, exportar y datos locales

- **Exportar herramienta** integra la configuración actual (DATA, schema y
  reglas) dentro de un nuevo `bug_tool_multilanguage.html`. No incluye las
  pestañas de trabajo, texto manual del output, Bloc ni idioma/estilo local.
- **Cargar `bug_data.csv`** reemplaza sólo DATA (listas y reglas globales).
  **Cargar `bug_fields.csv`** reemplaza sólo los formularios, secciones,
  campos y sus reglas. Ninguno borra por sí mismo las pestañas de trabajo; los
  valores de campos ya inexistentes pueden quedar almacenados pero no se usan.
  Tras importar ambos CSV, exporta la herramienta para convertirlos en la
  nueva configuración distribuida.
- **Guardar/Cargar sesión** transporta una instantánea completa de
  configuración, instancias, output manual, Bloc y la última subpestaña de
  cada formulario. Al cargarla reemplaza la configuración y trabajo locales;
  no mezcla reglas ni campos de la sesión anterior. Idioma, estilo y algunas
  preferencias visuales siguen siendo locales al navegador.
- **Borrar todo lo local** sólo borra las claves locales de este navegador y
  recarga el HTML distribuido. No borra archivos, CSV ni sesiones guardadas en
  disco.

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
    instancias con el "+", como pestañas de Notepad++). El botón
    **Exportar a Regression / Bug** permite elegir una pestaña del otro
    formulario y copiarle los campos con el mismo ID; no borra datos de
    destino si el campo de origen está vacío.
  - **Data** — edita listas, mapas, POIs, tiers y reglas globales.
  - **Rules** — vista técnica de TODAS las validaciones: obligatorio,
    REGEX (directa o `@regla`), mensaje de error y default por campo.
    Además, **condiciones entre campos**: si el campo A está vacío /
    es igual a X / cumple una REGEX / coincide con otro campo →
    mostrar, ocultar o bloquear el campo B, ponerle un default, o
    marcar un error (ej. "BSP CL debe ser distinto de CL"). Para
    campos exclusivos de un tipo de issue (ej. LOD number), se crea
    el campo como "oculto por defecto" y una condición lo muestra.
    También se puede condicionar por tipo de media, por ejemplo
    `media:media1:type = "Vid"`, para mostrar un mirror que agregue `.mp4`
    únicamente al output de regresión.

## Nombres de media

El textbox **Key** (la clave del ticket) se llena una vez y los
nombres de Vid/Pic/ConsoleLog/DxDiag se generan solos con los datos
del formulario. El formato es editable por cliente: regla
`media_fmt` en Data → Reglas, con placeholders `{type}`, `{key}`,
`{platform}` y cualquier id de campo (ej. `{cl}`). Los tipos de
media son la lista `mediaTypes` en Data.

## Seguridad

  - No se instala nada; todo corre en el navegador.
  - Cero llamadas de red, cero dependencias externas.
  - Todo el código y la configuración son visibles abriendo cualquiera de los
    `.html` con un editor de texto (la config vive en un bloque JSON legible
    dentro del archivo).
  - El progreso se guarda localmente (`localStorage`), nunca en un
    servidor. Las únicas escrituras a disco son las descargas que el
    usuario pide con un botón.
