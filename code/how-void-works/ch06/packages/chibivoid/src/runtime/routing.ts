// 生成されたルートテーブル（virtual:chibivoid-routes）と Worker エントリから呼ばれる実行時の関数。
import type { Context, ExecutionContext, Hono } from 'hono';
import { withRuntimeEnv } from './env.ts';
import { convertReturnValue } from './response.ts';

type RouteModule = Record<string, ((c: Context) => unknown) | undefined>;

/**
 * `() => import(...)` を包んで、モジュールを遅延ロードする関数を作る。
 * cache が true なら 2 回目以降は同じモジュールを返す。
 * 開発中は毎回インポートし直すことで、ファイルの変更がすぐ反映されるようにする。
 */
export function createModuleLoader<T>(load: () => Promise<T>, cache: boolean): () => Promise<T> {
  let loaded: Promise<T> | undefined;
  return () => {
    if (!cache) {
      return load();
    }
    loaded ??= load();
    return loaded;
  };
}

/** routes/ のファイルの `export const GET = ...` を呼び出す Hono ハンドラーを作る */
export function createHttpRouteHandler(load: () => Promise<RouteModule>, method: string) {
  return async (c: Context): Promise<Response> => {
    const handler = (await load())[method];
    if (!handler) {
      return c.text('Method Not Allowed', 405);
    }
    return convertReturnValue(await handler(c));
  };
}

type WorkerEnv = Record<string, unknown>;

/**
 * Hono アプリを Workers の `fetch` ハンドラーに変換する。
 * リクエストの処理全体を withRuntimeEnv で包むことで、
 * `chibivoid/kv` などがどこからでも今のリクエストの env を読むことができるようになる。
 */
export function createWorkerFetch(app: Hono) {
  return (request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> => {
    return withRuntimeEnv(env, async () => app.fetch(request, env, ctx));
  };
}
