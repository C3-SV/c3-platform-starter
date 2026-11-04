# Plan: C3 Challenges · demo integral (3-nov-2026)

**Fuente de verdad:** [docs/UPDATE-2026-11-03-demo-integral.md](../../UPDATE-2026-11-03-demo-integral.md) (documento maestro, decisiones del equipo).
**Rama de trabajo:** `feat/demo-integral-2026-11-03`, creada desde `fun-brag-skill-testing` (HEAD `80e4b22`). Commits, verificación y PR: ver §6 y §9.
**Ensayo:** 4-nov-2026. Este plan es ejecutable por tramos; cada tramo cierra con pruebas y deja constancia aquí.

Leyenda de estado: **Hecho** (código + pruebas en esta rama) · **Parcial** (existe algo, falta lo indicado) · **Pendiente** (no empezado) · **Bloqueado** (requiere decisión o autorización).

---

## 1. Modelo de negocio aplicado en esta rama

| Concepto | Decisión en el código | Dónde |
| --- | --- | --- |
| Línea de un challenge empresarial | Principal **Conecta**; secundaria Crea. Etiqueta «Conecta · Challenge empresarial» | `seed-data.ts`, `presentation.ts` (`KIND_LABEL`), `EmpresaPanel.tsx` |
| Paquetes comerciales | Esencial US$800 · Completo US$1,500 · Destacado US$3,000 (tarifas de referencia, modelo por proyecto) | `domain/commercial.ts`; campo opcional `commercialPackage` en el challenge (`validation.ts`, `server/catalog.ts`) |
| Condiciones transversales | Premios, licencias/IP y contrataciones **no** incluidas; sin checkout ni suscripción | `COMMERCIAL_CONDITIONS` |
| Lista corta | Una entrada por **entrega enviada**; motivo cualitativo obligatorio (10–500) | `domain/contact.ts`, `server/talent.ts`, colección `shortlists` |
| Solicitud de contacto | Solo representante vinculada; requiere lista corta, inscripción aprobada **en este challenge** y entrega **individual**. Nace en «esperando consentimiento» y solo la persona la acepta o declina. Tras aceptar, la empresa registra «contactado» o «seguimiento». La persona puede revocar desde aceptado, contactado o seguimiento. Declinado y revocado son finales | `domain/contact.ts` (transiciones puras), `server/talent.ts` (transacciones), colección `contactRequests` (id `challengeId__hash`, donde el hash resume el uid) |
| Defensa | Recurso separado de la entrega: enlace https opcional + resumen y decisiones obligatorios; pruebas, trade-offs y uso de IA opcionales. Solo sobre entrega **enviada**; en equipo, la líder; con el challenge publicado | `domain/defense.ts`, `server/talent.ts`, colección `defenses` (id = `submissionId`) |
| Datos de contacto | **No se muestran** en ninguna vista. El canal de contacto queda pendiente de decisión | §5 |

Reglas de dominio cubiertas por pruebas unitarias: `tests/unit/commercial.test.ts`, `tests/unit/contact.test.ts`, `tests/unit/defense.test.ts`.

---

## 2. Inventario de recorridos (update §B)

### Joven (J1–J9)

| Paso | Estado | Evidencia / faltante |
| --- | --- | --- |
| J1 Catálogo y detalle | **Hecho** | Catálogo, detalle y filtros por tipo, línea, estado y «solo demo» (`FiltrosExplorar`, en el cliente) |
| J2 Acceso con retorno al reto | Hecho | `safeNext` y `next` (PRODUCTO §4) |
| J3 Inscripción idempotente | Hecho | ID determinista `experienceId__userId`; pruebas de participación |
| J4 Mi challenge | Parcial | Existe `/mi-c3/retos/[id]`. Faltan progreso y checklist de documentos |
| J5 Bitácora / checkpoints | **Hecho** | Bitácora con texto y enlace https en Mi challenge (`BitacoraPanel`), con inscripción aprobada, challenge publicado y hasta el cierre de entregas; la empresa la ve en el tablero. Dos avances en el seed local. Carga remota pendiente |
| J6 Entrega (texto y enlaces, borrador y envío) | Hecho | `saveDelivery`, pruebas de entregas |
| J7 Defensa | **Hecho en servidor y UI** | `DefensaPanel.tsx` dentro de Mi challenge; API `/api/retos/[id]/defensa`; pruebas de emulador. **Falta prueba E2E** |
| J8 Estado y retroalimentación publicada | **Hecho** | La empresa redacta la retroalimentación por entrega y decide si la publica (`RetroalimentacionCard`). La persona solo ve la publicada, también con el challenge concluido. **Pendiente:** estado de evaluación visible para la persona (no implementado) |
| J9 Solicitud de contacto y consentimiento | **Hecho en servidor y UI** | `ContactosPanel.tsx` en Mi C3; API `/api/contactos`; la etiqueta DEMO aparece en datos inventados |

