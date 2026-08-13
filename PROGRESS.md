# Progreso del proyecto

Última actualización: 2026-08-12
Estado: activo — herramienta funcional, monolito documentado y con suite de regresión.

## Estado actual

- Aplicación canónica: `bug_tool.html`; variante activa:
  `bug_tool_multilanguage.html`.
- Distribución: dos HTML autocontenidos con configuración inicial en
  `#vanillaConfig`. La variante multilenguaje exporta bajo su propio nombre.
- Persistencia local: configuración e instancias en `localStorage`;
  importación/exportación explícita de CSV, sesión JSON y HTML integrado. La
  variante separa las preferencias de idioma/estilo de los datos de trabajo.
- Navegación interna: 23 bloques de primer nivel en la versión canónica y 24
  en la multilenguaje, descritos en `Directorio-Monolito.MD` y
  `Directorio-Monolito-Multilanguage.MD` respectivamente.
- Verificación automatizada: 33 pruebas con Node.js; incluye los casos
  históricos y específicos de la variante, con un smoke de navegador
  real para cada HTML.

## Trabajo completado recientemente

### 2026-08-12 — feedback de navegación más legible

- El pulso de navegación del formulario incorpora una Power Wave de 0,34 s y
  un Shock Ring de 0,68 s. Neon reutiliza sus animaciones completas cyan →
  magenta al 60 % de opacidad; Día/Otoño emplean un halo periférico sutil que
  abre en morado brillante y cierra en morado oscuro, mientras Noche pasa de
  plata a dorado. Todos conservan anillos de alto contraste.
- El Affected Box de Jira/Markdown mantiene su fondo semántico pero gana un
  borde con glow reforzado por tema. Los gradientes identificadores de todos
  los tipos de field (incluido el estado de error) conservan color hasta el
  60 % y se desvanecen hacia la esquina superior-derecha.

### 2026-08-12 — reconexión individual en la variante multilenguaje

- Cada field cuyo fragmento de output se haya editado manualmente revela un
  botón localizado **Reconectar** con color `--primary`. Restaura sólo ese
  fragmento desde la plantilla y conserva los demás desconectados; vuelve a
  ocultarse inmediatamente al completar la acción.
- Se actualizó el directorio de la variante, la guía de testers y la cobertura
  de lógica y navegador para este flujo.

### 2026-08-12 — navegación bidireccional Form ↔ Output

- La variante multilenguaje amplía `SEGMENTS` como fuente de verdad de
  provenance: cada field conserva sección, rango estructural con su separador,
  rango visual y refs exactas para placeholders `{campo}`. `sectionRanges`
  cubre headings y gaps, y detachment traslada todos los offsets e invalida
  refs manuales no confiables.
- Click en Plain, Jira o Markdown localiza el field/sección con Navigation
  Shockwave sin robar focus; doble click en preview enfoca el control editable.
  Las referencias y mirrors navegan al source útil. Plain continúa siendo un
  textarea normal sin overlays ni highlights.
- El focus real aplica Field Focus Lift y mantiene Preview Affected Box sólo
  sobre output generado directamente por el field; mirrors visibles admiten
  esta box por hover. Los cuatro temas y `prefers-reduced-motion` tienen
  feedback propio.
- Se corrigió el ownership de separadores/headers para evitar fragmentos
  huérfanos como ` - - -`, se actualizó el directorio multilenguaje y se añadió
  cobertura unitaria y de navegador para rangos, refs, detachment y navegación.

### 2026-08-12 — themes escalables y Bloc independiente de previews

- La variante multilenguaje ahora registra los temas `light`, `dark`, `autumn`
  y `neon` en un catálogo compartido entre bootstrap y aplicación; las
  preferencias siguen separadas de configuración, CSV, sesión y output.
- Se añadieron tokens completos para Otoño y Neon, además de los overrides
  Neon con Power Wave, soporte de movimiento reducido y el apilamiento del
  field activo para que los autocompletes no queden detrás de campos vecinos.
- Jira/Markdown ahora ocultan exclusivamente `#outputTextarea`. El Bloc y sus
  notas permanecen visibles, editables y fuera del output canónico en ambos
  modos de preview.
- Se actualizaron `Directorio-Monolito-Multilanguage.MD`, este registro y la
  suite de regresión de la variante.

### 2026-08-10 — variante multilenguaje y selectores de apariencia

- Se creó `bug_tool_multilanguage.html` como refactor paralelo autocontenido,
  con selector español/inglés y selector Día/Noche basado en los temas
  `light`/`dark` existentes.
