# Producto y navegación — C3 Platform

**Propósito:** fuente operativa de la arquitectura de información, los menús, los recorridos y el vocabulario de la plataforma. El objetivo no es agregar pantallas: es que cada persona complete sus tareas sin conocer las URL y que C3 se sienta como un solo producto.

**Estado:** la arquitectura descrita aquí fue **aprobada el 26-10-2026** (decisiones D1–D10 de [AUDITORIA-NAVEGACION-2026-10](AUDITORIA-NAVEGACION-2026-10.md)) y se implementa por fases sobre `dev`. Cada sección indica qué está implementado; el código y las pruebas determinan qué existe. No equivale a una prueba de usabilidad con personas (pendiente, §9).

## 1. Decisiones aprobadas

| ID | Decisión | Dónde se refleja |
| --- | --- | --- |
| D1 | Tras iniciar sesión sin destino previo se llega a **Mi C3** | §4 |
| D2 | `/api/me` entrega las **capacidades** de la cuenta; autorización segura y solo datos propios | §3 |
| D3 | **Una ruta canónica** de evaluación: `/mi-c3/evaluar/[challengeId]`; las anteriores redirigen | §5 |
| D4 | **Admin con una URL por sección**: `/admin/[seccion]` | §5 |
| D5 | Admin pensado para escritorio; en móvil, funcional sin esfuerzo adicional | §2 |
| D6 | Interfaces fluidas, sin marco de teléfono ni anchos rígidos; tareas en columnas sobre escritorio | §2 |
| D7 | **Compite · Crea · Conecta** se mantienen en la navegación | §2 |
| D8 | **«Challenge»** es el término oficial de producto | §7 |
| D9 | **Perfiles públicos** compartibles por enlace, opt-in, protegiendo datos privados | §8 |
| D10 | `dev` integra y valida; `main` se promueve desde `dev` | [AGENTS §9](../AGENTS.md) |

## 2. Zonas y marcos

Hay **tres zonas, una cabecera cada una**. Cambiar de zona es una decisión visible, no un accidente. No hay otros marcos: el antiguo marco de teléfono centrado (`MovilShell`) y la cabecera propia de Empresa y de Admin desaparecieron.

| Zona | Componente | Rutas | Navegación |
| --- | --- | --- | --- |
| **Sitio** (público) | `SiteShell` + `SiteHeader` + `Footer` | `/`, `/explorar`, `/compite`, `/crea`, `/conecta`, `/retos/[id]`, `/experiencias/[id]`, `/empresa/proponer`, `/personas/[slug]`, `/acceso`, 404 | Logo (es el inicio) · Explorar · Compite · Crea · Conecta · Para empresas · Entrar / Crear cuenta, o el menú de la cuenta |
| **App** (autenticada) | `AppShell` | `/mi-c3`, `/mi-c3/retos/[id]`, `/mi-c3/evaluar/[id]`, `/trayectoria`, `/cuenta`, `/empresa`, `/retos/[id]/inscripcion`, `/experiencias/[id]/inscripcion` | ≥ 1024 px: cabecera con Mi C3 · Explorar · Trayectoria (+ Mi empresa, Admin si corresponde) y menú de la cuenta. < 1024 px: barra superior mínima y **tab bar de cuatro**: Mi C3 · Explorar · Trayectoria · Cuenta |
| **Consola** (admin) | `AdminFrame` | `/admin/[seccion]` | Logo · Admin › sección · Ver sitio · Mi C3 · menú de la cuenta; menú lateral con contadores. < 1024 px el menú se pliega en un botón con la sección actual |

- **Cabecera pública en móvil:** una sola fila (~60 px) con logo, «Entrar» y botón «Menú»; el panel agrupa las líneas Compite · Crea · Conecta (D7).
- **Menú de la cuenta** (el mismo en las tres zonas): Mi C3 · Trayectoria · Cuenta · *Espacio de empresa* (si hay vínculo) · *Administración* (si es admin) · Salir.
- **Ancho:** el contenido es fluido y usa el ancho útil hasta `--c3-ancho-pagina` (1440 px). Entrega, inscripción y evaluación usan **dos columnas desde 1024 px** (contenido principal y contexto/rúbrica) y una columna en móvil.
- «Inicio» ya no existe como ítem: el logo lleva a `/` y la tab bar llama a Mi C3 por su nombre.

## 3. Capacidades, no tipos de usuario

