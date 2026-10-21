# Pendientes operativos (no bloquean la creación del repo)

## Necesarios antes de almacenar datos de usuarios reales

- Crear proyecto Firebase de desarrollo; habilitar Auth y Firestore en ubicación elegida según usuarios/costo.
- Definir cómo un miembro de C3 obtiene su rol administrativo, con claims confiables, no por editar Firestore desde el cliente.
- Mantener la revisión periódica de la API confiable y las reglas seguras para inscripciones, participaciones, equipos, entregas y resultados; las colecciones privadas siguen DENEGADAS por defecto.
- Probar reglas con emulador: joven A no ve entrega B, patrocinador no ve datos, revocación de jurado, resultado privado.
- Acordar texto legal mínimo: aviso de privacidad, términos, tratamiento de menores, permisos de fotografía/nombres cuando aplique y propiedad intelectual de soluciones (validación legal local).
- Propuestas sin cuenta: validación backend, mecanismo anti-spam y política de retención/contacto. NO habilitar endpoint público sin esas defensas.
- Decidir comunicación básica para pilotos (al menos confirmaciones y estados; manual primero si se documenta).
- Eliminación de cuentas: no habilitarla hasta definir cómo se retienen, anonimizan o eliminan las participaciones, entregas, evaluaciones y resultados oficiales, junto con la política de privacidad aplicable.

## Pendientes deliberadamente diferidos

- Datos personales históricos Copa 2026 y Hackathon Turismo Creativo: no migrar usuarios, participantes, equipos, entregas ni resultados; cualquier alcance futuro requiere fuentes, privacidad y plan aprobado.
- Proyecto Firebase real inicializado como `c3-platform-demo`: falta configurar las variables privadas de Vercel y revisar/desplegar reglas e índices después de una última aprobación.
- Perfil público compartible OPT-IN y sello de evidencia verificada, sin insinuar certificaciones no otorgadas.
- Piloto real: empresa, problema, participantes, fechas, métricas, capacidad de soporte.
- Filtros de catálogo y automatizaciones cuando exista suficiente volumen.

## Estado (corte 2)

- InspecciÃ³n de infraestructura (14-10-2026): el proyecto indicado `c3-platform-demo` existe, pero no tiene Web Apps Firebase y la API de Cloud Firestore estÃ¡ deshabilitada. Vercel tampoco estÃ¡ enlazado localmente; falta autenticaciÃ³n de la CLI y seleccionar el proyecto de Vercel.

- Listo y verificado con emuladores: autenticación, catálogo público, administración de experiencias y retos, reglas de Firestore que deniegan acceso directo, pruebas unitarias, de reglas/servicios y de recorridos.
- Listo y verificado con emuladores: Compite/Crea/Conecta, catálogo compartido, seed determinístico dry-run/apply protegido, dashboard Admin y consulta de entregas de solo lectura.
- Verificado en `c3-platform-demo`: Firestore `(default)` estándar en `us-central1` con protección contra borrado, Web App `C3 Platform` y Auth Email/Password habilitados. Pendientes: variables privadas/enlace de Vercel, reglas/índices reales y textos legales.
- Pendiente de CI: `.github/workflows/ci.yml` está escrito; no se ha ejecutado en GitHub porque el repositorio remoto todavía no existe.
- Repositorio remoto GitHub: pendiente de autenticación de la CLI (`gh auth login`) y de creación del repositorio privado `c3-platform`.
