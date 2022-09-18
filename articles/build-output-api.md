---
title: "Vercel というプラットフォームを抽象化する Build Output API について"
emoji: "🔺"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["vercel"]
published: false
---

# はじめに

2022 年 7 月、Vercel は [Build Output API](https://vercel.com/docs/build-output-api/v3) という新しい機能をリリースしました^[正確に述べると、File System API という同じような仕組みが以前からあったのですが、それを大きく変更して Build Output API という新しい名前のもとでリリースした、ということのようです。こうした経緯については https://github.com/vercel/community/discussions/577#discussion-4034102 に詳しく書かれています。]。Vercel というと、最近では [Layouts RFC](https://nextjs.org/blog/layouts-rfc) が Next.js のルーティング、レイアウト、データ取得の構造を大きく変えるということでもっぱら話題になっているようです。一方、Build Output API はそれほど大きな注目を集めているわけではないようですが、調べてみると、実行環境としての Vercel というプラットフォームへと他のフレームワークを統合することを目指した野心的な試みであることがわかり、非常に興味深かったため、記事としてまとめてみることにしました。

なお、記事を作成するに際し、以下の 4 つのコンテンツ (文書と動画) を主に参照しました。いずれも趣が異なっており、また通読・視聴にそれほど時間が掛かる分量でもないため、Build Output API に興味をもった方は以下すべてに目を通すことをお勧めします。

* [Announcing the Build Output API](https://vercel.com/blog/build-output-api): Build Output API のモチベーションや概要を説明した Vercel のブログ記事
* [Build Output API (v3)](https://vercel.com/docs/build-output-api/v3): Build Output API のリファレンス
* [Build your own web framework](https://vercel.com/blog/build-your-own-web-framework): Build Output API を使い、画像最適化や ISR などの機能を備えたフレームワークを自作する、という実践的な記事
* [Building a modern web framework with Vercel's Build Output API](https://youtu.be/j6qweJF_TIc): 上の記事の動画版

# Build Output API とは何か

Build Output API は、あるコードの集まりが Vercel 上で動作するために必要となるディレクトリ構造と設定方法を定めた仕様です。たとえば、あるフレームワークのビルド結果が Build Output API に従っていれば、そのビルドを Vercel へとデプロイして実行することができるというわけです。よって、[Nuxt](https://nuxtjs.org/) や [SvelteKit](https://kit.svelte.dev/) などのフレームワークが Vercel 上で動作するためには、それらフレームワークのビルドツールが Build Output API に従ってビルド結果を出力すればいいということになります。また、ディレクトリの内容が特定のフレームワークの出力である必要はなく、手動で Build Output API に沿ってディレクトリの内容を構成することで、Vercel へとデプロイすることも可能です。

一つ例を見てみましょう^[この例は https://github.com/vercel/examples/tree/main/build-output-api/serverless-functions を一部簡略化したものです。]。次は、Build Output API にしたがって作成された、Vercel へとデプロイ可能な Serverless Function のディレクトリ構造と設定ファイルの例です:

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

などのことです。これらの要件を備えた `.vercel` ディレクトリは、`vercel deploy --prebuilt` コマンドによって Vercel へと直接デプロイすることができます。そして、デプロイされた関数へは、`/index` または `/` というパスからアクセスすることができます。

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

これは上で述べたことから既に明らかであると思います。フロントエンドフレームワーク開発者が、自身のフレームワークを Vercel 対応するために特別なハックを必要としないよう、標準的な仕様を定めたものが Build Output API であるといえます。特に、有名なフレームワークに対しては、それらが Vercel をサポートすることが自身のメリットともなるためか、Vercel みずから[積極的な支援](https://vercel.com/blog/build-output-api#supporting-all-frontend-frameworks)をおこなっているようです。

## ローカルでビルド結果を検査する

## ビルドとデプロイを分離する

企業のポリシーによっては、ソースコードを外部に共有することができない場合があります。Build Output API により、Vercel 上でのビルドを経由せず、直接ビルド結果をアップロードすることができるようになったため、「ソースコードの共有がネックとなって Vercel を利用することができない」というケースがなくなります。また、CI などでビルドしている場合、Vercel 上でも再度ビルドすることは単純にリソースの無駄遣いでもあるため、そうした無駄を省くことができるともいえるでしょう。

## その他

ここまで、主にフレームワーク開発者や 以上に加えて個人的な見解を述べると、まず

**Vercel というプラットフォームに対する理解を深めることができる**

ということが挙げられると思われます。私たちは

* ドキュメントを読む
* 管理画面を触る
* プロジェクトをデプロイする

など様々な経路を通じて Vercel というプラットフォームのイメージを形成するわけですが、ディレクトリ構造と設定ファイルという、開発者が慣れ親しんだ形式によって Vercel というプラットフォームを操作することにより、より立体的な理解が深まると考えています。たとえるならば、AWS を Terraform を通じて操作することで、AWS のマネジメントコンソールをでは得られないhoge

また、

**Vercel というプラットフォームをどのように抽象化するかという設計について学ぶことができる**

という点はより重要だと思われます。私見ですが、Vercel という組織は、開発者の要求をバランスよく取り込み、Simplicity に基づき過不足なく練り上げられた API を作成することに最も長けた企業の一つであると日々感じており、彼らがそのインフラをどのようなメンタルモデルで抽象化し、実装しているかを観察することで、最適な抽象化についての知見を得ることができると考えています。

# 具体例から学ぶ

以下、Vercel が提供する [Examples](https://github.com/vercel/examples/tree/main/build-output-api) から抜粋するかたちで、Vercel の各機能が Build Output API によってどのように表現されるのかについて、その概要を記述します。Build Output API の全機能を網羅することは当然できませんので、細部まで含めてきちんと理解したい場合は[公式のドキュメント](https://vercel.com/docs/build-output-api/v3)を参照してください。

## 基本構造

まず、どのような場合においても共通する構造は以下のようになります:

```
.vercel
└── output
    ├── config.json
    ├── [vercel primitive]
    └── ...
```

`.vercel/output` はビルド結果を包み込むディレクトリです。この直下に、ビルド結果全体に関わる設定ファイルである `config.json` を配置します。そして、`config.json` 並ぶかたちで、必要となる Vercel の機能 (ここではドキュメントに沿って Vercel Primitive と呼んでいます) に対応するディレクトリを一つ以上配置します。

`config.json` の内容は (TypeScript により表わすと) 以下のようになります:

```ts:config.json
type Config = {
  version: 3;
  routes?: Route[];
  images?: ImagesConfig;
  wildcard?: WildcardConfig;
  overrides?: OverrideConfig;
  cache?: string[];
};
```

`version` のみ必須ですが、ここは `3` で固定となります。その他の値について簡単に説明すると、

* `routes`: ルーティングに関する設定
* `images`: 画像最適化に関する設定
* `wildcard`: 
* `overrides`: `static` ディレクトリに置かれた静的ファイルの `Content-Type` などを上書きするための設定
* `cache`: Vercel 上でビルドもおこなう際にキャッシュ対象を指定するための設定 (ビルドを Vercel 外でおこなう場合は不適)

`Route`、`ImagesConfig`、`WildcardConfig`、`OverrideConfig` の詳細な定義については、公式のドキュメントを参照してください。

TODO: Primitives について

## Static Files

`.vercel/output/static` にファイルを配置することで、[Vercel Edge Network](https://vercel.com/docs/concepts/edge-network/overview)、すなわち Vercel の CDN から静的ファイルを配信することができます。静的ファイルの配信のための設定は `.vercel/output/config.json` からおこなうことができますが、ただデータをパブリックに公開するだけであれば、特別な設定なしに `static` ディレクトリにファイルを配置するだけです。

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

上で説明した基本構造に加えて `.vercel/output/static` というディレクトリがあり、その中に静的ファイルが配置されています (各ファイルの中身はここでは重要ではないため、触れません)。また、`.vercel/output/config.json` は以下のようになっています:

```json:config.json
{
  "version": 3
}
```

必須項目の `version` のみが指定されています。この `.vercel` ディレクトリは Build Output API の仕様に従っているため、静的ファイルを配信するだけのサービスとしてこのまま Vercel にデプロイすることができます。以下は `vercel` コマンドによりこのプロジェクトをデプロイした場合の例となります:

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

動作確認用については、Vercel が用意したデモが https://build-output-api-static-files.vercel.sh にデプロイされていますので、そちらを確認してみてください。

* `/`
* `/another.html`
* `/data.json`

というパスにより、`static` ディレクトリ内のファイルにアクセスできるはずです。

また、画像は静的ファイルであることが多いと思いますが、画像の最適化もここに記述したことの延長にあります。詳しくは[こちら](https://vercel.com/blog/build-your-own-web-framework#automatic-image-optimization)などを参照してください。

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

* runtime: [関数のランタイム](https://vercel.com/docs/runtimes)を指定する
* handler: 関数のハンドラを指定する
* launcherType: 使用する launcher を指定する。現状は `Nodejs` のみサポートされている
* shouldAddHelpers: [request や response オブジェクトのヘルパーメソッド](https://vercel.com/docs/runtimes#official-runtimes/node-js/node-js-request-and-response-objects/node-js-helpers)を有効化するかどうかを指定する

つまり、ここでは Node.js のランタイムで動くハンドラを index.js として実装したことを記述しているわけです。このように Build Output API に沿って関数を配置することで、`.vercel` は Serverless Function として認識されるため、前出の `vercel deplot --prebuilt` コマンドによりVercel にデプロイすることができるわけです。この関数の動作確認は https://build-output-api-serverless-functions.vercel.sh からおこなうことができます。

なお、関数を [Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions) としてデプロイしたい場合は、`.vc-config.json` の `runtime` に `edge` を指定し、また `handler` の代わりに `entrypoint` という値を設定する必要があります。`launcherType` と `shouldAddHelpers` は設定できません。さらに、ネイティブの Node.js API が使用できないなど、[Edge Runtime](https://edge-runtime.vercel.sh/packages/runtime) には[様々な制限](https://vercel.com/docs/concepts/functions/edge-functions#limitations)もあるため、その点に注意してください。


