# Progreso del proyecto

Última actualización: 2026-08-03
Estado: activo — herramienta funcional, monolito documentado para mantenimiento.

## Estado actual

- Aplicación canónica: `bug_tool.html`.
- Distribución: HTML autocontenido con configuración inicial en `#vanillaConfig`.
- Persistencia local: configuración e instancias en `localStorage`; importación/exportación explícita de CSV, sesión JSON y HTML integrado.
- Navegación interna: 23 bloques de primer nivel delimitados con marcadores `MONOLITH:SECTION` y descritos en `Directorio-Monolito.MD`.

## Trabajo completado recientemente

### 2026-08-03 — exportación selectiva entre Bug y Regression

- Bug y Regression muestran un botón contextual junto a **Editar formulario** para exportar los valores de la instancia visible al otro tipo de formulario.
- El usuario elige explícitamente la pestaña de destino; solo se copian campos editables con el mismo ID y contenido. No se transfieren media, campos automáticos ni el output editado manualmente; los valores vacíos del origen no borran los del destino.
- Si un ID corresponde a un campo de valor múltiple en un formulario y escalar en el otro, se omite y se informa para no dejar un widget en un estado inválido.
- Se actualizaron `Directorio-Monolito.MD` y este registro.

### 2026-08-02 — ajuste de espacio del formulario y output

- La columna de IDs de media solo ocupa espacio en modo edición; fuera de él, los controles vuelven a alinearse al borde izquierdo del panel.
- Se añadió un divisor vertical arrastrable entre formulario y output. Conserva el ratio en la sesión local, respeta mínimos de uso y se reinicia al colapsar o volver a abrir el formulario.
- Se sincronizaron `Directorio-Monolito.MD` y `DESIGN.md`.

### 2026-08-01 — plantillas compuestas y media vinculable

- Todas las plantillas de campo aceptan `{value}` para el valor propio, `{idDeCampo}` para el valor crudo de otro campo con input del mismo formulario y `{media:mediaN}` para el nombre generado de una fila de media. `{{` y `}}` preservan llaves literales.
- El tipo persistente `mirror` se presenta como **Salida compuesta (solo output)**: mantiene `source` como origen opcional de `{value}`, pero puede armar un output sin input a partir de varias referencias.
- Las filas de media ahora se guardan como `{ id, type }`; las sesiones antiguas de strings se migran al abrir. Al agregar media se reutiliza el menor ID libre (`media1`, `media2`...), sin renumerar las filas restantes.
- El modo edición muestra los IDs de campos y media. El editor y `bug_fields.csv` validan las referencias; al borrar campos se eliminan las salidas compuestas dependientes y se avisa de las plantillas editables que requieren ajuste.
- Se actualizaron `Directorio-Monolito.MD`, `DESIGN.md` y `bug_fields.README.md`.

### 2026-07-30 — campos automáticos de reloj y fecha

- El editor permite crear campos `clock` y `date`, ambos de solo lectura y alimentados por la fecha/hora local de la PC.
- Cada tipo expone un selector de formato; el output usa el valor mediante la plantilla habitual `{value}`. En reloj, AM/PM se muestra exclusivamente con horas de 12 horas.
- Los valores se refrescan al regenerar output tras cambios de campo y justo antes de las acciones de copia. El texto completo editado manualmente se conserva como comportamiento establecido.
- `bug_fields.csv` incorpora la columna `format` y conserva compatibilidad de importación con encabezados anteriores de 28 y 23 columnas.
- Se sincronizaron `Directorio-Monolito.MD` y `bug_fields.README.md`.

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
