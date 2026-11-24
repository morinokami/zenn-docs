import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { WORKER_ENVIRONMENT_NAME } from 'chibivoid';
import { createPagesPlugin, generateComponentManifest } from 'chibivoid/pages';
import { normalizePath, type PluginOption, type UserConfig } from 'vite';

/**
 * サーバーで描画した HTML には、@vitejs/plugin-react が通常 index.html に差し込む
 * 「React Refresh（HMR）の準備コード」が入らない。そのため開発中は自分で差し込む。
 */
const REACT_REFRESH_PREAMBLE = `<script type="module">
import RefreshRuntime from "/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
</script>`;

/** chibivoid の React アダプター。`plugins: [chibivoidPlugin(), chibivoidReact()]` のように使う */
export function chibivoidReact(): PluginOption[] {
  const pagesDir = normalizePath(join(process.cwd(), 'pages'));

  return [
    react(),
    createPagesPlugin(pagesDir, {
      name: 'chibivoid-react:pages',

      // サーバー（Worker）で HTML を描画するモジュール
      generateRenderer(scan, isDev) {
        return `import { renderReactPage } from "@chibivoid/react/pages-server";
${generateComponentManifest(scan, pagesDir)}
const preamble = ${JSON.stringify(isDev ? REACT_REFRESH_PREAMBLE : '')};
export function renderPage(pageObj, assetTags) {
  return renderReactPage({ pageObj, assetTags, components, layoutTree, preamble });
}
`;
      },

      // ブラウザでハイドレーションとクライアント遷移を始めるモジュール
      generateClient(scan) {
        return `import { startReactPages } from "@chibivoid/react/pages-client";
${generateComponentManifest(scan, pagesDir)}
startReactPages({ components, layoutTree });
`;
      },

      config({ isDev }): UserConfig | undefined {
        if (isDev) {
          // React の依存を最初から事前バンドルしておき、後から見つかった場合のやり直しを防ぐ
          return {
            environments: {
              client: {
                optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-dev-runtime'] },
              },
              [WORKER_ENVIRONMENT_NAME]: {
                optimizeDeps: { include: ['react', 'react-dom/server', 'react/jsx-dev-runtime'] },
              },
            },
          };
        }
        return undefined;
      },
    }),
  ];
}
