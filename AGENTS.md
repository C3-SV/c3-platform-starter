# Indicaciones para agentes que trabajen este repositorio

- Fuente funcional: bitácora C3 Platform (enlace en README); no inventar funciones ni rutas adicionales.
- Fuente visual: vistas y componentes desarrollados por Claude; no rediseñar estilos por cuenta propia.
- Hacer cortes pequeños y comprobables con datos persistentes; NO usar botones de simulación como si fuesen funciones reales.
- Firestore se deniega por defecto; validar cada lectura/escritura y cada estado del proceso. Nunca exponer credenciales privadas.
- Firma UI: V01–V12 según documentación. Las vistas no implican estrictamente 12 rutas.
- Una entrega vigente; no evaluar contenido todavía editable; publicación oficial separada de divulgación pública.
- No cargar datos personales históricos de Copa/HTC antes de plan de verificación, autorización y migración.
- Antes de merge: pruebas, build, revisar permisos, estados sin datos, responsive móvil.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
