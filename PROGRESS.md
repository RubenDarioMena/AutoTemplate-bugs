# Progreso del proyecto

Última actualización: 2026-07-29  
Estado: activo — herramienta funcional, monolito documentado para mantenimiento.

## Estado actual

- Aplicación canónica: `bug_tool.html`.
- Distribución: HTML autocontenido con configuración inicial en `#vanillaConfig`.
- Persistencia local: configuración e instancias en `localStorage`; importación/exportación explícita de CSV, sesión JSON y HTML integrado.
- Navegación interna: 23 bloques de primer nivel delimitados con marcadores `MONOLITH:SECTION` y descritos en `Directorio-Monolito.MD`.

## Trabajo completado recientemente

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

- Los pendientes funcionales históricos están en la sección “Pendiente” de `DESIGN.md` y en `ROADMAP.md`; deben validarse con el usuario antes de implementarse.
- Si se modifica la variante `bug_tool_redesign.html` o se recupera una versión legacy, decidir explícitamente si debe adoptar los marcadores y documentación del monolito principal. No asumir que está sincronizada.

## Cómo actualizar este archivo

Al terminar una tarea relevante, agregar una entrada breve con fecha, resultado verificable, documentos que debieron sincronizarse y cualquier decisión pendiente. Mantener las entradas más recientes arriba y evitar registrar cambios puramente mecánicos sin impacto de mantenimiento.