- Los catálogos localizan la interfaz y un overlay presenta en inglés textos
  distribuidos conocidos del schema sin mutar la configuración. IDs, DATA,
  DSL, placeholders, plantillas, CSV, texto del usuario y output permanecen
  canónicos.
- Idioma y estilo se restauran antes del render desde
  `bug_tool_multilanguage_ui_v1`. Configuración y sesión usan claves v3
  propias con lectura de claves v2 para migración.
- La exportación de la variante conserva el nombre
  `bug_tool_multilanguage.html`; las preferencias visuales siguen locales al
  navegador y no forman parte de config, CSV, output ni archivo de sesión.
- Se añadieron `Directorio-Monolito-Multilanguage.MD` y documentación de uso,
  arquitectura, persistencia y QA. La suite suma contratos de catálogos,
  aislamiento, exportación y estabilidad del output; además prueba en
  Chrome/Edge el cambio y la restauración de idioma/tema. La matriz visual 2×2
  continúa siendo una revisión manual obligatoria.

### 2026-08-10 — gestión de DATA desde el autocompletado de chips

- El dropdown de keywords incorpora la ✕ para borrar una sugerencia compartida de DATA con confirmación y la acción **+ Agregar** para guardar un valor nuevo y crearlo como chip.
- Crear texto libre con Enter continúa afectando solo a la instancia; borrar una sugerencia de DATA tampoco elimina chips ya utilizados.
- Se actualizaron `Directorio-Monolito.MD` y la prueba de navegador.

### 2026-08-10 — severidad no bloqueante unificada en tiles

- Las opciones no bloqueantes **Aviso** e **Info** se unificaron como **Aviso/Info** (`warn`). Solo permanecen `Error` y `Aviso/Info` como tipos seleccionables.
- Las configuraciones locales, HTML exportados y CSV antiguos que contengan `info` se migran automáticamente a `warn`; las exportaciones nuevas escriben el valor unificado.
- Se actualizaron `Directorio-Monolito.MD` y este registro.

### 2026-08-10 — Jira enriquecido y entrada de chips corregida

- La vista Jira interpreta niveles de listas `*`/`#`, incluso combinados, y permite anidar negrita, subrayado y cursiva. Los guiones bajos dentro de una palabra ya no activan cursiva.
- `[texto|URL]`, `[^adjunto]` y `[~usuario]` se representan como referencias azules subrayadas y no navegables dentro de la vista previa.
- Al confirmar un chip, su input queda vacío. El resaltado del autocompletado mantiene cada sugerencia unida en vez de separar visualmente sus fragmentos.
- Se actualizaron las pruebas de navegador, `Directorio-Monolito.MD` y este registro.

### 2026-08-09 — vista previa Jira y Markdown

- Debajo de **Limpiar campos** hay switches mutuamente excluyentes para previsualizar el output actual como **Jira** o **Markdown**. La vista es de solo lectura, se actualiza con el texto y no altera el output canónico, sus copias ni sus rangos de edición manual.
- La preferencia de vista se conserva en la sesión local. El renderizador interpreta de forma segura listas, encabezados Markdown, énfasis, subrayado Jira, código y enlaces comunes, sin dependencias externas.
- La vista Jira ya reconoce bloques `{code}` y `{code:lenguaje}` (por ejemplo `{code:java}`); además, la salida reserva el alto de la barra cerrada del Bloc para que el último renglón permanezca visible.
- Se actualizaron `Directorio-Monolito.MD` y este registro.

### 2026-08-09 — entrada de chips y panel derecho compacto

- El editor de un campo de chips tiene pestañas propias de **Salida** y **Entrada**. En Entrada, **Crear un chip al pulsar Espacio** activa `kwSpace`: confirma una keyword de una sola palabra al teclear Espacio; Enter y coma conservan su función y el comportamiento predeterminado sigue siendo el anterior.
- `kwSpace` se conserva en el schema y en la nueva columna `kwspace` de `bug_fields.csv`; el importador continúa aceptando los encabezados anteriores.
- Un botón naranja fijo al borde derecho repliega o reabre conjuntamente el output, sus acciones y los nombres de media. Al reducir la ventana a 1100 px o menos se repliega automáticamente; el usuario puede reabrirlo mientras la ventana siga estrecha. El divisor manual formulario/output se conserva para cuando el panel vuelve a mostrarse.
- Se actualizaron `Directorio-Monolito.MD` y `bug_fields.README.md`.

### 2026-08-08 — output parcial, chips, checklist y condiciones de media

