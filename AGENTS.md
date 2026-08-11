# AGENTS.md — reglas de mantenimiento

## Alcance y fuente de verdad

- La aplicación canónica es `bug_tool.html`: un monolito HTML autocontenido. `bug_tool_multilanguage.html` es su variante activa multilenguaje y mantiene contratos de mantenimiento propios.
- `#vanillaConfig` dentro de cada archivo es la configuración distribuida. `config` es la copia editable local y `state` contiene las instancias de trabajo.
- `bug_data.csv` y `bug_fields.csv` son formatos de intercambio; no sustituyen automáticamente la configuración embebida hasta que el usuario los importe y exporte la herramienta.
- `Directorio-Monolito.MD` es el mapa oficial de `bug_tool.html`; `Directorio-Monolito-Multilanguage.MD` cumple esa función para la variante.

## Regla obligatoria de documentación

Todo cambio estructural debe actualizar el directorio correspondiente dentro de la misma tarea: `Directorio-Monolito.MD` para `bug_tool.html` y `Directorio-Monolito-Multilanguage.MD` para `bug_tool_multilanguage.html`. Se considera estructural cualquier cambio que:

- agregue, elimine, divida, una o renombre una sección delimitada;
- cambie los datos que una sección recibe, produce o consume;
- modifique el flujo entre configuración, schema, instancias, UI, validación, CSV, sesión o exportación.

Conservar siempre el par de marcadores correspondiente:

```text
MONOLITH:SECTION <nombre> START
MONOLITH:SECTION <nombre> END
```

No reutilizar nombres ni mover solo uno de los dos límites. Si se crea un bloque nuevo, añadir ambos marcadores y su fila al directorio antes de dar el trabajo por terminado.

## Reglas de implementación

- Mantener el monolito autocontenido: no añadir dependencias remotas, red, librerías de terceros ni pasos de instalación sin autorización explícita.
- No insertar comentarios dentro de `#vanillaConfig`: es JSON válido, no JavaScript.
- En la variante multilenguaje, conservar la frontera de presentación: idioma y estilo no deben mutar IDs, DATA, DSL, placeholders, plantillas, CSV, texto del usuario ni output canónico.
- Al cambiar el schema o `config.data`, revisar como mínimo las secciones `03-config`, `04-schema-helpers`, `05-instances-persistence`, `15-csv-io` y `16-tool-export`.
- La exportación usa una copia prístina del documento; no introducir texto sin escapar que pueda cerrar el bloque de script de configuración.
- Las operaciones de archivo deben partir de una acción explícita del usuario. La herramienta ofrece selector nativo de guardado cuando el navegador lo soporta y descarga convencional como respaldo.
- Preservar cambios ajenos detectados en el árbol de trabajo. No revertir ni borrar archivos no relacionados con la tarea.

## Verificación mínima

Después de cambiar cualquiera de los monolitos:

1. Confirmar que cada marcador tiene exactamente un `START` y un `END`, en ese orden.
2. Validar el JSON de `#vanillaConfig`.
3. Validar la sintaxis de cada bloque JavaScript ejecutable.
4. Ejecutar `git diff --check`.
5. Actualizar `PROGRESS.md` si se completó una mejora, corrección o decisión de mantenimiento relevante.

En `bug_tool_multilanguage.html`, validar además la paridad de claves y placeholders de los catálogos `es`/`en`, el nombre de exportación y los cuatro estados español/inglés por Día/Noche.

## Documentos de mantenimiento

- `Directorio-Monolito.MD`: navegación y contratos entre secciones.
- `Directorio-Monolito-Multilanguage.MD`: navegación, contratos y frontera de localización/apariencia de la variante.
- `DESIGN.md`: diseño vigente y decisiones arquitectónicas; conserva historial cuando aporte contexto.
- `PROGRESS.md`: estado actual, log breve y próximos pasos conocidos.
- `README.md`: guía destinada a usuarios; no cargarla con detalles internos salvo que afecten su uso.