### Empresa (E0–E10)

| Paso | Estado | Evidencia / faltante |
| --- | --- | --- |
| E0 Propuesta sin cuenta | **Hecho:** copy nuevo del update, aviso de datos sensibles y selección opcional de intención (identificar talento, explorar una solución o ambos). La confirmación aparece solo si la propuesta quedó guardada. Campo trampa y límite de propuestas se conservan | Ninguno |
| E1 Admin: propuesta → challenge | Parcial | Enlace desde una propuesta aceptada con organización a la consola, con la organización ya elegida (`PropuestasPanel`, `ExperienciasPanel`). **Falta** el paso directo por estados `En revisión → Aprobado → Publicado` |
| E2 Cuenta empresa + dashboard | Parcial | `/empresa` muestra por challenge: inscritas, entregas, en evaluación y en lista corta. **Faltan** perfiles de interés |
| E3 Configuración del reto | Parcial | Solo admin (`ExperienciasPanel`). Paquete visible en el tablero pendiente |
| E4 Participantes y entregas | Parcial | Tablero de entregas enviadas con evidencia, defensa, bitácora, retroalimentación y estado de evaluación. **Falta** listar inscritos sin entrega y filtros |
| E5 Entregable / Proceso / Defensa | Hecho (con límites) | `TalentoPanel.tsx`: entregable, proceso (decisiones, pruebas, trade-offs declarados y bitácora de la persona) y defensa. **No hay telemetría de proceso** |
| E6 Evaluación con rúbrica | Hecho | `EvaluadorPanel`, `server/evaluation.ts`, pruebas de evaluación |
| E7 Matriz comparativa y lista corta | Hecho | Lista corta por entrega enviada con motivo. Matriz por criterio cuando C3 publicó con puntajes visibles (`TalentoPanel`) |
| E8 Solicitar contacto | **Hecho** | Botón «Solicitar contacto» en `TalentoPanel` |
| E9 Seguimiento y cierre | **Hecho** | «Registrar que ya la contactamos» y «Registrar seguimiento». Sin 30/90 días automáticos |
| E10 Estados vacíos, carga, error | Parcial | Presentes en los paneles nuevos. Revisión a 390 px y 1280 px: ver §9 |

---

## 3. Tareas del update (Task 0–5)

| Task | Qué pide | Estado en esta rama |
| --- | --- | --- |
| **0 · Narrativa y taxonomía** | Copy integral, taxonomía Conecta, DEMO visible, paquetes correctos | **Parcial.** Hecho: taxonomía y etiqueta del challenge empresarial; paquetes; DEMO visible en el tablero, las tarjetas de empresa y las solicitudes; home y `<title>` según la matriz §0.B. Pendiente: eliminar «Rutas sostenibles» de docs y textos (el seed ya cambió) |
| **1 · Impeccable y pase visual** | Instalar skill en el repo, auditar, pulir | **Parcial.** `impeccable context` e `impeccable detect` ejecutados (§5, punto 7). `npx impeccable install` no se ejecutó. Revisión visual a 390 y 1280 px: ver §9 |
| **2 · Flujo del joven** | J1–J9 | Ver §2. Hecho: J1, J3, J5, J6, J7, J8, J9. Pendiente: J4 (progreso y checklist) |
| **3 · Flujo de la empresa** | E0–E10 | Ver §2. Hecho: E2, E4 (tablero), E5, E6, E7, E8, E9. Pendiente: E1 (paso directo por estados), E4 (inscritos sin entrega) |
| **4 · Migraciones y seed** | Esquema aditivo, seed idempotente, dataset demo, reglas | **Parcial.** Hecho en código: `SEED_VERSION = 3` (challenge demo marcado, evaluaciones completas, resultado publicado, bitácora y retroalimentación), modo `update` con respaldo, manifiesto regenerado (55 registros) y reset con simulación por defecto. Pendiente: reglas de Firestore por actor (hoy: denegar todo + servidor) |
| **5 · Cuentas demo reales y E2E** | Auth real joven/empresa/admin, E2E | **Parcial.** Cuentas y seed v2 en `c3-platform-demo` (§8). Carga remota de v3 pendiente de autorización (§5, punto 1). E2E de escritorio y móvil: ver §9 |

