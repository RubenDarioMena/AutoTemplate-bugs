# Especificación — Navegación bidireccional Form ↔ Output y provenance semántico

## Bug Report Tool — Refactor Multilanguage

**Archivo base de referencia:** `Bug_tool_2_Refactor_multilanguage(1).html`  
**Objetivo principal:** convertir `SEGMENTS` en el mapa canónico de procedencia del output para habilitar navegación por click entre formulario, `outputTextarea` y preview Jira/Markdown, además de corregir la propiedad semántica de separadores, headings y secciones.

**Revisión de interacción visual:** v2 — Field Focus Lift + Navigation Shockwave + persistent Preview Affected Box.

---

# 0. Resultado esperado

La herramienta debe permitir navegar visualmente entre el formulario y el output sin convertir `outputTextarea` en un editor enriquecido.

La feature tendrá **tres sistemas visuales distintos**:

1. **Field Focus Lift**
   - Estado visual base de un field cuyo control editable tiene focus.
   - Eleva/mueve ligeramente el field.
   - Transición de `0.18s`.
   - No es navegación: confirma dónde está escribiendo el usuario.

2. **Navigation Shockwave**
   - Feedback momentáneo sobre el formulario cuando el usuario hace click sobre output generado en:
     - `outputTextarea`;
     - Jira Preview;
     - Markdown Preview.
   - No depende del focus.
   - Cada theme define su variante visual.
   - Single click en Jira/Markdown = localizar visualmente.
   - Double click en Jira/Markdown = localizar + entrar a editar.

3. **Preview Affected Box**
   - Rectángulo persistente sobre Jira/Markdown Preview que indica qué output será afectado por el field actualmente enfocado.
   - Permanece mientras el input conserve focus.
   - Aparición/desaparición mediante opacidad, aproximadamente `.28s`.
   - `mirror` es la excepción: puede activar esta box mediante hover al no tener input editable propio en uso normal.

Principios:

1. `outputTextarea` **no recibe highlights, overlays, backgrounds, wrappers ni modificaciones visuales** relacionadas con esta feature.
2. `SEGMENTS` se convierte en la fuente de verdad para detachment, provenance, highlighting, navegación y preview.
3. Los `sectionId` deben tener rangos de caracteres propios.
4. Separadores, headings y gaps dejan de ser texto semánticamente huérfano.
5. Las referencias `{campo}` conservan provenance para navegar al **campo referenciado**.
6. La dirección inversa no es simétrica:
   - preview/output → form: `{mode}` navega a `mode`;
   - form `mode` → preview: NO resalta apariciones indirectas de `{mode}` generadas por otros fields.
7. La navegación general se maneja por **click**, no hover.
8. La única excepción intencional de hover son los `mirror`, exclusivamente para Preview Affected Box.

---

# 1. Estado actual relevante

El generador actual ya conserva por field:

```js
{
  fieldId,
  index,
  start,
  end
}
```

y `applyOutputDetachment()` recalcula `start/end` cuando existen overrides manuales del output.

Esto debe conservarse y ampliarse, no reemplazarse.

Actualmente existe un problema conceptual importante: al construir campos unidos, el prefijo/separador se añade antes del texto pero `segment.start` comienza **después del prefix**.

Conceptualmente:

```js
const base = line.text.length + prefix.length;
line.text += prefix + fieldText;

segment.start = base;
```

Esto hace que:

```text
" - "
```

quede fuera del segmento del field que lo introdujo.

Ese comportamiento debe corregirse como parte de esta implementación.

---

# 2. Bug relacionado que debe corregirse

## Síntoma

Con varios fields `mirror` consecutivos y combinaciones como:

- `Continúa en la línea anterior` / `joinPrev`
- `Separador antes del campo` / `sep = " - "`

cuando desaparece el valor original referenciado por el mirror, desaparece el contenido del mirror pero puede permanecer su separador.

Con varios mirrors vacíos consecutivos puede aparecer:

```text
 - - -
```

sin contenido real asociado.

## Causa conceptual

El separador se genera junto al field pero no pertenece al rango semántico de ese field.

El resultado es texto sin propietario.

## Regla nueva

**Todo separador que introduce un field pertenece al field que viene después.**

Ejemplo:

```text
A - B - C
```

Debe representarse conceptualmente como:

```text
[A][ - B][ - C]
```

y no como:

```text
[A][ - ][B][ - ][C]
```

Por tanto, si desaparece `B`:

```text
[A][ - B][ - C]
```

se convierte correctamente en:

```text
[A][ - C]
```

sin separadores huérfanos.

Esta regla aplica tanto a:

- secciones `joined`;
- `joinPrev`;
- separadores personalizados;
- separadores heredados de la sección;
- separador vacío;
- `NONE` / sin separador.

---

# 3. Nuevo modelo de provenance

No crear un segundo sistema paralelo a `segments`.

Ampliar `segments`.

## 3.1 Segmento de field

Baseline recomendada:

