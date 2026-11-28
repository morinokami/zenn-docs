import { normalizePath, type Plugin, type UserConfig } from "vite";
import { scanPages, type PageScanResult } from "./scan.ts";

export const RENDERER_ID = "virtual:chibivoid-pages-renderer";

type CreatePagesPluginOptions = {
  /** プラグイン名。例: "chibivoid-react:pages" */
  name: string;
  /** サーバーで HTML を描画する仮想モジュールのコードを返す */
  generateRenderer: (scan: PageScanResult, isDev: boolean) => string;
  /** フレームワークごとの Vite 設定 */
  config?: (context: { isDev: boolean }) => UserConfig | undefined;
};

/**
 * Pages 機能の「共通部分」を担う Vite プラグインを作る。
 * pages/ のスキャンと仮想モジュールの配信・更新はここでやり、
 * 生成するコードの中身（React 用か Vue 用かなど）はアダプターに任せる。
 */
export function createPagesPlugin(pagesDir: string, options: CreatePagesPluginOptions): Plugin {
  const normalizedPagesDir = normalizePath(pagesDir);
  let scan: PageScanResult = { pages: [], layouts: [] };
  let isDev = false;

  return {
    name: options.name,

    config(_config, env) {
      isDev = env.command === "serve" && !env.isPreview;
      return options.config?.({ isDev });
    },

    buildStart() {
      scan = scanPages(pagesDir);
    },

    resolveId(id) {
      if (id === RENDERER_ID) {
        return "\0" + id;
      }
    },

    load(id) {
      if (id === "\0" + RENDERER_ID) {
        return options.generateRenderer(scan, isDev);
      }
    },

    configureServer(server) {
      // ページが追加・削除された場合は、仮想モジュールを作り直してもらう
      const onStructureChange = (file: string) => {
        if (!normalizePath(file).startsWith(normalizedPagesDir + "/")) {
          return;
        }
        scan = scanPages(pagesDir);
        for (const environment of Object.values(server.environments)) {
          const mod = environment.moduleGraph.getModuleById("\0" + RENDERER_ID);
          if (mod) {
            environment.moduleGraph.invalidateModule(mod);
          }
        }
      };
      server.watcher.on("add", onStructureChange);
      server.watcher.on("unlink", onStructureChange);
    },
  };
}