---

## 4. Design system de C3 (artifact existente)

Artifact «C3» de tipo **Design System** (`https://claude.ai/artifact/8fjePTGraHti2uetgUxmrY`, versión 3 de tokens). Se usó como referencia; **no se creó uno nuevo**.

- Colores de línea, navy y tipografía coinciden con `diseno-claude/tokens/tokens.json` del repo (Montserrat / Poppins; navy `#0F203E`; Compite `#205298`; Crea `#33BEAC`; Conecta `#4F5BA9`).
- **Diferencias conservadas en el repo:** fondo claro `#F2F6FB` (repo) frente a `#F3F6FA` (artifact). El repo es la fuente de la app; no se alternan paletas (AGENTS §4).
- **No importados:** tokens de marketplace (`compra`, `compra-intensa`, `overlay-foto`, `c3-demo` de Ticketera). El update no pide checkout.
- **Conflicto de voz:** el README del artifact pide tuteo; el update exige **voseo** para esta demo. Se sigue el update.
- Regla útil del artifact que sí se aplica: texto 4.5:1, objetivos táctiles de 44 px, sin gradientes decorativos, la etiqueta DEMO visible, el turquesa como texto solo en `crea-texto`.

---

## 5. Decisiones abiertas y bloqueos (para el responsable)

1. **Firebase remoto (Task 4–5) — proyecto decidido por el responsable el 3-nov-2026: `c3-platform-demo`** (el que ya existe en su cuenta; decisión explícita, excepción a AGENTS §7 registrada en §15).
   - **Estado del proyecto (solo lectura, 3-nov-2026):** tiene una app web «C3 Platform» y la base `(default)` en Firestore Standard. No se verificó si Auth tiene habilitado Email/Password, ni si el sitio `demo.plat.c3.com.sv` lee este proyecto.
   - **Creado por error y sin uso:** `c3-challenges-demo`. Sigue en la cuenta; su eliminación queda pendiente de confirmación del responsable.
   - **Carga remota de v3 (pendiente de autorización):** `demo-reset --apply` con respaldo fuera del repo (los ids de solicitud de contacto cambiaron) y después `seed` en modo `update` con respaldo y `--allow-update`. Verificar en solo lectura. Nada de esto se ha ejecutado.
   - Dominio de correo: `demo.c3.com.sv` (cuentas `joven@`, `empresa@`, `admin@`). Firebase Auth no envía correos en la demo; la recuperación de contraseña no está disponible.
