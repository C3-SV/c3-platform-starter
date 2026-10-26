# C3 Platform — Primeros cortes funcionales

> **Estado: histórico (2026-10-26).** Este plan es anterior a la implementación. Su sección «No están implementados» ya no es cierta: el estado vigente está en el README y en `AGENTS.md` §2. Se conserva la secuencia por dependencias y la prueba de humo como criterio de aceptación.

**Alcance:** los 12 grupos de vistas V01–V12 están aprobados como base. **No** están implementados. Claude mantiene la fuente del diseño visual; este repositorio implementa lógica, persistencia e integración de esa UI.

## Secuencia por dependencias, no por numeración de vistas

| Corte | Resultado comprobable | Incluye |
| --- | --- | --- |
| 0. Base | Corre localmente; reglas de Firestore restrictivas; auth configurada | repo, entorno, Firebase, tipos, pruebas |
| 1. Primer reto | Admin crea/publica reto y detalle se carga de Firestore | V12 mínimo, V03, V04 |
| 2. Joven | Cuenta real se inscribe, participa y entrega texto/enlaces | V06, V07, V05; individual antes de equipos |
| 3. Empresa | Contacto sin cuenta propone; C3 recibe; representante autorizado revisa entregas | V10, V11, V09 mínimo |
| 4. Cierre | Jurado evalúa después del cierre; C3 publica; perfil refleja resultado | V11, V12, V08 |
| 5. Escaparate | Home y listado conectados a datos públicos reales | V01, V02, V09 completo |
| 6. End-to-end | Ambos recorridos demostrados en móvil y escritorio, permisos y errores probados | todo |

## Prueba de humo funcional (criterio de listo)

Una empresa presenta una necesidad; C3 crea y publica un reto; un joven se registra, se inscribe y entrega texto+enlaces; un evaluador autorizado califica tras el cierre; C3 publica resultados; joven y empresa ven solo lo autorizado. Cerrar sesión y recargar no deben perder datos. No son botones simulados.

## Recortes explícitos

- V02 sin filtros al inicio.
- Rúbrica simple con criterios configurables, rangos acotados y promedio de jurados; sin motor de ponderaciones sofisticado.
- V12 puede ser austera, pero sus operaciones deben persistir.
- Experiencias históricas públicas sí; migración personal de Copa/HTC después de definir fuentes, datos y privacidad.
- Sin carga de archivos, bolsa de empleo, pagos, auto-juez, mensajería ni CRM.

## Métricas piloto (a definir con empresa y fecha)

Inscritos elegibles, entregas válidas, evaluaciones completadas, utilidad percibida por la empresa y problemas operativos. No asumir HTC Vol. 2 como piloto sin aprobación.
