// Worker エントリ（.chibivoid/entry.ts）から呼ばれる実行時の関数。
import type { ExecutionContext, Hono } from 'hono';

type WorkerEnv = Record<string, unknown>;

/** Hono アプリを Workers の `fetch` ハンドラーに変換する */
export function createWorkerFetch(app: Hono) {
  return (request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> => {
    return Promise.resolve(app.fetch(request, env, ctx));
  };
}
