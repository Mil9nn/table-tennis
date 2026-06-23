type JsonLike =
  | null
  | string
  | number
  | boolean
  | JsonLike[]
  | { [key: string]: JsonLike };

function tryHexFromByteArray(bytes: number[]): string | null {
  if (bytes.length !== 12) return null;
  if (bytes.some((b) => !Number.isInteger(b) || b < 0 || b > 255)) return null;
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function objectValuesAsBytes(obj: Record<string, unknown>): number[] | null {
  const keys = Object.keys(obj).sort((a, b) => Number(a) - Number(b));
  if (keys.length !== 12) return null;
  if (!keys.every((k, idx) => k === String(idx))) return null;
  const bytes = keys.map((k) => Number(obj[k]));
  return bytes.every((n) => Number.isFinite(n)) ? bytes : null;
}

function normalizeIdObject(obj: Record<string, unknown>): string | null {
  // Native ObjectId wrappers
  if (typeof (obj as any).toHexString === "function") {
    try {
      const hex = (obj as any).toHexString();
      if (typeof hex === "string" && hex.length) return hex;
    } catch {
      // ignore
    }
  }

  if (typeof obj.$oid === "string" && obj.$oid.length) return obj.$oid;

  // Common Buffer forms: { buffer: { 0: 1, ... 11: 255 } } or { buffer: { data: [...] } }
  if (obj.buffer && typeof obj.buffer === "object") {
    const bufferObj = obj.buffer as Record<string, unknown>;
    if (Array.isArray(bufferObj.data)) {
      const bytes = bufferObj.data.map((v) => Number(v));
      const hex = tryHexFromByteArray(bytes);
      if (hex) return hex;
    }
    const maybeBytes = objectValuesAsBytes(bufferObj);
    if (maybeBytes) {
      const hex = tryHexFromByteArray(maybeBytes);
      if (hex) return hex;
    }
  }

  // Alternate Buffer payload
  if (obj.type === "Buffer" && Array.isArray(obj.data)) {
    const bytes = obj.data.map((v) => Number(v));
    const hex = tryHexFromByteArray(bytes);
    if (hex) return hex;
  }

  // Some libs serialize ObjectId directly as {0:..,1:..,...11:..}
  const maybeBytes = objectValuesAsBytes(obj);
  if (maybeBytes) {
    const hex = tryHexFromByteArray(maybeBytes);
    if (hex) return hex;
  }

  return null;
}

export function normalizeForApi(input: unknown): JsonLike {
  if (input == null) return null;
  if (
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return input;
  }
  if (input instanceof Date) return input.toISOString();

  if (input instanceof Map) {
    return Object.fromEntries(
      Array.from(input.entries()).map(([k, v]) => [String(k), normalizeForApi(v)])
    ) as JsonLike;
  }

  if (Array.isArray(input)) return input.map((v) => normalizeForApi(v));

  if (typeof input === "object") {
    const maybeDoc = input as any;
    if (typeof maybeDoc.toObject === "function") {
      return normalizeForApi(
        maybeDoc.toObject({
          flattenMaps: true,
          virtuals: true,
          getters: true,
        })
      );
    }

    const idHex = normalizeIdObject(input as Record<string, unknown>);
    if (idHex) return idHex;

    const out: Record<string, JsonLike> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = normalizeForApi(v);
    }
    return out;
  }

  return String(input);
}

