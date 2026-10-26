# Instrucciones para agentes — C3 Platform

Guía central del repositorio para Claude Code, Codex y otros agentes. `CLAUDE.md` solo importa este archivo (`@AGENTS.md`) y añade notas específicas de Claude Code; no añadas reglas contradictorias allí.

- Procedimiento paso a paso: [docs/FLUJO-AGENTES.md](docs/FLUJO-AGENTES.md)
- Estado funcional, rutas y comandos: [README.md](README.md)
- Pendientes legales, operativos y de infraestructura: [docs/PENDIENTES-REALES.md](docs/PENDIENTES-REALES.md)
- Consolidación Git y auditoría de octubre 2026: [docs/CONSOLIDACION-GIT-2026-10.md](docs/CONSOLIDACION-GIT-2026-10.md)

Revisión: 2026-10-26, contra `origin/main` (422094f). Si cambia el estado del repositorio, actualiza esta fecha y el mapa de documentación (§5).

## Índice

1. [Contexto y propósito](#1-contexto-y-propósito)
2. [Estado real de implementación](#2-estado-real-de-implementación)
3. [Stack y mapa de arquitectura](#3-stack-y-mapa-de-arquitectura)
4. [Responsabilidades y límites de dependencias](#4-responsabilidades-y-límites-de-dependencias)
5. [Mapa de documentación y precedencia](#5-mapa-de-documentación-y-precedencia)
6. [Reglas de negocio y restricciones críticas](#6-reglas-de-negocio-y-restricciones-críticas)
7. [Seguridad, autorización, privacidad y Firebase](#7-seguridad-autorización-privacidad-y-firebase)
8. [Convenciones, calidad y reutilización](#8-convenciones-calidad-y-reutilización)
9. [Flujo para agentes](#9-flujo-para-agentes)
10. [Política Git: una carpeta de trabajo y ramas convencionales](#10-política-git-una-carpeta-de-trabajo-y-ramas-convencionales)
11. [Validaciones disponibles (package.json y CI)](#11-validaciones-disponibles-packagejson-y-ci)
12. [Criterios de aceptación y Definition of Done](#12-criterios-de-aceptación-y-definition-of-done)
13. [Sincronización de la documentación](#13-sincronización-de-la-documentación)
14. [Herramientas y skills](#14-herramientas-y-skills)

## 1. Contexto y propósito

**C3 = Compite · Crea · Conecta.** Plataforma para que personas jóvenes participen en retos y experiencias (competencias, hackathons, retos empresariales, talleres, charlas y encuentros) propuestos por empresas, con evaluación por jurados, resultados publicados y una trayectoria personal.

- **Recorridos:** participante (acceso → inscripción individual o por equipo → entrega → trayectoria); empresa (propone sin cuenta → espacio de empresa → evalúa como representante); administración C3 (`/admin`); jurado asignado (evalúa tras el cierre de entregas).
- **Vistas V01–V12:** son grupos de capacidad aprobados en el diseño, no 12 rutas. Las rutas reales están en el README.
- **Alcance del MVP:** aplicación web con emuladores de Firebase. Fuera de alcance por ahora: carga de archivos, pagos, bolsa de empleo, auto-juez, mensajería, CRM y migración de datos personales históricos (Copa 2026 y Hackathon Turismo Creativo).
- **Piloto con datos reales:** pendiente de decisiones de producto, legales y de infraestructura (ver [docs/PENDIENTES-REALES.md](docs/PENDIENTES-REALES.md)).

## 2. Estado real de implementación

El detalle vive en la sección «Estado real» del README. Resumen verificado contra el código de `origin/main` (422094f):

- **Implementado:** acceso; experiencias y retos (catálogo, ciclo de vida, cupos, bitácora `auditLog`); inscripciones individuales y por equipo con revisión de C3; Mi C3; entregas de texto y enlaces; propuestas públicas sin cuenta con límite de frecuencia; espacio de empresa; jurados y evaluación anónima; resultados; trayectoria; cuenta; administración `/admin`; landings Compite, Crea y Conecta; auditoría de accesibilidad con axe.
- **Pendiente, declarado como «Próximamente» en la interfaz:** respuesta de la empresa a los ajustes pedidos, comentarios de jurados, textos legales, reglas e índices en el proyecto real, variables de Vercel y eliminación de cuentas.
- **Estado de CI (verificado en GitHub):** en `422094f` pasan typecheck, lint, pruebas unitarias y pruebas de reglas. **Falla el paso E2E desde el 2026-10-21** (`e2e/cuenta.spec.ts:67`, escritorio y móvil). No declares «todo verde» hasta corregirlo. Detalle en [docs/CONSOLIDACION-GIT-2026-10.md](docs/CONSOLIDACION-GIT-2026-10.md).
- Los recuentos de pruebas del README (77 unitarias, 87 de reglas, 107 E2E) son de una ejecución anterior y no se han reverificado.

## 3. Stack y mapa de arquitectura

**Stack (versiones tomadas de `package.json`):**

- Next.js 16.4 con App Router y Turbopack (`turbopack.root` fijado en `next.config.ts`), React 19.3, TypeScript ~5.9 en modo estricto. Alias `@/*` → `src/*`.
- Firebase: SDK de navegador `firebase` 13 (`src/lib/firebase/client.ts`) y Admin SDK `firebase-admin` 14 (`src/lib/firebase/admin.ts`, marcado con `server-only`). Auth con correo y contraseña. Firestore accedido solo desde el servidor.
- Node 22 (`.nvmrc`, `engines >=22`). Java 21 para el emulador de Firestore.
- Pruebas: `node --test` con `--experimental-strip-types`; Playwright 1.64 (escritorio 1280 px y móvil Pixel 5); `@axe-core/playwright`; `@firebase/rules-unit-testing`.
- Hosting previsto en Vercel (`vercel-build` valida variables antes de compilar). CI no despliega a producción.
- Diseño: tokens `--c3-*` importados por `src/app/globals.css` desde `diseno-claude/tokens/tokens.css`. No hay otro framework de estilos.

**Mapa de carpetas:**

| Ruta | Responsabilidad |
| --- | --- |
| `src/app/` | Páginas (App Router) y estilos globales |
| `src/app/api/` | Rutas de servidor. Cada una verifica token, permisos y propiedad antes de tocar datos |
| `src/components/` | UI compartida (cabecera, marco móvil, estados, CTA de inscripción) |
| `src/lib/domain/` | Entidades, validaciones y estados de presentación. Sin Firebase ni Next |
| `src/lib/server/` | Servicios de datos y reglas transaccionales. Reciben la base por parámetro |
| `src/lib/firebase/` | Admin SDK (solo servidor) y SDK del navegador |
| `src/lib/auth/`, `src/lib/client/` | Proveedor de sesión del navegador y cliente de API que adjunta el token |
| `src/lib/content/`, `src/lib/seed/` | Textos de landings y datos de demostración deterministas |
| `tests/unit/` | Pruebas del dominio (sin emulador) |
| `tests/emulator/` | Reglas, catálogo, inscripciones, equipos, entregas, empresas, evaluación y seed (con emulador) |
| `e2e/` | Recorridos de navegador en escritorio y móvil, y auditoría axe |
| `scripts/` | Diagnóstico (`doctor`), seed, administración (`grant-admin`), emuladores y E2E |
| `diseno-claude/` | Referencia visual exportada. No se copia ni se edita fuera de su fuente |
| `.agents/skills/`, `.claude/skills/` | Skills instaladas (duplicadas e idénticas hoy, ver §5) |
| `graphify-out/` | Grafo de conocimiento versionado parcialmente (ver §14) |

## 4. Responsabilidades y límites de dependencias

- **Frontend (`src/app`, `src/components`):** presentación y llamadas a `/api` con el token del usuario. Puede importar `@/lib/domain`, `@/lib/client`, `@/lib/auth` y `@/lib/firebase/client`. **No** debe importar `@/lib/server/*` ni `@/lib/firebase/admin`, salvo `import type`.
- **Excepción vigente:** componentes de servidor sin `"use client"` (por ejemplo `LineLandingPage`, usado por `/compite`, `/crea` y `/conecta`) leen el catálogo público con `lib/server`. No los conviertas en cliente sin revisar esa lectura.
- **API (`src/app/api`):** verifica el token (`requestActor`), el claim `c3Admin` cuando aplica y la propiedad del recurso antes de cualquier lectura o escritura. Responde con el helper `respond`.
- **Servicios (`src/lib/server`):** reglas que dependen de datos, como cupos, equipos, límite de propuestas, auditoría y permisos por recurso. Las escrituras que deben ser atómicas van en transacciones de Firestore. No importan React.
- **Dominio (`src/lib/domain`):** reglas puras sin I/O. Es la capa que cubren las pruebas unitarias.
- **Reglas de Firestore (`firestore.rules`):** deniegan todo acceso del cliente. Un permiso nuevo se implementa en el servidor, no abriendo reglas.

## 5. Mapa de documentación y precedencia

**Precedencia cuando dos fuentes se contradicen (de mayor a menor):**

1. Código y pruebas que pasan en CI: es la verdad técnica actual.
2. Reglas de negocio, seguridad y permisos de este archivo (§6–7).
3. [README.md](README.md): estado funcional, rutas y comandos.
4. [docs/PENDIENTES-REALES.md](docs/PENDIENTES-REALES.md) y [docs/FLUJO-AGENTES.md](docs/FLUJO-AGENTES.md).
5. `diseno-claude/`: referencia visual. No prevalece sobre reglas de negocio ni permisos.
6. Documentos históricos (`docs/PLAN-CONSTRUCCION.md`, `docs/superpowers/`): contexto, no vigentes.
7. `graphify-out/`: orientación, nunca fuente.

**Fuente referida pero ausente:** `diseno-claude/README.md` cita la «Bitácora de producto y especificaciones del MVP (v2.2)» como fuente funcional. **No está en el repositorio.** Hasta localizarla, no inventes reglas de negocio nuevas; registra la duda como pendiente.

**Clasificación de los documentos (al 2026-10-26):**

| Documento | Estado | Motivo |
| --- | --- | --- |
| `AGENTS.md` | Vigente | Reescrito en esta revisión |
| `CLAUDE.md` | Vigente | Importa `AGENTS.md` y añade una nota de Claude Code. En `feat/core` hay una eliminación sin confirmar de su última regla (ver «Contradicciones abiertas») |
| `README.md` | Vigente con excepciones | Estado y rutas coinciden con el código. Los recuentos de pruebas son de una ejecución anterior |
| `docs/FLUJO-AGENTES.md` | Vigente | La sección de worktrees queda reemplazada por la política de una carpeta |
| `docs/PENDIENTES-REALES.md` | Vigente en lo pendiente | La sección «Estado (corte 2)» está desactualizada: afirma que el repositorio remoto no existe y que CI no se ha ejecutado |
| `docs/PLAN-CONSTRUCCION.md` | Histórico | Dice «No están implementados». Su prueba de humo sigue siendo criterio de aceptación (§12) |
| `docs/CONTRATO-CLAUDE.md` | Histórico vigente | Reglas de integración del diseño siguen aplicando. El contrato de datos es provisional |
| `docs/superpowers/specs` y `plans` (2026-10-14) | Histórico | El catálogo y las líneas ya existen. El plan asume la rama `dev` |
| `docs/CONSOLIDACION-GIT-2026-10.md` | Propuesta y registro | Auditoría y secuencia de consolidación. No ejecutada; retirar al terminar |
| `diseno-claude/` | Vigente como referencia visual | Cita una bitácora ausente (ver arriba) |
| `scripts/worktree.mjs` y `npm run worktree` | Obsoleto | Incentiva worktrees, contrario a la política §10. Se conserva hasta decidir su retiro |
| `.github/workflows/ci.yml` | Vigente | El paso E2E está en rojo |
| `.agents/skills/` y `.claude/skills/` | Duplicadas | Árboles idénticos hoy. Mantenerlos sincronizados hasta elegir una fuente |
| `skills-lock.json` | Vigente | `web-design-guidelines` está fijada pero no instalada |
| `graphify-out/` (versionados) | Derivado | Regenerable |

**Contradicciones abiertas (decisión de producto u operación, no de agentes):**

- **Visibilidad de `origin`.** `C3-SV/c3-platform-starter` está **público** en GitHub, donde viven el CI y las PR #2–#7. Pero este archivo y `scripts/doctor.mjs` lo describen como «repositorio público anterior: no publicar ahí», y `docs/PENDIENTES-REALES.md` habla de crear un repositorio privado `c3-platform`. Hay que decidir cuál es el repositorio canónico y su visibilidad antes de subir material nuevo.
- **Regla de `.claude/`.** `CLAUDE.md` dice «No agregar hooks ni configuración de terceros en `.claude/` sin revisarlos». En `feat/core` hay un cambio sin confirmar que elimina esa línea. Esta guía la conserva.
- **Rama `dev`.** El plan de octubre la usa como integración. La política nueva usa `main`. Su contenido ya está en `main`.
- **Bitácora v2.2.** Ver arriba.

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
- **Entornos:** local = proyecto `demo-c3-platform` con emuladores (Auth 9099, Firestore 8080, UI 4000; E2E en 3100). Remoto = `c3-platform-demo`, que según [docs/PENDIENTES-REALES.md](docs/PENDIENTES-REALES.md) existe en Google Cloud (verificado el 2026-10-14). Sin escrituras, seeds, reglas, índices ni despliegues sobre el remoto sin autorización explícita. No mezclar ambos; `npm run doctor` indica a cuál apunta el entorno.
- **Privacidad:** minimizar datos personales. La bitácora `auditLog` no guarda datos personales. Hay usuarios menores de edad; el tratamiento está pendiente de texto legal (ver PENDIENTES).
- **Antes de datos reales:** aviso de privacidad, términos, tratamiento de menores, permisos de imagen y nombre, propiedad intelectual de soluciones, defensas anti-spam de propuestas y política de retención. Todo en PENDIENTES.
- **Migraciones:** sin migraciones destructivas, ni sobre datos personales históricos, antes de un plan de verificación, autorización y migración.
- **Repositorio:** sin `push`, force push ni reescritura de historial salvo orden expresa. Antes de publicar material nuevo, resuelve la visibilidad de `origin` (§5).

## 8. Convenciones, calidad y reutilización

- TypeScript estricto. Sin `any` salvo justificación en un comentario.
- Sigue los patrones del módulo que tocas. Extrae componentes solo ante reutilización real. Busca antes de crear: `src/lib/domain`, `src/components`, las clases de `src/app/globals.css` y `diseno-claude/`.
- Sin dependencias nuevas ni arquitecturas nuevas sin motivo escrito. Las skills de terceros no se instalan sin revisar su origen.
- Cambios mínimos ligados a la tarea. Sin refactors ni formato masivo de código ajeno.
- **Identidad visual:** tokens `--c3-*` y clases compartidas. Sin colores ni medidas sueltas, ni otro framework de estilos sin aprobación.
- **Diseño responsive:** valida escritorio (1280 px) y móvil (390 px). Revisa estados vacío, error y carga.
- **Accesibilidad:** foco visible, contraste, nombres accesibles. La auditoría axe (`e2e/accesibilidad.spec.ts`) debe pasar.
- **Errores:** validación por campo con motivos claros. Ninguna operación fallida muestra confirmación.
- **Idioma:** textos de producto en español. Los nombres técnicos siguen el módulo existente.
- **Next.js 16 tiene cambios incompatibles:** lee la guía local antes de escribir código (bloque al final de este archivo).

## 9. Flujo para agentes

Procedimiento completo en [docs/FLUJO-AGENTES.md](docs/FLUJO-AGENTES.md). Secuencia obligatoria: **investigar, planificar, implementar, probar y reportar.**

1. **Investigar.** Lee esta guía, el estado y las rutas del README, y los documentos de la tarea. Ejecuta `npm run doctor` y `git status`. Usa graphify solo como orientación y confirma en el código.
2. **Planificar.** Indica archivos, reglas de §6–7 que aplican y pruebas que correrás. Si la tarea toca reglas de negocio, permisos, datos reales o despliegue, pide la decisión antes.
3. **Implementar.** Una rama por objetivo, creada desde `main` actualizado (§10). Cambios pequeños y pruebas junto al cambio.
4. **Probar.** Ejecuta la matriz de §11. No afirmes que algo funciona sin ejecutarlo. Si no puedes ejecutar algo (disco, emuladores, navegador), di qué falta.
5. **Reportar.** Usa el handoff de FLUJO-AGENTES (cambió, archivos clave, comportamiento esperado, probado con resultado real, falta, riesgos).

Reglas de ejecución:

- Un agente por carpeta de trabajo a la vez. No editar el mismo árbol en paralelo.
- Los puertos de emuladores (9099, 8080, 4000) y de E2E (3100) son fijos: una sola ejecución de emulador a la vez.
- Si una validación falla por algo ajeno a tu cambio, repórtala tal cual. No la ocultes ni cambies una prueba para que pase sin decisión.
- Si una parte está bloqueada, reporta primero lo bloqueado y termina lo independiente.

## 10. Política Git: una carpeta de trabajo y ramas convencionales

**Objetivo:** un único checkout (carpeta `c3-platform`) con todas las ramas disponibles mediante `git switch`. Se abandona el modelo de worktrees. La transición está descrita en [docs/CONSOLIDACION-GIT-2026-10.md](docs/CONSOLIDACION-GIT-2026-10.md). Mientras no se complete:

- **No crees worktrees** (`git worktree add`, `npm run worktree`). Si encuentras alguno, repórtalo y no lo borres.
- **Ramas:** `main` es la rama estable y debe igualar `origin/main` tras `git fetch`. Las ramas de trabajo son temporales: `feat/<tema>`, `fix/<tema>`, `chore/<tema>` o `docs/<tema>`. Un objetivo por rama. Se borran al integrarse, con confirmación.
- **`dev`:** retirada propuesta. No crees ramas desde ella. Decisión pendiente.
- **Inicio de trabajo:** `git fetch origin`, luego `git switch main` y `git merge --ff-only origin/main`, luego `git switch -c feat/<tema>`.
- **Commits:** pequeños y con prefijo convencional (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`), como el historial actual. Commit solo cuando el responsable lo pida.
- **Integración:** por pull request a `main`, con CI en verde. Sin commits directos a `main`. Para actualizar una rama publicada, mezcla `main` con merge; no hagas rebase de ramas ya publicadas.
- **Antes de integrar:** `git fetch` y prueba de fusión sin confirmar (`git merge --no-commit --no-ff origin/main`; luego `git merge --abort`).
- **Prohibido sin orden expresa:** `git reset --hard`, `git clean -fd`, `git push --force`, `git branch -D`, `git worktree remove --force`, borrar carpetas, reescribir historial y saltarse hooks (`--no-verify`).
- **Borrado de ramas y worktrees:** solo tras integración verificada y confirmación del responsable. Usa `git branch -d`, que rechaza ramas no integradas.
- **Ignorados locales** (`.env*`, `.next/`, `node_modules/`, `playwright-report/`, `test-results/`, `capturas/`, `.vercel/`, `.superpowers/`, logs de depuración, `graphify-out/` de caché): no se versionan. Antes de cualquier limpieza, inventaría y respalda lo que no sea regenerable.
- **Remoto:** `origin` → `C3-SV/c3-platform-starter` (público, ver §5).

## 11. Validaciones disponibles (package.json y CI)

| Comando | Qué valida | Notas |
| --- | --- | --- |
| `npm run typecheck` | `tsc --noEmit` | Rápido |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) | |
| `npm test` | Pruebas unitarias del dominio (`tests/unit`) | Sin emulador |
| `npm run check` | typecheck + lint + test | |
| `npm run test:rules` | Reglas, servicios y casos negativos con emuladores Auth + Firestore (`tests/emulator`) | Requiere Java 21 |
| `npm run test:e2e` | Seed de E2E, build de producción, servidor en 3100 y Playwright (escritorio y móvil) | Levanta emuladores. Local usa Edge (`PW_CHANNEL`) |
| `npx playwright test e2e/<archivo>` | Un recorrido concreto | Requiere emuladores activos o `npm run test:e2e` |
| `npm run test:capturas` | Capturas de páginas públicas en `capturas/actual/` | Falla ante errores de consola; no es validación funcional |
| `npm run check:vercel-env` | Variables requeridas para Vercel | También corre en `vercel-build` |
| `npm run doctor` | Entorno: Node, Java, dependencias, proyecto Firebase activo, puertos, Git | Solo lee |
| `npm run seed:dry-run` / `seed:apply` | Seed del catálogo | Solo emulador salvo autorización expresa |

**CI** (`.github/workflows/ci.yml`, en `pull_request` y en `push` a `main`): `npm ci` → typecheck → lint → test → `test:rules` → instalación de Chromium → `test:e2e`. Node 22, Java 21 (Temurin).

**Matriz por tipo de cambio:**

| Cambio | Verificar |
| --- | --- |
| Frontend pequeño | `typecheck`, `lint`, prueba relevante |
| Flujo funcional | `check`, y el recorrido E2E del flujo |
| Firebase, reglas o permisos | `test:rules` con casos negativos de autorización |
| Integración a `main` | `check`, `test:rules`, `test:e2e` |

**Estado de referencia (422094f):** `typecheck`, `lint`, `test` y `test:rules` pasan en CI. `test:e2e` falla en `e2e/cuenta.spec.ts:67`. Esta sección debe actualizarse cuando cambie.

## 12. Criterios de aceptación y Definition of Done

**Criterio funcional de referencia (prueba de humo):** una empresa presenta una necesidad; C3 crea y publica un reto; una persona se registra, se inscribe y entrega texto y enlaces; un jurado autorizado evalúa tras el cierre; C3 publica resultados; la persona y la empresa ven solo lo que les corresponde. Cerrar sesión y recargar no pierde datos. Ningún botón es simulado.

**Definition of Done para integrar a `main`:**

1. El alcance de la rama está cumplido y no contiene cambios ajenos.
2. Se respetan §6 y §7. Las rutas nuevas tienen prueba de autorización negativa.
3. Se ejecutó la matriz de §11 y los resultados se reportan tal cual, incluidos los fallos.
4. Se revisó responsive (1280 y 390 px), estados vacío, error y carga, y accesibilidad (foco, nombres, axe).
5. La documentación afectada está actualizada (§13).
6. No hay secretos, `.env*` ni artefactos ignorados versionados.
7. La PR tiene handoff y CI en verde, o un fallo explicado y aceptado por el responsable.
8. No se borraron ramas, worktrees ni datos sin autorización.

## 13. Sincronización de la documentación

- Cambio de estado funcional o de rutas → README («Estado real» y tabla de rutas).
- Cambio de comandos, scripts o CI → README («Comandos») y §11 de este archivo.
- Cambio de flujo de agentes o de Git → §9–10 de este archivo y `docs/FLUJO-AGENTES.md`.
- Cambio de regla de negocio, permiso o modelo de datos → §6–7 de este archivo y el apartado «Modelo de datos» del README.
- Pendiente resuelto o nuevo → `docs/PENDIENTES-REALES.md`.
- Un documento histórico no se reescribe: se marca con un aviso de estado y se enlaza su reemplazo.
- No dupliques manuales. Si un documento crece, déjalo en `docs/` y enlázalo.
- Las decisiones de producto no las toman los agentes: se registran como pendientes con la pregunta concreta.
- Tras mover o renombrar archivos, comprueba los enlaces relativos.

## 14. Herramientas y skills

- **Graphify:** `graphify-out/GRAPH_REPORT.md` y `graph.json` están versionados. Sirven para orientarse (`graphify query|path|explain`). Son una guía, no una fuente: confirma en el código. No regeneres ni commitees el grafo salvo petición. Refrescarlo (`graphify update .`) solo al cerrar un bloque de trabajo.
- **Skills del repositorio** (fijadas en `skills-lock.json`): `firebase-firestore`, `firebase-auth-basics`, `firebase-security-rules-auditor` (al tocar reglas o datos) y `vercel-react-best-practices` (rendimiento React y Next). Están en `.agents/skills/` y, idénticas, en `.claude/skills/`. Úsalas cuando apliquen.
- **Skills personales del agente** (revisión de código, accesibilidad, depuración): opcionales. Comprueba el resultado con las pruebas, no con la skill.
- **Capturas y navegador:** ver §11 y `docs/FLUJO-AGENTES.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
