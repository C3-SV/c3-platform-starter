# C3 Platform: ecosistema, catálogo y Firebase

## Objetivo

Extender el MVP existente con las líneas Compite, Crea y Conecta, un catálogo
compartido, seed reproducible para emuladores/Firebase, y una operación Admin
más completa, sin reconstruir el frontend ni abrir accesos directos a Firestore.

## Alcance y restricciones

- Se conserva Next.js App Router, TypeScript, Firebase Admin SDK, Auth y soporte de emuladores.
- Se conservan las 12 capacidades existentes y sus contratos de permisos.
- Las páginas nuevas son rutas institucionales que consultan el mismo catálogo que Home, Explorar y Detalle.
- No se agregan mensajería, bolsa de trabajo, CRM, perfiles empresariales avanzados ni migración de datos personales.
- No se escribirá en Firebase real, no se desplegarán reglas/índices y no se hará push durante esta etapa.

## Catálogo y dominio

`Experience` mantiene `kind` para compatibilidad y agrega campos opcionales:

- `primaryLine`: `compite | crea | conecta`.
- `secondaryLines`: arreglo de líneas, sin duplicar documentos.
- `isDemo`, `sourceUrl` y `sourceLabel` para distinguir datos demostrativos y conservar procedencia.

Los documentos existentes hacen fallback de línea desde `kind`. Las páginas
filtran por `primaryLine` o `secondaryLines`; un reto empresarial puede tener
`crea` como línea principal y `conecta` como relación secundaria sin alterar
la colección `challenges`.

El estado administrativo continúa separado del estado visible. Se mantienen
`draft`, `published`, `closed` y `cancelled`; la presentación calcula
Próximamente, Inscripción abierta, En desarrollo, Concluida o Cancelada desde
estado y ventanas temporales. Una experiencia concluida no habilita nuevas
inscripciones. Las fechas se muestran como fechas, no como sustituto de un
estado administrativo.

El catálogo público devuelve únicamente experiencias publicadas y retos
publicados cuyo padre está publicado. Los campos internos no se serializan.

## Experiencias institucionales

Se crea una plantilla compartida para las tres líneas con:

1. Hero y CTA funcional.
2. Explicación de la línea.
3. Experiencias destacadas y pasadas desde el catálogo.
4. Sección de participación.
5. Cierre con navegación a Explorar, Empresas o propuesta según corresponda.

Las tarjetas reutilizan tokens, `StatePill`, etiquetas y enlaces existentes.
Las demos muestran “Demo” y una nota de propuesta; los registros oficiales
conservan `sourceUrl`/`sourceLabel`. No se inventan resultados, participantes
ni fechas ausentes en las fuentes públicas.

## Navegación y accesibilidad

`SiteHeader` y `Footer` incorporan Home, Explorar, Compite, Crea, Conecta,
Empresas y Acceso/Mi C3. El logo sigue enlazando a Home. La navegación se
envuelve de forma responsive y cada control es un enlace o acción real. Se
mantienen los tokens y la jerarquía visual de Claude; no se introduce un
sistema de componentes paralelo.

## Seed reproducible

Los datos viven en un dataset versionado con IDs determinísticos y procedencia.
El script usa Firebase Admin SDK y soporta emulador mediante las variables
existentes.

- `npm run seed:dry-run -- --project <id>` exige proyecto explícito, lee documentos con IDs del seed y muestra destino, existentes, conflictos y escrituras previstas.
- `npm run seed:apply -- --project <id> --confirm-project <id> --allow-write` exige identidad repetida, validación y autorización inequívoca.
- Apply solo crea documentos pertenecientes al namespace del seed; no sobrescribe documentos ajenos, no elimina y no migra usuarios, equipos, entregas ni resultados privados.
- Una segunda ejecución no produce duplicados.

El dataset incluirá registros verificables basados en C3, Copa y HTC Vol. 1,
más demos explícitas para Taller de Programación Competitiva, HTC Vol. 2,
un challenge empresarial ficticio y Encuentro C3: Talento e industria.

## Admin

Se agrega un resumen básico con conteos de experiencias, propuestas,
inscripciones pendientes, entregas y evaluaciones. La sección Entregas será
consultable por administradores y mostrará reto, estado, participante/equipo,
fechas, enlaces y trazabilidad. No tendrá edición destructiva ni mutación sin
un evento auditable. Las operaciones existentes de catálogo, propuestas,
inscripciones, jurados y resultados conservan sus comprobaciones servidor-side.

## Seguridad

Se conserva Firestore `deny all` para clientes. Cada endpoint nuevo llama a
`requestActor`, verifica el token con revocación y exige `requireAdmin` donde
corresponde. El acceso a entregas y datos privados queda filtrado por actor o
administrador. Se auditarán reglas y rutas sin debilitarlas.

## Verificación

Se ampliarán pruebas unitarias, emulator y Playwright para cubrir:

- clasificación primaria/secundaria y estados;
- seed en emulador, dry-run, idempotencia y referencias;
- entregas visibles solo al actor autorizado y Admin de solo lectura;
- rutas nuevas en escritorio/móvil, enlaces globales, loading, vacío y error;
- axe-core, typecheck, lint y build de producción.

## Fuentes verificadas

- C3: https://c3.com.sv/
- Copa Salvadoreña de Programación: https://copa.c3.com.sv/
- Hackathon de Turismo Creativo Vol. 1: https://hackathon.c3.com.sv/

