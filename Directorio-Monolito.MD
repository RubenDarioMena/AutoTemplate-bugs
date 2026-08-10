# Directorio del monolito

Este directorio describe la versión principal: `bug_tool.html`. El archivo `bug_tool_redesign.html` es una variante anterior y no comparte necesariamente la misma estructura o funcionalidades.

## Cómo localizar una sección

Cada bloque de primer nivel está encerrado por dos comentarios que no modifican el comportamiento de HTML, CSS ni JavaScript:

```text
MONOLITH:SECTION <nombre> START
MONOLITH:SECTION <nombre> END
```

Busca la cadena completa del marcador `START` para llegar al comienzo, o la misma cadena con `END` para encontrar su cierre. Por ejemplo:

```text
MONOLITH:SECTION 11-output-generator START
MONOLITH:SECTION 11-output-generator END
```

No reutilizar nombres de sección ni mover solo uno de los dos marcadores. Si se crea un bloque funcional nuevo, debe recibir ambos marcadores y una entrada en este documento.

> Regla obligatoria: toda modificación que agregue, elimine, divida, una, renombre o cambie las relaciones de una sección de `bug_tool.html` debe actualizar este directorio en la misma tarea. No se considera terminado un cambio estructural si sus marcadores y esta documentación no están sincronizados.

## Flujo de información

```text
vanilla-config -> config -> schema/data -> instancias -> render/formulario
                                      |                  -> validación/tiles
                                      |                  -> output/media
                                      -> DATA, RULES, CSV y exportación
instancias + config <-> localStorage / archivo de sesión
```

## Índice de secciones

