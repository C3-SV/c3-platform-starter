# UPDATE.md — C3 Challenges · Versión demo integral

> **Documento maestro de actualización del repositorio**  
> **Fecha de decisión:** 3 de noviembre de 2026  
> **Objetivo inmediato:** demo convincente, navegable y verificable para el ensayo del **4 de noviembre de 2026**.  
> **Prioridad funcional:** **flujo de empresa > flujo de joven > refinamiento visual**.  
> **Estado:** especificación y plan de ejecución. **Este archivo no afirma que los cambios ya estén implementados.**

---

## INSTRUCCIÓN PRINCIPAL PARA EL AGENTE

Trabajá **sobre el repositorio existente**, sin rediseñarlo desde cero ni reemplazar arbitrariamente su stack, arquitectura o identidad. Antes de editar, inspeccioná el proyecto, sus rutas reales, estructura, componentes, modelos de datos, Firebase, reglas de seguridad, documentación, tests y despliegue. Implementá **en incrementos funcionales completos**, no como una colección de pantallas falsas.

El objetivo no es una plataforma genérica de hackathons. Es **C3 Challenges**, una **línea de negocio propuesta** dentro del ecosistema C3, en la que empresas pagan por experiencias técnicas diseñadas y operadas por C3 para **observar capacidades de talento joven mediante evidencia de desempeño**. Las propuestas y soluciones creadas por participantes pueden generar valor adicional, pero **la promesa primaria es identificar talento con criterio y capacidad demostrable**, no externalizar desarrollo barato ni garantizar contratación.

**La demo no equivale a producto comercial lanzado.** Todo ejemplo inventado —empresa, usuarios, challenge, entregas, puntuaciones, contacto— debe estar inequívocamente identificado como **DEMO / ficticio**, al menos en las áreas relevantes. No mostrar datos sintéticos como validación de mercado, clientes reales, contratos, contrataciones ni ventas. Mantener el estado funcional explícito cuando algo sea una simulación.

### Definición de éxito mañana

1. Un expositor puede iniciar sesión **como empresa** y recorrer sin obstáculos: **necesidad → propuesta → reto administrado → entregas → evidencia → comparación → lista corta → solicitud de contacto**.
2. Un expositor puede iniciar sesión **como joven** y recorrer: **exploración → inscripción → panel del reto → entregas → proceso → defensa → evaluación / seguimiento**.
3. Hay **datos de demostración verosímiles y consistentes**, almacenados en un entorno Firebase dedicado a demo, sin tocar producción.
4. Existen cuentas **reales de Firebase Authentication**, asociadas a roles y organizaciones, que funcionan en el sitio desplegado. **Ninguna contraseña ni clave de servicio queda escrita en el repositorio**.
5. El sitio y las narrativas están alineados con el **pitch final**: Compite · Crea · Conecta; talento primero, soluciones después; tres paquetes y precios; sin afirmaciones falsas de tracción.
6. Antes de declarar completado un flujo, se ejecutaron **tests automáticos**, se verificó el control de acceso y se recorrió de punta a punta en una sesión de navegador real.

### Fuentes / verdad de producto, en orden

1. **Decisiones explícitas del equipo de este documento**.
2. **Pitch v7 final** y correcciones recientes del guion (gancho, argumento financiero y cierre); referencia: `https://docs.google.com/presentation/d/1WpcaND7MFBjc49GDv4iqhJKA8WiyGUZt/edit`.
3. **Modelo financiero v6 final:** `https://docs.google.com/spreadsheets/d/1IK1FmiXPRGDv5gS5wT9Uhp3sXrjy_3hR/edit`.
4. **Manual de marca C3** del proyecto y activos existentes en el repo.
5. **Lo que el repositorio y la demo desplegada realmente implementan**: `https://demo.plat.c3.com.sv/`.
6. Otros documentos sirven como referencia histórica; **no resucitar nomenclaturas, precios o estrategias reemplazadas**.

> **Dominio correcto:** `https://demo.plat.c3.com.sv/`. `demo.plata.c3.com.sv` fue un typo y no es la URL de la demo. Revisar enlaces en documentos, README, variables y textos de apoyo.

---

# 0. CONTRATO DE PRODUCTO, NARRATIVA Y EXPERIENCIA

## 0.1. Qué estamos vendiendo

- **Comprador:** líder técnico, CTO, gerente de ingeniería, producto o datos; eventualmente participan RR. HH., dirección o finanzas en aprobación.
- **Necesidad:** conocer personas con criterio, iniciativa, autonomía y capacidad de construir y defender una solución; obtener señal de desempeño antes de decidir próximos contactos.
- **Vehículo:** un problema propio y publicable de la empresa → brief → challenge → convocatoria C3 → entregas → proceso observable → defensa → reporte → contactos consentidos.
- **Participantes:** jóvenes técnicos que descubren, se inscriben, construyen, documentan, defienden y reciben evidencia de su desempeño. **Participar es gratis**.
- **Ingreso:** empresas pagan **por challenge**, según profundidad de acompañamiento; el premio, si aplica, se acuerda y financia aparte.
- **Repetición empresarial:** 40% como **hipótesis de modelado, no tasa observada**.
- **No prometemos:** contratación, implementación de una solución, ahorro garantizado, IP automática de las propuestas, datos confidenciales publicados ni evaluación que una IA haga por sí sola.

## 0.2. Cambio central del relato

**Narrativa vieja a retirar:** «Convertimos un problema en soluciones baratas creadas por jóvenes», «la empresa obtiene muchas soluciones», «subí tu código y ganá», «plataforma de eventos que reúne de todo».

**Nueva narrativa:** «Una empresa necesita reconocer capacidades; C3 convierte un problema apto en una experiencia para observar cómo trabaja el talento. El joven entrega trabajo y evidencia de criterio; la empresa compara perfiles, identifica a quienes destacan y decide con quién conectar».

**Frase organizadora, compatible con el pitch:**

> «Hoy es más fácil crear código que reconocer quién realmente sabe resolver problemas».

Las herramientas de IA hacen que el resultado final, por sí solo, diga menos sobre la persona. Por eso ofrecemos tres capas de evidencia: **entregable, proceso y defensa**. No demonizar la IA: se puede usar, pero el participante debe explicar qué decisiones tomó, cómo comprobó calidad y qué entiende de lo que construyó.

**Tono / voz:** institucional, contemporáneo, claro, profesional y humano, en español de El Salvador. En interfaces dirigidas a jóvenes y empresas usar **voseo coherente** (`explorá`, `inscribite`, `contanos`, `revisá`, `contactá`). Evitar tecnicismos de marketing, promesas grandiosas, «disrupción», «revolucionamos», «élite», frases excesivamente juveniles o urgencia artificial. Usar términos técnicos cuando aportan precisión, y explicar «challenge» cuando el público es nuevo.

**Reglas de microcopy:**

- Un título expresa una **acción o resultado**, no solo una categoría.
- Cada pantalla responde: **dónde estoy, qué sigue, qué recibe la otra parte y qué ocurre después de actuar**.
- Nombrar el estado de cada proceso: `Borrador`, `En revisión`, `Publicado`, `Inscripciones abiertas`, `En ejecución`, `Entregas cerradas`, `En evaluación`, `Resultados publicados`, `Cerrado`.
- Distinguir `Inscripción recibida` de `Inscripción aprobada`, `Entrega recibida` de `Entrega evaluada`, `Seleccionado para contacto` de `Contratado`.
- Los datos o tiempos no verificados se presentan como propuestas, no como hechos.
- No usar «evidencia oficial C3» sin explicar qué acredita: **registro de participación/entrega y evaluación del reto**, no certificación profesional universal.

## 0.3. Taxonomía C3 y ubicación de los challenges

**Compite:** competencias y entrenamiento de programación/algoritmos; ejemplo: Copa Salvadoreña de Programación.

**Crea:** construir prototipos, proyectos y soluciones; ejemplo: Hackathon de Turismo Creativo.

**Conecta:** vínculo entre talento, empresas e instituciones, especialmente **challenges empresariales que permiten observar y comparar talento**.

