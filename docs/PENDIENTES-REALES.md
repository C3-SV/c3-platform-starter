# Pendientes operativos (no bloquean la creación del repo)

## Necesarios antes de almacenar datos de usuarios reales

- Crear proyecto Firebase de desarrollo; habilitar Auth y Firestore en ubicación elegida según usuarios/costo.
- Definir cómo un miembro de C3 obtiene su rol administrativo, con claims confiables, no por editar Firestore desde el cliente.
- Implementar API confiable o reglas seguras para inscripciones, participaciones, equipos, entregas y resultados; las colecciones privadas están DENEGADAS por defecto.
- Probar reglas con emulador: joven A no ve entrega B, patrocinador no ve datos, revocación de jurado, resultado privado.
- Acordar texto legal mínimo: aviso de privacidad, términos, tratamiento de menores, permisos de fotografía/nombres cuando aplique y propiedad intelectual de soluciones (validación legal local).
- Propuestas sin cuenta: validación backend, mecanismo anti-spam y política de retención/contacto. NO habilitar endpoint público sin esas defensas.
- Decidir comunicación básica para pilotos (al menos confirmaciones y estados; manual primero si se documenta).

## Pendientes deliberadamente diferidos

- Datos históricos Copa 2026 y Hackathon Turismo Creativo: identificar fuentes y campos; verificar resultados; consentimiento/menores; vincular trayectorias a cuentas; ejecutar migración solo con plan aprobado.
- Perfil público compartible OPT-IN y sello de evidencia verificada, sin insinuar certificaciones no otorgadas.
- Piloto real: empresa, problema, participantes, fechas, métricas, capacidad de soporte.
- Filtros de catálogo y automatizaciones cuando exista suficiente volumen.

## Estado (corte 1)

- Listo y verificado con emuladores: autenticación, catálogo público, administración de experiencias y retos, reglas de Firestore que deniegan acceso directo, pruebas unitarias, de reglas/servicios y de recorridos.
- Pendiente: proyecto Firebase real, textos legales (términos y privacidad), backend de inscripciones y entregas, equipos, propuestas de empresa, evaluación y resultados (cortes 2–5).
- Pendiente de CI: `.github/workflows/ci.yml` está escrito; no se ha ejecutado en GitHub porque el repositorio remoto todavía no existe.
- Repositorio remoto GitHub: pendiente de autenticación de la CLI (`gh auth login`) y de creación del repositorio privado `c3-platform`.