2. **Actualización del seed:** resuelta en código con `update` (con respaldo y `--allow-update`), y `apply` se niega ante versiones anteriores. Aplicar v3 en remoto requiere la autorización del punto 1.
3. **Rúbrica con pesos:** el update pide 20 / 30 / 25 / 25 %. El modelo valida puntajes enteros de **0 hasta el máximo de cada criterio** (la rúbrica admite máximos de 1 a 10), sin pesos. Se usaron cuatro criterios de 10 puntos. Decidir si se añade ponderación al modelo.
4. **Canal de contacto:** sin correo ni teléfono visibles. Falta definir cómo se comparten datos tras «aceptado» (¿correo en la plataforma, mensaje interno, o solo C3 como facilitador?).
5. **Contacto con equipos:** hoy solo entregas individuales. Falta definir a quién se contacta de un equipo.
6. **Resultados y plazo de la defensa:** la defensa se bloquea cuando el challenge concluye, pero no hay fecha de congelación de la evaluación. Los jurados pueden cambiar evaluaciones después de publicar, y el tablero recalcula promedios desde las evaluaciones vivas. Decidir si se congela al publicar y si se guarda una instantánea (hallazgo de la revisión final, §9).
7. **Impeccable:** plugin de usuario `impeccable` (skill v4.8.0, CLI 0.1.18 instalada fuera del repo). Ejecutados: `impeccable context` (sin `PRODUCT.md`: el trabajo es un refinamiento de la vista existente, no un rediseño) e `impeccable detect` sobre `src/app` y `src/components` (4 avisos en `globals.css` y `layout.tsx`, archivos previos a esta rama y no modificados). `npx impeccable install` no se ejecutó: escribe configuración en el repo.
8. **Cuentas de prueba de la plataforma:** las contraseñas de `e2e/` y `tests/` son de emulador. Las cuentas demo reales nunca se escriben en el repo.
9. **Sal de la conexión (`RATE_LIMIT_SALT`):** en producción es obligatoria. Sin ella, `POST /api/propuestas` responde error. Configurarla en Vercel antes de recibir propuestas; no se versiona.

---

## 6. Git y verificación

- **Commits:** `git log origin/dev..HEAD` lista los de la rama. La PR a `main` y su estado de verificación están en §9.
- **Verificación ejecutada sobre el código final de la rama:**
  - `npm run typecheck`: sin errores.
  - `npm run lint`: sin errores.
  - `npm test` (unitarias): 168 de 168 pasan.
  - `npm run test:rules` (emulador Auth + Firestore, reglas y pruebas de servidor): 128 de 128 pasan, incluidas las pruebas de regresión de §9.
  - `next build`: compila; el aviso de seguridad de Next.js 16.4.0 interrumpe el primer intento de forma intermitente, ya registrado en [PENDIENTES](../../PENDIENTES-REALES.md).
- **No ejecutado:** `seed` en modo dry-run contra el remoto y reset remoto. Requieren autorización por operación (§5, punto 1).

---

## 7. Próximos tramos (orden del update, prioridad empresa)

1. Carga remota de v3 con autorización explícita del responsable (§5, punto 1).
2. Flujo directo de propuesta a challenge en estados (E1) y listado de inscritos sin entrega (E4).
3. Estado de evaluación visible para la persona (J8) y progreso en Mi challenge (J4).
4. Decisión sobre la congelación de resultados (§5, punto 6).
5. E2E de defensa y retroalimentación, y revisión visual a 390 y 1280 px.

---

## 8. Registro de ejecución (3-nov-2026, tras la autorización del responsable)

**Remoto (`c3-platform-demo`, operaciones con la clave de cuenta de servicio entregada por el responsable):**
- `seed --mode update`: 8 documentos del seed v1 actualizados a v2 (7 experiencias, de las cuales 6 solo cambian `seedVersion`, y el challenge demo: título, rúbrica, resumen, problema, entregables, organización y paquete). Respaldo previo: `C:\Users\chris\.c3-demo\backup-seed-v1-2026-11-03.json`, fuera del repo.
- Creados: 1 organización demo, 6 perfiles de demostración sin cuenta, 7 inscripciones, 5 participaciones, 5 entregas (4 enviadas y 1 borrador), 3 defensas, 2 listas cortas, 2 solicitudes de contacto y 3 propuestas.
- Cuentas `joven@`, `empresa@` y `admin@demo.c3.com.sv` creadas con UID fijos (`c3-demo-joven`, `c3-demo-empresa`, `c3-demo-admin`). Claim `c3Admin` solo en admin. La empresa queda vinculada a la organización demo. Contraseñas en `C:\Users\chris\.c3-demo\credenciales-demo.txt`, fuera del repo.
- Verificado en solo lectura: UIDs, claims, vínculo y conteos. No se modificaron los datos previos del proyecto (1 inscripción, 1 participación, 1 asignación de jurado, 1 perfil público, 1 bitácora y 4 cuentas existentes).
- Pendiente de decisión: si el sitio `demo.plat.c3.com.sv` lee este proyecto; y qué hacer con `c3-challenges-demo` (creado por error, sin datos).