**Decisión:** un **challenge empresarial pertenece principalmente a `Conecta`**. También tiene una dimensión de `Crea`, pero **NO debe aparecer como `Crea · Challenge` si eso oculta su objetivo empresarial**. Etiqueta principal: `Conecta · Challenge empresarial` y, opcionalmente, etiqueta secundaria `También construís / Crea` si el modelo de categorías permite más de una. Evitar duplicar registros en el catálogo: un mismo challenge puede aparecer en diferentes filtros, conservando un solo ID.

Ajustar especialmente el ejemplo actual **«Rutas sostenibles para una empresa ficticia»**, visible en la portada, `/explorar`, `/crea`, `/conecta` y su ficha: hoy se etiqueta como `Crea · Challenge`; debe llevar clasificación empresarial consistente. En filtros distinguir tipo (`Competencia`, `Hackathon`, `Challenge empresarial`) de línea (`Compite`, `Crea`, `Conecta`) y estado (`Abierto`, `Concluido`, `Demo`).

## 0.4. Tres paquetes: fuente única para comercial, UI y demo

| Paquete | Tarifa empresarial de referencia | Profundidad | Valor observable para la empresa |
|---|---:|---|---|
| **Esencial** | **US$800** | Reto corto, definición acotada, convocatoria C3, entregas y evaluación básica | Observar talento y acceder a entregas ordenadas |
| **Completo** | **US$1,500** | Más seguimiento, rúbrica ajustada, reporte por persona, lista corta | Comparar perfiles con más información para decidir próximos pasos |
| **Destacado** | **US$3,000** | Convocatoria selectiva y abierta, coevaluación más profunda, defensa técnica, comparación de perfiles y seguimiento de contactos | Evaluación integral y vinculación acompañada |

**Condiciones transversales:**

- La empresa puede revisar las entregas que correspondan a su reto en **todos** los niveles; no ocultar resultados a Esencial.
- Contactar talento con consentimiento es parte de la promesa general, **no exclusivo de un paquete**; aumenta la facilitación y seguimiento según nivel.
- No garantizar un volumen de soluciones, cantidad fija de contrataciones, entrega que la empresa pueda explotar comercialmente ni horas de mentoría no medidas.
- **Premios y licencias/IP no están automáticamente incluidos** en la tarifa: se definen expresamente por reto. Participante conserva derechos en la medida acordada; licencias deben pactarse, no inferirse.
- La duración y límites de entregables vienen de la ficha comercial aprobada. Como referencia preliminar, la escalera histórica contemplaba hasta 2 semanas / 3–4 semanas / 4–6 semanas, **pero el agente debe verificar que sigan vigentes antes de fijarlos como contrato**.
- En la interfaz pública no es obligatorio activar un checkout ni presentar precios como suscripción; **el modelo es B2B por proyecto**. Si se agregan paquetes a una vista comercial, explicar qué recibe la empresa, no solo mostrar precios.

## 0.5. Coherencia financiera contextual (no convertir la demo en software contable)

Para narrativas, datos institucionales opcionales y dashboard simulado de negocio, usar exclusivamente:

- Primer período (piloto dic. 2026 + 2027): **17 retos proyectados**; separar que **2027 calendario son 16**.
- 2028: **32 retos proyectados**, **US$52,800** en ventas de retos, **aprox. US$10,900** de resultado operativo y **24 retos** como punto de equilibrio operativo.
- **US$15,000** como financiamiento objetivo para acelerar; SAFE **opcional** y posible operación gradual con preventas y recursos propios.
- Bolsa de colaboradores prevista **10% desde agosto 2027**, según supuestos financieros; **no presentar esto como una deducción de la tarifa de cada participante**.
- Todos son **supuestos / proyecciones**, no ventas reales, órdenes aprobadas ni clientes contratados.

No mezclar finanzas del curso con métricas falsas del dashboard de empresa. En la demo de empresa deben aparecer **métricas operativas del challenge ficticio**, con sello `Datos demostrativos`.

## 0.6. Identidad visual vigente

**Fuente:** Manual de marca C3. Mantener activos de logo existentes, sin recrearlos a ojo ni deformarlos.

| Uso | Token | Hex |
|---|---|---|
| Navy principal | `--c3-navy` | `#0F203E` |
| Azul institucional | `--c3-blue` | `#205298` |
| Violeta institucional | `--c3-violet` | `#4F5BA9` |
| Teal institucional | `--c3-teal` | `#33BEAC` |
| Fondo claro actual del sitio (token de interfaz, no color corporativo oficial) | `--surface-soft` | `#F2F6FB` |

Paleta secundaria del manual para impresión/variantes: `#202A3F`, `#2C519B`, `#6D529E`, `#46B8A8`. **No alternar paletas arbitrariamente**; preservar el sistema actual del repo y documentar tokens. **Montserrat** para titulares y **Poppins** para texto. El naranja mencionado en materiales antiguos NO es uno de los cuatro colores principales listados en la paleta oficial del manual; no añadirlo como acento dominante por inercia.

Diseño visual recomendado: fondos blancos/claros, navy para lectura, azul para acción, violeta/teal como acentos semánticos puntuales, espacios respirables, formularios legibles y dashboards sobrios. Priorizar accesibilidad, contraste, jerarquía, navegación por teclado, estados y lectura en proyector. Sin neumorfismo, gradientes gratuitos, estadísticas inventadas, card-soup ni animaciones que retrasen la demo.

---

# A. ESTADO ACTUAL OBSERVADO (FIRECRAWL, 3 NOV. 2026)

Se hizo un crawl público de **30 rutas** de `https://demo.plat.c3.com.sv/` y revisión focalizada de portada, `/explorar`, `/empresa/proponer`, ficha de reto y acceso. El sitio utiliza **Next.js** (evidencia en recursos `/_next`), pero el agente debe verificar la versión, router, bibliotecas y stack real desde `package.json` y código; la auditoría pública **no prueba cómo están implementados el dashboard autenticado, admin ni permisos**.

**Se confirmó públicamente:**

- Home con dos entradas: «Soy estudiante o joven técnico» y «Soy una empresa», tres líneas Compite/Crea/Conecta, catálogo destacado y CTA de propuesta.
- `/explorar` lista competencias, hackathons y el reto ficticio; mezcla historias reales con contenido de demostración.
- `/empresa/proponer` tiene formulario sin login: organización, nombre/cargo, correo, problema, resultado buscado, confidencialidad y consentimiento. Incluye explicación «Qué pasa después», visible en columna lateral en escritorio.
- `/retos/seed_challenge_empresa-demostracion-rutas` presenta empresa, modalidad, fecha, inscripción, descripción breve del problema, dos entregables y rúbrica simple de dos criterios.
- `/acceso` y `?modo=registro` permiten entrar/crear cuenta de forma pública; no es evidencia de que los roles empresariales estén conectados.
- `/compite`, `/crea`, `/conecta` funcionan como páginas de línea.

**Se observó como problema o brecha:**

- `Rutas sostenibles` figura como `Crea · Challenge`, aunque en el pitch representa el núcleo de `Conecta`.
- El discurso público da prioridad a «recibir soluciones», no a **identificar talento por evidencias**.
- El problema del reto es genérico y la ficha no permite comprender claramente checkpoints, defensa, estado de revisión o resultado del evaluador.
- **No se pudo auditar autenticadamente** un dashboard de empresa, un espacio de joven ni un panel admin: inspeccionar el repo antes de afirmar que existen, faltan o están rotos.
- Existen experiencias ficticias con estados `Abierto`; debe ser imposible confundirlas con convocatorias reales.
- La interacción de propuesta sin login es valiosa; **conservarla**.

**No tocar por accidente:** experiencias históricas reales (Copa, Hackathon Turismo Creativo Vol. 1) y datos de comunidad; nunca renombrar eventos ya realizados como ficticios.

---

# B. FLUJOS CANÓNICOS Y ARQUITECTURA DE INFORMACIÓN

## B.1. Flujo del joven: definición producto

**Historia principal:** «Como joven técnico quiero entender lo que una empresa necesita, inscribirme, gestionar mi participación, presentar entregas y decisiones, defender mi trabajo y ver cómo fue evaluado, para construir un historial verificable y poder conectar con empresas que valoren mis capacidades».

