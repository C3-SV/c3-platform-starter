# C3 Platform · Estilo de las 12 vistas

Paquete de diseño del MVP de C3 Challenges. Contiene las 12 vistas aprobadas en el inventario (D-023), el sistema de estilo aplicado y las decisiones tomadas al dibujarlas.

**Alcance de este paquete:** referencia de diseño de las vistas V01–V12. El producto implementado, rutas, permisos y reglas se verifican en `../README.md`, `../AGENTS.md` y el código. Para cambios de navegación consultar `../docs/PRODUCTO-Y-NAVEGACION.md`. Los HTML no son una especificación exhaustiva de interacciones.

Todo el contenido es **de demostración**. Ver la sección «Placeholders y datos de demostración».

---

## 1. Contenido

```
index.html            Índice navegable de las vistas (abrir primero)
vistas/               Las 12 vistas + fundamentos, como HTML independiente
tokens/tokens.json    Tokens oficiales del sistema de marca C3 (claro y oscuro)
tokens/tokens.css     Los mismos tokens como variables CSS (--c3-*)
fuente-canvas/        Archivos originales del lienzo de diseño (.dc.html + canvas.json)
README.md             Este documento
```

Las vistas son HTML con estilos en línea, pensadas como **referencia visual exacta**, no como código de producción. Requieren conexión a internet solo para cargar las fuentes de Google Fonts.

## 2. Cómo verlo

Abrir `index.html` en el navegador. Los enlaces entre vistas funcionan donde se indica en la sección 7. Las vistas móviles (V05 a V08) están dibujadas a 390 × 844 px y se muestran centradas; las de escritorio son fluidas y se apilan en pantallas angostas.

---

## 3. Tres reglas de estilo

