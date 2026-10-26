# Consolidación Git y auditoría de documentación — octubre 2026

> **Estado: propuesta y registro.** Fecha de referencia: 2026-10-26. `origin/main` = `422094f`.
> Hasta hoy solo se ejecutaron `git fetch origin --prune` (actualiza referencias remotas) y ediciones de documentación **sin commit**. No se borraron ramas, worktrees ni carpetas. Retirar este documento cuando termine la consolidación.

**Escrito para:** responsable del repositorio, que toma las decisiones de la §8 y autoriza cada paso de la §7.

## 1. Resumen

- **Todo el trabajo de funcionalidad está integrado en `origin/main`** (PR #2 a #7). Ninguna rama local ni remota tiene commits que no estén en `main`. Retirar worktrees y ramas locales no pierde commits.
- **Único cambio sin confirmar en todo el repositorio:** `feat/core` (worktree `c3-platform-core`) elimina una línea de `CLAUDE.md`.
- **La `main` local está 12 commits por detrás** de `origin/main`. Su worktree tiene problemas de propiedad.
- **CI en rojo desde el 2026-10-21 (03:30 UTC):** el paso E2E falla en `e2e/cuenta.spec.ts:67`. Typecheck, lint, pruebas unitarias y de reglas pasan.
- **El repositorio `origin` es público.** Esto contradice la documentación. Requiere decisión (§8, D1).
- **Disco C: con 4 GB libres de 238 GB (99 % usado).** La unidad D: que citaba la memoria ya no existe.

## 2. Worktrees (carpetas dentro de `c3-platform-starter/`)

| Carpeta | Rama | HEAD | Estado | Observación |
| --- | --- | --- | --- | --- |
| `c3-platform-starter/` (checkout principal) | `chore/entorno-agentes` | `2236eec` | Solo cambios de esta revisión (5 documentos) | Única carpeta que debe quedar |
| `c3-platform-core/` | `feat/core` | `2236eec` | **`M CLAUDE.md`** (sin confirmar) | Bloquea su retirada hasta resolverse |
| `c3-platform-cuenta-01a/` | `feat/cuenta-01a` | `c86d5b1` | Limpio | Propiedad de `CodexSandboxOffline`: Git da «dubious ownership» |
| `c3-platform-experiencias-01b/` | `feat/experiencias-01b` | `7f1dfd0` | Limpio | |
| `c3-platform-main-sync/` | `main` | `29426e7` | Limpio | Propiedad de `CodexSandboxOffline`; 12 commits detrás de `origin/main` |
| `c3-platform-mi-c3-responsive/` | `feat/trayectoria-responsive` | `2e8ee9f` | Limpio | El nombre no corresponde a su rama (la memoria decía `feat/mi-c3-responsive`). Contiene `node_modules/` |
| `c3-platform-ux/` | `feat/ux` | `2236eec` | Limpio | |

El checkout principal no tiene `node_modules/`. Los `.next/` de otras carpetas son regenerables.

## 3. Ramas

| Rama | Local frente a remoto | ¿Contenida en `origin/main`? | Commits exclusivos | Destino propuesto |
| --- | --- | --- | --- | --- |
| `main` | Local 12 commits detrás | — | 0 | Avanzar a `origin/main` (fast-forward) |
| `chore/entorno-agentes` | Igual que `origin` | Sí | 0 | Conservar hasta integrar esta revisión; después borrar |
| `dev` | Local `f9dd4d8` (1 commit no en `origin/dev`); `origin/dev` = `cffe195` | Sí | 0 | Retirar (decisión D2) |
| `feat/brand-visual-system` | Igual que `origin` | Sí | 0 | Borrar local y remota |
| `feat/core` | Igual que `origin` | Sí | 0 | Borrar tras resolver `CLAUDE.md` |
| `feat/cuenta-01a` | Solo local, nunca publicada | Sí (vía `29426e7`) | 0 | Borrar. **Origen de la regresión de CI** (§5) |
| `feat/experiencias-01b` | Igual que `origin` | Sí (PR #5) | 0 | Borrar |
| `feat/mi-c3-responsive` | Igual que `origin` | Sí (PR #6) | 0 | Borrar |
| `feat/trayectoria-responsive` | Igual que `origin` | Sí (PR #7) | 0 | Borrar |
| `feat/ux` | Igual que `origin` | Sí | 0 | Borrar |

No hay `stash`. Las ramas `main` y `dev` locales no tienen commits fuera de `origin/main`.

## 4. Archivos ignorados que importan

- **`.env.local`:** seis copias con contenido idéntico (mismo hash) en las carpetas principal, `core`, `cuenta-01a`, `experiencias-01b`, `mi-c3-responsive` y `ux`. No existe en `main-sync`. Contiene la variable `VERCEL_OIDC_TOKEN` entre otras; solo se revisaron los nombres de las claves. **Conservar una copia fuera del repositorio.** Nunca versionar.
- **`node_modules/`:** solo en `mi-c3-responsive`. Se recrea con `npm ci` en la carpeta final.
- **`.next/`:** principal (~428 MB), `cuenta-01a` (~215 MB), `experiencias-01b` (~78 MB) y `main-sync` (~74 MB). Regenerable.
- **Inventariar antes de borrar:** `.vercel/` (enlace al proyecto de Vercel), `.superpowers/` (contenido no revisado), `capturas/`, `graphify-out/` (cachés y etiquetas locales), `firestore-debug.log`, `firebase-debug.log`, `playwright-report/`, `test-results/` y `tsconfig.tsbuildinfo`.

## 5. Estado de CI

| Ejecución | Rama | Evento | Resultado |
| --- | --- | --- | --- |
| 39676628445 | `main` (`422094f`) | push | Falla en E2E; los demás pasos OK |
| 39538986270 | `main` (`29426e7`) | push | Falla en E2E; los demás pasos OK |
| 39492304645 | `main` | push (2026-10-20) | **Último verde** |

Ejecuciones de PR recientes (`feat/experiencias-01b`, `feat/mi-c3-responsive`, `feat/trayectoria-responsive`) también terminan en `failure`; no se revisó en qué paso.

**Causa observada:** `e2e/cuenta.spec.ts:67` («valida y cambia contraseña con reautenticación…») falla en escritorio y móvil, con reintentos. En la línea 91, tras pulsar «Salir» y navegar a `/acceso`, nunca aparece `#l-pass` y expira el tiempo de 90 s.

**Hipótesis (no reproducida):** «Salir» de la cabecera llama a `signOut` de forma asíncrona. `page.goto("/acceso")` llega antes de que la sesión se limpie. `AccesoPanel.tsx:66` redirige con `router.replace` a quien sigue con sesión, y el formulario no se muestra.

**Origen:** la prueba llegó a `main` con la fusión de `feat/cuenta-01a` (`29426e7`). Esa rama nunca se publicó, así que no hubo ejecución de CI antes de integrarla.

**Para reproducir** hace falta: `npm ci` (≈ 1 GB con caché), emuladores de Firebase y Edge o Chromium. El disco actual no lo permite con holgura.

## 6. Hallazgos documentales

Clasificación completa en `AGENTS.md` §5. Resumen de lo que requiere atención:

- `AGENTS.md`, `docs/FLUJO-AGENTES.md` y `README.md` describían worktrees como flujo normal. **Corregido en esta revisión** (AGENTS reescrito; FLUJO y README actualizados; `npm run worktree` marcado obsoleto).
- `docs/PLAN-CONSTRUCCION.md` decía «No están implementados». **Aviso de histórico añadido.**
- `docs/PENDIENTES-REALES.md` decía que el remoto no existía y que CI no se había ejecutado. **Aviso añadido.**
- `.agents/skills/` y `.claude/skills/` son árboles idénticos. Hay que elegir una fuente o mantenerlos sincronizados.
- `diseno-claude/README.md` cita la «Bitácora de producto v2.2» como fuente funcional, y **esa bitácora no está en el repositorio**.
- Los recuentos de pruebas del README (77, 87, 107 y 76) son de una ejecución anterior. CI ya no los cumple en E2E.

## 7. Secuencia de limpieza (no ejecutada)

**Precondiciones:** decisiones D1 a D4 tomadas; respaldo verificado; al menos 2 GB libres en C:.

**Fase A. Preservar**

1. Respaldo de referencias: `git bundle create <ruta fuera del repositorio>\c3-platform-2026-10-26.bundle --all`, y después `git bundle verify`.
2. Copiar (no mover) fuera del repositorio: una copia de `.env.local`, `.vercel/`, `.superpowers/`, `capturas/` y los logs de depuración.
3. Resolver `feat/core`: guardar primero el diff (`git -C <core> diff > <ruta fuera>`). Después, según D3, conservar la línea (`git restore CLAUDE.md`) o confirmarla en una rama `docs/`.

**Fase B. Sincronizar `main`**

4. En el worktree `c3-platform-main-sync`: `git -c safe.directory=<ruta> merge --ff-only origin/main`. Si Windows deniega escribir archivos de otro usuario, detenerse y reportar. No usar `safe.directory` global.
5. Comprobar que `git rev-list --count main..origin/main` devuelve 0.

**Fase C. Retirar worktrees** (uno a uno, con confirmación de cada uno)

6. `git worktree remove <ruta>`, sin `--force`, en este orden: `experiencias-01b`, `ux`, `cuenta-01a`, `mi-c3-responsive`, `core` (tras el paso 3) y `main-sync` (tras el paso 5). Si Git rechaza alguno por cambios, ignorados o propiedad, detenerse. No borrar carpetas a mano.
7. `git worktree prune`.
8. `git switch main` desde el checkout principal, para liberar `chore/entorno-agentes`.
9. Borrar ramas locales integradas con `git branch -d` (rechaza ramas no integradas). Lista: las de la §3 sin destino «conservar».
10. Borrar ramas remotas integradas con `git push origin --delete <rama>`. **Acción externa y visible:** requiere confirmación expresa.
11. Mover la carpeta `c3-platform-starter\c3-platform-starter` a `c3-platform`. Es un movimiento, no un borrado. Después inventariar la carpeta contenedora antes de tocarla.
12. En `c3-platform`: `npm ci` (con espacio suficiente) y `npm run doctor`.

**Fase D. Verificación final**

13. `git worktree list` muestra una sola entrada. `git branch` muestra `main` y, si aplica, la rama de trabajo. `git status` está limpio.
14. El CI de `main` pasa completo.

## 8. Decisiones que necesito del responsable

- **D1. Repositorio canónico y visibilidad.** `origin` (`C3-SV/c3-platform-starter`) es público y ahí corre el CI. La documentación pide un repositorio privado `c3-platform`. Decidir cuál es el canónico y si el público debe cambiar de visibilidad antes de publicar material nuevo.
- **D2. Rama `dev`.** ¿Se retira? Su contenido ya está en `main`.
- **D3. Regla de `.claude/` en `feat/core`.** ¿Se conserva la línea de `CLAUDE.md` (recomendado, la guía la mantiene) o se elimina?
- **D4. Ramas remotas integradas.** ¿Se borran en GitHub? Son acciones externas.
- **D5. Prueba `cuenta.spec.ts`.** ¿Se corrige la prueba (esperar a que termine el cierre de sesión) o el flujo de producto? Recomendación: reproducir primero, luego decidir. No ocultar el fallo.
- **D6. Bitácora de producto v2.2.** ¿Dónde está y se agrega al repositorio o a un lugar acordado?
- **D7. Commit de esta revisión.** Los cambios de documentación están sin confirmar sobre `chore/entorno-agentes`. ¿Se confirman en una rama `docs/` a partir de `origin/main`?

## 9. Estrategia de integración (propuesta)

- `main` es estable. Las ramas de trabajo nacen de `origin/main` actualizado y tienen un objetivo cada una.
- Si B depende de A y A no está integrada, B se apila sobre A y se integra después, en orden. Evitar apilar salvo dependencia real.
- Integración por pull request con CI en verde, con merge commit como hasta ahora, para conservar el historial de PR.
- Antes de integrar: `git fetch` y prueba de fusión sin confirmar. No hacer fusiones automáticas en lote.
- Los conflictos se resuelven en la rama, por quien la escribió, y se describen en la PR.
- Las correcciones de `main` (como el E2E rojo) van en `fix/<tema>`.

## 10. Verificación de esta revisión

**Integridad Git** (comparación con la foto tomada antes de editar):
- Referencias locales y remotas: idénticas, salvo la actualización de `origin/main` por el `fetch` previo a la foto.
- Worktrees: idénticos (7 entradas). Sin `stash`. Cero commits exclusivos en todas las ramas locales frente a `origin/main`.
- No se hizo commit ni push. No se borró nada.

**Integridad documental:**
- Enlaces relativos de `AGENTS.md` comprobados contra el sistema de archivos.
- Contradicciones abiertas: listadas en `AGENTS.md` §5 y en §6 de este documento.
- `CLAUDE.md` sin cambios.

**Integridad técnica:**
- En CI (`422094f`): typecheck, lint, pruebas unitarias y pruebas de reglas **pasan**. E2E **falla** (§5).
- **Local, no ejecutado:** no hubo `npm ci` ni pruebas en esta máquina. Motivo: 4 GB libres en C: y ausencia de D:. Los resultados anteriores son de CI, no de esta sesión.