**Camino feliz:**

`Inicio → Explorar → Challenge empresarial → Inscripción → Mi challenge → Trabajo/avances → Entrega → Defensa → Estado y evaluación → Contacto/seguimiento`.

**Pantallas lógicas (usar rutas reales existentes cuando se pueda):**

| Paso | Vista / intención | Información esencial | Acción principal | Estado verificable |
|---|---|---|---|---|
| J1 | Catálogo filtrado | Challenges empresariales, estado, empresa, modalidad, fecha, `DEMO` | Ver reto | Reto seleccionado |
| J2 | Detalle del challenge | Contexto, problema, objetivo, alcance, entregables, fechas, criterios, propiedad/IP, condiciones, datos de empresa publicables | Inscribirme | Confirmación de elegibilidad |
| J3 | Inscripción | Usuario, modalidad/equipo, aceptación de reglas, consentimiento, datos mínimos | Enviar inscripción | `Pendiente` o `Aprobada` (no equiparar) |
| J4 | Espacio del participante | Progreso, fechas, checklist, documentos, preguntas, estado de inscripción | Continuar trabajo | Panel accesible solo si corresponde |
| J5 | Bitácora / proceso | Decisiones, hipótesis, commits/enlaces, checkpoints, observaciones del mentor si están habilitadas | Guardar avance | Trazabilidad por fecha |
| J6 | Entregas | Repositorio, URL de demo, archivos o enlaces, instrucciones y versión; validación antes de enviar | Entregar versión | Recibo/fecha/estado visible |
| J7 | Defensa | Video o URL, resumen técnico, principales decisiones, pruebas, trade-offs, uso de IA explicado sin estigma | Enviar defensa | Defensa adjunta y registrada |
| J8 | Resultados | Estado de evaluación, rúbrica por criterio cuando sea publicable, retroalimentación, lugar/shortlist si aplica | Ver retroalimentación | Estado sin falsos positivos |
| J9 | Conexión | Si hay interés empresarial, aviso de contacto y solicitud de consentimiento, estado de seguimiento | Aceptar/declinar contacto | Permiso registrado |

**Reglas clave del recorrido:**

- Vista pública muestra únicamente información del reto autorizada para publicar; datos internos/confidenciales quedan fuera.
- El joven puede leer la rúbrica y los entregables **antes** de inscribirse.
- Si no tiene cuenta, volver después del login exactamente al reto y acción original.
- Inscripción idempotente: dos clics no generan duplicados.
- Equipo/individual según configuración del reto. Si ya existe soporte de equipo, reutilizarlo; si no, garantizar un flujo individual end-to-end y marcar equipos como limitación real.
- Se puede **guardar borrador** de avances/entregas y publicar versión final; dar confirmación de recepción.
- La defensa es **un recurso separado, visible y entendible**, no un texto accidental dentro de un textarea genérico; si el archivo/video no está listo, soportar **URL + texto** como implementación viable y honesta.
- Fecha de cierre: impedir cambios finales cuando esté bloqueada, con fecha/hora/zona horaria visibles; admin puede gestionar reapertura auditada.
- No mostrar feedback, notas privadas o shortlist empresarial antes de que el evaluador/admin autorice su publicación.
- «Sin evaluación todavía», «En revisión» y «No seleccionado» son estados distintos. No mostrar «rechazado» por defecto.
- El joven puede **revocar permiso de contacto**, sujeto a obligaciones de conservación definidas; contacto no equivale a contratación.
- El perfil público del joven no debe revelar correo, teléfono ni entrega privada a otros participantes.

**Pantalla que más conviene construir si solo hay tiempo para una nueva vista:** `Mi challenge`: un resumen con pasos y estados, entrada al trabajo, entrega, defensa y resultados. Debe reducir clicks y mostrar una historia completa.

### Contenido ejemplo para `Rutas sostenibles`

**Título sugerido:** «Optimización de rutas para una operación de entregas» (`Challenge empresarial · DEMO`).

**Empresa:** `Empresa de demostración C3` — nombre ficticio, sin acuerdo comercial real.

**Problema:** «Una empresa de logística ficticia distribuye pedidos y quiere comparar rutas para reducir kilómetros innecesarios. Necesita un prototipo que permita cargar un conjunto sintético de entregas, generar una propuesta de ruta y explicar qué restricciones y criterios se aplicaron».

**Objetivo de evaluación:** «Observar comprensión del problema, modelado de restricciones, calidad técnica, decisiones justificadas y capacidad de explicar el resultado».

**Entregables:** (1) repositorio y README; (2) demo de prototipo o video; (3) breve bitácora de dos decisiones clave; (4) defensa con explicación de trade-offs y limitaciones. **Marcar como requisitos de la demo, no como obligaciones de un cliente real**.

**Rúbrica demostrativa (ajustar a modelo del repo y mantener puntajes coherentes):** comprensión del problema 20%; solución funcional y pruebas 30%; criterio técnico y decisiones 25%; claridad de defensa 25%. Cada criterio incluye breve descripción observable y escala; no fingir datos objetivos si la evaluación de demo fue escrita manualmente.

---

## B.2. Flujo de la empresa: DEFINICIÓN PRIORITARIA

**Historia principal:** «Como líder técnico de una empresa quiero compartir una necesidad sin exponer datos privados, recibir ayuda de C3 para convertirla en un challenge, administrar la experiencia y evaluar resultados comparables, para decidir con qué participantes quiero conversar».

**Este flujo tiene prioridad para el pitch.** El jurado debe entender, sin explicaciones largas, **por qué una empresa paga**.

**Camino feliz:**

`Portada → Proponer sin cuenta → Revisión por C3 → Aprobación y configuración → Dashboard empresarial → Participantes y entregas → Evidencia y rúbrica → Comparación y shortlist → Contacto consentido → Seguimiento`.

### E0. Propuesta sin fricción (actual `/empresa/proponer`)

**Conservar:** formulario sin login y barra lateral «Qué pasa después».

**Mejorar título:** «Contanos qué querés descubrir en tu próximo challenge» o «Convertí una necesidad de tu equipo en una experiencia para descubrir talento». Mantener contexto de problema técnico.

**Copy base sugerido:**

> «No necesitás un brief perfecto. Contanos qué necesita explorar tu equipo —un problema técnico, una iniciativa propia o una forma de identificar talento— y C3 te ayuda a convertirlo en un reto evaluable».

**Campos mínimos (actuales):** empresa/organización, nombre y cargo, correo, problema, resultado deseado, datos disponibles/confidencialidad, consentimiento. **No hacer un formulario kilométrico**. Si se añade clasificación de intención, usar una sola selección opcional: `Identificar talento`, `Explorar una solución`, `Ambos`.

**Seguridad UX:** aclarar «No enviés datos personales sensibles ni información confidencial de clientes». El envío no publica el reto automáticamente. Mostrar confirmación y referencia **única** de propuesta, no una promesa de respuesta en X horas si no está garantizada.

**Flujo de acceso:** la propuesta puede existir antes del usuario; un admin C3 la revisa, luego invita/vincula una cuenta empresarial a una organización. Evitar que un usuario se asigne organización arbitraria o vea propuestas ajenas.

### E1. Revisión y diseño con C3

La empresa y C3 definen, por lo menos:

- Nombre y objetivo del reto; qué talento se busca observar.
- Problema apto para compartir y contexto publicable; restricciones y material sintético.
- Participación individual/equipo y criterios de elegibilidad.
- Duración, calendario, entregables, rúbrica, checkpoints y defensa, según paquete.
- Consentimiento de uso de datos; acceso a entregas y permiso de contacto.
- Paquete comercial **Esencial / Completo / Destacado**, precio de referencia y condiciones de premio/IP separadas.

**No simular contrato pagado.** Para demo, `Paquete: Completo · simulación`, `Estado comercial: Demo / sin contrato`. Si no existe módulo comercial real, una configuración ilustrativa de paquete con etiqueta Demo es suficiente.

### E2. Dashboard empresarial: centro del producto

**Vista inicial recomendada:** `Mis challenges` o `Panel de empresa` con un reto de demostración seleccionado. Arriba, cuatro datos **operativos ficticios**: `Inscritos`, `Entregas recibidas`, `En evaluación`, `Perfiles de interés`; cada métrica enlaza a una lista filtrada. No mostrar ingresos, hires ni candidatos reales inventados.

