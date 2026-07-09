# Plan de Acción — Issues y Propuestas

> Ordenado de **más fácil** a **más difícil**.
> Criterios: dificultad de implementación, riesgo de romper configs
> existentes, y cantidad de código a reescribir.
> Separado en **Issues** (bugs) y **Propuestas** (features), salvo
> cuando la propuesta es la solución a un issue.

---

## ⓘ Nota: ¿Dónde vive la lógica de keywords overlap?

**No es un issue ni una propuesta — es una pregunta.** La lógica está en
`revalidate()` (líneas 3175–3177 de `bug_tool.html`):

```js
else if (field.kwOverlap) {
  const conflict = arr.find(k =>
    bodyText.includes(k.toLowerCase()));
  if (conflict)
    inst.errors[field.id] = `«${conflict}» aparece en el cuerpo del bug`;
}
```

Es una propiedad **por campo** (`kwOverlap: true` en el schema del
campo), no algo global. Si borras el campo de keywords y lo recreas,
solo necesitas marcar el checkbox **"Chips: prohibir que aparezcan en
el cuerpo del bug"** en el editor de campo. No viene con todos los
chips por defecto — es opcional por campo.

---

## Nivel 1 — Sencillo (poco código, bajo riesgo, sin migración)

### 1-A · [ISSUE] Click molesto: el modal se cierra al soltar el click fuera

**Problema:** Al seleccionar texto dentro del editor de campos, si se
suelta el click izquierdo sobre el backdrop (área gris), el modal se
cierra y se pierden los cambios. El listener actual (línea 5258):
```js
$("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});
```

**Causa raíz:** El `mouseup` del drag de selección termina sobre el
backdrop y el navegador lo interpreta como un `click` en `#modal`.

**Plan:**
1. Reemplazar el listener de `click` en el backdrop por `dblclick`:
   ```js
   $("modal").addEventListener("dblclick", (e) => {
     if (e.target.id === "modal") closeModal();
   });
   ```
2. Ya existe `Escape` → `closeModal()` (línea 5262) y botones de
   cancelar/guardar → `closeModal()`. **No se pierde ninguna vía de
   cierre legítima.**
3. Verificar que el modal de confirmación simple (`showConfirmModal`)
   también use `dblclick` en lugar de `click`.
4. Opcional: añadir un texto discreto "Doble click fuera para cerrar"
   en el footer del modal o como `title` del backdrop.

**Código a cambiar:** ~4 líneas (2 listeners).
**Riesgo:** Mínimo — solo cambia el gesto de cierre, no la lógica.
**Migración:** Ninguna.

---

### 1-B · [PROPUESTA] Mostrar el keybind (field.id) en el editor de campos

**Problema:** El `data-bind` y `data-field` usan `field.id` (un slug
generado desde la etiqueta al crear el campo). Si el usuario cambia la
etiqueta, el ID no cambia — pero el usuario no tiene forma de ver el
ID que sí funciona en las condiciones (`campo_de_vision notEmpty`).

**Decisión del usuario:** Opción 3 — mostrar el keybind como un campo
**fijo e inmutable** dentro del editor. Se sigue generando desde la
etiqueta al crear, pero queda visible para referencia.

**Plan:**
1. En `showFieldEditor()` (línea ~2725), añadir un campo de solo
   lectura justo debajo de "Etiqueta":
   ```html
   <div>
     <label>ID interno (keybind)</label>
     <input type="text" id="fe_id" value="${escapeHtml(f.id || '(se generará)')}"
            readonly style="opacity:.6;cursor:default" />
     <div class="field-help">Se usa en condiciones de RULES.
       Se genera automáticamente desde la etiqueta y no se puede cambiar.</div>
   </div>
   ```
2. Para campos nuevos (`isNew`), el ID se genera al confirmar (línea
   2842: `uniqueFieldId(form, slugify(label))`). El campo `fe_id` debe
   actualizarse en vivo cuando el usuario escribe la etiqueta:
   ```js
   // en onOpen(), después de fillSources():
   $("fe_label").addEventListener("input", () => {
     $("fe_id").value = slugify($("fe_label").value) || "(se generará)";
   });
   ```
3. El campo **no se envía** en `onConfirm` — el ID ya se asigna en
   la línea 2842 para campos nuevos y no se toca para existentes.

**Código a agregar:** ~10 líneas de HTML + ~5 líneas de JS.
**Riesgo:** Cero — solo visual. No cambia la lógica de generación.
**Migración:** Ninguna.

