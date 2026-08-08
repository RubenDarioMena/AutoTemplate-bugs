# Pruebas de regresión

La suite protege los contratos más delicados de `bug_tool.html` sin añadir
dependencias ni pasos de instalación. Requiere Node.js 22 o posterior.

## Ejecutar

```bash
npm test
```

Comandos más específicos:

```bash
npm run test:contracts
npm run test:browser
```

`test:contracts` valida marcadores y documentación, JSON embebido, sintaxis
JavaScript, autocontención, schema, referencias, migraciones, expresiones,
instancias, output, CSV y exportación segura del HTML.

`test:browser` abre el archivo real en Chrome o Edge headless con un perfil
temporal aislado. Comprueba arranque, render inicial, actualización del output,
guardado en `localStorage`, restauración tras recarga y cambio de formulario.
Si ninguno de esos navegadores está instalado, la prueba se marca como omitida;
no se considera aprobada silenciosamente.

## Criterio para cambios futuros

- Ejecutar siempre `npm test` después de modificar `bug_tool.html`.
- Añadir un caso de regresión cuando se corrija un bug reproducible.
- Para cambios de schema, DATA, CSV, sesión u output, ampliar primero la prueba
  de comportamiento más cercana al contrato modificado.
- Las pruebas no sustituyen la revisión visual manual de cambios de layout o
  drag-and-drop; sí deben detectar que la aplicación arranca sin excepciones.

La suite crea únicamente perfiles temporales del navegador y los elimina al
terminar. No modifica la configuración ni la sesión del navegador del usuario.
