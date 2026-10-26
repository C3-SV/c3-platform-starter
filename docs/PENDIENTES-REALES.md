# Pendientes y decisiones abiertas — C3 Platform

Este archivo mantiene **solo decisiones y trabajos no cerrados**. Actualizar la condición de cierre al resolverlos; no copiar aquí narrativas de implementaciones anteriores. El alcance implementado y las rutas están en [README](../README.md).

## Prioridad alta — estabilidad y experiencia de producto

| Asunto | Situación conocida | Para cerrar |
| --- | --- | --- |
| Usabilidad con personas | La arquitectura de navegación (decisiones D1–D10 de la [auditoría](AUDITORIA-NAVEGACION-2026-10.md)) está implementada y verificada con pruebas técnicas, **no con personas**: faltan tareas guiadas por rol (participante, jurado, representante, admin) y una auditoría con lector de pantalla y dispositivos reales | Prueba con 4–5 personas por rol midiendo pasos y errores ([PLAN-CONSTRUCCION](PLAN-CONSTRUCCION.md), «Métricas»); revisión visual a 390 y 1280 px por el responsable |
| Aviso de seguridad de Next.js | `next build` (16.4.0) muestra un aviso de versión afectada por una vulnerabilidad conocida y, la primera vez de cada tanda, **se detiene** y pide repetir el comando (el CI no se vio afectado). No se actualizó nada | Decidir y planificar la actualización como tarea aparte, con revisión de compatibilidad; hasta entonces repetir `npm run build` si se detiene |
| Validación integral | CI verde por PR sobre `dev` (typecheck, lint, unitarias, reglas con emulador y E2E de escritorio y móvil). Las pruebas de versiones revisadas no sustituyen una ejecución actual | Repetir el CI sobre `dev` y `main` en cada promoción |
| Espacio local | El disco C: de esta máquina queda con ~1–2 GB libres tras instalar dependencias y compilar | Recuperar espacio antes de instalar o compilar; verificar con `df` |
| Perfil público: menores e imagen | El perfil público compartible está implementado (opt-in, privado por defecto, centro de estudio oculto por defecto, sin datos privados). **No hay edad en el modelo**: no se puede distinguir a una persona menor, y el texto legal no está aprobado | Validar con asesoría local el tratamiento de menores, nombre e imagen antes de datos reales; decidir si se exige consentimiento de tutor o una edad mínima para activarlo |
| Rutas antiguas de evaluación | `/evaluar/[id]` y `/empresa/retos/[id]/evaluacion` redirigen (307) a `/mi-c3/evaluar/[id]` para no romper enlaces ya enviados | Retirarlas cuando no queden invitaciones vigentes |
| Admin en móvil | Funcional (menú plegable) pero optimizado para escritorio, según la decisión D5 | Revisar si el equipo opera Admin desde teléfono; si no, mantener |

## Repositorio, despliegue y ambientes

- **Ramas oficiales (`dev` sincronizada con `main` el 26-10-2026):** `dev` para integración y pruebas, `main` para producción; PR de trabajo a `dev` y promoción de `dev` a `main`. Un solo checkout, sin worktrees.
- **Visibilidad deseada:** repositorio canónico **privado**. El remoto actualmente identificado es `C3-SV/c3-platform-starter` y se reportó como **público**. Antes de hacerlo privado, comprobar compatibilidad, costos y permisos reales del despliegue Vercel. No cambiar repositorio, plan ni visibilidad sin decisión del responsable.
- **CI:** `.github/workflows/ci.yml` ejecuta PR y push a `main` y a `dev`.
- **Mantenimiento del flujo Git:** retirar, mediante cambio acotado y revisado, `npm run worktree` y el script `scripts/worktree.mjs` para que las herramientas coincidan con la política de un checkout.
- **Firebase real:** revisar configuración actual del proyecto `c3-platform-demo`, Web App, Auth, reglas/índices y variables públicas/privadas de Vercel. No hacer cambios remotos sin autorización; entorno de desarrollo usa emuladores `demo-c3-platform`.
- Confirmar procedimiento de asignación, revocación y auditoría del claim `c3Admin`, así como controles operativos de administradores en el piloto.

## Privacidad, legal y datos reales

- Acordar y validar aviso de privacidad, términos, tratamiento de menores, permisos de imagen/nombre y propiedad intelectual de soluciones, con asesoría local cuando corresponda.
- Aprobar retención, anonimización y eliminación de cuentas sin borrar evidencia oficial indebidamente.
- Revisar anti-spam, privacidad y retención del formulario público de propuestas; no debilitar validaciones del servidor.
- No migrar datos personales de Copa 2026 o Hackathon de Turismo Creativo sin inventario de fuentes, consentimiento/base legal y plan de migración autorizado.
- Evaluar y validar con emuladores casos de permisos negativos y revocaciones: participación ajena, empresa sin vínculo, jurado revocado, resultado no publicado.

## Piloto y funcionalidades deliberadamente fuera de alcance

- Definir empresa, challenge, responsables, audiencia, fechas, métricas, soporte y criterios de éxito del piloto.
- La respuesta de empresa a propuestas que requieren ajustes se gestiona por correo; un flujo interno no está implementado.
- Comentarios de jurados, filtros avanzados, automatizaciones y eliminación de cuenta requieren decisiones independientes.
- La «Bitácora de producto y especificaciones del MVP v2.2» citada por el paquete de diseño no figura en este repositorio. Localizarla o formalizar reglas de producto verificadas; nunca suponer contenido.

## Seguimiento

Por cada decisión registrar en su PR o issue: responsable, alcance acordado, criterio de aceptación y prueba. Si no hay decisión, mantenerla aquí sin presentarla como funcionalidad completada.