- Los `mirror` ocultos fuera de edición ya no reservan columnas en las filas de 1/3 o 1/2; el grid se compacta con los campos visibles.
- El checklist incorpora `+`: agrega y marca la opción. Con fuente DATA la suma a la lista raíz o al bucket dependiente seleccionado; sin fuente queda en la instancia actual.
- Los chips admiten fuente DATA opcional para autocompletar sin restringir texto libre, edición por doble clic y modos de output **Unida** (separador `, `) y **Líneas**, con plantilla por chip y encabezado opcional.
- El textarea de output identifica los rangos generados por plantillas: editar uno desconecta sólo ese campo y muestra un badge rojo; encabezados y separadores no desconectan campos, las copias de summary/description respetan los fragmentos manuales y **Regenerar** restaura la conexión completa incluso después de recargar la sesión.
- Las condiciones aceptan `media:mediaN:type`, permitiendo mostrar mirrors como `[^{media:media1}.mp4]` según el tipo sin cambiar el nombre canónico copiable de media.
- Las notas reutilizan el menor nombre `Nota N` libre y muestran un botón de lápiz para renombrarse.
- Se actualizaron `Directorio-Monolito.MD`, `bug_fields.README.md`, la compatibilidad de `bug_fields.csv` y la suite de regresión.

### 2026-08-12 — reconexión individual de output

- Cada campo desconectado por una edición directa de su fragmento de output muestra el botón naranja **Reconectar**. El control permanece oculto para todos los campos conectados y al usarlo restaura únicamente ese fragmento desde el template, conservando las desconexiones de los demás campos; **Regenerar** sigue reconectándolos todos.
- Se actualizó `Directorio-Monolito.MD`.

### 2026-08-08 — utilidades de formulario y notas por pestaña

- Los selectores de destino de condiciones y tiles en RULES ya incluyen los campos `mirror`, permitiendo condicionar su presencia en el output.
- Se añadió **Bloc**, un bloc de notas minimalista superpuesto al output. Tiene pestañas globales, añadir/cerrar/renombrar notas y tamaños de media altura o cubrir el output; se persiste en la sesión, se conserva al exportarla y se sincroniza entre ventanas del mismo navegador. Las notas de la versión inicial por pestaña se migran al bloc global y nunca se incorporan a ninguna acción de copia del output.
- La lupa junto a **Editar formulario** abre un buscador con buscar, reemplazar y reemplazar todas. Opera de forma literal sólo sobre inputs y textarea editables del formulario activo; vuelve a validar, regenerar output y guardar como un cambio normal.
- Cada campo con valor propio muestra un botón discreto para copiar únicamente su valor crudo, sin etiqueta ni plantilla de output.
- Se actualizaron `Directorio-Monolito.MD` y este registro.

### 2026-08-07 — suite robusta de regresión

- Se añadió una suite sin dependencias externas basada en `node:test`, ejecutable con `npm test`.
- Los contratos cubren marcadores y directorio, JSON y sintaxis, autocontención, schema y referencias, migraciones, expresiones, persistencia, transferencia entre formularios, output, CSV y exportación HTML segura.
- Una prueba smoke abre el monolito real en Chrome/Edge headless con un perfil temporal y verifica arranque, render, output, `localStorage`, recarga y navegación entre formularios.
- `TESTING.md` documenta comandos, alcance y criterio para ampliar los casos futuros.

### 2026-08-03 — exportación selectiva entre Bug y Regression

- Bug y Regression muestran un botón contextual junto a **Editar formulario** para exportar los valores de la instancia visible al otro tipo de formulario.
- El usuario elige explícitamente la pestaña de destino; solo se copian campos editables con el mismo ID y contenido. No se transfieren media, campos automáticos ni el output editado manualmente; los valores vacíos del origen no borran los del destino.
- Si un ID corresponde a un campo de valor múltiple en un formulario y escalar en el otro, se omite y se informa para no dejar un widget en un estado inválido.
- Se actualizaron `Directorio-Monolito.MD` y este registro.

### 2026-08-02 — ajuste de espacio del formulario y output

- La columna de IDs de media solo ocupa espacio en modo edición; fuera de él, los controles vuelven a alinearse al borde izquierdo del panel.
- Se añadió un divisor vertical arrastrable entre formulario y output. Conserva el ratio en la sesión local, respeta mínimos de uso y se reinicia al colapsar o volver a abrir el formulario.
- Se sincronizaron `Directorio-Monolito.MD` y `DESIGN.md`.

### 2026-08-01 — plantillas compuestas y media vinculable

