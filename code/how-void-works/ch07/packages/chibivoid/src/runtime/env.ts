import { AsyncLocalStorage } from "node:async_hooks";

type RuntimeEnv = Record<string, unknown>;

/**
 * 「今処理しているリクエストの env」を覚えておく入れ物。
 * AsyncLocalStorage を使うと、await をまたいでも、同時に来た別のリクエストと混ざらない。
 */
const envContext = new AsyncLocalStorage<RuntimeEnv>();

/** fn の実行中（その中の await の先も含む）は、getRuntimeEnv() が env を返すようになる */
export function withRuntimeEnv<T>(env: RuntimeEnv, fn: () => T): T {
  return envContext.run(env, fn);
}

export function getRuntimeEnv(): RuntimeEnv {
  const env = envContext.getStore();
  if (!env) {
    throw new Error("env: リクエストの処理中以外では、バインディングにアクセスできません");
  }
  return env;
}

/** 名前を指定してバインディングを取り出す。なければ、わかりやすいエラーにする */
export function requireRuntimeBinding<T>(name: string): T {
  const value = getRuntimeEnv()[name];
  if (value === undefined || value === null) {
    throw new Error(`env: Cloudflare のバインディング '${name}' がありません`);
  }
  return value as T;
}
