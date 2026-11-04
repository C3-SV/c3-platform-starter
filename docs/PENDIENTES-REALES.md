# Pendientes y decisiones abiertas — C3 Platform

Este archivo mantiene **solo decisiones y trabajos no cerrados**. Actualizar la condición de cierre al resolverlos; no copiar aquí narrativas de implementaciones anteriores. El alcance implementado y las rutas están en [README](../README.md).

## Prioridad máxima — demo integral del 4-nov-2026 (update del 3-nov)

Plan, inventario y estado por tarea: [plan 2026-11-03](superpowers/plans/2026-11-03-c3-challenges-demo.md). Fuente de decisiones: [UPDATE-2026-11-03](UPDATE-2026-11-03-demo-integral.md).

| Asunto | Situación conocida | Para cerrar |
| --- | --- | --- |
| Firebase remoto y cuentas demo | Proyecto de la demo: **`c3-platform-demo`** (decisión del responsable, 3-nov-2026; excepción explícita a AGENTS §7, registrada en §15). **Hecho:** seed v2 aplicado con respaldo previo fuera del repo (`C:\Users\chris\.c3-demo\backup-seed-v1-2026-11-03.json`); cuentas `joven@`, `empresa@` y `admin@demo.c3.com.sv` creadas con UID fijo; claim de administración y vínculo verificados en solo lectura. **Pendiente:** confirmar si el sitio `demo.plat.c3.com.sv` lee este proyecto; decidir sobre `c3-challenges-demo` (creado por error, sin uso; su eliminación requiere confirmación); rotar la clave de la cuenta de servicio tras el ensayo y guardarla fuera del repositorio y de carpetas sincronizadas | Confirmaciones del responsable; borrar la clave local al terminar |
| Versiones del seed | **Hecho en código (`SEED_VERSION = 4`, con la rúbrica ponderada 20/30/25/25):** challenge demo marcado `demo`, dos evaluaciones finalizadas para cada solución publicada y retroalimentación de la cuenta joven publicada. Modo `update` con respaldo previo; `apply` se niega ante versiones anteriores. **En remoto:** v2 aplicado el 3-nov-2026; v3 aplicado el 4-nov-2026; **v4 no aplicado** | Autorizar la carga de v4 con `--dry-run` previo, respaldo fuera del repo y `update`. Cambia el promedio y la rúbrica del challenge demo |
| Dataset de demostración completo | **Hecho en remoto:** 1 organización, 6 perfiles sin cuenta, 7 inscripciones, 5 participaciones, 5 entregas (4 enviadas, 1 borrador), 3 defensas, 2 listas cortas, 2 solicitudes de contacto y 3 propuestas. **Implementado en código:** el tablero muestra el estado de evaluación, la matriz por criterio y la bitácora por persona. **Sin verificar en remoto:** evaluaciones con puntajes, resultado publicado de demostración, bitácora y retroalimentación del seed local; el registro de ejecución remota (plan §8) no las incluye | Autorizar la carga de esas colecciones en `c3-platform-demo` y verificarla en solo lectura |
| Contacto con datos | **Decidido el 4-nov-2026:** canal simulado tras «aceptado» (mensaje interno facilitado por C3). Ningún correo ni teléfono se muestra a la empresa ni a la persona | Decidir el canal real y la retención (PRIVACIDAD) antes de datos reales |
| Contacto con equipos | **Decidido el 4-nov-2026:** la solicitud va a la líder del equipo, con el mismo consentimiento y canal simulado | Revisar con el responsable al tener datos reales |
| Rúbrica con pesos | **Decidido y hecho el 4-nov-2026:** pesos opcionales por criterio (enteros de 1 a 100, suman 100). La demo usa 20/30/25/25 | Cargar la v4 en remoto (fila de versiones) |
| Plazo de la defensa | **Decidido y hecho el 4-nov-2026:** la defensa se congela al cerrar el plazo de entregas (409 `plazo_cerrado`) | Ninguna |
| Impeccable | Plugin de usuario (skill v4.8.0), fuera del repositorio. Ejecutados en la revisión del 4-nov-2026: `impeccable context` (sin `PRODUCT.md`: el trabajo fue un refinamiento de la vista existente, no un rediseño) e `impeccable detect` sobre `src/app` y `src/components` (4 avisos en `globals.css` y `layout.tsx`, archivos previos a esta rama y no modificados). `npx impeccable install` no se ha ejecutado: escribe configuración en el repo | Decidir si se crea `PRODUCT.md` (`init`) antes de cualquier rediseño; los 4 avisos quedan para el responsable del sistema visual |
| Voz de la interfaz | El update pide voseo; el README del artifact de diseño pide tuteo | Se aplica el voseo del update; el artifact no se corrige |
| Filtros de `/explorar` | **Hecho:** tipo, línea, estado y «solo demo», en el cliente (`FiltrosExplorar`). La guía de estilo decía «sin filtros en el MVP»; esa decisión queda superada por el update | Ninguno |
| E2E y revisión visual | Talento, bitácora y contactos tienen E2E solo en escritorio (`e2e/zz-demo-talento.spec.ts`). Defensa y retroalimentación no tienen E2E. No hay revisión visual registrada a 390 px y 1280 px | Añadir E2E de defensa y retroalimentación y revisar en navegador a 390 px y 1280 px |
| Next.js 16.4.0 | `next build` muestra el aviso de seguridad y se detiene la primera vez; al repetir compila | Actualización aparte, con revisión de compatibilidad (no incluida en la demo) |
| Resultados después de publicar | **Decidido y hecho el 4-nov-2026:** las evaluaciones quedan congeladas al publicar (409 `resultados_publicados`). No hay instantánea aparte: los promedios siguen calculándose desde las evaluaciones, que ya no cambian | Decidir si se guarda una instantánea (no bloquea la demo) |
| Sal de la conexión para propuestas (`RATE_LIMIT_SALT`) | En producción es obligatoria: sin ella `POST /api/propuestas` responde error (falla cerrada). En desarrollo y emulador usa una sal de prueba | Configurar `RATE_LIMIT_SALT` en Vercel con un valor aleatorio largo antes de recibir propuestas. No versionar el valor. `check:vercel-env` ya falla si falta |
| Solicitudes de contacto ya cargadas | Los ids de solicitud de contacto ahora son un resumen del uid (no revelan el uid). Las solicitudes cargadas en `c3-platform-demo` con el formato anterior quedarían huérfanas | **Hecho el 4-nov-2026** en `c3-platform-demo`: `demo-reset --apply` con respaldo y luego `seed` en modo `update` con respaldo; verificado en solo lectura (55 documentos, sin diferencias). Falta comprobar el sitio `demo.plat.c3.com.sv` (plan §8) |
| Dashboard de empresa (E2) | Falta la subnavegación (Resumen, Configuración, Participantes, Entregas, Evaluación, Talento), el CTA «Ver entregas» y «Próximos hitos» | Construir sobre el panel actual |
| Configuración del challenge por la empresa (E3) | La empresa no edita brief, fechas, elegibilidad, entregables ni criterios; las rutas de empresa no lo permiten | Decidir permisos por rol y construirlo |
| Consentimientos de la inscripción (J2, J3) | No se pide confirmar elegibilidad ni aceptar reglas y consentimiento antes de inscribirse | Añadir las confirmaciones y registrarlas en el servidor |
| Challenges demo adicionales (§4.C) | El seed tiene un solo challenge demo; el update pide 2 o 3 de dominios y estados distintos | Crear en el seed y cargar en remoto con autorización |
| Vista de auditoría para admin (E6) | No hay vista; `recordAudit` escribe los registros | Construir la vista |
| Banner «Entorno de demostración» | No existe | Añadir cuando el entorno demo esté definido |
| Progreso y estado de evaluación en Mi challenge (J4, J8) | Evaluación y Resultado aparecen fijos en «pendiente» (`EntregaPanel.tsx`); no se muestra el estado de evaluación ni el puntaje por criterio | Conectar con el estado real |
| Comentarios del jurado | No existen, separados del feedback publicable | Decidir y construir |
| Índices de Firestore (§4.D) | `firestore.indexes.json` no tiene prueba que valide las consultas del tablero | Añadir prueba o script |
| E2E pendientes | Faltan recorridos completos de empresa, defensa, retroalimentación y contacto; el acceso cruzado entre organizaciones solo lo prueba el emulador | Escribir los E2E |
| Revisión visual y accesibilidad | Sin revisión registrada a 390 y 1280 px de pantallas autenticadas, ni accesibilidad de talento | Hacer la revisión |
| Ensayo y capturas de respaldo | Sin ensayo cronometrado ni capturas de pantallas con sesión | Ensayar con el guion |
| Impeccable: PRODUCT.md y pase visual (Task 1) | Sin `PRODUCT.md` ni `DESIGN.md` | Decidir con el responsable |
| Zona horaria en fechas de cierre (B.1) | No se muestra la zona horaria | Añadirla en `formatDateTime` |
| Estados de «/explorar» | El update pide Abierto, Concluido y Demo; el código tiene Abierto, Próximo, Concluido y una casilla de demo | Alinear con el responsable |
| Comandos `seed:dry-run` y `seed:apply` | `package.json` no pasa `--project`; el seed falla sin argumentos | Usar las líneas completas de la sección de comandos del seed en el [README](../README.md) (con `--project`, `--confirm-project` y `--allow-write`). Cambiar `package.json` solo por decisión del responsable |

