import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath, type Plugin } from 'vite';
import { compileRouteTable } from './router/compile.ts';
import { scanApp, type ProjectPaths, type ScanResult } from './router/scan.ts';

const VIRTUAL_ROUTES_ID = 'virtual:chibivoid-routes';
const RESOLVED_VIRTUAL_ROUTES_ID = '\0' + VIRTUAL_ROUTES_ID;

/** Worker で使う軽量なランタイム（defineHandler など）の実ファイル */
const HANDLER_PATH = fileURLToPath(new URL('./runtime/handler.ts', import.meta.url));

/**
 * ファイルベースルーティングを担当するプラグイン。
 * - routes/ をスキャンする
 * - スキャン結果から仮想モジュール `virtual:chibivoid-routes`（Hono アプリ）を生成する
 */
export function routingPlugin(root: string): Plugin {
  const paths: ProjectPaths = {
    routesDir: normalizePath(join(root, 'routes')),
  };
  let scan: ScanResult | undefined;
  let dev = false;

  function rescan(): ScanResult {
    scan = scanApp(paths);
    return scan;
  }

  return {
    name: 'chibivoid:routing',
    // Vite 本体の解決処理より先に動いてほしいため 'pre'
    enforce: 'pre',

    config(_config, env) {
      // `vite dev` の場合だけ true（`vite preview` は本番ビルドを動かすため false）
      dev = env.command === 'serve' && !env.isPreview;
    },

    buildStart() {
      rescan();
    },

    resolveId(id) {
      if (id === VIRTUAL_ROUTES_ID) {
        return RESOLVED_VIRTUAL_ROUTES_ID;
      }
      // `import { defineHandler } from 'chibivoid'` は Vite プラグイン本体（index.ts）を指す。
      // そのまま Worker にバンドルすると vite や wrangler まで引き込んでしまうため、
      // サーバー側の環境では軽量な runtime/handler.ts に差し替える。
      if (id === 'chibivoid' && this.environment.config.consumer === 'server') {
        return HANDLER_PATH;
      }
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_ROUTES_ID) {
        return;
      }
      if (this.environment.config.consumer === 'client') {
        throw new Error(`${VIRTUAL_ROUTES_ID} はサーバー専用のモジュールです`);
      }
      return compileRouteTable(scan ?? rescan(), { ...paths, dev });
    },
  };
}
