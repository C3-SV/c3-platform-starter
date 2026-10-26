# Auditoría de producto, UX y navegación — C3 Platform (26-10-2026)

**Estado: diagnóstico y propuesta para revisión. Nada de lo propuesto está implementado ni aprobado.** No se modificó código, rutas ni diseños. Este documento cumple el «próximo entregable» de [PRODUCTO-Y-NAVEGACION §6](PRODUCTO-Y-NAVEGACION.md) y no repite lo que ya describen [README](../README.md) (rutas, modelo), [AGENTS](../AGENTS.md) (reglas) ni [PENDIENTES-REALES](PENDIENTES-REALES.md) (bloqueos); los enlaza.

Etiquetas de evidencia: **[N]** observado en navegador · **[C]** leído en código · **[H]** hipótesis sin probar · **[P]** propuesta.

---

## 1. Resumen ejecutivo

**Veredicto.** La plataforma funciona por tareas (inscribirse, entregar, evaluar, operar) pero **no está organizada por personas**: cada pantalla trae su propia cabecera y nadie diseñó la navegación *entre* pantallas. El resultado es que tres de los cinco recorridos clave tienen un callejón sin salida o un paso invisible, y una misma cuenta con varios «sombreros» (participante + jurado + empresa + admin) no ve reflejados sus accesos.

**Los cinco hallazgos que más pesan**

| # | Hallazgo | Evidencia |
| --- | --- | --- |
| H1 | **El enlace de entrada del jurado termina en 404.** «Entrar» desde cualquier pantalla de evaluación envía a `/acceso?next=/evaluar/[id]`; esa ruta no existe. Afecta a jurados externos y a representantes. | [N] [C] captura `esc-08` |
| H2 | **El Espacio de empresa (`/empresa`) no es alcanzable desde ningún enlace del sitio** y, una vez dentro, la cabecera solo tiene logo y «Salir». La evaluación de empresa (`/empresa/retos/[id]/evaluacion`) tampoco tiene enlace entrante. | [N] [C] recorrido J4 |
| H3 | **Tras iniciar sesión, todos los roles caen en la Home pública (`/`)**, y el «Entrar» de la cabecera no recuerda dónde estaba la persona. | [N] 6 de 6 cuentas; J2 |
| H4 | **Hay seis marcos de navegación distintos** (más un 404 sin cabecera). Ir de Mi C3 a Cuenta cambia toda la cabecera; en móvil, Cuenta y las páginas públicas gastan 243 px de 844 con un menú truncado («Empr…»), mientras que el marco de la app gasta 67 px. | [N] J10; capturas `mov-01`, `mov-02` |
| H6 | **Admin es una pantalla sin URL por sección:** recargar vuelve a «Experiencias y retos», «atrás» sale del panel, el «Resumen» no lleva a nada y la cabecera no enlaza al resto del sitio. | [N] J5; captura `esc-06` |

**Propuesta en una frase [P].** Conservar todas las URL y los flujos que ya funcionan; pasar de «cada pantalla con su cabecera» a **tres zonas con una cabecera cada una** —sitio público, app autenticada y consola Admin— y mostrar los accesos según las **capacidades** de la cuenta (jurado, empresa, admin), no según un «tipo de usuario».

**Qué necesito que decidas** (detalle en §8): destino posterior al login (D1), cómo la app sabe qué capacidades tiene la cuenta (D2), ruta canónica de evaluación (D3), URL por sección en Admin (D4) y el tratamiento de escritorio de las tareas del participante (D6). Las correcciones de la Fase 0 (§7) **no requieren decisión de producto** y pueden hacerse primero.

**Lo que ya funciona y se conserva** (§2): la Home de «dos puertas», Mi C3 ordenado por «lo que toca ahora», el panel responsive de Mi C3/Trayectoria, la continuidad de inscripción vía `next`, el vocabulario único de estados y la secuencia lógica del menú Admin.

---

## 2. Qué funciona y conviene conservar

| Qué | Por qué se conserva | Evidencia |
| --- | --- | --- |
| Home con dos puertas («Soy estudiante» / «Soy una empresa») | Es la mejor expresión del modelo mental del producto; la navegación debería reflejarla | [N] `/` |
| **Mi C3** como centro: «Te toca ahora» → «En espera» → «Entregado» → «Como jurado» | Ya integra dos capacidades (participante y jurado) en un solo lugar; es el embrión del *hub* propuesto | [N] `esc-01`, `mov-03` |
| Panel responsive de Mi C3 y Trayectoria (barra superior en 1280 px, tab bar en 390 px) | Es el único marco que sirve bien en ambos tamaños | [N] |
| Continuidad de inscripción: CTA → `/acceso?modo=registro&next=…` → inscripción | Probado de punta a punta en 4 clics más formulario; es el patrón a generalizar | [N] J1 |
| Pantallas de entrega por pasos (Inscrito → Habilitado → Entrega → Evaluación → Resultado) | Orienta sin explicar | [N] `esc-03` |
| Vocabulario único de estados (`StatePill`) y evaluación anónima («Solución 1…») | Coherente con [AGENTS §6](../AGENTS.md) y el diseño | [N] [C] |
| Menú Admin en orden de ciclo de vida (Propuestas → Experiencias → Inscripciones → Entregas → Jurados → Resultados) | La secuencia es correcta; falta la URL y el atajo a pendientes | [N] `esc-06` |
| **Cero desbordes horizontales** en 116 cargas de página a 390 y 1280 px | La base responsive es sólida | [N] crawl |
| `Cuenta` separada de `Trayectoria` (lo editable vs. lo que C3 registra) | Decisión de producto correcta; solo falta clarificar el copy (H13) | [N] [C] |

