// Worker の中で使われる軽量なランタイム。
// `import { defineHandler } from "chibivoid"` は、Worker ではこのファイルに解決される。
import type { Context } from "hono";

/** ハンドラーが受け取るコンテキスト（Hono の Context） */
export type CloudContext = Context;

/**
 * ルートハンドラーを定義する。
 * 実行時は何もしない恒等関数で、引数 c に型を付けるためだけに存在する。
 */
export function defineHandler<R>(handler: (c: CloudContext) => R): (c: CloudContext) => R {
  return handler;
}