```js
{
  fieldId: "cl",
  sectionId: "build",
  index: 0,

  // Rango completo propiedad del field.
  // Incluye el separador/prefix que introduce el field.
  start: 120,
  end: 132,

  // Rango visual del contenido propio.
  // Excluye el separador si no queremos pintarlo en el preview.
  contentStart: 123,
  contentEnd: 132,

  // Provenance interna opcional para placeholders {campo}.
  refs: [
    {
      fieldId: "mode",
      start: 127,
      end: 129
    }
  ]
}
```

### Semántica

`start/end`

- Son el rango estructural completo propiedad del field.
- Se usan para detachment, sustitución y desaparición segura.
- Deben incluir el separador que introduce el field.

`contentStart/contentEnd`

- Representan el contenido visual principal.
- Pueden usarse para que el highlight no cubra necesariamente el separador.
- Si no existe prefix, normalmente coinciden con `start/end`.

`sectionId`

- Identifica la sección generadora.
- Evita tener que buscar posteriormente qué sección contiene el field.

`refs`

- Describe subrangos provenientes de placeholders `{otroCampo}`.
- No cambia quién generó el segmento.
- Sirve específicamente para navegación output/preview → form.

---

# 4. Provenance de `{campo}`

## Regla direccional

Supóngase:

```text
Field: notes
Template: "Mode used: {mode}"
```

y el output:

```text
Mode used: MP
```

### Click preview/output → form

Si el usuario hace click específicamente sobre:

```text
MP
```

debe navegar al field:

```text
mode
```

NO al field:

```text
notes
```

Si hace click sobre:

```text
Mode used:
```

debe navegar al field generador:

```text
notes
```

## Dirección inversa: form → preview

Click en el input `mode`:

- resalta únicamente los segmentos cuyo **generador real** es `mode`;
- NO resalta las apariciones indirectas de `{mode}` generadas por `notes`, `media`, etc.

Esto evita que un field pueda iluminar decenas de referencias indirectas y mantiene el feedback visual claro.

## Consecuencia técnica

La interpolación debe poder devolver no sólo texto, sino metadata de offsets para referencias.

Ejemplo conceptual:

```js
{
  text: "Mode used: MP",
  refs: [
    {
      fieldId: "mode",
      start: 11,
      end: 13
    }
  ]
}
```

Estos offsets son relativos al texto interpolado y posteriormente se convierten a offsets absolutos del output.

---

# 5. Rangos de sección

Añadir un mapa canónico:

```js
sectionRanges = {
  resumen: {
    sectionId: "resumen",
    start: 0,
    end: 118
  },

  build: {
    sectionId: "build",
    start: 205,
    end: 392
  }
}
```

## Qué debe incluir una sección

El rango de sección debe cubrir:

- `heading`;
- fields;
- separadores internos;
- líneas generadas por fields;
- salto/gap final de sección cuando corresponda.

### Regla recomendada para gap entre secciones

El gap que separa dos bloques pertenece a la **sección anterior**.

Así una sección representa todo el bloque textual que produce, incluyendo el espacio que necesita para separarse de la siguiente.

`noGap` naturalmente elimina dicho rango extra.

## No permitir texto huérfano

Tras este refactor, idealmente todo carácter generado automáticamente debe pertenecer al menos a:

- un `sectionRange`;

y cuando procede de un field:

- también a un `segment`.

Puede existir texto editable manualmente fuera de fields, pero no texto generado automáticamente sin provenance estructural.

---

# 6. Relación de ownership

Modelo conceptual:

```text
OUTPUT
└── SECTION
    ├── heading
    ├── FIELD SEGMENT
    │   ├── prefix/separator
    │   ├── content
    │   └── refs {campo}
    ├── FIELD SEGMENT
    └── gap
```

Un carácter puede pertenecer:

- sólo a una sección;
- a una sección + field;
- a una sección + field generador + referencia `{campo}`.

Cuando hay más de una posible navegación, usar la entidad más específica:

```text
ref {campo} > field generador > section
```

---

# 7. API interna recomendada

Centralizar la lógica en helpers y evitar queries/event handlers duplicados.

Baseline conceptual:

```js
function outputSegmentAtOffset(offset, chunks) {}
function outputSectionAtOffset(offset, chunks) {}
function outputReferenceAtOffset(offset, segment) {}

function outputTargetAtOffset(offset, chunks) {}
function outputTargetFromPreviewNode(node) {}

function formFieldElement(fieldId) {}
function formSectionElement(sectionId) {}

function navigateToFormField(fieldId, options) {}
function navigateToFormSection(sectionId, options) {}

function highlightPreviewField(fieldId) {}
function highlightPreviewSection(sectionId) {}
function clearPreviewHighlight() {}

function triggerFormNavigationPulse(element) {}
```

`outputTargetAtOffset()` debe devolver algo semejante a:

```js
{
  kind: "field",
  fieldId: "mode",
  sectionId: "notes",
  viaReference: true
}
```

o:

```js
{
  kind: "section",
  sectionId: "build"
}
```

---

# 8. Click en `outputTextarea` → formulario

## Requisito principal

`outputTextarea` nunca cambia visualmente por esta feature.