**Cabecera del reto:** nombre, empresa, etiqueta Demo, estado del ciclo, fechas, paquete seleccionado, CTA `Ver entregas`.

**Subnavegación interna simple:**

1. **Resumen**: brief, cronograma, fase actual, hitos; documentos y accesos.
2. **Configuración**: información publicable, rubric, fechas, entregables, estado (solo si rol lo permite; admin C3 mantiene aprobación final).
3. **Participantes**: inscritos, equipos, estado, filtros.
4. **Entregas**: tabla/lista con autor/equipo, fecha, estado, enlace a evidencia.
5. **Evaluación**: rúbrica y valoración privada; comentarios, consistencia, defensa.
6. **Talento / resultados**: comparación, lista corta, contacto y seguimiento.

Si ya hay rutas o componentes equivalentes, **no recrear un dashboard paralelo**: reorganizar navegación, acciones y datos dentro de lo existente. Reducir navegación profunda y menús que no llevan a ningún sitio.

### E3. Revisar la entrega: de «código» a «persona observable»

La página de detalle de una entrega debe poner **tres secciones claramente visibles**:

| Evidencia | Qué ve la empresa | Para qué sirve |
|---|---|---|
| **Entregable** | Repo, video/demo, README, archivo y estado | ¿Qué construyó? |
| **Proceso** | Checkpoints, bitácora, decisiones, versiones y limitaciones | ¿Cómo llegó al resultado? |
| **Defensa** | Video/URL, síntesis argumentada, preguntas-respuestas si existen | ¿Comprende y puede defenderlo? |

**No inventar telemetría**: si no hay seguimiento de commits ni revisión automática, mostrar bitácora declarada y marcas de tiempo reales del registro de demo. La demo puede contener notas ficticias claramente etiquetadas.

**Rúbrica:** ponderación/criterios visibles, notas asignadas por evaluador autorizado, agregados solo según lógica existente, comentarios internos separados de feedback publicable. Posibilidad de adjuntar notas cualitativas (criterio, autonomía, lógica de negocio), siempre respetando permisos.

### E4. Comparar perfiles: la pantalla de mayor impacto

Esta es la escena que debe vender el producto. Hacer una **matriz comparativa clara**, no un ranking sin contexto.

**Columnas sugeridas:** participante/equipo, calidad del entregable, comprensión del problema, criterio/decisiones, defensa, puntaje total (si aplica), estado de evaluación, acción `Ver evidencia` y `Añadir a lista corta`.

- Ordenar por evaluación completa o criterio relevante, con filtro por `Evaluado`, `Pendiente` y `En lista corta`.
- Mostrar **por qué** una persona destaca, no solo un número.
- No exponer datos personales privados a evaluadores sin permiso ni a participantes entre sí.
- Señalar `Evaluación demostrativa` en tablas y perfiles seed.
- Si el paquete Esencial no incluye matriz avanzada, su empresa sigue viendo **todas las entregas**; usar tablas más simples, no negar acceso a sus propios resultados.

**Panel de perfil:** nombre ficticio, habilidades declaradas, entregables, resumen de evaluación, puntos fuertes, observaciones y estado de contacto. Nada de `Contratado` salvo que haya un evento real de contratación (no sembrarlo como hecho).

### E5. Lista corta y contacto

1. La empresa agrega un participante a `Lista corta`.
2. Selecciona `Solicitar contacto` y escribe **motivo / mensaje opcional**.
3. La plataforma verifica consentimiento vigente. Si falta, el participante recibe una solicitud, sin exponer su correo directamente.
4. Joven acepta o declina la conexión.
5. La empresa ve estado: `Solicitado`, `Esperando consentimiento`, `Aceptado`, `Declinado`, `Contactado`, `Seguimiento`.
6. C3 puede registrar seguimiento a 30/90 días según condiciones del paquete, **sin inferir contrataciones**.

**Para mañana:** no se necesitan emails reales ni servicios externos activos para demostrar esta transición. Basta un flujo persistente en Firebase de **solicitud de contacto** y aprobación del usuario demo; un panel puede cambiar el estado al recargar. Si el envío de correo existe, **deshabilitarlo en entorno demo** o redirigirlo a una bandeja segura de prueba.

### E6. Supervisión C3 (admin)

Admin puede revisar propuestas entrantes, vincular organizaciones, editar y publicar retos, controlar estado, moderar entregas, gestionar rubricas, revisar auditoría, facilitar contactos consentidos y gestionar datos de demo. **No suplantar el usuario sin registrar esa acción**.

**Permisos deseados (mínimo viable):**

| Acción | Público | Joven | Empresa vinculada | Admin C3 |
|---|---:|---:|---:|---:|
| Ver retos públicos | Sí | Sí | Sí | Sí |
| Proponer necesidad | Sí | Sí | Sí | Sí |
| Inscribirse al reto | No | Sí | No por rol empresa | Admin solo en pruebas |
| Guardar y presentar entrega | No | Autor/equipo | No | Gestión autorizada |
| Ver todas las entregas de SU reto | No | Solo propias/autorizadas | Sí | Sí |
| Evaluar entregas | No | No | Según permiso de evaluador y reto | Sí |
| Gestionar reto de organización | No | No | Solo organización propia y permisos | Sí |
| Solicitar contacto | No | No | Empresa autorizada | Sí, como facilitador |
| Ver datos de contacto | No | Propios | Solo tras consentimiento válido | Según necesidad operacional |
| Ver métricas de otras empresas | No | No | No | Sí, con controles |

---

# C. PLAN DE IMPLEMENTACIÓN OBLIGATORIO, EN ESTE ORDEN

> Convención: **P0** indispensable para el ensayo; **P1** si P0 está verde; **P2** posensayo. El orden formal de tareas es **0 → 1 → 2 → 3 → 4 → 5**, como pidió el equipo; es válido preparar pruebas y fixtures mínimos dentro de cada tarea, pero el **seed integral y la creación de cuentas reales** se cierran en 4 y 5. La **prioridad funcional transversal** es completar empresa primero cuando haya conflicto de tiempo.

## TASK 0 — Actualizar TODO el enfoque narrativo y los mensajes del sitio [P0]

**Objetivo:** todo lo público y autenticado debe hablar el mismo idioma que el pitch y el negocio final.

### 0.A. Inventario previo

- [ ] Detectar todas las rutas existentes, layouts, CTA, mensajes, estados, templates de email, datos seed, títulos y metadatos SEO.
- [ ] Buscar copy obsoleto: «C3 Platform», «soluciones de equipos», «reto resuelto», «hackathon genérico», cifras antiguas, eventos ficticios no identificados, nombres de paquetes anteriores, tarifa por suscripción y cualquier afirmación no validada.
- [ ] Identificar fuente de verdad para catálogo y taxonomía; **corregir datos, no solo ocultar etiquetas en la UI**.
- [ ] Comprobar que otras experiencias reales siguen presentadas verazmente.

### 0.B. Matriz de copy y contenido

