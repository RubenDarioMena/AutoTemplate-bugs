# Curso Bug Report Tool — Temario

> **Estructura:** 4 bloques secuenciales. HTML → CSS → JS básico → JS avanzado.
> **Audiencia:** Personas con conocimientos básicos de HTML y CSS, y JavaScript en menor medida.
> **Formato:** Cada módulo = un archivo HTML autocontenido (vanilla, sin red, sin install, `file://` compatible).
> **Objeto de estudio:** `bug_tool.html` — una herramienta de reporte de bugs genérica, construida como single-file vanilla HTML+CSS+JS.
> **Design System:** Idéntico al Curso_HTML_CSS_JS (dark `#09080F`, accent `#A78BFA`, paleta y tipografía especificadas en `DESIGN_SYSTEM_SPEC.md`).
> **Idioma:** Español.

---

## BLOQUE I — HTML: La estructura estática (M00–M03)

### M00 · Bienvenida: ¿Qué construiremos y cómo funciona la herramienta?
- Qué es `bug_tool.html`: una herramienta de reporte de bugs en un solo archivo
- Restricción de diseño: cero-red, cero-install, `file://` compatible
- Las 3 capas en un solo archivo: HTML (estructura), CSS (estilo), JS (comportamiento)
- Metáfora visual: "la herramienta es como un taller con tres mesas de trabajo"
- Recorrer la herramienta en el navegador: pestañas, formularios, output, Data, Rules
- **Ejercicio:** Abrir `bug_tool.html` en el navegador, llenar un formulario Bug y copiar el output
- **Recursos:** MDN, web.dev

### M01 · El esqueleto HTML:布局 y contenedores
- Estructura del `<head>`: meta charset, viewport, title, `<style>` embebido
- El `<body>` como contenedor flex vertical: barra superior, tiles, área principal, paneles
- Contenedores semánticos: `.top-tabs`, `#subTabsAndMain`, `.form-col`, `.output-panel`
- Paneles ocultos: `#dataContainer`, `#rulesContainer`, `#modal`
- Inputs de archivo ocultos (`<input type="file" style="display:none">`)
- **Ejercicio:** Reconstruir el esqueleto HTML de la herramienta (sin estilos, solo divs anidados)

### M02 · El bloque de configuración embebida: JSON dentro del HTML
- `<script type="application/json" id="vanillaConfig">` — datos dentro del HTML
- Estructura del JSON: `version`, `data` (listas, mapas, reglas), `schema` (formularios, secciones, campos)
- Por qué embeber la config: distribución cero-install, el archivo se basta a sí mismo
- Separar datos de código: el schema es la "fuente de verdad", el JS lo interpreta
- **Ejercicio:** Leer el JSON embebido y escribir a mano la estructura de un formulario simple

### M03 · Formularios y tipos de campo en el schema
- Tipos de campo del schema: `text`, `textarea`, `autocomplete`, `keywords`, `mirror`
- Propiedades de campo: `label`, `required`, `regex`, `template`, `source`, `default`, `size`
- Secciones del formulario: `mode` (joined vs lines), `heading`, `sep`
- Plantillas con `{value}`: cómo se transforma cada campo al output
- **Ejercicio:** Escribir el JSON de un formulario de 3 secciones con 5 tipos de campo distintos

---

## BLOQUE II — CSS: El diseño de la herramienta (M04–M07)

### M04 · Reset, base y design tokens
- Reset universal: `* { box-sizing: border-box; margin: 0; padding: 0; }`
- El `body` como contenedor flex: `display: flex; flex-direction: column; overflow: hidden`
- Estilos base de botones, inputs, labels, textareas
- Sistema de colores claro de la aplicación (distinto del design system del curso; la herramienta usa tema claro)
- Radios, bordes, focus states (`outline`, `box-shadow`)
- **Ejercicio:** Reconstruir la base CSS de la herramienta (reset + estilos de botón e input)

