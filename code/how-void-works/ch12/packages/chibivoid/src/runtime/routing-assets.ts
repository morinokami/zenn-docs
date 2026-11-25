import type { AssetTags } from "../pages/protocol.ts";

/** ブラウザ用のエントリの仮想モジュール ID（pages/plugin.ts と同じ値） */
const CLIENT_ENTRY_ID = "virtual:chibivoid-pages-client";

/** Vite がビルド時に出力する .vite/manifest.json のかたち（使う部分だけ） */
type ViteManifest = Record<string, { file: string }>;

type AssetsBinding = { fetch(request: Request | string): Promise<Response> };

/**
 * ページの HTML に入れる <script> タグを作る関数を返す。
 *
 * - 開発中: Vite の開発サーバーが配信する URL をそのまま指す
 * - 本番: ビルド時に出力されたマニフェストからハッシュ付きのファイル名を引く
 */
export function createPagesAssetTags(options: { dev: boolean }) {
  let manifest: Promise<ViteManifest | null> | undefined;

  return async (request: Request, env: unknown): Promise<AssetTags> => {
    if (options.dev) {
      return {
        // HMR などを担当する Vite のクライアント
        head: '<script type="module" src="/@vite/client"></script>',
        // 仮想モジュールは /@id/ の下で配信される。先頭の \0 は URL では __x00__ になる
        body: `<script type="module" src="/@id/__x00__${CLIENT_ENTRY_ID}"></script>`,
      };
    }
    manifest ??= loadManifest(request, (env as { ASSETS?: AssetsBinding }).ASSETS);
    // マニフェストのキーはエントリのモジュール ID（ここでは仮想モジュールの ID）
    const entry = (await manifest)?.[CLIENT_ENTRY_ID];
    return {
      head: "",
      body: entry ? `<script type="module" src="/${entry.file}"></script>` : "",
    };
  };
}

/** 静的アセット（dist/client）に含まれるマニフェストを ASSETS バインディング経由で読む */
async function loadManifest(
  request: Request,
  assets: AssetsBinding | undefined,
): Promise<ViteManifest | null> {
  if (!assets) {
    return null;
  }
  const response = await assets.fetch(new URL("/.vite/manifest.json", request.url).toString());
  return response.ok ? ((await response.json()) as ViteManifest) : null;
}
