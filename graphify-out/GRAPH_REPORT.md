# Graph Report - c3-platform-starter  (2026-10-19)

## Corpus Check
- 355 files · ~195,108 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .rules 1)

## Summary
- 1637 nodes · 3642 edges · 166 communities (91 shown, 75 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `87dee49b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- context.ts
- V01 Home (vitrina, escritorio, público)
- validation.ts
- README raíz C3 Platform (corte 6)
- companies.ts
- package.json
- corte3.spec.ts
- apiRequest
- server/evaluation.ts
- seed.mjs
- app/retos/[challengeId]/page.tsx
- presentation.ts
- TrayectoriaPanel.tsx
- EquipoPanel.tsx
- AuthProvider.tsx
- emulator/evaluation.test.ts
- ProponerForm.tsx
- requestActor
- InscripcionPanel.tsx
- participation.ts
- V11 Empresa: soluciones y evaluación
- Workflow CI de GitHub Actions (typecheck, lint, pruebas, build, E2E)
- V05 Mi C3 (inicio del participante)
- V07 Mi reto y entrega (participante)
- Propuesta de challenge: necesidad enviada por la empresa (organización, responsable, correo, problema, resultado esperado, datos)
- V02 Explorar experiencias (catálogo)
- notFound
- compilerOptions
- Vocabulario único de estados
- Firestore Web SDK Usage Guide
- respond
- Rol: estudiante o joven técnico (participante)
- Regla: azul es acción
- Inventario aprobado de 12 vistas (D-023)
- database
- types.ts
- 3. Server-Side Performance
- 5. Re-render Optimization
- server/profile.ts
- Firebase Authentication Web SDK
- ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️
- Firestore Indexes Reference
- 7. JavaScript Performance
- Quick Reference
- scripts
- Writing Data
- EmpresaPanel.tsx
- Firebase Authentication - Android Setup Guide (Kotlin)
- Cloud Firestore (Enterprise edition) - Android Setup Guide (Kotlin)
- 6. Rendering Performance
- errors.ts
- LineLandingPage.tsx
- server/catalog.ts
- ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️
- devDependencies
- React Best Practices
- Sections
- Review Focus
- C3 Platform: ecosistema, catálogo y Firebase
- LineLandingPage
- domain/catalog.ts
- ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️
- Document Data Model
- Firestore Indexes Reference
- Web SDK Usage (Enterprise Native Mode)
- firebase-auth-basics/SKILL.md
- Firebase Auth & Google Sign-In for Flutter
- Basic Checks
- Manual Initialization
- Cloud Firestore in Flutter
- Cloud Firestore in Flutter
- Manual Initialization
- 1. Instance Selection and Edition Detection
- Assessment: Security Validator (Red Team Edition)
- 1. Eliminating Waterfalls
- 2. Bundle Size Optimization
- Experience
- dependencies
- Workflow
- React Best Practices
- ParticipationMode
- 4. Client-Side Data Fetching
- Web Interface Guidelines
- accesibilidad.spec.ts
- rules.test.ts
- check-vercel-env.mjs
- equipos/[id]/route.ts
- async-cheap-condition-before-await.md
- Prefer Statically Analyzable Paths
- jurados/[id]/route.ts
- resumen/route.ts
- publicar/route.ts
- api/propuestas/route.ts
- overrides
- admin/inscripciones/[id]/route.ts
- propuestas/[id]/route.ts
- resultados/route.ts
- [alias]/route.ts
- advanced-effect-event-deps.md
- advanced-event-handler-refs.md
- advanced-init-once.md
- advanced-use-latest.md
- async-api-routes.md
- async-dependencies.md
- async-parallel.md
- async-suspense-boundaries.md
- bundle-barrel-imports.md
- bundle-conditional.md
- bundle-defer-third-party.md
- bundle-dynamic-imports.md
- bundle-preload.md
- client-event-listeners.md
- client-localstorage-schema.md
- client-passive-event-listeners.md
- client-swr-dedup.md
- js-batch-dom-css.md
- js-cache-function-results.md
- js-cache-property-access.md
- js-cache-storage.md
- js-combine-iterations.md
- js-early-exit.md
- js-flatmap-filter.md
- js-hoist-regexp.md
- js-index-maps.md
- js-length-check-first.md
- js-min-max-loop.md
- js-request-idle-callback.md
- js-set-map-lookups.md
- js-tosorted-immutable.md
- rendering-activity.md
- rendering-animate-svg-wrapper.md
- rendering-conditional-render.md
- rendering-content-visibility.md
- rendering-hoist-jsx.md
- rendering-hydration-no-flicker.md
- rendering-hydration-suppress-warning.md
- rendering-resource-hints.md
- rendering-script-defer-async.md
- rendering-svg-precision.md
- rendering-usetransition-loading.md
- rerender-defer-reads.md
- rerender-dependencies.md
- rerender-derived-state.md
- rerender-derived-state-no-effect.md
- rerender-functional-setstate.md
- rerender-lazy-state-init.md
- rerender-memo.md
- rerender-memo-with-default-value.md
- rerender-move-effect-to-event.md
- rerender-no-inline-components.md
- rerender-simple-expression-in-memo.md
- rerender-split-combined-hooks.md
- rerender-transitions.md
- rerender-use-deferred-value.md
- rerender-use-ref-transient-values.md
- server-after-nonblocking.md
- server-auth-actions.md
- server-cache-lru.md
- server-dedup-props.md
- server-parallel-fetching.md
- server-parallel-nested-fetching.md
- server-serialization.md
- _template.md

## God Nodes (most connected - your core abstractions)
1. `database()` - 84 edges
2. `requestActor()` - 73 edges
3. `respond()` - 73 edges
4. `apiRequest()` - 52 edges
5. `ValidationFailure` - 42 edges
6. `HttpError` - 36 edges
7. `StatePill()` - 35 edges
8. `requireAdmin()` - 30 edges
9. `notFound()` - 30 edges
10. `README raíz C3 Platform (corte 6)` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Experiencias institucionales` --references--> `StatePill()`  [INFERRED]
  docs/superpowers/specs/2026-10-14-c3-ecosistema-firebase-admin-design.md → src/components/StatePill.tsx
- `1. `google_sign_in` 7.2.0 API Changes` --references--> `authenticate()`  [INFERRED]
  .claude/skills/firebase-auth-basics/references/flutter_setup.md → src/lib/server/auth.ts
- `Task 4: Admin dashboard and read-only deliveries` --references--> `requireAdmin()`  [INFERRED]
  docs/superpowers/plans/2026-10-14-c3-ecosistema-firebase-admin-plan.md → src/lib/server/auth.ts
- `2. Create `firebase.json`` --references--> `database()`  [INFERRED]
  .claude/skills/firebase-firestore/references/enterprise/provisioning.md → src/lib/server/context.ts
- `Task 2: Deterministic seed dataset and CLI` --references--> `create()`  [INFERRED]
  docs/superpowers/plans/2026-10-14-c3-ecosistema-firebase-admin-plan.md → src/app/retos/[challengeId]/inscripcion/EquipoPanel.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pipeline de verificación de CI** — c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_verificacion_estatica, c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_pruebas_unitarias, c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_pruebas_reglas_emuladores, c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_build_produccion, c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_e2e_playwright [EXTRACTED 1.00]
- **Vocabulario único de estados** — c3_platform_estilo_c3_platform_estilo_readme_reto, c3_platform_estilo_c3_platform_estilo_readme_inscripcion, c3_platform_estilo_c3_platform_estilo_readme_equipo, c3_platform_estilo_c3_platform_estilo_readme_entrega, c3_platform_estilo_c3_platform_estilo_readme_evaluacion, c3_platform_estilo_c3_platform_estilo_readme_resultado, c3_platform_estilo_c3_platform_estilo_readme_propuesta, c3_platform_estilo_c3_platform_estilo_vistas_00_fundamentos_badge_estado [EXTRACTED 1.00]
- **Flujo del joven: V03 a V08** — c3_platform_estilo_c3_platform_estilo_vistas_v03_detalle_reto, c3_platform_estilo_c3_platform_estilo_vistas_v04_acceso, c3_platform_estilo_c3_platform_estilo_vistas_v06_inscripcion_equipos, c3_platform_estilo_c3_platform_estilo_vistas_v05_mi_c3, c3_platform_estilo_c3_platform_estilo_vistas_v07_mi_reto, c3_platform_estilo_c3_platform_estilo_vistas_v08_trayectoria [EXTRACTED 1.00]
- **Prueba de humo funcional: empresa, reto, inscripción, entrega, evaluación y publicación** — c3_platform_starter_c3_platform_starter_docs_plan_construccion_prueba_de_humo_funcional, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v10_proponer_challenge, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v12_admin, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v06_inscripcion_equipos, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v07_mi_reto, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v11_empresa_evaluacion, c3_platform_starter_c3_platform_starter_readme_publicacion_bloqueada [EXTRACTED 1.00]
- **Rúbrica de cuatro criterios de 0 a 10** — c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_rubrica, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_criterio_calidad_resultado, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_criterio_claridad_enfoque, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_criterio_viabilidad_operativa, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_criterio_calidad_tecnica [EXTRACTED 1.00]
- **Tres reglas de estilo del sistema visual** — c3_platform_estilo_c3_platform_estilo_readme_regla_azul_es_accion, c3_platform_estilo_c3_platform_estilo_readme_regla_linea_clasifica, c3_platform_estilo_c3_platform_estilo_readme_regla_estados_propios, c3_platform_estilo_c3_platform_estilo_readme_token_accion, c3_platform_estilo_c3_platform_estilo_readme_tokens_estado [EXTRACTED 1.00]
- **Vocabulario de estados compartido por vistas y datos** — c3_platform_starter_c3_platform_starter_diseno_claude_readme_vocabulario_estados, c3_platform_starter_c3_platform_starter_readme_enrollments, c3_platform_starter_c3_platform_starter_readme_submissions, c3_platform_starter_c3_platform_starter_readme_teams, c3_platform_starter_c3_platform_starter_readme_company_proposals, c3_platform_starter_c3_platform_starter_readme_evaluations [INFERRED 0.75]
- **Modelo de permisos verificados en servidor** — c3_platform_starter_c3_platform_starter_readme_permisos_servidor, c3_platform_starter_c3_platform_starter_readme_claim_c3admin, c3_platform_starter_c3_platform_starter_readme_firestore_deniega_cliente, c3_platform_starter_c3_platform_starter_readme_espacio_empresa, c3_platform_starter_c3_platform_starter_readme_jurados_asignados, c3_platform_starter_c3_platform_starter_readme_trayectoria_registrada [INFERRED 0.75]
- **Camino del participante hasta la inscripción** — c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v02_explorar_dc_catalogo_experiencias, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_reto, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_inscripcion, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_equipo, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v04_acceso_dc_flujo_acceso_retorno_inscripcion, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v04_acceso_dc_cuenta_c3 [INFERRED 0.85]

## Communities (166 total, 75 thin omitted)

### Community 0 - "context.ts"
Cohesion: 0.20
Nodes (13): server-only, dynamic, POST(), dynamic, GET(), POST(), adminApp(), FirebaseServiceAccount (+5 more)

### Community 1 - "V01 Home (vitrina, escritorio, público)"
Cohesion: 0.06
Nodes (81): Canvas fuente de Fundamentos (Main.dc.html), Canvas fuente de V01 Home, Canvas fuente de V02 Explorar, Canvas fuente de V03 Detalle de reto, Canvas fuente de V04 Acceso, Canvas fuente de V05 Mi C3, Canvas fuente de V06 Inscripción y equipos, Canvas fuente de V07 Mi reto (+73 more)

### Community 2 - "validation.ts"
Cohesion: 0.08
Nodes (33): save(), DELIVERY_LINK_MAX, DELIVERY_MAX_LINKS, DELIVERY_TEXT_MAX, DELIVERY_TEXT_MIN_TO_SUBMIT, DeliveryInput, isHttpsUrl(), parseDeliveryInput() (+25 more)

### Community 3 - "README raíz C3 Platform (corte 6)"
Cohesion: 0.07
Nodes (38): V12-Admin fuente canvas (.dc.html), index.html del paquete de diseño, README del paquete de diseño (Estilo de las 12 vistas), Vocabulario único de estados, 00-Fundamentos (sistema visual), V01 Home (diseño), V02 Explorar experiencias (diseño), V03 Detalle de reto (diseño) (+30 more)

### Community 4 - "companies.ts"
Cohesion: 0.09
Nodes (38): presentState(), isHoneypotFilled(), ProposalStatus, authenticate(), bearerToken(), requireAdmin(), TokenVerifier, VerifiedToken (+30 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, type, version, eslint (+7 more)

### Community 6 - "corte3.spec.ts"
Cohesion: 0.07
Nodes (27): ADMIN_EMAIL, ADMIN_PASSWORD, joven, stamp, joven, stamp, enrollAsTeam(), integrante (+19 more)

### Community 7 - "apiRequest"
Cohesion: 0.10
Nodes (39): AdminPanel(), changeStatus(), Centered(), NAV, PendingSection(), Section, StatusButtons(), ChallengeForm() (+31 more)

### Community 8 - "server/evaluation.ts"
Cohesion: 0.11
Nodes (36): consolidatedAverage(), EVALUATIONS_REQUIRED, maxTotal(), parseRecognition(), parseScores(), Recognition, RECOGNITION_LABEL, RECOGNITIONS (+28 more)

### Community 9 - "seed.mjs"
Cohesion: 0.11
Nodes (24): args, confirmProject, createRestDocument(), decodeFirestoreFields(), decodeFirestoreValue(), emulator, encodeFirestoreValue(), firestoreRestRequest() (+16 more)

### Community 10 - "app/retos/[challengeId]/page.tsx"
Cohesion: 0.10
Nodes (28): Navegación y accesibilidad, nextConfig, next, EvaluacionEmpresaPage(), dynamic, ExplorarPage(), LEYENDA, dynamic (+20 more)

### Community 11 - "presentation.ts"
Cohesion: 0.16
Nodes (20): DeliveryRow, EntregasPanel(), Assignment, MiC3Panel(), Seccion(), MiC3Page(), Banner, bannerFor() (+12 more)

### Community 12 - "TrayectoriaPanel.tsx"
Cohesion: 0.15
Nodes (18): EvaluarMovilPage(), TrayectoriaPage(), issueFor(), Trajectory, TrayectoriaPanel(), EvaluadorPanel(), reload(), save() (+10 more)

### Community 13 - "EquipoPanel.tsx"
Cohesion: 0.14
Nodes (16): react, Row, ChallengeOption, JudgeRow, KIND_LABEL, Board, BoardRow, ChallengeOption (+8 more)

### Community 14 - "AuthProvider.tsx"
Cohesion: 0.14
Nodes (20): firebase, AccesoPanel(), handleLogin(), handleRecover(), handleRegister(), errorCode(), LOGIN_ERRORS, REGISTER_ERRORS (+12 more)

### Community 15 - "emulator/evaluation.test.ts"
Cohesion: 0.07
Nodes (46): createChallenge(), createExperience(), setChallengeStatus(), setExperienceStatus(), reviewEnrollment(), experienceInput, now, afterDeadline (+38 more)

### Community 16 - "ProponerForm.tsx"
Cohesion: 0.11
Nodes (17): 1. Provision Firestore, 2. Add dependencies to Gradle build files, 3. Initialize Firestore, 4. Work with data, Add data, Cloud Firestore (Standard edition) - Android Setup Guide (Kotlin), Delete data, Jetpack Compose (Modern) (+9 more)

### Community 17 - "requestActor"
Cohesion: 0.14
Nodes (14): dynamic, POST(), dynamic, POST(), dynamic, GET(), dynamic, GET() (+6 more)

### Community 18 - "InscripcionPanel.tsx"
Cohesion: 0.16
Nodes (17): CardItem, EquipoPanel(), create(), join(), load(), manage(), run(), issueFor() (+9 more)

### Community 19 - "participation.ts"
Cohesion: 0.10
Nodes (44): firebase-admin, auth, generateTeamCode(), normalizeTeamCode(), parseTeamName(), TEAM_CODE_ALPHABET, TEAM_NAME_MAX, TEAM_NAME_MIN (+36 more)

### Community 20 - "V11 Empresa: soluciones y evaluación"
Cohesion: 0.21
Nodes (12): Jurado empresa (evaluador de la organización), Jurado externo (segundo evaluador), Promedio de evaluaciones (solo con evaluaciones finalizadas), Criterio: calidad del resultado sobre el caso de prueba (0 a 10), Criterio: calidad técnica del código y la demo (0 a 10), Criterio: claridad del enfoque y de los supuestos (0 a 10), Criterio: viabilidad de llevarlo a operación (0 a 10), Jurado: dos evaluadores que puntúan de forma independiente (+4 more)

### Community 21 - "Workflow CI de GitHub Actions (typecheck, lint, pruebas, build, E2E)"
Cohesion: 0.13
Nodes (13): Visibilidad al publicar: ganadores en la página pública, puntaje a participantes y empresa, comentarios de jurados desactivados por defecto, Workflow CI de GitHub Actions (typecheck, lint, pruebas, build, E2E), Paso CI: build de producción, Paso CI: recorridos de escritorio y móvil con Playwright (informe subido si falla), Paso CI: pruebas de reglas y servicios con emuladores (requiere Java 21), Paso CI: pruebas unitarias del dominio, Paso CI: typecheck y lint, Regla: sin despliegue automático de producción (+5 more)

### Community 22 - "V05 Mi C3 (inicio del participante)"
Cohesion: 0.17
Nodes (14): Resultado oficial publicado por C3, Estado de inscripción: Pendiente, Aprobada, Rechazada, Cancelada, Sello de evidencia C3, Copa Salvadoreña de Programación 2026 (competencia individual, concluida, solo informativa), Hackathon de Turismo Creativo (serie: Vol. 1 concluido, Vol. 2 próximo), Regla: solo las experiencias con inscripción abierta se inscriben desde la plataforma, Reto: Conciliación bancaria automática (Distribuidora Atlas, concluido), V05 Mi C3 (inicio del participante) (+6 more)

### Community 23 - "V07 Mi reto y entrega (participante)"
Cohesion: 0.20
Nodes (16): Flujo de progreso del participante: Inscrito, Habilitado, Entregando, Evaluación, Resultado, Calendario del reto: inscripción hasta el 31 de octubre, entrega del 1 al 14 de noviembre, evaluación del 15 al 22 de noviembre, resultados el 25 de noviembre, Dataset de 400 pedidos (material del reto), Entrega de la solución: repositorio, demo o video (máximo 4 minutos), memoria técnica de dos páginas y tabla de resultados, Equipo: 2 a 4 personas por reto, Inscripción: requiere cuenta C3 y la revisa C3 antes de habilitar; un reto por persona, Reto (challenge empresarial): Ruteo de última milla con ventanas horarias, Flujo de acceso: al entrar o crear cuenta se vuelve directo a la inscripción del reto (+8 more)

### Community 24 - "Propuesta de challenge: necesidad enviada por la empresa (organización, responsable, correo, problema, resultado esperado, datos)"
Cohesion: 0.40
Nodes (6): Rol: empresa (propone problemas que se convierten en retos), Vinculación de representante a organización (revisión de solicitud por C3, misma cuenta), Flujo para empresas: proponer la necesidad, C3 define el reto, equipos entregan, la empresa evalúa y C3 publica, Regla: el espacio de empresa requiere sesión y organización vinculada, Selector de organización activa (Transportes Delta y Delta Logística), Propuesta de challenge: necesidad enviada por la empresa (organización, responsable, correo, problema, resultado esperado, datos)

### Community 25 - "V02 Explorar experiencias (catálogo)"
Cohesion: 0.24
Nodes (13): Estado de reto: Borrador, Próximo, Abierto, En evaluación, Concluido, Cancelado, Compite: competencias (línea accion), Conecta: challenges empresariales (línea conecta), Crea: hackathons (línea crea), V01 Home C3 (landing pública), Etiqueta «Prototipo con datos de demostración», V02 Explorar experiencias (catálogo), Catálogo de experiencias: retos, competencias y hackathons (+5 more)

### Community 26 - "notFound"
Cohesion: 0.21
Nodes (20): InscripcionPage(), canEditDelivery(), deliveryState, getPublicChallenge(), loadChallenge(), loadExperience(), notFound(), assignJudge() (+12 more)

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 28 - "Vocabulario único de estados"
Cohesion: 0.29
Nodes (5): Fundamentos de estilo C3 Platform (Main.dc.html), Estado de entrega: Sin entrega, Borrador, Entregada, Fuera de plazo, Estado de evaluación y resultado: Pendiente, En curso, Finalizada, Resultado no publicado, Resultado publicado, Vocabulario único de estados, Flujo de entrega: borrador guardado y envío antes del cierre (14 de noviembre, 23:59)

### Community 29 - "Firestore Web SDK Usage Guide"
Cohesion: 0.12
Nodes (16): Add a Document with Auto-ID (`addDoc`), Firestore Web SDK Usage Guide, Get a Single Document (`getDoc`), Get Multiple Documents (`getDocs`), Handle Changes (Added/Modified/Removed), Initialization, Listen to a Document/Query (`onSnapshot`), Order and Limit (+8 more)

### Community 30 - "respond"
Cohesion: 0.16
Nodes (12): dynamic, GET(), dynamic, PATCH(), dynamic, GET(), dynamic, PATCH() (+4 more)

### Community 31 - "Rol: estudiante o joven técnico (participante)"
Cohesion: 0.67
Nodes (3): Flujo del participante: explorar, inscribirse solo o en equipo, entregar y recibir resultado oficial, Rol: estudiante o joven técnico (participante), Cuenta C3: nombre, correo y contraseña de 8 caracteres o más; el perfil se completa después

### Community 34 - "database"
Cohesion: 0.16
Nodes (12): dynamic, GET(), POST(), dynamic, PUT(), dynamic, PATCH(), dynamic (+4 more)

### Community 35 - "types.ts"
Cohesion: 0.15
Nodes (14): ChallengeParticipation, CompanyProposal, Enrollment, Evaluation, EvaluationStatus, ExperienceStatus, OfficialResult, Submission (+6 more)

### Community 36 - "3. Server-Side Performance"
Cohesion: 0.12
Nodes (13): 3.10 Use after() for Non-Blocking Operations, 3.1 Authenticate Server Actions Like API Routes, 3.2 Avoid Duplicate Serialization in RSC Props, 3.3 Avoid Shared Module State for Request Data, 3.4 Cross-Request LRU Caching, 3.5 Hoist Static I/O to Module Level, 3.6 Minimize Serialization at RSC Boundaries, 3.7 Parallel Data Fetching with Component Composition (+5 more)

### Community 37 - "5. Re-render Optimization"
Cohesion: 0.12
Nodes (16): 5.10 Subscribe to Derived State, 5.11 Use Functional setState Updates, 5.12 Use Lazy State Initialization, 5.13 Use Transitions for Non-Urgent Updates, 5.14 Use useDeferredValue for Expensive Derived Renders, 5.15 Use useRef for Transient Values, 5.1 Calculate Derived State During Rendering, 5.2 Defer State Reads to Usage Point (+8 more)

### Community 38 - "server/profile.ts"
Cohesion: 0.22
Nodes (12): dynamic, GET(), PUT(), dynamic, PUT(), dynamic, GET(), ensureProfile() (+4 more)

### Community 39 - "Firebase Authentication Web SDK"
Cohesion: 0.13
Nodes (15): Connect to Emulator, Email Link Authentication, Firebase Authentication Web SDK, Initialization, Observe Auth State, Sign In Anonymously, Sign In with Apple (Popup), Sign In with Facebook (Popup) (+7 more)

### Community 40 - "⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️"
Cohesion: 0.13
Nodes (14): 1. Import and Initialize, 2. Type-Safe Data Models (Codable), 3. Basic CRUD Operations, 4. Pipeline Queries, 5. Realtime Listeners in SwiftUI (Lifecycle Best Practices), ⛔️ CRITICAL RULE: NO FirebaseFirestoreSwift ⛔️, ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️, Examples (+6 more)

### Community 41 - "Firestore Indexes Reference"
Cohesion: 0.13
Nodes (15): 1. High Write Rates (Sequential Values), 2. Large String/Map/Array Fields, 3. TTL Fields, Automatic vs. Manual Management, Best Practices & Exemptions, CLI Commands, Composite Indexes, Config files (+7 more)

### Community 42 - "7. JavaScript Performance"
Cohesion: 0.13
Nodes (15): 7.10 Hoist RegExp Creation, 7.11 Use flatMap to Map and Filter in One Pass, 7.12 Use Loop for Min/Max Instead of Sort, 7.13 Use Set/Map for O(1) Lookups, 7.14 Use toSorted() Instead of sort() for Immutability, 7.1 Avoid Layout Thrashing, 7.2 Build Index Maps for Repeated Lookups, 7.3 Cache Property Access in Loops (+7 more)

### Community 43 - "Quick Reference"
Cohesion: 0.13
Nodes (14): 1. Eliminating Waterfalls (CRITICAL), 2. Bundle Size Optimization (CRITICAL), 3. Server-Side Performance (HIGH), 4. Client-Side Data Fetching (MEDIUM-HIGH), 5. Re-render Optimization (MEDIUM), 6. Rendering Performance (MEDIUM), 7. JavaScript Performance (LOW-MEDIUM), 8. Advanced Patterns (LOW) (+6 more)

### Community 44 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, check, check:vercel-env, dev, emulators, lint, seed:apply (+7 more)

### Community 45 - "Writing Data"
Cohesion: 0.14
Nodes (13): Add a Document with Auto-ID, Get a Single Document, Get Multiple Documents, Order and Limit, Pipeline Queries, Python SDK Usage, Queries, Reading Data (+5 more)

### Community 46 - "EmpresaPanel.tsx"
Cohesion: 0.27
Nodes (9): OrganizationOption, Como(), EmpresaPanel(), Pagina(), EmpresaPage(), PROPOSAL_LIMITS, ProposalInput, proposalNextStep() (+1 more)

### Community 47 - "Firebase Authentication - Android Setup Guide (Kotlin)"
Cohesion: 0.17
Nodes (12): 1. Enable Authentication via CLI, 2. Add dependencies to Gradle build files, 3. Initialize FirebaseAuth, 4. Check current Auth state, 5. Use sign-in providers in the app, 6. Sign out users, Email/Password, Firebase Authentication - Android Setup Guide (Kotlin) (+4 more)

### Community 48 - "Cloud Firestore (Enterprise edition) - Android Setup Guide (Kotlin)"
Cohesion: 0.17
Nodes (11): 1. Provision Firestore, 2. Add dependencies to Gradle build files, 3. Initialize Firestore, 4. Decision framework: Mandatory pipeline architecture, 5. Pipeline examples, 6. Real-time listener & document operations, Cloud Firestore (Enterprise edition) - Android Setup Guide (Kotlin), Full-text search (+3 more)

### Community 49 - "6. Rendering Performance"
Cohesion: 0.17
Nodes (12): 6.10 Use React DOM Resource Hints, 6.11 Use useTransition Over Manual Loading States, 6.1 Animate SVG Wrapper Instead of SVG Element, 6.2 CSS content-visibility for Long Lists, 6.3 Hoist Static JSX Elements, 6.4 Optimize SVG Precision, 6.5 Prevent Hydration Mismatch Without Flickering, 6.6 Suppress Expected Hydration Mismatches (+4 more)

### Community 50 - "errors.ts"
Cohesion: 0.18
Nodes (8): dynamic, GET(), dynamic, GET(), dynamic, GET(), errorResponse(), listEnrollmentsForChallenge()

### Community 51 - "LineLandingPage.tsx"
Cohesion: 0.32
Nodes (9): LineBrandMark(), ExperienceCard(), lineColor(), lineTextColor(), dynamic, LINE_LANDING, LineLandingContent, ExperienceLine (+1 more)

### Community 52 - "server/catalog.ts"
Cohesion: 0.32
Nodes (11): normalizeExperienceMetadata(), presentExperienceState(), byCreatedDesc(), CHALLENGES, EXPERIENCES, listAdminCatalog(), listPublicCatalog(), rubricWithIds() (+3 more)

### Community 53 - "⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️"
Cohesion: 0.18
Nodes (10): 1. Import and Initialize, 2. Type-Safe Data Models (Codable), 3. Writing Data (Modern Concurrency & Codable), 4. Reading Data (Modern Concurrency & Codable), 5. Realtime Listeners in SwiftUI (Lifecycle Best Practices), ⛔️ CRITICAL RULE: NO FirebaseFirestoreSwift ⛔️, ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️, Firebase Firestore iOS Setup Guide (+2 more)

### Community 54 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, @axe-core/playwright, eslint, eslint-config-next, @firebase/rules-unit-testing, firebase-tools, @playwright/test, @types/node (+3 more)

### Community 55 - "React Best Practices"
Cohesion: 0.20
Nodes (9): 8.1 Do Not Put Effect Events in Dependency Arrays, 8.2 Initialize App Once, Not Per Mount, 8.3 Store Event Handlers in Refs, 8.4 useEffectEvent for Stable Callback Refs, 8. Advanced Patterns, Abstract, React Best Practices, References (+1 more)

### Community 56 - "Sections"
Cohesion: 0.20
Nodes (9): 1. Eliminating Waterfalls (async), 2. Bundle Size Optimization (bundle), 3. Server-Side Performance (server), 4. Client-Side Data Fetching (client), 5. Re-render Optimization (rerender), 6. Rendering Performance (rendering), 7. JavaScript Performance (js), 8. Advanced Patterns (advanced) (+1 more)

### Community 57 - "Review Focus"
Cohesion: 0.20
Nodes (9): C3 ecosystem, catalog and Firebase Implementation Plan, Global Constraints, Review Focus, Task 1: Domain line classification and catalog projection, Task 2: Deterministic seed dataset and CLI, Task 3: Shared institutional pages and global navigation, Task 4: Admin dashboard and read-only deliveries, Task 5: Targeted refinement and security regression coverage (+1 more)

### Community 58 - "C3 Platform: ecosistema, catálogo y Firebase"
Cohesion: 0.20
Nodes (9): Admin, Alcance y restricciones, C3 Platform: ecosistema, catálogo y Firebase, Experiencias institucionales, Fuentes verificadas, Objetivo, Seed reproducible, Seguridad (+1 more)

### Community 59 - "LineLandingPage"
Cohesion: 0.27
Nodes (7): CompitePage(), dynamic, ConectaPage(), dynamic, CreaPage(), dynamic, LineLandingPage()

### Community 60 - "domain/catalog.ts"
Cohesion: 0.29
Nodes (8): experienceLinesOf(), ExperienceMetadata, ExperienceWindow, fallbackLineOf(), isInExperienceLine(), KIND_LINE, LINES, base

### Community 61 - "⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️"
Cohesion: 0.22
Nodes (8): 1. Import and Initialize, 2. Authentication State, 3. Email and Password Authentication (Modern Concurrency), 4. Sign Out, ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️, Firebase Auth iOS Setup Guide, Sign In, Sign Up

### Community 62 - "Document Data Model"
Cohesion: 0.22
Nodes (8): Collection Group Support, Collections, Document Data Model, Documents, Examples, Firestore Data Model Reference, Subcollections, Use Cases

### Community 63 - "Firestore Indexes Reference"
Cohesion: 0.22
Nodes (9): CLI Commands, Config files, Firestore Indexes Reference, Index Density, Index Ordering, Index Structure, Management, Query Support Examples (+1 more)

### Community 64 - "Web SDK Usage (Enterprise Native Mode)"
Cohesion: 0.22
Nodes (8): 1. Initialization, 2. Decision Framework: Pipelines vs. Standard Queries, 3. Pipeline Examples, 4. Real-Time Listener & Document Operations, Full-Text Search, Relational Joins Pattern, Rules & Accountability, Web SDK Usage (Enterprise Native Mode)

### Community 65 - "firebase-auth-basics/SKILL.md"
Cohesion: 0.25
Nodes (5): Core Concepts, Identity Providers, Prerequisites, Tokens, Users

### Community 66 - "Firebase Auth & Google Sign-In for Flutter"
Cohesion: 0.25
Nodes (7): 1. `google_sign_in` 7.2.0 API Changes, 2. Initialization & Web Hang/Crash Pitfalls, 3. Web Logout Crashes, 4. Prototyping Workaround: Bypassing Firestore Composite Indices, 5. Robust `AuthService` Boilerplate, 6. Troubleshooting `auth/unauthorized-domain` on Flutter Web, Firebase Auth & Google Sign-In for Flutter

### Community 67 - "Basic Checks"
Cohesion: 0.25
Nodes (7): Authentication in Security Rules, Basic Checks, Check if user is signed in, Check if user owns the data, Check if user owns the document (field-based), Example: Email Verification Check, Token Properties

### Community 68 - "Manual Initialization"
Cohesion: 0.25
Nodes (8): 1. Create a Firestore Enterprise Database, 2. Create `firebase.json`, 2. Create `firestore.rules`, 3. Create `firestore.indexes.json`, Deploy rules and indexes, Local Emulation, Manual Initialization, Provisioning Firestore Enterprise Native Mode

### Community 69 - "Cloud Firestore in Flutter"
Cohesion: 0.29
Nodes (6): 1. Setup, 2. Best Practices: Type-Safe Models, 3. The Service Layer, 4. Listening to Streams in the UI (`StreamBuilder`), Cloud Firestore in Flutter, Initialization & References

### Community 70 - "Cloud Firestore in Flutter"
Cohesion: 0.29
Nodes (6): 1. Setup, 2. Best Practices: Type-Safe Models, 3. The Service Layer, 4. Listening to Streams in the UI (`StreamBuilder`), Cloud Firestore in Flutter, Initialization & References

### Community 71 - "Manual Initialization"
Cohesion: 0.29
Nodes (7): 1. Create `firebase.json`, 2. Create `firestore.rules`, 3. Create `firestore.indexes.json`, Deploy database, rules and indexes, Local Emulation, Manual Initialization, Provisioning Cloud Firestore

### Community 72 - "1. Instance Selection and Edition Detection"
Cohesion: 0.29
Nodes (7): 1. Instance Selection and Edition Detection, 2. Specialized Guides, A. Instance Found, B. No Instance Found (or New Requested), Cloud Firestore Database and Operations, Enterprise Edition / Native Mode (`references/enterprise/`), Standard Edition (`references/standard/`)

### Community 73 - "Assessment: Security Validator (Red Team Edition)"
Cohesion: 0.29
Nodes (6): Admin Bootstrapping & Privileges:, Assessment: Security Validator (Red Team Edition), Mandatory Audit Checklist:, Overview, Scoring Criteria, Scoring Criteria (1-5):

### Community 74 - "1. Eliminating Waterfalls"
Cohesion: 0.29
Nodes (7): 1.1 Check Cheap Conditions Before Async Flags, 1.2 Defer Await Until Needed, 1.3 Dependency-Based Parallelization, 1.4 Prevent Waterfall Chains in API Routes, 1.5 Promise.all() for Independent Operations, 1.6 Strategic Suspense Boundaries, 1. Eliminating Waterfalls

### Community 75 - "2. Bundle Size Optimization"
Cohesion: 0.29
Nodes (7): 2.1 Avoid Barrel File Imports, 2.2 Conditional Module Loading, 2.3 Defer Non-Critical Third-Party Libraries, 2.4 Dynamic Imports for Heavy Components, 2.5 Prefer Statically Analyzable Paths, 2.6 Preload Based on User Intent, 2. Bundle Size Optimization

### Community 76 - "Experience"
Cohesion: 0.33
Nodes (7): Catálogo y dominio, Catalog, Challenge, Experience, PublicChallenge, PublicChallengeSummary, PublicExperience

### Community 77 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, firebase, firebase-admin, next, react, react-dom, server-only

### Community 78 - "Workflow"
Cohesion: 0.33
Nodes (6): 1. Provisioning, 2. Client Setup & Usage, 3. Security Rules, Option 1. Enabling Authentication via CLI, Option 2. Enabling Authentication in Console, Workflow

### Community 79 - "React Best Practices"
Cohesion: 0.33
Nodes (5): Creating a New Rule, Getting Started, React Best Practices, Rule File Structure, Structure

### Community 80 - "ParticipationMode"
Cohesion: 0.33
Nodes (6): ParticipationMode, RubricCriterion, ChallengeInput, AdminEnrollmentRow, DeliveryView, SubmissionContext

### Community 82 - "4. Client-Side Data Fetching"
Cohesion: 0.40
Nodes (5): 4.1 Deduplicate Global Event Listeners, 4.2 Use Passive Event Listeners for Scrolling Performance, 4.3 Use SWR for Automatic Deduplication, 4.4 Version and Minimize localStorage Data, 4. Client-Side Data Fetching

### Community 83 - "Web Interface Guidelines"
Cohesion: 0.40
Nodes (4): Guidelines Source, How It Works, Usage, Web Interface Guidelines

### Community 84 - "accesibilidad.spec.ts"
Cohesion: 0.40
Nodes (3): persona, stamp, @axe-core/playwright

### Community 85 - "rules.test.ts"
Cohesion: 0.40
Nodes (3): @firebase/rules-unit-testing, collections, PROJECT_ID

### Community 86 - "check-vercel-env.mjs"
Cohesion: 0.40
Nodes (4): hasJson, hasSplitCredentials, missing, requiredPublic

### Community 87 - "equipos/[id]/route.ts"
Cohesion: 0.40
Nodes (4): ACTIONS, dynamic, PATCH(), TeamAction

### Community 89 - "Prefer Statically Analyzable Paths"
Cohesion: 0.50
Nodes (3): File-System Paths, Import Paths, Prefer Statically Analyzable Paths

### Community 91 - "jurados/[id]/route.ts"
Cohesion: 0.67
Nodes (3): DELETE(), dynamic, revokeJudge()

### Community 92 - "resumen/route.ts"
Cohesion: 0.67
Nodes (3): dynamic, GET(), getAdminDashboard()

### Community 93 - "publicar/route.ts"
Cohesion: 0.67
Nodes (3): dynamic, POST(), publishResults()

### Community 94 - "api/propuestas/route.ts"
Cohesion: 0.67
Nodes (3): dynamic, POST(), clientKeyOf()

### Community 95 - "overrides"
Cohesion: 0.67
Nodes (3): jose, overrides, jwks-rsa

## Ambiguous Edges - Review These
- `Medalla de temporada (idea en evaluación, oro y plata en V08)` → `Reconocimiento (Ganador, Finalista, Mención)`  [AMBIGUOUS]
  c3-platform-estilo/c3-platform-estilo/README.md · relation: conceptually_related_to
- `Jurado: dos evaluadores que puntúan de forma independiente` → `V05 Mi C3 (inicio del participante)`  [AMBIGUOUS]
  diseno-claude/fuente-canvas/V05-Mi-C3.dc.html · relation: conceptually_related_to
- `No cargar datos personales históricos de Copa ni HTC antes de plan de verificación, autorización y migración` → `Registro: Copa Salvadoreña 2026, medalla ORO (individual, 6 problemas, puesto 9 de 184)`  [AMBIGUOUS]
  diseno-claude/fuente-canvas/V08-Trayectoria.dc.html · relation: conceptually_related_to
- `No cargar datos personales históricos de Copa ni HTC antes de plan de verificación, autorización y migración` → `Registro: Hackathon de Turismo Creativo Vol. 1, 2.º lugar (equipo Ruta Viva)`  [AMBIGUOUS]
  diseno-claude/fuente-canvas/V08-Trayectoria.dc.html · relation: conceptually_related_to
- `V11 Seguimiento y evaluación (diseño)` → `Comentarios de jurados desactivados`  [AMBIGUOUS]
  diseno-claude/vistas/V11-Empresa-Evaluacion.html · relation: conceptually_related_to
- `V11 Seguimiento y evaluación (diseño)` → `Evaluación anónima tras cierre de entregas`  [AMBIGUOUS]
  diseno-claude/vistas/V11-Empresa-Evaluacion.html · relation: conceptually_related_to
- `PENDIENTES-REALES (pendientes operativos)` → `README raíz C3 Platform (corte 6)`  [AMBIGUOUS]
  docs/PENDIENTES-REALES.md · relation: conceptually_related_to
- `Rúbrica fija de cuatro criterios 0-10` → `Rúbrica simple con criterios configurables`  [AMBIGUOUS]
  diseno-claude/README.md · relation: conceptually_related_to

## Knowledge Gaps
- **49 isolated node(s):** `react-dom`, `@types/node`, `@types/react`, `@types/react-dom`, `firebase-tools` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 758 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **75 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `database()` connect `database` to `context.ts`, `app/retos/[challengeId]/page.tsx`, `requestActor`, `InscripcionPanel.tsx`, `notFound`, `respond`, `server/profile.ts`, `errors.ts`, `LineLandingPage.tsx`, `LineLandingPage`, `Manual Initialization`, `equipos/[id]/route.ts`, `jurados/[id]/route.ts`, `resumen/route.ts`, `publicar/route.ts`, `api/propuestas/route.ts`, `admin/inscripciones/[id]/route.ts`, `propuestas/[id]/route.ts`, `resultados/route.ts`, `[alias]/route.ts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `react-dom`, `@types/node`, `@types/react` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `V01 Home (vitrina, escritorio, público)` be split into smaller, more focused modules?**
  _Cohesion score 0.05539971949509116 - nodes in this community are weakly interconnected._
- **Why does `2. Create `firebase.json`` connect `Manual Initialization` to `database`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `validation.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07878787878787878 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Medalla de temporada (idea en evaluación, oro y plata en V08)` and `Reconocimiento (Ganador, Finalista, Mención)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Jurado: dos evaluadores que puntúan de forma independiente` and `V05 Mi C3 (inicio del participante)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._