No añadir:

- overlay;
- `<mark>`;
- mirror layer;
- syntax highlighting;
- selection programática;
- cambio de background;
- wrappers;
- decoraciones por offsets.

## Comportamiento

Al hacer click dentro del textarea:

1. Dejar el cursor exactamente donde el usuario hizo click.
2. Leer `outputTextarea.selectionStart`.
3. Resolver provenance para ese offset.
4. Mantener el foco en `outputTextarea`.
5. Hacer scroll del formulario hacia el destino.
6. Ejecutar animación breve sobre el field o sección destino.
7. NO llamar `.focus()` sobre el control del formulario.
8. NO cambiar `selectionStart`/`selectionEnd`.

Esto permite que el usuario use el click como navegación contextual sin perder la intención de seguir escribiendo en el output manual.

## Prioridad de resolución

Para un offset:

```text
{campo} ref > field segment > section range > sin acción
```

## Separadores

Como el separador pertenece al field siguiente:

click sobre:

```text
" - "
```

debe navegar al field que ese separador introduce.

## Heading

Click sobre un heading de sección debe navegar a la sección.

No es obligatorio seleccionar/focalizar un field concreto dentro de ella.

---

# 9. Click en Jira/Markdown Preview → formulario

Jira Preview y Markdown Preview son read-only, pero se distinguen dos niveles de intención:

```text
single click  = localizar
double click  = localizar + editar
```

## 9.1 Single click

1. Resolver target semántico con precedencia:
   ```text
   {campo} ref > field generador > section
   ```
2. Hacer scroll del formulario al destino visible.
3. Disparar `Navigation Shockwave`.
4. **No llevar focus al input.**
5. No cambiar ningún cursor de escritura.

El single click es inspección/navegación visual.

## 9.2 Double click

1. Ejecutar la misma navegación del single click.
2. Disparar/reiniciar el shockwave.
3. Resolver el control editable principal.
4. Llevar focus al control.
5. Dejarlo listo para edición.

Controles principales:

- text → input;
- textarea → textarea;
- autocomplete → input;
- keywords → input de keywords;
- checklist → control razonable según implementación;
- checkbox → checkbox;
- clock/date read-only → sólo navegación + shockwave;
- mirror → source editable cuando corresponda.

## 9.3 `{campo}`

Click sobre el subrango de `{mode}`:

```text
single click → mode + shockwave
double click → mode + shockwave + focus
```

Click fuera de ese subrango, dentro del template, sigue apuntando al field generador.

## 9.4 Heading/sección

Single click:

- scroll a sección;
- shockwave de sección;
- sin focus.

Double click sobre heading no debe inventar arbitrariamente un primer field editable.

---

# 10. Focus del formulario → Jira/Markdown Preview

La Preview Affected Box representa una relación distinta al shockwave:

```text
Shockwave    = “este output me llevó a este field”
Affected Box = “este field está afectando este output”
```

## 10.1 Trigger normal

La box se activa por **focus real** del control editable, llegue por:

- click;
- double click desde Jira/Markdown;
- Tab/teclado;
- navegación legítima que coloque focus.

Mientras exista focus, los segmentos generados directamente por ese field permanecen resaltados.

Al perder focus, la box desaparece con transición de opacidad.

## 10.2 Plain mode

Si Preview está en Plain:

- no modificar visualmente `outputTextarea`;
- no crear overlay;
- no activar automáticamente Jira/Markdown;
- el Field Focus Lift del formulario sigue funcionando.

## 10.3 Jira / Markdown

Resaltar sólo segmentos cuyo **field generador** sea el field enfocado.

No resaltar referencias indirectas `{campo}` generadas por otros fields.

Ejemplo:

```text
notes template = "Mode: {mode}"
```

Focus en `mode`:

- resalta output generado directamente por `mode`;
- NO resalta `Mode: MP` generado por `notes`.

## 10.4 Apariencia de Preview Affected Box

Debe:

- envolver el texto/template generado;
- tener esquinas redondeadas;
- borde bien definido y brillante;
- background mucho más suave de la misma familia;
- persistir mientras dure el focus;
- no usar shockwave;
- no escalar ni mover contenido;
- animar sólo opacidad.

Baseline:

```css
.output-preview .output-field-affected {
  border-radius: 5px;
  box-shadow: 0 0 0 1px var(--preview-field-ring);
  background: var(--preview-field-soft);
  opacity: 1;
  transition: opacity .28s ease;
}

.output-preview .output-field-affected.is-leaving {
  opacity: 0;
}
```

## 10.5 Color

Preferencia:

1. familia cromática del tipo de field;
2. fallback a tokens globales.

```text
text         → blue
textarea     → cyan
autocomplete → violet
keywords     → pink
checkbox     → amber
checklist    → green
mirror       → slate
clock        → cyan
date         → violet
```

Definir tokens equivalentes a:

```css
--preview-field-ring
--preview-field-soft
```

sin duplicar hardcodes.

## 10.6 Múltiples segmentos

Si un field genera varios segmentos:

