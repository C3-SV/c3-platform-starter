# AGENTS.md — Guía de trabajo de C3 Platform

**Aplica a todo el repositorio** (Codex, Claude Code y cualquier agente). `CLAUDE.md` la importa y añade solo lo específico de Claude Code. No generar documentos paralelos que la contradigan.

## Fuentes y precedencia

1. Esta guía y [docs/FLUJO-AGENTES.md](docs/FLUJO-AGENTES.md) para ejecutar tareas.
2. [README](README.md): alcance, rutas, instalación y modelo de datos.
3. [docs/PRODUCTO-Y-NAVEGACION.md](docs/PRODUCTO-Y-NAVEGACION.md): antes de tocar páginas, menús, recorridos o rutas.
4. [docs/PENDIENTES-REALES.md](docs/PENDIENTES-REALES.md): decisiones abiertas y bloqueos.
5. [docs/PLAN-CONSTRUCCION.md](docs/PLAN-CONSTRUCCION.md) (validación) y [docs/CONTRATO-CLAUDE.md](docs/CONTRATO-CLAUDE.md) (integración visual).

**El código determina qué existe; los requisitos y permisos aprobados determinan qué se permite.** Seguridad y reglas: esta guía y los contratos de dominio respaldados por código y pruebas. Diseño: `diseno-claude/`; si difiere del producto, investigar y proponer, no copiar. `docs/superpowers/` respalda decisiones técnicas fechadas y `graphify-out/` es un índice: ninguno es fuente de verdad. No asumir que un documento o una prueba describe la última ejecución sin verificarla; ante una discrepancia, reportarla antes de alterar reglas. No usar especificaciones no disponibles: registrar la dependencia en PENDIENTES.

## 1. Producto y alcance

C3 Platform materializa **Compite · Crea · Conecta**: descubrir experiencias y challenges, inscribirse, participar, entregar, evaluar y publicar resultados, con trayectoria de la persona y espacio para empresas. **C3 Challenges** es el nombre provisional del producto de challenges.

- **Vocabulario:** «challenge» es el término oficial en interfaz, mensajes y documentos (D8, 26-10-2026). Las direcciones e identificadores técnicos (`/retos/…`, `challengeId`, colecciones) no cambian.
- **Propuesta vigente** ([update del 3-nov-2026](docs/UPDATE-2026-11-03-demo-integral.md)): **talento primero**. La empresa paga por challenge para observar capacidades de talento joven mediante evidencia (entregable, proceso y defensa), no para «recibir soluciones». Un challenge empresarial es de **Conecta** (Crea como línea secundaria si aplica). Paquetes de referencia por proyecto: Esencial US$800, Completo US$1,500, Destacado US$3,000; sin suscripción, checkout ni contratación garantizada. La interfaz usa «tú» y marca los datos inventados como **DEMO**.
- **Roles:** visitante; participante individual o en equipo; jurado; representante de empresa; administrador C3. Las vistas V01–V12 son capacidades y referencias visuales, no 12 rutas. Las rutas efectivas están en el README.
- **No implementar sin decisión explícita:** pagos, subida de archivos, autojuez, CRM, mensajería, bolsa de empleo, nuevas certificaciones ni migración de datos personales históricos de Copa y HTC. Una demo funcional no es un piloto autorizado con datos reales.

## 2. Estado y calidad

La presencia de una ruta o componente no acredita que su UX sea satisfactoria o que funcione en producción: verificarlo con código, emuladores y pruebas. Consultar el último CI y las incidencias en PENDIENTES; no adjudicar causas sin reproducir ni afirmar que una suite pasó sin ejecutarla. No rediseñar pantalla por pantalla sin acordar antes la arquitectura de información.

## 3. Stack y arquitectura

Next.js **16.4.0** (App Router), React **19.3.0**, TypeScript **~5.9.3** estricto; Firebase Auth y Firestore con `firebase` **13.0.0** (cliente) y `firebase-admin` **14.5.0** (servidor); Node >=22, Java 21 para emuladores; Playwright, `node:test` y pruebas de reglas. Sistema visual: `diseno-claude/tokens/tokens.css`, importado desde `src/app/globals.css`.

