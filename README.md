# C3 Platform

> C3: Compite · Crea · Conecta. Primer producto demostrable: C3 Challenges.

Aplicación Next.js (App Router) con Firebase Authentication y Cloud Firestore. El diseño visual lo produjo Claude y se integra tal cual; la lógica, la persistencia y los permisos viven en este repositorio.

## Estado real (corte actual: 6 · Integración completa)

**Implementado y verificado en esta máquina** (emuladores de Firebase, sin proyecto de producción):

- **Acceso** (V04): entrar, crear cuenta con nombre, recuperar contraseña y sesión persistente al recargar.
- **Experiencias y retos** (V12, sección «Experiencias y retos»): crear en borrador, publicar y volver a borrador. Lo no publicado no aparece en el sitio público.
- **Visitante**: home (V01), catálogo (V02) y detalle de reto (V03) leídos de Firestore.
- **Inscripción individual** (V06): una inscripción por experiencia, en estado pendiente hasta que C3 la apruebe o rechace. Cancelable antes del cierre y sin entrega enviada.
- **Revisión de C3** (V12, «Inscripciones y equipos»): aprobar habilita la participación; rechazar cierra la inscripción.
- **Equipos** (V06, Corte 3): la inscripción puede ser individual o por equipo. Una líder crea el equipo con un código `C3-XXXX`; las demás se unen con ese código y una inscripción por equipo aprobada. El equipo queda habilitado al llegar al mínimo. Cada persona tiene un solo equipo por experiencia; la líder quita, transfiere el liderazgo o disuelve el equipo, y cualquier integrante puede salir. Todo cambio se cierra al cierre de inscripciones o cuando el equipo envía la entrega.
- **Mi C3** (V05): lo que toca ahora, las inscripciones en espera, las entregadas y las cerradas.
- **Mi reto y entrega** (V07): borrador, envío y enlaces https, con plazo. Una entrega enviada queda estable al cerrar; un borrador sin enviar pasa a «Fuera de plazo».
- **Permisos en servidor**: cada ruta verifica el token de Firebase, el claim `c3Admin` y la propiedad del recurso. Firestore deniega todo acceso directo desde el cliente.
- **Errores**: validación con motivos por campo y mensajes claros de sesión y de permisos. Ninguna operación fallida muestra confirmación.
- **Propuesta pública** (V10, Corte 4): cualquier empresa propone sin cuenta. El servidor valida, descarta en silencio las altas del campo trampa y limita a 5 propuestas por hora y conexión (solo se guarda un hash). La confirmación muestra una referencia y solo aparece cuando la propuesta quedó guardada.
- **Revisión de C3** (V12, «Propuestas»): pedir ajustes con una nota para la empresa, aceptar (con la organización que la representará) o no priorizar. Crear organizaciones y vincular representantes por correo: la cuenta debe existir y es C3 quien la vincula.
- **Espacio de empresa** (V09): la representante ve solo los retos publicados de sus organizaciones, las soluciones ya enviadas (nunca borradores) y las propuestas vinculadas con su siguiente paso. Sin vínculo, la vista no muestra datos de nadie.
- Retos con organización vinculada: al crear un reto en V12 se elige la organización que tendrá su espacio de empresa.
- **Perfil y trayectoria** (V08, Corte 6): la persona declara su nombre, centro de estudio, una presentación y enlaces https (GitHub, LinkedIn). La trayectoria —inscripciones, entregas, reconocimientos y puesto— la registra C3 y no se edita; la pantalla separa ambas cosas con la etiqueta «Registrada por C3».
- **Accesibilidad** (Corte 6): auditoría automática con axe-core (WCAG 2.x A y AA) en las vistas públicas, de acceso y de una persona registrada. Sin incumplimientos serios ni críticos en las páginas auditadas.

