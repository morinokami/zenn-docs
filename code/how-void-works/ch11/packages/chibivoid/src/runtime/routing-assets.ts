import type { AssetTags } from '../pages/protocol.ts';

/** ブラウザ用のエントリの仮想モジュール ID（pages/plugin.ts と同じ値） */
const CLIENT_ENTRY_ID = 'virtual:chibivoid-pages-client';

/**
 * ページの HTML に入れる <script> タグを作る関数を返す。
 * 開発中は、Vite の開発サーバーが配信する URL をそのまま指す。
 */
export function createPagesAssetTags(options: { dev: boolean }) {
  return async (_request: Request, _env: unknown): Promise<AssetTags> => {
    if (!options.dev) {
      // 本番ビルドへの対応は第 12 章でおこなう
      return { head: '', body: '' };
    }
    return {
      // HMR などを担当する Vite のクライアント
      head: '<script type="module" src="/@vite/client"></script>',
      // 仮想モジュールは /@id/ の下で配信される。先頭の \0 は URL では __x00__ になる
      body: `<script type="module" src="/@id/__x00__${CLIENT_ENTRY_ID}"></script>`,
    };
  };
}