| Área | Ruta | Límite |
| --- | --- | --- |
| UI y rutas | `src/app/`, `src/components/` | No acceder a Firestore desde el cliente ni importar `lib/server`/Admin en componentes cliente |
| Dominio | `src/lib/domain/` | Reglas, entidades y validaciones puras |
| API | `src/app/api/` | Identidad, autorización, validación y respuestas |
| Servicios | `src/lib/server/` | Acceso a datos y reglas transaccionales; sin React |
| Firebase | `src/lib/firebase/` | Cliente separado del Admin SDK (`server-only`) |
| Sesión y API cliente | `src/lib/auth/`, `src/lib/client/` | Adjuntar token y gestionar la sesión |
| Pruebas | `tests/unit/`, `tests/emulator/`, `e2e/` | Dominio, permisos y recorridos |
| Diseño | `diseno-claude/` | Referencia y tokens; no backend ni permisos |

Los componentes de **servidor** sin `use client` pueden invocar servicios para datos públicos con el filtro adecuado; no convertirlos en cliente sin revisar dependencias y datos expuestos.

## 4. Estándares de implementación

- Reutilizar contratos, componentes y estilos antes de crear otros. Cambios pequeños, coherentes y reversibles. No duplicar Auth, Firebase, modelos ni el sistema de diseño.
- TypeScript estricto; errores y mensajes reales; formularios accesibles; estados de carga, vacío y sin permiso. Tokens `--c3-*`. Nada de botones sin función ni confirmaciones de operaciones que no persistieron.
- Validar **390 px y 1280 px**; un marco móvil centrado no sustituye un panel de escritorio útil.
- No introducir paquetes, frameworks ni servicios externos sin necesidad argumentada y autorización para sus implicaciones de seguridad y costo.
- Toda ruta o pantalla nueva se registra en PRODUCTO-Y-NAVEGACION con rol, tarea, entrada, salida, retorno, menú y criterios de aceptación.

## 5. Reglas de negocio

