# Pendientes y decisiones abiertas — C3 Platform

Solo lo que sigue abierto. Al resolver un asunto, quitarlo; la historia queda en el [plan de la demo](superpowers/plans/2026-11-03-c3-challenges-demo.md). El alcance implementado y las rutas están en el [README](../README.md).

## Demo del 4-nov-2026

Cerrado: las reglas y funciones del [update](UPDATE-2026-11-03-demo-integral.md) que se podían construir, y la carga del seed v5 en `c3-platform-demo`.

| Asunto | Situación | Para cerrar |
| --- | --- | --- |
| Sitio demo | `demo.plat.c3.com.sv` no se ha recorrido con las tres cuentas ni se confirmó que lee `c3-platform-demo`. El check de Vercel del PR #20 llegó a fallar y no se leyó su log | Recorrido con las cuentas demo; revisar el log en Vercel |
| Firebase de la demo | Borrar `c3-challenges-demo` (creado por error); rotar la clave de la cuenta de servicio y sacarla de carpetas sincronizadas; rotar la contraseña demo que apareció en una sesión | Responsable (manual) |
| Dashboard de empresa (E2) | Hay subnavegación, hito, paquete y perfiles de interés. Participantes, Entregas y Evaluación no son secciones propias | Decidir si se separan |
| Configuración del challenge (E3) | Edita resumen, problema, entregables, cierre y rúbrica (esta, sin entregas). No edita modalidad ni equipos. Una representante que también es jurado puede configurar | Definir el rol de jurado y si la empresa edita modalidad y equipos |
| Resultados | Quedan congeladas las evaluaciones al publicar; no hay instantánea aparte | Decidir si se guarda una |
| E2E | Faltan recorridos completos de empresa, defensa, retroalimentación y contacto; el acceso entre organizaciones solo lo prueba el emulador | Escribirlos |
| Revisión visual y accesibilidad | Sin revisión a 390 y 1280 px de las pantallas con sesión ni accesibilidad de talento (aplazada por el responsable) | Hacerla |
| Ensayo | Sin ensayo cronometrado ni capturas de respaldo de pantallas con sesión | Ensayar con el guion de [docs/demo](demo/README.md) |
| Impeccable | Sin `PRODUCT.md` ni `DESIGN.md`; `npx impeccable install` no se ejecutó | Decidir `init` con el responsable |
| Diferencias menores con el update | La zona horaria solo se muestra en el detalle del challenge y en el panel de empresa; `/explorar` ofrece Abierto, Próximo y Concluido (el update pide Abierto, Concluido y Demo); bitácora y defensa en un challenge no publicado responden 404 (el update pide 409) | Alinear con el responsable |
| Scripts del seed | `seed:dry-run` y `seed:apply` de `package.json` no pasan `--project` | Usar las líneas completas del README; cambiar `package.json` solo por decisión del responsable |
| Next.js 16.4.0 | `next build` muestra un aviso de seguridad y se detiene de forma intermitente; al repetir compila | Actualización aparte con revisión de compatibilidad |
| Voz de la interfaz | Decisión del 4-nov-2026: «tú» (D11 de [PRODUCTO](PRODUCTO-Y-NAVEGACION.md)); reemplaza el voseo del update. El sitio público ya migró; la app, la consola y los mensajes del servidor siguen en voseo | Migrar en cada fase del rediseño visual |
| Rediseño visual por fases | Sitio público implementado (rama `feat/public-pages-redesign`). Faltan participante, empresa y consola; el canvas de empresa es anterior a la evaluación por la representante (#27) | Actualizar ese canvas e implementar fase por fase |

## Estabilidad y producto

| Asunto | Situación | Para cerrar |
| --- | --- | --- |
| Usabilidad con personas | La navegación (D1–D10 de [PRODUCTO](PRODUCTO-Y-NAVEGACION.md)) está verificada con pruebas técnicas, no con personas: faltan tareas guiadas por rol y una auditoría con lector de pantalla y dispositivos reales | Prueba con 4–5 personas por rol ([PLAN-CONSTRUCCION](PLAN-CONSTRUCCION.md), «Métricas») |
| Perfil público: menores e imagen | Implementado (opt-in, privado por defecto, centro de estudio oculto). No hay edad en el modelo y el texto legal no está aprobado | Validar con asesoría local menores, nombre e imagen; decidir consentimiento de tutor o edad mínima |
| Rutas antiguas de evaluación | `/evaluar/[id]` y `/empresa/retos/[id]/evaluacion` redirigen (307) a `/mi-c3/evaluar/[id]` | Retirarlas sin invitaciones vigentes |
| Admin en móvil | Funcional (menú plegable) y optimizado para escritorio (D5) | Mantener salvo que el equipo opere desde teléfono |
| Validación integral | Las pruebas de versiones anteriores no sustituyen una ejecución actual | Repetir el CI en `dev` y `main` en cada promoción |

## Repositorio, despliegue y ambientes

- **Ramas:** `dev` integra y prueba; `main` es producción. Un solo checkout, sin worktrees. CI en PR y en push a `main` y `dev`.
- **Visibilidad:** el repo `C3-SV/c3-platform-starter` es público y la meta es hacerlo privado; antes, comprobar compatibilidad, costos y permisos del despliegue en Vercel. No cambiar repositorio, plan ni visibilidad sin decisión del responsable.
- **Flujo Git:** retirar, con un cambio acotado, `npm run worktree` y `scripts/worktree.mjs` para que las herramientas coincidan con la política.
- **Firebase real:** revisar la configuración del proyecto `c3-platform-demo` (Web App, Auth, reglas, índices y variables de Vercel). Sin cambios remotos sin autorización.
- **Claim `c3Admin`:** confirmar el procedimiento de asignación, revocación y auditoría, y los controles operativos para el piloto.

## Privacidad, legal y datos reales

- Aviso de privacidad, términos, tratamiento de menores, permisos de imagen y nombre, y propiedad intelectual de las soluciones, con asesoría local.
- Retención, anonimización y eliminación de cuentas sin borrar evidencia oficial indebidamente.
- Canal de contacto real tras la aceptación (hoy simulado) y su retención.
- Anti-spam, privacidad y retención del formulario público de propuestas; no debilitar las validaciones del servidor.
- No migrar datos personales de Copa 2026 ni del Hackathon de Turismo Creativo sin inventario de fuentes, base legal y plan autorizado.
- Casos negativos de permisos y revocaciones en emulador: participación ajena, empresa sin vínculo, jurado revocado, resultado no publicado.

## Piloto y fuera de alcance

- Definir empresa, challenge, responsables, audiencia, fechas, métricas, soporte y criterios de éxito del piloto.
- La respuesta de la empresa a ajustes pedidos en una propuesta se gestiona por correo; no hay flujo interno.
- Filtros avanzados, automatizaciones y eliminación de cuenta requieren decisiones independientes.
- La «Bitácora de producto y especificaciones del MVP v2.2» que cita el paquete de diseño no está en el repositorio: localizarla o formalizar reglas verificadas; nunca suponer su contenido.

Por cada decisión, registrar en su PR o issue: responsable, alcance, criterio de aceptación y prueba. Sin decisión, el asunto se queda aquí y no se presenta como funcionalidad completada.