### M05 · Layout con flexbox: la columna izquierda y el panel de output
- `.top-tabs` como barra horizontal fija (`flex: 0 0 auto`)
- `#subTabsAndMain` como área flexible (`flex: 1`)
- `.main` como contenedor flex horizontal: `.form-col` + `.output-panel`
- `.form-col` y su ancho fijo del 50% (`width: 50%; min-width: 380px`)
- `.output-panel` que ocupa el resto (`flex: 1`)
- El truco del "split": cómo dos columnas comparten el espacio vertical con `min-height: 0`
- **Ejercicio:** Reproducir el layout principal (barra superior + dos columnas) en un HTML aislado

### M06 · Sub-pestañas, secciones colapsables y animación con grid
- `.sub-tabs`: pestañas tipo "navegador" con bordes redondeados arriba
- `.form-section`: secciones con `<h4>` + cuerpo colapsable
- El truco `grid-template-rows: 1fr → 0fr` para animar altura desconocida sin JS
- `.tiles-bar`: barra de estado con dos bandas y llave colapsable
- Repliegue de paneles (`.form-collapsed`, `.actions-collapsed`)
- **Ejercicio:** Implementar una sección colapsable con la técnica grid 1fr→0fr

### M07 · Modales, menús desplegables y banners
- `.modal-backdrop` + `.modal`: overlay centrado con `position: fixed` + flexbox
- `.menu-wrap` + `.menu-pop`: menús desplegables con `position: absolute`
- `.banner`: notificación flotante con `position: fixed` y transición de opacidad
- Autocomplete dropdown: `.autocomplete-list` con apertura hacia arriba o abajo
- Cómo se cierran los menús al hacer clic fuera (patrón `document.addEventListener("mousedown")`)
- **Ejercicio:** Construir un modal funcional y un menú desplegable desde cero

---

## BLOQUE III — JavaScript básico: Estado y render (M08–M12)

### M08 · Variables, constantes y el estado global de la aplicación
- `const PRISTINE_HTML` y por qué se captura al cargar
- `CONFIG_KEY` y `SESSION_KEY`: claves de localStorage
- El objeto `state`: `topTab`, `instances`, `activeInstanceId`, `prefs`
- `let` vs `const` en la herramienta: `let vanilla`, `let config` (mutables), `const state`
- `FIELD_TYPES`, `FIELD_SIZES`, `TILE_COLORS`: constantes de configuración
- **Ejercicio:** Declarar las variables y constantes principales de la aplicación

### M09 · Utilidades: funciones helper que se usan en todo el código
- `$(id)` — el atajo para `document.getElementById`
- `escapeHtml(s)` — previene inyección de HTML
- `deepClone(obj)` — copia profunda con JSON
- `slugify(label)` — convierte texto a id seguro
- `resolveRef(v)` — resuelve referencias `@regla` contra `config.data.rules`
- `unescapeNl(s)` — convierte `\n` y `<br>` a saltos reales
- `downloadFile(name, content)` — descarga con Blob + `URL.createObjectURL`
- `copyToClipboard(text)` — con fallback para `execCommand`
- **Ejercicio:** Implementar las 5 utilidades más usadas y probarlas

### M10 · Config: cargar y migrar la configuración
- `loadVanillaConfig()`: leer JSON del `<script type="application/json">`
- `loadConfig()`: leer de localStorage o clonar vanilla
- `migrateConfig()`: completar listas/reglas nuevas sin pisar cambios del usuario
- `configIsDirty()`: comparar `config` vs `vanilla` para mostrar el aviso "Config modificada"
- El patrón vanilla → copia local: "el archivo trae una versión, el navegador guarda otra"
- **Ejercicio:** Cargar un JSON embebido y guardar una copia modificada en localStorage

### M11 · Instancias: cómo la app maneja múltiples bugs abiertos
- `makeInstance(formId)`: crear una instancia vacía con defaults del schema
- `ensureInstanceFields(inst)`: completar campos nuevos tras editar el schema
- `getActiveInstance()`: encontrar la instancia activa en el array
- `markInstanceDirty(inst)`: marcar para el punto naranja de "cambios sin guardar"
- El array `state.instances`: como pestañas del navegador, cada bug es independiente
- **Ejercicio:** Crear 3 instancias, cambiar valores y marcarlas como dirty

