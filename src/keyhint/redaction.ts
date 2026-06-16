const SENSITIVE_KEYS = new Set(['rawText', 'rawKeyStream', 'password', 'imeText']);

export function redactDiagnostics<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactDiagnostics(item)) as T;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redactDiagnostics(child);
  }
  return output as T;
}

export function assertRedacted(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (/secret|password-value|raw-key-stream|ime-composing/i.test(serialized)) {
    throw new Error('diagnostics still contain sensitive payload');
  }
}
