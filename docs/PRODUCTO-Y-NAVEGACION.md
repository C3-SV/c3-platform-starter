# Producto y navegación — C3 Platform

**Propósito:** fuente operativa de la arquitectura de información, los menús, los recorridos y el vocabulario. El objetivo no es agregar pantallas: es que cada persona complete sus tareas sin conocer las URL y que C3 se sienta como un solo producto.

**Estado:** arquitectura aprobada el 26-10-2026 (decisiones D1–D10 de la [auditoría archivada](archivo/AUDITORIA-NAVEGACION-2026-10.md)) e implementada sobre `dev`. El código y las pruebas determinan qué existe. No equivale a una prueba de usabilidad con personas (pendiente, §9).

## 1. Decisiones aprobadas

| ID | Decisión | Dónde |
| --- | --- | --- |
| D1 | Tras iniciar sesión sin destino previo se llega a **Mi C3** | §4 |
| D2 | `/api/me` entrega las **capacidades** de la cuenta; solo datos propios | §3 |
| D3 | **Una ruta canónica** de evaluación: `/mi-c3/evaluar/[challengeId]`; las anteriores redirigen | §5 |
| D4 | **Admin con una URL por sección**: `/admin/[seccion]` | §5 |
| D5 | Admin pensado para escritorio; en móvil, funcional sin esfuerzo adicional | §2 |
| D6 | Interfaces fluidas, sin marco de teléfono ni anchos rígidos; en escritorio, tareas en columnas | §2 |
| D7 | **Compite · Crea · Conecta** se mantienen en la navegación | §2 |
| D8 | **«Challenge»** es el término oficial | §7 |
| D9 | **Perfiles públicos** compartibles por enlace, opt-in, protegiendo datos privados | §8 |
| D10 | `dev` integra y valida; `main` se promueve desde `dev` | [AGENTS §8](../AGENTS.md) |
| D11 | **Rediseño visual** (4-nov-2026): acción violeta, cabecera blanca con «Conoce C3» (Compite · Crea · Conecta) y textos con «tú». Sin aviso global de entorno de demostración: lo inventado se marca DEMO en cada elemento | §2 |
| D12 | **Portada por enlace** (4-nov-2026): experiencias y challenges pueden tener una imagen de portada por enlace, solo de sitios de C3 (`c3.com.sv` y subdominios), con descripción obligatoria. La pone C3 desde la consola; la representante no la cambia. Un challenge sin portada propia usa la de su experiencia; sin portada o si el enlace falla, la tarjeta muestra el ícono de la línea. Se puede corregir en una experiencia concluida. Sin subida de archivos | §2 |

## 2. Zonas y marcos

**Tres zonas, una cabecera cada una.** Cambiar de zona es una decisión visible. No hay otros marcos.

| Zona | Componente | Rutas | Navegación |
| --- | --- | --- | --- |
| **Sitio** (público) | `SiteShell` + `SiteHeader` + `Footer` | `/`, `/explorar`, `/compite`, `/crea`, `/conecta`, `/retos/[id]`, `/experiencias/[id]`, `/empresa/proponer`, `/personas/[slug]`, `/acceso`, 404 | Logo (inicio) · Explorar · Conoce C3 (Compite · Crea · Conecta) · Para empresas · Iniciar sesión / Crear cuenta, o el menú de la cuenta |
| **App** (autenticada) | `AppShell` | `/mi-c3`, `/mi-c3/retos/[id]`, `/mi-c3/evaluar/[id]`, `/trayectoria`, `/cuenta`, `/empresa`, `/retos/[id]/inscripcion`, `/experiencias/[id]/inscripcion` | ≥ 1024 px: cabecera con Mi C3 · Explorar · Trayectoria (+ Mi empresa, Admin si corresponde) y menú de la cuenta. < 1024 px: barra superior mínima y tab bar de cuatro: Mi C3 · Explorar · Trayectoria · Cuenta |
| **Consola** (admin) | `AdminFrame` | `/admin/[seccion]` | Logo · Admin › sección · Ver sitio · Mi C3 · menú de la cuenta; menú lateral con contadores (< 1024 px se pliega) |

