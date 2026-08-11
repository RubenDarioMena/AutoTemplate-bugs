# Pruebas de regresión

La suite protege los contratos más delicados de `bug_tool.html` y
`bug_tool_multilanguage.html` sin añadir dependencias ni pasos de instalación.
Requiere Node.js 22 o posterior.

## Ejecutar

```bash
npm test
```

Comandos más específicos:

```bash
npm run test:contracts
npm run test:multilanguage
npm run test:browser
```

`test:contracts` valida en ambos archivos los contratos que les corresponden:
marcadores y documentación, JSON embebido, sintaxis JavaScript,
autocontención, schema, referencias, migraciones, expresiones, instancias,
output, CSV, catálogos y exportación segura del HTML.

`test:multilanguage` ejecuta los nueve contratos y comportamientos específicos
de la variante sin abrir un navegador real.

`test:browser` abre el archivo real en Chrome o Edge headless con un perfil
temporal aislado. Un smoke comprueba el flujo histórico de formulario, output y
sesión; otro cambia idioma y tema en la variante, confirma que config/output no
mutan y verifica la restauración tras recarga.
Si ninguno de esos navegadores está instalado, la prueba se marca como omitida;
no se considera aprobada silenciosamente.

## Cobertura de la variante multilenguaje

Al 2026-08-10, `npm test` reúne 29 casos: los 19 históricos y diez específicos
de la variante (cinco contratos, cuatro comportamientos aislados y un smoke en
Chrome/Edge). La cobertura nueva verifica:

  - los 24 pares de marcadores y
    `Directorio-Monolito-Multilanguage.MD`;
  - JSON y scripts válidos, IDs únicos, autocontención y ausencia de red;
  - paridad de claves, valores no vacíos, placeholders y referencias DOM de
    los catálogos `es`/`en`;
  - metadatos y claves persistentes aislados de la versión original;
  - traducción, plurales, fallback y overlay no destructivo de textos
    distribuidos;
  - persistencia conjunta de idioma/tema y migración del tema legacy;
  - estabilidad de config, valores y output al cambiar apariencia;
  - nombre y seguridad JSON de la exportación multilenguaje;
  - cambio real a English/Night y restauración tras reload en navegador.

Como ampliación futura, los contratos comunes pueden factorizarse aún más para
ejecutar cada caso de schema/CSV/output contra ambas rutas. Esto no sustituye la
revisión visual de las cuatro combinaciones.

## Revisión manual de la variante

Ejecutar la matriz completa español/inglés por Día/Noche, tanto en escritorio
como a 1100 px o menos. En cada combinación revisar:

  - arranque directo por `file://`, selectores, reload y ausencia de flash de
    tema o pérdida de estado;
  - navegación Bug/Regression/DATA/RULES, edición de schema y todos los modales;
  - autocomplete, chips, checklist, validaciones, tiles, media y Bloc;
  - generación, edición parcial, preview Jira/Markdown, copia y preservación
    literal del output al cambiar idioma;
  - importación/exportación de ambos CSV, sesión JSON, exportación HTML y
    reapertura del archivo exportado;
  - textos ingleses largos, overflow, contraste, foco visible, navegación por
    teclado y actualización de `title`, placeholder y `aria-label`.

## Criterio para cambios futuros

- Ejecutar siempre `npm test` después de modificar cualquiera de los
  monolitos.
- Añadir un caso de regresión cuando se corrija un bug reproducible.
- Para cambios de schema, DATA, CSV, sesión u output, ampliar primero la prueba
  de comportamiento más cercana al contrato modificado.
- Para cambios de catálogos o apariencia, validar paridad de claves y
  placeholders, persistencia y la matriz 2×2.
- Las pruebas no sustituyen la revisión visual manual de cambios de layout o
  drag-and-drop; sí deben detectar que la aplicación arranca sin excepciones.

La suite crea únicamente perfiles temporales del navegador y los elimina al
terminar. No modifica la configuración ni la sesión del navegador del usuario.
