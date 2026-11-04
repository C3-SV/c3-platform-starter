# Plan: C3 Challenges · demo integral (3-nov-2026)

**Fuente de verdad:** [docs/UPDATE-2026-11-03-demo-integral.md](../../UPDATE-2026-11-03-demo-integral.md) (documento maestro, decisiones del equipo).
**Rama de trabajo:** `feat/demo-integral-2026-11-03`, creada desde `fun-brag-skill-testing` (HEAD `80e4b22`). Sin commits ni push: ver §6.
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
| Solicitud de contacto | Solo representante vinculada; requiere lista corta, inscripción aprobada y entrega **individual**; la persona acepta, declina o revoca. Estados: esperando consentimiento → aceptado → contactado → seguimiento; revocado en cualquier estado activo | `domain/contact.ts` (transiciones puras), `server/talent.ts`, colección `contactRequests` (id `challengeId__userId`) |
| Defensa | Recurso separado de la entrega: enlace https opcional + resumen y decisiones obligatorios; pruebas, trade-offs y uso de IA opcionales. Solo sobre entrega **enviada**; en equipo, la líder | `domain/defense.ts`, `server/talent.ts`, colección `defenses` (id = `submissionId`) |
| Datos de contacto | **No se muestran** en ninguna vista. El canal de contacto queda pendiente de decisión | §5 |

Reglas de dominio cubiertas por pruebas unitarias: `tests/unit/commercial.test.ts`, `tests/unit/contact.test.ts`, `tests/unit/defense.test.ts`.

---

## 2. Inventario de recorridos (update §B)

### Joven (J1–J9)

| Paso | Estado | Evidencia / faltante |
| --- | --- | --- |
| J1 Catálogo y detalle | Parcial | Catálogo y detalle existen. **Faltan filtros** por tipo, línea y estado (el update los pide; `/explorar` dice «sin filtros en el MVP») |
| J2 Acceso con retorno al reto | Hecho | `safeNext` y `next` (PRODUCTO §4) |
| J3 Inscripción idempotente | Hecho | ID determinista `experienceId__userId`; pruebas de participación |
| J4 Mi challenge | Parcial | Existe `/mi-c3/retos/[id]`. Faltan progreso y checklist de documentos |
| J5 Bitácora / checkpoints | Pendiente | No hay modelo de checkpoints |
| J6 Entrega (texto y enlaces, borrador y envío) | Hecho | `saveDelivery`, pruebas de entregas |
| J7 Defensa | **Hecho en servidor y UI** | `DefensaPanel.tsx` dentro de Mi challenge; API `/api/retos/[id]/defensa`. Falta prueba E2E |
| J8 Estado y retroalimentación publicada | Parcial | Resultados públicos existen; **falta retroalimentación al participante** (no hay campo publicable) |
| J9 Solicitud de contacto y consentimiento | **Hecho en servidor y UI** | `ContactosPanel.tsx` en Mi C3; API `/api/contactos` |

### Empresa (E0–E10)

| Paso | Estado | Evidencia / faltante |
| --- | --- | --- |
| E0 Propuesta sin cuenta | Parcial | Formulario, campo trampa y límite de propuestas existen. **Falta** el copy nuevo y la opción «identificar talento / explorar / ambos» |
| E1 Admin: propuesta → challenge | Parcial | Revisión de propuestas existe; **falta** el paso directo a challenge con estados `En revisión → Aprobado → Publicado` |
| E2 Cuenta empresa + dashboard | Parcial | `/empresa` con challenges y propuestas. **Faltan** contadores operativos (inscritos, entregas, en evaluación, perfiles de interés) |
| E3 Configuración del reto | Parcial | Solo admin (`ExperienciasPanel`). Paquete visible en el tablero pendiente |
| E4 Participantes y entregas | Parcial | Tablero de entregas enviadas **hecho**. Falta listar inscritos y filtros |
| E5 Entregable / Proceso / Defensa | Hecho (con límites) | `TalentoPanel.tsx`. «Proceso» usa decisiones, pruebas y trade-offs declarados; **no hay telemetría ni bitácora** |
| E6 Evaluación con rúbrica | Hecho | `EvaluadorPanel`, `server/evaluation.ts`, pruebas de evaluación |
| E7 Matriz comparativa y lista corta | Parcial | Lista corta **hecha**. Falta la **matriz comparativa** por criterios (hoy: tarjetas) |
| E8 Solicitar contacto | **Hecho** | Botón «Solicitar contacto» en `TalentoPanel` |
| E9 Seguimiento y cierre | **Hecho** | «Registrar que ya la contactamos» y «Registrar seguimiento». Sin 30/90 días automáticos |
| E10 Estados vacíos, carga, error | Parcial | Presentes en los paneles nuevos; falta revisión a 390 px y 1280 px |