- box en todos mientras exista focus;
- navegación explícita puede hacer scroll al primero;
- focus normal no debe causar autoscroll agresivo constantemente.

## 10.7 Mirrors

Los mirrors son la excepción deliberada.

Como normalmente no ofrecen input editable propio:

- hover sobre mirror visible activa Preview Affected Box;
- mouseleave la retira con `.28s`;
- sólo funciona mientras el mirror esté renderizado;
- hover NO navega;
- hover NO dispara shockwave.

La box representa output generado por el mirror; navegación desde preview puede apuntar al source editable según provenance.

---

# 11. Render semántico del Preview

`renderOutputPreview(text)` actualmente procesa el texto en líneas y genera DOM Jira/Markdown.

Debe ampliarse para conservar provenance.

No buscar strings por contenido.

No usar coincidencias de texto como:

```js
preview.innerText.indexOf(value)
```

porque:

- los valores pueden repetirse;
- Jira/Markdown transforma markup;
- un mismo field puede producir varias partes;
- `{campo}` puede repetir valores de otros fields.

## Objetivo

El DOM final debe contener metadata navegable.

Ejemplos conceptuales:

```html
<span
  data-output-field="cl"
  data-output-section="build">
  CL: 123456
</span>
```

y para referencias:

```html
<span data-output-field="notes" data-output-section="notas">
  Mode used:
  <span data-output-ref-field="mode">MP</span>
</span>
```

Los wrappers exactos pueden variar para no romper el parser Jira/Markdown.

## Importante

No invalidar estructuras:

- `<ul>`;
- `<ol>`;
- `<li>`;
- `<strong>`;
- `<em>`;
- `<code>`;
- `<pre>`;
- links Jira/Markdown.

La metadata puede aplicarse a wrappers auxiliares o nodos existentes según sea más seguro.

---

# 12. Feedback visual del formulario

El formulario tendrá dos estados visuales independientes:

```text
A. Field Focus Lift      → persistente mientras existe focus
B. Navigation Shockwave → momentáneo al navegar desde output
```

Pueden coincidir, pero no son la misma animación.

## 12.1 Field Focus Lift — styles base

Todos los themes heredan un feedback base al escribir.

Debe ser más contenido que Neon:

- elevación/movimiento pequeño;
- transición `.18s`;
- sombra/borde ligeramente reforzado;
- sin ondas;
- sin flashes;
- sin cambio brusco de tamaño.

Baseline:

```css
#formPanel .field {
  transition:
    transform .18s ease,
    box-shadow .18s ease,
    border-color .18s ease,
    background-color .18s ease;
}

#formPanel .field:focus-within {
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, .10);
}
```

Se permite un `scale()` casi imperceptible (`1.003–1.006`) si no perjudica dropdowns/layout.

El input conserva su focus ring actual.

### Restricciones

- sin relayout significativo;
- sin desplazar vecinos;
- no crear stacking context problemático;
- `.invalid` mantiene prioridad visual.

## 12.2 Navigation Shockwave

Aparece cuando output → form resuelve un destino mediante:

- click en `outputTextarea`;
- single click Jira;
- single click Markdown;
- double click Jira/Markdown antes de entrar a editar.

Debe poder dispararse sin focus.

Clase conceptual:

```css
.field.navigation-shockwave::after
```

El agente puede reutilizar geometría/timing de `neonFieldShockRing`, pero los colores deben venir de tokens por theme.

## 12.3 Tokens por theme

Definir, por ejemplo:

```css
--nav-shock-ring;
--nav-shock-glow;
```

### Light

Violeta extremadamente oscuro, casi negro:

```css
--nav-shock-ring: rgba(46, 30, 58, .82);
--nav-shock-glow: rgba(73, 45, 92, .28);
```

### Autumn

Misma familia, ligeramente más profunda para separarse de los tonos cálidos:

```css
--nav-shock-ring: rgba(40, 24, 52, .86);
--nav-shock-glow: rgba(66, 39, 84, .30);
```

### Dark

Dorado brillante:

```css
--nav-shock-ring: rgba(255, 205, 82, .95);
--nav-shock-glow: rgba(255, 183, 38, .38);
```

### Neon

Mantener la identidad visual actual de `neonFieldShockRing`.

## 12.4 Geometría/timing

Debe:

- nacer alrededor del field/section;
- expandirse hacia afuera;
- perder opacidad;
- no modificar layout;
- no bloquear pointer events;
- reiniciarse en clicks consecutivos.

Baseline conceptual:

```css
@keyframes fieldNavigationShockwave {
  0% {
    opacity: .95;
    transform: scale(.97);
    box-shadow: 0 0 0 0 var(--nav-shock-ring);
  }
  65% {
    opacity: .55;
    transform: scale(1.015);
    box-shadow:
      0 0 0 5px var(--nav-shock-ring),
      0 0 18px 3px var(--nav-shock-glow);
  }
  100% {
    opacity: 0;
    transform: scale(1.035);
    box-shadow:
      0 0 0 9px transparent,
      0 0 24px 7px transparent;
  }
}
```

