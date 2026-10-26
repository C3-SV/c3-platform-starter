# AGENTS.md — Guía de trabajo de C3 Platform

**Aplicación a todo el repositorio.** Instrucciones para Codex, Claude Code y cualquier agente de desarrollo. `CLAUDE.md` importa esta guía y añade únicamente instrucciones específicas de Claude Code. No generar documentos paralelos que la contradigan.

## Inicio rápido y fuentes

1. Leer este archivo; para ejecutar tareas seguir [docs/FLUJO-AGENTES.md](docs/FLUJO-AGENTES.md).
2. Consultar [README.md](README.md) para alcance implementado, rutas, instalación y modelo de datos.
3. Consultar [docs/PRODUCTO-Y-NAVEGACION.md](docs/PRODUCTO-Y-NAVEGACION.md) antes de modificar páginas, menús, recorridos o rutas.
4. Consultar [docs/PENDIENTES-REALES.md](docs/PENDIENTES-REALES.md) para decisiones abiertas y bloqueos del piloto.
5. Consultar [docs/PLAN-CONSTRUCCION.md](docs/PLAN-CONSTRUCCION.md) para validación integral y prioridades; [docs/CONTRATO-CLAUDE.md](docs/CONTRATO-CLAUDE.md) para integración visual.

No asumir que un documento o prueba describe la última ejecución sin verificarla. **El código determina qué existe; los requisitos y permisos aprobados determinan qué se permite.** Si hay discrepancia, reportarla antes de alterar reglas de negocio.

## 1. Producto y alcance

C3 Platform materializa **Compite · Crea · Conecta**. Su experiencia central incluye descubrir experiencias y retos, inscribirse, participar, entregar soluciones, evaluar y publicar resultados, con trayectoria de la persona y espacio para empresas. **C3 Challenges** es la denominación provisional del producto de retos.

Roles/recorridos: visitante; participante individual o en equipo; jurado; representante de empresa; administrador C3. Las vistas V01–V12 del diseño son **capacidades y referencias visuales**, no equivalen a rutas ni están todas resueltas con el mismo layout. Las rutas efectivas están en README y deben revisarse junto a la navegación real.

No implementar sin decisión explícita: pagos, subida de archivos, autojuez, CRM, mensajería, bolsa de empleo, nuevas certificaciones o migración de datos personales históricos de Copa y HTC. No confundir una demo funcional con un piloto autorizado con datos reales.

## 2. Estado verificable de implementación

- El repositorio incluye acceso, catálogo, experiencias, retos, inscripciones individuales y por equipos, entregas de texto/enlaces, propuestas, Mi C3, Cuenta, trayectoria, espacio de empresa, jurados, evaluaciones, resultados, páginas Compite/Crea/Conecta y administración. **La presencia de una ruta o componente no acredita que su UX sea satisfactoria o que todo funcione en producción.**
- Verificar capacidad y permisos con código, emuladores y pruebas específicas. El README describe los contratos conocidos; las decisiones pendientes están en PENDIENTES-REALES.
- **Estado de calidad:** consultar el último CI y las incidencias abiertas en [PENDIENTES-REALES](docs/PENDIENTES-REALES.md). No adjudicar causas sin reproducir ni afirmar que una suite pasó sin ejecución.
- La navegación e interfaz requieren revisión integral por rol: [docs/PRODUCTO-Y-NAVEGACION.md](docs/PRODUCTO-Y-NAVEGACION.md). No rediseñar pantalla por pantalla sin acordar antes la arquitectura de información.

## 3. Stack y arquitectura

Next.js **16.4.0** App Router, React **19.3.0**, TypeScript **~5.9.3** estricto; Firebase Auth y Cloud Firestore con SDK cliente `firebase` **13.0.0** y Admin SDK `firebase-admin` **14.5.0** en servidor; Node >=22, Java 21 para emuladores; Playwright, node:test y pruebas de reglas. El sistema visual está basado en `diseno-claude/tokens/tokens.css`, importado desde `src/app/globals.css`.

| Área | Ruta | Límite |
| --- | --- | --- |
| UI y rutas | `src/app/`, `src/components/` | No acceder a Firestore directamente desde cliente ni importar `lib/server`/Admin en componentes cliente |
| Dominio | `src/lib/domain/` | Reglas, entidades y validaciones puras |
| API | `src/app/api/` | Identidad, autorización, validación y respuestas |
| Servicios | `src/lib/server/` | Acceso a datos y reglas transaccionales; sin React |
| Firebase | `src/lib/firebase/` | Cliente separado de Admin SDK (`server-only`) |
| Sesión y API cliente | `src/lib/auth/`, `src/lib/client/` | Adjuntar token y gestionar estado de sesión |
| Pruebas | `tests/unit/`, `tests/emulator/`, `e2e/` | Dominio, permisos y recorridos |
| Diseño | `diseno-claude/` | Referencia y tokens; no backend ni políticas de permisos |

