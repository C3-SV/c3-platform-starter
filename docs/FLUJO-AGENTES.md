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

## Worktrees
El repositorio está en `…/c3-platform-starter/c3-platform-starter`. Los worktrees se crean como carpetas hermanas:
```bash
npm run worktree -- ux --dry-run   # ver qué haría
npm run worktree -- ux             # ../c3-platform-ux, rama feat/ux (base: HEAD; usar --base dev para otra)
cd ../c3-platform-ux && npm ci && npm run doctor
```
Sugeridos: `ux` (interfaz), `core` (servicios/reglas), `qa` (integración y E2E). Crear uno solo si hay trabajo simultáneo; para cambios pequeños basta la rama actual. El script copia `.env.local` (ignorado por Git), no duplica worktrees ni toca ramas existentes, y no ejecuta merges ni push.

Reglas: un objetivo por rama · commits pequeños y descriptivos · un agente por worktree · nunca editar el mismo worktree en paralelo · antes de integrar: `git fetch`, probar fusión sin confirmar (`git merge --no-commit --no-ff <rama>`; abortar con `git merge --abort`), pasar la verificación de `AGENTS.md` · sin force push · retirar el worktree con `git worktree remove <ruta>` tras integrar.

**Puertos:** emuladores (9099/8080/4000) y E2E (3100) son fijos, así que `test:rules`, `test:e2e` y `test:capturas` corren en un solo worktree a la vez (el de `qa`). Servidores de desarrollo en paralelo: `npm run dev -- -p 3001`.

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
