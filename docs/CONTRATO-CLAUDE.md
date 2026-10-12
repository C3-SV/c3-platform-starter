# Handoff de diseño — Claude → repositorio C3 Platform

Claude ya trabaja el estilo visual y las 12 vistas. Este starter NO intenta recrearlas.

## Entrega recomendada de Claude

- Código fuente React/TypeScript de cada vista o componentes exportables, más estilos y assets con licencia de uso.
- Un listado de los archivos/componentes por vista V01–V12, responsive móvil/escritorio.
- Descripción de interacciones y estados visibles: loading, vacío, error, bloqueado, enviado, pendiente, publicado.
- Tokens de estilo: tipografía, colores, espaciado, radios, iconos; preferir el manual de marca vigente.
- NUNCA incluir contraseñas, keys privadas, tokens personales o secretos Firebase.

## Reglas de integración

1. Claude aporta UI y componentes presentacionales; dominio, Firestore, permisos y llamadas confiables quedan en este repositorio.
2. Botones con acción real: cualquier click debe navegar o ejecutar operación implementada. No fingir éxito antes de persistir.
3. Incluir estados de error y mensajes de validación. Mobile-first para V05–V07.
4. Una sola identidad de usuario; empresa y jurado solo por permisos verificables.
5. Las 12 vistas son grupos de capacidad, NO necesariamente 12 rutas URL; definir rutas al integrar.
6. No instalar una segunda base, Auth duplicado ni un sistema de estilos paralelo sin revisión.

## Contrato provisional de datos de UI

- Experiencia pública: `Experience` + resumen público de sus retos.
- Inscripción: `Enrollment` por usuario/experiencia.
- Participación y entregas: `ChallengeParticipation` + `Submission` de texto/enlaces.
- Evaluación: `Evaluation` por jurado y entrega, resultado oficial por C3.
- Propuesta de empresa: `CompanyProposal` inicialmente accesible por formulario público controlado.

Las interfaces TS de `src/lib/domain/types.ts` son conceptuales y pueden ajustarse al fijar el esquema físico de Firestore.