Una misma cuenta puede participar, evaluar, representar una organización y administrar. `GET /api/me` devuelve, además del perfil, `capabilities`:

```json
{ "admin": false, "organizations": [{ "id": "…", "name": "…" }], "judge": { "challenges": 2 } }
```

- Se calcula en el servidor con el **uid del token verificado**: nunca acepta un identificador por parámetro; no devuelve datos de otras cuentas. `admin` sale del claim `c3Admin`; las organizaciones, de los vínculos que hizo C3; `judge`, de las asignaciones activas (una revocada no cuenta).
- La interfaz solo **decide qué enlaces mostrar** (`appNavigation`, `accountMenu`, `spacesOf` en `src/lib/domain/capabilities.ts`). La autorización de cada ruta sigue haciéndola el servidor; una capacidad ausente nunca se «concede» desde el cliente (`parseCapabilities` ante cualquier forma inesperada devuelve cero capacidades).
- **La evaluación no tiene ítem de menú:** vive en Mi C3 («Como jurado»). Para representantes, `/empresa` ofrece «Evaluar soluciones» en cada challenge cuyo jurado les asignó C3.
- Mi C3 muestra «Tus espacios» (empresa, administración) como tarjetas cuando la cuenta los tiene.

## 4. Reglas transversales

| Regla | Comportamiento |
| --- | --- |
| Destino tras acceso | `next` si existe y es una ruta interna; si no, **`/mi-c3`**. `safeNext` (dominio) rechaza direcciones externas, `//`, `\`, controles, rutas demasiado largas y la propia pantalla de acceso |
| «Entrar» / «Crear cuenta» | Añaden `next=<ruta actual>`; las pantallas privadas sin sesión (`RequiereSesion`) hacen lo mismo |
| «Salir» | Un solo comportamiento: cierra la sesión y vuelve a `/` |
| «Volver» | Migas (`Migas`) en pantallas a dos o más niveles: *Mi C3 › Mi challenge*, *Explorar › Challenge › Inscripción*, *Mi C3 › Challenge › Evaluar* |
| Sin permiso o sin sesión | Mensaje con una acción («Entrar», «Ir a Mi C3») dentro del marco que corresponde; nunca datos |
| Título de pestaña | «Mi C3 · C3 Platform»; detalle de challenge y experiencia llevan su nombre; Admin, «Propuestas · Admin · C3 Platform» |
| Accesibilidad básica | Un solo `<main id="contenido">` por página y enlace «Saltar al contenido». No sustituye una auditoría con lector de pantalla |
| 404 | Con cabecera y pie del sitio; con sesión, ofrece «Ir a Mi C3» |

## 5. Mapa de rutas

| Ruta | Rol | Tarea | Entrada | Salida / retorno | Menú |
| --- | --- | --- | --- | --- | --- |
| `/mi-c3` | Cualquier cuenta | Ver lo que toca ahora y los espacios | Destino por defecto tras entrar; menú de la cuenta; tab bar | Cada tarjeta lleva a su tarea | Mi C3 |
| `/mi-c3/retos/[id]` | Participante | Ver el challenge y entregar | Tarjeta de Mi C3; Trayectoria | Migas → Mi C3 | Mi C3 |
| `/mi-c3/evaluar/[id]` | Jurado (externo o representante) | Evaluar soluciones | Tarjeta «Como jurado»; Empresa → «Evaluar soluciones»; enlace de invitación (con `next`) | Migas → Mi C3 | Mi C3 |
| `/evaluar/[id]`, `/empresa/retos/[id]/evaluacion` | — | **Redirigen** (307) a la canónica | Enlaces antiguos | — | — |
| `/empresa` | Representante vinculada | Ver challenges, soluciones y propuestas; ir a evaluar | Menú de la cuenta; «Mi empresa»; tarjeta en Mi C3 | Menú | Mi empresa |
| `/admin` | Admin | — | Menú de la cuenta; tarjeta en Mi C3 | **Redirige** a `/admin/resumen` | Admin |
| `/admin/resumen` | Admin | Ver pendientes (propuestas, inscripciones) con enlaces | Entrada de la consola | Cada contador lleva a su sección | — |
| `/admin/{propuestas,experiencias,inscripciones,entregas,jurados,resultados}` | Admin | Operar esa parte del ciclo de vida | Menú lateral; resumen | Recargar y «atrás» conservan la sección; `?reto=` / `?experiencia=` en inscripciones | — |
| `/personas/[slug]` | Público | Ver el perfil público de una persona que lo activó | Enlace compartido; ganadores de un challenge | «Explorar experiencias»; 404 si no existe, se cambió o se desactivó | — |

Criterios de aceptación y prueba de cada fila: `e2e/navegacion.spec.ts` y las pruebas de cada área (§9).

## 6. Recorridos objetivo

| Recorrido | Pasos |
| --- | --- |
| Visitante → inscrita en un challenge | CTA → registro (`next`) → inscripción |
| Participante: volver y entregar | login → Mi C3 → «Abrir mi challenge» |
| **Jurado con enlace de invitación** | enlace → «Entrar» → login → **evaluación** (sin pasos intermedios) |
| Representante: ver soluciones y evaluar | login → Mi C3 → «Espacio de empresa» → «Evaluar soluciones» |
| Admin: atender propuestas | login → Mi C3 → Administración → «Propuestas por revisar» |
| Compartir la trayectoria | Trayectoria → «Activar en Cuenta» → elegir qué se muestra → copiar enlace |

## 7. Vocabulario

- **Challenge** es el término oficial en la interfaz, los mensajes y los documentos de producto (D8). «Reto» ya no se usa en textos visibles.
- Las **direcciones y los identificadores técnicos no cambian**: `/retos/[id]`, `/mi-c3/retos/[id]`, `/api/retos/…`, `challengeId`, colecciones y claves de estado. Cambiarlas rompería enlaces guardados sin beneficio (criterio de §8 de la auditoría).
- «Para empresas» es la etiqueta del menú público para el formulario `/empresa/proponer`; «Espacio de empresa» / «Mi empresa» es el área privada de la representante.
- Cuenta se rotula «Mi cuenta»; «Mi espacio» ya no se usa.

## 8. Perfil público (D9)

Opt-in, **privado por defecto**, controlado por la persona en Cuenta («Perfil público») y enlazado desde Trayectoria («Compartir perfil»).

- **Qué se puede mostrar:** siempre el nombre; opcionalmente centro de estudio (**oculto por defecto**: junto al nombre puede ubicar a una persona menor de edad), presentación, enlaces https y trayectoria. La persona ve y cambia cada opción.
- **Qué nunca se muestra:** correo, uid, entregas, borradores, notas, promedios, puestos, inscripciones sin aprobar (pendientes, rechazadas, canceladas) ni participaciones en experiencias o challenges que no son públicos. Los reconocimientos aparecen solo si C3 publicó el resultado y autorizó mostrar ganadores (la misma regla de la página del challenge).
- **Dirección:** `/personas/[slug]` con el nombre y un sufijo aleatorio de 6 caracteres (no adivinable). «Cambiar enlace» invalida la anterior. Una dirección inexistente, cambiada o desactivada responde 404 igual (no revela si hay o hubo un perfil). Las páginas llevan `noindex, nofollow`.
- **Conexiones:** Trayectoria enlaza al perfil; el nombre de un ganador individual en la página de un challenge enlaza a su perfil **solo si lo activó**; la dueña ve un aviso «Así ve tu perfil el público».
- **Servidor:** `GET/PUT /api/perfil/publico` y `POST /api/perfil/publico/enlace` (solo propios, token verificado); la lectura pública pasa por el servidor, que construye la vista con `buildPublicView`. Firestore sigue denegando todo acceso directo (`publicProfiles/{slug}` solo lo escribe el servidor).
- **Pendiente legal** (ver [PENDIENTES-REALES](PENDIENTES-REALES.md)): el tratamiento de menores y los permisos de imagen y nombre deben validarse antes de usar datos reales; hasta entonces el perfil es una demostración con datos de prueba.

## 9. Verificación y límites

- **Pruebas:** `tests/unit/` (navegación, capacidades, administración, perfil público), `tests/emulator/` (capacidades propias, perfil público y su privacidad, panel de resumen) y `e2e/navegacion.spec.ts` más las especificaciones por área. Ejecutar según la matriz de [AGENTS §11](../AGENTS.md).
- **No cubierto:** pruebas de usabilidad con personas de cada rol (tareas de §6), auditoría con lector de pantalla y dispositivos reales, Firefox/Safari. No afirmar facilidad de uso sin ellas.
- Las rutas nuevas deben registrarse en §5 con rol, tarea, entrada, salida, menú y criterios (AGENTS §4).
