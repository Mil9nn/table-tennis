import mongoose from "mongoose";

/**
 * Recursively convert Mongoose docs / Maps / nested values into JSON-safe shapes.
 * **Must** handle `Date` and `ObjectId` before generic object walks — otherwise they
 * serialize to `{}` via `Object.entries`.
 */
export function serializeForClient<T = unknown>(input: T): T {
  if (input == null) return input;

  if (input instanceof Date) {
    return input.toISOString() as T;
  }

  if (input instanceof mongoose.Types.ObjectId) {
    return String(input) as T;
  }

  if (input instanceof Map) {
    return Object.fromEntries(
      Array.from(input.entries()).map(([k, v]) => [String(k), serializeForClient(v)])
    ) as T;
  }

  if (Array.isArray(input)) {
    return input.map((v) => serializeForClient(v)) as T;
  }

  if (typeof input === "object") {
    const maybeDoc = input as {
      toObject?: (opts?: unknown) => unknown;
    };
    if (typeof maybeDoc.toObject === "function") {
      return serializeForClient(
        maybeDoc.toObject({ flattenMaps: true, virtuals: true })
      ) as T;
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = serializeForClient(v);
    }
    return out as T;
  }

  return input;
}