- **Cabecera pública en móvil:** una fila (~64 px) con logo, «Iniciar sesión» y «Menú»; el panel agrupa Compite · Crea · Conecta bajo «Conoce C3».
- **Acceso:** iniciar sesión (`/acceso`) y crear cuenta (`/acceso?modo=registro`) son pantallas separadas que se enlazan entre sí y conservan `next`.
- **Menú de la cuenta** (igual en las tres zonas): Mi C3 · Trayectoria · Cuenta · *Espacio de empresa* (si hay vínculo) · *Administración* (si es admin) · Salir.
- **Ancho:** fluido hasta `--c3-ancho-pagina` (1440 px). Entrega, inscripción y evaluación usan dos columnas desde 1024 px y una en móvil.
- «Inicio» no es un ítem: el logo lleva a `/`.

## 3. Capacidades, no tipos de usuario

Una cuenta puede participar, evaluar, representar una organización y administrar. `GET /api/me` devuelve, además del perfil, `capabilities`:

```json
{ "admin": false, "organizations": [{ "id": "…", "name": "…" }], "judge": { "challenges": 2 } }
```

- Se calcula en el servidor con el **uid del token verificado**; nunca acepta un identificador por parámetro. `admin` sale del claim `c3Admin`; las organizaciones, de los vínculos de C3; `judge`, de las asignaciones activas.
- La interfaz solo **decide qué enlaces mostrar** (`appNavigation`, `accountMenu`, `spacesOf` en `src/lib/domain/capabilities.ts`); cada ruta vuelve a autorizar. `parseCapabilities` ante cualquier forma inesperada devuelve cero capacidades.
- **La evaluación no tiene ítem de menú:** vive en Mi C3 («Como jurado»); `/empresa` ofrece «Evaluar soluciones» en los challenges de sus organizaciones con soluciones enviadas. La representante vinculada evalúa esos challenges sin asignación previa de C3, desde que el challenge está publicado; si C3 le revocó la asignación, el acceso se corta y el panel lo indica.
- Mi C3 muestra «Tus espacios» (empresa, administración) como tarjetas cuando la cuenta los tiene.

## 4. Reglas transversales

