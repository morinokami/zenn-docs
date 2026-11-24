import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig, type Plugin } from 'vite';

/** Worker からインポート可能な仮想モジュールを提供する、小さなプラグイン */
function buildInfoPlugin(): Plugin {
  return {
    name: 'build-info',
    resolveId(id) {
      if (id === 'virtual:build-info') {
        return '\0virtual:build-info';
      }
    },
    load(id) {
      if (id === '\0virtual:build-info') {
        // this.environment.name により、どの Vite 環境のためのモジュールかがわかる
        return `export default ${JSON.stringify({
          environment: this.environment.name,
          generatedAt: new Date().toISOString(),
        })};`;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    buildInfoPlugin(),
    cloudflare({
      // Worker を動かす Vite 環境の名前
      viteEnvironment: { name: 'worker' },
      // 本来 wrangler.jsonc に記述する Worker の設定を、ここで直接指定できる
      config: {
        name: 'workers-basics',
        main: './src/worker.ts',
        compatibility_date: '2026-10-01',
        kv_namespaces: [{ binding: 'KV', id: 'local' }],
      },
    }),
  ],
});