---

## 3. Tareas del update (Task 0–5)

| Task | Qué pide | Estado en esta rama |
| --- | --- | --- |
| **0 · Narrativa y taxonomía** | Copy integral, taxonomía Conecta, DEMO visible, paquetes correctos | **Parcial.** Hecho: taxonomía y etiqueta del challenge empresarial; paquetes; demo en tablero. Pendiente: reescribir hero, cards y CTA de la home y de `/explorar` según la matriz §0.B; revisar `<title>`/metadatos; eliminar «Rutas sostenibles» de docs y textos (el seed ya cambió) |
| **1 · Impeccable y pase visual** | Instalar skill en el repo, auditar, pulir | **Bloqueado / pendiente.** Ver §5 (instalación y registro). El design system de C3 se revisó (§4) |
| **2 · Flujo del joven** | J1–J9 | Ver §2. Hecho: J3, J6, J7, J9 (servidor + UI). Pendiente: J1 filtros, J4 progreso, J5 bitácora, J8 retroalimentación |
| **3 · Flujo de la empresa** | E0–E10 | Ver §2. Hecho: E4 (tablero), E5, E6, E8, E9 y lista corta de E7. Pendiente: E0 copy, E1 flujo, E2 contadores, matriz de E7 |
| **4 · Migraciones y seed** | Esquema aditivo, seed idempotente, dataset demo, reglas | **Parcial.** Hecho: seed v2 del challenge demostrativo (nombre, rúbrica de 4 criterios, línea, paquete), `SEED_VERSION = 2`, prueba de idempotencia existente. Pendiente: dataset completo de §4.C (participantes, inscripciones, entregas, evaluaciones, shortlist, contactos), manifiesto, reset con `--dry-run`, reglas de Firestore por actor (hoy: denegar todo + servidor) |
| **5 · Cuentas demo reales y E2E** | Auth real joven/empresa/admin, E2E | **Bloqueado.** Requiere proyecto Firebase demo y autorización explícita (§5). E2E no ejecutado para los flujos nuevos |

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
   - **Estado del proyecto (solo lectura):** tiene una app web «C3 Platform» (`1:499571719938:web:23fb4517b4d7a95a2c0c1b`) y la base `(default)` en Firestore Standard. No se verificó si Auth tiene habilitado Email/Password, ni si el sitio `demo.plat.c3.com.sv` lee este proyecto.
   - **Creado por error y sin uso:** `c3-challenges-demo`, con app web `1:720878881039:web:05748dd52a20be8663567a`. Sigue en la cuenta; su eliminación queda pendiente de confirmación del responsable.
   - **Bloqueado:** no hay credencial de Admin SDK disponible para leer ni escribir (`FIREBASE_SERVICE_ACCOUNT_JSON` o ADC). Sin ella no hay `--dry-run` remoto.
   - **Orden previsto:** 1) `seed --dry-run` remoto y revisión de conflictos; 2) `seed --apply` solo si no hay conflictos, y con autorización por operación; 3) `provision-demo-accounts --dry-run`; 4) `--apply` con `--credentials-file` fuera del repositorio.
   - **Pendiente de decisión:** ruta del archivo de contraseñas (propuesta `C:/Users/chris/.c3-demo/credenciales.txt`).
   - Dominio de correo: `demo.c3.com.sv` (cuentas `joven@`, `empresa@`, `admin@`). Firebase Auth no envía correos en la demo; la recuperación de contraseña no está disponible.