| Ubicación | Mensaje final propuesto | Acción |
|---|---|---|
| `<title>` y descripción global | `C3 Challenges · Descubrí talento a través de retos reales` / `C3 conecta empresas con talento joven mediante challenges que hacen visibles el entregable, el proceso y el criterio técnico.` | Mantener vinculación institucional C3; no borrar líneas Compite/Crea/Conecta |
| Home hero | **`Problemas reales. Talento que demuestra lo que sabe.`** | Sustituir copy que vende solo obtener soluciones |
| Home párrafo | `Las empresas plantean necesidades. C3 diseña y opera retos que permiten observar cómo el talento joven construye, decide y defiende sus soluciones.` | Talento primero |
| Card joven | `Demostrá lo que sabés construir` / `Explorá retos, participá, documentá tu proceso y convertí tu trabajo en evidencia.` | CTA `Explorar challenges` |
| Card empresa | `Descubrí talento con evidencia, no solo con currículums` / `Contanos una necesidad y C3 la convierte en un reto que te permite comparar capacidades.` | CTA `Proponer un challenge` |
| Home, CTA final | `¿Querés ver cómo resuelve problemas el talento joven?` | CTA `Proponer un challenge` |
| Explorar | `Explorá experiencias de C3` | Filtros por tipo, estado y línea; empresas primero en Conecta |
| Challenge | `Qué necesita la empresa`, `Qué vas a construir`, `Cómo evaluaremos tu trabajo`, `Cómo compartir tu defensa` | Bloques concretos |
| Empresa / propuesta | `No necesitás un brief perfecto` | Mantener. Añadir confianza/confidencialidad |
| Dashboard empresa | `Tu challenge, de principio a fin` / `Revisá entregas y compará evidencia para decidir a quién conocer` | Datos operativos, no ventas inventadas |
| Lista corta | `Perfiles que querés conocer` | No equiparar a contrataciones |
| Resultados joven | `Tu trabajo y tu evaluación` | Diferenciar pendiente/publicado/contacto |
| Navegación | `Explorar`, `Compite`, `Crea`, `Conecta`, `Para empresas`, `Entrar` | No ocultar navegación existente innecesariamente |

**Criterio de cierre de Task 0:** desde la portada hasta resultados, la promesa empresarial es consistente; no hay texto que venda exclusivamente soluciones ni etiquetas incorrectas en challenges empresariales; SEO y demos tienen etiquetas `DEMO`.

## TASK 1 — Integrar skill Impeccable y hacer un pase visual contenido [P1; no bloquear P0 funcional]

**Objetivo:** mejorar jerarquía, claridad, legibilidad y consistencia sobre el sistema visual existente, sin rediseño total ni retrasar flujos.

### 1.A. Instalación en el repositorio

- [ ] Comprobar si Impeccable ya está instalado en el **entorno del agente de código**. Que esté disponible en esta conversación no garantiza que esté en el repositorio o en su runner.
- [ ] Si falta, instalar la versión oficial con la opción compatible con el agente: `npx impeccable install` ejecutado en raíz del repo; seguir prompts y revisar cambios antes de confirmarlos. Documentación: `https://impeccable.style/docs/`.
- [ ] Leer su `SKILL.md`, ejecutar su carga de contexto una sola vez y preservar los tokens existentes.
- [ ] Si no hay `PRODUCT.md`/`DESIGN.md`, generar **contexto y documentación desde el proyecto existente**, sin reemplazar la identidad oficial ni alterar CSS a ciegas.
- [ ] Registrar en `AGENTS.md` cómo se invoca `impeccable` en ese entorno. Hooks opcionales solo si el equipo los puede activar y aprobar; nunca asumir que están funcionando.

### 1.B. Análisis y aplicación

- [ ] Aplicar modo **Persuade** a landing, `Explorar` introductorio y página para empresa; modo **Operate** a formularios, dashboards, evaluación y entregas.
- [ ] Hacer `critique`/`audit`/`clarify` o equivalentes sobre home, propuesta, ficha del reto, panel joven y panel empresa; luego un `polish` limitado.
- [ ] Mantener paleta y tipografías oficiales. Mejorar contraste, espaciado, títulos, alineación, responsive y estados de carga/error/vacío.
- [ ] En ficha de reto, destacar **problema + entregables + rúbrica + CTA**. En empresa destacar **entregables, proceso, defensa, comparativa**.
- [ ] Etiqueta `DEMO` visible y consistente; no depender de un footer escondido.
- [ ] No inventar testimonios, logos de clientes, puntuaciones «reales», fotografías de jóvenes ni marcas de organizaciones no participantes.
- [ ] Inspección visual en escritorio (p. ej. 1365×900) y móvil (p. ej. 390×844), arreglar defectos en un lote y verificar una vez más.

**Criterio de cierre:** estética C3 coherente, contenido legible en proyector, CTA no ocultas, foco/errores accesibles, sin degradar usabilidad móvil ni introducir animación innecesaria.

## TASK 2 — Implementar/refinar flujo end-to-end del JOVEN [P0]

- [ ] **J1:** catálogo filtrable `Challenges empresariales` y detalle con contexto realista, empresa ficticia etiquetada, entregables, rúbrica y calendario.
- [ ] **J2:** acceso/registro con redirección al challenge; autenticación Firebase real.
- [ ] **J3:** inscripción persistida con estado y prevención de doble inscripción; solo si challenge admite inscripciones.
- [ ] **J4:** `Mi challenge` con progreso, fechas, documentos y pasos claros.
- [ ] **J5:** bitácora/avance editable (al menos dos checkpoints de demo), decisiones con texto y enlaces.
- [ ] **J6:** entrega con repositorio y URL de prototipo; persistencia y recibo. No se necesita subir video pesado si no hay tiempo; un enlace validado es preferible a un upload roto.
- [ ] **J7:** defensa separada (URL/video opcional, resumen y argumentos), con sello de tiempo.
- [ ] **J8:** estado de evaluación y feedback publicado; no mostrar comentarios internos.
- [ ] **J9:** estado de contacto y consentimiento aceptado/declinado; no exponer email en público.
- [ ] Agregar empty/loading/error/success/closed states y navegación de retorno.
- [ ] TDD de transiciones de estado, propiedad de entregas y permisos. E2E real de la cuenta joven.

**MVP de mañana, si el tiempo aprieta:** basta **un reto + un participante con inscripción real + una entrega + una defensa + feedback publicado en Firebase + solicitud de contacto**. No simular una entrega inexistente como persistida.

**Definición de terminado:** salir/cerrar sesión, entrar como joven demo, encontrar y abrir su reto, ver su inscripción, abrir su entrega/defensa, comprender qué está pendiente y qué resultado está disponible. Repetir tras refresh: los datos siguen iguales.

## TASK 3 — Implementar/refinar flujo end-to-end de la EMPRESA [P0 · prioridad máxima]

- [ ] **E0:** conservar formulario sin registro y su explicación lateral; datos realmente guardados, validación, consentimiento y confirmación.
- [ ] **E1:** pantalla admin para revisar propuesta y transformarla en un challenge asociado a organización; estado `En revisión` → `Aprobado` → `Publicado`, sin publicar automáticamente.
- [ ] **E2:** cuenta empresa vinculada a organización por admin/invitación; dashboard con `Mis challenges`, métricas de demo, próximos hitos, paquete de referencia y estados.
- [ ] **E3:** configurar brief público/privado, fechas, elegibilidad, entregables, criterios de evaluación; permisos según rol.
- [ ] **E4:** listar participantes y entregas, con filtros y detalle de una entrega.
- [ ] **E5:** en detalle de entrega separar visualmente `Entregable`, `Proceso` y `Defensa`; mostrar evidencia persistida.
- [ ] **E6:** evaluación con rúbrica, valoración, comentarios y estados claros; impedir puntuaciones fuera de rango y evaluaciones duplicadas indebidas.
- [ ] **E7:** matriz comparativa y lista corta que destaque criterios y argumentos, no solo números; acceso a todas las entregas de SU reto.
- [ ] **E8:** solicitar contacto a usuario con consentimiento; registrar estado y mostrarlo en ambos roles sin enviar correo real desde demo.
- [ ] **E9:** seguimiento del contacto y cierre; en demo usar `Solicitud de contacto enviada` y `Pendiente de aceptación`, no inventar entrevistas/hirings como resultados observados.
- [ ] **E10:** integrar estados vacíos, carga, permisos denegados, actualizaciones en Firebase y feedback de acciones.
- [ ] Ejecutar E2E sobre empresa demo y admin. Comprobar acceso cruzado denegado usando empresa de otra organización.

**La pantalla más importante:** `Panel empresa → Evaluación → Comparar talento`. El presentador debe llegar ahí en menos de dos clics desde el dashboard del reto (una vez logueado), mostrar 3–4 entregas ficticias con evidencia y demostrar la lista corta. Si ninguna ruta semejante existe, construir **una vista mínima funcional y conectada** antes que seis pantallas superficiales.

**Definición de terminado:** cerrar sesión, entrar como empresa demo, ver su reto, abrir una entrega, consultar la defensa y rúbrica, añadir un perfil a shortlist y solicitar contacto; verificar que Firebase guarda el cambio y que el joven recibe el estado correspondiente. **Todo sin intervención manual en consola durante el pitch**.

