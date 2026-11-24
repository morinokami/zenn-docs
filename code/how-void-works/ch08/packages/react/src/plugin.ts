import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { WORKER_ENVIRONMENT_NAME } from 'chibivoid';
import { createPagesPlugin, generateComponentManifest } from 'chibivoid/pages';
import { normalizePath, type PluginOption, type UserConfig } from 'vite';

/** chibivoid の React アダプター。`plugins: [chibivoidPlugin(), chibivoidReact()]` のように使う */
export function chibivoidReact(): PluginOption[] {
  const pagesDir = normalizePath(join(process.cwd(), 'pages'));

  return [
    react(),
    createPagesPlugin(pagesDir, {
      name: 'chibivoid-react:pages',

      // サーバー（Worker）で HTML を描画するモジュール
      generateRenderer(scan) {
        return `import { renderReactPage } from "@chibivoid/react/pages-server";
${generateComponentManifest(scan, pagesDir)}
export function renderPage(pageObj, assetTags) {
  return renderReactPage({ pageObj, assetTags, components, layoutTree });
}
`;
      },

      config({ isDev }): UserConfig | undefined {
        if (isDev) {
          // React の依存を最初から事前バンドルしておき、後から見つかった場合のやり直しを防ぐ
          return {
            environments: {
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
