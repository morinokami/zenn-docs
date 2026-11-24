/**
 * `.chibivoid/entry.ts`（Worker のエントリ）のソースコードを生成する。
 * 仮想モジュール `virtual:chibivoid-routes` がエクスポートする Hono アプリを、
 * Workers の `fetch` ハンドラーとして公開するだけの薄いファイル。
 */
export function compileWorkerEntry(): string {
  return `// chibivoid が自動生成したファイルです。編集しないでください。
import app from 'virtual:chibivoid-routes';
import { createWorkerFetch } from 'chibivoid/runtime/routing';

export default {
  fetch: createWorkerFetch(app),
};
`;
}

/**
 * 仮想モジュール `virtual:chibivoid-routes` のソースコードを生成する。
 * 今はまだ固定の Hono アプリを返す（第 4 章で routes/ から生成するように変える）。
 */
export function compileRouteTable(): string {
  return `import { Hono } from "hono";

const app = new Hono();
app.get("/", (c) => c.text("Hello from chibivoid!"));

export default app;
`;
}