### M12 · Render dinámico: pintar el formulario desde el schema
- `renderTopTabs()`: generar las pestañas de formularios desde `getForms()`
- `renderForm()`: pintar secciones y campos leyendo el schema
- `sectionHtml(sec, inst, fx, form)`: HTML de una sección con sus filas agrupadas
- `fieldHtml(field, inst, fx)`: HTML por tipo de campo (text, textarea, autocomplete, keywords, mirror)
- Agrupar campos por size: `half` y `third` en filas de 2 o 3
- `wireFormEvents(inst, form)`: conectar inputs al modelo (input, blur, change)
- **Ejercicio:** Renderizar un formulario de 3 campos desde un objeto JSON

---

## BLOQUE IV — JavaScript avanzado: Widgets, validación y output (M13–M18)

### M13 · Widget autocomplete: dropdown con texto libre y opciones editables
- `wireAutocomplete(input, inst, form, field)`: el widget completo
- Filtrado while typing: `input.value.toLowerCase()` + `includes()`
- Resaltado de coincidencias con `<mark>` y regex de escape
- Navegación por teclado: ArrowDown, ArrowUp, Enter, Escape
- "+ Agregar" a la lista y "✕ Borrar" opción con confirmación
- `positionAutocomplete()`: abrir hacia arriba o abajo según espacio disponible
- **Ejercicio:** Construir un input con dropdown autocompletable desde un array

### M14 · Widget keywords: chips de palabras clave con validación
- `wireKeywords(chips, inst, form)`: el widget de chips
- Añadir con Enter o coma, borrar con Backspace o botón ✕
- Validación: cantidad exacta (`kwCount`), unicidad, `kwOverlap` (no en el cuerpo del bug)
- Re-render del widget sin perder el foco del input
- **Ejercicio:** Crear un input de chips que valide cantidad exacta y unicidad

### M15 · Validación: required, regex y condiciones entre campos
- `revalidate(inst)`: el motor de validación principal
- Campos ocultos/bloqueados por condición no se validan
- `evalFieldRules(form, inst)`: aplicar reglas show/hide/disable/setDefault
- `evalCondition(when, inst)`: evaluar una condición (empty, equals, matches, equalsField)
- `reflectErrors(inst)`: pintar errores sin re-renderizar (actualizar clases y texto)
- **Ejercicio:** Validar un formulario con required, regex y una condición show/hide

### M16 · Motor de expresiones booleanas: tokenizer, parser y evaluator
- Por qué expresiones de texto: "permitir condiciones anidadas sin UI compleja"
- `tokenizeExpr(src)`: convertir texto en tokens (word, str, ref, op)
- `parseExpr(src)`: parser de descenso recursivo → AST (or, and, not, cmp, ref)
- `evalAst(ast, inst, seen)`: evaluar el AST contra la instancia
- `@regla` suelta: evaluar otra regla como sub-expresión (con anti-ciclo)
- `exprError(src)`: validar sintaxis para feedback en vivo
- **Ejercicio:** Tokenizar y evaluar `(x empty OR y = "foo") AND NOT z matches @re`

### M17 · Generador de output: de formulario a texto final
- `buildOutput(inst)`: recorrer secciones y aplicar plantillas
- Modo `joined`: todo en una línea con separadores
- Modo `lines`: cada campo aporta su(s) línea(s)
- `joinPrev`: continuar en la línea anterior (sin salto)
- `perLine`: aplicar plantilla a cada línea escrita (ej: pasos numerados)
- `omitValue` y `emptyAs`: omitir o sustituir valores vacíos
- Chunks: `summary` (primera línea) vs `description` (el resto) para botones de copia
- **Ejercicio:** Generar output de un schema de 3 secciones con modos joined y lines

### M18 · Persistencia, exportación y cierre del sistema
- `scheduleSave()` + debounce: guardar en localStorage 300ms después del último cambio
- `saveAll()` / `loadSession()`: config y sesión por separado
- `exportToolHtml()`: tomar `PRISTINE_HTML`, reemplazar el JSON, descargar un nuevo `.html`
- CSV import/export: `importDataCsv`, `exportDataCsv`, `importFieldsCsv`, `exportFieldsCsv`
- `boot()`: la secuencia de arranque completa (load → migrate → wire → render)
- `beforeunload` + `visibilitychange`: última oportunidad de guardar
- **Ejercicio:** Exportar un HTML autocontenido con config modificada embebida