---

## 3. Mapa real de marcos y entradas

Rutas, accesos y estado de cada vista están en [README «Rutas y vistas»](../README.md); aquí solo lo que importa para navegar.

| Marco (cabecera) | Rutas que lo usan | Navegación que ofrece | ¿Cómo se vuelve? |
| --- | --- | --- | --- |
| **A. Cabecera pública** (`SiteHeader`) | `/`, `/explorar`, `/compite`, `/crea`, `/conecta`, `/retos/[id]`, `/experiencias/[id]`, `/empresa/proponer`, **`/cuenta`**, `/empresa/retos/[id]/evaluacion` | Inicio · Explorar · Compite · Crea · Conecta · Empresas + (con sesión) Mi C3 · Cuenta · Trayectoria · Admin · Salir | Menú |
| **B. Cabecera mínima** | `/acceso` | Logo + «Seguir explorando sin cuenta» | Enlace |
| **C. Panel de la persona** (`MovilShell layout="panel"` + `PanelHeader`) | `/mi-c3`, `/trayectoria` | ≥1024 px: Mi C3 · Explorar · Trayectoria + avatar «Mi cuenta» + Salir. <1024 px: barra superior + tab bar Inicio · Explorar · Trayectoria | Menú |
| **D. Marco de teléfono** (`MovilShell layout="movil"`) | `/mi-c3/retos/[id]`, `/mi-c3/evaluar/[id]`, `/retos/[id]/inscripcion`, `/experiencias/[id]/inscripcion` | «← Mi C3» + logo + Salir + tab bar. **En 1280 px es una columna de ~480 px centrada** | «← Mi C3» |
| **E. Cabecera propia de Empresa** | `/empresa` | Logo (→ `/`) + «Espacio de empresa» + correo + Salir. **Nada más** | Solo el logo |
| **F. Cabecera propia de Admin** | `/admin` | «C3» en texto (no el logotipo) + correo + Salir; menú lateral por estado interno | Solo «C3» |
| (G) 404 | cualquier ruta inexistente | Ninguna cabecera; un botón «Explorar experiencias» | — |

**Entradas a cada destino desde la interfaz** [N] (J4 y crawl):

| Destino | Desde dónde se llega sin conocer la URL |
| --- | --- |
| `/mi-c3` | Cabecera A (con sesión), cabecera C, tab bar |
| `/cuenta` | Cabecera A; avatar de C (solo ≥1024 px); en móvil **solo** desde el bloque «Accesos» al final de Mi C3 o «Editar en Cuenta» en Trayectoria |
| `/trayectoria` | Cabecera A y C, tab bar |
| `/admin` | Cabecera A (si es admin), bloque «Accesos» de Mi C3, cabecera C |
| **`/empresa`** | **Ninguna.** Hay 0 enlaces a `/empresa` en Home, Mi C3, Trayectoria, Cuenta, Explorar, Conecta y Proponer |
| **`/empresa/retos/[id]/evaluacion`** | **Ninguna** |
| `/mi-c3/evaluar/[id]` | Tarjeta «Como jurado» de Mi C3 |

---

## 4. Hallazgos priorizados

Severidad: **Crítica** = bloquea o rompe un recorrido; **Alta** = el recorrido existe pero es opaco o inconsistente para un rol; **Media** = fricción o inconsistencia; **Baja** = pulido.

### 4.1 Bloqueantes de recorrido

**H1 · Enlace del jurado roto — Crítica.**
`EvaluadorPanel` arma `/acceso?next=/evaluar/[id]` ([src/components/EvaluadorPanel.tsx](../src/components/EvaluadorPanel.tsx)), pero la página vive en `/mi-c3/evaluar/[id]`. [N] Sin sesión → «Entrar» → login correcto → `/evaluar/[id]` → 404 («Puede que el reto haya sido retirado…»), tanto desde `/mi-c3/evaluar/[id]` como desde `/empresa/retos/[id]/evaluacion`. Un jurado invitado por enlace hace todo bien y termina en «No encontramos esta página». Confirma la sospecha de PRODUCTO-Y-NAVEGACION §2. Ninguna prueba E2E parte de una URL de evaluación sin sesión ([C] las especificaciones inician con un acceso explícito, p. ej. `corte5` con `loginAt(..., "/mi-c3")`).

**H2 · Espacio de empresa inalcanzable y aislado — Crítica para el piloto con empresa.**
[N] Una representante vinculada inicia sesión, aterriza en `/` y no encuentra ningún enlace a su espacio; solo llega escribiendo `/empresa`. Dentro, la cabecera solo ofrece logo y «Salir» (`esc-05`): sin Mi C3, Cuenta, Explorar ni «Evaluar». Las soluciones se ven en tarjetas pero **no hay acción para evaluarlas**; la evaluación vive en otra ruta sin enlace entrante (`/empresa/retos/[id]/evaluacion`) o, para jurado asignado, en Mi C3. El diseño preveía V09 → V05 y V09 → V11 ([diseno-claude/README §7](../diseno-claude/README.md)); ninguno de los dos enlaces se implementó.