| Sección y marcador | Recibe información de | Envía información a |
| --- | --- | --- |
| `styles` | Clases, IDs y estados que genera la interfaz y el JavaScript. | Presentación visual de toda la aplicación, incluidas las pestañas del editor de chips y el panel derecho plegable. |
| `theme-bootstrap` | Preferencia `theme` de `localStorage` y el botón de tema. | Atributo `data-theme` del documento; los estilos lo consumen. |
| `app-shell` | Estructura HTML fija: botones, buscador/reemplazador del formulario, selector de modo de orden, divisor arrastrable entre formulario/output, textarea de output y su vista previa de solo lectura, switches Jira/Markdown, pestañas globales de `Bloc` y sus controles de tamaño, paneles, botón naranja para plegar todo el panel derecho, entradas de archivos y modal. | Elementos DOM que usan los renderizadores y los controles fijos. |
| `vanilla-config` | Configuración distribuida dentro del propio HTML. | `loadVanillaConfig`, migraciones y la exportación de la herramienta. |
| `script-catalog` | Ninguna; es un índice humano del JavaScript. | Navegación de mantenimiento. |
| `01-constants` | DOM inicial (`document.documentElement`) y valores definidos en el código. | Exportación HTML, persistencia, editores y tiles. |
| `02-utilities` | Texto, fechas y solicitudes de guardado/copia de otros bloques. | Helpers comunes: escape, clonación, IDs, referencias, portapapeles y guardado de archivos. |
| `03-config` | `vanilla-config`, `localStorage` y formatos de configuración antiguos. | Objeto global `config`, `vanilla`, listas migradas y estado de “Config modificada”. |
| `04-schema-helpers` | `config.schema`, `config.data` e instancia activa cuando aplica. | Lectura de formularios/campos y opciones disponibles para formulario, widgets y editores; combina las opciones configuradas del checklist con sus altas locales por instancia. |
| `05-instances-persistence` | Schema, configuración y sesión guardada en `localStorage`, incluidas las preferencias flechas/arrastre, proporción formulario/output y modo de vista previa de output. | Objeto global `state`, instancias coherentes, preferencias, guardado diferido y un `Bloc` global con pestañas; migra las notas por instancia de versiones anteriores, inicializa reloj/fecha con la hora local del equipo, migra las filas de media antiguas a `{ id: mediaN, type }` y conserva altas locales de checklist, fragmentos de output desconectados y rangos de copia parcial. |
| `06-tabs-navigation` | `state`, formularios e instancias. | Pestañas renderizadas y llamadas a formulario, DATA o RULES mediante `refreshAll`; transfiere desde la instancia visible de Bug/Regression los campos editables con el mismo ID y contenido a la pestaña de destino elegida, sin sobrescribir media ni output manual. |
| `07-form-rendering` | Formulario del schema, instancia activa, resultado de reglas, preferencia flechas/arrastre y gestos Pointer Events de escritorio. | DOM y controles de orden correspondientes; compacta las filas de 1/2 y 1/3 excluyendo mirrors fuera de edición, permite añadir y marcar opciones de checklist, y actualiza output, media y persistencia. |
| `08-field-widgets` | Definición del campo, instancia y listas de `config.data`. | Autocomplete, chips y listas dependientes; los chips pueden usar una fuente opcional para autocompletar sin restringir valores libres, se editan por doble clic y, con `kwSpace`, confirman una palabra al pulsar Espacio. |
| `09-schema-editor` | Formularios, secciones, campos, posiciones solicitadas por botones o drag-and-drop y dependencias entre campos. | Arrays `section.fields` reordenados, schema modificado, consistencia de instancias, formulario re-renderizado y persistencia; para chips ofrece pestañas de salida/entrada, modos Unida/Líneas, fuente opcional, separador, plantilla por chip, encabezado y `kwSpace`; valida referencias de plantilla (`{campo}`, `{media:mediaN}`, `{{`/`}}`). |
| `10-validation-rules-tiles` | Campos, filas de media, reglas del formulario, reglas globales, instancia activa y el divisor formulario/output. | Errores de instancia, estado de campos y tiles de la barra superior; las expresiones aceptan `media:mediaN:type` para mostrar/ocultar mirrors según tipo de media, y los selectores de destino incluyen campos `mirror`; controla el divisor con Pointer Events y el repliegue temporal del panel derecho en ventanas estrechas. |
| `11-output-generator` | Schema, valores de la instancia y condiciones evaluadas, más el `Bloc` global y la preferencia de preview. | Texto completo, summary y description con rangos propios de copia; modela rangos provenientes de plantillas para que una edición directa desconecte sólo sus campos, muestra el aviso rojo correspondiente y Regenerar vuelve a conectarlos. Las copias parciales respetan los fragmentos manuales, mientras encabezados/separadores no desconectan campos; ofrece una interpretación visual segura de Jira Wiki Markup o Markdown —incluidos bloques `{code}`/`{code:lenguaje}`— sin modificar el texto canónico, reserva el espacio de la barra cerrada del Bloc y permite renombrar notas con lápiz, doble clic o título numerado reutilizable. |
| `12-media-panel` | Configuración de media, instancia, reglas y valores de campos. | Nombres de media mostrados y filas `media` con ID reutilizable `mediaN`, tipo y `ticketKey`; los IDs se muestran en modo edición para usarlos en plantillas. |
| `13-data-tab` | `config.data` (listas raíz, dependientes, etiquetas y reglas). | DATA renderizada y mutaciones de las listas que consumen campos y widgets. |
| `14-rules-tab` | Schema, reglas globales y tiles configurables. | Editor visual de validaciones, condiciones y tiles; actualiza `config`. |
| `15-csv-io` | Texto de archivos CSV seleccionados y `config`. | `config.data`/`config.schema`, sesiones consistentes y archivos CSV exportados; serializa la configuración de chips (`kwmode`, `kwsep`, `kwperchip`, `kwheader`, `kwspace`), valida las referencias de plantilla y de condiciones de tipo de media, conserva `format` y acepta CSV anteriores. |
| `16-tool-export` | Copia prístina del HTML y `config` actual. | Un `bug_tool.html` autocontenido con la configuración integrada. |
| `17-session-modals-controls` | Archivo de sesión, acciones del usuario y elementos del `app-shell`. | Carga/guardado de sesión, modales, banners y cambios de estado; el selector admite etiquetas y valores distintos para seleccionar de forma segura una instancia de destino. |
| `18-boot` | Configuración embebida, `localStorage`, controles fijos (incluidos buscador/reemplazador, `Bloc`, selector flechas/arrastre, divisor y repliegue del panel derecho) y todos los bloques anteriores. | Aplicación inicializada: migrada, conectada, sincroniza `Bloc` entre ventanas del mismo navegador, preferencias actualizadas, proporción restaurada, salida auto-plegada si la ventana es estrecha y formulario renderizado. |

## Puntos de entrada habituales

- Cambiar datos de mapas, POIs o reglas: `13-data-tab` o `vanilla-config` si debe venir incluido en el archivo distribuido.
- Cambiar campos, secciones o el formato del reporte: `09-schema-editor`, `07-form-rendering` y `11-output-generator`.
- Cambiar validaciones, condiciones o estados visibles: `10-validation-rules-tiles` y `14-rules-tab`.
- Cambiar importación/exportación: `15-csv-io`, `16-tool-export` o `17-session-modals-controls`.
- Cambiar apariencia o la disposición estática: `styles` y `app-shell`.

## Regla de mantenimiento

Antes de editar una sección, revisa las columnas “Recibe información de” y “Envía información a” de su fila. Tras modificar la estructura del schema o de `config.data`, revisa además `03-config`, `04-schema-helpers`, `05-instances-persistence`, `15-csv-io` y `16-tool-export`: son los puntos donde suelen aparecer incompatibilidades de formato.
