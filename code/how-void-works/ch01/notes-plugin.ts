import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizePath, type Plugin } from 'vite';

// アプリのコードがインポートする ID と、プラグインの内部で使う ID
const VIRTUAL_ID = 'virtual:notes';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * notes/ ディレクトリの .txt ファイルを集めて、
 * `virtual:notes` という仮想モジュールとして提供するプラグイン。
 */
export function notesPlugin(): Plugin {
  const notesDir = normalizePath(join(process.cwd(), 'notes'));

  return {
    name: 'notes',

    // 1. インポートされた ID を「どのモジュールか」に解決する
    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_ID;
      }
    },

    // 2. 解決した ID のソースコードを返す
    load(id) {
      if (id !== RESOLVED_ID) {
        return;
      }
      console.log(`[notes] "${this.environment.name}" 環境でモジュールを生成します`);
      const notes = readdirSync(notesDir)
        .filter((file) => file.endsWith('.txt'))
        .sort()
        .map((file) => ({
          title: file.replace(/\.txt$/, ''),
          body: readFileSync(join(notesDir, file), 'utf8').trim(),
        }));
      return `export default ${JSON.stringify(notes)};`;
    },

    // 3. 開発サーバーに手を入れる: notes/ が変更された場合は仮想モジュールを作り直す
    configureServer(server) {
      const onChange = (file: string) => {
        if (!normalizePath(file).startsWith(notesDir + '/')) {
          return;
        }
        const client = server.environments.client;
        const mod = client.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) {
          // キャッシュを捨てる。次に要求された際に load が再び呼ばれる
          client.moduleGraph.invalidateModule(mod);
        }
        // ブラウザにページの再読み込みを指示する
        client.hot.send({ type: 'full-reload' });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
