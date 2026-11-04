# Demo de C3 Challenges · ensayo del 4-nov-2026

Esta carpeta reúne lo necesario para presentar la demo: el relato, las cuentas, el dataset y el checklist. El documento maestro de decisiones sigue siendo [UPDATE-2026-11-03-demo-integral](../UPDATE-2026-11-03-demo-integral.md).

**Todo lo que aparece en la demo es ficticio o de demostración.** Las empresas, las personas, los enlaces de entrega, las propuestas, las puntuaciones y los contactos no representan clientes, contratos ni contrataciones. La etiqueta **DEMO** y «Datos demostrativos» deben estar visibles en cada pantalla que los muestre.

## Dónde corre

- Proyecto Firebase: `c3-platform-demo`, el mismo que usa la aplicación. Decisión del responsable (3-nov-2026), registrada en [AGENTS §15](../../AGENTS.md).
- Dataset: `docs/demo/seed-manifest.json` (generado con `scripts/seed-manifest.mjs`). Versión 2 del seed. No contiene credenciales.

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
2. Entrar como joven. En Mi challenge: la bitácora con dos avances, la entrega enviada y la defensa.
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

## Pendiente antes de presentar

- Reset de datos demo: no implementado. Hasta entonces, no se borra nada del proyecto remoto.
- Evaluaciones con puntajes y matriz por criterios: no implementadas. La cifra «En evaluación» no aparece.
- Revisión visual completa y pruebas E2E de los paneles nuevos.
