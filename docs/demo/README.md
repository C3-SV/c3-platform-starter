# Demo de C3 Challenges · ensayo del 4-nov-2026

Esta carpeta reúne lo necesario para presentar la demo: el relato, las cuentas, el dataset y el checklist. El documento maestro de decisiones sigue siendo [UPDATE-2026-11-03-demo-integral](../UPDATE-2026-11-03-demo-integral.md).

**Todo lo que aparece en la demo es ficticio o de demostración.** Las empresas, las personas, los enlaces de entrega, las propuestas, las puntuaciones y los contactos no representan clientes, contratos ni contrataciones. La etiqueta **DEMO** y «Datos demostrativos» deben estar visibles en cada pantalla que los muestre.

## Dónde corre

- Proyecto Firebase: `c3-platform-demo`, el mismo que usa la aplicación. Decisión del responsable (3-nov-2026), registrada en [AGENTS §15](../../AGENTS.md).
- Dataset: `docs/demo/seed-manifest.json` (generado con `scripts/seed-manifest.mjs`). Versión 5 del seed: rúbrica ponderada y cuatro challenges (rutas, retail, fintech y conciliación). En `c3-platform-demo` está cargada la v4; la v5 espera autorización (plan §8). No contiene credenciales.

## Cuentas

| Rol | Correo | Qué ve |
| --- | --- | --- |
| Joven | `joven@demo.c3.com.sv` | Mi C3, su challenge, su bitácora, su defensa, la solicitud de contacto de la empresa y la retroalimentación publicada |
| Empresa | `empresa@demo.c3.com.sv` | Espacio de empresa, tablero de talento del challenge demo, lista corta y contacto |
| Administración | `admin@demo.c3.com.sv` | Consola de administración |

Las contraseñas no están en el repositorio ni en esta carpeta. Están en un archivo local fuera del repositorio que entrega el responsable por un canal seguro. Quien presenta debe conocer ese archivo; no se comparte por chat ni se proyecta.

Firebase Auth no envía correos en la demo: la recuperación de contraseña no está disponible.

## Recorrido de 60 segundos (empresa)

1. **0–10 s:** abrir `/empresa/proponer`. Decir: «La empresa cuenta una necesidad sin preparar un brief perfecto. No envía datos sensibles.»
2. **10–20 s:** entrar como empresa y abrir el challenge demo en `/empresa`. Decir: «C3 lo convirtió en un challenge con entregables y rúbrica.» Mostrar las cifras: inscritas, entregas recibidas y lista corta.
3. **20–38 s:** «Ver talento y lista corta». Mostrar la tabla de evidencia y una fila: entregable, proceso (bitácora y decisiones) y defensa, separados. Decir: «No solo vemos qué construyó, sino cómo llegó y si lo entiende.»
4. **38–52 s:** mostrar la lista corta con su motivo y la solicitud de contacto de Ana Martínez, aceptada. Decir: «La empresa decide a quién quiere conocer, y la persona decide si acepta.»
5. **52–60 s:** volver al deck. Decir: «Conecta el trabajo demostrado con una posible oportunidad, con consentimiento.»

## Recorrido de 60 segundos (joven)

1. Explorar challenges con los filtros de tipo, línea y estado.
2. Entrar como joven. En Mi challenge: la bitácora con dos avances (cargada en remoto el 4-nov-2026), la entrega enviada y la defensa.
3. Mostrar la solicitud de contacto de la empresa: aceptar o declinar. Aclarar que aceptar no es una oferta de empleo.
4. Mostrar que la retroalimentación sin publicar no aparece; solo se ve la publicada.

## Plan de respaldo

- **La demo en vivo falla:** usar capturas recientes de las mismas pantallas, etiquetadas «Captura de demo», y explicar lo que aún no funciona como prototipo.
- **Login caído:** mostrar la ruta pública `/empresa/proponer` y el detalle del challenge.
- **Nada se presenta como validación de mercado.** No hay ventas, clientes ni tracción reales.

## Checklist antes del ensayo

- [ ] Verificar que `demo.plat.c3.com.sv` muestra el dataset nuevo (y confirmar que lee `c3-platform-demo`).
- [ ] Iniciar sesión con las tres cuentas en navegadores separados.
- [ ] Confirmar la etiqueta DEMO en el challenge, la empresa y la lista corta.
- [ ] Revisar la home, `/explorar` y `/empresa` a 390 px y 1280 px.
- [ ] Ensayar el recorrido de empresa cronometrado (objetivo: 60 segundos).
- [ ] Tener las capturas de respaldo listas.

## Reset de datos demo

`scripts/demo-reset.mjs` lista, por defecto, los documentos de demostración del seed que borraría. No escribe nada en simulación. Con `--apply`, `--confirm-project` y `--backup-file` (ruta fuera del repo), guarda un respaldo JSON y después borra. Nunca toca cuentas de Auth, perfiles de personas reales ni experiencias históricas con procedencia (la Copa 2026 y las ediciones anteriores de C3).

## Estado de la evaluación en la demo

- Dos jurados asignados: la administradora demo y un jurado externo sin cuenta.
- Ana, Luis y Sofía tienen dos evaluaciones finalizadas cada una (de jurados distintos), así que las tres soluciones están completas. Diego tiene un borrador de entrega que no es visible para la empresa.
- El resultado está publicado con puntajes visibles **solo para esta demostración**; no muestra ganadores públicos. La empresa ve el promedio sobre 100 y la matriz por criterio. Con la rúbrica ponderada 20/30/25/25, Sofía promedia 72,5 y Ana, 85.
- Estos datos están en el seed (`src/lib/seed/seed-data.ts`). En `c3-platform-demo` están desde la v4, con la rúbrica ponderada 20/30/25/25 (plan §8).

## Pendiente antes de presentar

- Revisión visual a 390 px y 1280 px de las páginas nuevas (ver resultados de capturas en la sesión).
- Pruebas E2E: `e2e/zz-demo-talento.spec.ts` cubre en escritorio el tablero de talento, la bitácora, la solicitud de contacto, los filtros del catálogo y la intención de la propuesta con el enlace E1. No cubre la defensa ni la retroalimentación.
- E2E final de esta rama (escritorio y móvil): 217 pasan, 0 fallan y 23 se saltan porque cada prueba declara su proyecto. Antes se fallaba de forma intermitente en «Salir» de administración y en el recorrido de desbordes móviles. Causa: el menú de la cuenta se cierra al cambiar de ruta (la consola redirige de `/admin` a `/admin/resumen`), y la espera de red inactiva no era fiable con datos en vivo. Se corrigieron las pruebas, no la interfaz.
