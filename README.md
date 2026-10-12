# C3 Platform — Starter técnico

> C3: Compite · Crea · Conecta. Primer producto demostrable: C3 Challenges. El diseño de las vistas está a cargo de Claude; aquí se crea una base técnica neutral para integrarlo después.

## Estado real

**Starter inicial, NO un MVP operativo.** El repositorio contiene Next.js/TypeScript, modelos conceptuales, validaciones puras de flujo, seguridad Firestore restrictiva y documentación. No contiene los diseños de Claude ni un backend de inscripciones listo para producción. No hay Firebase conectado ni repositorio remoto confirmado.

## Tecnologías

- Node.js 22+
- Next.js 16.4 / App Router y React 19.3
- TypeScript 5.9 (compatibilidad estable)
- Firebase Web SDK 13 (Auth/Firestore), Firebase Admin para rutas confiables
- Cloud Firestore con reglas que deniegan por defecto

**Nota de seguridad (oct. 2026):** revisar parches de Next.js antes de desplegar; el 14 de octubre de 2026 está previsto un aviso de seguridad upstream. No fijar dependencias obsoletas en producción.

## Primer arranque local

```bash
npm install
cp .env.example .env.local
# Crear proyecto Firebase de DESARROLLO y completar las variables públicas
npm run dev
```

Abrir `http://localhost:3000`; `http://localhost:3000/api/health` devuelve estado `scaffold`, **no** indica servicios conectados.

Pruebas del dominio sin Firebase: `npm test` (Node 22). Tras instalar: `npm run typecheck` y `npm run build`.

> Este entorno de creación no tenía acceso al registro npm, por lo que **no se ha ejecutado `npm install` ni verificado `next build`**. Instalar y validar al subir el repositorio.

## Primer repositorio GitHub

Sugerimos **`c3-platform` privado** inicialmente. En un directorio con este proyecto (incluye `.git` local):

```bash
# GitHub repo debe existir en tu cuenta/organización, privado y VACÍO.
git remote add origin https://github.com/<OWNER>/c3-platform.git
git push -u origin main
```

No reemplazar `<OWNER>` por una cuenta inventada. Si se crea desde GitHub UI, hacerlo **sin README ni .gitignore iniciales** para evitar conflictos de historia. Conectar GitHub a ChatGPT permitirá publicar cambios directamente cuando esté disponible.

## Documentación

- `docs/PLAN-CONSTRUCCION.md`: orden real de los cortes funcionales y pruebas.
- `docs/CONTRATO-CLAUDE.md`: cómo integrar los componentes de Claude sin duplicar código.
- `docs/PENDIENTES-REALES.md`: privacidad, seguridad, propuesta pública, migración diferida, piloto.
- `src/lib/domain/`: entidades e invariantes conceptuales.

## Criterios

- Un solo núcleo de datos, múltiples contextos.
- Una inscripción por experiencia; un equipo pertenece a una experiencia.
- Entregas en texto y enlaces, sin archivos; no evaluar una entrega editable.
- La empresa propone sin cuenta, pero acceso a entregas/evaluación requiere autorización.
- C3 valida y publica oficialmente resultados; dato autodeclarado no equivale a evidencia.
- Vistas y acciones reales, responsive móvil desde el primer corte.

Bitácora vigente: https://docs.google.com/document/d/1Ci2TMUZ1z6R9uBvpyeMPO1t1HnwcSaOi_09YWsbG6QE/edit
