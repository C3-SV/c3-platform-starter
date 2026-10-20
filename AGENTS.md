# Instrucciones para agentes — C3 Platform

Punto de entrada compartido (Claude Code, Codex y otros). `CLAUDE.md` solo lo importa. Flujo detallado: `docs/FLUJO-AGENTES.md`. Estado funcional y rutas: `README.md`.

## Producto
C3 = **Compite · Crea · Conecta**. Una *experiencia* (competencia, hackathon, challenge empresarial) agrupa uno o más *retos* (problema, entregables, rúbrica, cierre de entregas). Recorridos: **participante** (acceso → inscripción individual/equipo → entrega → trayectoria), **empresa** (proponer challenge sin cuenta → espacio de empresa → evaluación como representante) y **administración** C3 (`/admin`: catálogo, inscripciones, propuestas, jurados, resultados). Las vistas V01–V12 son grupos de capacidad, no 12 rutas.

## Dónde vive cada cosa
- `src/app/` páginas y `src/app/api/` rutas de servidor · `src/components/` UI compartida.
- `src/lib/domain/` entidades y validaciones (sin Firebase) · `src/lib/server/` servicios (reciben la base por parámetro) · `src/lib/firebase/` Admin (solo servidor) y SDK de navegador · `src/lib/seed/` datos de demostración.
- `tests/unit` (sin emulador), `tests/emulator` (reglas y servicios), `e2e/` (Playwright, escritorio + móvil).
- Diseño: `diseno-claude/` (tokens en `tokens/`, importados por `src/app/globals.css`; no se copian).

## Convenciones
- TypeScript estricto; sin `any` salvo justificación. Seguir los patrones existentes; extraer componentes solo ante reutilización real.
- Sin dependencias nuevas ni arquitecturas nuevas sin motivo. No cambiar reglas de negocio sin revisar su impacto (estados de entrega, equipos, evaluación, publicación).
- Cambios mínimos y ligados a la tarea; sin refactors ni formato masivo ajenos.
- No simular funciones: un botón navega o ejecuta algo real; no confirmar éxito antes de persistir.

## Diseño visual
- Respetar la identidad C3: usar los tokens (`--c3-*`) y las clases/componentes compartidos; sin colores o medidas sueltas ni otro framework de estilos sin aprobación.
- El refinamiento UX/UI es bienvenido dentro del sistema existente. Validar escritorio (1280) y móvil (390), estados vacío/error/carga y accesibilidad (foco, contraste, nombres accesibles; hay auditoría axe en `e2e/accesibilidad.spec.ts`).

## Seguridad
- Identidad y permisos se validan en el servidor (token + claim `c3Admin` + propiedad del recurso). Firestore deniega todo acceso directo del cliente; no confiar en el frontend.
- Nunca versionar ni imprimir secretos (`.env.local`, service accounts). Solo `NEXT_PUBLIC_*` llega al navegador.
- **Local = emuladores** (`demo-c3-platform`). **Remoto = Firebase real** (`c3-platform-demo`): sin escrituras, seeds, reglas, índices ni despliegues sin autorización explícita. No mezclar ambos; `npm run doctor` muestra a cuál apunta el entorno.
- Sin migraciones destructivas ni datos personales históricos (Copa/HTC) antes de plan de verificación, autorización y migración.
- Sin `push`, force push ni reescritura de historial salvo orden expresa. El remoto `origin` (`C3-SV/c3-platform-starter`) es el repositorio público anterior: no publicar ahí.

## Calidad
| Cambio | Verificar |
| --- | --- |
| Frontend pequeño | `npm run typecheck`, `npm run lint`, prueba relevante |
| Flujo funcional | `npm run check` + recorrido E2E del flujo (`npx playwright test e2e/<archivo>`, requiere `npm run test:e2e` la primera vez) |
| Firebase, reglas o permisos | `npm run test:rules` con casos negativos de autorización |
| Integración a `main`/`dev` | `npm run check`, `test:rules`, `test:e2e` (ya incluye build) |

No afirmar que algo funciona sin haberlo ejecutado; reportar fallos tal cual. Corregir errores propios antes de entregar.

## Coordinación
Un worktree y una rama por objetivo (`npm run worktree -- <nombre>`), commits pequeños, handoff en el mensaje del último commit o en la descripción del PR. Detalle en `docs/FLUJO-AGENTES.md`.

## Herramientas
- **Graphify** (`graphify-out/GRAPH_REPORT.md`, `graph.json`): para orientarse y ver impacto de cambios (`graphify query|path|explain`). Es una guía, no una fuente: confirmar leyendo el código. No regenerar ni commitear el grafo salvo petición.
- **Skills del repo** (`.agents/skills/`): `firebase-firestore`, `firebase-auth-basics`, `firebase-security-rules-auditor` (al tocar reglas/datos) y `vercel-react-best-practices` (rendimiento React/Next). Usarlas cuando aplican, no en cada tarea.
- Skills y plugins personales del agente (revisión de código, accesibilidad, depuración) son opcionales; comprobar el resultado con las pruebas, no con la skill.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