1. **El azul es acción.** Todo botón primario y todo enlace usa `accion` (#205298). No cambia por sección ni por línea.
2. **El color de línea clasifica; nunca decora.** En el catálogo y las tarjetas identifica el tipo de experiencia:
   - Compite (azul #205298) → competencias
   - Crea (turquesa #33BEAC) → hackathons
   - Conecta (morado #4F5BA9) → challenges empresariales
3. **Los estados usan sus propios tokens** (`exito`, `advertencia`, `error`, `info`) y siempre llevan texto además de color. Un estado nunca se pinta con un color de línea.

Reglas adicionales del sistema de marca que las vistas respetan:
- El turquesa **no se usa como texto sobre fondo claro**; para texto se usa `crea-texto` (#0f766e).
- Montserrat para títulos y etiquetas; Poppins para texto. Sin otras tipografías.
- Botones y etiquetas pequeñas en MAYÚSCULAS con el estilo `etiqueta`.
- Sin gradientes, sin texturas, sin emojis, sin sombras en tarjetas de contenido (borde de 1 px `borde`).

## 4. Tokens usados

Valores completos en `tokens/tokens.json` y `tokens/tokens.css`. Los de uso más frecuente (tema claro):

| Token | Valor | Uso en las vistas |
|---|---|---|
| fondo | #f2f6fb | Fondo de página |
| superficie | #ffffff | Tarjetas y formularios |
| superficie-sutil | #eaf0f8 | Cabeceras de tabla, bloques de ayuda |
| texto / texto-suave | #0f203e / #475569 | Texto principal / secundario |
| borde / borde-fuerte | #d9e1ec / #7c8ba0 | Divisores / bordes de campos |
| navy | #0f203e | Cabeceras, pie, hero |
| accion / accion-intensa | #205298 / #19406f | Botón primario / hover |
| compite · crea · conecta | #205298 · #33beac · #4f5ba9 | Líneas |
| exito · advertencia · error | #157a52 · #9a5b00 · #b83227 | Estados |
| oro · plata · bronce | #c99700 · #8b97a6 · #a56a39 | Medallas (solo en V08) |

Espaciado base de 4 px (8, 12, 16, 24, 32, 48, 64). Radios: 6 px campos, 12 px botones y tarjetas, 20 px tarjetas grandes, píldora para badges. Campos y botones con altura mínima de 44 px (48 px en móvil para acciones principales).

**Importante:** los fondos suaves de los badges de estado (#e3ecf8, #e0f2ea, #fbefdd, #fae6e3) y el tinte de fila #fbf6ec usado en V12 **no están en `tokens.json`**; son derivados de `info`, `exito`, `advertencia` y `error`. Deben definirse como tokens propios (por ejemplo `--c3-exito-fondo`) o generarse con `color-mix`, para que el cambio de tema no los rompa.

El tema oscuro existe en los tokens pero **ninguna vista está diseñada ni revisada en oscuro**. El foco de teclado debe usar el token `foco`; las vistas no lo sobreescriben.

## 5. Vocabulario único de estados

Un estado se ve igual en todas las vistas. Si un badge cambia de color entre pantallas, hay un error.

| Entidad | Estado | Presentación |
|---|---|---|
| Reto / experiencia | Borrador, Próximo | Neutro (superficie-sutil, texto-suave) |
| | Abierto, En evaluación | Info (fondo azul claro, texto accion) |
| | Concluido | Éxito |
| | Cancelado | Error |
| Inscripción | Pendiente | Advertencia |
| | Aprobada | Éxito |
| | Rechazada | Error |
| | Cancelada | Neutro |
| Equipo | Incompleto | Advertencia |
| | Habilitado | Éxito |
| Entrega | Sin entrega | Neutro |
| | Borrador | Advertencia |
| | Entregada | Éxito |
| | Fuera de plazo | Error |
| Evaluación | Pendiente | Neutro |
| | En curso | Advertencia |
| | Finalizada | Éxito |
| Resultado | No publicado | Neutro |
| | Publicado | Éxito |
| Propuesta empresarial **(provisional)** | En revisión | Info |
| | Requiere ajustes | Advertencia |
| | Aceptada | Éxito |
| | No priorizada | Neutro (no dibujado) |
| Reconocimiento | Ganador, Finalista, Mención | Sello con tokens de medalla, no badge |

Los nombres de presentación deben contrastarse con `src/lib/domain/` y los textos efectivos; cualquier cambio de vocabulario requiere validación de producto y pruebas.

---

## 6. Las 12 vistas

| Vista | Archivo | Acabado | Formato | Ruta |
|---|---|---|---|---|
| V01 Home | `V01-Home.html` | Vitrina | Escritorio | Público |
| V02 Explorar | `V02-Explorar.html` | Funcional | Escritorio | Público |
| V03 Detalle de reto | `V03-Detalle-Reto.html` | Vitrina | Escritorio | Público |
| V04 Acceso | `V04-Acceso.html` | Utilitaria | Escritorio | Común |
| V05 Mi C3 inicio | `V05-Mi-C3.html` | Funcional | Móvil | Joven |
| V06 Inscripción y equipos | `V06-Inscripcion-Equipos.html` | Funcional | Móvil | Joven |
| V07 Mi reto y entrega | `V07-Mi-Reto.html` | Vitrina | Móvil | Joven |
| V08 Perfil y trayectoria | `V08-Trayectoria.html` | Vitrina | Móvil | Joven |
| V09 Espacio de empresa | `V09-Espacio-Empresa.html` | Funcional | Escritorio | Empresa |
| V10 Proponer challenge | `V10-Proponer-Challenge.html` | Funcional | Escritorio | Empresa |
| V11 Seguimiento y evaluación | `V11-Empresa-Evaluacion.html` | Vitrina | Escritorio | Empresa |
| V12 Admin | `V12-Admin.html` | Utilitaria | Escritorio | Admin |

`00-Fundamentos.html` muestra color, tipografía, estados, tarjeta de experiencia y progreso de pasos.

**Acabado:** *vitrina* = es lo que se enseña en la demo y debe replicarse con fidelidad; *funcional* = correcto y limpio; *utilitaria* = sobria, lo importante es que funcione.

### Qué está dibujado y qué no

Cada vista muestra **un estado representativo**, no todos. Para cubrir el resto, comprobar los estados del dominio, las rutas y las pruebas del repositorio; las referencias HTML no incluyen todos los escenarios.

| Vista | Estado dibujado | No dibujado (hay que resolverlo al implementar) |
|---|---|---|
| V03 | Visitante sin sesión, inscripción abierta | Inscripción pendiente, aprobada, rechazada, reto cerrado, experiencia concluida con resultados públicos |
| V04 | Formularios de entrar y crear cuenta, con error de credenciales | Recuperación de contraseña, cuenta recién creada |
| V05 | Usuaria con entrega en borrador, inscripción pendiente, rol de jurado y un resultado | Usuario nuevo sin inscripciones |
| V06 | Equipo habilitado con lugar libre | Equipo incompleto, intento de inscripción duplicada, cupo cerrado |
| V07 | Entrega en borrador con error de validación | Sin entrega, entregada, fuera de plazo, evaluándose, resultado publicado |
| V08 | Perfil con tres participaciones y una inscripción cancelada | Perfil nuevo sin trayectoria, configuración de visibilidad (pública/privada) |
| V09 | Representante con una organización activa, un reto y tres propuestas | Visitante sin sesión (descrito en una nota al pie), sin propuestas |
| V10 | Formulario con error de validación en el correo | Confirmación de recepción tras enviar |
| V11 | Reto en evaluación, una solución abierta para calificar | Sin entregas, evaluación completa, acceso denegado, jurado revocado |
| V12 | **Solo la sección «Resultados oficiales»** | Las otras cinco secciones: Propuestas, Experiencias y retos, Inscripciones y equipos, Entregas, Jurados y rúbricas |

Los estados transversales «cargando», «sin permisos» y la confirmación posterior a guardar también deben diseñarse y validarse, aunque no estén representados en todas las maquetas.

## 7. Navegación

**Enlaces funcionales entre vistas en este paquete:**

- V01 → V02, V03, V10
- V02 → V03 (solo la primera tarjeta)
- V04 → V01, V02
- V05 → V02, V07, V08
- V06 → V05, V07
- V07 → V05
- V08 → V07
- V09 → V01, V05, V10, V11

Cualquier otro enlace usa `#` y marca un destino por implementar o una acción sin pantalla propia (modales, descargas, enlaces externos).

**Flujo previsto que no está enlazado:**

- Joven: V03 «Crear cuenta e inscribirme» → V04 → vuelta a la inscripción de ese reto (continuidad pedida en V04) → V06 → V05 → V07 → V08.
- Empresa: V01 / V09 → V10 → (C3 configura el reto en V12) → V09 → V11.
- Después de enviar una propuesta, una entrega o una evaluación, el sistema debe mostrar una confirmación persistida; esa pantalla o estado no está dibujado.

---

## 8. Decisiones de diseño tomadas al dibujar

No son decisiones aprobadas con ID (D-0xx) en la bitácora. Registrarlas allí si se aceptan.

1. **El color de línea clasifica el tipo de experiencia** en V01, V02 y V09 (regla 2 de la sección 3).
2. **V02 sin filtros.** Con pocas experiencias en el catálogo, filtrar por tipo y estado aporta poco. Se añaden cuando haya más de unas diez. Una leyenda de color reemplaza la función de orientación.
3. **El jurado externo evalúa desde Mi C3** (V05, sección «Como jurado»). Decisión del equipo.
4. **Equipo por código** en V06 (formato C3-XXXX) en lugar de invitación por correo, para evitar construir invitaciones. La persona debe tener inscripción aprobada.
5. **V09 aloja el panel de propuestas y la lista de retos de la organización;** V11 se enfoca en un solo reto.
6. **V10 no exige cuenta para proponer.** Implicación de backend: una propuesta puede existir sin usuario vinculado; debe guardar contacto y organización declarados, y C3 vincula la representación después.
7. **Rúbrica fija de cuatro criterios, 0 a 10 cada uno (total 40), promedio simple** en V03, V11 y V12. El modelo actual de rúbrica y el promedio de jurados deben comprobarse en el dominio y en README; no fijar aquí una política diferente.
8. **Publicación bloqueada hasta que todas las soluciones tengan las dos evaluaciones finalizadas** (V12), y comentarios de jurados **desactivados por defecto** al publicar (PT-04 sigue abierto).
9. **Perfil dividido visualmente** en «lo que escribió la persona» y «Trayectoria registrada por C3» (V08). La trayectoria no es editable por el usuario.
10. **Inscripción cancelada visible en la trayectoria**, en gris, indicando que no acredita participación ni resultado (EX-01, EX-06).
11. **Rótulo «Datos de demostración» (RF-15).** Aparece solo en V01, V02, V03, V11 y V12. Al implementar debe aplicarse a todas las vistas que muestren datos ficticios.
12. **Accesibilidad como dibujado:** controles reales (`button`, `a`, `input` con `label`), botones y campos de al menos 44 px de alto, estado siempre con texto. Los pares de color se eligieron para alcanzar un contraste de 4,5:1, pero **no se ha pasado una auditoría con herramienta**; hacerlo antes de la demo.

## 9. Placeholders y datos de demostración

- **Logo:** en todas las cabeceras es el texto «C3» en Montserrat 800 como marcador. Reemplazar por los archivos oficiales del manual de marca (versión principal, secundaria, isotipo y versión blanca para fondos oscuros).
- **Términos y política de privacidad (V04):** se enlazan, pero los documentos no existen.
- **Reales:** C3, Copa Salvadoreña de Programación, Hackathon de Turismo Creativo (Vol. 1 y 2), Poliédrica, «Fundado en octubre de 2024». Las fechas mostradas para Copa y HTC (agosto, abril) están por verificar.
- **Inventados:** organizaciones (Transportes Delta, Delta Logística, Distribuidora Atlas, Grupo Meridiano), personas (Ana Pineda, Luis Menjívar, Sofía Guzmán, Marcela Reyes), equipos (Rutas en caliente, Delta Planner, Milla Cero, Nodo Sur, Camino Corto, VRP Lab), retos, fechas de noviembre, puntajes y «puesto 9 de 184». «UCA» aparece como institución de la persona de ejemplo; reemplazar si no se desea citar una institución real.
- **Medallas (V08):** se usan oro y plata para mostrar puesto. El sistema de medallas por percentil de temporada es una idea en evaluación, no una decisión; definir si el sello representa percentil o puesto antes de implementarlo.
- **Estados de propuesta:** provisionales (sección 5).

## 10. Notas técnicas sugeridas

Notas de referencia técnica asociadas a las maquetas. **No prevalecen sobre la implementación, la seguridad ni decisiones vigentes.**

- Dirección ya aprobada (D-003): TypeScript + Next.js + Firebase.
- **Autorización en el servidor** (route handlers o server actions con Firebase Admin SDK) y reglas de Firestore en denegar-todo para entregas, evaluaciones e inscripciones. El modelo de permisos contextual (D-022, O1–O8, EX-01–EX-06) es difícil de expresar en reglas declarativas.
- Usar el `participacionId` como ID del documento de entrega garantiza estructuralmente una sola entrega vigente por participación (D-011).
- Entregas y evaluaciones en colecciones separadas, no subcolecciones de algo que el participante pueda leer.
- Hosting en Vercel con Firebase Auth y Firestore evitaría el plan de pago por uso de App Hosting y Storage (PT-05); verificar cuotas vigentes antes de decidir.
- Diseñar y probar primero en móvil las vistas V05 a V08.
- Sembrar la plataforma con la historia real de Copa 2026 y HTC Vol. 1 cuando haya datos reales, y mantener los datos de demostración separables (RN-05).