- No cambiar reglas sin revisar su impacto en entregas, equipos, evaluación y publicación.
- **Experiencias y challenges:** un challenge es público solo si su experiencia está publicada. Una experiencia concluida es histórica: no se reabre ni recibe challenges o revisiones. Una cancelada conserva su calendario. Con challenges o inscripciones, el tipo queda bloqueado.
- **Inscripciones:** una por persona y experiencia (`pending`, `approved`, `rejected`, `cancelled`), solo con ventana abierta y cupo (el servidor lo verifica en la transacción). En un challenge exige confirmar la elegibilidad y aceptar las reglas (se guarda cuándo). Sin challenges, la inscripción es a la experiencia y es individual.
- **Equipos:** una persona, un equipo por experiencia; código `C3-XXXX` único. Todo cambio de equipo se cierra al cierre de inscripciones o al enviar la entrega.
- **Entregas:** solo con inscripción aprobada y antes del cierre. Una enviada puede cambiar su texto y enlaces solo hasta la primera evaluación (borrador o finalizada); después queda fija (409 `entrega_evaluada`). Su estado no cambia; un borrador vencido pasa a «Fuera de plazo». En equipo, solo la líder guarda o envía.
- **Defensa y bitácora:** la defensa es un recurso separado, solo sobre entrega enviada; en equipo la registra la líder, y se congela al cerrar el plazo de entregas. El uso de IA se declara sin juzgarlo. La bitácora solo agrega avances.
- **Evaluación:** el jurado asignado evalúa desde que el challenge y su experiencia están publicados, aunque las entregas sigan abiertas; nadie evalúa su propia solución; ve el contenido y el nombre de la persona o del equipo (decisión del 5-nov-2026); nunca el uid ni el id interno de la entrega. Publicar resultados sí exige que hayan cerrado las entregas. Cada criterio recibe un entero de 0 a su máximo; con pesos (opcional), todos los criterios los tienen, son enteros de 1 a 100 y suman 100, y el total pasa a 0–100 (demo: 20/30/25/25). Un jurado finaliza una evaluación una sola vez; la representante vinculada a la organización del challenge evalúa como jurado «empresa» sin asignación (una asignación revocada por C3 prevalece). Los comentarios del jurado son internos: solo los ve C3.
- **Resultados:** promedio simple de los jurados con un decimal; la publicación por C3 se bloquea hasta que cada solución tenga dos evaluaciones finalizadas de jurados distintos. Al publicar, las evaluaciones quedan congeladas (409 `resultados_publicados`).
- **Propuestas sin cuenta:** cualquier empresa puede proponer. Campo trampa, límite de 5 por hora y conexión (solo se guarda un hash con sal, nunca la IP) y confirmación solo si quedó guardada. No añadir endpoints públicos sin estas defensas.
- **Talento y contacto:** la lista corta es por entrega enviada, con motivo obligatorio. Una solicitud de contacto exige representante vinculada, lista corta, inscripción aprobada y entrega (individual, o de equipo a través de su líder); nace en «esperando consentimiento» y solo la persona la acepta, declina o revoca. La empresa registra «contactado» o «seguimiento» solo tras aceptar. **Ningún estado implica contratación.** En la demo, tras aceptar hay un canal simulado (mensaje interno de C3): ningún correo ni teléfono se muestra a la empresa ni a la persona. **Excepción aceptada (4-nov-2026):** la administración C3 ve el correo.
- **Configuración del challenge:** la editan la representante vinculada y C3 con el challenge publicado y antes del cierre; la rúbrica solo mientras no haya entregas. Hoy una representante que también es jurado puede.
- **Paquetes:** `src/lib/domain/commercial.ts` es la fuente única de tarifas; son de referencia, sin cobro ni contrato.
- **Trayectoria y cuenta:** la registra C3 y la persona no la edita; los resultados oficiales no se modifican desde Cuenta. La recuperación de contraseña queda «Próximamente» en la demo (sin correos). No habilitar la eliminación de cuentas hasta definir la retención o anonimización de participaciones, entregas, evaluaciones y resultados.
- **No simular funciones.** Un botón navega o ejecuta una operación real; no confirmar éxito antes de persistir; lo no implementado se marca «Próximamente».
- **Datos históricos:** no migrar usuarios, participantes, equipos, entregas ni resultados de Copa 2026 ni de Hackathon Turismo Creativo sin fuentes, privacidad y plan aprobados.

## 6. Seguridad, autorización y privacidad