- **Jurados** (V12, «Jurados y rúbricas»): C3 asigna jurados por correo —externos o representantes de la empresa—, revoca accesos sin borrar evaluaciones finalizadas, y ve la rúbrica de cada reto.
- **Evaluación** (Mi C3 «Como jurado» y V11): las soluciones se muestran anónimas («Solución 1», «Solución 2»…) y solo se pueden evaluar cuando cierran las entregas. Cada criterio recibe un entero dentro de su máximo. Se guarda un borrador y se finaliza una sola vez.
- **Resultados** (V12, «Resultados oficiales»): promedio simple de los jurados con un decimal; reconocimientos (ganador, finalista, mención); publicación por C3 bloqueada hasta que cada solución tenga dos evaluaciones finalizadas de jurados distintos.
- **Publicación**: los ganadores aparecen en la página pública del reto si C3 lo autoriza; cada participante ve su reconocimiento y, si C3 lo autoriza, su promedio y puesto; la empresa ve los resultados publicados de sus retos.
- **Ecosistema**: /compite, /crea y /conecta comparten el catálogo de experiencias, clasificación por línea, estados visibles y marcadores de demostración/fuente.
- **Admin**: resumen operativo y consulta de entregas con reto, estado, participantes/equipo y autorización; las entregas no se modifican desde esta vista.

**Pendiente** (no hay botones falsos: se muestran como «Próximamente», «Próximo corte» o como sección pendiente):

- Respuesta de la empresa a los ajustes pedidos (V10 «Responder a C3»): hoy la empresa lee la nota y responde por correo.
- Comentarios de jurados: desactivados por defecto y sin implementar en el MVP.
- Textos legales (términos y privacidad), reglas/índices del proyecto real y variables privadas de Vercel: ver `docs/PENDIENTES-REALES.md`.

