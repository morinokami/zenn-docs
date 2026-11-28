// Worker の中で使われる軽量なランタイム。
// `import { defineHandler } from "chibivoid"` は、Worker ではこのファイルに解決される。
import type { Context, MiddlewareHandler, Next } from "hono";

/** KV ネームスペースのうち、chibivoid が使う部分だけの型 */
export type KVNamespaceLike = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
};

/** Worker に渡される `env`（バインディング）の型 */
export type CloudBindings = {
  KV: KVNamespaceLike;
  [key: string]: unknown;
};

/** ハンドラーが受け取るコンテキスト（Hono の Context に Bindings の型を付けたもの） */
export type CloudContext = Context<{ Bindings: CloudBindings }>;

/**
 * ルートハンドラーを定義する。
 * 実行時は何もしない恒等関数で、引数 c に型を付けるためだけに存在する。
 */
export function defineHandler<R>(handler: (c: CloudContext) => R): (c: CloudContext) => R {
  return handler;
}

/** Hono のミドルウェアに型を付ける（これも恒等関数） */
export function defineMiddleware(
  middleware: (c: CloudContext, next: Next) => Promise<void | Response>,
): MiddlewareHandler {
  return middleware;
}
