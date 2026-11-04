# Plan y registro: C3 Challenges · demo integral (3 al 4-nov-2026)

**Fuente de decisiones:** [UPDATE-2026-11-03](../../UPDATE-2026-11-03-demo-integral.md). **Pendientes vigentes:** [PENDIENTES-REALES](../../PENDIENTES-REALES.md). Este archivo es un registro: lo abierto vive en PENDIENTES y las reglas, en [AGENTS](../../../AGENTS.md).

## 1. Modelo aplicado

| Concepto | Decisión en el código | Dónde |
| --- | --- | --- |
| Línea | Challenge empresarial: principal **Conecta**, secundaria Crea | `seed-data.ts`, `presentation.ts` |
| Paquetes | Esencial US$800 · Completo US$1,500 · Destacado US$3,000, de referencia, sin cobro; premios, licencias y contrataciones no incluidos | `domain/commercial.ts`, `challenge.commercialPackage` |
| Lista corta | Una entrada por entrega enviada, con motivo de 10 a 500 caracteres | `domain/contact.ts`, `server/talent.ts` |
| Contacto | Representante vinculada, lista corta, inscripción aprobada **en ese challenge**; entrega individual o de equipo (a la líder). Nace en «esperando consentimiento»; la persona acepta, declina o revoca; declinado y revocado son finales. Canal simulado tras aceptar | `domain/contact.ts`, `server/talent.ts`, `contactRequests` (id `challengeId__hash`) |
| Defensa y bitácora | Defensa separada de la entrega, solo sobre enviada, congelada al cerrar el plazo; la bitácora solo agrega | `domain/defense.ts`, `domain/process.ts` |
| Rúbrica | Pesos opcionales (suman 100); la demo usa 20/30/25/25 | `domain/evaluation.ts`, `validation.ts` |
| Resultados | Evaluaciones congeladas al publicar; comentarios del jurado internos; el jurado no ve el contenido antes del cierre | `server/evaluation.ts` |
| Datos de contacto | No se muestran en ninguna vista; la administración ve el correo (excepción aceptada) | AGENTS §5 |

## 2. Estado por tarea del update

| Tarea | Estado |
| --- | --- |
| 0 · Narrativa y taxonomía | Hecho: taxonomía Conecta, paquetes, DEMO visible, copy de la home y título, «challenge» en lugar de «retos» |
| 1 · Impeccable y pase visual | Parcial: `context` y `detect` ejecutados; sin `PRODUCT.md` y sin revisión visual a 390 y 1280 px |
| 2 · Flujo del joven (J1–J9) | Hecho: catálogo y filtros, acceso con retorno, inscripción con consentimientos, Mi challenge con progreso y estado de evaluación, bitácora, entrega, defensa, retroalimentación publicada y respuesta a contactos |
| 3 · Flujo de la empresa (E0–E10) | Hecho: propuesta con intención, enlace de propuesta a challenge (E1), dashboard con subnavegación, hito y paquete (E2), configuración (E3), tablero de talento con evidencia, matriz y filtros (E4–E7), contacto y seguimiento (E8–E9). Faltan los estados de E1 `En revisión → Aprobado → Publicado` y listar inscritos sin entrega |
| 4 · Migraciones y seed | Hecho: seed con versiones, modo `update` con respaldo, manifiesto, reset de demo y 4 challenges (92 registros). Reglas de Firestore: «denegar todo + servidor» con pruebas |
| 5 · Cuentas demo y E2E | Hecho: cuentas reales en `c3-platform-demo` y E2E de escritorio y móvil. Falta el recorrido con las cuentas en el sitio |

## 3. Decisiones del responsable (4-nov-2026)

Congelar resultados al publicar; canal de contacto y contacto con equipos simulados; rúbrica repartida 20/30/25/25; reglas de Firestore lo que salga mejor (se mantiene servidor + pruebas); correo visible para admin; bitácora solo agrega; «challenge» en lugar de «retos»; configurar el challenge puede quien lo administra (por ahora también una representante que es jurado); más retos demo con las mismas cuentas; la revisión visual se aplaza. Antes: Firebase real = `c3-platform-demo`; voseo en la demo; canal y retención reales antes de datos reales.

## 4. Operaciones remotas en `c3-platform-demo`

Todas con autorización del responsable, dry-run previo, respaldo fuera del repo (`C:\Users\chris\.c3-demo\`) y verificación de solo lectura. Las contraseñas de las cuentas demo viven en un archivo local de esa carpeta y nunca en el repo.

| Fecha | Operación | Resultado |
| --- | --- | --- |
| 3-nov | Seed v1 → v2 (`update`) y creación del dataset; cuentas `joven@`, `empresa@` y `admin@demo.c3.com.sv` (UID fijos `c3-demo-joven`, `c3-demo-empresa`, `c3-demo-admin`), `c3Admin` solo en admin, empresa vinculada a la organización demo | Respaldo `backup-seed-v1-2026-11-03.json`; datos previos intactos |
| 4-nov | v3: `demo-reset --apply` (38 documentos) y `update` (4 actualizados, 51 creados) | `backup-reset-v2-2026-11-04.json`, `backup-seed-update-v3-2026-11-04.json`; 55 iguales |
| 4-nov | v4: `update` (rúbrica ponderada), 55 actualizados | `backup-seed-update-v4-2026-11-04.json` |
| 4-nov | v5: `update` (tres challenges demo), 37 creados y 55 actualizados | `backup-seed-update-v5-2026-11-04.json`; 92 iguales. Devolvió al estado del seed una solicitud de contacto cuyo estado se había cambiado |

## 5. Verificación

- **Última ejecución completa (4-nov-2026):** typecheck y lint sin errores; unitarias 175; emulador y reglas 139; E2E de escritorio y móvil 223 superadas y 23 omitidas (cada prueba declara su proyecto). La verificación de cada PR está en su descripción.
- **Revisiones adversariales** (workflows de 9 y 10 agentes) corrigieron, entre otros: inscripción de un challenge que habilitaba entregar en otro, solicitud de contacto fuera de transacción, uid en el tablero, solicitudes ajenas, evaluaciones finalizadas que volvían a borrador, sal de conexión opcional, confirmación de propuesta sin guardar, scripts que heredaban el endpoint del emulador y cuentas preexistentes que recibían `c3Admin`.
- **Intermitencia del build:** `next build` falla a veces en el primer intento por el aviso de seguridad de Next.js 16.4.0; `playwright.config.ts` no reintenta, el runner de E2E sí.
- **Hallazgos menores sin corregir:** `ContactosPanel` no bloquea otras acciones mientras una está en curso; el modo `update` del seed no registra las creaciones en el respaldo.

## 6. Design system

Se usó el artifact «C3» (tipo Design System) como referencia y **no se creó otro**. Colores de línea, navy y tipografía (Montserrat y Poppins) coinciden con `diseno-claude/tokens/tokens.json`; el repo conserva su fondo claro `#F2F6FB`. No se importaron los tokens de marketplace. El update exige voseo aunque el artifact pida tuteo. Reglas del artifact que sí se aplican: texto 4.5:1, objetivos táctiles de 44 px, sin gradientes decorativos, etiqueta DEMO visible.