2. **Seed v2 sobre datos v1:** `buildSeedPlan` marca como conflicto un documento con contenido distinto. Para aplicar v2 en un entorno que ya tiene v1 hace falta un modo de actualización explícito y versionado (no implementado).
3. **Rúbrica con pesos:** el update pide 20 / 30 / 25 / 25 %. El modelo valida puntajes enteros de 1 a 10 por criterio, sin pesos. Se usaron cuatro criterios de 10 puntos. Decidir si se añade ponderación al modelo.
4. **Canal de contacto:** sin correo ni teléfono visibles. Falta definir cómo se comparten datos tras «aceptado» (¿correo en la plataforma, mensaje interno, o solo C3 como facilitador?).
5. **Contacto con equipos:** hoy solo entregas individuales. Falta definir a quién se contacta de un equipo.
6. **Plazo de la defensa:** no hay restricción por fecha. Falta decidir si se congela al cerrar la evaluación.
7. **Impeccable:** el plugin está en `C:\Users\chris\.claude\plugins\marketplaces\impeccable` (v4.8.0, skill `impeccable`). El update pide `npx impeccable install` en la raíz. Ese comando escribe configuración en el repo: **no se ejecutó** sin revisar su salida (AGENTS §4 y `.claude/`). Ruta de invocación propuesta: `.claude/skills/impeccable/scripts/impeccable context` desde el repo, una vez por sesión.
8. **Cuentas de prueba de la plataforma:** las contraseñas de `e2e/` y `tests/` son de emulador. Las cuentas demo reales nunca se escriben en el repo.

---

## 6. Git y verificación

- **Commits:** ninguno. El trabajo queda sin commit en `feat/demo-integral-2026-11-03` hasta que lo autorices.
- **Verificación ejecutada en esta rama:**
  - `npm run typecheck`: sin errores.
  - `npm run lint`: sin errores.
  - `npm test` (unitarias): 143 de 143 pasan (incluye las 20 nuevas de comercial, contacto y defensa).
  - `npm run test:rules` (emulador Auth + Firestore, reglas y pruebas de servidor): 110 de 110 pasan, incluidas 7 nuevas de `tests/emulator/talent.test.ts` (tablero y propiedad, borrador, lista corta, solicitud de contacto, decisión de la persona, defensa y casos negativos).
  - `next build`: compila y genera las 18 páginas en el segundo intento. El primero se detuvo con el aviso de seguridad de Next.js 16.4.0, ya registrado en [PENDIENTES](../../PENDIENTES-REALES.md). No se actualizó Next.js.
- **No ejecutado:** `npm run test:e2e`, revisión visual a 390 y 1280 px, recorrido en navegador real, `npm run seed:dry-run` contra el remoto.

---

## 7. Próximos tramos (orden del update, prioridad empresa)

1. Filtros de J1 y copy de Task 0 (home, `/explorar`, `<title>`).
2. Matriz comparativa de E7 y contadores de E2.
3. Retroalimentación publicable (J8) y bitácora mínima (J5) con dos checkpoints de demo.
4. Dataset de demo de §4.C en emulador (sin remoto), con manifiesto y `--dry-run`.
5. E2E de los recorridos empresa y joven en emulador, y revisión visual.
6. Remoto y cuentas demo: solo tras la autorización de §5.1.

---

## 8. Registro de ejecución (3-nov-2026, tras la autorización del responsable)

