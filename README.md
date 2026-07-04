# Bugs Template Tool

Herramienta interna para generar reportes de bugs y notas de
regresión con base en un template estandarizado.

## Archivos en esta carpeta

  - **`bug_tool.html`** — la herramienta (doble click para abrir).
    Es un único archivo HTML autocontenido, no requiere instalación.
  - **`bug_data.csv`** — la base de datos de mapas, POIs, modos,
    regiones, plataformas, tipos de bug, tiers y reglas de
    validación. **Lo edita el equipo de Database en Excel**.
  - **`bug_data.README.md`** — guía rápida para editar el CSV.
  - **`bug_session.json`** — *(opcional)* archivo generado al
    exportar manualmente la sesión. Solo se crea si el tester
    usa "Save session as file" en la herramienta.
  - **`DESIGN.md`** — documento de diseño de la herramienta.
    Referencia técnica, no es necesario leerlo para usar la
    herramienta.

## Flujo básico para testers

  1. Doble click en `bug_tool.html`.
  2. Si el navegador pregunta dónde cargar el CSV, seleccionar
     `bug_data.csv` de esta misma carpeta.
  3. Trabajar normalmente. El progreso se guarda solo (en el
     navegador); no hace falta guardar manualmente.
  4. Al terminar, copiar el reporte al ticket con los botones
     de copia.

## Flujo básico para el equipo de Database

  1. Abrir `bug_data.csv` en Excel.
  2. Agregar / quitar / editar filas siguiendo la guía en
     `bug_data.README.md`.
  3. Guardar como CSV, sobrescribiendo este archivo.
  4. Avisar al equipo cuando haya cambios importantes.

## Seguridad

  - No se instala nada.
  - La herramienta no hace llamadas de red.
  - Todo el código es visible abriendo el `.html` con un editor
    de texto.
  - El progreso se guarda localmente en el navegador
    (`localStorage`), no en un servidor.