Los valores exactos pueden ajustarse visualmente.

## 12.5 Navegación y focus

### Desde `outputTextarea`

- scroll;
- shockwave;
- mantener focus/cursor en textarea.

### Jira/Markdown single click

- scroll;
- shockwave;
- sin focus al input.

### Jira/Markdown double click

- scroll;
- shockwave;
- después focus al editable.

## 12.6 Reinicio

Clicks repetidos reinician la animación.

```js
el.classList.remove("navigation-shockwave");
void el.offsetWidth;
el.classList.add("navigation-shockwave");
```

Web Animations API también es válida.

## 12.7 Reduced motion

Con `prefers-reduced-motion`:

- shockwave → ring/outline breve con fade;
- Focus Lift → sombra/borde sin translate notable.

---

# 13. Secciones ocultas y fields hidden

## Regla principal

Un elemento con `display: none` no mostrará una animación visible aunque reciba una clase.

Por tanto no existe riesgo de que un hidden field “brille” fuera del modo edición si continúa realmente fuera del layout.

## Comportamiento esperado

### Fuera de modo edición

Si el destino está oculto y no tiene representación visual:

- no forzar su aparición;
- no cambiar temporalmente reglas `hidden`;
- no abrir automáticamente modo edición;
- opcionalmente navegar a su sección si ésta es visible;
- si no hay destino visual razonable, no hacer nada.

### En modo edición

Si el field hidden/mirror sí se renderiza:

- puede recibir scroll;
- puede recibir pulse;
- puede ser destino normal de navegación.

## Sección colapsada

Si el field existe pero su sección está colapsada, recomendación:

1. expandir la sección;
2. esperar al siguiente frame;
3. scroll al field;
4. disparar pulse.

Esto es navegación dentro de contenido existente, no cambio de schema ni estado persistente obligatorio.

Decidir si el estado de colapso restaurado debe persistirse según el comportamiento actual de la tool.

---

# 14. Mirrors

Los mirror fields requieren dos conceptos diferentes:

## Generator ownership

El segmento generado por un `mirror` sigue perteneciendo al mirror como field generador:

```text
generatedByFieldId = mirrorFieldId
```

## Navegación por valor referenciado

Si el contenido del mirror semánticamente proviene de su `source`, la navegación desde el valor visible debe poder apuntar al source real cuando el objetivo de la interacción sea modificar ese dato.

Recomendación:

- registrar la parte de valor del mirror como `ref` al `field.source`;
- mantener heading/template/separador bajo ownership del mirror.

Así:

```text
"* CCS/FFOTD: 123"
```

puede resolver:

- click en `123` → `ccs`;
- click en `CCS/FFOTD:` → mirror field si visible, o fallback al source si el mirror no es visible.

Como los mirrors suelen estar ocultos fuera de edición, para UX normal el source real es el destino útil.

---

# 15. Detachment y edición manual del output

La feature no debe romper el sistema actual de overrides manuales.

`applyOutputDetachment()` debe actualizar también:

- `contentStart/contentEnd`;
- refs internas;
- `sectionRanges`.

No basta con recalcular únicamente `segment.start/end`.

## Transformación de offsets

Al reemplazar un segmento por texto manual:

- offsets posteriores deben trasladarse;
- rango de sección debe trasladarse;
- refs internas del segmento sólo pueden conservarse si siguen siendo válidas.

### Regla segura para refs tras edición manual

Si un segmento fue modificado manualmente y ya no existe garantía de que el placeholder referenciado conserve la misma posición:

- invalidar `refs` de ese segmento manual;
- mantener ownership del field para el rango completo.

No intentar reconocer el valor referenciado mediante búsqueda textual.

Así:

```text
preview/output → field generador
```

sigue funcionando, aunque la navegación fina `{campo}` se desactive dentro de un fragmento manualmente detached.

---

# 16. Legacy manual output

Si la instancia está en modo legacy completamente desconectado y no posee provenance fiable:

- no inventar mapping;
- clicks en `outputTextarea` no navegan;
- preview no debe afirmar relaciones inexistentes;
- mantener el badge actual de output desconectado.

No usar heurísticas por texto.

---

# 17. Corrección del ownership de prefixes

Modificar las rutas que actualmente hacen algo equivalente a:

```js
const base = line.text.length + prefix.length;
line.text += prefix + fieldText;
segment.start = base;
```

a un modelo equivalente a:

```js
const segmentStart = line.text.length;
const contentStart = segmentStart + prefix.length;

line.text += prefix + fieldText;

segment.start = segmentStart;
segment.contentStart = contentStart;
segment.end = line.text.length;
segment.contentEnd = line.text.length;
```

La implementación exacta debe contemplar:

- arrays/perLine;
- headers internos;
- checklists;
- keywords;
- `joinPrev`;
- joined sections;
- múltiples entries del mismo field.

## Headers internos de field

Si un field genera un header propio antes de sus entradas, decidir explícitamente si ese header pertenece al field.

Recomendación:

**sí pertenece al field**, porque desaparece junto con él.

