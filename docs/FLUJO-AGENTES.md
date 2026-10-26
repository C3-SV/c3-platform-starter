# Flujo de trabajo para agentes

Complementa `AGENTS.md` (reglas) con el procedimiento. Corto a propósito.

## Arrancar (agente nuevo)
```bash
npm ci
cp .env.example .env.local     # y completar el bloque de emuladores (README)
npm run doctor                 # diagnóstico: errores bloqueantes vs avisos
npm run emulators              # terminal 1 (Auth 9099, Firestore 8080, UI 4000)
npm run dev                    # terminal 2 → http://localhost:3000
```
Comandos de calidad: `typecheck`, `lint`, `test` (unitarias), `check` (las tres), `test:rules` (emulador), `test:e2e` (build + Playwright), `test:capturas` (capturas). `seed:*` solo con `--emulator` salvo autorización.

## Qué proyecto Firebase usa mi entorno
`npm run doctor` imprime proyecto cliente/servidor y si los emuladores están activos. Local correcto: `demo-c3-platform` + `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` + hosts de emulador definidos. `c3-platform-demo` es el proyecto real: solo con autorización. `.env.local` nunca se versiona.

## Una carpeta de trabajo, ramas convencionales
Se abandona el modelo de worktrees (ver `AGENTS.md` §10 y [CONSOLIDACION-GIT-2026-10.md](CONSOLIDACION-GIT-2026-10.md)). Hay un solo checkout y las ramas se cambian con `git switch`. Mientras dure la transición, no crees worktrees nuevos (`npm run worktree` queda obsoleto).

```bash
git fetch origin
git switch main && git merge --ff-only origin/main   # main debe igualar origin/main
git switch -c feat/<tema>                            # o fix/, chore/, docs/
```

Reglas: un objetivo por rama · commits pequeños y descriptivos · antes de integrar: `git fetch`, probar fusión sin confirmar (`git merge --no-commit --no-ff origin/main`; abortar con `git merge --abort`), pasar la verificación de `AGENTS.md` §11 · integrar por pull request con CI en verde · sin force push · borrar la rama con `git branch -d` solo tras integrarla y con confirmación.

**Puertos:** emuladores (9099/8080/4000) y E2E (3100) son fijos, así que `test:rules`, `test:e2e` y `test:capturas` corren una sola vez a la vez. Servidores de desarrollo en paralelo: `npm run dev -- -p 3001`.

## Handoff
En el mensaje del último commit o en la descripción del PR (sin archivos de progreso):
```
Cambió: <qué y por qué>
Archivos clave: <rutas>
Comportamiento esperado: <qué debe observarse>
Probado: <comandos y resultado real>
Falta: <pendiente>
Riesgos/dependencias: <…>
```

## Graphify
`graphify-out/GRAPH_REPORT.md` (nodos centrales, comunidades) y `graph.json` están versionados; el resto (cachés, HTML, costos, carpetas por fecha) se ignora y se regenera. Uso: `graphify query "<pregunta>"`, `graphify explain "<nodo>"`, `graphify path "A" "B"` para ubicar archivos relacionados e impacto. Siempre confirmar leyendo el código: el grafo puede ir un commit atrás. Refrescarlo (`graphify update .`, sin LLM) solo al cerrar un bloque de trabajo y commitearlo aparte; nunca tras cada operación.

## Capturas y navegador
`npm run test:capturas` guarda PNG de las páginas públicas (escritorio y móvil) en `capturas/actual/` (ignorado) y falla ante errores de consola o de página. Para una referencia, copiar a `capturas/referencia/`. Para recorridos puntuales: `npx playwright test e2e/<archivo>.spec.ts --project=movil` (los emuladores deben estar activos o usar `npm run test:e2e`). Windows usa Edge por defecto; `PW_CHANNEL=chromium` usa el de Playwright.

## Skills del repositorio
Instaladas en `.agents/skills/` (fijadas en `skills-lock.json`): Firebase Firestore, Auth y auditoría de reglas; buenas prácticas React/Next. `web-design-guidelines` aparece en el lock pero no está instalada; no se instaló. No ejecutar instaladores de terceros sin revisar su origen.
