# C3 Platform

> C3: Compite · Crea · Conecta. Producto en desarrollo: C3 Challenges (nombre provisional).

Aplicación Next.js (App Router) con Firebase Authentication y Cloud Firestore. La referencia visual está en `diseno-claude/`; la lógica, la persistencia y los permisos viven en este repositorio. Las reglas de negocio y de seguridad están en [AGENTS.md](AGENTS.md); la navegación por rol, en [docs/PRODUCTO-Y-NAVEGACION.md](docs/PRODUCTO-Y-NAVEGACION.md); lo abierto, en [docs/PENDIENTES-REALES.md](docs/PENDIENTES-REALES.md).

## Capacidades

Inventario de lo que existe en el código. No acredita que cada flujo esté validado en el último CI: ver [Validación](#validación).

- **Visitante:** home, catálogo con filtros (tipo, línea, estado), detalle de challenge y de experiencia, landings `/compite`, `/crea` y `/conecta`, propuesta de challenge sin cuenta y perfiles públicos opt-in.
- **Acceso y cuenta:** entrar, crear cuenta, sesión persistente y retorno con `?next=` (solo rutas internas). Cuenta edita datos personales, perfil público, verificación de correo y contraseña. La recuperación de contraseña y la eliminación de cuenta quedan «Próximamente».
- **Participante:** Mi C3 (atención, en espera, en curso, finalizadas), inscripción individual o por equipo con confirmación de elegibilidad y reglas, equipos con código `C3-XXXX`, Mi challenge con progreso, bitácora (solo agrega), entrega (borrador, envío, enlaces https), defensa, retroalimentación publicada, solicitudes de contacto (aceptar, declinar, revocar) y trayectoria registrada por C3.
- **Empresa:** propuesta pública con límites anti-spam; espacio con sus challenges, hito y paquete de referencia, configuración del challenge, tablero de talento (entregable, proceso y defensa, con filtros y matriz por criterio), lista corta con motivo, solicitud de contacto y seguimiento, retroalimentación y resultados publicados.
- **Jurado:** evaluación anónima tras el cierre, con rúbrica (pesos opcionales), borrador y finalización única. Comentarios internos.
- **Administración:** consola `/admin/[seccion]` con resumen, propuestas (ajustes, aceptar, no priorizar; organizaciones y representantes), experiencias (ciclo de vida, cupos, challenges), inscripciones, entregas (solo lectura), jurados y rúbricas, resultados oficiales y auditoría.
- **Experiencias sin challenge** (talleres, charlas, encuentros): inscripción a la experiencia, individual y con revisión de C3.
- **Ciclo de vida:** borrador → publicada → inscripciones abiertas/cerradas → en desarrollo → concluida, o cancelada. Cada operación sensible queda en `auditLog`, en la misma transacción y sin datos personales.
- **Permisos:** cada ruta verifica el token, el claim `c3Admin` y la propiedad; Firestore deniega todo acceso directo del cliente. `GET /api/me` devuelve capacidades propias solo para mostrar accesos.
- **Accesibilidad:** auditoría automática con axe-core (WCAG 2.x A y AA) en vistas públicas, acceso y usuario registrado.

**No implementado:** respuesta de la empresa a ajustes pedidos (se responde por correo), canal de contacto real, textos legales, y todo lo listado como fuera de alcance en [AGENTS §1](AGENTS.md).

## Rutas

Las vistas V01–V12 del diseño son capacidades, no 12 rutas.

| Vista | Ruta | Acceso |
| --- | --- | --- |
| V01 Home | `/` | Público |
| V02 Explorar | `/explorar` | Público |
| V03 Detalle de challenge | `/retos/[challengeId]` | Público |
| Detalle de experiencia | `/experiencias/[experienceId]` | Público |
| Compite · Crea · Conecta | `/compite`, `/crea`, `/conecta` | Público |
| V04 Acceso | `/acceso` | Público |
| V10 Proponer challenge | `/empresa/proponer` | Público, sin cuenta |
| Perfil público | `/personas/[slug]` | Público si la persona lo activó; `noindex`; 404 si no existe |
| V05 Mi C3 | `/mi-c3` | Participante |
| V06 Inscripción | `/retos/[challengeId]/inscripcion` | Participante |
| Inscripción a experiencia | `/experiencias/[experienceId]/inscripcion` | Participante |
| V07 Mi challenge y entrega | `/mi-c3/retos/[challengeId]` | Participante |
| V08 Trayectoria | `/trayectoria` | Participante |
| Cuenta | `/cuenta` | Participante |
| V09 Espacio de empresa | `/empresa` | Representante vinculada |
| V11 Evaluación | `/mi-c3/evaluar/[challengeId]` | Jurado asignado. Única dirección canónica: `/evaluar/[id]` y `/empresa/retos/[id]/evaluacion` redirigen (`next.config.ts`) |
| V12 Admin | `/admin` → `/admin/[seccion]` | Administradora: `resumen`, `propuestas`, `experiencias`, `inscripciones` (`?reto=` o `?experiencia=`), `entregas`, `jurados`, `resultados`; una sección desconocida es 404 |

Las rutas de servidor están en `src/app/api/`. Las privadas exigen `Authorization: Bearer <token>` verificado con el Admin SDK y comprueban permisos antes de tocar datos; `/api/health` es la única pública que no toca datos (y `POST /api/propuestas`, con sus defensas).

## Requisitos e instalación

Node.js 22 o superior; Java 21 o superior para el emulador de Firestore (Windows: `winget install Microsoft.OpenJDK.21`); `firebase-tools` es dependencia del proyecto.

```bash
npm ci
cp .env.example .env.local
```

Para trabajar con emuladores, completá `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-c3-platform
NEXT_PUBLIC_FIREBASE_APP_ID=1:0000000000:web:0000000000
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
GOOGLE_CLOUD_PROJECT=demo-c3-platform
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

En una terminal, los emuladores; en otra, la aplicación:

```bash
npm run emulators   # Auth 9099, Firestore 8080, interfaz http://127.0.0.1:4000
npm run dev         # http://localhost:3000
```

Las variables `NEXT_PUBLIC_*` se incrustan en el build: si cambian, reconstruí. Verificá el entorno con `npm run doctor`.

## Variables de entorno

Ver `.env.example`.

- `NEXT_PUBLIC_FIREBASE_*`: configuración pública del SDK del navegador (no son secretos). `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` conecta el navegador al emulador de Auth.
- `GOOGLE_CLOUD_PROJECT`: proyecto del Admin SDK.
- `FIREBASE_SERVICE_ACCOUNT_JSON`, o `FIREBASE_ADMIN_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` (privadas): credenciales del Admin SDK cuando el hosting no tiene ADC. Nunca al repositorio ni como `NEXT_PUBLIC_*`.
- `RATE_LIMIT_SALT` (privada): sal del hash de conexión de las propuestas. Obligatoria en producción; sin ella `POST /api/propuestas` falla.
- `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`: solo desarrollo; `firebase emulators:exec` las define en las pruebas.

**Vercel:** configurá las cuatro `NEXT_PUBLIC_FIREBASE_*` del proyecto, `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false` y las privadas del Admin SDK más `RATE_LIMIT_SALT`. `vercel-build` valida la configuración sin imprimir secretos. Tras cambiar variables, hacé un deploy nuevo.

## Primer administrador

Una administradora es una cuenta con el claim `c3Admin`, que solo se asigna desde el servidor.

1. Creá la cuenta desde `/acceso` (o en la interfaz del emulador).
2. Otorgá el permiso:

```bash
node --env-file-if-exists=.env.local scripts/grant-admin.mjs correo@dominio
```

3. Cerrá sesión y volvé a entrar para que el token lo incluya.

En producción, el mismo script con credenciales de servicio autorizadas. No hay endpoint público para esto.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` · `npm run build` | Desarrollo y build de producción |
| `npm run check` | Typecheck, lint y pruebas unitarias |
| `npm run typecheck` · `npm run lint` | `tsc --noEmit` y ESLint |
| `npm test` | Pruebas unitarias del dominio (sin emuladores) |
| `npm run test:rules` | Reglas, servicios y entregas contra el emulador |
| `npm run test:e2e` | Playwright en escritorio y móvil: inicia emuladores, prepara la administradora, construye y sirve la app. En Windows con Edge: `PW_CHANNEL=msedge`; sin `PW_CHANNEL` usa `npx playwright install chromium` |
| `npm run test:capturas` | Capturas públicas en `capturas/actual/`; falla ante errores de consola |
| `npm run emulators` | Solo emuladores |
| `npm run doctor` | Diagnóstico del entorno (Node, Java, proyecto, puertos, Git); no muestra secretos |
| `npm run check:vercel-env` | Valida las variables de un deploy en Vercel |

**Seed y cuentas demo** (detalle y reglas en [AGENTS §13](AGENTS.md) y [docs/demo](docs/demo/README.md)). Cualquier escritura remota necesita autorización expresa y `--dry-run` previo:

```bash
# Simulación (no escribe)
npm run seed:dry-run -- --project <id> --emulator
# Crear lo que falta (emulador o proyecto autorizado)
npm run seed:apply -- --project <id> --confirm-project <id> --allow-write --emulator
# Actualizar documentos con versión anterior, con respaldo fuera del repo
node --env-file-if-exists=.env.local --experimental-strip-types scripts/seed.mjs --mode update --project <id> --confirm-project <id> --allow-write --allow-update --backup-file "<ruta fuera del repo>"
# Cuentas demo: simulación y aplicación (contraseñas a un archivo fuera del repo)
node --experimental-strip-types scripts/provision-demo-accounts.mjs --project <id>
node --experimental-strip-types scripts/provision-demo-accounts.mjs --project <id> --apply --confirm-project <id> --credentials-file "<ruta fuera del repo>"
```

`update` requiere credenciales del Admin SDK (no `FIREBASE_CLI_ACCESS_TOKEN`); `FIREBASE_CLI_ACCESS_TOKEN=<token> npm run seed:dry-run -- --project <id>` sirve solo para el dry-run remoto. `provision-demo-accounts` solo admite `c3-platform-demo` y el emulador. `scripts/demo-reset.mjs` lista por defecto lo que borraría y exige `--apply`, `--confirm-project` y `--backup-file`.

## Validación

`npm run check`, `npm run test:rules` y `npm run test:e2e` verifican compilación, calidad, permisos y recorridos. **No se declara una suite en verde por conteos de ejecuciones anteriores:** leer el CI del PR o push concreto (`.github/workflows/ci.yml`). Última ejecución completa local (4-nov-2026): 175 unitarias, 139 de emulador y reglas, y E2E de 223 superadas, 0 fallidas y 23 omitidas (cada prueba declara su proyecto, escritorio o móvil). Las pruebas E2E usan el build de producción. `next build` puede detenerse una vez por el aviso de seguridad de Next.js; repetirlo continúa ([PENDIENTES](docs/PENDIENTES-REALES.md)).

## Diseño

- `diseno-claude/` es el paquete exportado: `vistas/` (V01–V12), `tokens/` (`tokens.json`, `tokens.css`), `fuente-canvas/`. `src/app/globals.css` importa `tokens.css`; los fondos suaves de estado se definen allí.
- Las vistas se convirtieron en componentes conservando estructura, textos y jerarquía; los estilos repetidos son clases de `globals.css`. Las vistas móviles usan `MovilShell` (marco de 390 px centrado en escritorio); **Mi C3 y Trayectoria** usan `layout="panel"`: una columna en móvil y tablet, y desde 1024 px un panel de dos columnas. Estados de Mi C3 en `src/lib/domain/mi-c3.ts`; trayectoria en `src/lib/domain/trayectoria.ts`.
- Diferencias aceptadas frente al diseño: la entrega no tiene campo de título; hay acciones de líder y «Salir»; V09 lista propuestas como tarjetas y no muestra el contador «por evaluar»; V10 pide un consentimiento. No existen materiales del challenge ni el enlace «Comunidad» de V03 en el modelo.
- Los elementos que solo simulaban interactividad se conectaron a acciones reales o se marcaron «Próximamente». Los datos de ejemplo se marcan **DEMO**.

## Arquitectura

```
src/
  app/            Rutas (App Router), API de servidor y estilos globales
  components/     Componentes compartidos
  lib/
    domain/       Entidades, validaciones y presentación (sin Firebase)
    server/       Servicios de datos y reglas transaccionales (reciben la base por parámetro)
    firebase/     Admin SDK (solo servidor) y SDK del navegador
    auth/         Proveedor de sesión del navegador
    client/       Cliente de API que adjunta el token
    seed/         Dataset de demostración
tests/unit/       Dominio
tests/emulator/   Reglas y servicios contra el emulador
e2e/              Recorridos de navegador (escritorio y móvil)
scripts/          Administración, seed y emuladores
diseno-claude/    Referencia del diseño (no se duplica)
```

`firestore.rules` deniega todo acceso del cliente. Las lecturas públicas pasan por el servidor, que filtra campos internos; abrir lecturas directas exigiría reglas por campo y pruebas en emulador.

## Modelo de datos

Los identificadores compuestos usan `__`. Todas las colecciones sensibles las escribe y lee solo el servidor.

- **Catálogo:** `experiences/{id}` (título, tipo `competencia | hackathon | challenge_empresarial | taller | charla | encuentro`, estado `draft | published | closed | cancelled`, ventana de inscripción —abierta o cerrada se calcula, no se guarda—, línea principal y secundarias, `isDemo`, procedencia, y opcionales de sesión: `startsAt`, `endsAt`, `modality`, `location`, `capacity`). `challenges/{id}` (`experienceId`, problema, entregables, rúbrica con criterios de 1 a 10 y pesos opcionales, organización, modalidades `individual | team` con tamaños, cierre de entregas, `commercialPackage`).
- **Personas:** `users/{uid}` (perfil autodeclarado y `publicProfile`), `publicProfiles/{slug}` (→ uid; cambiar el enlace borra el anterior).
- **Participación:** `enrollments/{experienceId}__{uid}` (`pending | approved | rejected | cancelled`; `challengeId` o `null`, confirmaciones de elegibilidad y reglas), `participations/{challengeId}__{uid}` (al aprobar), `teams/{id}`, `teamCodes/{code}`, `teamMemberships/{experienceId}__{uid}`.
- **Entrega y proceso:** `submissions/{challengeId}__{uid}` (en equipo `{challengeId}__team__{teamId}`; `draft | submitted`), `checkpoints/{id}` (bitácora), `defenses/{submissionId}`, `feedbacks/{submissionId}` (`publishedAt` nulo = borrador de la empresa).
- **Evaluación y resultados:** `judgeAssignments/{challengeId}__{uid}` (jurados asignados por C3), `evaluations/{submissionId}__{uid}` (borrador o finalizada) y `results/{challengeId}` (resultados oficiales).
- **Empresas:** `organizations/{id}`, `organizationMembers/{orgId}__{uid}`, `companyProposals/{id}` (`received | needs_changes | accepted | not_prioritized`; la referencia son los 6 primeros caracteres del id), `rateLimits/{hash}` (sal + hash, nunca la IP).
- **Talento:** `shortlists/{submissionId}` (motivo obligatorio), `contactRequests/{challengeId}__{hash}` (`esperando_consentimiento | aceptado | declinado | contactado | seguimiento | revocado`; el hash oculta el uid; sin datos de contacto).
- **Operación:** `auditLog/{id}` (`action`, `actorUid`, `targetType`, `targetId`, `at`, `details`).

Reglas de acceso y de negocio: [AGENTS §5](AGENTS.md).

## Ramas

`dev` integra y prueba; `main` es producción. Las ramas de tarea parten de `dev`, van por PR a `dev` y la promoción es por PR `dev` → `main`. Un solo checkout, con `git switch`. El repositorio `C3-SV/c3-platform-starter` es público y la meta es hacerlo privado, decisión del responsable según su relación con Vercel. Detalle: [AGENTS §8](AGENTS.md) y [FLUJO-AGENTES](docs/FLUJO-AGENTES.md).

Si aparecen avisos `EBADENGINE`, comprobá las versiones instaladas antes de cambiar Node.