Esto incluye:

- `perLineHeader`;
- checklist title generado por el field;
- keyword header generado por el field.

Los headings de sección pertenecen a `sectionRanges`, no a un field.

---

# 18. `sectionRanges` y detachment

`buildOutput()` debe devolver:

```js
{
  full,
  summary,
  description,
  segments,
  ranges,
  sectionRanges
}
```

`applyOutputDetachment()` debe devolver la misma estructura actualizada.

No perder `sectionRanges` al aplicar detached fields.

## Rango recomendado

```js
sectionRanges[sectionId] = {
  start,
  end
}
```

Si posteriormente resulta útil añadir metadata:

```js
{
  sectionId,
  start,
  end,
  contentStart,
  contentEnd
}
```

pero evitar sobre-modelar si no se usa.

---

# 19. Estado efímero

No persistir:

- field actualmente resaltado;
- sección actualmente resaltada;
- último target de navegación;
- timers de animación.

La feature es UI efímera.

No modificar:

- schema;
- `bug_fields.csv`;
- `bug_data.csv`;
- session format;
- vanilla config;

salvo que una necesidad real aparezca durante implementación.

`segments`/`sectionRanges` son derivados del output y no requieren persistencia propia.

---

# 20. Integración con I18N

La lógica de navegación no debe depender de labels traducidos.

Siempre usar IDs estables:

```text
fieldId
sectionId
```

No buscar:

```text
"Información de compilación"
"Build information"
```

para resolver destinos.

Sólo añadir traducciones si aparece texto visible nuevo, por ejemplo:

- hint;
- tooltip;
- mensaje de destino no disponible.

Las animaciones/highlights no requieren strings.

---

# 21. Accesibilidad

Respetar:

```css
@media (prefers-reduced-motion: reduce)
```

Para navegación:

- mantener un outline/highlight breve;
- desactivar expansión/onda animada intensa.

El click del preview que lleva foco a un control debe ser coherente con navegación por teclado si en el futuro se hacen los spans accesibles.

Si elementos del preview se vuelven clickeables:

- usar cursor apropiado;
- considerar `tabindex="0"` sólo si también se implementa Enter/Space;
- no fingir semántica de botón sin soporte de teclado.

---

# 22. Eventos

## Form

Usar delegación sobre `#formPanel`.

### Focus normal

`focusin` / `focusout` controlan:

- Field Focus Lift (`:focus-within` o clase);
- Preview Affected Box del field generador.

La box representa focus real, no sólo click.

### Mirror

Usar `pointerenter` / `pointerleave` o equivalente exclusivamente para mirrors visibles para activar/desactivar Preview Affected Box.

No usar hover para navegación general.

### Controles de edición

Clicks en drag/delete/move/schema/add no deben interpretarse como intención de navegación del contenido.

## outputTextarea

Listener `click`:

```text
resolver offset → scroll form → shockwave
```

Nunca:

- selection programática;
- focus al form;
- cambios visuales al textarea.

## Jira/Markdown Preview

Listener delegado.

### `click`

```text
resolver target → scroll form → shockwave
```

sin focus.

### `dblclick`

```text
resolver target → scroll form → shockwave → focus editable
```

Precedencia:

```text
data-output-ref-field
> data-output-field
> data-output-section
```

Gestionar correctamente coexistencia `click` + `dblclick`. Es aceptable que el primer click del doble click dispare el shockwave y `dblclick` lo reinicie.

---

# 23. Scroll

## OutputTextarea → form

- mantener focus;
- scroll suave;
- shockwave;
- no modificar cursor/selection.

## Jira/Markdown single click → form

- scroll suave;
- shockwave;
- no focus.

## Jira/Markdown double click → form

- scroll suave;
- shockwave;
- focus al editable cuando exista.

## Form focus → preview

La Preview Affected Box se activa siempre que Jira/Markdown esté visible.

Autoscroll del preview:

- permitido si el focus viene de navegación explícita;
- evitarlo como obligación en cada Tab/click normal para que ambos paneles no “persigan” continuamente al usuario.

Múltiples segmentos:

- box en todos;
- navegación explícita puede mostrar el primero.

---

# 24. Feedback de sección

Mantener soporte de navegación a nivel sección.

## Output → sección

Si click cae en:

- heading;
- gap;
- texto propiedad de sección sin field;

el destino es la sección del formulario.

Aplicar:

- scroll a `.form-section`;
- Navigation Shockwave de sección.

La onda de sección puede ser algo más amplia y menos intensa.

## Form → preview

No existe un “focus de sección” equivalente a un input.

Preview Affected Box permanece a nivel field.

No boxed persistente de toda la sección sólo porque un input interno tenga focus.

---

# 25. Reglas de precedencia visual

Prioridad visual:

```text
error / rule flag
> navigation shockwave momentáneo
> focus lift
> identidad visual por tipo
```

## Form

Un field inválido conserva borde/danger ring/mensaje.

Focus Lift puede elevarlo sin reemplazar error.

Shockwave debe vivir exteriormente, idealmente en pseudo-elemento.

