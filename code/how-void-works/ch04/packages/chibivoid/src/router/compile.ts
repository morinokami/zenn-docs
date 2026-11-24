import type { ProjectPaths, ScanResult } from './scan.ts';

export type CompileOptions = ProjectPaths & {
  /** `vite dev` 用にコンパイルするか */
  dev: boolean;
};

/** 生成コードに埋め込む文字列リテラルを作る（JSON.stringify にクォートとエスケープを任せる） */
const str = (value: string) => JSON.stringify(value);

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
 * スキャン結果から、仮想モジュール `virtual:chibivoid-routes` のソースコードを生成する。
 * 中身は「ファイルベースのルートを登録した Hono アプリ」をデフォルトエクスポートする ES モジュール。
 */
export function compileRouteTable(scan: ScanResult, options: CompileOptions): string {
  const imports: string[] = [
    `import { Hono } from "hono";`,
    `import { createModuleLoader, createHttpRouteHandler } from "chibivoid/runtime/routing";`,
  ];
  const body: string[] = ['const app = new Hono();'];
  // 本番ではロードしたモジュールをキャッシュし、開発中は毎回インポートし直す
  const cache = !options.dev;

  // サーバールート: ファイルは「最初にリクエストが来た際」に読み込む（遅延ロード）
  scan.routes.forEach((route, i) => {
    const loader = `loadRoute${i}`;
    const file = `${options.routesDir}/${route.filePath}`;
    body.push(`const ${loader} = createModuleLoader(() => import(${str(file)}), ${cache});`);
    for (const method of route.methods) {
      body.push(
        `app.${method.toLowerCase()}(${str(route.pattern)}, createHttpRouteHandler(${loader}, ${str(method)}));`,
      );
    }
  });

  return [...imports, '', ...body, '', 'export default app;', ''].join('\n');
}