**H3 · Destino posterior al acceso — Alta.**
[N] Las seis cuentas probadas (participante nueva, participante con entregas, jurado, representante vinculada, representante sin vínculo y admin) caen en `/` tras entrar sin `next`. [N] J2: desde `/retos/[id]`, el «Entrar» de la cabecera enlaza a `/acceso` sin `next` y vuelve a la Home. Para entrar hay que dar un clic extra («Mi C3» o «Admin») sobre una página de marketing. Lo que sí funciona: los CTA de inscripción y las pantallas «Entrá para…» sí pasan `next` (salvo H1).

### 4.2 Arquitectura de información

**H4 · Seis marcos, sin transición coherente — Alta.** (§3)
- [N] Mi C3 → «Cuenta» cambia la cabecera completa (de «Mi C3 · Explorar · Trayectoria» a «Inicio · Explorar · Compite · Crea · Conecta · Empresas … Mi C3 · Cuenta · Trayectoria»): `esc-01` vs `esc-02`.
- [N] En móvil, `/cuenta` usa la cabecera pública (243 px, tres filas, menú recortado «Empr…») sin tab bar (`mov-02`); Mi C3 usa 67 px y tab bar (`mov-03`). La persona sale de «la app» a «el sitio web» sin aviso.
- **«Inicio» significa dos cosas:** en la cabecera pública es `/`; en la tab bar móvil es `/mi-c3`; y en el panel de escritorio ese mismo destino se llama «Mi C3». [N] [C]
- `Salir` aparece en 6 sitios con variantes distintas (texto, botón, «Salir de la cuenta»).
- [C] Los marcos D llevan siempre «← Mi C3» aunque el destino sea otro: en `/experiencias/[id]/inscripcion` el enlace dice «← Mi C3» pero va al detalle de la experiencia (`backHref` sin `backLabel`). [N] Sin sesión, esas pantallas muestran además la tab bar «Inicio · Explorar · Trayectoria» con destinos que exigen cuenta.

**H5 · La cuenta de varios sombreros no está modelada — Alta.** [C] [N]
[AccesoPanel](../src/app/acceso/AccesoPanel.tsx) promete «usás esta misma cuenta» para empresas, y Mi C3 ya mezcla participante + jurado. Pero la navegación solo conoce «admin» (`session.user.isAdmin`). Una persona que además es representante o jurado no ve ni «Mi empresa» ni «Evaluaciones» en ningún menú. La Home, en cambio, sí distingue dos puertas: la navegación no.

**H6 · Admin es una consola desconectada — Alta.** [N] [C]
- Sección en estado de React: URL fija `/admin`; **recargar pierde la sección**; «atrás» sale del panel; no se puede enlazar a «Propuestas».
- Entra por «Experiencias y retos», no por «Resumen»; el Resumen son cinco contadores **sin enlaces** (p. ej. «3 inscripciones pendientes» no lleva a ellas).
- Cabecera con «C3» en texto plano (no el logotipo de marca), sin enlace a Mi C3, Cuenta ni sitio público.
- Sin puentes entre secciones del flujo natural: aceptar una propuesta no ofrece «crear reto para esta propuesta» ([C] `PropuestasPanel` no enlaza a retos ni experiencias).
- Móvil [N]: el menú lateral ocupa ~330 px antes del contenido (`mov-04`); no se pidió soporte móvil de Admin: **decidir** (D5).
- Código [C]: el campo `pending` de `NAV` y `PendingSection` son residuos de cuando las secciones no existían.

**H7 · El marco de teléfono se usa también para tareas densas de escritorio — Alta (evaluación), Media (entrega e inscripción).** [N]
Entrega, inscripción y evaluación se ven en 1280 px como una columna de ~480 px con 400 px vacíos a cada lado (`esc-03`, `esc-04`). El diseño pedía **mobile-first para V05–V08** pero **escritorio para V09–V11** («soluciones lado a lado y rúbrica», V11). La evaluación del jurado y la del representante comparten componente; hoy ninguna cumple V11. [AGENTS §4](../AGENTS.md) ya advierte que «un marco móvil centrado en escritorio no sustituye un panel de escritorio útil».

**H8 · Cabecera pública en móvil — Media.** [N] 243 px de 844 (29 %), enlaces en una fila con scroll horizontal («Empr…») y botones «Entrar/Crear cuenta» en otra fila. No hay menú colapsable.

### 4.3 Coherencia y contenido

**H9 · Tres URL para la tarea «evaluar» — Media.** [N] [C] `/mi-c3/evaluar/[id]` (correcta), `/empresa/retos/[id]/evaluacion` (mismo componente, otro marco, sin enlace entrante) y `/evaluar/[id]` (inexistente, la usa el `next` de H1). Según la ruta, el mismo jurado ve el marco de teléfono (`esc-04`) o la cabecera pública con «Empresas» resaltado aunque sea externo.

**H10 · «Próximamente» donde la función ya existe — Media.** [N] [C] El detalle de reto muestra un botón «Próximamente» en «¿Tenés un problema así?» ([src/app/retos/[challengeId]/page.tsx](../src/app/retos/%5BchallengeId%5D/page.tsx)) aunque `/empresa/proponer` está implementada y la Home ya la enlaza. Contradice «lo no implementado se marca Próximamente» ([AGENTS §6](../AGENTS.md)) por el lado opuesto: marca como pendiente algo disponible. El README (§Verificación visual) también sigue diciendo que V01 lo muestra.