## Prioridad alta — estabilidad y experiencia de producto

| Asunto | Situación conocida | Para cerrar |
| --- | --- | --- |
| Usabilidad con personas | La arquitectura de navegación (decisiones D1–D10 de la [auditoría](AUDITORIA-NAVEGACION-2026-10.md)) está implementada y verificada con pruebas técnicas, **no con personas**: faltan tareas guiadas por rol (participante, jurado, representante, admin) y una auditoría con lector de pantalla y dispositivos reales | Prueba con 4–5 personas por rol midiendo pasos y errores ([PLAN-CONSTRUCCION](PLAN-CONSTRUCCION.md), «Métricas»); revisión visual a 390 y 1280 px por el responsable |
| Aviso de seguridad de Next.js | `next build` (16.4.0) muestra un aviso de versión afectada por una vulnerabilidad conocida y, la primera vez de cada tanda, **se detiene** y pide repetir el comando (el CI no se vio afectado). No se actualizó nada | Decidir y planificar la actualización como tarea aparte, con revisión de compatibilidad; hasta entonces repetir `npm run build` si se detiene |
| Validación integral | CI verde por PR sobre `dev` (typecheck, lint, unitarias, reglas con emulador y E2E de escritorio y móvil). Las pruebas de versiones revisadas no sustituyen una ejecución actual | Repetir el CI sobre `dev` y `main` en cada promoción |
| Espacio local | El disco C: de esta máquina queda con ~1–2 GB libres tras instalar dependencias y compilar | Recuperar espacio antes de instalar o compilar; verificar con `df` |
| Perfil público: menores e imagen | El perfil público compartible está implementado (opt-in, privado por defecto, centro de estudio oculto por defecto, sin datos privados). **No hay edad en el modelo**: no se puede distinguir a una persona menor, y el texto legal no está aprobado | Validar con asesoría local el tratamiento de menores, nombre e imagen antes de datos reales; decidir si se exige consentimiento de tutor o una edad mínima para activarlo |
| Rutas antiguas de evaluación | `/evaluar/[id]` y `/empresa/retos/[id]/evaluacion` redirigen (307) a `/mi-c3/evaluar/[id]` para no romper enlaces ya enviados | Retirarlas cuando no queden invitaciones vigentes |
| Admin en móvil | Funcional (menú plegable) pero optimizado para escritorio, según la decisión D5 | Revisar si el equipo opera Admin desde teléfono; si no, mantener |

