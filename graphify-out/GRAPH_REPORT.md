# Graph Report - PLATAFORMA-MVP  (2026-10-13)

## Corpus Check
- 190 files · ~118,948 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .rules 1)

## Summary
- 1007 nodes · 2865 edges · 34 communities (31 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API - rutas del servidor
- Canvas de diseño (fuentes)
- Inscripción y entregas
- Decisiones de producto y estilo
- Pruebas de experiencias y retos
- Dependencias y configuración
- Pruebas E2E y accesibilidad
- Panel de administración
- Catálogo Explorar
- Evaluación de soluciones
- Panel de empresa
- Propuestas de empresa
- Mi C3 del participante
- Validación de experiencias
- Acceso y cuenta
- Reglas de seguridad y pruebas
- Tipos de dominio
- Configuración TypeScript
- Formulario Proponer reto
- Autorización y espacio de empresa
- Resultados oficiales (diseño)
- Flujo CI y visibilidad
- Estados de experiencias (diseño)
- Flujo del participante (diseño)
- Flujo de empresas (diseño)
- Tipos de experiencia (diseño)
- Perfil y validaciones
- Gestión de equipos
- Fundamentos visuales (diseño)
- Panel de resultados
- Rol de participante
- Tokens de color de marca
- Inventario de vistas aprobadas

## God Nodes (most connected - your core abstractions)
1. `database()` - 77 edges
2. `respond()` - 69 edges
3. `requestActor()` - 68 edges
4. `apiRequest()` - 48 edges
5. `ValidationFailure` - 42 edges
6. `HttpError` - 35 edges
7. `StatePill()` - 30 edges
8. `notFound()` - 30 edges
9. `README raíz C3 Platform (corte 6)` - 30 edges
10. `useSession()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `V06 Inscripción y equipos (funcional, móvil, joven)` --conceptually_related_to--> `V06 Inscripción y equipos (fuente canvas)`  [INFERRED]
  c3-platform-estilo/c3-platform-estilo/vistas/V06-Inscripcion-Equipos.html → c3-platform-starter/c3-platform-starter/diseno-claude/fuente-canvas/V06-Inscripcion-Equipos.dc.html
- `V07 Mi reto y entrega (vitrina, móvil, joven)` --conceptually_related_to--> `V07 Mi reto y entrega (participante)`  [INFERRED]
  c3-platform-estilo/c3-platform-estilo/vistas/V07-Mi-Reto.html → c3-platform-starter/c3-platform-starter/diseno-claude/fuente-canvas/V07-Mi-Reto.dc.html
- `V08 Perfil y trayectoria (vitrina, móvil, joven)` --conceptually_related_to--> `V08 Perfil y trayectoria (participante)`  [INFERRED]
  c3-platform-estilo/c3-platform-estilo/vistas/V08-Trayectoria.html → c3-platform-starter/c3-platform-starter/diseno-claude/fuente-canvas/V08-Trayectoria.dc.html
- `V09 Espacio de empresa (funcional, escritorio, empresa)` --conceptually_related_to--> `V09 Espacio de empresa (vista de organización)`  [INFERRED]
  c3-platform-estilo/c3-platform-estilo/vistas/V09-Espacio-Empresa.html → c3-platform-starter/c3-platform-starter/diseno-claude/fuente-canvas/V09-Espacio-Empresa.dc.html
- `V10 Proponer challenge (funcional, escritorio, empresa)` --conceptually_related_to--> `V10 Proponer challenge (formulario para empresas)`  [INFERRED]
  c3-platform-estilo/c3-platform-estilo/vistas/V10-Proponer-Challenge.html → c3-platform-starter/c3-platform-starter/diseno-claude/fuente-canvas/V10-Proponer-Challenge.dc.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Vocabulario único de estados** — c3_platform_estilo_c3_platform_estilo_readme_reto, c3_platform_estilo_c3_platform_estilo_readme_inscripcion, c3_platform_estilo_c3_platform_estilo_readme_equipo, c3_platform_estilo_c3_platform_estilo_readme_entrega, c3_platform_estilo_c3_platform_estilo_readme_evaluacion, c3_platform_estilo_c3_platform_estilo_readme_resultado, c3_platform_estilo_c3_platform_estilo_readme_propuesta, c3_platform_estilo_c3_platform_estilo_vistas_00_fundamentos_badge_estado [EXTRACTED 1.00]
- **Flujo del joven: V03 a V08** — c3_platform_estilo_c3_platform_estilo_vistas_v03_detalle_reto, c3_platform_estilo_c3_platform_estilo_vistas_v04_acceso, c3_platform_estilo_c3_platform_estilo_vistas_v06_inscripcion_equipos, c3_platform_estilo_c3_platform_estilo_vistas_v05_mi_c3, c3_platform_estilo_c3_platform_estilo_vistas_v07_mi_reto, c3_platform_estilo_c3_platform_estilo_vistas_v08_trayectoria [EXTRACTED 1.00]
- **Tres reglas de estilo del sistema visual** — c3_platform_estilo_c3_platform_estilo_readme_regla_azul_es_accion, c3_platform_estilo_c3_platform_estilo_readme_regla_linea_clasifica, c3_platform_estilo_c3_platform_estilo_readme_regla_estados_propios, c3_platform_estilo_c3_platform_estilo_readme_token_accion, c3_platform_estilo_c3_platform_estilo_readme_tokens_estado [EXTRACTED 1.00]
- **Rúbrica de cuatro criterios de 0 a 10** — c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_rubrica, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_criterio_calidad_resultado, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_criterio_claridad_enfoque, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_criterio_viabilidad_operativa, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_criterio_calidad_tecnica [EXTRACTED 1.00]
- **Pipeline de verificación de CI** — c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_verificacion_estatica, c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_pruebas_unitarias, c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_pruebas_reglas_emuladores, c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_build_produccion, c3_platform_starter_c3_platform_starter__github_workflows_ci_paso_e2e_playwright [EXTRACTED 1.00]
- **Camino del participante hasta la inscripción** — c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v02_explorar_dc_catalogo_experiencias, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_reto, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_inscripcion, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v03_detalle_reto_dc_equipo, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v04_acceso_dc_flujo_acceso_retorno_inscripcion, c3_platform_starter_c3_platform_starter_diseno_claude_fuente_canvas_v04_acceso_dc_cuenta_c3 [INFERRED 0.85]
- **Prueba de humo funcional: empresa, reto, inscripción, entrega, evaluación y publicación** — c3_platform_starter_c3_platform_starter_docs_plan_construccion_prueba_de_humo_funcional, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v10_proponer_challenge, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v12_admin, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v06_inscripcion_equipos, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v07_mi_reto, c3_platform_starter_c3_platform_starter_diseno_claude_vistas_v11_empresa_evaluacion, c3_platform_starter_c3_platform_starter_readme_publicacion_bloqueada [EXTRACTED 1.00]
- **Modelo de permisos verificados en servidor** — c3_platform_starter_c3_platform_starter_readme_permisos_servidor, c3_platform_starter_c3_platform_starter_readme_claim_c3admin, c3_platform_starter_c3_platform_starter_readme_firestore_deniega_cliente, c3_platform_starter_c3_platform_starter_readme_espacio_empresa, c3_platform_starter_c3_platform_starter_readme_jurados_asignados, c3_platform_starter_c3_platform_starter_readme_trayectoria_registrada [INFERRED 0.75]
- **Vocabulario de estados compartido por vistas y datos** — c3_platform_starter_c3_platform_starter_diseno_claude_readme_vocabulario_estados, c3_platform_starter_c3_platform_starter_readme_enrollments, c3_platform_starter_c3_platform_starter_readme_submissions, c3_platform_starter_c3_platform_starter_readme_teams, c3_platform_starter_c3_platform_starter_readme_company_proposals, c3_platform_starter_c3_platform_starter_readme_evaluations [INFERRED 0.75]

## Communities (34 total, 3 thin omitted)

### Community 0 - "API - rutas del servidor"
Cohesion: 0.05
Nodes (85): dynamic, GET(), dynamic, PATCH(), dynamic, POST(), dynamic, PATCH() (+77 more)

### Community 1 - "Canvas de diseño (fuentes)"
Cohesion: 0.06
Nodes (78): Canvas fuente de Fundamentos (Main.dc.html), Canvas fuente de V01 Home, Canvas fuente de V02 Explorar, Canvas fuente de V03 Detalle de reto, Canvas fuente de V04 Acceso, Canvas fuente de V05 Mi C3, Canvas fuente de V06 Inscripción y equipos, Canvas fuente de V07 Mi reto (+70 more)

### Community 2 - "Inscripción y entregas"
Cohesion: 0.07
Nodes (78): InscripcionPage(), canEditDelivery(), DELIVERY_LINK_MAX, DELIVERY_MAX_LINKS, DELIVERY_TEXT_MAX, DELIVERY_TEXT_MIN_TO_SUBMIT, DeliveryInput, deliveryState (+70 more)

### Community 3 - "Decisiones de producto y estilo"
Cohesion: 0.07
Nodes (38): V12-Admin fuente canvas (.dc.html), index.html del paquete de diseño, README del paquete de diseño (Estilo de las 12 vistas), Vocabulario único de estados, 00-Fundamentos (sistema visual), V01 Home (diseño), V02 Explorar experiencias (diseño), V03 Detalle de reto (diseño) (+30 more)

### Community 4 - "Pruebas de experiencias y retos"
Cohesion: 0.08
Nodes (40): createExperience(), setChallengeStatus(), setExperienceStatus(), experienceInput, now, duringDeadline, experienceInput, now (+32 more)

### Community 5 - "Dependencias y configuración"
Cohesion: 0.04
Nodes (44): dependencies, firebase, firebase-admin, next, react, react-dom, server-only, description (+36 more)

### Community 6 - "Pruebas E2E y accesibilidad"
Cohesion: 0.06
Nodes (29): persona, stamp, ADMIN_EMAIL, ADMIN_PASSWORD, joven, stamp, joven, stamp (+21 more)

### Community 7 - "Panel de administración"
Cohesion: 0.10
Nodes (40): AdminPanel(), changeStatus(), Centered(), NAV, PendingSection(), Section, StatusButtons(), ChallengeForm() (+32 more)

### Community 8 - "Catálogo Explorar"
Cohesion: 0.12
Nodes (30): Row, CardItem, dynamic, ExplorarPage(), LEYENDA, dynamic, HomePage(), Dato() (+22 more)

### Community 9 - "Evaluación de soluciones"
Cohesion: 0.11
Nodes (36): consolidatedAverage(), EVALUATIONS_REQUIRED, maxTotal(), parseRecognition(), parseScores(), Recognition, RECOGNITION_LABEL, RECOGNITIONS (+28 more)

### Community 10 - "Panel de empresa"
Cohesion: 0.13
Nodes (19): nextConfig, Confirmation, Assignment, TrayectoriaPage(), issueFor(), Trajectory, TrayectoriaPanel(), Solution (+11 more)

### Community 11 - "Propuestas de empresa"
Cohesion: 0.11
Nodes (26): Como(), EmpresaPanel(), Pagina(), EmpresaPage(), isHoneypotFilled(), parseProposalInput(), parseReviewInput(), PROPOSAL_LIMITS (+18 more)

### Community 12 - "Mi C3 del participante"
Cohesion: 0.12
Nodes (23): OrganizationOption, MiC3Panel(), cancel(), Seccion(), MiC3Page(), Banner, bannerFor(), EntregaPanel() (+15 more)

### Community 13 - "Validación de experiencias"
Cohesion: 0.13
Nodes (25): save(), ExperienceStatus, asObject(), ChallengeInput, EXPERIENCE_KINDS, ExperienceInput, optionalDate(), parseChallengeInput() (+17 more)

### Community 14 - "Acceso y cuenta"
Cohesion: 0.14
Nodes (20): AccesoPanel(), handleLogin(), handleRecover(), handleRegister(), errorCode(), LOGIN_ERRORS, REGISTER_ERRORS, safeNext() (+12 more)

### Community 15 - "Reglas de seguridad y pruebas"
Cohesion: 0.09
Nodes (16): collections, PROJECT_ID, afterRegistration, ana, challengeInput(), delivery, duringDeadline, experienceInput (+8 more)

### Community 16 - "Tipos de dominio"
Cohesion: 0.12
Nodes (18): Catalog, Challenge, ChallengeParticipation, CompanyProposal, Enrollment, Evaluation, EvaluationStatus, Experience (+10 more)

### Community 17 - "Configuración TypeScript"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 18 - "Formulario Proponer reto"
Cohesion: 0.16
Nodes (12): ProponerPage(), Campo(), issueFor(), ProponerForm(), EvaluacionEmpresaPage(), EvaluarMovilPage(), EvaluadorPanel(), reload() (+4 more)

### Community 19 - "Autorización y espacio de empresa"
Cohesion: 0.13
Nodes (16): auth, requireAdmin(), CHALLENGES, CompanyChallenge, CompanySubmission, getCompanySpace(), linkRepresentative(), myOrganizationIds() (+8 more)

### Community 20 - "Resultados oficiales (diseño)"
Cohesion: 0.16
Nodes (16): Canvas fuente de V12 Admin, V12 Admin: resultados oficiales (utilitaria, escritorio), Jurado empresa (evaluador de la organización), Jurado externo (segundo evaluador), Promedio de evaluaciones (solo con evaluaciones finalizadas), Regla: publicar resultado solo cuando todas las soluciones tienen las dos evaluaciones finalizadas, Etiqueta «Prototipo con datos de demostración», Criterio: calidad del resultado sobre el caso de prueba (0 a 10) (+8 more)

### Community 21 - "Flujo CI y visibilidad"
Cohesion: 0.13
Nodes (13): Visibilidad al publicar: ganadores en la página pública, puntaje a participantes y empresa, comentarios de jurados desactivados por defecto, Workflow CI de GitHub Actions (typecheck, lint, pruebas, build, E2E), Paso CI: build de producción, Paso CI: recorridos de escritorio y móvil con Playwright (informe subido si falla), Paso CI: pruebas de reglas y servicios con emuladores (requiere Java 21), Paso CI: pruebas unitarias del dominio, Paso CI: typecheck y lint, Regla: sin despliegue automático de producción (+5 more)

### Community 22 - "Estados de experiencias (diseño)"
Cohesion: 0.17
Nodes (14): Resultado oficial publicado por C3, Estado de inscripción: Pendiente, Aprobada, Rechazada, Cancelada, Sello de evidencia C3, Copa Salvadoreña de Programación 2026 (competencia individual, concluida, solo informativa), Hackathon de Turismo Creativo (serie: Vol. 1 concluido, Vol. 2 próximo), Regla: solo las experiencias con inscripción abierta se inscriben desde la plataforma, Reto: Conciliación bancaria automática (Distribuidora Atlas, concluido), V05 Mi C3 (inicio del participante) (+6 more)

### Community 23 - "Flujo del participante (diseño)"
Cohesion: 0.23
Nodes (14): Flujo de progreso del participante: Inscrito, Habilitado, Entregando, Evaluación, Resultado, Calendario del reto: inscripción hasta el 31 de octubre, entrega del 1 al 14 de noviembre, evaluación del 15 al 22 de noviembre, resultados el 25 de noviembre, Entrega de la solución: repositorio, demo o video (máximo 4 minutos), memoria técnica de dos páginas y tabla de resultados, Equipo: 2 a 4 personas por reto, Inscripción: requiere cuenta C3 y la revisa C3 antes de habilitar; un reto por persona, Reto (challenge empresarial): Ruteo de última milla con ventanas horarias, Flujo de acceso: al entrar o crear cuenta se vuelve directo a la inscripción del reto, V06 Inscripción y equipos (fuente canvas) (+6 more)

### Community 24 - "Flujo de empresas (diseño)"
Cohesion: 0.21
Nodes (12): Estado de reto: Borrador, Próximo, Abierto, En evaluación, Concluido, Cancelado, Rol: empresa (propone problemas que se convierten en retos), Dataset de 400 pedidos (material del reto), Vinculación de representante a organización (revisión de solicitud por C3, misma cuenta), V09 Espacio de empresa (vista de organización), Flujo para empresas: proponer la necesidad, C3 define el reto, equipos entregan, la empresa evalúa y C3 publica, Regla: el espacio de empresa requiere sesión y organización vinculada, Selector de organización activa (Transportes Delta y Delta Logística) (+4 more)

### Community 25 - "Tipos de experiencia (diseño)"
Cohesion: 0.39
Nodes (8): Compite: competencias (línea accion), Conecta: challenges empresariales (línea conecta), Crea: hackathons (línea crea), V01 Home C3 (landing pública), V02 Explorar experiencias (catálogo), Catálogo de experiencias: retos, competencias y hackathons, V03 Detalle de reto (challenge empresarial), V04 Acceso (entrar o crear cuenta)

### Community 26 - "Perfil y validaciones"
Cohesion: 0.28
Nodes (6): isHttpsUrl(), parseProfileDetails(), PROFILE_LIMITS, ProfileDetailsInput, FieldIssue, base

### Community 27 - "Gestión de equipos"
Cohesion: 0.39
Nodes (8): EquipoPanel(), create(), join(), load(), manage(), run(), issueFor(), teamPresentation()

### Community 28 - "Fundamentos visuales (diseño)"
Cohesion: 0.29
Nodes (5): Fundamentos de estilo C3 Platform (Main.dc.html), Estado de entrega: Sin entrega, Borrador, Entregada, Fuera de plazo, Estado de evaluación y resultado: Pendiente, En curso, Finalizada, Resultado no publicado, Resultado publicado, Vocabulario único de estados, Flujo de entrega: borrador guardado y envío antes del cierre (14 de noviembre, 23:59)

### Community 29 - "Panel de resultados"
Cohesion: 0.29
Nodes (6): Board, BoardRow, ChallengeOption, NOT_PUBLISHED, PUBLISHED, RECOGNITION_OPTIONS

### Community 31 - "Rol de participante"
Cohesion: 0.67
Nodes (3): Flujo del participante: explorar, inscribirse solo o en equipo, entregar y recibir resultado oficial, Rol: estudiante o joven técnico (participante), Cuenta C3: nombre, correo y contraseña de 8 caracteres o más; el perfil se completa después

## Ambiguous Edges - Review These
- `Reconocimiento (Ganador, Finalista, Mención)` → `Medalla de temporada (idea en evaluación, oro y plata en V08)`  [AMBIGUOUS]
  c3-platform-estilo/c3-platform-estilo/README.md · relation: conceptually_related_to
- `Jurado: dos evaluadores que puntúan de forma independiente` → `V05 Mi C3 (inicio del participante)`  [AMBIGUOUS]
  c3-platform-starter/c3-platform-starter/diseno-claude/fuente-canvas/V05-Mi-C3.dc.html · relation: conceptually_related_to
- `Registro: Copa Salvadoreña 2026, medalla ORO (individual, 6 problemas, puesto 9 de 184)` → `No cargar datos personales históricos de Copa ni HTC antes de plan de verificación, autorización y migración`  [AMBIGUOUS]
  c3-platform-starter/c3-platform-starter/diseno-claude/fuente-canvas/V08-Trayectoria.dc.html · relation: conceptually_related_to
- `Registro: Hackathon de Turismo Creativo Vol. 1, 2.º lugar (equipo Ruta Viva)` → `No cargar datos personales históricos de Copa ni HTC antes de plan de verificación, autorización y migración`  [AMBIGUOUS]
  c3-platform-starter/c3-platform-starter/diseno-claude/fuente-canvas/V08-Trayectoria.dc.html · relation: conceptually_related_to
- `README raíz C3 Platform (corte 6)` → `PENDIENTES-REALES (pendientes operativos)`  [AMBIGUOUS]
  c3-platform-starter/c3-platform-starter/docs/PENDIENTES-REALES.md · relation: conceptually_related_to
- `V11 Seguimiento y evaluación (diseño)` → `Comentarios de jurados desactivados`  [AMBIGUOUS]
  c3-platform-starter/c3-platform-starter/diseno-claude/vistas/V11-Empresa-Evaluacion.html · relation: conceptually_related_to
- `V11 Seguimiento y evaluación (diseño)` → `Evaluación anónima tras cierre de entregas`  [AMBIGUOUS]
  c3-platform-starter/c3-platform-starter/diseno-claude/vistas/V11-Empresa-Evaluacion.html · relation: conceptually_related_to
- `Rúbrica simple con criterios configurables` → `Rúbrica fija de cuatro criterios 0-10`  [AMBIGUOUS]
  c3-platform-starter/c3-platform-starter/diseno-claude/README.md · relation: conceptually_related_to

## Knowledge Gaps
- **49 isolated node(s):** `react-dom`, `@types/node`, `@types/react`, `@types/react-dom`, `firebase-tools` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 314 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `firebase-admin` connect `Autorización y espacio de empresa` to `API - rutas del servidor`, `Inscripción y entregas`, `Pruebas de experiencias y retos`, `Dependencias y configuración`, `Pruebas E2E y accesibilidad`, `Evaluación de soluciones`, `Propuestas de empresa`, `Validación de experiencias`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `react-dom`, `@types/node`, `@types/react` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API - rutas del servidor` be split into smaller, more focused modules?**
  _Cohesion score 0.05261707988980716 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Panel de empresa` to `Dependencias y configuración`, `Panel de administración`, `Catálogo Explorar`, `Mi C3 del participante`, `Acceso y cuenta`, `Formulario Proponer reto`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Canvas de diseño (fuentes)` be split into smaller, more focused modules?**
  _Cohesion score 0.056179775280898875 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Reconocimiento (Ganador, Finalista, Mención)` and `Medalla de temporada (idea en evaluación, oro y plata en V08)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Jurado: dos evaluadores que puntúan de forma independiente` and `V05 Mi C3 (inicio del participante)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._