# C3 Platform

> C3: Compite · Crea · Conecta. Primer producto demostrable: C3 Challenges.

Aplicación Next.js (App Router) con Firebase Authentication y Cloud Firestore. El diseño visual lo produjo Claude y se integra tal cual; la lógica, la persistencia y los permisos viven en este repositorio.

## Estado real (corte actual: 1 · Primer reto)

**Implementado y verificado en esta máquina** (emuladores de Firebase, sin proyecto de producción):

- Acceso con Firebase Auth: entrar, crear cuenta (con nombre), recuperar contraseña y sesión persistente al recargar.
- Administración de experiencias y retos: crear en borrador, publicar y volver a borrador. Lo que no está publicado no aparece en el sitio público.
- Visitante: catálogo público (V02), detalle de reto (V03) y home (V01) leídos de Firestore.
- Permisos en servidor: cada ruta de escritura verifica el token de Firebase y el claim `c3Admin`. Firestore deniega todo acceso directo desde el cliente.
- Errores de validación con motivos por campo; errores de sesión y de permisos con texto claro.

**Pendiente** (no hay botones falsos: se muestran como «Próximamente» o como sección pendiente de su corte):

- Inscripción, Mi C3, entrega (Corte 2), equipos (Corte 3), propuesta de empresas V10 y espacio V09 (Corte 4), evaluación, rúbricas y publicación de resultados (Corte 5), perfil V08.
- Textos legales (términos y privacidad) y proyecto Firebase real: ver `docs/PENDIENTES-REALES.md`.