**H11 · Salir termina en lugares distintos — Media.** [N] J6: desde Mi C3, Cuenta, Trayectoria, Entrega y Explorar → `/`. Desde Empresa → se queda en `/empresa` mostrando «Entrá para ver tu espacio»; desde Admin → se queda en `/admin` con «Entrá con una cuenta de administrador». Posible relación con la falla de E2E de Cuenta, no probada (ver §9, D-4).

**H12 · Orientación y accesibilidad básica — Media.** [N] Las 11 rutas medidas tienen el mismo `<title>`: «C3 Platform» (pestañas, historial y lectores de pantalla no distinguen dónde se está). Faltan `<main>` en Home y Entrega [N] (y, por código, en todo el marco D: Inscripción y Evaluar [C]); no hay *skip link*; el 404 no tiene cabecera ni camino a Mi C3 para quien ya inició sesión. No sustituye la auditoría axe/lector de pantalla pendiente.

**H13 · Nombres inconsistentes — Media.** [N] [C]
- Cuenta se rotula «MI ESPACIO»; Mi C3 dice «tu espacio»; la empresa tiene «Espacio de empresa».
- «Empresas» (menú) abre el formulario público; «Conecta» (menú) es la línea para empresas; el botón dice «Proponer un challenge» mientras todo lo demás dice «reto».
- **Copy que promete algo inexistente:** Mi C3 describe Trayectoria como «Tu perfil público…» (`src/app/mi-c3/MiC3Lateral.tsx` en `origin/main`); el perfil público compartible está pendiente de decisión ([PENDIENTES-REALES](PENDIENTES-REALES.md)).
- El formulario de registro pide aceptar «términos y política de privacidad» sin enlaces; el pie de página existe solo en Home y las tres líneas (12 de 112 páginas medidas). Los textos legales son un pendiente conocido: aquí solo se señala su efecto en la navegación.

### 4.4 Repositorio, documentación y verificación (afectan cómo se ejecutará esto)

