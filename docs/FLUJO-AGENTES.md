# Flujo de desarrollo y entrega — C3 Platform

Complementa las reglas de [AGENTS.md](../AGENTS.md). **Un checkout local; ramas Git convencionales; `dev` integra y prueba; `main` representa producción.**

## Preparar entorno

Requisitos: Node >=22, Java 21, archivo `.env.local` (no versionado) configurado para `demo-c3-platform` y emuladores. Si falta alguna dependencia o hay poco espacio libre, informar el bloqueo en lugar de simular pruebas.

```bash
npm ci
# Crear .env.local desde .env.example con los valores del README
npm run doctor
npm run emulators  # terminal 1; Auth 9099, Firestore 8080, UI 4000
npm run dev        # terminal 2; http://localhost:3000
```

## Ramas y PR

```bash
git status --short
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feat/nombre-descriptivo
```

- Crear `feat/*`, `fix/*`, `docs/*`, `chore/*` desde `dev`. Cada rama contiene un cambio delimitado.
- Hacer PR **hacia `dev`**; revisar diferencias, pruebas y riesgos. No fusionar código automáticamente si hay conflictos.
- Promover **`dev` → `main`** solo después de validación funcional, E2E y revisión de release; `main` no es el espacio para pruebas nuevas.
- Coordinar agentes de uno en uno sobre esta carpeta. No usar `git worktree`, `npm run worktree` ni directorios por agente.
- No hacer commits, pushes, merges, deploys o borrados irreversibles sin autorización del responsable cuando no estén dentro del alcance autorizado.

## Evaluar e implementar

1. Leer AGENTS, README, [PRODUCTO-Y-NAVEGACION](PRODUCTO-Y-NAVEGACION.md) y código pertinente.
2. Definir el problema y el flujo por rol (entrada → tarea → confirmación → salida/retorno). Registrar qué está implementado y qué es propuesta.
3. Si la petición es de investigación o auditoría, **no editar el producto**. En cambios de UX, validar primero arquitectura de información y rutas, no acumular pantallas aisladas.
4. Implementar el cambio mínimo consistente con dominio, seguridad y tokens existentes.
5. Validar `npm run check`; añadir `npm run test:rules` o `npm run test:e2e` según riesgo. E2E requiere emuladores, build y navegador. Solo una suite con puertos fijos a la vez.
6. Actualizar documentos responsables y entregar handoff.

## Entornos y datos

- Local: `demo-c3-platform`, `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`. `npm run doctor` confirma destino.
- Firebase real (`c3-platform-demo`) o Vercel: no hacer writes, seeds, cambios de reglas ni despliegues sin orden expresa.
- No versionar `.env.local`, credenciales ni datos personales. Leer [PENDIENTES-REALES](PENDIENTES-REALES.md) antes de preparar un piloto real.

## Handoff

```text
Objetivo: ...
Cambios realizados: ...
Archivos: ...
Validaciones ejecutadas y resultados: ...
Validaciones no ejecutadas y por qué: ...
Riesgos o decisiones necesarias: ...
```

## Herramientas

`npm run doctor` revisa el entorno; `npm run test:capturas` produce capturas locales de páginas públicas; `npx playwright test ...` sirve para recorridos puntuales con entorno listo. `graphify-out/` y `diseno-claude/` ayudan a orientarse y validar diseño, pero no sustituyen código y pruebas. Revisar skills existentes antes de instalar nuevas.
