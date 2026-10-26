# Pendientes y decisiones abiertas — C3 Platform

Este archivo mantiene **solo decisiones y trabajos no cerrados**. Actualizar la condición de cierre al resolverlos; no copiar aquí narrativas de implementaciones anteriores. El alcance implementado y las rutas están en [README](../README.md).

## Prioridad alta — estabilidad y experiencia de producto

| Asunto | Situación conocida | Para cerrar |
| --- | --- | --- |
| E2E de Cuenta | **Reproducido en CI** (run 40379030628 de la PR #9, solo documentación): `e2e/cuenta.spec.ts` navegaba a `/acceso` antes de que terminara el cierre de sesión; la sesión seguía abierta y el acceso redirigía. Corregido esperando a que «Salir» termine (URL `/` y «Entrar» visible). No era un defecto del producto | CI verde con la corrección (rama `fix/navegacion-fase-0`) |
| UX y navegación integral | Auditoría del 26-10-2026 ([AUDITORIA-NAVEGACION-2026-10](AUDITORIA-NAVEGACION-2026-10.md)). Decisiones D1–D10 aprobadas el mismo día; implementación por fases sobre `dev`: Fase 0 lista, marcos, Admin y perfil público en curso | Todas las fases validadas en `dev` y promovidas a `main`; [PRODUCTO-Y-NAVEGACION](PRODUCTO-Y-NAVEGACION.md) actualizado |
| Navegación posacceso del jurado | Corregida en la Fase 0: la evaluación tiene una sola dirección canónica y las anteriores redirigen; prueba `e2e/navegacion.spec.ts` parte de la URL sin sesión | CI verde en `dev` |
| Aviso de seguridad de Next.js | `next build` (16.4.0) se detuvo con un aviso de versión afectada por una vulnerabilidad conocida; un segundo intento compiló. No se actualizó nada | Decidir y planificar la actualización como tarea aparte, con revisión de compatibilidad |
| Validación integral | Las pruebas de versiones revisadas no sustituyen una ejecución actual | Ejecutar typecheck, lint, unitarias, reglas, E2E y revisión responsive; registrar resultados reales |
| Espacio local | Auditoría reportó 4 GB libres en C: | Recuperar espacio para dependencias, builds y Playwright; verificar antes de instalar |

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

- Definir empresa, reto, responsables, audiencia, fechas, métricas, soporte y criterios de éxito del piloto.
- La respuesta de empresa a propuestas que requieren ajustes se gestiona por correo; un flujo interno no está implementado.
- Comentarios de jurados, perfil público compartible opt-in, filtros avanzados, automatizaciones y eliminación de cuenta requieren decisiones independientes.
- La «Bitácora de producto y especificaciones del MVP v2.2» citada por el paquete de diseño no figura en este repositorio. Localizarla o formalizar reglas de producto verificadas; nunca suponer contenido.

## Seguimiento

Por cada decisión registrar en su PR o issue: responsable, alcance acordado, criterio de aceptación y prueba. Si no hay decisión, mantenerla aquí sin presentarla como funcionalidad completada.