| Regla | Comportamiento |
| --- | --- |
| Destino tras acceso | `next` si es una ruta interna; si no, **`/mi-c3`**. `safeNext` rechaza direcciones externas, `//`, `\`, controles, rutas largas y la propia pantalla de acceso |
| «Iniciar sesión» / «Crear cuenta» | Añaden `next=<ruta actual>`; las pantallas privadas sin sesión (`RequiereSesion`) también |
| «Salir» | Cierra la sesión y vuelve a `/` |
| «Volver» | Migas (`Migas`) en pantallas de dos o más niveles |
| Sin permiso o sin sesión | Mensaje con una acción («Entrar», «Ir a Mi C3») dentro del marco que corresponde; nunca datos |
| Título de pestaña | «Mi C3 · C3 Platform»; el detalle lleva el nombre; Admin, «Propuestas · Admin · C3 Platform» |
| Accesibilidad básica | Un `<main id="contenido">` por página y enlace «Saltar al contenido». No sustituye una auditoría con lector de pantalla |
| 404 | Con cabecera y pie del sitio; ofrece «Explorar experiencias» y, con sesión, «Ir a Mi C3» (sin sesión, «Volver al inicio») |

## 5. Mapa de rutas

| Ruta | Rol | Tarea | Entrada | Salida / retorno | Menú |
| --- | --- | --- | --- | --- | --- |
| `/mi-c3` | Cualquier cuenta | Ver lo que toca ahora, los espacios y, si existen, las «Solicitudes de contacto» | Destino por defecto; menú de la cuenta; tab bar | Cada tarjeta lleva a su tarea; aceptar, declinar o revocar se hace en la misma sección | Mi C3 |
| `/mi-c3/retos/[id]` | Participante | Ver el challenge, registrar bitácora y defensa, entregar | Tarjeta de Mi C3; Trayectoria | Migas → Mi C3 | Mi C3 |
| `/mi-c3/evaluar/[id]` | Jurado | Evaluar soluciones | Tarjeta «Como jurado»; Empresa → «Evaluar soluciones»; invitación (con `next`) | Migas → Mi C3 | Mi C3 |
| `/evaluar/[id]`, `/empresa/retos/[id]/evaluacion` | — | **Redirigen** (307) a la canónica | Enlaces antiguos | — | — |
| `/empresa` | Representante vinculada | Ver challenges, resultados y talento, configurar, evaluar | Menú de la cuenta; tarjeta en Mi C3 | Menú | Mi empresa |
| `/admin` | Admin | — | Menú de la cuenta; tarjeta en Mi C3 | **Redirige** a `/admin/resumen` | Admin |
| `/admin/resumen` | Admin | Ver pendientes con enlaces | Entrada de la consola | Cada contador lleva a su sección | — |
| `/admin/{propuestas,experiencias,inscripciones,entregas,jurados,resultados}` | Admin | Operar esa parte del ciclo de vida | Menú lateral; resumen | Recargar y «atrás» conservan la sección; `?reto=` / `?experiencia=` en inscripciones; `?organizacion=` en experiencias | — |
| `/personas/[slug]` | Público | Ver el perfil público de quien lo activó | Enlace compartido; ganadores de un challenge | «Explorar experiencias»; 404 si no existe, cambió o se desactivó | — |

Toda ruta o pantalla nueva se registra aquí con rol, tarea, entrada, salida, menú y criterios de aceptación ([AGENTS §4](../AGENTS.md)). Las pruebas de estas filas están en `e2e/navegacion.spec.ts` y en las de cada área (§9).

## 6. Recorridos objetivo

| Recorrido | Pasos |
| --- | --- |
| Visitante → inscrita en un challenge | CTA → registro (`next`) → inscripción con confirmaciones |
| Participante: volver y entregar | login → Mi C3 → «Abrir mi challenge» |
| Jurado con enlace de invitación | enlace → «Entrar» → login → evaluación, sin pasos intermedios |
| Representante: ver talento y evaluar | login → Mi C3 → «Espacio de empresa» → «Ver talento y lista corta» / «Evaluar soluciones» |
| Admin: atender propuestas | login → Mi C3 → Administración → «Propuestas por revisar» |
| Compartir la trayectoria | Trayectoria → «Activar en Cuenta» → elegir qué se muestra → copiar enlace |

## 7. Vocabulario

- **Challenge** es el término oficial en interfaz, mensajes y documentos (D8). «Reto» no se usa en textos visibles.
- Las **direcciones e identificadores técnicos no cambian** (`/retos/[id]`, `/api/retos/…`, `challengeId`, colecciones, claves de estado): cambiarlos rompería enlaces sin beneficio.
- «Para empresas» es el menú público hacia `/empresa/proponer`; «Espacio de empresa» / «Mi empresa» es el área privada de la representante. Cuenta se rotula «Mi cuenta».
- La interfaz usa «tú» (D11) y marca los datos inventados **DEMO**.

## 8. Perfil público (D9)

Opt-in, **privado por defecto**, controlado en Cuenta («Perfil público») y enlazado desde Trayectoria («Compartir perfil»).

- **Se puede mostrar:** siempre el nombre; opcionalmente centro de estudio (**oculto por defecto**: junto al nombre puede ubicar a una persona menor), presentación, enlaces https y trayectoria.
- **Nunca se muestra:** correo, uid, entregas, borradores, notas, promedios, puestos, inscripciones sin aprobar ni participaciones en experiencias o challenges no públicos. Los reconocimientos aparecen solo si C3 publicó el resultado y autorizó mostrar ganadores.
- **Dirección:** `/personas/[slug]` (nombre + sufijo aleatorio de 6 caracteres). «Cambiar enlace» invalida la anterior. Una dirección inexistente, cambiada o desactivada responde 404 igual; `noindex, nofollow`.
- **Conexiones:** Trayectoria enlaza al perfil; el nombre de un ganador individual enlaza a su perfil solo si lo activó; la dueña ve «Así ve tu perfil el público».
- **Servidor:** `GET/PUT /api/perfil/publico` y `POST /api/perfil/publico/enlace` (solo propios); la vista pública se construye con `buildPublicView`.
- **Pendiente legal:** menores y permisos de imagen y nombre antes de datos reales ([PENDIENTES](PENDIENTES-REALES.md)).

## 9. Verificación y límites

- **Pruebas:** `tests/unit/` (navegación, capacidades, administración, perfil público), `tests/emulator/` (capacidades propias, privacidad del perfil, resumen) y `e2e/navegacion.spec.ts` más las especificaciones por área. Ejecutar según la matriz de [AGENTS §9](../AGENTS.md).
- **No cubierto:** pruebas de usabilidad con personas de cada rol (tareas de §6), auditoría con lector de pantalla y dispositivos reales, Firefox y Safari. No afirmar facilidad de uso sin ellas.

## 10. Talento para empresas y contacto (demo del 3 al 4-nov-2026)

Reglas en [AGENTS §5](../AGENTS.md); estado por tarea en el [plan](superpowers/plans/2026-11-03-c3-challenges-demo.md).

| Recorrido | Pantalla y ruta | Acción real |
| --- | --- | --- |
| Empresa explora resultados y compara | `/empresa` → tarjeta del challenge → «Ver talento y lista corta» (`TalentoPanel`) | Cifras, filtros (todas, lista corta, con defensa, sin evaluar), orden, tabla de comparación con promedio, matriz por criterio (solo con resultados publicados con puntajes visibles) y ficha de la persona: entregable, proceso, defensa, retroalimentación, lista corta y contacto |
| Agrega o quita de la lista corta | Mismo panel; motivo de 10 a 500 caracteres | `POST` y `DELETE /api/empresa/retos/[id]/lista-corta[/submissionId]`; no se quita con solicitud activa |
| Solicita contacto | Mismo panel; con lista corta, inscripción aprobada y entrega (individual, o de equipo a través de su líder) | `POST /api/empresa/retos/[id]/contacto` → «Esperando consentimiento» |
| Registra contacto o seguimiento | Mismo panel, tras la aceptación (canal simulado: mensaje interno de C3) | `PATCH /api/empresa/contactos/[id]` |
| Redacta y publica retroalimentación | Mismo panel, casilla «Publicar para la persona» | `PUT /api/empresa/retos/[id]/retroalimentacion` (20 a 1500 caracteres) |
| Configura el challenge (E3) | `/empresa` → «Configurar challenge» (`ConfiguracionChallenge`) | Edita resumen, problema, entregables, cierre y, sin entregas, la rúbrica; `GET/PATCH /api/empresa/retos/[id]/configuracion`. Pueden la representante vinculada y C3 (por ahora también una representante que es jurado) |
| Propuesta con intención | `/empresa/proponer`, «¿Qué querés lograr?» | Guarda `intent` (`talento`, `solucion` o `ambos`) |
| Admin crea challenge desde una propuesta (E1) | `/admin/propuestas` → «Crear challenge para esta organización» | Abre `/admin/experiencias?organizacion=<id>` con la organización preelegida; no crea nada por sí solo |
| Persona responde a la solicitud | `/mi-c3`, «Solicitudes de contacto» (`ContactosPanel`) | `PATCH /api/contactos/[id]`: aceptar, declinar o revocar |
| Persona registra su defensa | `/mi-c3/retos/[id]`, «Defensa» (`DefensaPanel`), tras enviar | `PUT /api/retos/[id]/defensa` (en equipo, solo la líder) |
| Persona registra avances | `/mi-c3/retos/[id]`, «Avances y decisiones» (`BitacoraPanel`) | `GET` y `POST /api/retos/[id]/bitacora`; se cierra con el plazo |
| Persona lee la retroalimentación | `/mi-c3/retos/[id]` (`RetroalimentacionCard`) | `GET /api/retos/[id]/retroalimentacion`; un borrador nunca llega a la persona |
| Filtra el catálogo | `/explorar` (`FiltrosExplorar`, en el cliente) | Tipo, línea, estado (abierto, próximo, concluido) y «solo demo»; no cambia qué existe |

**Próximamente:** canal real de contacto tras la aceptación (hoy simulado) y datos de contacto en cualquier vista.

Visibilidad: la empresa ve solo su organización (C3 ve todas); la persona ve solo sus solicitudes y su defensa; ninguna vista muestra correo ni otros datos de contacto, salvo la administración C3.