## TASK 4 — Migraciones seguras, SEED de Firebase y contenido abundante pero honesto [P0]

**Interpretación de «migrar Firebase»:** la aplicación **ya está en Firebase** según el contexto del equipo; el objetivo inmediato es **evolucionar el esquema de datos y poblar un entorno de demo**, **NO** cambiar a Supabase ni reconstruir backend. Si el repo revela lo contrario, documentar el hallazgo antes de alterar la plataforma.

### 4.A. Inspección y ambiente

- [ ] Inventariar Firebase project IDs, Auth, Firestore, Storage, índices, reglas, funciones, config, emuladores y scripts existentes.
- [ ] Hacer copia exportable/backup del dataset demo si ya existe. **Nunca ejecutar `deleteCollection`, `clear`, import masivo destructivo ni `firebase deploy` sin comprobar el project ID objetivo.**
- [ ] Priorizar **proyecto Firebase separado de producción** (`c3-challenges-demo` como sugerencia, no afirmar que existe); o usar un entorno staging ya presente. En último caso, namespace claramente aislado, reglas y control de permisos por entorno.
- [ ] Config de `.env.local` con `NEXT_PUBLIC_FIREBASE_*` públicos que sean necesarios; credenciales de Admin SDK solo en variables secretas del servidor. No almacenar service accounts en git.
- [ ] Versionar migraciones y seeds con identificador de versión, `--dry-run`, confirmación explícita de proyecto, log de IDs creados/actualizados e idempotencia.

### 4.B. Entidades mínimas del modelo (adaptarlas a esquema real del repo)

- `users`: UID Firebase Auth, nombre, rol de app, consentimientos, perfil público y permisos.
- `organizations`: nombre, identificador demo, miembros y roles autorizados.
- `proposals`: remitente, contacto, necesidad, clasificación, estado, createdAt, organización vinculada.
- `challenges`: organización, nombre, descripción pública, estado, tipo/línea (Conecta), demo flag, paquete, fechas, entregables, rúbrica, confidencialidad.
- `challengeRegistrations`: challengeId, userId/teamId, estado, consentimientos, marcas de tiempo.
- `challengeProgress`: checkpoints, decisiones/bitácora, autor, updatedAt.
- `submissions`: challengeId, autor/equipo, estado, repositorio, URL demo, archivos autorizados, versionado, submittedAt.
- `defenses`: submissionId, URL de video, resumen y argumentos, marcas de tiempo.
- `evaluations`: challenge/submission/evaluator, rúbrica, notas, feedback visible e interno, publishedAt.
- `shortlists`: organization/challenge/participant, motivo, createdBy, estado.
- `contactRequests`: empresa, participante, propósito, consentimiento y estados; sin datos sensibles en vistas públicas.
- `auditEvents`: actor, acción, entidad, fecha, detalles mínimos no sensibles.

**Ojo:** estos son **conceptos**, no nombres obligatorios de nuevas colecciones. **Reutilizar el esquema existente** y hacer cambios aditivos compatibles. Desnormalizar solo si hacen falta consultas Firestore. Índices compuestos según consultas probadas, no a ciegas. IDs deterministas/etiqueta `seedVersion` para idempotencia.

### 4.C. Dataset de demostración propuesto

**Poblar con calidad, no con cantidad arbitraria.** Crear variedad sin confundir datos sintéticos con tracción.

| Elemento | Seed recomendado | Condiciones |
|---|---|---|
| Organización demo | `Empresa de demostración C3` | Ficticia, etiqueta `DEMO` en dashboard |
| Challenge principal | `Optimización de rutas para una operación de entregas` | `Conecta · Challenge empresarial`, `Completo`, suficientemente detallado |
| Otros challenges | 2–3 demos de dominios distintos (p. ej. QA de reglas de negocio, datos/IA, experiencia de producto) | Diferentes estados; **no convertir en ventas confirmadas** |
| Participantes ficticios | 6–10 | Nombres neutros inventados, sin fotos reales ni datos personales verdaderos |
| Inscripciones principal | 5–6 | Aprobadas, pendiente y alguna retirada para probar estados |
| Entregas principal | 4 | 3 evaluadas y una pendiente; repos/links a recursos de ejemplo que funcionen |
| Defensas | 3–4 | Video o texto de demo; jamás enlaces a contenido privado sin permiso |
| Evaluaciones | 3 completas y 1 pendiente | Rúbricas consistentes, notas diferenciadas |
| Shortlist | 2 perfiles | Motivos cualitativos claros |
| Contactos | 1 aceptado y 1 pendiente/declinado | Son estados de **demostración**; sin mails salientes |
| Propuestas entrantes | 2 o 3 | `En revisión`, `Convertida a challenge`, `No viable` para probar admin |
| Experiencias C3 reales existentes | Conservar | No alterar registros históricos por sembrar demo |

**Narrativa de seed del challenge principal:** empresa quiere optimizar rutas con datos sintéticos; participante A prueba heurística y justifica calidad; B entrega una aproximación alternativa con documentación buena; C tiene prototipo fuerte pero defensa pendiente; D presenta algo pendiente de evaluación. Cada entrega debe contar una **historia creíble de desempeño y criterio**; no rellenar dashboards con contadores sin registros correspondientes.

### 4.D. Seguridad, consistencia y mantenimiento

- [ ] Firestore Security Rules por actor y organización, no solo ocultamiento frontend.
- [ ] Checks en servidor para asignación de roles, creación/edición de retos, lectura de entregas, evaluación, shortlist y contacto.
- [ ] Admin SDK y claves solo servidor; jamás exponer Firebase service account ni crear roles mediante parámetros de URL o formularios.
- [ ] No almacenamiento de datos privados en documentos públicos; normalizar IDs y timestamps; índices versionados si hacen falta.
- [ ] Seed idempotente: ejecutarlo dos veces no duplica registros ni cambia identidades al azar.
- [ ] Guardar manifiesto de la seed con referencias a challenge, organization, usuarios y conteos.
- [ ] Rutina de reset **solo para registros con sello demo y en proyecto demo**, con confirmación explícita, logs y opción `--dry-run`.
- [ ] Backup del estado anterior, rollback viable y auditoría de changes.
- [ ] Test de queries e índices usados por las pantallas reales.

**Criterio de cierre:** site demo con contenido suficiente y consistente; refrescar conserva estados; `seed` repetido es inocuo; los usuarios demo no tienen acceso cruzado; la consola no reporta reglas denegadas injustificadamente.

## TASK 5 — Cuentas REALES de demostración y recorrido ensayable [P0]

**Cuentas esperadas** (direcciones propuestas bajo el dominio C3; comprobar que Auth acepta su uso y que el equipo controla ese dominio):

| Rol | Email propuesto | Permisos | Vista inicial |
|---|---|---|---|
| **Joven** | `joven@demo.c3.com.sv` | Participante normal | `Mi challenge` de rutas |
| **Empresa** | `empresa@demo.c3.com.sv` | Miembro/administrador de **su** organización demo | Dashboard empresarial |
| **Admin C3** | `admin@demo.c3.com.sv` | Gestión de propuestas, organizaciones, retos y moderación | Panel de administración |

**La dirección `joven@demo C3` del pedido se normaliza a un email sintácticamente válido** como el anterior. No crear cuentas de correo tradicionales si solo se necesita **Firebase Email/Password Auth**: son registros Auth; si se requiere recuperación por email, configurar buzones bajo dominio controlado o documentar que esa recuperación no está disponible en demo.

### Creación y control