- **Identidad:** toda ruta privada verifica el token de Firebase con el Admin SDK (`Authorization: Bearer`). `/api/health` es la única pública que no toca datos.
- **Capacidades:** `GET /api/me` devuelve `capabilities` (administración, organizaciones vinculadas, challenges que evalúa), siempre propias y calculadas con el uid del token. La interfaz las usa para **mostrar accesos**, nunca para autorizar: cada ruta vuelve a comprobar el permiso. No añadir parámetros que consulten capacidades ajenas.
- **Permisos:** claim `c3Admin` (solo desde el servidor con `scripts/grant-admin.mjs`), vínculos de jurado y representante hechos por C3, y propiedad del recurso. Toda ruta nueva necesita al menos una prueba negativa de autorización.
- **Tablero de talento:** a la empresa solo le llega un token opaco por fila; el uid y el id interno de la entrega no salen del servidor.
- **Perfil público:** opt-in y privado por defecto; su vista se construye solo con `buildPublicView` y datos ya públicos. Toda ampliación necesita prueba negativa de privacidad.
- **Firestore:** `firestore.rules` deniega todo; las lecturas pasan por el servidor, que filtra campos internos. Las colecciones sensibles (contactos, listas cortas, defensas, bitácora, retroalimentación, resultados, jurados, propuestas y límites) están denegadas al cliente y tienen pruebas de reglas. Decisión del 4-nov-2026: se mantiene «denegar todo y leer por servidor»; no abrir lecturas directas sin reglas por campo y pruebas en emulador.
- **Secretos:** nunca versionar ni imprimir `.env*` (salvo `.env.example`), service accounts ni claves privadas. Solo `NEXT_PUBLIC_*` llega al navegador. En Vercel: `GOOGLE_CLOUD_PROJECT` y `FIREBASE_SERVICE_ACCOUNT_JSON` (o `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) y `RATE_LIMIT_SALT`.
- **Credenciales de prueba:** las contraseñas de `e2e/` y `tests/` son de emulador; no usarlas contra un proyecto real.
- **Entornos:** local = `demo-c3-platform` con emuladores (Auth 9099, Firestore 8080, UI 4000; E2E en 3100). El proyecto real es `c3-platform-demo` y está fuera del alcance por defecto: sin escrituras, seeds, reglas, índices ni despliegues sin autorización explícita y verificación del destino. `npm run doctor` indica a cuál apunta el entorno.
- **Privacidad:** minimizar datos personales; `auditLog` no guarda datos personales. Hay usuarios menores de edad. Antes de datos reales: aviso de privacidad, términos, menores, permisos de imagen y nombre, propiedad intelectual de soluciones, anti-spam de propuestas y retención (ver PENDIENTES).
- **Migraciones:** sin migraciones destructivas ni sobre datos personales históricos antes de un plan de verificación, autorización y migración.

## 7. Flujo de agentes

**Inspeccionar → planificar → implementar → verificar → documentar → reportar.**

1. Antes de escribir: `git status`, `git branch --show-current`, `npm run doctor` si hay entorno; leer documentos y código afectados.
2. Una **auditoría o análisis** no modifica código ni rutas: entrega hallazgos separando evidencia, hipótesis y propuesta.
3. Para implementar: describir recorrido, permisos, cambios mínimos, pruebas y riesgos. No decidir por su cuenta cuestiones funcionales críticas.
4. Una persona o agente modifica el checkout a la vez; el trabajo paralelo va en ramas secuenciales o PR.
5. Ejecutar las comprobaciones que correspondan y declarar qué se ejecutó y qué no. Nunca ocultar fallos ni alterar pruebas solo para poner el CI en verde.
6. Handoff conciso: propósito, archivos, comportamiento, pruebas con resultados, pendientes y riesgos. No crear bitácoras de progreso duplicadas.

## 8. Git y entornos

**Un único checkout; se cambia de rama con `git switch`. Sin worktrees ni carpetas adicionales** (no usar `npm run worktree` ni `git worktree add`).

- **`main`:** producción; solo se actualiza por PR desde `dev` tras validación de release. **`dev`:** integración y pruebas. **`feat/*`, `fix/*`, `docs/*`, `chore/*`:** ramas temporales con un objetivo acotado, creadas desde `dev` actualizado (`git fetch origin; git switch dev; git pull --ff-only origin dev; git switch -c feat/tema`, con el árbol limpio o los cambios preservados).
- Flujo: rama → PR a `dev` → pruebas y revisión → PR `dev` → `main`. Un hotfix a `main` necesita plan de sincronización hacia `dev`.
- El CI (`.github/workflows/ci.yml`) corre en cada PR y en cada push a `main` y `dev`; leer el run concreto antes de dar por comprobada una rama.
- Commits descriptivos y pequeños (`feat:`, `fix:`, `docs:`, `test:`). Sin commit, push, despliegue ni borrado de ramas sin la autorización de la tarea. Sin `reset --hard`, `clean -fd`, `push --force`, `branch -D` ni reescritura de historial sin autorización expresa y respaldo.
- Remoto de referencia: `C3-SV/c3-platform-starter`, hoy público; la meta es hacerlo privado, y eso se decide con la relación con Vercel, no lo hace el agente.

## 9. Pruebas

| Tipo de cambio | Mínimo |
| --- | --- |
| Documentación | Enlaces válidos, exactitud contra scripts y código, coherencia entre guías |
| Frontend | `npm run typecheck`, `npm run lint` y revisión responsive y de accesibilidad afectada |
| Dominio | `npm run check` y unitarias pertinentes |
| API, permisos o Firestore | `npm run check`, `npm run test:rules` y casos negativos |
| Recorrido completo | E2E pertinente en escritorio y móvil; prueba manual si corresponde |
| Promoción a `main` | `npm run check`, `npm run test:rules`, `npm run test:e2e` y CI verificado en el PR |

Scripts exactos en `package.json` y README. Las pruebas de Firebase usan emuladores y Java 21; E2E necesita dependencias y navegador.

## 10. Definition of Done

Una tarea está lista cuando su recorrido funciona, no se rompen permisos ni datos, hay estados de vacío, carga y error, se verificó móvil y escritorio, se ejecutaron las pruebas adecuadas y quedó documentado lo afectado. El PR a `dev` explica excepciones y resultados reales; **no promover a `main` con fallos de verificación sin una decisión explícita y justificada**. Una demo visual no es una implementación funcional.

## 11. Documentación

- Rutas, capacidades, entidades o scripts → README y, si aplica, PRODUCTO-Y-NAVEGACION.
- Git, CI, emuladores o protocolo del agente → esta guía y FLUJO-AGENTES.
- Permisos y reglas de negocio → §5–6 y pruebas.
- Pendientes y riesgos → PENDIENTES-REALES, con condición de cierre.
- Decisiones visuales → `diseno-claude/` y CONTRATO-CLAUDE.
- No duplicar inventarios: enlazar a la fuente. Verificar enlaces tras renombrar.

## 12. Skills y ayudas

Las skills fijadas por `skills-lock.json` (`.agents/skills/`, `.claude/skills/`) cubren Firebase Auth, Firestore, auditoría de reglas y buenas prácticas de React/Next; consultarlas cuando apliquen y no instalar terceros sin revisar licencia y origen. `graphify-out/GRAPH_REPORT.md` orienta búsquedas, pero se confirma siempre en el código.

**Impeccable** es un plugin de usuario instalado fuera del repo. Antes de editar interfaz, ejecutar una vez por sesión `impeccable context` con su CLI (carpeta `scripts/` del plugin; en Windows, `impeccable.cmd`), y al terminar `impeccable detect <rutas>`. No ejecutar `npx impeccable install` sin revisar lo que escribe en el repo. El sistema visual de referencia es el design system «C3» (tokens en `diseno-claude/tokens/`): no crear uno nuevo.

## 13. Demo integral (4-nov-2026)

Decisiones: [UPDATE-2026-11-03](docs/UPDATE-2026-11-03-demo-integral.md). Estado y registro remoto: [plan](docs/superpowers/plans/2026-11-03-c3-challenges-demo.md). Pendientes: [PENDIENTES-REALES](docs/PENDIENTES-REALES.md).

- La demo usa **`c3-platform-demo`**, el proyecto de la cuenta del responsable. Es una **excepción explícita** decidida el 3-nov-2026: cualquier escritura (seed, cuentas, reglas) necesita autorización expresa por operación, con `--dry-run` previo.
- `apply` crea solo lo que falta y se niega ante documentos con versión anterior; `update` reemplaza campos de esos documentos (no elimina ninguno) y exige `--allow-update` y un respaldo fuera del repo (comandos en el [README](README.md)). Con conflictos, no se escribe nada. Las contraseñas de las cuentas demo nunca se guardan en el repo, en docs ni en logs.
- Todo ejemplo inventado (empresa, usuarios, challenges, entregas, puntajes) se marca **DEMO** o «Datos demostrativos».
- Antes de declarar un flujo completado: pruebas automáticas, control de acceso verificado en el emulador y recorrido en navegador. Lo no verificado se reporta como pendiente.

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