## Preview

Preview Affected Box:

- no altera layout;
- no tapa links/code/list markers;
- preserva clicks;
- sólo anima opacidad.

## Stacking

Verificar:

- autocomplete;
- dropdowns;
- drag ghost;
- modals;
- tooltips.

Shockwave/Focus Lift no deben reintroducir el bug de dropdown observado con efectos Neon.

---

# 26. Complejidad y límites

No implementar:

- rich textarea;
- overlay del textarea;
- syntax highlighter para plain;
- búsqueda heurística por strings;
- provenance recursiva ilimitada;
- modificación visual permanente del output;
- autoscroll por hover;
- cambio de focus desde textarea;
- persistencia de highlight.

Mantener el cambio centrado en:

```text
styles
07-form-rendering
11-output-generator
preview renderer
event wiring / boot si hace falta
```

Actualizar `Directorio-Monolito.MD` si cambian responsabilidades estructurales o se añade un bloque funcional nuevo.

---

# 27. Orden de implementación recomendado

## Fase A — Provenance estructural

1. Añadir `sectionId` a segments.
2. Hacer que prefixes/separadores pertenezcan al field siguiente.
3. Añadir `contentStart/contentEnd`.
4. Añadir `sectionRanges`.
5. Garantizar que headings y gaps queden cubiertos por la sección.
6. Corregir el bug ` - - - `.
7. Adaptar detachment y offsets.

No implementar UI hasta pasar tests de output.

## Fase B — Provenance de `{campo}`

1. Hacer que interpolación devuelva refs con offsets.
2. Propagar refs al segmento.
3. Añadir mirrors/source como refs cuando corresponda.
4. Invalidar refs de segmentos manualmente detached cuando no sean fiables.

## Fase C — Navegación textarea → form

1. Resolver offset desde `selectionStart`.
2. Aplicar precedencia ref > field > section.
3. Scroll sin robar foco.
4. Añadir pulse de destino.

## Fase D — Preview semántico

1. Renderizar Jira/Markdown preservando metadata.
2. Single click → scroll + shockwave.
3. Double click → scroll + shockwave + focus.
4. Validar listas, inline markup, code y links.

## Fase E — Focus → Preview Affected Box

1. Detectar `focusin/focusout`.
2. Buscar segments generados por el field.
3. Box persistente mientras dure focus.
4. Fade `.28s`.
5. No incluir referencias indirectas.
6. Excepción mirror hover → box.

## Fase F — Polish visual

1. Field Focus Lift base `.18s`.
2. Light shockwave negro-violeta.
3. Autumn shockwave negro-violeta.
4. Dark shockwave dorado brillante.
5. Neon conserva `neonFieldShockRing`.
6. Preview Affected Box por tipo/fallback.
7. `prefers-reduced-motion`.
8. Verificar dropdown/autocomplete stacking.

---

# 28. Casos de prueba obligatorios

## A. Separadores

- [ ] Joined: A, B, C con `sep = " - "`.
- [ ] Vaciar B elimina ` - B`, no deja ` - `.
- [ ] Vaciar B y C no deja ` - - `.
- [ ] `joinPrev` con sep personalizado.
- [ ] Tres mirrors consecutivos.
- [ ] Mirror source pasa de valor → vacío.
- [ ] Mirror source pasa de vacío → valor.
- [ ] Campo con `omitValue`.
- [ ] Campo hidden por regla.
- [ ] `sep=""`.
- [ ] separador heredado de sección.

## B. Section ranges

- [ ] Heading está dentro de sectionRange.
- [ ] Todos los fields de la sección están dentro.
- [ ] Gap final pertenece a la sección anterior.
- [ ] `noGap` no agrega rango artificial.
- [ ] Sección vacía no produce rango incorrecto.
- [ ] Summary/description ranges siguen correctos.

## C. Plain textarea

- [ ] Click sobre contenido de field navega al field.
- [ ] Cursor permanece en textarea.
- [ ] selectionStart no cambia.
- [ ] Click sobre separador navega al field siguiente + shockwave, sin focus.
- [ ] Click sobre heading navega a sección.
- [ ] Click sobre `{mode}` navega a `mode`.
- [ ] Legacy manual output no inventa navegación.
- [ ] Detached field sigue navegando al generador si el rango es fiable.

## D. Preview

- [ ] Jira normal.
- [ ] Markdown normal.
- [ ] Bold/italic/underline.
- [ ] Links.
- [ ] Listas.
- [ ] Code inline.
- [ ] Jira code block.
- [ ] PerLine.
- [ ] Checklist newline.
- [ ] Keywords newline.
- [ ] Single click `{campo}` navega al referenciado + shockwave, sin focus.
- [ ] Double click `{campo}` navega al referenciado + shockwave + focus.
- [ ] Single click sobre texto de template navega al generador sin focus.
- [ ] Double click sobre texto de template navega al generador y enfoca.
- [ ] Click sobre heading navega a sección sin inventar un field.

## E. Focus → Preview

