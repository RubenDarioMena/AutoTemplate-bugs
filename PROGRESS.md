# Progreso del proyecto

Última actualización: 2026-07-29  
Estado: activo — herramienta funcional, monolito documentado para mantenimiento.

## Estado actual

- Aplicación canónica: `bug_tool.html`.
- Distribución: HTML autocontenido con configuración inicial en `#vanillaConfig`.
- Persistencia local: configuración e instancias en `localStorage`; importación/exportación explícita de CSV, sesión JSON y HTML integrado.
- Navegación interna: 23 bloques de primer nivel delimitados con marcadores `MONOLITH:SECTION` y descritos en `Directorio-Monolito.MD`.

## Trabajo completado recientemente

### 2026-07-29 — reordenamiento de campos por drag-and-drop

- En modo edición de escritorio, los campos se pueden arrastrar desde el asa ⠿ y soltar antes o después de otro campo, incluso entre secciones vacías.
- El ID estable del campo identifica el arrastre y `section.fields` permanece como única fuente de verdad del orden.
- Pointer Events evita los problemas del DnD nativo bajo `file://`; el origen muestra «Moviendo…», el destino queda marcado y el cursor pasa de mano abierta a cerrada.
- El checkbox **Arrastrar campos**, situado a la izquierda del grupo «+ Sección / Terminar edición», sustituye ▲▼ por el asa ⠿ para liberar espacio en campos estrechos; su valor persiste en `state.prefs` al salir del modo edición y entre recargas en el mismo navegador.
- El preview de arrastre usa una tarjeta fantasma, un placeholder «Soltar aquí» que cruza antes/después en el punto medio y animación FLIP de 170 ms para los campos desplazados; `section.fields` sólo cambia al soltar.
- Las columnas vacías y los gaps horizontales de filas de 1/2 y 1/3 son hitboxes de la propia fila; sólo el espacio exterior conserva el atajo para enviar el campo al final de la sección.
- Arrastre y botones ▲▼ comparten la misma función de reordenamiento; se sincronizaron `Directorio-Monolito.MD`, `DESIGN.md` y `README.md`.

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
