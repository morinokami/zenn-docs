// `import { kv } from 'chibivoid/kv'` で使う KV クライアント。
import { requireRuntimeBinding } from './env.ts';
import type { KVNamespaceLike } from './handler.ts';

export type KVClient = {
  get<T = unknown>(key: string): Promise<T | null>;
  put(key: string, value: unknown, options?: { ttl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
};

/** 呼ばれるたびに「今のリクエストの」KV バインディングを取り出す */
function namespace(): KVNamespaceLike {
  return requireRuntimeBinding<KVNamespaceLike>('KV');
}

/** 値を JSON にして保存し、取り出す際に JSON から戻す KV クライアント */
export const kv: KVClient = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await namespace().get(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  },
  async put(key, value, options) {
    await namespace().put(
      key,
      JSON.stringify(value),
      options?.ttl ? { expirationTtl: options.ttl } : undefined,
    );
  },
  async delete(key) {
    await namespace().delete(key);
  },
};