### Resultados de las comprobaciones (última ejecución)

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm run lint` | Sin errores ni avisos |
| `npm test` (dominio) | 51 de 51 |
| `npm run test:rules` (reglas, catálogo, inscripciones, equipos, entregas, empresas, Admin, seed y evaluación con emulador) | 52 de 52 |
| `npm run build` | Compila; páginas dinámicas y API de servidor |
| `npm run test:e2e` (Playwright, escritorio y Pixel 5, contra el build de producción; incluye la auditoría axe) | 76 de 76 |

### Verificación visual

Comparadas con capturas del diseño de Claude en el mismo tamaño: V01, V02, V03 y V04 en escritorio; V10 y V09 en escritorio; V05 (estado vacío en el marco móvil de 390 px), V06 y V07 en el marco móvil. Diferencias conocidas y aceptadas: la entrega no tiene campo de título (solo descripción y enlaces, según el modelo aprobado); las acciones de líder y el botón «Salir» se añadieron por función; las propuestas de V09 son una lista de tarjetas y no una tabla; V09 no muestra el contador «Tenés N por evaluar»; V10 tiene un consentimiento obligatorio y V01 muestra «Próximamente» en el llamado de empresas. **Sin comparar todavía:** V08, V11 y V12, y las secciones de V12 que el diseño no dibuja.

## Recursos de Claude

- `diseno-claude/` contiene el paquete exportado: `vistas/` (V01–V12 y fundamentos en HTML), `tokens/` (`tokens.json` y `tokens.css`), `fuente-canvas/` y su README.
- `src/app/globals.css` importa `tokens.css` directamente desde esa carpeta; no hay copia de los tokens.
- Los fondos suaves de estado (`--c3-info-fondo`, `--c3-exito-fondo`, etc.) no están en `tokens.json`; se definen en `globals.css` como indica la guía de estilo.

### Cómo se transformaron los diseños

- Cada vista HTML se convirtió en componentes React/TypeScript conservando su estructura, textos y jerarquía. Los estilos repetidos (botones, etiquetas, tarjetas, campos, pastillas de estado) son clases en `globals.css`; el resto del layout queda en estilos en línea, como en el original.
- Las vistas móviles (V05–V07) se diseñaron en un marco fijo de 390 × 844 px. En la aplicación usan el ancho del teléfono y se centran en escritorio (`MovilShell`), con la misma cabecera navy, el avatar y la barra inferior.
- Los elementos que solo simulaban interactividad se conectaron a acciones reales o se marcaron como pendientes.
- Se quitaron los rótulos «Datos de demostración» y los datos de ejemplo: la aplicación muestra solo datos reales de Firestore.
- Materiales del reto (datasets, contexto, formato) y el enlace «Comunidad» de V03 no se implementaron: no existen en el modelo ni en el alcance del MVP.

## Rutas y vistas

| Vista | Ruta | Acceso | Estado |
| --- | --- | --- | --- |
| V01 Home | `/` | Público | Implementada (destacados reales) |
| V02 Explorar | `/explorar` | Público | Implementada, sin filtros |
| V03 Detalle de reto | `/retos/[challengeId]` | Público | Implementada; el llamado lleva a V04 o a V06 |
| V04 Acceso | `/acceso` | Público | Implementada |
| V05 Mi C3 | `/mi-c3` | Joven | Implementada |
| V06 Inscripción | `/retos/[challengeId]/inscripcion` | Joven | Individual y por equipo implementadas |
| V07 Mi reto y entrega | `/mi-c3/retos/[challengeId]` | Joven | Implementada |
| V08 Trayectoria | `/trayectoria` | Joven | Implementada |
| V09 Espacio de empresa | `/empresa` | Empresa | Implementada (retos, soluciones, resultados y propuestas) |
| V10 Proponer challenge | `/empresa/proponer` | Público | Implementada, sin cuenta |
| V11 Evaluación | `/empresa/retos/[challengeId]/evaluacion` | Representante autorizado | Implementada |
| Evaluación de jurado externo | `/mi-c3/evaluar/[challengeId]` | Jurado asignado | Implementada |
| Compite | `/compite` | Público | Landing institucional conectada al catálogo |
| Crea | `/crea` | Público | Landing institucional conectada al catálogo |
| Conecta | `/conecta` | Público | Landing institucional conectada al catálogo |
| V12 Admin | `/admin` | Administrador | Experiencias, retos, resumen, entregas, inscripciones, propuestas, jurados y resultados |

Las rutas de servidor están en `src/app/api/`. Las que leen o escriben datos privados (`/api/me`, `/api/mi-c3`, `/api/retos/*`, `/api/inscripciones/*`, `/api/admin/*`) exigen `Authorization: Bearer <token>` verificado con el Admin SDK y comprueban permisos antes de tocar datos. `/api/health` es pública y no toca datos.

> **Agentes y trabajo en paralelo:** leer `AGENTS.md` (reglas, política Git de una sola carpeta) y `docs/FLUJO-AGENTES.md` (ramas, handoff, verificación). Comprobar el entorno con `npm run doctor`.

## Requisitos

- Node.js 22 o superior.
- Java 21 o superior (lo usa el emulador de Firestore). En Windows: `winget install Microsoft.OpenJDK.21`.
- Firebase CLI se instala como dependencia del proyecto (`firebase-tools`).

## Instalación y primer arranque local

```bash
npm install
cp .env.example .env.local
```

Para trabajar con los emuladores, completa `.env.local` así:

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

En una terminal, arranca los emuladores; en otra, la aplicación:

```bash
npm run emulators   # Auth en 9099, Firestore en 8080, interfaz en http://127.0.0.1:4000
npm run dev         # http://localhost:3000
```

Las variables `NEXT_PUBLIC_*` se incrustan en el build: si cambian, reconstruí.

## Variables de entorno

Ver `.env.example`. Resumen:

- `NEXT_PUBLIC_FIREBASE_*`: configuración pública del SDK del navegador. No son secretos.
- `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`: `true` conecta el navegador al emulador de Auth.
- `GOOGLE_CLOUD_PROJECT`: proyecto usado por el Admin SDK en el servidor.
- `FIREBASE_SERVICE_ACCOUNT_JSON` (privada) o `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` (privadas): credenciales del Admin SDK cuando Vercel no tiene ADC de Google. Nunca se suben al repositorio ni se usan como `NEXT_PUBLIC_*`.
- `FIRESTORE_EMULATOR_HOST` y `FIREBASE_AUTH_EMULATOR_HOST`: solo en desarrollo. Las define `firebase emulators:exec` cuando corren las pruebas.
- Las credenciales privadas nunca van en `NEXT_PUBLIC_*`. En producción el Admin SDK usa Application Default Credentials o la identidad administrada del hosting.

### Configuración de Vercel

En Vercel configura las variables públicas del proyecto Firebase de producción:
`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` y
`NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`.

Para el Admin SDK configura como variables privadas `GOOGLE_CLOUD_PROJECT` y
`FIREBASE_SERVICE_ACCOUNT_JSON`, o el conjunto separado
`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`.
El comando `vercel-build` valida esta configuración antes de compilar y nunca imprime
los valores secretos. Después de cambiar variables, crea un nuevo deploy para que
sean tomadas por el build.

## Primer administrador

Un administrador es una cuenta con el claim `c3Admin`. Los claims solo se asignan desde el servidor, nunca desde el navegador.

1. Crea la cuenta desde `/acceso` (o en la interfaz del emulador).
2. Otorga el permiso:

```bash
node --env-file-if-exists=.env.local scripts/grant-admin.mjs correo@dominio
```

3. Cierra sesión y vuelve a entrar para que el token incluya el permiso. Después, `/admin` está disponible.

En producción, ejecuta el mismo script con credenciales de servicio autorizadas (ADC). No hay un endpoint público para asignar administradores.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run check:vercel-env` | Valida las variables requeridas para un deploy de Vercel |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (configuración de Next.js) |
| `npm test` | Pruebas unitarias del dominio (sin emuladores) |
| `npm run test:rules` | Reglas de Firestore, servicios y entregas contra el emulador |
| `npm run test:e2e` | Recorridos con Playwright: inicia los emuladores, prepara la cuenta administradora, construye la aplicación y la sirve |
| `npm run seed:dry-run -- --project <id> --emulator` | Lee el catálogo seed, muestra existentes/conflictos/escrituras y no modifica datos |
| `npm run seed:apply -- --project <id> --confirm-project <id> --allow-write --emulator` | Crea solo documentos determinísticos del seed; exige identidad repetida y autorización |
| `FIREBASE_CLI_ACCESS_TOKEN=<token> npm run seed:dry-run -- --project <id>` | Dry-run contra Firebase real usando una sesion local autenticada de Firebase CLI; el token no se guarda |
| `npm run emulators` | Solo emuladores |
| `npm run doctor` | Diagnóstico del entorno (Node, Java, dependencias, proyecto Firebase activo, puertos, Git); no modifica nada ni muestra secretos |
| `npm run test:capturas` | Capturas de las páginas públicas (escritorio y móvil) en `capturas/actual/`; falla ante errores de consola |
| `npm run worktree -- <nombre>` | **Obsoleto** (política de una sola carpeta, ver `AGENTS.md` §10). Crea un worktree hermano `c3-platform-<nombre>`; no usar |
| `npm run check` | Typecheck, lint y pruebas unitarias |

Para las pruebas de navegador en Windows con Microsoft Edge instalado: `PW_CHANNEL=msedge npm run test:e2e`. Si no defines `PW_CHANNEL`, Playwright usa su Chromium (`npx playwright install chromium`).

## Arquitectura

```
src/
  app/                   Rutas (App Router): páginas, API de servidor y estilos globales
  components/            Componentes compartidos (cabecera, marco móvil, pastillas de estado, pie, CTA de inscripción)
  lib/
    domain/              Entidades, validaciones y estados de presentación (sin Firebase)
    server/              Servicios de catálogo, participación, autenticación, perfil, Admin y errores (reciben la base por parámetro)
    firebase/            Admin SDK (solo servidor) y SDK del navegador
    auth/                Proveedor de sesión del navegador
    client/              Cliente de API que adjunta el token
tests/unit/              Pruebas del dominio
tests/emulator/          Reglas, catálogo, inscripciones y entregas contra el emulador
e2e/                     Recorridos de navegador (escritorio y móvil)
scripts/                 Administración, seed y preparación de emuladores
diseno-claude/           Referencia del diseño exportado por Claude (no se duplica)
```

Firestore deniega todo acceso desde el cliente (`firestore.rules`). Las lecturas públicas se hacen en el servidor, que filtra campos internos (autor, borradores). Esto es intencional: abrir lecturas directas exigiría reglas por campo.

## Modelo de datos (Cortes 1–3)

- `experiences/{id}`: título, tipo (`competencia`, `hackathon`, `challenge_empresarial`), resumen, estado (`draft`, `published`, `closed`, `cancelled`), ventana de inscripción.
- `experiences/{id}` también puede declarar `primaryLine`, `secondaryLines`, `isDemo`, `demoNote`, `sourceUrl` y `sourceLabel`; los registros legacy usan el tipo como fallback.
- `challenges/{id}`: `experienceId`, problema, entregables, rúbrica (criterios con puntaje máximo de 1 a 10), organización responsable, modalidades (`individual`, `team` con tamaño mínimo y máximo), cierre de entregas, estado.
- `users/{uid}`: correo y nombre. Se crea la primera vez que la persona entra.
- `enrollments/{experienceId}__{uid}`: una inscripción por persona y experiencia. Estados `pending`, `approved`, `rejected`, `cancelled`.
- `participations/{challengeId}__{uid}`: se crea al aprobar la inscripción. Estado `active` o `cancelled`.
- `companyProposals/{id}`: propuesta pública (empresa, contacto, problema, resultado buscado, límites), estado (`received`, `needs_changes`, `accepted`, `not_prioritized`), nota de C3 y organización vinculada. Su referencia son los 6 primeros caracteres del id.
- `rateLimits/{hash}`: contador por conexión (sal + hash, nunca la IP en claro). Ventana de una hora.
- `organizations/{id}` y `organizationMembers/{orgId}__{uid}`: organizaciones y su representante, vinculado por C3 por correo.
- `submissions/{challengeId}__{uid}`: una entrega vigente por participación, en `draft` o `submitted`, con descripción y enlaces. En equipo, la clave es `{challengeId}__team__{teamId}` y solo la líder la guarda o envía.
- `teams/{id}`: nombre, código `C3-XXXX`, líder, integrantes, estado (`incompleto` o `habilitado`), mínimo y máximo de integrantes.
- `teamCodes/{code}`: índice que garantiza que cada código sea único.
- `teamMemberships/{experienceId}__{uid}`: un equipo por persona y experiencia.

Un reto publicado solo es público si su experiencia también está publicada. Una inscripción solo se crea mientras la ventana de inscripción está abierta, y la entrega solo se acepta con la inscripción aprobada y antes del cierre de entregas.

## Pendientes para el siguiente corte

1. **Revisión visual pendiente:** comparar V06, V07, V08, V09, V11 y el detalle de V12 contra el diseño con capturas; las nuevas landings ya tienen prueba de navegación, no reemplazan la revisión visual manual.
2. **Proyecto Firebase real:** definir el ID real, confirmar que no comparte colecciones ajenas y autorizar un dry-run con credenciales ADC; esta sesión no escribió ni desplegó nada.
3. **Migración personal:** sigue fuera de alcance; no se migran usuarios, participantes, equipos, entregas ni resultados privados.

## Notas

- Los paquetes `firebase` y `@firebase/storage` declaran Node 24.12 como motor; con Node 22 aparecen avisos `EBADENGINE` al instalar. No impiden el uso actual.
- `AGENTS.md` incluye un bloque que añade `next dev`; es la guía de Next.js 16 para agentes y se conserva.
- Las pruebas de navegador usan el build de producción (`next build` y `next start`) para no depender de la compilación bajo demanda de `next dev`.