- Todas las plantillas de campo aceptan `{value}` para el valor propio, `{idDeCampo}` para el valor crudo de otro campo con input del mismo formulario y `{media:mediaN}` para el nombre generado de una fila de media. `{{` y `}}` preservan llaves literales.
- El tipo persistente `mirror` se presenta como **Salida compuesta (solo output)**: mantiene `source` como origen opcional de `{value}`, pero puede armar un output sin input a partir de varias referencias.
- Las filas de media ahora se guardan como `{ id, type }`; las sesiones antiguas de strings se migran al abrir. Al agregar media se reutiliza el menor ID libre (`media1`, `media2`...), sin renumerar las filas restantes.
- El modo edición muestra los IDs de campos y media. El editor y `bug_fields.csv` validan las referencias; al borrar campos se eliminan las salidas compuestas dependientes y se avisa de las plantillas editables que requieren ajuste.
- Se actualizaron `Directorio-Monolito.MD`, `DESIGN.md` y `bug_fields.README.md`.

### 2026-07-30 — campos automáticos de reloj y fecha

- El editor permite crear campos `clock` y `date`, ambos de solo lectura y alimentados por la fecha/hora local de la PC.
- Cada tipo expone un selector de formato; el output usa el valor mediante la plantilla habitual `{value}`. En reloj, AM/PM se muestra exclusivamente con horas de 12 horas.
- Los valores se refrescan al regenerar output tras cambios de campo y justo antes de las acciones de copia. El texto completo editado manualmente se conserva como comportamiento establecido.
- `bug_fields.csv` incorpora la columna `format` y conserva compatibilidad de importación con encabezados anteriores de 28 y 23 columnas.
- Se sincronizaron `Directorio-Monolito.MD` y `bug_fields.README.md`.

### 2026-07-29 — reordenamiento de campos por drag-and-drop

- En modo edición de escritorio, los campos se pueden arrastrar desde el asa ⠿ y soltar antes o después de otro campo, incluso entre secciones vacías.
- El ID estable del campo identifica el arrastre y `section.fields` permanece como única fuente de verdad del orden.
- Pointer Events evita los problemas del DnD nativo bajo `file://`; el origen muestra «Moviendo…», el destino queda marcado y el cursor pasa de mano abierta a cerrada.
- El checkbox **Arrastrar campos**, situado a la izquierda del grupo «+ Sección / Terminar edición», sustituye ▲▼ por el asa ⠿ para liberar espacio en campos estrechos; su valor persiste en `state.prefs` al salir del modo edición y entre recargas en el mismo navegador.
- El preview de arrastre usa una tarjeta fantasma, un placeholder «Soltar aquí» que cruza antes/después en el punto medio y animación FLIP de 170 ms para los campos desplazados; `section.fields` sólo cambia al soltar.
- Las columnas vacías y los gaps horizontales de filas de 1/2 y 1/3 son hitboxes de la propia fila; sólo el espacio exterior conserva el atajo para enviar el campo al final de la sección.
- Arrastre y botones ▲▼ comparten la misma función de reordenamiento; se sincronizaron `Directorio-Monolito.MD`, `DESIGN.md` y `README.md`.

### 2026-07-29 — mantenibilidad del monolito

- Se añadieron límites `START/END` para estilos, interfaz, configuración embebida, catálogo de script y los 18 bloques funcionales principales.
- Se creó `Directorio-Monolito.MD` con palabras clave de búsqueda, dependencias y flujo de información.
- Se estableció la regla: todo cambio estructural del monolito actualiza ese directorio en la misma tarea.
- Se añadieron `AGENTS.md` y este documento para facilitar el relevo entre colaboradores y agentes.

### 2026-07-29 — guardado de archivos

- Las exportaciones de CSV, sesión JSON y HTML usan el selector nativo de guardado cuando el navegador lo permite; el usuario elige carpeta y nombre.
- Se mantiene el flujo de descarga estándar como compatibilidad para navegadores que no soportan ese selector.

### 2026-07-29 — datos ficticios de mapas

- La configuración canónica y `bug_data.csv` usan nombres ficticios de mapas y POIs inspirados en un shooter ambientado en League of Legends.

## Próximos pasos conocidos

- Los pendientes funcionales históricos están en la sección “Pendiente” de
  `DESIGN.md`; deben validarse con el usuario antes de implementarse.
- Factorizar más contratos comunes de schema/CSV/output para ejecutarlos contra
  ambos HTML cuando cambie ese núcleo compartido; conservar la cobertura
  específica de catálogos, persistencia, exportación y selectores.
- Mantener independientes los dos directorios de marcadores; no asumir que un
  cambio estructural de una variante aplica automáticamente a la otra.

## Cómo actualizar este archivo

Al terminar una tarea relevante, agregar una entrada breve con fecha, resultado verificable, documentos que debieron sincronizarse y cualquier decisión pendiente. Mantener las entradas más recientes arriba y evitar registrar cambios puramente mecánicos sin impacto de mantenimiento.
