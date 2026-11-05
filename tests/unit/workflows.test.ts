import test from "node:test";
import assert from "node:assert/strict";
import { canSubmit, canEvaluate, canSeeResult } from "../../src/lib/domain/workflows.ts";

const close = "2026-11-01T18:00:00-06:00";

test("solo inscripción aprobada entrega antes del cierre", () => {
  assert.equal(canSubmit({challengeStatus:"published",enrollmentStatus:"approved",submissionClosesAt:close,now:"2026-11-01T17:59:59-06:00"}),true);
  assert.equal(canSubmit({challengeStatus:"published",enrollmentStatus:"pending",submissionClosesAt:close,now:"2026-11-01T17:59:59-06:00"}),false);
  assert.equal(canSubmit({challengeStatus:"published",enrollmentStatus:"approved",submissionClosesAt:close,now:close}),false);
});

test("un jurado asignado evalúa una entrega enviada aunque las entregas sigan abiertas", () => {
  assert.equal(canEvaluate({challengeStatus:"published",submissionStatus:"submitted",assignedJudge:true}),true);
  assert.equal(canEvaluate({challengeStatus:"published",submissionStatus:"draft",assignedJudge:true}),false);
  assert.equal(canEvaluate({challengeStatus:"published",submissionStatus:"submitted",assignedJudge:false}),false);
  assert.equal(canEvaluate({challengeStatus:"cancelled",submissionStatus:"submitted",assignedJudge:true}),false);
  assert.equal(canEvaluate({challengeStatus:"closed",submissionStatus:"submitted",assignedJudge:true}),false);
});

test("la publicación oficial controla visibilidad", () => {
  assert.equal(canSeeResult({visibility:"public",isRecipient:false}),false);
  assert.equal(canSeeResult({publishedAt:close,visibility:"public",isRecipient:false}),true);
  assert.equal(canSeeResult({publishedAt:close,visibility:"authorized",isRecipient:false}),false);
  assert.equal(canSeeResult({publishedAt:close,visibility:"authorized",isRecipient:true}),true);
  assert.equal(canSeeResult({publishedAt:close,visibility:"private",isRecipient:true}),false);
});
