# Integración del diseño visual — C3 Platform

Claude Code y Codex pueden contribuir al **mismo repositorio y sistema visual**. Este contrato fija responsabilidades, referencias y criterios de integración, sin imponer que exista una carpeta o rama por agente.

## Referencias

- `diseno-claude/` aporta HTML de referencia V01–V12, `fuente-canvas/` y tokens `--c3-*`. Son referencias visuales; no sustituyen las rutas, permisos ni reglas de negocio vigentes.
- `src/app/globals.css`, `src/components/` y rutas de `src/app/` contienen la implementación real que se debe revisar antes de proponer componentes.
- [PRODUCTO-Y-NAVEGACION](PRODUCTO-Y-NAVEGACION.md) fija preguntas y evidencia necesarias para cambios de arquitectura de información; [README](../README.md) contiene rutas actuales.

## Acuerdos de colaboración

1. **Un checkout y flujo Git único:** cambios en ramas `feat/*`, `fix/*` o `docs/*` basadas en `dev`, con PR a `dev`. No crear worktrees.
2. **Diseño y navegación:** un diseño visual debe describir qué rol lo usa, qué acción inicia, a dónde conduce y cómo se vuelve. No reproducir literalmente pantallas que rompan recorridos funcionales.
3. **Estilo:** reutilizar tokens, tipografías, componentes y estados. Mantener consistencia visual y accesibilidad en escritorio y móvil; no incorporar un sistema paralelo.
4. **Datos:** la UI consume API y modelos existentes (`Experience`, `Enrollment`, `ChallengeParticipation`, `Submission`, `Evaluation`, `CompanyProposal`), según código real. No crear colecciones, Auth ni lectura Firestore en cliente desde una maqueta.
5. **Seguridad y persistencia:** una acción de UI debe tener permiso, validación en backend y respuesta real. No botones simulados, permisos por apariencia ni éxito previo a guardar.
6. **Entrega:** indicar componentes, rutas, estado vacío/cargando/error/sin permiso, pruebas, capturas comparativas y diferencias justificadas con referencia visual.
7. No incluir secretos, credenciales ni material sin derechos de uso. Las decisiones de producto, permisos o infraestructura requieren autorización del responsable.

## Definition of Done visual

Un flujo integrado es navegable desde los menús correctos por el rol adecuado, funciona a 390 px y 1280 px, tiene accesibilidad básica y estados completos, y se comprueba con pruebas/recorrido. Las 12 vistas constituyen un inventario de diseño, **no 12 URLs obligatorias**.
