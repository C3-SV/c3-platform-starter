# C3 ecosystem, catalog and Firebase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved C3 ecosystem extension on branch `dev`, with shared catalog lines, Compite/Crea/Conecta routes, reproducible Firebase seed, read-only Admin deliveries, and verified navigation/security.

**Architecture:** Preserve the existing `experiences`/`challenges` model and Firebase Admin server boundary. Add optional line/provenance fields with legacy fallbacks, a shared server catalog projection, a shared institutional page/card layer, deterministic seed tooling, and Admin read-only delivery queries. Keep Firestore client rules deny-all and avoid new dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Firebase Admin SDK, Firebase Emulator Suite, Node test runner, Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-10-14-c3-ecosistema-firebase-admin-design.md`

## Global Constraints

- Preserve the existing 12 functional capabilities and Claude-derived visual language.
- Keep Firestore client rules deny-all; all private reads/writes go through verified Firebase Admin server code.
- Do not write to Firebase real, deploy rules/indexes, migrate personal historical data, or push.
- Use deterministic seed IDs; never delete data or overwrite documents outside the seed namespace.
- Demo records must be visibly marked and must not imply official convocatorias or results.
- Use `npm.cmd` on Windows because PowerShell execution policy blocks `npm.ps1`.
- New production behavior follows TDD: write and observe a failing test before implementation.

## Review Focus

- Legacy experience documents without line fields must still render with the kind-derived line.
- A secondary-line experience must appear on both institutional pages exactly once, without duplicate Firestore documents.
- Closed/cancelled experiences and closed registration windows must never permit new enrollment.
- A second seed run must report existing deterministic documents and perform zero writes.
- Admin delivery data must not expose drafts to public/participant endpoints and must not expose an edit operation.

---

### Task 1: Domain line classification and catalog projection

**Files:**
- Create: `src/lib/domain/catalog.ts`
- Create: `tests/unit/catalog.test.ts`
- Modify: `src/lib/domain/types.ts`
- Modify: `src/lib/domain/validation.ts`
- Modify: `src/lib/domain/presentation.ts`
- Modify: `src/lib/server/catalog.ts`
- Modify: `tests/emulator/catalog.test.ts`

**Interfaces:**
- Produces `ExperienceLine`, `experienceLinesOf(experience)`, `isInExperienceLine(experience, line)`, and `presentExperienceState(...)` for UI and server catalog consumers.
- `Experience` gains optional-compatible line/provenance fields while retaining `kind` as the legacy fallback.
- Public catalog projections expose primary/secondary lines, `isDemo`, and source metadata without internal author fields.

- [ ] **Step 1: Write failing unit tests** for legacy kind fallback, primary/secondary membership, demo metadata normalization, and the visible state labels `Próximo`, `Abierto`, `En desarrollo`, `Concluido`, and `Cancelado`.
- [ ] **Step 2: Run `npm.cmd test -- tests/unit/catalog.test.ts`** and confirm failure because the new domain API is absent.
- [ ] **Step 3: Implement the minimal domain types, parsers, fallback mapping, and catalog projection.** Preserve existing validation and status semantics; do not change enrollment authorization in this task.
- [ ] **Step 4: Run the focused unit tests and existing catalog emulator tests; confirm pass.**
- [ ] **Step 5: Run `npm.cmd test` and commit `feat: add shared experience line classification`.

### Task 2: Deterministic seed dataset and CLI

**Files:**
- Create: `src/lib/seed/seed-data.ts`
- Create: `src/lib/seed/seed-plan.ts`
- Create: `scripts/seed.mjs`
- Create: `tests/unit/seed.test.ts`
- Create: `tests/emulator/seed.test.ts`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- `seed-data.ts` exports validated seed records and deterministic IDs for experiences/challenges.
- `seed-plan.ts` exports `buildSeedPlan(existingIds, records)` returning `{toCreate, existing, conflicts, writes}` without mutating data.
- `scripts/seed.mjs` accepts `--project`, `--confirm-project`, `--allow-write`, and `--emulator`; dry-run is the default and apply refuses missing/ambiguous authorization.

- [ ] **Step 1: Write failing unit tests** for stable IDs, official source URLs, visible demo flags/notes, invalid records, and zero planned writes when all deterministic IDs already exist.
- [ ] **Step 2: Run the focused tests** and confirm failure because the dataset/planner is absent.
- [ ] **Step 3: Implement the dataset and pure seed planner.** Include only facts supported by C3/Copa/HTC public sources; leave unavailable facts absent.
- [ ] **Step 4: Implement the Firebase Admin CLI.** In dry-run, list destination, existing IDs, conflicts, and planned writes. In apply, use `create()` only for seed-owned IDs and require project identity repeated exactly plus `--allow-write`.
- [ ] **Step 5: Add `seed:dry-run` and `seed:apply` scripts and document emulator usage.**
- [ ] **Step 6: Write/run emulator tests** that seed, query the catalog, seed again, and assert no duplicates and correct line/reference metadata.
- [ ] **Step 7: Run unit + emulator seed tests and commit `feat: add deterministic firebase seed tooling`.

### Task 3: Shared institutional pages and global navigation

**Files:**
- Create: `src/lib/content/lineLanding.ts`
- Create: `src/components/ExperienceCard.tsx`
- Create: `src/components/LineLandingPage.tsx`
- Create: `src/app/compite/page.tsx`
- Create: `src/app/crea/page.tsx`
- Create: `src/app/conecta/page.tsx`
- Create: `e2e/ecosistema.spec.ts`
- Modify: `src/components/SiteHeader.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/explorar/page.tsx`
- Modify: `src/app/retos/[challengeId]/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- `LineLandingPage` receives a line config and the shared public catalog projection; it renders hero, explanation, highlighted/past cards, participation flow, and CTA.
- `ExperienceCard` renders state/source/demo labels and links internally to a challenge or externally to the verified source.
- Header navigation exposes Home, Explorar, Compite, Crea, Conecta, Empresas, and conditional Acceso/Mi C3/Admin.

