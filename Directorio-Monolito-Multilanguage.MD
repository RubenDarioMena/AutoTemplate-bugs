# Directorio del monolito multilenguaje

Este directorio describe exclusivamente `bug_tool_multilanguage.html`, la
variante autocontenida con interfaz en español/inglés y estilos Día/Noche,
Otoño/Autumn y Neon.
`bug_tool.html` conserva su mapa independiente en `Directorio-Monolito.MD`.

## Cómo localizar una sección

Cada bloque de primer nivel está encerrado por el par:

```text
MONOLITH:SECTION <nombre> START
MONOLITH:SECTION <nombre> END
```

Cada nombre debe aparecer exactamente una vez como `START` y una como `END`,
en ese orden. No se reutilizan nombres ni se mueve sólo uno de los límites. Si
se crea, elimina, divide, une o renombra un bloque, o cambia su contrato de
datos, este directorio se actualiza en la misma tarea.

## Fronteras de idioma, apariencia y datos

```text
localStorage UI -> preferences-bootstrap -> lang + data-theme
                                      \-> localization-appearance -> DOM/render

vanilla-config -> config -> schema/data -> instancias -> formulario
                                      |               -> validación/tiles
                                      |               -> output/media
                                      -> DATA, RULES, CSV y exportación
instancias + config <-> localStorage v3 / archivo de sesión

field template -> SEGMENTS (field + section + refs) -> output editable
                         |                         \-> Jira/Markdown metadata
                         \-> sectionRanges             <-> formulario por ID
```

- Los valores internos de idioma son `es` y `en`; los de estilo son `light`,
  `dark`, `autumn` y `neon`, presentados en el idioma activo. El catálogo
  compartido `window.__BUG_TOOL_APPEARANCE_OPTIONS__` es la única fuente de
  verdad para los valores aceptados tanto por el bootstrap como por la app.
- `UI_MESSAGES` debe conservar las mismas claves y placeholders en ambos
  idiomas. `configuredText` es un overlay de presentación para textos
  distribuidos conocidos y nunca modifica `config`.
- IDs, valores DATA, fuentes, tokens de la DSL, referencias `@regla`,
  placeholders de plantilla, plantillas, CSV, texto escrito por el usuario y
  output canónico no se traducen. Un texto personalizado sin traducción se
  muestra literalmente.
- Idioma y estilo se guardan en `bug_tool_multilanguage_ui_v1`; configuración
  e instancias usan `bug_tool_multilanguage_v3_config` y
  `bug_tool_multilanguage_v3_session`. La variante puede leer las claves v2
  anteriores para migrar trabajo existente, sin escribir de nuevo en ellas.
- La exportación de la variante produce `bug_tool_multilanguage.html` y sólo
  integra la configuración editable en la copia prístina. Las preferencias de
  idioma y estilo siguen siendo locales al navegador.
- `segments` es el mapa canónico de provenance del output: cada segmento
  incluye `fieldId`, `sectionId`, rango estructural `start/end`, rango visual
  `contentStart/contentEnd` y subrangos `refs` para placeholders `{campo}`.
  El prefijo que introduce un field pertenece al propio segmento. Los
  `sectionRanges` cubren heading, fields y gap final; detachment y edición
  manual trasladan ambos contratos y descartan refs que dejan de ser fiables.

## Índice de secciones