## Repositorio, despliegue y ambientes

- **Ramas oficiales (`dev` sincronizada con `main` el 26-10-2026):** `dev` para integración y pruebas, `main` para producción; PR de trabajo a `dev` y promoción de `dev` a `main`. Un solo checkout, sin worktrees.
- **Visibilidad deseada:** repositorio canónico **privado**. El remoto actualmente identificado es `C3-SV/c3-platform-starter` y se reportó como **público**. Antes de hacerlo privado, comprobar compatibilidad, costos y permisos reales del despliegue Vercel. No cambiar repositorio, plan ni visibilidad sin decisión del responsable.
- **CI:** `.github/workflows/ci.yml` ejecuta PR y push a `main` y a `dev`.
- **Mantenimiento del flujo Git:** retirar, mediante cambio acotado y revisado, `npm run worktree` y el script `scripts/worktree.mjs` para que las herramientas coincidan con la política de un checkout.
- **Firebase real:** revisar configuración actual del proyecto `c3-platform-demo`, Web App, Auth, reglas/índices y variables públicas/privadas de Vercel. No hacer cambios remotos sin autorización; entorno de desarrollo usa emuladores `demo-c3-platform`.
- Confirmar procedimiento de asignación, revocación y auditoría del claim `c3Admin`, así como controles operativos de administradores en el piloto.

## Privacidad, legal y datos reales

- Acordar y validar aviso de privacidad, términos, tratamiento de menores, permisos de imagen/nombre y propiedad intelectual de soluciones, con asesoría local cuando corresponda.
- Aprobar retención, anonimización y eliminación de cuentas sin borrar evidencia oficial indebidamente.
- Revisar anti-spam, privacidad y retención del formulario público de propuestas; no debilitar validaciones del servidor.
- No migrar datos personales de Copa 2026 o Hackathon de Turismo Creativo sin inventario de fuentes, consentimiento/base legal y plan de migración autorizado.
- Evaluar y validar con emuladores casos de permisos negativos y revocaciones: participación ajena, empresa sin vínculo, jurado revocado, resultado no publicado.

## Piloto y funcionalidades deliberadamente fuera de alcance

- Definir empresa, challenge, responsables, audiencia, fechas, métricas, soporte y criterios de éxito del piloto.
- La respuesta de empresa a propuestas que requieren ajustes se gestiona por correo; un flujo interno no está implementado.
- Comentarios de jurados, filtros avanzados, automatizaciones y eliminación de cuenta requieren decisiones independientes.
- La «Bitácora de producto y especificaciones del MVP v2.2» citada por el paquete de diseño no figura en este repositorio. Localizarla o formalizar reglas de producto verificadas; nunca suponer contenido.

## Seguimiento

Por cada decisión registrar en su PR o issue: responsable, alcance acordado, criterio de aceptación y prueba. Si no hay decisión, mantenerla aquí sin presentarla como funcionalidad completada.