Los componentes de **servidor** sin `use client` pueden invocar servicios de servidor para datos públicos con autorización/filtro apropiado. No convertirlos en componentes cliente sin revisar dependencias y datos expuestos.

## 4. Límites y estándares de implementación

- Reutilizar contratos, componentes y estilos existentes antes de crear otros. Evitar duplicar Auth, Firebase, modelos o sistemas de diseño. Preferir cambios pequeños, coherentes y reversibles.
- Mantener TypeScript estricto, manejo de errores y mensajes reales, formularios accesibles, estados de carga, vacío y falta de permisos.
- Tokens `--c3-*` y vocabulario coherente de estado; nada de botones sin función ni confirmaciones de operaciones que no persistieron.
- Validar **390 px y 1280 px**. Un marco móvil centrado en escritorio no sustituye un panel de escritorio útil; evaluar cada caso según tarea y rol.
- No introducir paquetes, frameworks ni servicios externos sin necesidad argumentada y autorización para implicaciones de seguridad/costos.
- No generar rutas o pantallas nuevas sin registrar rol, tarea, punto de entrada, salida, retorno, menú y criterios de aceptación en PRODUCTO-Y-NAVEGACION.

## 5. Fuentes de documentación y precedencia

- **Seguridad/reglas aprobadas:** esta guía y contratos de dominio respaldados por código/pruebas. Ningún comportamiento inseguro actual prevalece sobre las restricciones explícitas.
- **Estado implementado:** código y pruebas reproducibles; README aporta mapa de rutas y modelo de datos.
- **Operación:** FLUJO-AGENTES; **producto y UX:** PRODUCTO-Y-NAVEGACION; **bloqueos:** PENDIENTES-REALES.
- **Diseño:** `diseno-claude/` y CONTRATO-CLAUDE; si difiere del producto, investigar y proponer, no copiar sin revisión.
- **Planes técnicos fechados:** `docs/superpowers/` sirven como respaldo de decisiones técnicas que deben contrastarse con el código. **`graphify-out/` es un índice, no fuente de verdad.**

No usar especificaciones no disponibles como fuente de verdad; las dependencias documentales no localizadas se registran en [PENDIENTES-REALES](docs/PENDIENTES-REALES.md).

## 6. Reglas de negocio y restricciones críticas

- No cambiar reglas de negocio sin revisar su impacto en estados de entrega, equipos, evaluación y publicación.
- **Experiencias y retos:** un reto es público solo si su experiencia está publicada. Una experiencia concluida es histórica: no se reabre, no recibe retos ni revisiones. Una cancelada conserva su calendario. Con retos o inscripciones, el tipo queda bloqueado.
- **Inscripciones:** una por persona y experiencia, con estados `pending`, `approved`, `rejected` y `cancelled`. Solo se crean con la ventana abierta y cupo disponible; el servidor lo verifica dentro de la transacción. Si la experiencia no tiene retos, la inscripción es a la experiencia misma y es individual.
- **Equipos:** cada persona tiene un solo equipo por experiencia. El código `C3-XXXX` es único. Todo cambio de equipo se cierra al cierre de inscripciones o al enviar la entrega.
- **Entregas:** solo con inscripción aprobada y antes del cierre de entregas. Una entrega enviada queda estable. Un borrador vencido pasa a «Fuera de plazo». En equipo, solo la líder guarda o envía.
- **Evaluación:** solo después del cierre de entregas. Las soluciones se muestran anónimas («Solución 1», «Solución 2»…). Cada criterio recibe un entero dentro de su máximo. Un jurado finaliza una evaluación una sola vez.
- **Resultados:** promedio simple de los jurados con un decimal. La publicación por C3 queda bloqueada hasta que cada solución tenga dos evaluaciones finalizadas de jurados distintos.
- **Propuestas sin cuenta:** cualquier empresa puede proponer. Hay campo trampa, límite de 5 propuestas por hora y conexión (solo se guarda un hash con sal, nunca la IP) y la confirmación aparece solo si la propuesta quedó guardada. No añadas endpoints públicos sin estas defensas.
- **Trayectoria:** la registra C3 y la persona no la edita. Los resultados oficiales no se modifican desde Cuenta.
- **Cuenta:** la eliminación de cuentas no se habilita hasta definir la retención o anonimización de participaciones, entregas, evaluaciones y resultados.
- **No simular funciones.** Un botón navega o ejecuta una operación real. No confirmes éxito antes de persistir. Lo no implementado se marca «Próximamente».
- **Datos históricos:** no migrar usuarios, participantes, equipos, entregas ni resultados de Copa 2026 ni de Hackathon Turismo Creativo sin fuentes, privacidad y plan aprobados.

