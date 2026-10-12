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

## Estado del starter

- Listo: estructura Git local, Next/TS declarado, variables ejemplo, Firebase SDK aislado, reglas Firestore **denegar por defecto**, modelos conceptuales, tests unitarios del flujo, manual de integración Claude.
- No listo: dependencias instaladas, build real, credenciales Firebase, backend de operaciones, interfaz de Claude, repositorio remoto GitHub, despliegue.
- CI/lockfile: al tener internet ejecutar `npm install`, confirmar build y tests, agregar `package-lock.json` al primer push, y configurar CI con `npm ci`.