---

### 1-C · [ISSUE] Campo inexistente en condición se evalúa como TRUE

**Problema:** Escribir `[campo que no existe] empty` en
"Condiciones entre campos" se evalúa como `true` (el campo "está
vacío" porque no existe → su valor es `undefined` → `!""` = `true`).
Lo mismo con `notEmpty` → `false`.

**Causa raíz:** `evalCondition()` (línea 3101) no verifica si el campo
existe. `inst.values[when.field]` devuelve `undefined` para campos que
no están en el schema, y eso se interpreta como vacío.

**Plan:**
1. Añadir un chequeo de existencia al inicio de `evalCondition()`:
   ```js
   function evalCondition(when, inst) {
     // Campo inexistente = la condición no aplica (ni true ni false)
     const form = getForm(inst.formId);
     if (form && !allFields(form).some(x => x.field.id === when.field))
       return false;
     // ... resto igual
   ```
2. Considerar: mostrar un **warning visual** en la pestaña Rules si
   una condición referencia un campo que ya no existe (línea roja en
   la fila de la condición). Hoy el input de la expresión solo
   valida sintaxis (`exprError`), no semántica.

**Código a cambiar:** ~4 líneas en `evalCondition()`.
**Riesgo:** Bajo — cambia el comportamiento de condiciones que
referencian campos inexistentes. En la práctica, estas condiciones ya
estaban rotas (campo fantasma evaluándose como vacío); ahora serán
`false` consistentemente.
**Migración:** Ninguna — las configs con campos válidos no se afectan.

---

## Nivel 2 — Intermedio (modificación de lógica, UI moderada)

### 2-A · [ISSUE] Campo borrado sigue afectando rules, conditions y campos relacionados

**Problema:** Al borrar un campo (función `deleteField`, línea 2613),
solo se elimina de `sec.fields`. Pero pueden quedar referencias
"fantasma":
- `form.rules` (condiciones) con `when.field`, `then.field` o
  `when.value` que apuntan al campo borrado.
- `form.tiles` con `field` o `whenExpr` que lo mencionan.
- `inst.values[fieldId]` en instancias abiertas.
- Campos `mirror` con `source` que apunta al campo borrado.
- Dropdowns con `source: "child:id"` donde `id` es el campo borrado.

**Plan:**
1. En `deleteField()`, después de `found.sec.fields = ...filter(...)`:
   ```js
     // Limpiar referencias huérfanas
     // a) Condiciones que mencionan el campo
     form.rules = (form.rules || []).filter(r => {
       const refs = exprFieldRefs(r.whenExpr || "");
       const whenField = r.when && r.when.field;
       const thenField = r.then && r.then.field;
       const whenValField = r.when && r.when.value &&
         r.when.value.startsWith && !r.when.value.startsWith("@") &&
         r.when.value.includes("_") ? r.when.value : null;
       // Si la condición referencia el campo borrado, eliminarla
       if (thenField === fieldId) return false;
       if (whenField === fieldId) return false;
       if (refs.includes(fieldId)) return false;
       return true;
     });
     // b) Tiles que lo mencionan
     form.tiles = (form.tiles || []).filter(t => {
       if (t.field === fieldId) return false;
       const refs = tileFieldRefs(t);
       if (refs.includes(fieldId)) return false;
       return true;
     });
     // c) Mirror sources que apuntaban al campo -> quedan con source inválido
     //    (se marcan como rotos en el editor al reabrir, o se limpian)
     allFields(form).forEach(({ field }) => {
       if (field.type === "mirror" && field.source === fieldId)
         delete field.source;
     });
     // d) Valores de instancias
     state.instances.forEach(inst => {
       delete inst.values[fieldId];
     });
     // e) Colors/error colors en field-level config (se borran con el campo)
   ```
2. Mostrar un **aviso en el modal de confirmación** de borrado
   indicando cuántas referencias se van a limpiar:
   ```
   "¿Borrar «campo»? Tiene N condición(es) y M tile(s) que
    lo referencian; también se eliminarán."
   ```
3. Llamar a `revalidate()` en todas las instancias después de borrar
   para que los tiles se actualicen inmediatamente.

**Código a cambiar:** ~30 líneas nuevas en `deleteField()`.
**Riesgo:** Medio — borrar condiciones/tiles que referencian el campo
es destructivo. El usuario debe ver el resumen antes de confirmar.
Alternativa conservadora: **no borrar**, solo marcar como roto (línea
roja + tooltip "campo eliminado") y dejar que el usuario lo borre
manualmente.
**Migración:** Ninguna — las configs existentes no se afectan hasta
que el usuario borra un campo.

---

### 2-B · [ISSUE] Tile nuevo sin condición aparece como activo por defecto

**Problema:** Un tile con `whenExpr` vacío se evalúa como
`active = true` (línea 3291: `if (!src) active = true`). El diseño
actual es "vacío = siempre activo", pero el usuario no espera que un
tile aparezca inmediatamente recién creado.

**Plan (enfoque conservador — no rompe configs existentes):**
1. **No cambiar** el comportamiento de `whenExpr` vacío = siempre
   activo (rompería los tiles informativos fijos que ya existen).
2. Al **crear un tile nuevo** (botón "+ Agregar tile"), pre-llenar el
   `whenExpr` con un valor que evalúa a `false` hasta que el usuario
   escriba algo:
   ```js
   // al agregar tile nuevo:
   form.tiles.push({
     text: "Nuevo tile",
     whenExpr: "false",  // inactivo hasta que el usuario lo edite
     color: "...",
     severity: "info"
   });
   ```
   Wait — `false` no es una expresión válida en el parser actual
   (solo acepta campos, operadores y `@reglas`). Mejor: añadir un
   flag `tile.enabled` (default `true` para configs existentes, `false`
   para tiles recién creados).
3. Mejor enfoque: añadir flag `tile.enabled` (boolean):
   - `normalizeTiles()` lo inicializa en `true` si no existe.
   - `evalTiles()` lo chequea: `if (t.enabled === false) return;`
   - Al crear un tile nuevo, `enabled = false`.
   - Checkbox "Activo" en la UI de Rules.
4. Esto no rompe configs existentes (todas quedan `enabled = true`
   por el normalize) y el usuario puede desactivar tiles sin borrarlos.

**Código a cambiar:** ~15 líneas (normalize + eval + UI checkbox).
**Riesgo:** Bajo — el flag es nuevo con default seguro.
**Migración:** Automática via `normalizeTiles()`.

---

### 2-C · [PROPUESTA] kw_count: soportar "al menos N" / "N o más"

**Problema:** Hoy `kwCount` exige cantidad **exacta** (línea 3171:
`arr.length !== want`). No hay forma de decir "al menos 5".

**Plan:**
1. Aceptar formatos nuevos en `kwCount` (o un campo nuevo `kwMin`):
   - `"5"` → exactamente 5 (actual, retrocompatible)
   - `">=5"` o `"5+"` → al menos 5
   - `"<=5"` o `"5-"` → máximo 5
   - `"5..10"` → entre 5 y 10
2. Implementar un parser del valor de `kwCount`:
   ```js
   function parseKwCount(raw) {
     // "5" → { min: 5, max: 5 }
     // ">=5" → { min: 5, max: Infinity }
     // "<=5" → { min: 0, max: 5 }
     // "5..10" → { min: 5, max: 10 }
     const m = raw.match(/^(\d+)\.\.(\d+)$/);
     if (m) return { min: +m[1], max: +m[2] };
     const ge = raw.match(/^>=?\s*(\d+)$/);
     if (ge) return { min: +ge[1], max: Infinity };
     const le = raw.match(/^<=?\s*(\d+)$/);
     if (le) return { min: 0, max: +le[1] };
     const n = parseInt(raw, 10);
     if (!isNaN(n)) return { min: n, max: n };
     return null; // sin límite
   }
   ```
3. Modificar la validación en `revalidate()` (líneas 3168–3172):
   ```js
   if (field.type === "keywords") {
     const arr = inst.values[field.id] || [];
     const lim = parseKwCount(resolveRef(field.kwCount || ""));
     if (lim) {
       if (arr.length < lim.min)
         inst.errors[field.id] = `Se necesitan al menos ${lim.min} (hay ${arr.length})`;
       else if (arr.length > lim.max)
         inst.errors[field.id] = `Máximo ${lim.max} (hay ${arr.length})`;
     }
     // ... resto (unicidad, overlap) sin cambios
   ```
4. Actualizar el `field-help` del input `fe_kwCount` para documentar
   los formatos.
5. Actualizar el mensaje de error para que diga "al menos N" o
   "exactamente N" según el caso.

**Código a agregar:** ~25 líneas (parser + validación).
**Riesgo:** Bajo — retrocompatible (`"5"` sigue siendo exacto).
**Migración:** Automática — el parser interpreta el formato viejo.

---

### 2-D · [PROPUESTA] "Mensaje si no cumple" en tiles personalizadas

**Problema:** Las tiles personalizadas solo muestran texto cuando la
condición ES verdadera. No hay forma de mostrar un mensaje
alternativo cuando la condición NO se cumple.

**Plan:**
1. Añadir campo `tile.elseText` al schema de tiles (opcional, vacío =
   no mostrar nada cuando no cumple).
2. En `normalizeTiles()`, inicializar:
   ```js
   t.elseText = typeof t.elseText === "string" ? t.elseText : "";
   ```
3. En `evalTiles()` (línea 3286), devolver también los tiles NO activos
   que tengan `elseText`:
   ```js
   function evalTiles(form, inst) {
     const out = [];
     getFormTiles(form).forEach((tile, idx) => {
       const src = String(tile.whenExpr || "").trim();
       let active;
       if (!src) active = true;
       else { try { active = evalAst(parseExpr(src), inst); } catch(e) { active = false; } }
       if (active)
         out.push({ tile, idx, text: interpolateTileText(tile.text || tile.group || "(tile)", inst), active: true });
       else if (tile.elseText)
         out.push({ tile, idx, text: interpolateTileText(tile.elseText, inst), active: false });
     });
     return out;
   }
   ```
4. En `renderTiles()`, los tiles `active: false` con `elseText` se
   renderizan con un estilo distinto (más tenue, sin borde fuerte).
5. En la UI de Rules, reducir el `min-width` de las columnas "Texto"
   y "Salta a", y añadir una columna "Mensaje si no cumple":
   ```html
   <td><input type="text" data-tr="${k}|elseText"
        value="${escapeHtml(t.elseText || "")}"
        placeholder="(opcional) mensaje si NO cumple" /></td>
   ```
6. Cablear el guardado del nuevo campo en el handler de `data-tr`
   (línea ~4523).

**Código a cambiar:** ~20 líneas nuevas + ajustes de UI (CSS de la
tabla).
**Riesgo:** Bajo — `elseText` es opcional y vacío por defecto.
**Migración:** Automática via `normalizeTiles()`.

---

## Nivel 3 — Avanzado (componente custom, más reescritura)

### 3-A · [PROPUESTA] Autocompletado y/o resaltado de sintaxis en cond-expr-cell

**Problema:** El input de expresiones condicionales es un
`<input type="text">` plano. No hay cues visuales sobre qué código es
válido: IDs de campo disponibles, operadores, `@reglas`, ni
resaltado de paréntesis o palabras especiales.

**Hay dos sub-features independientes:**

#### 3-A-1 · Autocompletado (dropdown de IDs de campo y operadores)

**Plan:**
1. Crear un componente `CondExprInput` que reemplace al `<input>`
   plano. Reutilizar el patrón del autocomplete existente (líneas
   ~2295–2490) pero con una lista de sugerencias contextuales:
   - Al inicio de una palabra: nombres de campo (`field.id`) +
     `@reglas` + operadores (`empty`, `notEmpty`, `equals`, `not`,
     `matches`, `AND`, `OR`).
   - Después de un operador binario (`=`, `!=`, `~`): IDs de campo
     (como operandos) o literales (strings con comillas).
   - Después de `@`: nombres de reglas de `config.data.rules`.
2. Implementar un `input` listener que:
   a. Obtiene el texto desde el cursor hacia atrás hasta el último
      espacio o `(`.
   b. Filtra las sugerencias relevantes.
   c. Muestra un dropdown absoluto bajo el input (reuse el CSS de
      `.autocomplete-list`).
   d. Tab/Enter inserta la sugerencia seleccionada.
3. Necesitar interceptar `keydown` para Tab/Arrow/Enter sin romper
   el comportamiento normal del input.

**Código a agregar:** ~80–120 líneas (componente nuevo reutilizando
patrones existentes).
**Riesgo:** Medio — el parser de expresiones es sensible al texto
exacto; el autocompletado debe insertar IDs de campo (no labels) para
que `tokenizeExpr` los reconozca.
**Complejidad:** Alta por la detección de contexto (¿qué espera el
parser en esta posición?).

#### 3-A-2 · Resaltado de sintaxis (paren matching, colores)

**Plan:**
1. Enfoque sin dependencias: un overlay de un `<div>` con `position:
   absolute` detrás del `<input>`, sincronizado por scroll.
   El `<input>` tiene color transparente (solo el caret visible) y
   el overlay pinta el texto con colores por categoría:
   - **Campos**: color cyan (usando el design system del proyecto).
   - **Operadores** (`=`, `!=`, `~`, `AND`, `OR`, `NOT`): naranja.
   - **@reglas**: verde.
   - **Paréntesis**: matching resaltado en bold/cuando el cursor
     está sobre uno, su par se ilumina.
   - **Strings** (entre comillas): gris.
2. Implementar un `highlightExpr(src)` → HTML con `<span>` coloreados.
   Reutilizar `tokenizeExpr()` para tokenizar y mapear tipos a clases
   CSS.
3. Sincronizar scroll entre el overlay y el input (scrollLeft,
   scrollTop).
4. **Desventaja**: el overlay debe usar exactamente la misma fuente,
   tamaño, padding y letter-spacing que el input o el texto se
   desalinea. Fragilidad alta.

**Alternativa más simple (sin overlay):**
- Solo resaltar **paréntesis desbalanceados** al perder el foco:
  pintar el borde del input en ámbar si hay un `(` o `)` sin pareja.
- Mostrar el `exprError()` ya existente (línea 3080) como un tooltip
  más visible.
- Añadir un botón `?` junto al input que despliega una cheat-sheet
  de operadores y IDs disponibles.

**Código a agregar:** ~50 líneas (enfoque simple) o ~150 líneas
(overlay completo).
**Riesgo:** Alto para el overlay — desalineamiento de fuente entre
navegadores, bugs visuales. Bajo para el enfoque simple.
**Recomendación:** Implementar primero el enfoque simple (paren
check + cheat-sheet tooltip + borde ámbar), evaluar si es suficiente
antes del overlay.

---

## Resumen de orden de ejecución

| # | Issue/Propuesta                                                    | Dificultad | Riesgo  | Líneas |
|---|--------------------------------------------------------------------|------------|---------|--------|
| 1 | **[I] Click molesto → dblclick fuera**                              | ★☆☆☆☆      | Mínimo  | ~4     |
| 2 | **[P] Keybind visible en editor**                                  | ★☆☆☆☆      | Cero    | ~15    |
| 3 | **[I] Campo inexistente → false en condición**                     | ★☆☆☆☆      | Bajo    | ~4     |
| 4 | **[I] Tile nuevo inactivo por defecto** (flag `enabled`)           | ★★☆☆☆      | Bajo    | ~15    |
| 5 | **[I] Limpiar refs al borrar campo**                               | ★★★☆☆      | Medio   | ~30    |
| 6 | **[P] kw_count "al menos N"**                                      | ★★☆☆☆      | Bajo    | ~25    |
| 7 | **[P] "Mensaje si no cumple" en tiles**                            | ★★☆☆☆      | Bajo    | ~20    |
| 8 | **[P] Autocompletado en cond-expr**                                | ★★★★☆     | Medio   | ~100   |
| 9 | **[P] Resaltado de sintaxis en cond-expr**                         | ★★★★★     | Alto    | ~150   |

**Recomendado:** Hacer 1→2→3 primero (se aíslan, no se tocan entre
sí), commit. Luego 4→5 (afectan tiles y rules, validar juntos),
commit. Luego 6→7, commit. Finalmente 8 y 9 como features separadas
con PR propio cada una.

---

## Fall-back en caso de rollback

Todos los cambios son aditivos o de una sola función. Si algo rompe:
- **1-A:** revertir el `dblclick` → `click` en el listener del modal.
- **1-B:** quitar el input `fe_id` del template (es solo HTML).
- **1-C:** quitar las 4 líneas de chequeo de existencia en
  `evalCondition`.
- **2-A:** restaurar `deleteField` a su versión original (solo
  `filter` del array de campos).
- **2-B:** quitar el flag `enabled` (default `true` vía normalize).
- **2-C:** `parseKwCount` fallback → `parseInt` directo (modo exacto).
- **2-D:** `elseText` vacío = no se muestra (noop).
- **3-A / 3-B:** son features nuevas; sacar el componente nuevo no
  afecta configs existentes (el `<input type="text">` plano sigue
  funcionando como fallback).