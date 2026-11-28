import type { PageScanResult } from "../pages/scan.ts";
import type { ProjectPaths, ScanResult } from "./scan.ts";

export type CompileOptions = ProjectPaths & {
  /** `vite dev` 用にコンパイルするか */
  dev: boolean;
};

/** 生成コードに埋め込む文字列リテラルを作る（JSON.stringify にクォートとエスケープを任せる） */
const str = (value: string) => JSON.stringify(value);

/**
 * `.chibivoid/entry.ts`（Worker のエントリ）のソースコードを生成する。
 * 仮想モジュール `virtual:chibivoid-routes` がエクスポートする Hono アプリケーションを、
 * Workers の `fetch` ハンドラーとして公開するだけの薄いファイル。
 */
export function compileWorkerEntry(): string {
  return `// chibivoid が自動生成したファイルです。編集しないでください。
import app from "virtual:chibivoid-routes";
import { createWorkerFetch } from "chibivoid/runtime/routing";

export default {
  fetch: createWorkerFetch(app),
};
`;
}

/**
 * スキャン結果から、仮想モジュール `virtual:chibivoid-routes` のソースコードを生成する。
 * 中身は「ファイルベースのルートを登録した Hono アプリケーション」をデフォルトエクスポートする ES モジュール。
 */
export function compileRouteTable(scan: ScanResult, options: CompileOptions): string {
  const imports: string[] = [
    `import { Hono } from "hono";`,
    `import { createModuleLoader, createHttpRouteHandler, createPageGetHandler, createPageMutationHandler, createPagesAssetTags } from "chibivoid/runtime/routing";`,
  ];
  const body: string[] = ["const app = new Hono();"];
  // 本番ではロードしたモジュールをキャッシュし、開発中は毎回インポートし直す
  const cache = !options.dev;

  // 1. グローバルミドルウェア: すべてのリクエストで動くため、最初に読み込んで登録する
  scan.middleware.forEach((middleware, i) => {
    imports.push(
      `import middleware${i} from ${str(`${options.middlewareDir}/${middleware.filePath}`)};`,
    );
    body.push(`app.use(middleware${i});`);
  });

  // 2. サーバールート: ファイルは「最初にリクエストが来た際」に読み込む（遅延ロード）
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

  // 3. ページ
  if (scan.pages.pages.length > 0) {
    compilePageRoutes(imports, body, scan.pages, options);
  }

  return [...imports, "", ...body, "", "export default app;", ""].join("\n");
}

function compilePageRoutes(
  imports: string[],
  body: string[],
  pages: PageScanResult,
  options: CompileOptions,
): void {
  // ページの描画方法はフレームワークアダプター（@chibivoid/react など）が提供する
  imports.push(`import { renderPage } from "virtual:chibivoid-pages-renderer";`);
  // HTML に差し込むタグ（クライアントの JavaScript など）
  body.push(`const getAssetTags = createPagesAssetTags({ dev: ${options.dev} });`);

  pages.pages.forEach((page, i) => {
    let load = "undefined";
    if (page.serverPath) {
      load = `loadPage${i}`;
      const file = `${options.pagesDir}/${page.serverPath}`;
      body.push(`const ${load} = createModuleLoader(() => import(${str(file)}), ${!options.dev});`);
    }
    const routeOptions = `{ componentId: ${str(page.componentId)}, load: ${load}, render: renderPage, assets: getAssetTags }`;
    body.push(`app.get(${str(page.pattern)}, createPageGetHandler(${routeOptions}));`);
    if (page.methods.includes("action")) {
      body.push(
        `app.on(["POST", "PUT", "PATCH", "DELETE"], ${str(page.pattern)}, createPageMutationHandler(${routeOptions}));`,
      );
    }
  });
}
