---
title: "付録 用語集"
---

| 用語 | 意味 | 章 |
| --- | --- | --- |
| Vite | 開発サーバーとビルドを提供するツール。プラグインにより拡張できる | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics) |
| Rolldown/Oxc | Vite 8 が内部で使うバンドラー/パーサーなどのツール群。Vite と同じく VoidZero が開発している | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics) |
| プラグイン/フック | Vite の振る舞いを拡張するオブジェクト/決まったタイミングで Vite から呼ばれる、プラグインの関数（`resolveId`、`load` など） | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics) |
| 仮想モジュール（virtual module） | ディスク上には存在せず、プラグインがその場で中身を作るモジュール | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics) |
| モジュールグラフ（module graph） | Vite の開発サーバーが、モジュールの依存関係や変換済みのコードを管理するデータ構造。環境ごとにある | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics)・[第 6 章](/morinokami/books/how-void-works/viewer/06-dev-server) |
| 無効化（invalidate） | モジュールグラフにキャッシュされた変換結果を捨てること。次に要求された際に、もう一度 `load` が呼ばれる | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics)・[第 6 章](/morinokami/books/how-void-works/viewer/06-dev-server) |
| HMR（Hot Module Replacement） | ページを読み込み直さずに、変更したモジュールだけを差し替えるしくみ | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics) |
| 依存の事前バンドル（dependency pre-bundling） | 開発サーバーの起動時に、依存パッケージを ESM の少数のファイルにまとめておく Vite のしくみ。設定は `optimizeDeps` にまとめられている | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics)・[第 8 章](/morinokami/books/how-void-works/viewer/08-pages-ssr)・[第 9 章](/morinokami/books/how-void-works/viewer/09-hydration-navigation) |
| Environment API | 1 つの開発サーバーや 1 回のビルドの中で「ブラウザ用」、「Worker 用」など複数の実行環境を扱う、Vite のしくみ | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics)・[第 3 章](/morinokami/books/how-void-works/viewer/03-cloudflare-workers) |
| 環境（environment） | Environment API で扱う実行環境の単位。ブラウザ用の `client` や Worker 用の `chibivoid_worker` などがあり、それぞれがモジュールグラフやビルドの出力先をもつ | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics)・[第 3 章](/morinokami/books/how-void-works/viewer/03-cloudflare-workers) |
| モジュールランナー（module runner） | ブラウザ以外の環境で、開発サーバーから変換済みのモジュールを取ってきて評価する部品。Cloudflare の Vite プラグインでは workerd の中で動く | [第 2 章](/morinokami/books/how-void-works/viewer/02-vite-basics)・[第 3 章](/morinokami/books/how-void-works/viewer/03-cloudflare-workers)・[第 6 章](/morinokami/books/how-void-works/viewer/06-dev-server) |
| Cloudflare Workers | Cloudflare のサーバーレス実行環境 | [第 3 章](/morinokami/books/how-void-works/viewer/03-cloudflare-workers) |
| workerd | Workers のランタイム（実行エンジン） | [第 3 章](/morinokami/books/how-void-works/viewer/03-cloudflare-workers) |
| Miniflare/Wrangler | Workers をローカルで動かすシミュレーター/Workers の公式 CLI | [第 3 章](/morinokami/books/how-void-works/viewer/03-cloudflare-workers) |
| バインディング（binding） | Worker から KV や D1 などのリソースを使うための接続口。`env.KV` のように受け取る | [第 3 章](/morinokami/books/how-void-works/viewer/03-cloudflare-workers)・[第 7 章](/morinokami/books/how-void-works/viewer/07-resource-inference) |
| KV | Cloudflare のキー・バリュー型ストレージ | [第 3 章](/morinokami/books/how-void-works/viewer/03-cloudflare-workers)・[第 7 章](/morinokami/books/how-void-works/viewer/07-resource-inference) |
| 静的アセット | Worker を起動せずに、Cloudflare がそのまま配信するファイル（ビルドしたブラウザ向けの JavaScript など）。Worker からは `ASSETS` バインディングで読むことができる | [第 3 章](/morinokami/books/how-void-works/viewer/03-cloudflare-workers)・[第 12 章](/morinokami/books/how-void-works/viewer/12-build-deploy) |
| モノレポ（monorepo） | 複数のパッケージを 1 つのリポジトリで管理する構成。chibivoid は npm の workspaces 機能で、`packages/*` と `playground` をまとめている | [第 4 章](/morinokami/books/how-void-works/viewer/04-skeleton) |
| type stripping | Node.js が、TypeScript の型注釈を取り除いてそのまま実行する機能。Node.js 24 以降は既定で有効で、chibivoid のプラグインや CLI はこれによりビルドせずに動く | [第 4 章](/morinokami/books/how-void-works/viewer/04-skeleton)・[第 12 章](/morinokami/books/how-void-works/viewer/12-build-deploy) |
| Hono | ウェブ標準 API の上で動く軽量なウェブフレームワーク。Void 内部のルーターとして使われる | [第 4 章](/morinokami/books/how-void-works/viewer/04-skeleton) |
| ルートテーブル | ルートを登録した Hono アプリのコード。chibivoid では仮想モジュール `virtual:chibivoid-routes` として生成する | [第 4 章](/morinokami/books/how-void-works/viewer/04-skeleton)・[第 5 章](/morinokami/books/how-void-works/viewer/05-server-routing)・[第 6 章](/morinokami/books/how-void-works/viewer/06-dev-server) |
| ファイルベースルーティング | ファイルの置き場所と名前から URL を決めるしくみ。chibivoid は `routes/` や `pages/` をスキャンし、ルートを登録するコードを生成して実現する | [第 5 章](/morinokami/books/how-void-works/viewer/05-server-routing)・[第 8 章](/morinokami/books/how-void-works/viewer/08-pages-ssr) |
| 抽象構文木（AST） | ソースコードの構造を木で表わしたデータ。第 7 章では、Vite の `parseSync()` により作成した AST をたどって `env.KV` のようなアクセスを探す | [第 5 章](/morinokami/books/how-void-works/viewer/05-server-routing)・[第 7 章](/morinokami/books/how-void-works/viewer/07-resource-inference) |
| ミドルウェア | ルートのハンドラーの前後で動く関数。`middleware/` に置いたグローバルミドルウェアは、Worker に届くすべてのリクエストでファイル名の数字の順に動く | [第 6 章](/morinokami/books/how-void-works/viewer/06-dev-server) |
| リソース推論（resource inference） | ソースコードを実行せずに解析して、アプリが必要とするリソース（KV など）を割り出すしくみ。結果は Worker の設定と、デプロイの際のリソースの作成に使われる | [第 7 章](/morinokami/books/how-void-works/viewer/07-resource-inference)・[第 12 章](/morinokami/books/how-void-works/viewer/12-build-deploy) |
| AsyncLocalStorage | 非同期の処理の流れごとに値を保存できる、Node.js 由来の API。chibivoid はリクエストごとの `env` を保存するのに使う | [第 7 章](/morinokami/books/how-void-works/viewer/07-resource-inference) |
| Pages | `pages/` に置いた UI コンポーネントがそのままページになる、Void の機能。隣に置いた `.server.ts` の loader がページのデータを用意し、action がフォームの送信を処理する | [第 8 章](/morinokami/books/how-void-works/viewer/08-pages-ssr)・[第 9 章](/morinokami/books/how-void-works/viewer/09-hydration-navigation)・[第 10 章](/morinokami/books/how-void-works/viewer/10-actions-forms) |
| SSR（Server-Side Rendering） | コンポーネントをサーバーで HTML にすること | [第 8 章](/morinokami/books/how-void-works/viewer/08-pages-ssr) |
| loader/action | ページのデータを用意する関数/フォームの送信など、データを変更するリクエストを処理する関数 | [第 8 章](/morinokami/books/how-void-works/viewer/08-pages-ssr)・[第 10 章](/morinokami/books/how-void-works/viewer/10-actions-forms) |
| ページオブジェクト（page object） | 「どのコンポーネントを、どの props で描画するか」を表わす JSON。初回は HTML に埋め込まれ、クライアント遷移では JSON として返される | [第 8 章](/morinokami/books/how-void-works/viewer/08-pages-ssr)・[第 9 章](/morinokami/books/how-void-works/viewer/09-hydration-navigation)・[第 10 章](/morinokami/books/how-void-works/viewer/10-actions-forms) |
| コア/アダプター | Pages のうち、フレームワークに依存しない部分（スキャン、ルートの登録、loader の実行など）/React などのフレームワークで描画する部分。chibivoid では `chibivoid` と `@chibivoid/react` | [第 8 章](/morinokami/books/how-void-works/viewer/08-pages-ssr)・[第 9 章](/morinokami/books/how-void-works/viewer/09-hydration-navigation) |
| 幽霊型（phantom type） | 型の上にだけ存在するプロパティに型の情報をもたせるテクニック。`defineHandler()` が返す関数の `__output` がこれにあたる | [第 8 章](/morinokami/books/how-void-works/viewer/08-pages-ssr)・[第 11 章](/morinokami/books/how-void-works/viewer/11-type-safety) |
| ハイドレーション（hydration） | サーバーが描画した HTML をブラウザ側で React などが引き継いで、クリックなどの操作に反応するようにすること | [第 9 章](/morinokami/books/how-void-works/viewer/09-hydration-navigation) |
| クライアント遷移（client-side navigation） | リンクのクリックなどをインターセプトし、遷移先のページオブジェクトを JSON で取得して、ページ全体を読み込み直さずに画面を切り替えること | [第 9 章](/morinokami/books/how-void-works/viewer/09-hydration-navigation)・[第 10 章](/morinokami/books/how-void-works/viewer/10-actions-forms) |
| ナビゲーションエンジン（navigation engine） | ブラウザでページオブジェクトを取得し、履歴の操作やスクロールをおこなう、フレームワークに依存しない部分。画面の描き替えはアダプターに任せる。chibivoid ではコアの `pages/client.ts` に実装する | [第 9 章](/morinokami/books/how-void-works/viewer/09-hydration-navigation)・[第 10 章](/morinokami/books/how-void-works/viewer/10-actions-forms) |
| React Fast Refresh | 開発中にコンポーネントの状態を保ったまま、変更したコンポーネントを差し替えるしくみ。`@vitejs/plugin-react` が提供する | [第 9 章](/morinokami/books/how-void-works/viewer/09-hydration-navigation) |
| プログレッシブエンハンスメント（progressive enhancement） | まず JavaScript がなくても動くものを作り、JavaScript が動く場合にはより快適に使うことができるようにする考え方 | [第 9 章](/morinokami/books/how-void-works/viewer/09-hydration-navigation)・[第 10 章](/morinokami/books/how-void-works/viewer/10-actions-forms) |
| CSRF（Cross-Site Request Forgery） | 別のサイトから勝手にフォームを送信させる攻撃。chibivoid はページの action へのリクエストで `Origin` ヘッダー（または `Sec-Fetch-Site` ヘッダー）を確かめて防ぐ | [第 10 章](/morinokami/books/how-void-works/viewer/10-actions-forms) |
| モジュール拡張（module augmentation） | `declare module` により、既存のモジュールの型に宣言を追加すること。chibivoid は生成した `RouteMap` を `chibivoid/routes` のインターフェイスにマージするのに使う | [第 11 章](/morinokami/books/how-void-works/viewer/11-type-safety) |
| マニフェスト（manifest） | ビルドで出力されたファイルの名前（ハッシュ付き）と、元のモジュールとの対応表。Vite が `.vite/manifest.json` として出力する。第 8 章の `pages/manifest.ts` が生成する、コンポーネントの対応表とは別のもの | [第 12 章](/morinokami/books/how-void-works/viewer/12-build-deploy) |
| プロビジョニング（provisioning） | デプロイの際に必要なリソース（KV ネームスペースなど）を作成すること。作成したリソースの ID は、Void では `void.lock.json`、chibivoid では `chibivoid.lock.json` に記録する | [第 12 章](/morinokami/books/how-void-works/viewer/12-build-deploy) |