### Resultados de las comprobaciones (última ejecución)

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm run lint` | Sin errores ni avisos |
| `npm test` (dominio) | 16 de 16 |
| `npm run test:rules` (reglas y servicios con emulador) | 11 de 11 |
| `npm run build` | Compila; rutas públicas dinámicas, API de servidor |
| `npm run test:e2e` (Playwright, escritorio y Pixel 5) | 14 de 14 |

## Recursos de Claude

- `diseno-claude/` contiene el paquete exportado: `vistas/` (V01–V12 y fundamentos en HTML), `tokens/` (`tokens.json` y `tokens.css`), `fuente-canvas/` y su README.
- `src/app/globals.css` importa `tokens.css` directamente desde esa carpeta; no hay copia de los tokens.
- Los fondos suaves de estado (`--c3-info-fondo`, `--c3-exito-fondo`, etc.) no están en `tokens.json`; se definen en `globals.css` como indica la guía de estilo.

### Cómo se transformaron los diseños

- Cada vista HTML se convirtió en componentes React/TypeScript conservando su estructura, textos y jerarquía. Los estilos repetidos (botones, etiquetas, tarjetas, campos, pastillas de estado) son clases en `globals.css`; el resto del layout queda en estilos en línea, como en el original.
- Los elementos que solo simulaban interactividad se conectaron a acciones reales o se marcaron como pendientes.
- Las vistas de escritorio mantienen su grilla fluida. Las vistas móviles (V05–V08) se diseñaron en un marco fijo de 390 × 844 px; en la aplicación ocupan el ancho del teléfono (todavía no implementadas).
- Se quitaron los rótulos «Datos de demostración» y los datos de ejemplo: la aplicación muestra solo datos reales de Firestore.

## Rutas y vistas

| Vista | Ruta | Acceso | Estado |
| --- | --- | --- | --- |
| V01 Home | `/` | Público | Implementada (destacados reales) |
| V02 Explorar | `/explorar` | Público | Implementada, sin filtros |
| V03 Detalle de reto | `/retos/[challengeId]` | Público | Implementada; inscripción en Corte 2 |
| V04 Acceso | `/acceso` | Público | Implementada |
| V05 Mi C3 | `/mi-c3` | Joven | Corte 2 |
| V06 Inscripción y equipos | `/mi-c3/retos/[id]/inscripcion` | Joven | Corte 2–3 |
| V07 Mi reto y entrega | `/mi-c3/retos/[id]/entrega` | Joven | Corte 2 |
| V08 Trayectoria | `/trayectoria` | Joven | Corte 4–5 |
| V09 Espacio de empresa | `/empresa` | Empresa | Corte 4 |
| V10 Proponer challenge | `/empresa/proponer` | Público | Corte 4 |
| V11 Evaluación | `/empresa/retos/[id]/evaluacion` | Empresa y jurado | Corte 5 |
| V12 Admin | `/admin` | Administrador | Experiencias y retos implementadas; otras secciones pendientes |

Las rutas de servidor están en `src/app/api/`. Las que leen o escriben datos privados (`/api/me`, `/api/admin/*`) exigen `Authorization: Bearer <token>` verificado con el Admin SDK, y comprueban permisos antes de tocar datos. `/api/health` es pública y no toca datos.

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
- `FIRESTORE_EMULATOR_HOST` y `FIREBASE_AUTH_EMULATOR_HOST`: solo en desarrollo. Las define `firebase emulators:exec` cuando corren las pruebas.
- Las credenciales privadas nunca van en `NEXT_PUBLIC_*`. En producción el Admin SDK usa Application Default Credentials o la identidad administrada del hosting.

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
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (configuración de Next.js) |
| `npm test` | Pruebas unitarias del dominio (sin emuladores) |
| `npm run test:rules` | Reglas de Firestore y servicios contra el emulador |
| `npm run test:e2e` | Recorridos con Playwright (inicia los emuladores y la aplicación) |
| `npm run emulators` | Solo emuladores |
| `npm run check` | Typecheck, lint y pruebas unitarias |

Para las pruebas de navegador en Windows con Microsoft Edge instalado: `PW_CHANNEL=msedge npm run test:e2e`. Si no defines `PW_CHANNEL`, Playwright usa su Chromium (`npx playwright install chromium`).

## Arquitectura

```
src/
  app/                   Rutas (App Router): páginas, API de servidor y estilos globales
  components/            Componentes compartidos (cabecera, pastillas de estado, pie, CTA de inscripción)
  lib/
    domain/              Entidades, validaciones puras y estados de presentación (sin Firebase)
    server/              Servicios de catálogo, autenticación, perfil y errores (reciben la base por parámetro)
    firebase/            Admin SDK (solo servidor) y SDK del navegador
    auth/                Proveedor de sesión del navegador
    client/              Cliente de API que adjunta el token
tests/unit/              Pruebas del dominio
tests/emulator/          Reglas y servicios contra el emulador
e2e/                     Recorridos de navegador
scripts/                 Administración y preparación de emuladores
diseno-claude/           Referencia del diseño exportado por Claude (no se duplica)
```

Firestore deniega todo acceso desde el cliente (`firestore.rules`). Las lecturas públicas se hacen en el servidor, que filtra campos internos (autor, borradores). Esto es intencional: abrir lecturas directas exigiría reglas por campo.

## Modelo de datos del Corte 1

- `experiences/{id}`: título, tipo (`competencia`, `hackathon`, `challenge_empresarial`), resumen, estado (`draft`, `published`, `closed`, `cancelled`), ventana de inscripción.
- `challenges/{id}`: `experienceId`, problema, entregables, rúbrica (criterios con puntaje máximo de 1 a 10), organización responsable, modalidades (`individual`, `team` con tamaño mínimo y máximo), cierre de entregas, estado.
- `users/{uid}`: correo y nombre. Se crea la primera vez que la persona entra.

Un reto publicado solo es público si su experiencia también está publicada.

## Pendientes para el siguiente corte

1. **Corte 2 · Joven:** inscripción individual con estados (pendiente, aprobada, rechazada, cancelada), Mi C3, entrega de texto y enlaces con borrador y plazo, y bloqueo al cerrar.
2. **Corte 3 · Equipos:** creación de equipo por código `C3-XXXX` y gestión de integrantes.
3. **Corte 4 · Empresas:** propuesta pública sin cuenta con defensas anti-spam y validación en servidor; revisión por C3; vinculación de representantes.
4. **Corte 5 · Evaluación:** asignación de jurados, evaluaciones finalizadas, consolidación y publicación oficial.
5. **Corte 6:** revisión visual completa de las 12 vistas, auditoría de accesibilidad y pruebas de móvil en todas las vistas.
6. **Proyecto Firebase real:** crear el proyecto de desarrollo, configurar Auth y Firestore, y definir la asignación de administradores en producción.
7. **Repositorio GitHub:** ver el reporte de la última sesión.

## Notas

- Los paquetes `firebase` y `@firebase/storage` declaran Node 24.12 como motor; con Node 22 aparecen avisos `EBADENGINE` al instalar. No impiden el uso actual.
- `AGENTS.md` incluye un bloque que añade `next dev`; es la guía de Next.js 16 para agentes y se conserva.