| ID | Hallazgo | Evidencia |
| --- | --- | --- |
| D-1 | **La rama de trabajo (`chore/entorno-agentes`) tiene la documentación nueva pero el código antiguo.** No contiene `/cuenta`, `PanelHeader`, los paneles responsive ni el ciclo de vida de experiencias; todo eso está en `origin/main` (`422094f`, PR #7). `main` local (`29426e7`) está atrasado y `dev` es anterior a casi todo. Los documentos describen `origin/main`. **Esta auditoría se hizo sobre `origin/main`.** Implementar sobre la rama actual partiría de otra base. | [C] `git diff --stat origin/main HEAD` (61 archivos) |
| D-2 | Deriva documental menor: README dice que V01 muestra «Próximamente» (ya no); PRODUCTO-Y-NAVEGACION §2 dice «código del ZIP»; comentarios obsoletos en `AdminPanel`. | [C] |
| D-3 | **`next build` (Next 16.4.0) se detuvo con un aviso de seguridad** («versión afectada por una vulnerabilidad conocida», sugiere `next upgrade`); un segundo intento compiló. **No se actualizó nada.** Es un asunto separado de la UX que requiere decisión y revisión de compatibilidad. | [N] build en la copia de auditoría |
| D-4 | **Falla E2E de Cuenta no reproducida.** 21 ejecuciones relevantes (3 repeticiones × escritorio y móvil) pasaron; 3 se omiten por diseño. Hipótesis [H]: el test pulsa «Salir» e inmediatamente hace `page.goto("/acceso")` (`e2e/cuenta.spec.ts` en `origin/main`), mientras `SiteHeader.handleSignOut` navega a `/` tras `await signOut()`; en un CI más lento el segundo `goto` podría quedar pisado. No es una causa probada. | [N] [C] |
| D-5 | Cobertura E2E de navegación: no hay prueba de destino tras acceso desde el «Entrar» de cabecera, del enlace del jurado, de «Salir» por marco ni de accesos entre roles. Todas las pruebas inician con `loginAt(..., next)`. | [C] |

---

## 5. Contraste con la visión y los diseños

El paquete `diseno-claude/` dibuja **12 vistas, no una navegación**: no define cabecera global, ni el rol de jurado fuera de V05/V11, ni Cuenta, ni experiencias sin reto ([README §6–7](../diseno-claude/README.md)). Lo implementado cubre esos huecos pantalla por pantalla, y ahí aparecen los marcos A–F.

| Tema | Diseño | Implementación | Recomendación |
| --- | --- | --- | --- |
| Joven en móvil (V05–V08) | Marco 390 px, «diseñar primero en móvil» | Conservado; Mi C3 y Trayectoria además son panel responsive | **Mantener** móvil; añadir columna de escritorio a Entrega/Inscripción |
| Empresa en escritorio (V09–V11) | Escritorio; V09 enlaza a V05, V10 y V11 | V09 y V10 sí; **V09→V05 y V09→V11 sin implementar**; V11 renderizado como marco móvil | **Completar los enlaces**; V11 con diseño de escritorio |
| Jurado externo | «Evalúa desde Mi C3» (decisión 3) | Implementado así | **Mantener**; es la ruta canónica |
| Admin (V12) | Solo se dibujó «Resultados oficiales» | 7 secciones en un panel con estado interno | Dar URL y atajos; no copiar el diseño: no existe |
| Explorar sin filtros (decisión 2) | Hasta ~10 experiencias | 5 experiencias en la prueba | **Mantener**; revisar al superar ~10 |
| Rótulo «Datos de demostración» | En V01–V03, V11, V12 | Retirado (README) | Sin cambio |
| Logotipo | Marcador «C3» en texto | Logotipo real en A–E; **Admin sigue con «C3» en texto** | Alinear Admin |

Lo que **no se debe copiar del diseño** [P]: el marco de teléfono centrado en escritorio para tareas de empresa/jurado, y la ausencia de navegación entre roles.

---

## 6. Propuesta de arquitectura de navegación [P]

### 6.1 Principios

1. **Capacidades, no tipos de usuario.** Un solo inicio de sesión; los accesos aparecen según lo que la cuenta *puede hacer* (participar y evaluar —ambos en Mi C3—, representar una organización, administrar).
2. **Tres zonas, una cabecera cada una:** *Sitio* (descubrir y convertir), *App* (trabajo autenticado) y *Consola* (operación de C3). Cambiar de zona es una decisión visible, no un accidente.
3. **Mi C3 es el *hub*** de lo autenticado: lo que toca ahora, venga de donde venga (entregas, evaluaciones, solicitudes de empresa, pendientes de Admin) y las puertas a los demás espacios.
4. **Cada tarea tiene una sola URL canónica** y las demás redirigen.
5. **Mantener las URL actuales.** Solo se añaden rutas por sección en Admin; lo demás son redirecciones ([PRODUCTO-Y-NAVEGACION §5](PRODUCTO-Y-NAVEGACION.md)).
6. **El marco de teléfono es solo móvil.** En escritorio el contenido usa el ancho útil dentro de la misma cabecera de la app.

### 6.2 Menús por zona y capacidad

| Zona | Escritorio | Móvil (390 px) |
| --- | --- | --- |
| **Sitio** (visitante) | Logo · Explorar · Compite · Crea · Conecta · **Para empresas** · `Entrar` `Crear cuenta` | Barra de ~56 px: logo + Explorar + ☰ (líneas, Para empresas, Entrar/Crear cuenta). Sin «Inicio»: el logo es el inicio |
| **Sitio** (con sesión) | Igual, pero a la derecha **un menú de avatar** en lugar de cuatro textos sueltos | Igual |
| **App** (con sesión) | Logo · **Mi C3** · Explorar · Trayectoria · *Mi empresa*\* · *Admin*\*\* · avatar ▾ | Barra superior mínima + **tab bar de 4**: Mi C3 · Explorar · Trayectoria · **Cuenta**. Los espacios con capacidad (empresa, administración) aparecen como tarjetas en Mi C3 |
| **Consola** (admin) | Logo de marca · Admin › sección · [Ver sitio] [Mi C3] · avatar ▾; menú lateral con contadores de pendientes | Menú lateral colapsable (D5) |

Menú de avatar (todas las zonas): **Mi C3 · Trayectoria · Cuenta** · *Espacio de empresa*\* · *Administración*\*\* · **Salir**.
\* si la cuenta está vinculada a una organización · \*\* si tiene el claim `c3Admin`.

**La evaluación no tiene ítem de menú propio:** ya vive en Mi C3 («Como jurado», y «Te toca ahora» cuando hay algo por evaluar), que es donde el diseño la ubicó (decisión 3). Un ítem «Evaluaciones» exigiría una página de lista que hoy no existe y no aporta frente al hub.

Cambios de nombre: tab «Inicio» → «Mi C3»; «Empresas» → «Para empresas»; «Proponer un challenge» → «Proponer un reto» (o mantener *challenge* en todo el producto: decisión de marca, D8).

### 6.3 Mapa de información (URL)

```
SITIO (público)
/                         Home — dos puertas
├─ /explorar              Catálogo
│  ├─ /retos/[id]         Detalle → /retos/[id]/inscripcion        (se mantiene)
│  └─ /experiencias/[id]  Detalle → /experiencias/[id]/inscripcion (se mantiene)
├─ /compite /crea /conecta   Líneas (catálogo filtrado + identidad)
├─ /empresa/proponer      Para empresas (sin cuenta)
└─ /acceso                Entrar / Crear cuenta   (?next= siempre)

APP (autenticada, una cabecera)
/mi-c3                    HUB: «Te toca ahora» (todas las capacidades) + «Tus espacios»
├─ /mi-c3/retos/[id]      Mi reto y entrega
├─ /mi-c3/evaluar/[id]    Evaluar  ← ruta canónica (jurado externo o representante)
/trayectoria              Registro oficial (lo que C3 registró)
/cuenta                   Cuenta (se mueve al marco de la app)
/empresa                  Espacio de empresa (se mueve al marco de la app; añade «Evaluar»)
   └─ /empresa/retos/[id]/evaluacion  → redirige a /mi-c3/evaluar/[id]   (deja de ser destino)

CONSOLA
/admin → /admin/resumen   Resumen con pendientes enlazados
         /admin/propuestas · /admin/experiencias · /admin/inscripciones[?reto=]
         /admin/entregas · /admin/jurados · /admin/resultados
```

### 6.4 Reglas transversales

| Regla | Hoy | Propuesta |
| --- | --- | --- |
| Destino tras acceso | `next` si existe; si no, `/` | `next` si existe; si no, `/mi-c3`. El «Entrar» de cabecera añade `next=<ruta actual>` |
| «Salir» | 6 variantes; Empresa y Admin no navegan | Un solo comportamiento: cerrar sesión y volver a `/` |
| «Volver» | `← Mi C3` fijo en marco D; nada en los demás | Volver contextual (al reto/experiencia de origen) y **migas** en rutas a más de un nivel |
| Pantalla sin permiso | Mensaje inline, a veces sin salida | Mensaje + una acción («Ir a Mi C3» / «Entrar») y el mismo marco |
| Título de pestaña | «C3 Platform» siempre | «Mi reto · Ruteo de reparto · C3 Platform» |
| 404 | Sin cabecera | Con cabecera de la zona y, con sesión, enlace a Mi C3 |

### 6.5 Recorridos objetivo (clics desde que se tiene la intención)

| Recorrido | Hoy [N] | Objetivo [P] |
| --- | --- | --- |
| Visitante → inscrita en un reto | 4 clics + formulario (funciona) | Igual |
| Participante: volver y entregar | login → cae en Home → Mi C3 → «Abrir mi reto» (2 clics tras login) | login → Mi C3 → «Abrir mi reto» (1) |
| **Jurado con enlace de invitación** | **404** | login → evaluación (0 clics tras login) |
| Jurado sin enlace | login → Home → Mi C3 → «Evaluar» (2) | login → Mi C3 → «Evaluar» (1) |
| **Representante: ver soluciones** | **Imposible sin URL** | login → Mi C3 → tarjeta «Tu organización» (1) |
| Representante: evaluar | Mi C3 → «Evaluar» (sin pista desde Empresa) | Empresa → «Evaluar» en el reto (1) |
| **Admin: atender propuestas** | login → Home → «Admin» → «Propuestas» (3) | login → Admin Resumen → «3 por revisar» (1) |

### 6.6 Wireframes (bajo nivel; no sustituyen un diseño visual)

```
SITIO móvil (≈56 px)               APP escritorio
┌──────────────────────────┐       ┌────────────────────────────────────────────────────┐
│ [C3]        Explorar  ☰  │       │ [C3]  Mi C3  Explorar  Trayectoria  Mi empresa*   [AP Ana ▾] │
└──────────────────────────┘       └────────────────────────────────────────────────────┘
                                          avatar ▾ → Mi C3 · Trayectoria · Cuenta
APP móvil                                       Espacio de empresa* · Administración*
┌──────────────────────────┐                    ──────────── · Salir
│ [C3]                  AP │
│  (contenido)             │       CONSOLA
│                          │       ┌────────────────────────────────────────────────────┐
├──────┬────────┬──────────┤       │ [C3] Admin › Propuestas     [Ver sitio] [Mi C3] [AP ▾] │
│Mi C3 │Explorar│Trayect.│Cuenta   ├──────────────┬─────────────────────────────────────┤
└──────┴────────┴──────────┘       │ Resumen   ●3 │  /admin/propuestas                  │
                                   │ Propuestas ●2│                                      │
Mi C3 (hub), orden de bloques      │ Experiencias │                                      │
 1 Te toca ahora (todo, incl.      │ Inscripc. ●3 │                                      │
   evaluaciones pendientes)        └──────────────┴─────────────────────────────────────┘
 2 Tus espacios: Empresa*, Administración*
 3 En espera · Entregado · Como jurado · Cerradas
```

### 6.7 Alternativas consideradas y descartadas

| Alternativa | Por qué no |
| --- | --- |
| Portales por rol (`/jurado`, `/participante`, `/empresa`) con su propio menú | Multiplica marcos (justo H4) y contradice «usás esta misma cuenta»; una persona con dos sombreros tendría que cambiar de portal |
| Un menú global único para todos | Sobrecarga al visitante con accesos que no puede usar |
| Integrar Admin en el marco de la app | Admin necesita menú lateral denso; conviene mantenerlo como consola, pero conectada |
| Sustituir la tab bar móvil por hamburguesa en la app | Peor descubribilidad para el público joven; la tab bar ya funciona |
| Renombrar rutas (`/mi-c3` → `/panel`) | Rompe enlaces guardados sin beneficio ([PRODUCTO §5](PRODUCTO-Y-NAVEGACION.md)) |
| Acceder a la evaluación con `/evaluar/[id]` como canónica | Viable (ver D3); se prefiere `/mi-c3/evaluar/[id]` porque ya existe, está probada y es la que enlaza Mi C3 |

---

## 7. Roadmap priorizado [P]

Esfuerzo: **S** ≈ horas–1 día · **M** ≈ 2–5 días · **L** ≈ 1–2 semanas. Cada fase puede entregarse y verificarse sola. Antes de implementar, resolver D-1 (rama base) y seguir [FLUJO-AGENTES](FLUJO-AGENTES.md): rama desde `dev`, PR, `npm run check` y, donde toque, `test:rules`/`test:e2e`.

### Fase 0 — Correcciones sin decisión de producto (S)

| # | Qué | Cierra | Criterio de aceptación / prueba |
| --- | --- | --- | --- |
| 0.1 | `next` del jurado → `/mi-c3/evaluar/[id]` (ambas rutas) | H1 | E2E nuevo: URL de evaluación sin sesión → «Entrar» → aterriza en la evaluación; escritorio y móvil |
| 0.2 | Reemplazar «Próximamente» del detalle de reto por enlace a `/empresa/proponer`; actualizar README | H10, D-2 | Sin botones «Próximamente» para funciones existentes |
| 0.3 | «Salir» siempre vuelve a `/` (Admin y Empresa) | H11 | E2E: salir desde cada marco → `/` |
| 0.4 | «Entrar/Crear cuenta» de la cabecera con `next=<ruta actual>` | H3 (parte) | E2E: desde `/retos/[id]` entrar vuelve al reto |
| 0.5 | `<title>` por ruta; `<main>` en Home, Entrega, Evaluar; skip link | H12 | axe sin críticas; títulos únicos |
| 0.6 | Copy: «Tu perfil público…» → «Tu registro en C3…» | H13 | Texto coherente con README |
| 0.7 | Alinear rama base y documentación (D-1) y retirar residuos `pending`/`PendingSection` | D-1, D-2, H6 | Una rama con código y docs coherentes |

### Fase 1 — Arquitectura de navegación (M–L) · requiere D1–D3, D7–D8

| # | Qué | Cierra | Criterio de aceptación / prueba |
| --- | --- | --- | --- |
| 1.1 | Exponer **capacidades** de la sesión (organizaciones vinculadas; admin ya está en el claim) a la UI. Las evaluaciones asignadas ya las carga Mi C3 | H5 | Prueba negativa de autorización: solo devuelve datos propios; `test:rules` |
| 1.2 | **Marco único de la app** (cabecera de escritorio + avatar menu + tab bar de 4) aplicado a Mi C3, Trayectoria, **Cuenta**, Entrega, Inscripción, Evaluar y **Empresa** | H4, H7 (parte), H13 | Misma cabecera en 7 rutas; sin desbordes a 390/1280 px; «Inicio» → «Mi C3» |
| 1.3 | Destino por defecto `/mi-c3` + tarjetas «Tus espacios» (Empresa, Administración) | H2, H3 | Representante llega a su espacio en 1 clic sin URL; E2E por capacidad |
| 1.4 | Empresa: acción «Evaluar» por reto asignado; `/empresa/retos/[id]/evaluacion` redirige a la ruta canónica | H2, H9 | Una URL por tarea; redirección probada con y sin permiso |
| 1.5 | Cabecera pública con menú colapsable en móvil, «Para empresas» y avatar menu con sesión | H8, H4 | Cabecera ≤ 64 px en 390 px; sin «Inicio» duplicado |
| 1.6 | Migas y «volver» contextual; 404 con cabecera | H12 | Cada ruta a ≥2 niveles tiene salida clara |

### Fase 2 — Admin y escritorio (M–L) · requiere D4–D6

| # | Qué | Cierra | Criterio de aceptación / prueba |
| --- | --- | --- | --- |
| 2.1 | Admin con URL por sección, entrada por **Resumen** con pendientes enlazados y contadores en el menú | H6 | Recargar y «atrás» conservan la sección; E2E existente adaptado |
| 2.2 | Cabecera Admin con logotipo, «Ver sitio», «Mi C3»; menú colapsable en móvil (según D5) | H6 | Sin dependencia de conocer `/` |
| 2.3 | Evaluar en escritorio: solución y rúbrica lado a lado (V11); Entrega e Inscripción en columna ancha sin marco de teléfono | H7 | Validado a 1280 y 390 px; sin regresión de lógica |
| 2.4 | Puente «Propuesta aceptada → crear reto» *(sujeto a decisión funcional)* | H6 | Flujo Propuestas → Experiencias y retos en ≤2 clics [H: confirmar necesidad con quien opera] |

### Fase 3 — Medición y pulido

| # | Qué | Criterio |
| --- | --- | --- |
| 3.1 | Matriz E2E de navegación **rol × tamaño**: llegar a cada destino sin URL, retornos `next`, «Salir», sin permiso | Cubre D-5; se ejecuta en CI |
| 3.2 | Prueba de usabilidad con 4–5 personas por rol (participante, jurado, representante, admin) con tareas de §6.5 | Medir pasos y errores ([PLAN-CONSTRUCCION «Métricas»](PLAN-CONSTRUCCION.md)); sin cifras inventadas |
| 3.3 | Filtros de Explorar al superar ~10 experiencias; auditoría de accesibilidad con herramienta y lector de pantalla | — |
| 3.4 | Asunto aparte: actualización de Next.js por el aviso de seguridad (D-3) | Decisión y plan de compatibilidad propios |

---

## 8. Decisiones requeridas

| ID | Decisión | Recomendación | Por qué |
| --- | --- | --- | --- |
| D1 | ¿Dónde aterrizar tras entrar sin `next`? | `/mi-c3` para todos, con tarjetas a los demás espacios | Un solo destino predecible; evita lógica por rol que se rompe con varios sombreros |
| D2 | ¿Cómo sabe la UI qué capacidades tiene la cuenta? | Ampliar el endpoint de sesión (`/api/me`) con datos propios resumidos | Una sola consulta; exige prueba negativa de autorización (AGENTS §7) |
| D3 | Ruta canónica de evaluación | `/mi-c3/evaluar/[id]`; las demás redirigen | Ya existe, está enlazada desde Mi C3 y la prueba de jurado la usa |
| D4 | URL por sección de Admin | Segmentos `/admin/[sección]` (mínimo viable: `?s=` + historial) | Recarga, «atrás» y enlaces directos |
| D5 | ¿Admin en móvil? | Usable (menú colapsable) pero optimizado para escritorio | Nadie pidió Admin móvil; evita invertir de más |
| D6 | Entrega, inscripción y evaluación en escritorio | Columna de ~720 px (entrega, inscripción) y dos columnas (evaluación) dentro del marco de la app; móvil sin cambios | Respeta el diseño móvil aprobado y AGENTS §4 |
| D7 | Compite · Crea · Conecta en el menú | Mantener en escritorio; agrupar en el menú móvil | Son identidad de marca ([AGENTS §1](../AGENTS.md)) |
| D8 | «Reto» vs «challenge» y «Para empresas» | Un solo término en la interfaz; «Para empresas» como etiqueta del menú | Coherencia de vocabulario |
| D9 | Perfil público | Corregir copy ahora; decidir el perfil público como pendiente aparte | Evita prometer lo no implementado |
| D10 | ¿Sobre qué rama implementar? | Reconciliar `dev`/`main`/documentación antes de la Fase 0 | D-1 |

---

## 9. Método, alcance y límites

**Base auditada:** `origin/main` @ `422094f` (21-10-2026), extraído con `git archive` a una carpeta temporal fuera del repositorio; el checkout y sus ramas no se modificaron. Las referencias a archivos de `src/` y `e2e/` valen para esa base; las que solo existen allí se citan como código, no como enlace, porque no están en la rama actual (D-1). Emuladores Firebase `demo-c3-platform` (Auth y Firestore) y build de producción en el puerto 3100. Navegador: Microsoft Edge 155 con Playwright, a **1280×900 y 390×844**.

**Datos de prueba** (sembrados con la API real de la app): 7 cuentas —participante nueva, participante líder de equipo con inscripciones y entrega en borrador, integrante de ese equipo, jurado externo, representante vinculada, representante sin vínculo y admin— más una visitante que se registra durante el recorrido; 5 experiencias (una en borrador, un taller sin retos), 3 retos, 3 propuestas en estados distintos. Un único acceso directo a Firestore del emulador: adelantar el cierre de entregas de un reto para poder evaluar.

**Ejecutado:** 116 cargas de página (visitante sin sesión + 6 cuentas, a 2 tamaños) con capturas y extracción de cabeceras, enlaces y desbordes · 10 recorridos interactivos (registro desde un reto, «Entrar» desde cabecera, enlace de jurado, descubrimiento del Espacio de empresa, Admin con recarga y «atrás», «Salir» desde 7 marcos, títulos y *landmarks*, entrega, evaluación, altura de cabecera móvil) · `e2e/cuenta.spec.ts` ×3.

**No ejecutado:** `npm run check`, `test:rules`, la suite E2E completa, axe-core, lector de pantalla, dispositivos reales, Firefox/Safari, pruebas con personas, el flujo completo de equipos (más allá de lo sembrado), resultados publicados ni el ciclo de vida de experiencias. Los datos son de emulador; no hay conclusiones sobre datos reales. Las observaciones son de una sola sesión: distinguir **observación [N]**, **código [C]** y **hipótesis [H]** antes de tomar decisiones.

**Verificación de las hipótesis de [PRODUCTO-Y-NAVEGACION §3](PRODUCTO-Y-NAVEGACION.md):**

| Hipótesis | Resultado |
| --- | --- |
| 1 · Dos significados de «Inicio» | **Confirmada** y ampliada: el mismo destino se llama «Inicio» en móvil y «Mi C3» en escritorio (H4) |
| 2 · «Empresas» lleva al formulario | **Confirmada y agravada:** no existe ningún enlace al espacio privado (H2) |
| 3 · Menús distintos según marco | **Confirmada:** seis marcos; los de Empresa y Admin son los más aislados (H4, H6) |
| 4 · Varias rutas por tarea | **Confirmada** para evaluación (tres URL, una rota). La doble entrada de inscripción (reto/experiencia) es correcta: son excluyentes por diseño |
| 5 · Diseño de escritorio de vistas móviles | **Confirmada** para Entrega, Inscripción y Evaluar; Mi C3 y Trayectoria están bien (H7) |
| 6 · Navegación de retorno | **Parcial:** `next` funciona en CTA de inscripción y pantallas «Entrá para…» (salvo H1); falla en el «Entrar» de cabecera y en «Salir» (H3, H11) |
| Hallazgo de §2 (`/evaluar` vs `/mi-c3/evaluar`) | **Confirmado en navegador** (H1) |

**Capturas** de apoyo en [auditoria-navegacion-2026-10/](auditoria-navegacion-2026-10/): `mov-01` cabecera pública móvil · `mov-02` Cuenta móvil con cabecera pública · `mov-03` Mi C3 móvil (referencia positiva) · `mov-04` Admin móvil · `esc-01` panel Mi C3 (positiva) · `esc-02` Cuenta con otra cabecera · `esc-03` Entrega en marco de teléfono · `esc-04` Evaluar en marco de teléfono · `esc-05` Espacio de empresa sin navegación · `esc-06` Admin · `esc-07` Resumen de Admin · `esc-08` 404 del jurado tras entrar. Son datos del emulador, sin información real.

**Reproducibilidad:** los scripts de siembra, recorrido y capturas se escribieron fuera del repositorio (no se añadieron a `scripts/` para no alterar `lint` ni CI). Si se aprueba la Fase 3.1, conviene convertirlos en pruebas E2E del repositorio.
