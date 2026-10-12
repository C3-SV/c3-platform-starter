import test from "node:test";
import assert from "node:assert/strict";
import { canSubmit, canEvaluate, canSeeResult } from "../../src/lib/domain/workflows.ts";

const close = "2026-11-01T18:00:00-06:00";

test("solo inscripción aprobada entrega antes del cierre", () => {
  assert.equal(canSubmit({challengeStatus:"published",enrollmentStatus:"approved",submissionClosesAt:close,now:"2026-11-01T17:59:59-06:00"}),true);
  assert.equal(canSubmit({challengeStatus:"published",enrollmentStatus:"pending",submissionClosesAt:close,now:"2026-11-01T17:59:59-06:00"}),false);
  assert.equal(canSubmit({challengeStatus:"published",enrollmentStatus:"approved",submissionClosesAt:close,now:close}),false);
});

test("no se evalúa una entrega que aún puede cambiar", () => {
  assert.equal(canEvaluate({challengeStatus:"published",submissionStatus:"submitted",submissionClosesAt:close,now:"2026-11-01T17:59:59-06:00",assignedJudge:true}),false);
  assert.equal(canEvaluate({challengeStatus:"published",submissionStatus:"submitted",submissionClosesAt:close,now:close,assignedJudge:true}),true);
  assert.equal(canEvaluate({challengeStatus:"published",submissionStatus:"draft",submissionClosesAt:close,now:close,assignedJudge:true}),false);
  assert.equal(canEvaluate({challengeStatus:"published",submissionStatus:"submitted",submissionClosesAt:close,now:close,assignedJudge:false}),false);
});

test("la publicación oficial controla visibilidad", () => {
  assert.equal(canSeeResult({visibility:"public",isRecipient:false}),false);
  assert.equal(canSeeResult({publishedAt:close,visibility:"public",isRecipient:false}),true);
  assert.equal(canSeeResult({publishedAt:close,visibility:"authorized",isRecipient:false}),false);
  assert.equal(canSeeResult({publishedAt:close,visibility:"authorized",isRecipient:true}),true);
  assert.equal(canSeeResult({publishedAt:close,visibility:"private",isRecipient:true}),false);
});