**Código y pruebas (3-nov-2026, sin commits en ese momento):**
- Corregido: `fail()` del seed no cortaba la ejecución, y un `apply` con conflictos o versiones anteriores escribía igual. Ahora `fail()` sale con código 1, y se comprobó en emulador que no hay escrituras.
- Nuevo: modo `update` con respaldo y guardia de título duplicado. Pruebas: `tests/unit/seed-plan.test.ts`, `tests/unit/seed-update.test.ts`, `tests/emulator/demo-dataset.test.ts`.
- Narrativa de la home y del `<title>` por defecto según la matriz §0.B. Filtros de `/explorar` (tipo, línea, estado y demo). Cifras por challenge en `/empresa` (inscritas, entregas, lista corta). Tabla de comparación de evidencia en el tablero de talento.
- Verificación de ese tramo: typecheck y lint limpios; unitarias 156/156; emulador 120/120.

**Bloque final (4-nov-2026, probado en grupo):**
- E1: desde una propuesta aceptada con organización, un enlace lleva a la consola con la organización ya elegida (`src/app/admin/PropuestasPanel.tsx`, `ExperienciasPanel.tsx`, `forms.tsx`).
- Evaluación y matriz: dos jurados, evaluaciones y resultado publicado de demostración. La empresa ve estado de evaluación, promedio y matriz por criterio solo con resultados publicados con puntajes (`src/lib/domain/evaluation.ts`, `talent.ts`, `TalentoPanel.tsx`). La cifra «En evaluación» del espacio de empresa ya se muestra.
- Reset de demo: selección pura y simulación por defecto (`src/lib/seed/demo-reset.ts`, `scripts/demo-reset.mjs`). No se ejecutó en remoto.
- Provisión en emulador usa la contraseña de prueba de la suite; en remoto, contraseñas aleatorias en archivo fuera del repo.

**Revisión adversarial de los caminos de escritura (workflow `wf_b053ae95-cc8`, 9 agentes):** se verificaron 5 hallazgos y 4 resultaron reales. Corregidos:
- Provisión: una cuenta preexistente con correo demo y otro UID ya no recibe `c3Admin` ni vínculo; el script se detiene (`tests/emulator/demo-accounts-guard.test.ts`).
- Contacto: una solicitud declinada o revocada es final; la empresa no la reemplaza y el tablero no ofrece pedirla de nuevo (`tests/emulator/talent.test.ts`).
- Seed: la guardia de títulos duplicados también aplica a las actualizaciones (`tests/unit/seed-update.test.ts`).
- Seed: lista cerrada de proyectos (`c3-platform-demo` y `demo-c3-platform`). El script de provisión exige `FIRESTORE_EMULATOR_HOST` con `--emulator`.
- Interfaz: la defensa ya no promete edición «hasta que C3 cierre la evaluación», porque el servidor no lo controla.

---

## 9. Revisión final antes de la PR (4-nov-2026)

**Revisión adversarial por dimensiones (workflow `wf_c1ce78d0-206`, 10 agentes, solo lectura):** 5 dimensiones (dominio, autorización y privacidad, datos demo y scripts, interfaz y accesibilidad, documentación frente al código). Hallazgos confirmados por un verificador adversarial: **43**. Ninguno quedó sin verificar.