**Remoto (`c3-platform-demo`, operaciones con la clave de cuenta de servicio entregada por el responsable):**
- `seed --mode update`: 8 documentos del seed v1 actualizados a v2 (7 experiencias, de las cuales 6 solo cambian `seedVersion`, y el challenge demo: título, rúbrica, resumen, problema, entregables, organización y paquete). Respaldo previo: `C:\Users\chris\.c3-demo\backup-seed-v1-2026-11-03.json`, fuera del repo.
- Creados: 1 organización demo, 6 perfiles de demostración sin cuenta, 7 inscripciones, 5 participaciones, 5 entregas (4 enviadas y 1 borrador), 3 defensas, 2 listas cortas, 2 solicitudes de contacto y 3 propuestas.
- Cuentas `joven@`, `empresa@` y `admin@demo.c3.com.sv` creadas con UID fijos (`c3-demo-joven`, `c3-demo-empresa`, `c3-demo-admin`). Claim `c3Admin` solo en admin. La empresa queda vinculada a la organización demo. Contraseñas en `C:\Users\chris\.c3-demo\credenciales-demo.txt`, fuera del repo.
- Verificado en solo lectura: UIDs, claims, vínculo y conteos. No se modificaron los datos previos del proyecto (1 inscripción, 1 participación, 1 asignación de jurado, 1 perfil público, 1 bitácora y 4 cuentas existentes).
- Pendiente de decisión: si el sitio `demo.plat.c3.com.sv` lee este proyecto; y qué hacer con `c3-challenges-demo` (creado por error, sin datos).

**Código y pruebas (en esta rama, sin commits):**
- Corregido: `fail()` del seed no cortaba la ejecución, y un `apply` con conflictos o versiones anteriores escribía igual. Ahora `fail()` sale con código 1, y se comprobó en emulador que no hay escrituras.
- Nuevo: modo `update` con respaldo y guardia de título duplicado. Pruebas: `tests/unit/seed-plan.test.ts`, `tests/unit/seed-update.test.ts`, `tests/emulator/demo-dataset.test.ts`.
- Narrativa de la home y del `<title>` por defecto según la matriz §0.B. Filtros de `/explorar` (tipo, línea, estado y demo). Cifras por challenge en `/empresa` (inscritas, entregas, lista corta). Tabla de comparación de evidencia en el tablero de talento.
- Verificación: typecheck y lint limpios. Unitarias 156/156. Emulador 120/120. `next build` compila (el primer intento se detiene con el aviso de seguridad de Next.js, ya registrado). E2E: ver el resultado en el registro de la sesión.

**Sigue pendiente del update (no implementado):** bitácora de proceso (J5), retroalimentación publicable (J8), flujo de admin de propuestas a challenge (E1), E0 con la opción de intención, evaluaciones y matriz por criterios, revisión visual a 390 y 1280 px, pruebas E2E de los paneles nuevos, la skill Impeccable, y la eliminación de `c3-challenges-demo`.

**Revisión adversarial de los caminos de escritura (workflow `wf_b053ae95-cc8`, 9 agentes):** se verificaron 5 hallazgos y 4 resultaron reales. Corregidos:
- Provisión: una cuenta preexistente con correo demo y otro UID ya no recibe `c3Admin` ni vínculo; el script se detiene (`tests/emulator/demo-accounts-guard.test.ts`).
- Contacto: una solicitud declinada o revocada es final; la empresa no la reemplaza y el tablero no ofrece pedirla de nuevo (`tests/emulator/talent.test.ts`).
- Seed: la guardia de títulos duplicados también aplica a las actualizaciones (`tests/unit/seed-update.test.ts`).
- Seed: lista cerrada de proyectos (`c3-platform-demo` y `demo-c3-platform`). El script de provisión exige `FIRESTORE_EMULATOR_HOST` con `--emulator`.
- Interfaz: la defensa ya no promete edición «hasta que C3 cierre la evaluación», porque el servidor no lo controla.

Quedaron sin corregir, por ser medios o bajos y no verificados: estado de `busy` compartido en `ContactosPanel`; cambios de consentimiento sin transacción (`answerContactRequest` y `advanceContactRequest`); el tablero muestra el UID de cada persona antes del consentimiento, aunque no datos de contacto; y el respaldo del modo `update` no registra las creaciones.