| Sección y marcador | Recibe información de | Envía información a |
| --- | --- | --- |
| `styles` | Clases, IDs, estados del DOM y atributo `data-theme`. | Tokens y layout completos para `light`/Día, `dark`/Noche, `autumn`/Otoño y `neon`/Neon; Field Focus Lift, Navigation Shockwave y Preview Affected Box conservan prioridad de errores, stacking de autocomplete y movimiento reducido. La preview oculta exclusivamente `#outputTextarea`, nunca el textarea del Bloc. |
| `preferences-bootstrap` | `bug_tool_multilanguage_ui_v1` y, sólo como migración, `bugtool_theme_v1`. | Publica `window.__BUG_TOOL_APPEARANCE_OPTIONS__` y aplica `lang`, `data-theme` y `window.__BUG_TOOL_BOOT_PREFS__` antes de pintar el cuerpo, con fallback `es`/`light`. |
| `app-shell` | Claves de traducción estática y estructura fija de la aplicación. | DOM consumido por renderizadores y controles: selector `es`/`en`, selector de cuatro temas, menús, formulario, output, Bloc, media, DATA, RULES, archivos y modal. |
| `vanilla-config` | Configuración distribuida dentro del HTML. | Schema, DATA, reglas y plantillas canónicas para carga, migraciones, CSV y exportación; continúa siendo JSON válido sin comentarios. |
| `script-catalog` | Ninguna; es un índice humano del JavaScript. | Navegación de mantenimiento por los bloques numerados. |
| `01-constants` | Documento prístino, metadatos de la variante y claves de catálogo. | `PRISTINE_HTML`, `APP_META`, claves v3/legacy, tipos de campo, formatos, tamaños, colores y severidades usados por render, persistencia y exportación. |
| `localization-appearance` | Preferencias precargadas, el catálogo compartido de apariencia, catálogos `es`/`en`, atributos `data-i18n*` y textos distribuidos del schema. | `t`, `tp`, validación de catálogos/placeholders, traducción del DOM, `setLanguage`, `setTheme` y overlay no destructivo `configuredText`; reutiliza el catálogo de apariencia y actualiza `lang`/`data-theme` sin mutar datos canónicos. |
| `02-utilities` | Solicitudes de texto, almacenamiento, copia y guardado de todos los bloques. | Helpers de escape, clonación, IDs, referencias, `Storage`, portapapeles y guardado explícito; localiza mensajes y descripciones de tipo de archivo. |
| `03-config` | `vanilla-config`, clave v3, clave legacy v2 y formatos históricos. | `vanilla` y `config` normalizadas, árbol de listas, expresiones y tiles; completa novedades distribuidas sin pisar cambios locales. |
| `04-schema-helpers` | `config.schema`, `config.data`, formulario e instancia activos. | Lectura de formularios, secciones, campos, fuentes y opciones para widgets y editores, conservando IDs y valores canónicos. |
| `05-instances-persistence` | Schema, configuración y sesiones v3 o legacy; preferencias funcionales de sesión. | `state`, instancias saneadas, media estable, Bloc global, output desconectado, `outputSegments`/`outputRanges`/`outputSectionRanges` derivados y guardado diferido. Los errores localizados son derivados y se recalculan, no se persisten. |
| `06-tabs-navigation` | `state`, formularios, instancias y `configuredText`. | Pestañas localizadas, navegación y transferencia no destructiva de valores compatibles entre Bug/Regression; llama a `refreshAll`. |
| `07-form-rendering` | Schema, instancia, reglas evaluadas, preferencias de orden y textos de presentación. | Formulario localizado con destinos estables `data-field`/`data-section`, controles de edición/drag-and-drop y mutaciones de valores que disparan validación, output y persistencia. |
| `08-field-widgets` | Definición de campo, instancia, DATA y catálogo UI. | Autocomplete, checklist y chips; administra opciones compartidas o locales sin traducir sus valores almacenados. |
| `09-schema-editor` | Schema, fuentes, posiciones, dependencias y catálogos de controles. | Schema canónico editado, reordenamiento, validación de referencias, consistencia de instancias y modales localizados. |
| `10-validation-rules-tiles` | Campos, media, reglas, instancia, catálogos y divisor formulario/output. | Errores recalculados en el idioma activo, tiles localizados, expresiones canónicas y comportamiento responsivo/plegable del layout. |
| `11-output-generator` | Schema, plantillas, valores, condiciones, fragmentos desconectados, Bloc y preferencia de preview. | Output canónico, `segments` con ownership de prefixes y refs, `sectionRanges`, rangos de copia, detachment trasladado y preview Jira/Markdown con metadata semántica. También resuelve navegación ref > field > section, focus/hover de mirror y feedback entre preview/output y formulario; Plain permanece sin decoración. Cambiar idioma no traduce ni reescribe el reporte. |
| `12-media-panel` | Configuración de media, instancia, reglas, valores de campo y catálogo UI. | Nombres canónicos de media, filas `{ id, type }`, controles y mensajes de presentación localizados. |
| `13-data-tab` | `config.data`, metadata de listas, jerarquías y `configuredText`. | DATA editable con chrome localizado; conserva literalmente claves y valores que consumen schema, reglas y CSV. |
| `14-rules-tab` | Schema, reglas globales, condiciones, tiles y catálogos. | Editor visual localizado que escribe expresiones, referencias, tipos y valores canónicos en `config`. |
| `15-csv-io` | CSV seleccionados, `config` y validadores de schema/referencias. | Importación y exportación canónica de `bug_data.csv`/`bug_fields.csv`, config normalizada y sesiones coherentes; el idioma no cambia el formato de intercambio. |
| `16-tool-export` | `PRISTINE_HTML`, `APP_META.exportName` y `config` actual. | `bug_tool_multilanguage.html` autocontenido con config integrada y JSON protegido frente a cierres de script. |
| `17-session-modals-controls` | Archivos de sesión, acciones del usuario y catálogos de mensajes. | Carga/guardado explícito de sesión, modales, banners y menús. El archivo de sesión transporta config y trabajo, no la preferencia local de idioma/estilo. |
| `18-boot` | Config embebida, migraciones, sesión, preferencias de apariencia, catálogos y todos los bloques anteriores. | Aplicación inicializada: valida catálogos, conecta selectores, controles y eventos delegados de navegación bidireccional, sanea estado, restaura layout y renderiza en el idioma/estilo activos. |

## Puntos de entrada habituales

- Cambiar traducciones, idiomas o apariencia: `preferences-bootstrap`,
  `localization-appearance`, `styles` y `app-shell`.
- Cambiar datos, labels configurables o reglas: `vanilla-config`,
  `03-config`, `13-data-tab` y `14-rules-tab`.
- Cambiar formulario u output: `07-form-rendering`, `09-schema-editor` y
  `11-output-generator`; mantener explícita la frontera entre presentación y
  contenido canónico.
- Cambiar persistencia o compatibilidad v2/v3: `03-config`,
  `05-instances-persistence`, `17-session-modals-controls` y `18-boot`.
- Cambiar importación/exportación: `15-csv-io`, `16-tool-export` o
  `17-session-modals-controls`.

## Verificación de mantenimiento

Además de las comprobaciones generales del repositorio, toda modificación de
esta variante debe validar los 24 pares de marcadores, el JSON de
`#vanillaConfig`, la sintaxis de los scripts, la igualdad de claves y
placeholders entre catálogos, la autocontención y el nombre de exportación.
Los cambios visuales requieren revisar la matriz español/inglés para los cuatro
temas y confirmar que Jira/Markdown no ocultan ni deshabilitan el Bloc.
