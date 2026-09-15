import assert from "node:assert/strict";
import test from "node:test";

import { isDemoModeEnabled } from "../../src/shared/api/supabase/env.ts";
import { getSafeServerErrorDiagnostic } from "../../src/shared/api/supabase/server-diagnostics.ts";
import { mapGuestRequestFailureToPublicError } from "../../src/entities/request/model/request-result.ts";

test("demo mode is disabled unless BRONLY_DEMO_MODE is explicitly true", () => {
  const initialValue = process.env.BRONLY_DEMO_MODE;

  try {
    delete process.env.BRONLY_DEMO_MODE;
    assert.equal(isDemoModeEnabled(), false);

    process.env.BRONLY_DEMO_MODE = "false";
    assert.equal(isDemoModeEnabled(), false);

    process.env.BRONLY_DEMO_MODE = "1";
    assert.equal(isDemoModeEnabled(), false);

    process.env.BRONLY_DEMO_MODE = " TRUE ";
    assert.equal(isDemoModeEnabled(), true);
  } finally {
    if (initialValue === undefined) {
      delete process.env.BRONLY_DEMO_MODE;
    } else {
      process.env.BRONLY_DEMO_MODE = initialValue;
    }
  }
});

test("request infrastructure failures map to an explicit public error", () => {
  assert.equal(mapGuestRequestFailureToPublicError("service_unavailable"), "service");
  assert.equal(mapGuestRequestFailureToPublicError("save_failed"), "save");
  assert.equal(mapGuestRequestFailureToPublicError("availability_failed"), "availability");
  assert.equal(mapGuestRequestFailureToPublicError("room_not_suitable"), "suitability");
});

test("server diagnostics omit provider messages, stack traces, and unsafe codes", () => {
  const secret = "service-role-secret";
  const diagnostic = getSafeServerErrorDiagnostic({
    name: "PostgrestError",
    code: `unsafe ${secret}`,
    status: 503,
    message: `Supabase failed with ${secret}`,
    stack: `stack containing ${secret}`,
  });
  const serialized = JSON.stringify(diagnostic);

  assert.equal(diagnostic.errorType, "object");
  assert.equal(diagnostic.errorCode, undefined);
  assert.equal(diagnostic.errorStatus, 503);
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes("message"), false);
  assert.equal(serialized.includes("stack"), false);
});

test("server diagnostics preserve a bounded provider code for correlation", () => {
  assert.deepEqual(getSafeServerErrorDiagnostic({ code: "PGRST301", status: 401 }), {
    errorType: "object",
    errorCode: "PGRST301",
    errorStatus: 401,
  });
});