## 7. Seguridad, autorización, privacidad y Firebase

- **Identidad:** cada ruta privada verifica el token de Firebase con el Admin SDK (`Authorization: Bearer`). `/api/health` es la única ruta pública que no toca datos.
- **Permisos:** claim `c3Admin` (asignado solo desde el servidor con `scripts/grant-admin.mjs`), vínculos de jurado y representante hechos por C3, y propiedad del recurso. Toda ruta nueva necesita al menos una prueba negativa de autorización.
- **Firestore:** `firestore.rules` deniega todo. Las lecturas públicas pasan por el servidor, que filtra campos internos (autor, borradores, notas). No abras lecturas directas sin reglas por campo y pruebas en emulador.
- **Secretos:** nunca versionar ni imprimir `.env*` (salvo `.env.example`), service accounts ni claves privadas. Solo `NEXT_PUBLIC_*` llega al navegador. Credenciales del Admin SDK en Vercel: `GOOGLE_CLOUD_PROJECT` y `FIREBASE_SERVICE_ACCOUNT_JSON`, o el trío `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`.
- **Credenciales de prueba:** las contraseñas de `e2e/` y `tests/` son de emulador. No reutilizarlas contra un proyecto real.
- **Entornos:** local = proyecto `demo-c3-platform` con emuladores (Auth 9099, Firestore 8080, UI 4000; E2E en 3100). Proyecto Firebase real identificado = `c3-platform-demo`; comprobar su configuración antes de operar. Sin escrituras, seeds, reglas, índices ni despliegues sobre el remoto sin autorización explícita. No mezclar ambos; `npm run doctor` indica a cuál apunta el entorno.
- **Privacidad:** minimizar datos personales. La bitácora `auditLog` no guarda datos personales. Hay usuarios menores de edad; el tratamiento está pendiente de texto legal (ver PENDIENTES).
- **Antes de datos reales:** aviso de privacidad, términos, tratamiento de menores, permisos de imagen y nombre, propiedad intelectual de soluciones, defensas anti-spam de propuestas y política de retención. Todo en PENDIENTES.
- **Migraciones:** sin migraciones destructivas, ni sobre datos personales históricos, antes de un plan de verificación, autorización y migración.
- **Repositorio:** sin `push`, force push ni reescritura de historial salvo orden expresa. El repositorio actual es público; la transición a privado es una decisión de infraestructura, no una acción automática del agente.

## 8. Flujo obligatorio de agentes

**Inspeccionar → planificar → implementar → verificar → documentar → reportar.**

1. Antes de escribir: `git status`, `git branch --show-current`, `npm run doctor` si el entorno está disponible; leer documentos y código afectados.
2. Si la solicitud es **auditoría/análisis**, no modificar código ni rutas. Entregar hallazgos diferenciando evidencia, hipótesis y propuesta.
3. Para implementar: describir el recorrido afectado, sus permisos, cambios mínimos, pruebas y riesgos. No decidir cuestiones funcionales críticas por su cuenta.
4. Una persona/agente modifica el checkout a la vez. Coordinar trabajo paralelo mediante ramas secuenciales o PR, no múltiples carpetas o agentes escribiendo los mismos archivos.
5. Ejecutar las comprobaciones que correspondan. Declarar qué se ejecutó y qué no; nunca ocultar fallos ni alterar pruebas únicamente para poner CI en verde.
6. Entregar handoff conciso: propósito, archivos, comportamiento, pruebas con resultados, pendientes y riesgos. No crear bitácoras de progreso duplicadas.

## 9. Git y entornos — política vigente

**Un único checkout local del repositorio. Se cambia de rama con `git switch`, sin crear worktrees ni carpetas adicionales.** La ubicación o el nombre de la carpeta local no determina la rama ni el despliegue.

