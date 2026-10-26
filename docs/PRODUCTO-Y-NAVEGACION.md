# Producto y navegación — C3 Platform

**Propósito:** fuente operativa para evaluar y evolucionar arquitectura de información, menú y recorridos. El objetivo no es agregar más pantallas: es facilitar que cada tipo de usuario complete sus tareas sin conocer las URLs. **No es aprobación de rediseño ni diagnóstico probado en usuarios.**

## 1. Roles y tareas

| Rol | Qué viene a hacer | Destinos actuales relevantes |
| --- | --- | --- |
| Visitante | Entender C3, encontrar experiencia/reto y decidir participar | `/`, `/explorar`, `/compite`, `/crea`, `/conecta`, `/experiencias/[experienceId]`, `/retos/[challengeId]` |
| Participante | Entrar, inscribirse, ver estado, trabajar y entregar, consultar trayectoria | `/acceso`, `/mi-c3`, `/retos/[challengeId]/inscripcion`, `/experiencias/[experienceId]/inscripcion`, `/mi-c3/retos/[challengeId]`, `/trayectoria`, `/cuenta` |
| Empresa | Proponer una necesidad y consultar retos/soluciones permitidos si está vinculada | `/empresa/proponer`, `/empresa`, `/empresa/retos/[challengeId]/evaluacion` |
| Jurado | Evaluar soluciones asignadas, después del cierre | `/mi-c3`, `/mi-c3/evaluar/[challengeId]` (externo); representante vía `/empresa/retos/[challengeId]/evaluacion` |
| Admin C3 | Crear y operar experiencias, revisar inscripciones y propuestas, gestionar jurados y resultados | `/admin` |

**Importante:** `empresa/proponer` es público; `empresa` no es público. Los menús deben diferenciar proponer de entrar al espacio privado.

## 2. Navegación observada en el código del ZIP

- `src/components/SiteHeader.tsx`: Inicio, Explorar, Compite, Crea, Conecta y **Empresas** (lleva a `/empresa/proponer`). Con sesión agrega Mi C3, Cuenta, Trayectoria y opcionalmente Admin.
- `src/components/PanelHeader.tsx`: en panel de persona muestra Mi C3, Explorar y Trayectoria; Cuenta y Admin aparecen entre acciones.
- `src/components/MovilShell.tsx`: usa barra inferior «Inicio» (significa `/mi-c3`), Explorar, Trayectoria; algunos recorridos emplean marco `movil`, otros layout `panel` con breakpoint de escritorio.
- `src/components/Footer.tsx`: enlaces institucionales Compite, Crea, Conecta y Explorar.

**Hallazgo confirmado en código, por verificar en navegador:** `src/components/EvaluadorPanel.tsx` dirige el acceso a `/acceso?next=/evaluar/[challengeId]`, pero el archivo de página de evaluación externa está en `/mi-c3/evaluar/[challengeId]`. Revisar y probar el retorno al iniciar sesión. No aplicar redirecciones sin probar autorización y rol.

## 3. Fricciones potenciales para investigar, no suposiciones cerradas

1. **Dos significados de «Inicio»:** en la cabecera pública va a `/`, en navegación móvil de persona a `/mi-c3`.
2. **Señalización de «Empresas»:** lleva al formulario público, no al espacio de representantes con sesión.
3. **Menús diferentes según marco:** SiteHeader, PanelHeader y MovilShell no exponen las mismas acciones ni la misma jerarquía; documentar dónde es intencional y dónde obstaculiza tareas.
4. **Multiplicidad de rutas por tarea:** inscripción desde experiencia o reto; evaluación de jurado externo o representante. Asegurar que el contenido y la navegación expliquen el contexto y no expongan permisos.
5. **Diseño de escritorio:** revisar si vistas construidas con `MovilShell layout="movil"` son apropiadas para tareas densas. Mi C3 y Trayectoria usan `layout="panel"` según implementación.
6. **Navegación de retorno:** comprobar después de autenticarse, guardar, enviar, finalizar evaluación y entrar a ruta sin permiso.

## 4. Método de auditoría antes de rediseñar

Para cada flujo, registrar: **rol, objetivo, entrada visible, secuencia de clicks, pantallas y rutas, permiso, espera/error, acción principal, confirmación, regreso y resultado persistido**. Probar en escritorio (1280 px) y móvil (390 px), cuenta nueva, participante con tareas, jurado, empresa autorizada y admin. Distinguir observación, error técnico y preferencia subjetiva. No afirmar que un flujo funciona sin recorrerlo.

## 5. Criterios para una propuesta de nueva navegación

- Presentar primero **mapa de información, menús por rol y 4–6 recorridos**; luego wireframes y propuesta de URLs/cambios.
- Mantener URLs actuales cuando funcionen; si se cambia una, definir enlaces internos y redirecciones sin romper accesos guardados.
- Identificar destinos protegidos, acciones condicionales, estados vacíos, breadcrumbs o retorno y consistencia de nombres.
- No modificar código, rutas ni diseños aprobados hasta que el responsable revise una propuesta y determine prioridades.
- Pruebas de aceptación deben confirmar que una persona sin instrucciones complete la tarea prevista; medir fricción, no solo que la página renderice.

## 6. Próximo entregable de producto

Auditoría basada en demo navegable y código: mapa de rutas reales, problemas priorizados por impacto, propuesta de arquitectura de información, flujos por rol, comparación con `diseno-claude/` y plan incremental. Validarla antes de implementar.