Corregidos en código, con prueba cuando aplica:
- **Inscripción de un challenge:** una inscripción a un challenge no habilita entregar en otro de la misma experiencia (`participation.ts`, `resolveContext`). Prueba: `tests/emulator/talent.test.ts`.
- **Solicitud de contacto:** comprobaciones y escritura en una transacción; la inscripción aprobada debe ser la de este challenge (`talent.ts`, `requestContact`).
- **Uid de la persona:** la fila del tablero ya no incluye `userId`, y el id de la solicitud usa un resumen del uid (`ids.ts`, `contactRequestDocId`). Prueba: `tests/emulator/talent.test.ts`.
- **Solicitudes ajenas:** avanzar una solicitud de otra empresa responde como inexistente (404). Prueba: `tests/emulator/talent.test.ts`.
- **Challenge concluido:** la persona sigue leyendo su retroalimentación publicada, pero bitácora y defensa no admiten cambios (409 `reto_concluido`). Prueba: `tests/emulator/talent.test.ts`.
- **Evaluaciones:** lectura y escritura en transacción; una evaluación finalizada no vuelve a borrador (`evaluation.ts`, `saveEvaluation`).
- **Sal de la conexión:** sin `RATE_LIMIT_SALT` en producción, el servidor falla cerrado; en emulador usa una sal de prueba (`context.ts`).
- **Propuesta pública:** la confirmación solo aparece si el servidor guardó la propuesta (`ProponerForm.tsx`).
- **Datos demo:** el challenge demo lleva la marca `demo` y el predicado de reset la exige; la solución publicada tiene dos evaluaciones finalizadas de jurados distintos; la retroalimentación de la cuenta joven está publicada (`seed-data.ts`, `SEED_VERSION = 3`; `demo-reset.ts`). Prueba: `tests/emulator/demo-dataset.test.ts`.
- **Scripts:** reset y provisión no heredan el endpoint del emulador en modo remoto; el JSON de la credencial se valida sin imprimir su contenido; el conteo del reset solo cuenta lo que sí se borra; el encabezado de provisión usa el proyecto real; la membresía de representante conserva su fecha original (`demo-reset.mjs`, `provision-demo-accounts.mjs`, `demo-accounts.ts`).
- **Interfaz:** DEMO visible en las tarjetas de empresa y en las solicitudes de la persona; el error del enlace de la bitácora se asocia a su campo; un fallo al recargar el tablero tras guardar retroalimentación muestra error; el copy de la propuesta usa «challenge».
- **Documentación:** AGENTS §14 e §15, README, PRODUCTO-Y-NAVEGACION, PENDIENTES-REALES, guía de la demo y este plan se alinearon con el código; el manifiesto se regeneró.

Pendientes que requieren decisión del responsable (no se implementan sin ella):
- **Resultados después de publicar:** las evaluaciones pueden cambiar después de publicar, y los promedios se recalculan. Decidir si se congela (§5, punto 6).
- **Sal de la conexión:** configurar `RATE_LIMIT_SALT` en Vercel (§5, punto 9).
- **Remoto:** cargar v3 implica reset y actualización del seed con respaldo y autorización (§5, punto 1). Los ids de solicitud de contacto cambiaron; las solicitudes cargadas con el formato anterior quedarían huérfanas.
- **Comandos de seed en `package.json`:** no pasan `--project` (PENDIENTES-REALES). Cambiar solo por decisión del responsable.

Hallazgos de baja prioridad no corregidos:
- Estado `busy` de `ContactosPanel` por solicitud: funciona, pero no bloquea otras acciones mientras una está en curso.
- El modo `update` del seed no registra las creaciones en el respaldo.

**Verificación final sobre el código de la rama:**
- Typecheck y lint sin errores; unitarias 168/168; emulador 128/128.
- E2E de escritorio y móvil (`e2e-runner`, con reintento del build): **217 pasan, 0 fallan, 23 se saltan** porque cada prueba declara su proyecto.
- Revisión visual: suite `e2e/capturas.spec.ts`, 14/14 pasan (home, explorar, compite, crea, conecta, acceso y proponer, en 1280 y 390 px). Las capturas no sustituyen la revisión de las pantallas con sesión (Mi C3, empresa y consola).

**Correcciones de pruebas en esta revisión (no de interfaz):**
- Cierre de sesión de administración: `loginAt` esperaba `/admin`, pero la consola redirige a `/admin/resumen`, y el menú de la cuenta se cierra al cambiar de ruta. La prueba ahora espera su destino, y `signOutUi` reintenta abrir el menú y pulsar «Salir» dentro de la misma espera.
- Recorrido móvil de desbordes: `networkidle` no era fiable con datos en vivo; la prueba espera el `<main>` antes de medir.

**Intermitencia del build:** `next build` falla a veces en el primer intento con el aviso de seguridad de Next.js (comprobación de advisories por red). Los dos intentos anteriores lo mostraron: uno pasó y el siguiente no. El runner de E2E reintenta el build; `playwright.config.ts` no. Sin corregir en esta rama.