---

## BLOQUE V — Barra de tiles: Feedback visual y validación integrada (M19–M21)

### M19 · Tiles automáticas: la barra de estado del formulario
- La barra `.tiles-bar` arriba del formulario: feedback visual inmediato
- Dos tipos de tiles: automáticas (errores de campo) y personalizadas (definidas en el schema)
- `renderTiles(inst)`: la función que pinta la barra completa
- Tiles automáticas: qué hace `Object.entries(inst.errors)` → un tile por campo con error
- El estado verde "✓ Sin errores — listo para copiar" y `hasBlockingState()`
- Click en una tile → `scrollToField(fieldId)`: saltar al campo con error
- **Ejercicio:** Renderizar una barra de tiles a partir de un objeto de errores simulado

### M20 · Tiles personalizadas: etiquetas dinámicas definidas por el usuario
- `form.tiles` en el schema: array de definiciones `{ text, whenExpr, color, group, severity, field }`
- `getFormTiles(form)`, `normalizeTiles(form)`, `ensureTiles(cfg)`: normalización al cargar
- `evalTiles(form, inst)`: evaluar la condición de cada tile (`whenExpr` vacío = siempre activo)
- `interpolateTileText(text, inst)`: sustituir `{idCampo}` en el texto por el valor actual
- Severidad: `error` (bloquea el "listo"), `warn` (aviso ámbar), `info` (informativo)
- Paleta de colores: `TILE_COLORS` con 15 opciones, `tileColor(id)` helper
- Los 3 tiles del schema Bug explained: "Mapa: {map}", "Modo: {mode}", "Falta la posición de vista"
- **Ejercicio:** Definir 2 tiles personalizadas en JSON con condición, color y severidad

### M21 · Resaltado cruzado, colapso e interacción de la barra de tiles
- `wireTileInteractions()`: cableado UNA vez sobre `#tilesBar` + `#formPanel` (delegación)
- Resaltado cruzado: al hover/focus en un campo, sus tiles se marcan (`.tile-hot`), las demás se atenúan
- `tileFieldRefs(tile)`: qué campos "toca" una tile (menciones en `whenExpr` + `field` destino)
- La "llave" (▾): toggle de colapso con `state.prefs.tilesCollapsed` y animación CSS
- `renderTiles` re-renderiza sin perder la delegación (patrón sobre elementos persistents)
- Edición de tiles en la pestaña Rules: UI completa con color, severidad, grupo, "salta a"
- **Ejercicio:** Implementar resaltado cruzado entre campos y tiles en un mini-formulario

---

## Resumen

| Bloque | Módulos | Total |
|---|---|---|
| I · HTML | M00–M03 | 4 |
| II · CSS | M04–M07 | 4 |
| III · JS básico | M08–M12 | 5 |
| IV · JS avanzado | M13–M18 | 6 |
| V · Tiles | M19–M21 | 3 |
| **Total** | | **22 módulos** |

## Notas de scope

- **Tiles superiores**: SÍ se enseñan (3 módulos dedicados, M19–M21). Las tiles automáticas y personalizadas son una funcionalidad central de la herramienta: feedback visual, validación integrada, resaltado cruzado y colapso de la barra.
- **Pestaña Data (listas en árbol)**: Se cubre conceptualmente en M02 (schema) pero la implementación completa de `childLists` y migración de árbol se deja como lectura avanzada.
- **Pestaña Rules (condiciones+tiles)**: Se cubre el motor de expresiones (M16), las condiciones (M15) y la UI de tiles en M21. La UI completa de Rules es aplicación de lo aprendido.
- **La herramienta es genérica**: No se menciona ningún juego o franquicia específica. Los ejemplos usan datos genéricos (mapas, POIs, plataformas como ejemplos abstractos).