- **`main`: producción.** Solo se actualiza al promover cambios probados desde `dev` mediante pull request aprobada.
- **`dev`: integración y pruebas.** Es la base cotidiana de desarrollo. Las funcionalidades y correcciones parten de `dev` actualizado y vuelven a `dev` por PR.
- **`feat/*`, `fix/*`, `docs/*`, `chore/*`:** ramas temporales para un objetivo acotado; no mantienen carpetas independientes.
- Inicio habitual: `git status`; `git fetch origin`; `git switch dev`; `git pull --ff-only origin dev`; `git switch -c feat/tema` (o prefijo adecuado). Hacerlo solo con árbol de trabajo limpio o cambios preservados.
- Flujo de integración: `feat/*` → PR `dev` → pruebas y revisión → PR `dev` → `main` tras validación de release. Hotfix urgente a `main` requiere plan de sincronización hacia `dev`.
- El CI (`.github/workflows/ci.yml`) se ejecuta en cada PR y en cada push a `main` y a `dev`. Aun así, leer el resultado del run concreto antes de dar por comprobada una rama.
- Commits descriptivos y pequeños (`feat:`, `fix:`, `docs:`, `test:`). No hacer commit, push, despliegue ni borrar ramas sin la autorización correspondiente a la tarea.
- No ejecutar `git reset --hard`, `git clean -fd`, `push --force`, `branch -D`, reescritura de historial ni borrados de carpetas/archivos sin autorización expresa y respaldo de lo importante.
- **No usar `npm run worktree` ni `git worktree add`.** La limpieza de cualquier script fuera de política debe plantearse como mantenimiento explícito, no ejecutarse durante una tarea de producto.
- Repositorio remoto de referencia: `C3-SV/c3-platform-starter`. **La meta es hacerlo privado**, pero la visibilidad actual y su relación con Vercel deben resolverse antes de cambiar la configuración. No cambiar repositorio ni visibilidad automáticamente.

## 10. Seguridad de entornos y datos

- Desarrollo local con `demo-c3-platform` y emuladores Firebase. El proyecto `c3-platform-demo` es real y está fuera del alcance de operaciones por defecto.
- No guardar credenciales en documentación, commits, logs ni respuestas del agente. `.env.local`, `.vercel/` y archivos ignorados pueden ser importantes localmente; respaldarlos antes de reorganizar carpetas.
- No acceder ni modificar datos reales, ni desplegar reglas/índices ni ejecutar seeds remotos, sin autorización explícita y verificación del proyecto destino.
- Propuestas públicas y usuarios menores requieren tratamiento responsable de datos; cumplir las barreras de la §7 y PENDIENTES-REALES.

## 11. Matriz de pruebas

| Tipo de cambio | Mínimo requerido |
| --- | --- |
| Documentación | Validación de enlaces, exactitud contra scripts/código, consistencia entre guías |
| Frontend | `npm run typecheck`, `npm run lint` y revisión responsive / accesibilidad afectada |
| Dominio | `npm run check` y unitarias pertinentes |
| API, autenticación, permisos o Firestore | `npm run check`, `npm run test:rules` y casos negativos |
| Recorrido completo | E2E pertinente en escritorio y móvil; prueba manual si corresponde |
| Promoción a `main` | Suite completa `npm run check`, `npm run test:rules`, `npm run test:e2e` y CI verificado en PR |

Scripts exactos en `package.json` y README. Las pruebas de Firebase usan emuladores y Java 21. Ejecutar E2E requiere dependencias y navegador instalados.

## 12. Definition of Done

Una tarea está lista cuando su objetivo y recorrido funcionan, no se rompen permisos ni datos, muestra estados vacíos/carga/error, se verificó móvil/escritorio, se ejecutaron las pruebas adecuadas y quedó documentado lo afectado. La PR hacia `dev` explica las excepciones y resultados reales; **no promover a `main` con fallos de verificación sin una decisión explícita y justificada**. Una demo visual no cuenta como implementación funcional.

## 13. Mantenimiento de la documentación

- Rutas, capacidades, entidades o scripts → actualizar README y, cuando aplique, PRODUCTO-Y-NAVEGACION.
- Cambios en Git, CI, emuladores o protocolo del agente → AGENTS y FLUJO-AGENTES.
- Permisos y reglas de negocio → AGENTS §6–7 y pruebas relevantes.
- Pendientes y riesgos → PENDIENTES-REALES, con responsable/condición de cierre cuando se conozcan.
- Decisiones visuales → `diseno-claude/` y CONTRATO-CLAUDE, respetando la fuente de los diseños.
- Evitar duplicar extensamente los mismos inventarios; enlazar la fuente responsable. Verificar enlaces Markdown tras renombrar.

## 14. Skills y ayudas

Las skills fijadas por `skills-lock.json` en `.agents/skills/` y `.claude/skills/` incluyen Firebase Auth, Firestore, auditoría de reglas y buenas prácticas de React/Next. Consultarlas cuando apliquen; no instalar terceros sin revisar licencias/origen. `graphify-out/GRAPH_REPORT.md` puede orientar búsquedas, pero confirmar siempre en el código.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