- [ ] Focus text mantiene box hasta blur.
- [ ] Focus textarea mantiene box hasta blur.
- [ ] Focus autocomplete mantiene box hasta blur.
- [ ] Focus keywords mantiene box hasta blur.
- [ ] Focus checklist mantiene box hasta blur.
- [ ] Focus checkbox sin output no crea box falsa.
- [ ] Field con múltiples segmentos muestra box en todos.
- [ ] Field vacío no produce box.
- [ ] `{campo}` indirecto NO se resalta desde el field referenciado.
- [ ] Preview Plain no cambia visualmente.
- [ ] Fade de box ≈ `.28s`.
- [ ] Mirror visible activa box por hover.
- [ ] Mirror mouseleave retira box.
- [ ] Hover de field normal NO activa navegación ni box.

## F. Hidden/collapsed

- [ ] Hidden field fuera de edit mode no muestra animación imposible.
- [ ] Hidden field en edit mode sí puede ser destino.
- [ ] Sección colapsada se expande correctamente si se decide aplicar esa regla.
- [ ] Pulse ocurre después de que el destino sea visible.

## G. Themes / visual

- [ ] Focus Lift base funciona en Light.
- [ ] Focus Lift base funciona en Dark.
- [ ] Focus Lift base funciona en Autumn.
- [ ] Focus Lift no compite con Neon.
- [ ] Transición Focus Lift ≈ `.18s`.
- [ ] Light shockwave negro-violeta.
- [ ] Autumn shockwave negro-violeta.
- [ ] Dark shockwave dorado brillante.
- [ ] Neon conserva `neonFieldShockRing`.
- [ ] Repeated click reinicia shockwave.
- [ ] Single click preview no roba focus.
- [ ] Double click preview sí lleva focus.
- [ ] Neon autocomplete/dropdown no queda detrás de otros fields.
- [ ] Reduced motion.

## H. Regresiones

- [ ] Detachment sigue funcionando.
- [ ] Edición manual del output sigue funcionando.
- [ ] Copy Full.
- [ ] Copy Summary.
- [ ] Copy Description.
- [ ] Cambiar Jira ↔ Markdown ↔ Plain.
- [ ] Session reload.
- [ ] Export tool.
- [ ] Bug.
- [ ] Regression.
- [ ] Cambiar idioma no rompe IDs ni mappings.

---

# 29. Invariantes

```text
1. El textarea sigue siendo normal y nunca recibe decoración visual.
2. Click en textarea: navegación + shockwave; nunca roba focus.
3. Single click Jira/Markdown: navegación + shockwave; no focus.
4. Double click Jira/Markdown: navegación + shockwave + focus editable.
5. Focus real en input: Field Focus Lift + Preview Affected Box.
6. Affected Box persiste mientras corresponda el focus.
7. Mirror visible: hover puede sustituir focus sólo para Affected Box.
8. Separador-before-field pertenece al field siguiente.
9. Todo segmento conoce su sectionId.
10. Todo bloque generado conoce su sectionRange.
11. {campo} conserva provenance del campo referenciado.
12. Form → preview sólo sigue ownership de generación.
13. Preview/output → form usa la referencia más específica disponible.
14. No se usa búsqueda textual heurística.
15. No se persiste estado efímero de highlight/shockwave/focus.
16. El output textual final sólo cambia para corregir bugs reales como separadores huérfanos.
```

---

# 30. Definición de terminado

La feature está terminada cuando:

- el bug de separadores/mirrors consecutivos está corregido;
- `segments` incluye ownership suficiente de prefix y section;
- existen `sectionRanges`;
- `{campo}` permite navegación al field referenciado;
- click en `outputTextarea` navega con shockwave sin cambiar visualmente el textarea ni robar focus;
- single click en Jira/Markdown navega con shockwave sin enfocar el field;
- double click en Jira/Markdown navega con shockwave y entra a editar;
- focus en un control del form activa Field Focus Lift `.18s`;
- focus mantiene Preview Affected Box durante todo el focus;
- mirror visible puede activar Preview Affected Box mediante hover;
- Preview Affected Box usa fade aproximado `.28s`;
- Light y Autumn usan shockwave negro-violeta contrastante;
- Dark usa shockwave dorado brillante;
- Neon reutiliza `neonFieldShockRing` sin depender del focus;
- hidden fields no aparecen sólo para mostrar animación;
- detachment y edición manual siguen funcionando;
- no se introducen cambios de schema/CSV/session innecesarios;
- `Directorio-Monolito.MD` queda actualizado si la responsabilidad de `11-output-generator` o el preview cambia formalmente.

---

# 31. Nota para el agente implementador

Antes de modificar código, inspeccionar la versión real disponible en terminal, porque puede contener cambios posteriores al archivo base analizado, especialmente los themes `autumn`/`neon` y sus overrides.

No copiar ciegamente snippets de esta especificación.

Usar esta especificación como contrato de comportamiento y adaptar la implementación a la estructura real más reciente del monolito.

Priorizar primero el modelo de provenance y las pruebas del output. La UI debe construirse encima de ese modelo, no al revés.