- [ ] **Step 1: Write failing route/navigation tests** in `e2e/ecosistema.spec.ts` for all three routes, header links, logo, demo label, source link, and mobile no-overflow.
- [ ] **Step 2: Run the new Playwright spec against the current build** and confirm the new routes/links fail.
- [ ] **Step 3: Implement shared content configuration, card, landing template, and routes** using existing tokens and catalog calls; keep source/demo facts out of page-local event arrays.
- [ ] **Step 4: Update header/footer/Home/Explorar/Detalle links** and add only localized responsive CSS needed for navigation and cards.
- [ ] **Step 5: Run the focused Playwright spec, axe checks for new routes, and unit suite.**
- [ ] **Step 6: Commit `feat: add compite crea conecta catalog pages`.

### Task 4: Admin dashboard and read-only deliveries

**Files:**
- Create: `src/app/admin/EntregasPanel.tsx`
- Create: `src/app/admin/ResumenPanel.tsx`
- Create: `src/app/api/admin/entregas/route.ts`
- Create: `src/app/api/admin/resumen/route.ts`
- Create: `tests/emulator/admin-deliveries.test.ts`
- Modify: `src/lib/server/participation.ts`
- Modify: `src/lib/server/catalog.ts`
- Modify: `src/app/admin/AdminPanel.tsx`
- Modify: `e2e/corte5.spec.ts` or create `e2e/admin.spec.ts`

**Interfaces:**
- `listAdminDeliveries(db, actor, filters)` returns challenge, experience, participant/team authorization context, status, timestamps, links, and audit fields; it calls `requireAdmin` and has no mutation counterpart.
- `getAdminSummary(db, actor)` returns basic counts for experiences, proposals, pending enrollments, submissions, and evaluations.
- GET `/api/admin/entregas` and GET `/api/admin/resumen` require a verified admin actor.

- [ ] **Step 1: Write failing emulator tests** for admin-only delivery listing, participant/team context, draft/submitted status, filters, summary counts, and rejection for non-admin.
- [ ] **Step 2: Run focused emulator tests** and confirm failure because the service/API is absent.
- [ ] **Step 3: Implement server queries with bounded enrichment and explicit admin checks.** Do not add update/delete endpoints.
- [ ] **Step 4: Implement Admin panels** with loading, empty, error, status, timestamps, source links, and traceability copy; keep the existing visual system.
- [ ] **Step 5: Add Admin e2e coverage** for summary, deliveries, and non-editable UI.
- [ ] **Step 6: Run emulator/unit/e2e tests and commit `feat: add admin delivery operations`.

### Task 5: Targeted refinement and security regression coverage

**Files:**
- Modify: `src/app/trayectoria/TrayectoriaPanel.tsx`
- Modify: `src/app/empresa/EmpresaPanel.tsx`
- Modify: `src/app/mi-c3/retos/[challengeId]/EntregaPanel.tsx`
- Modify: `src/app/empresa/retos/[challengeId]/evaluacion/page.tsx`
- Modify: `src/app/admin/forms.tsx`
- Modify: `src/lib/server/auth.ts`
- Modify: `src/lib/server/participation.ts`
- Modify: `tests/unit/workflows.test.ts`
- Modify: `tests/emulator/rules.test.ts`
- Modify: relevant `e2e/corte*.spec.ts`

- [ ] **Step 1: Add failing regression tests** for closed enrollment/submission windows, V07 draft/submit confirmation, V08 empty/loading/error states, V09 no-organization isolation, V11 revoked judge access, and Admin-only mutations.
- [ ] **Step 2: Run the focused tests** and classify each failure using systematic debugging before changing code.
- [ ] **Step 3: Apply localized fixes only where the test demonstrates a defect;** preserve existing contracts and messages.
- [ ] **Step 4: Run unit, emulator rules, and focused e2e suites; commit `fix: harden c3 workflows and state feedback`.

### Task 6: Full verification and technical handoff

**Files:**
- Modify: `README.md`
- Modify: `docs/PENDIENTES-REALES.md`
- Modify: `next-env.d.ts` only if generated by the final Next version and required by the build
- Create: `docs/superpowers/reports/2026-10-14-c3-verification.md` only if a concise machine-readable result is needed

- [ ] **Step 1: Run `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run test:rules`, `npm.cmd run test:e2e`, and `npm.cmd run build`; capture exact results.
- [ ] **Step 2: Run `npm.cmd run seed:dry-run -- --project demo-c3-platform --emulator` and verify zero external writes; run emulator apply only through an explicit local command.
- [ ] **Step 3: Audit `firestore.rules` and all new routes with the installed Firebase security auditor guidance; keep deny-all if no direct client access is required.
- [ ] **Step 4: Run `git diff --check`, inspect status, and update only technical docs with verified results and the real Firebase 403 blocker.
- [ ] **Step 5: Commit `docs: record c3 ecosystem verification` and perform a final self-review of the branch against the spec and Review Focus.

