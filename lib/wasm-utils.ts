type WasmValue = Map<string, unknown> | unknown[] | unknown;

export function fromWasm<T>(value: WasmValue): T {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [key, entry] of Array.from(value.entries())) {
      obj[key] = fromWasm(entry);
    }
    return obj as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => fromWasm(entry)) as T;
  }

  return value as T;
}

export interface MatchOrderResult {
  fills: import('@/lib/types').Fill[];
  market: import('@/lib/types').Market;
}

export interface CancelOrderResult {
  removed: import('@/lib/types').Order | null;
  market: import('@/lib/types').Market;
}
