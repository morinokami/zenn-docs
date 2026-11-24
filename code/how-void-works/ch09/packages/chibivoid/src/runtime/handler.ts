// Worker の中で使われる軽量なランタイム。
// `import { defineHandler } from 'chibivoid'` は、Worker ではこのファイルに解決される。
import type { Context, MiddlewareHandler, Next } from 'hono';

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
 * 戻り値の型 R を「型の上だけに存在するプロパティ」`__output` の型としてもつハンドラー。
 * 実行時にはただの関数だが、型の計算（InferProps やルートの型生成）がこのプロパティを読む。
 */
export type TypedHandler<R> = ((c: CloudContext) => unknown) & { readonly __output: R };

/**
 * ルートハンドラー・loader を定義する。
 * 実行時は何もしない恒等関数で、型を付けるためだけに存在する。
 */
export function defineHandler<R>(
  handler: (c: CloudContext) => R | Promise<R>,
): TypedHandler<Exclude<Awaited<R>, Response>> {
  return handler as TypedHandler<Exclude<Awaited<R>, Response>>;
}

/** Hono のミドルウェアに型を付ける（これも恒等関数） */
export function defineMiddleware(
  middleware: (c: CloudContext, next: Next) => Promise<void | Response>,
): MiddlewareHandler {
  return middleware;
}

/** loader の戻り値の型を取り出す: `type Props = InferProps<typeof loader>` */
export type InferProps<T> = T extends { readonly __output: infer R } ? R : never;