- [ ] Crear en el **Firebase Auth del proyecto demo**, idealmente mediante Admin SDK o script seguro de provisión. No crear pantallas de autoasignación de `admin` o `empresa`.
- [ ] Generar **contraseña fuerte diferente** para cada cuenta, guardada en secreto/gestor seguro, no en `update.md`, `README`, commits, screenshots ni logs.
- [ ] Vincular Firebase Auth UID a perfil Firestore y, cuando corresponda, a `organizationId` y permisos. Custom claims solo si el esquema las usa y las Rules lo verifican correctamente; forzar refresh token al probar un cambio de rol.
- [ ] Registrar emails verificados solo cuando corresponda a cuentas de demostración controladas. No usar cuentas personales.
- [ ] Iniciar sesión y **verificar por separado** que joven, empresa y admin llegan a su pantalla y obtienen datos reales de Firestore.
- [ ] Comprobar aislamiento de rol: joven no ve matrices de empresa, empresa no ve organización ajena ni admin, admin puede moderar, no puede leer contraseñas.
- [ ] Contraseña/credenciales se entregan al responsable por un canal secreto apropiado y se rotan después de la presentación; nunca se publican en Git o en el sitio.
- [ ] Agregar un modo de demo responsable que reduzca riesgo: banner `Entorno de demostración`, no enviar mails/notificaciones externas ni crear efectos comerciales reales.

### Script para probar mañana, con cuentas reales

**Preparación antes del escenario:** abrir navegadores/perfiles separados: **Empresa**, **Joven** y **Admin**; confirmar tokens vigentes, precargar rutas y cerrar popups. No cambiar de cuenta mediante logout en medio del pitch si hay menos de 60 segundos.

**Ruta A — empresa (la que se presenta):**

1. **0–10 s:** abrir `/empresa/proponer`: «La empresa describe una necesidad, sin preparar un brief perfecto ni publicar datos sensibles».
2. **10–20 s:** cambiar a sesión de **empresa demo** y mostrar challenge ya estructurado en `Mis challenges`: «C3 la convirtió en una experiencia con entregables y rúbrica».
3. **20–38 s:** abrir **Entregas → un perfil** y mostrar `Entregable / Proceso / Defensa`: «No solo vemos qué construyó, sino cómo llegó a ello y si lo entiende».
4. **38–52 s:** abrir **Comparar talento** y seleccionar un perfil/mostrar shortlist: «La empresa compara evidencia y decide a quién quiere conocer».
5. **52–60 s:** mostrar `Solicitar contacto` / `Consentimiento pendiente` y volver al deck: «Conecta el trabajo demostrado con una posible oportunidad».

**Duración objetivo:** **~55–60 segundos**, con 1 persona que habla y 1 que controla la demo si es posible. Si el pitch tiene un máximo de 10 minutos, ensayar el tiempo real y **recortar navegación**, no el argumento clave.

**Ruta B — joven (alternativa, ~45–60 s):**

1. Catálogo → challenge Conecta, problema, entregables, criterios.
2. Sesión joven → su inscripción aprobada y `Mi challenge`.
3. Bitácora y envío del repositorio + defensa.
4. Estado de evaluación, retroalimentación y contacto (solo si hay consentimiento).

**Fallback si la demo en vivo falla:** usar **capturas recientes de las mismas vistas** dentro del deck o imágenes locales, etiquetadas `Captura de demo`. Preparar enlaces directos y video corto offline; no fingir interacción en vivo. Si el login se cae, mostrar ruta pública `/empresa/proponer` + detalle del reto y explicar como prototipo lo que aún no funciona. El pitch vale más que una prueba de autenticación incierta.

---

# D. GOBERNANZA DE IMPLEMENTACIÓN: SUPERPOWERS + PLANNING + DOCUMENTACIÓN

## D.1. Antes de programar (obligatorio)

1. **Leer este `update.md` completo**, `AGENTS.md`, README, documentación y configuraciones existentes.
2. Comprobar con `git status`, rama actual y cambios sin commitear; **no sobrescribir trabajo ajeno**.
3. Inspeccionar rutas/componentes para mapear el código real; mantener inventario de **existente / parcial / ausente** por J1–J9 y E0–E10.
4. Identificar el entorno Firebase de demo, índices y reglas de seguridad existentes.
5. Leer skills Superpowers aplicables en el agente ejecutor: **brainstorming** (para resolver decisiones que realmente cambian producto), **writing-plans**, **using-git-worktrees**, **test-driven-development**, **systematic-debugging**, **verification-before-completion**, **requesting-code-review**.
6. Crear rama de trabajo aislada según flujo del repositorio; git worktree si el equipo lo usa y es seguro.
7. Generar plan granular en `docs/superpowers/plans/2026-11-03-c3-challenges-demo.md` **a partir de este archivo y del código real**, con paths de archivos existentes, interfaces exactas, dependencias y verificaciones. No inventar rutas de archivos en abstracto.
8. Antes de cualquier cambio destructivo, documentar rollback. Confirmar al dueño si algo requiriese borrar datos o alterar el despliegue principal.

### Orden real sugerido de ejecución

- **Paso 0:** narrativa + taxonomía + tokens existentes + copy de flujos.
- **Paso 1:** instalar/activar Impeccable y extraer baseline visual; **aplicar mejoras después de que las pantallas funcionales existan**, sin bloquearlas.
- **Paso 2:** completar flujo joven con un reto y una entrega funcional.
- **Paso 3:** completar empresa y selección/contacto, con prioridad de entrega en caso de recorte.
- **Paso 4:** migraciones aditivas y seed integral en Firebase demo.
- **Paso 5:** provisionar cuentas demo, E2E, ensayar pitch y congelar la demo.

**Nota de dependencias:** en Task 2/3 se pueden crear **fixtures transitorias** para probar interfaces; al cerrar Task 4 se reemplazan por seed estable. No bloquear la construcción de UI por esperar la carga masiva, ni hardcodear datos para evitar Firebase.

## D.2. Documentación del repositorio

Actualizar únicamente lo necesario, sin crear documentación duplicada o contradictoria:

- `AGENTS.md`: propósito, narrativa final, fuente de verdad, roles, comandos reales, Firebase demo/prod, reglas de seguridad, procesos de QA y prohibiciones.
- `README.md`: preparación local real, entorno Firebase, instalación, dev/build/test, demo URLs, modo demo, limitaciones y reset seguro (sin secretos).
- `PRODUCT.md` y `DESIGN.md`: si usa Impeccable, documentar sistema visual **observado**, UX persona empresa/joven y diferencias por superficie.
- `docs/superpowers/plans/...`: plan técnico por archivos exactos y checklists del agente.
- `docs/demo/` (si existe, reutilizar): relato de 60 segundos, pasos de cuentas de demo, disponibilidad, fallbacks, seeds y checklist de ensayo. **El documento maestro de decisiones sigue siendo este `update.md`**.

## D.3. Estándares de ingeniería

- **Preferir cambios incrementales** reutilizando componentes, repositorios/servicios, controles y estilos del proyecto; evitar dependencias nuevas si no aportan valor decisivo para mañana.
- **TDD:** test que falla por el comportamiento faltante → implementación mínima → test verde → refactor y test de regresión.
- Separar presentación, acceso a datos y autorización. Nunca confiar en roles enviados por el navegador.
- Firestore: consultas paginadas o limitadas, listeners donde aporten valor, manejo de errores, estados vacíos, timeouts, índices y transacciones/batches donde se requiera atomicidad.
- Formularios: validación cliente + servidor, accesibilidad, validación de links, mensajes útiles, `disabled/loading` en submit y protección contra doble envío.
- Registrar errores sin imprimir datos sensibles, contraseñas ni tokens; usar datos de test claramente ficticios.
- No introducir SDKs de pagos, video-hosting pesado, IA evaluadora automática, reconocimiento facial o CRM real como dependencias críticas para la demo.
- API y Firebase Rules deben rechazar acceso cruzado, aunque se copie una URL manualmente.
- Cambios pequeños y commits descriptivos por componente terminado; revisión de PR o peer review antes de integrar.
- Desplegar en preview/staging antes de apuntar a `demo.plat.c3.com.sv`, usando CI existente o pasos documentados; nunca afirmar que el deploy fue exitoso sin inspeccionar el sitio real.

## D.4. Matriz de QA, pruebas de seguridad y aceptación

**Obligatorios antes del “completado”:**

