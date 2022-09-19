---
title: "Vercel というプラットフォームを抽象化する Build Output API について"
emoji: "🔺"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["vercel"]
published: true
---

# はじめに

2022 年 7 月、Vercel は [Build Output API](https://vercel.com/docs/build-output-api/v3) という新しい機能をリリースしました^[正確に述べると、File System API という同じような仕組みが以前からあったのですが、それを大きく変更して Build Output API という新しい名前のもとでリリースした、ということのようです。こうした経緯については https://github.com/vercel/community/discussions/577#discussion-4034102 に詳しく書かれています。]。Vercel というと、最近では [Layouts RFC](https://nextjs.org/blog/layouts-rfc) が Next.js のルーティング、レイアウト、データ取得の構造を大きく変えるということでもっぱら話題になっているようです。一方、Build Output API はそれほど大きな注目を集めているわけではないようですが、調べてみると、実行環境としての Vercel というプラットフォームへと他のフレームワークを統合することを目指した野心的な試みであることがわかり、非常に興味深かったため、記事としてまとめてみることにしました。

なお、記事を作成するに際し、以下の 4 つのコンテンツ (文書と動画) を主に参照しました。いずれも趣が異なっており、また通読・視聴にそれほど時間が掛かる分量でもないため、Build Output API に興味をもった方は以下すべてに目を通すことをお勧めします。

* [Announcing the Build Output API](https://vercel.com/blog/build-output-api): Build Output API の背景にあるモチベーションや概要を説明した Vercel のブログ記事
* [Build Output API (v3)](https://vercel.com/docs/build-output-api/v3): Build Output API のリファレンス
* [Build your own web framework](https://vercel.com/blog/build-your-own-web-framework): Build Output API を使い、画像最適化や ISR などの機能を備えたフレームワークを自作する、という実践的な記事
* [Building a modern web framework with Vercel's Build Output API](https://youtu.be/j6qweJF_TIc): 上の記事の動画版

# Build Output API とは何か

Build Output API は、あるコードの集まりが Vercel 上で動作するために必要となるディレクトリ構造と設定方法を定めた仕様です。たとえば、あるフレームワークのビルド結果が Build Output API に従っていれば、そのビルドを Vercel へとデプロイして実行することができるというわけです。よって、[Nuxt](https://nuxtjs.org/) や [SvelteKit](https://kit.svelte.dev/) などのフレームワークが Vercel 上で動作するためには、それらフレームワークのビルドツールが Build Output API に従ってビルド結果を出力すればいいということになります。また、ディレクトリの内容が特定のフレームワークの出力である必要はなく、手動で Build Output API に沿ってディレクトリを構成することで、Vercel へとデプロイすることも可能です。

一つ例を見てみましょう^[この例は https://github.com/vercel/examples/tree/main/build-output-api/serverless-functions を一部簡略化したものです。]。以下は、Build Output API にしたがって作成された、Vercel へとデプロイ可能な Serverless Function のディレクトリ構造と設定ファイルの例となります:

```
.vercel
└── output
    ├── config.json
    └── functions
        └── index.func
            ├── index.js
            ├── node_modules
            └── .vc-config.json
```

```json:.vc-config.json
{
  "runtime": "nodejs14.x",
  "handler": "index.js",
  "launcherType": "Nodejs",
  "shouldAddHelpers": true
}
```

詳しくは後述しますが、ここでのポイントは、

* `.vercel/output/functions` というディレクトリ構造が存在する
* その直下に `index.func` というディレクトリが存在する
* `index.func` の内部に `.vc-config.json` という関数の設定ファイルが存在し、ランタイムなどが定義されている
* `index.func` の内部に関数の実体である `index.js` というファイルが存在する

などです。こうした要件を備えた `.vercel` ディレクトリは、`vercel deploy --prebuilt` コマンドによって Vercel へと直接デプロイすることができます。そして、デプロイされた関数へは、`/index` または `/` というパスからアクセスすることができます。

このように、あるビルドの出力 (Build Output) が Vercel 上で動作するために満たすべき規約を定めたものが、Build Output API です。コンパイラが特定の CPU アーキテクチャに向けたバイナリを出力すれば、そのバイナリはそのアーキテクチャ上で動作することや、一定の形式のもとでコンテナを作成すれば、その形式をサポートするコンテナランタイム上でそのコンテナは動作することと似ていますね。

ところで、上で「Vercel 上で動作」と何度か書きましたが、これの意味するところはなんでしょうか。通常、Vercel へとデプロイする前提のもとで Next.js による開発をおこなう際、

* [画像最適化](https://nextjs.org/docs/basic-features/image-optimization)
* [Middleware](https://nextjs.org/docs/advanced-features/middleware)
* [Serverless Functions](https://nextjs.org/docs/api-routes/introduction)
* [Edge Functions](https://nextjs.org/docs/api-routes/edge-api-routes)
* [Static Generation](https://nextjs.org/docs/basic-features/pages#static-generation-recommended)^[Static Site Generation (SSG) という用語も一般的によく使われますが、これは Vercel のドキュメントでは最近は使われていないため、ここでもそれに従いました。]
* [Server-side Rendering (SSR)](https://nextjs.org/docs/basic-features/pages#server-side-rendering)
* [Incremental Static Regeneration (ISR)](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)

といった様々な機能を組み合わせることを考えます。実は、上で示した Serverless Function の例のように、Build Output API に従うことで、Next.js を使用せずともこうした機能をすべて利用することができるのです。よって、たとえばあるフレームワークの開発者が ISR をサポートしたいと考えた場合、Build Output API に従ってビルド結果を出力すれば、少なくとも Vercel 上で動作させる限りは ISR をサポートすることができるというわけです。

Vercel の CEO である [Guillermo Rauch](https://twitter.com/rauchg) 氏は、Build Output API を "infrastructure-as-filesystem" (IaFS) と表現していますが、その意味するところは以上の説明により理解できると思います。

https://twitter.com/rauchg/status/1550494847559036928

# Build Output API がもたらすもの

以上から、Build Output API が、Vercel がインフラとして提供する機能を利用するためのビルド結果の構造に関する仕様であることはわかりましたが、こうした仕組みが存在することでどのようなメリットがあるでしょうか。[Vercel の記事](https://vercel.com/blog/build-output-api)には以下のように書かれています:

## Vercel のインフラ機能を任意のフレームワークへと組み込む

これは上で述べたことから既に明らかであると思います。フロントエンドフレームワーク開発者が、自身のフレームワークを Vercel に対応させるために特別なハックを必要としないよう、標準的な仕様を定めたものが Build Output API であるといえます。特に、有名なフレームワークに対しては、それらが Vercel をサポートすることが自身のメリットともなるためか、Vercel みずから[積極的な支援](https://vercel.com/blog/build-output-api#supporting-all-frontend-frameworks)をおこなっているようです。

## ローカルでビルド結果を検査する

直下の点と関連しますが、ビルドした結果をローカルで検査・デバッグすることができるようになるため、その内容に問題がないかなどの確認を、より素早く、より容易におこなうことができるようになります。

## ビルドとデプロイを分離する

企業のポリシーによっては、ソースコードを外部に共有することができない場合があります。Build Output API により、Vercel 上でのビルドを経由せず、直接ビルド結果をアップロードすることができるようになったため、「ソースコードの共有がネックとなり Vercel を利用することができない」というケースがなくなります。また、CI などでビルドしている場合、Vercel 上でも再度ビルドすることは単純にリソースの無駄遣いでもあるため、そうした無駄を省くことができるともいえるでしょう。

## その他

以上に加えて個人的な見解を述べると、まず単純に

**Vercel というプラットフォームに対する理解を深めることができる**

ということが挙げられると思われます。私たちは

* ドキュメントを読む
* 管理画面を触る
* プロジェクトをデプロイする

など様々な経路を通じて Vercel というプラットフォームのイメージを形成するわけですが、ディレクトリ構造と設定ファイルという、開発者が慣れ親しんだ形式によって Vercel というプラットフォームを操作することにより、より立体的な理解が可能になると考えています。たとえるならば、AWS を Terraform により、あるいは (少し古いですが) VM を Vagrant により操作することで、対象に対する理解が深まり、またデバッグも (ある意味) 容易になることに似ています。

また、

**Vercel というプラットフォームをどのように抽象化するかという設計について学ぶことができる**

という点はより重要だと思われます。私見ですが、Vercel という組織は、開発者の要求をバランスよく取り込み、かつ Simplicity に基づき過不足なく練り上げられた API を作成することに最も長けた企業の一つであると日々感じており、彼らがそのインフラをどのようなメンタルモデルで抽象化し、また実装しているかを観察することで、最適な抽象化についての知見を得ることができると考えています。

# 具体例から学ぶ

以下、Vercel が提供する [Examples](https://github.com/vercel/examples/tree/main/build-output-api) から抜粋するかたちで、Vercel の各機能が Build Output API によってどのように表現されるのかについて、その概要をより具体的に記述します。Build Output API の全機能を網羅することは当然できませんので、細部まで含めてきちんと理解したい場合は[公式のドキュメント](https://vercel.com/docs/build-output-api/v3)などを参照してください。

## 基本構造

まず、どのような場合においても共通するビルドの構造は以下のようになります:

```
.vercel
└── output
    ├── config.json
    ├── [vercel primitive]
    └── ...
```

`.vercel/output` はビルド結果を包み込むディレクトリです。この直下に、ビルド結果全体に関わる設定ファイルである `config.json` を配置します。そして、`config.json` と並ぶかたちで、必要となる Vercel の機能 (ここではドキュメントに沿って Vercel Primitive と呼んでいます) に対応するディレクトリを配置します。

`config.json` の内容は (TypeScript により表わすと) 以下のようになります:

```ts:.vercel/output/config.json
type Config = {
  version: 3;
  routes?: Route[];
  images?: ImagesConfig;
  wildcard?: WildcardConfig;
  overrides?: OverrideConfig;
  cache?: string[];
};
```

[`version`](https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/version) のみ必須ですが、ここは `3` で固定となります。その他の値について簡単に説明すると、

* [`routes`](https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/routes): ルーティングに関する設定
* [`images`](https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/images): 画像最適化に関する設定
* [`wildcard`](https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/wildcard): 列挙したドメインをワイルドカードとして扱い、その値を `routes` へと引き渡すための設定
* [`overrides`](https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/overrides): `static` ディレクトリに置かれた静的ファイルの `Content-Type` などを上書きするための設定
* [`cache`](https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/cache): Vercel 上でビルドもおこなう際にキャッシュ対象を指定するための設定 (ビルドを Vercel 外でおこなう場合は不適)

これらのうち一部についてはあとで説明しますが、`Route`、`ImagesConfig`、`WildcardConfig`、`OverrideConfig` の詳細な定義については、公式のドキュメントを参照してください。

## Static Files

Build Output API では、`.vercel/output/static` にファイルを配置することで、[Vercel Edge Network](https://vercel.com/docs/concepts/edge-network/overview)、すなわち Vercel の CDN から静的ファイルを配信することができます。静的ファイルの配信のための設定は `.vercel/output/config.json` からおこなうことができますが、ただデータをパブリックに公開するだけであれば、特別な設定なしに `static` ディレクトリにファイルを配置するだけで可能です。

Vercel が用意している、静的ファイル配信の例 [`examples/build-output-api/static-files`](https://github.com/vercel/examples/tree/main/build-output-api/static-files) を確認してみましょう。まず、プロジェクトの構造は以下のようになっています:

```
.vercel
└── output
    ├── config.json
    └── static
        ├── another.html
        ├── data.json
        └── index.html
```

上で説明した基本構造に加えて `.vercel/output/static` というディレクトリがあり、その中に静的ファイルが配置されています (各ファイルの中身はここでは重要ではないため、触れません)。また、`.vercel/output/config.json` は以下のように、必須項目の `version` のみが指定されています:

```json:.vercel/output/config.json
{
  "version": 3
}
```

この `.vercel` ディレクトリは Build Output API の仕様に従っているため、静的ファイルを配信するだけのサービスとしてこのまま Vercel にデプロイすることができます。以下は `vercel deploy --prebuilt` コマンドによりこのプロジェクトをデプロイした場合の実行例となります:

```sh
$ gh repo clone vercel/examples
$ cd examples/build-output-api/static-files
$ vercel deploy --prebuilt
Vercel CLI 28.2.5
? Set up and deploy “~/examples/build-output-api/static-files”? [Y/n] y
? Which scope do you want to deploy to? foo
? Link to existing project? [y/N] n
? What’s your project’s name? static-files
? In which directory is your code located? ./
Local settings detected in vercel.json:
No framework detected. Default Project Settings:
- Build Command: `npm run vercel-build` or `npm run build`
- Development Command: None
- Install Command: `yarn install`, `pnpm install`, or `npm install`
- Output Directory: `public` if it exists, or `.`
? Want to modify these settings? [y/N] n
🔗  Linked to foo/static-files (created .vercel and added it to .gitignore)
🔍  Inspect: https://vercel.com/foo/static-files/GKXnZL3W6C3Z1XgsocZiKKwQjwrw [858ms]
✅  Production: https://static-files-zeta.vercel.app [12s]
📝  Deployed to production. Run `vercel --prod` to overwrite later (https://vercel.link/2F).
💡  To change the domain or build command, go to https://vercel.com/foo/static-files/settings
```

動作確認については、Vercel が用意したデモが https://build-output-api-static-files.vercel.sh にデプロイされていますので、そちらを確認してみてください。

* [`/`](https://build-output-api-static-files.vercel.sh/)
* [`/another.html`](https://build-output-api-static-files.vercel.sh/another.html)
* [`/data.json`](https://build-output-api-static-files.vercel.sh/data.json)

というパスにより、`static` ディレクトリ内のファイルにアクセスできるはずです。

また、画像の最適化もここに記述したことの延長にあります。詳しくは https://github.com/vercel/examples/tree/main/build-output-api/image-optimization の README などを参照してください。

## Serverless Functions

次に、前半で使用した例を再度用いて、Serverless Function を Build Output API に基づき定義する方法について見ていきます。ここでのポイントは、`.vercel/output/functions` に関数やそのパスを定義すること、そして各関数ごとに `.vc-config.json` を用意することです。以下は、[examples/build-output-api/serverless-functions](https://github.com/vercel/examples/tree/main/build-output-api/serverless-functions) にある Serverless Function の定義です:

```
.vercel
└── output
    ├── config.json
    └── functions
        └── index.func
            ├── index.js
            ├── node_modules
            └── .vc-config.json
```

```json:.vc-config.json
{
  "runtime": "nodejs14.x",
  "handler": "index.js",
  "launcherType": "Nodejs",
  "shouldAddHelpers": true
}
```

`.vercel/output/functions` が Serverless Function を定義するディレクトリとなり、その下に置かれる `<name>.func` というディレクトリが関数の実体となります。`functions` から `<name>` までが関数のパスとなります。たとえば、上の例では `functions/index.func` となっているため、この関数を呼び出すパスは `/` あるいは `/index` となります。`functions` 以下にディレクトリを挟むこともできます。たとえば、`functions/api/foo.func` という構造になっていれば、この関数のパスは `/api/foo` となります。

`<name>.func/.vc-config.json` が `<name>` 関数の設定ファイルとなります。ここで設定されている各値の意味は次の通りです:

* `runtime`: [関数のランタイム](https://vercel.com/docs/runtimes)を指定する
* `handler`: 関数のハンドラを指定する
* `launcherType`: 使用する launcher を指定する。現状は `Nodejs` のみサポートされている
* `shouldAddHelpers`: [request や response オブジェクトのヘルパーメソッド](https://vercel.com/docs/runtimes#official-runtimes/node-js/node-js-request-and-response-objects/node-js-helpers)を有効化するかどうかを指定する

つまりここでは、Node.js のランタイムで動くハンドラを `index.js` として実装した、ということを記述しているわけです。このように Build Output API に沿って関数を配置することで、`.vercel` ディレクトリは Serverless Function として認識されるため、前出の `vercel deploy --prebuilt` コマンドによりVercel にデプロイすることができます。この関数の動作確認は https://build-output-api-serverless-functions.vercel.sh からおこなうことができます。

なお、関数を [Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions) としてデプロイしたい場合は、`.vc-config.json` の `runtime` に `edge` を指定し、また `handler` の代わりに `entrypoint` という値を設定する必要があります。`launcherType` と `shouldAddHelpers` は設定できません。さらに、ネイティブの Node.js API が使用できないなど、[Edge Runtime](https://edge-runtime.vercel.sh/packages/runtime) には[様々な制限](https://vercel.com/docs/concepts/functions/edge-functions#limitations)もあるため、その点には注意してください。

## Incremental Static Regeneration (ISR)

続いて、少し複雑になりますが、ISR を Build Output API により表現する例を見ていきましょう。ISR を実現する仕組みは Build Output API のドキュメントにおいては [Prerender](https://vercel.com/docs/build-output-api/v3#vercel-primitives/prerender-functions) と表現されており、これは上の Serverless Function の延長として実現することができます。ブログの一覧と詳細を表示する中で ISR を使用するアプリケーション [examples/build-output-api/prerender-functions](https://github.com/vercel/examples/tree/main/build-output-api/prerender-functions) のディレクトリ構造は次のようになっています:

```
.vercel
└── output
    ├── config.json
    ├── functions
    │   └── blog
    │       ├── post.func
    │       │   ├── index.js
    │       │   └── .vc-config.json
    │       ├── post.prerender-config.json
    │       └── post.prerender-fallback.html
    └── static
        ├── blog
        │   ├── one.html
        │   └── two.html
        └── index.html
```

また、`.vercel/output/functions/blog/post.func/.vc-config.json` の内容は以下となります:

```json:.vercel/output/functions/blog/post.func/.vc-config.json
{
  "runtime": "nodejs14.x",
  "handler": "index.js",
  "launcherType": "Nodejs",
  "shouldAddHelpers": true
}
```

ここまでの知識に基づき、上の事実から推測できることは以下となります:

* `.vercel/output/static` の内容から、`/` (あるいは `/index`)、`/blog/one.html`、`/blog/two.html` というパスを通じて `static` 以下のファイルにアクセスできる
* `/blog/post` にアクセスすると、`index.js` が実行される

ところが、前者は想定通り振る舞いません。その理由は、`.vercel/output/config.json` においてルーティング関連の設定がおこなわれているためです。`config.json` の内容を見てみましょう:

```json:.vercel/output/config.json
{
  "version": 3,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/blog/(?<slug>[^/]*)", "dest": "/blog/post?slug=$slug" }
  ],
  "overrides": {
    "blog/one.html": {
      "path": "blog/one"
    },
    "blog/two.html": {
      "path": "blog/two"
    }
  }
}
```

`version` についてはこれまでと同様ですが、ここでは `routes` と `overrides` が追加されています。

わかりやすいのは `overrides` です。たとえばここでは `blog/one.html` の `path` の値が `blog/one` と設定されていますが、これは「`blog/one.html` へとアクセスするためのパスを `blog/one` というパスによりオーバーライドする」という意味になります。つまり、`blog/one.html` を取得するためには `blog/one` へとアクセスする必要がある、ということです。`blog/two.html` についても同様です。

`routes` にはルーティングに関するルールを記述することができ、ここでは 2 つのオブジェクトが定義されています。まず、後半の `{ "src": "/blog/(?<slug>[^/]*)", "dest": "/blog/post?slug=$slug" }` は、`src` にマッチするパスを `dest` へのアクセスとみなし、同時に `slug` をクエリパラメータとして渡すということになります。つまり、たとえば `blog/three` へとアクセスした場合は、`/blog/post?slug=three` が実行されることになります^[なお、この `slug` の値をハンドラ側で受け取る際、`req.query` ではなく、`req.headers['x-now-route-matches']` によって受け取る必要があるようです。この点については挙動としてやや不自然であり、今後変化するかもしれません。]。また、`{ "handle": "filesystem" }` は、リクエストにおける URL パスがファイルシステム上のパスに一致した場合は、それを優先するという設定になります。これを指定しないと、たとえば `blog/one` へとアクセスした際に `blog/post` が実行されてしまいますが、ここではそれは望む動作ではなく、`static` のファイルを返すために必要な設定となっています。

以上の説明により、`config.json` の設定の意味が明らかとなりました。結局、このファイルにより以下のような挙動が実現することになります:

* `/blog/one` と `/blog/two` にアクセスすると、それぞれ `blog/one.html` と `blog/two.html` が返される
* (`/blog/one` と `/blog/two` 以外の) `/blog/<slug>` (たとえば `/blog/three`) にアクセスすると、`/blog/post?slug=<slug>` が実行される

これで ISR の設定について説明する準備が整いました。まず、`post.func/index.js` の内容を見てみましょう:

```js:.vercel/output/functions/blog/post.func/index.js
const { parse } = require('querystring')

// Here is our imaginary CMS "data source". In this case it's just inlined in the
// Serverless Function code, but in a real-world scenario this function would
// probably invoke a request to a database or real CMS to retrieve this information.
const posts = [
  { slug: 'three', contents: 'Three ⚽⚽⚽️' },
  { slug: 'four', contents: 'Four ⚾⚾⚾⚾️' },
  { slug: 'five', contents: 'Five 🏀🏀🏀🏀🏀' },
]

module.exports = (req, res) => {
  const matches = parse(req.headers['x-now-route-matches'])
  const { slug } = matches
  const post = posts.find((post) => post.slug === slug)

  const body = []
  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (post) {
    body.push(`<h1>${slug}</h1><p>${post.contents}</p>`)
  } else {
    res.statusCode = 404
    body.push(
      `<strong>404:</strong> Sorry! No blog post exists with this name…`
    )
  }

  body.push(`<em>This page was rendered at: ${new Date()}</em>`)

  res.end(body.join('<br /><br />'))
}
```

内容はそれほど難しくはないでしょう。`posts` を仮想的な CMS のデータソースとみなすと、`slug` が `three`、`four`、`five` の場合は `h1` を含むコンテンツを返し、その他の場合は 404 を返すというのが大意となります。ここで、これらのケースがそれぞれ ISR の挙動に基づく場合、どのように動作するべきかについて考えてみると、以下のようになります:

* 初回リクエストについては SSR をおこなう、ここで生成したページはキャッシュされる
* キャッシュを invalidate する時間を t と仮定すると、初回リクエストから t 以内にアクセスがあった場合は、キャッシュされたページを返す
* t 経過後にアクセスがあった場合も同様にキャッシュを返すが、そのページは stale となる
* stale となったページに関して、バックグラウンドで同ページの再生成がおこなわれる
* 再生成が完了したあとにアクセスがあれば、以前のキャッシュが invalidate された上で新しいページが返され、キャッシュが更新される

こうした挙動を設定するためのファイルが、まだ説明していなかった `post.prerender-config.json` です。このファイルの内容を見てみましょう:

```json:.vercel/output/functions/blog/post.prerender-config.json
{
  "expiration": 5,
  "group": 1,
  "bypassToken": "2ec9172003a647b296f324848dd3d407",
  "allowQuery": ["slug"],
  "fallback": {
    "type": "FileFsRef",
    "mode": 33188,
    "fsPath": "post.prerender-fallback.html"
  }
}
```

色々な値が設定されていますが、ここで重要なのは `expiration` です。ここにはキャッシュを invalidate するための時間を秒単位で設定することができます。この設定により、`post` 関数は上記した ISR の挙動において t=5s としたときの挙動となります。

また、`fallback` を設定することにより、上記の挙動に対して、キャッシュがなかった場合に代わりにファイルを返すという挙動を追加することができます^[ここではオブジェクトが指定されていますが、ドキュメントではここの型は `String` と書かれており、一貫していないため注意が必要です。]。つまり、キャッシュが存在していない間は `post.prerender-fallback.html` が返されるようになります。なお、Fallback 用の静的ファイルは `<name>.prerender-fallback.<ext>` という形式で命名する必要があるため注意しましょう。

以上により、このプロジェクトは全体として、

* `/blog/one` と `/blog/two` にアクセスすると、それぞれ `blog/one.html` と `blog/two.html` が返される
* (`/blog/one` と `/blog/two` 以外の) `/blog/<slug>` にアクセスすると、`/blog/post?slug=<slug>` が実行され、キャッシュ生成前は `post.prerender-fallback.html` が返される、キャッシュ生成後は ISR の挙動に従う

のように動作することがわかります。こうした挙動は https://build-output-api-prerender-functions.vercel.sh からも確認できるため、ぜひ試してみてください。`/blog/one` と `/blog/two` 以外 では 5 秒ごとにキャッシュが更新されることがわかるはずです。

## 応用編

こうした基礎的な設定により実現できる機能に加えて、

* [Build your own web framework](https://vercel.com/blog/build-your-own-web-framework)
* [Building a modern web framework with Vercel's Build Output API](https://youtu.be/j6qweJF_TIc)

では [Hydration 込みの Static Generation](https://vercel.com/blog/build-your-own-web-framework#static-rendering) や [Edge Server-Rendering](https://vercel.com/blog/build-your-own-web-framework#edge-server-rendering) など、さらなる応用的な事例が紹介されています。これらの記事や動画を通じて、フレームワーク作成のような、より高度な用途において Build Output API をどう活用するかについて、イメージできるようになるはずです。

また、実際に他のフレームワークがどのように Build Output API に対応したビルドを生成しているかを確認することも楽しいでしょう。[vercel/vercel](https://github.com/vercel/vercel) の [examples](https://github.com/vercel/vercel/tree/main/examples) には Vercel をサポートするフレームワークがサンプルコードとともに列挙されていますので、これらを手元にクローンした上で、`vercel build` を実行してみると良いでしょう。

# まとめ

この記事では、Vercel の新しい機能である Build Output API について、その内容と意義について説明し、また例を通じて実際にどのような形式を満たせば Vercel 上で動作するようになるかについて見てきました。

Build Output API は基本的にフレームワーク開発者が念頭に置かれている機能であるため、単なるフレームワークの利用者側にとっては「明日から実務で使えてすぐに役に立つ」というわけにはいきません。ただ、フロントエンドフレームワーク/ライブラリが再び群雄割拠し始めた 2022 年現在において、Vercel がどういった未来を構想・実現しようとしているのかを垣間見られる (妄想できる) ことや、また Vercel というプラットフォームが別の角度から抽象化される様を観察し、かつそれを標準化された仕様により操作できることは、単純に楽しい経験であると感じたため、記事としてここに公開しました。
