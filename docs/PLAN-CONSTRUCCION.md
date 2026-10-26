# Plan funcional y criterios de validación — C3 Platform

**Objetivo:** evolucionar y validar la plataforma como un producto navegable, seguro y coherente, sin reconstruir innecesariamente lo que ya funciona. Para capacidades implementadas consultar [README](../README.md), para decisiones abiertas [PENDIENTES-REALES](PENDIENTES-REALES.md) y para rutas/UX [PRODUCTO-Y-NAVEGACION](PRODUCTO-Y-NAVEGACION.md).

## Recorridos de producto que deben funcionar de extremo a extremo

| Recorrido | Resultado observable | Roles y capacidades |
| --- | --- | --- |
| Descubrimiento | La persona entiende qué ofrece C3, encuentra una experiencia y comprende si puede participar | Visitante; Home, Explorar, Compite/Crea/Conecta, detalle |
| Participación | Se registra, se inscribe, recibe estado real, participa y entrega según reglas | Joven, equipo; acceso, inscripción, Mi C3, entrega |
| Empresa | Presenta una necesidad y, si C3 la vincula, ve únicamente retos y resultados autorizados | Propuesta pública, representante, espacio de empresa |
| Operación C3 | Admin crea y publica experiencias/retos, revisa inscripciones, asigna jurados y publica resultados | Admin, permisos, trazabilidad |
| Evaluación | Jurados autorizados evalúan anónimamente tras cierre y resultados se publican solo con dos evaluaciones | Jurado, representante habilitado, C3 |
| Evidencia | Trayectoria muestra hechos de participación y resultados publicados, separados del perfil editable | Participante, C3 |

## Prioridad de trabajo

1. **Corregir estabilidad comprobada:** fallo E2E de Cuenta, permisos y enlaces/retornos de sesión. No declarar CI verde sin nueva ejecución.
2. **Auditoría de navegación:** medir cuántos pasos requieren tareas principales, acceso desde menús, retorno, estados vacíos y diferencias entre móvil y escritorio. Crear propuesta de arquitectura de información y probarla antes de editar rutas.
3. **Resolver fricción de los recorridos:** formularios, continuidad inscripción → Mi C3 → entrega, empresa → propuestas → evaluación, admin → acciones pendientes.
4. **Probar verticales completos:** datos reales solo mediante piloto autorizado, emuladores para desarrollo; cubrir errores y autorizaciones negativas.
5. **Preparar piloto:** legal, datos, seguridad, permisos, operaciones y métricas acordadas.

## Prueba funcional de aceptación

Una empresa presenta una necesidad; C3 crea y publica el reto; una persona se registra, se inscribe y entrega texto/enlaces dentro del plazo; el jurado autorizado evalúa después del cierre; C3 publica resultados; cada actor visualiza exclusivamente lo permitido. Refrescar o cerrar sesión no debe perder datos ni provocar redirecciones incorrectas. Ningún control simula éxito.

## Criterios de experiencia

- Todo recorrido tiene un punto de entrada identificable, una salida y un camino de regreso; no depende de conocer la URL.
- El lenguaje de navegación diferencia información institucional, actividad personal, operación C3 y empresa.
- Cada usuario ve acciones pertinentes a su rol, sin links engañosos a recursos sin permiso.
- Un mismo concepto conserva nombre y presentación coherentes en páginas distintas.
- Escritorio y móvil deben ser usables como interfaces completas, no solo visualmente adaptadas.
- Toda acción devuelve estado persistido, retroalimentación, errores y recuperación cuando corresponda.

## Alcance que se mantiene fuera del MVP

Sin pagos, carga de archivos, bolsa de empleo, autojuez, mensajería, CRM ni migración de datos personales históricos sin autorización. La rúbrica simple, resultados oficiales y evaluación por jurados conservan sus reglas vigentes; cualquier ampliación exige decisión y pruebas.

## Métricas del piloto

Inscritos elegibles, completitud de inscripción, entregas válidas, evaluaciones finalizadas, tiempo/pasos para completar tareas, tasa de errores y utilidad percibida por empresa/participantes. Fijar definiciones antes de medir; no inventar cifras.
