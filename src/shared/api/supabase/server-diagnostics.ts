type DiagnosticValue = string | number | boolean | null | undefined;

type DiagnosticContext = Record<string, DiagnosticValue>;

function getSafeErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return undefined;
  }

  const code = error.code;

  if (typeof code !== "string" && typeof code !== "number") {
    return undefined;
  }

  const normalizedCode = String(code).slice(0, 80);
  return /^[a-z0-9_.-]+$/i.test(normalizedCode) ? normalizedCode : undefined;
}

function getSafeErrorStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return undefined;
  }

  return typeof error.status === "number" ? error.status : undefined;
}

export function getSafeServerErrorDiagnostic(error: unknown) {
  return {
    errorType: error instanceof Error ? error.name : typeof error,
    errorCode: getSafeErrorCode(error),
    errorStatus: getSafeErrorStatus(error),
  };
}

export function logServerDataError(event: string, error: unknown, context: DiagnosticContext = {}) {
  console.error({
    scope: "data_access",
    event,
    ...context,
    ...getSafeServerErrorDiagnostic(error),
  });
}

export function logServerConfigurationError(event: string, context: DiagnosticContext = {}) {
  console.error({
    scope: "configuration",
    event,
    ...context,
  });
}