| Categoría | Prueba | Resultado esperado |
|---|---|---|
| Narrativa | Home, Conecta, catálogo, reto y propuesta | Talento primero, solución como beneficio complementario; sin claims falsos |
| Clasificación | Challenge empresarial visible en catálogo | Etiqueta `Conecta · Challenge empresarial`, filtro funciona |
| Auth joven | Inicio de sesión con cuenta real | UID y rol correctos; retoma ruta original |
| Auth empresa | Inicio de sesión con cuenta real | Solo ve organización propia |
| Auth admin | Inicio de sesión con cuenta real | Panel autorizado; no accesible por empresa/joven |
| Inscripción | Enviar dos veces | Un registro; mensaje de estado correcto |
| Entregas | Guardar, enviar, refrescar | Datos persistidos y propiedad autorizada |
| Defensa | Añadir URL/resumen | Registro persistido y visible en empresa autorizada |
| Evaluación | Enviar rúbrica fuera de rango | Rechazo de valor inválido y no publicar feedback privado |
| Comparativa | Seleccionar shortlist | Estado correcto persistido y visible solo en empresa autorizada |
| Contacto | Solicitar, aceptar/declinar, refrescar | No divulgar email sin consentimiento; estados coherentes |
| Cross-tenant | Empresa A intenta leer reto/entrega de empresa B | `Permission denied` / HTTP 403 según capa |
| Cross-role | Joven intenta abrir admin | Acceso denegado incluso por URL directa |
| Seed | Ejecutar dos veces | No duplica; manifiesto y conteos coherentes |
| Despliegue | Build/test/QA del repo + sitio real | Sin errores bloqueantes; enlaces correctos |
| UX | Desktop 1365×900 y móvil 390×844 | Formulario, CTA y tablas utilizables sin clipping crítico |
| Resiliencia | Sin datos, error de red, sesión caducada | Mensaje comprensible y posibilidad de volver/reintentar |
| Pitch | Ensayo completo cronometrado | Demo principal en aproximadamente un minuto sin improvisación |

**Comandos:** detectar el gestor y scripts reales del proyecto (`package.json`); no asumir que existen `npm test`, `npm run lint`, `npm run build` ni el runner de E2E. Documentar los comandos **efectivamente ejecutados** y sus resultados. Si falta cobertura, implementar la prueba más cercana con herramientas existentes. **No marcar la tarea completa porque el agente diga «parece funcionar».**

### Gate de salida y freeze

- P0 funcional y seguridad: **verde**.
- Cuentas de demo verificadas: **verde**.
- Seed coherente y estable al refrescar: **verde**.
- Pitch ensayado con enlace real: **verde**.
- Capturas/fallback preparados: **verde**.
- Congelar cambios de riesgo al acercarse la demostración; no introducir refactor o nuevas funcionalidades cosméticas después del último ensayo exitoso.

---

# E. ALCANCE, RECORTES SI FALTA TIEMPO Y NO-OBJETIVOS

## E.1. Orden de recorte

**NO recortar:** historia empresa, etiquetas demo, autenticación real, aislamiento por roles, entrega/defensa visibles, matriz comparativa, shortlist/contacto y persistencia Firebase.

**Recortar primero:** animaciones, hero rediseñado, páginas institucionales adicionales, nuevos filtros complejos, gráfico financiero de empresa, integración de email externa, subida de video pesada, notificaciones sofisticadas, automatización de IA, módulos de mentoría no validados, análisis histórico de cientos de eventos, panel analítico general de C3.

**Si solamente queda tiempo para UN flujo completo:** hacer **empresa**. El joven debe por lo menos tener **un reto público y una entrega/defensa real asociada a una cuenta demo**, para alimentar la vista de empresa. No construir un panel empresarial bonito con datos hardcodeados mientras los flujos no persistieron.

## E.2. Decisiones abiertas que el ejecutor debe resolver inspeccionando el repo

1. **Qué rutas autenticadas ya existen** y cuáles están parciales: inspeccionar, no duplicar. Si un dashboard está sólido, adaptarlo.
2. **Cómo se representa empresa/rol en Firebase**: respetar esquema actual y reforzar autorización.
3. **Qué servicio de archivos está configurado** (Storage, URLs externas). Priorizar URL/repo validable en demo.
4. **Si existe evaluación diferenciada por evaluador**: reutilizarla, no inventar un motor de scoring.
5. **Si la plataforma actual puede tener más de una línea por reto**: en su defecto una sola principal `Conecta`.
6. **Si hay ambiente Firebase demo separado y desplegable**: no crear a ciegas ni tocar producción.
7. **Cuál es el dominio de correo que el equipo controla**: si `demo.c3.com.sv` no se utiliza para correos reales, Firebase Auth puede usar direcciones de prueba, pero la recuperación no funcionará sin buzón controlado. No anunciar recuperación funcional hasta probarla.

Si alguna decisión cambia el alcance sustancialmente, documentar el hallazgo y escoger la alternativa mínima segura, sin introducir una migración de stack ni inventar funcionalidades.

## E.3. Lo que no forma parte de este update

- Cambiar el deck/pitch final, modificar las proyecciones financieras ni reescribir el plan de negocio.
- Construir un marketplace transaccional de contratación, un ATS completo, un ERP de eventos o un SaaS por licencias.
- Procesar pagos reales, capturar documentos personales de menores, publicar datos de participantes ni prometer contrataciones.
- Declarar que el modelo de negocio ya está validado por ventas.
- Migrar de Firebase a Supabase o reemplazar Next.js por otra tecnología sin necesidad comprobada.
- Publicar cuentas de demo con passwords triviales o en archivos públicos.

---

# F. MATRIZ FINAL DE ACEPTACIÓN POR TAREA

| Task | Entregable verificable | Prioridad | Estado inicial |
|---|---|---|---|
| **0 — Narrativa** | Copy integral actualizado, taxonomía Conecta, demo etiquetada, paquetes correctos | **P0** | Pendiente de implementación |
| **1 — Impeccable** | Skill instalada en entorno del repo y pase UX/a11y coherente con C3 | P1 | Pendiente de implementación |
| **2 — Joven** | Inscripción + workspace + entrega + proceso + defensa + feedback con Firebase | **P0** | Pendiente de inspección/implementación |
| **3 — Empresa** | Propuesta + dashboard + revisión/compare + shortlist + contacto | **P0 máxima** | Pendiente de inspección/implementación |
| **4 — Firebase seed** | Migraciones aditivas, datos ficticios consistentes, reglas y script idempotente | **P0** | Pendiente de implementación |
| **5 — Cuentas demo** | Auth real joven/empresa/admin, roles y E2E end-to-end | **P0** | Pendiente de implementación |

### Definición de «listo para mañana»

**Se puede contar una historia verificable en pantalla:**

> Una empresa propone un desafío. C3 lo convierte en un challenge con criterios claros. Los jóvenes se inscriben, construyen, documentan y defienden. La empresa revisa evidencia de cada participante, compara criterios, prepara una lista corta y solicita contacto con consentimiento. **Eso es lo que vendemos: capacidad demostrada y una mejor conexión entre talento e industria.**

El equipo debe poder mostrar ese recorrido con **usuarios reales de Firebase Auth, datos reales de Firebase demo (aunque ficticios en contenido), accesos correctos y cero errores críticos**. El objetivo de la presentación es demostrar **el vehículo del negocio**, no exhibir una app con decenas de pantallas.

---

## Referencias prácticas de skills

- Impeccable (documentación e instalación oficiales): `https://impeccable.style/docs/` · instalación sugerida **dentro del repo**: `npx impeccable install`.
- Superpowers de obra (metodología y skills): `https://github.com/obra/superpowers` · seguir instalación apropiada al agente y sus skills de brainstorming, writing-plans, git-worktrees, TDD, code-review y verification.
- Demo pública analizada: `https://demo.plat.c3.com.sv/`.
- Pitch vigente: `https://docs.google.com/presentation/d/1WpcaND7MFBjc49GDv4iqhJKA8WiyGUZt/edit`.
- Financiero vigente: `https://docs.google.com/spreadsheets/d/1IK1FmiXPRGDv5gS5wT9Uhp3sXrjy_3hR/edit`.

**Última instrucción al agente:** no reportés «completado» sin resultado de tests, lectura de Firestore, verificación de Auth/Rules y recorrido E2E en la URL de la demo. Si algo no existe o queda como mock, decilo explícitamente; el pitch debe ser convincente **por su claridad y honestidad**, no por estadísticas o funcionalidades fingidas.
