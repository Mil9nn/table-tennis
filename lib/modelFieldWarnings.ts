type WarnContext = Record<string, unknown> | undefined;

declare global {
  // eslint-disable-next-line no-var
  var __legacyModelFieldWarnings: Set<string> | undefined;
}

function getWarningSet(): Set<string> {
  if (!globalThis.__legacyModelFieldWarnings) {
    globalThis.__legacyModelFieldWarnings = new Set<string>();
  }
  return globalThis.__legacyModelFieldWarnings;
}

/**
 * Log deprecated model-field usage once per process key.
 */
export function warnDeprecatedModelFieldOnce(
  key: string,
  message: string,
  context?: WarnContext,
): void {
  const warnings = getWarningSet();
  if (warnings.has(key)) return;
  warnings.add(key);

  if (context) {
    console.warn(`[model-deprecation] ${message}`, context);
    return;
  }
  console.warn(`[model-deprecation] ${message}`);
}
