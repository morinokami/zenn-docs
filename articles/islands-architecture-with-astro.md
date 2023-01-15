---
title: "Astro で Islands Architecture を始めよう"
emoji: "🏝️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["astro", "islands", "architecture"]
published: false
---

# はじめに

この記事では、フロントエンドのレンダリングパターンの 1 つである Islands Architecture に関する概念的な説明をおこった上で、[Astro](https://astro.build/) において Islands Architecture をどのように実現するかについてチュートリアル的に解説します。Astro は [2022 年の 8 月に v1 がリリースされた](https://astro.build/blog/astro-1/)ばかりであり、ユーザーもまだそれほど多くはないと思われるため、なるべく前提知識がない方でも理解できるように各ステップの説明を細かく噛み砕いておこなうつもりです。

# Astro と Islands Architecture

Astro は、その哲学の一つとして Server-first を掲げています。その心は、SPA ではなく MPA、すなわちデプロイ時に Static Generation をおこない、デフォルトで JavaScript を消去する、という戦略となります。その結果、ユーザーが受け取るファイルは HTML や CSS などのみとなり、ファイルロード時間や TTI の短縮を達成することができます。コンテンツを重視するという立場を明確にすることで、一種の先祖返りとも言える MPA へと帰着することになったわけですが、こうしたスタンスや実際の動作速度、またその DX などによりユーザーを着実に増やし続けています。

さて、このように書くと、Astro では Static Generation しかできず、インタラクティブなコンポーネントの使用や動的なページレンダリングはできないのか、という疑問が生じるはずです。そして答えはもちろん No となります。Astro では SSR がサポートされており、したがって動的にページ内容を書き換えることは可能です。また同様に、Astro では React や Vue、Svelte など、好みのライブラリを使用してコンポーネントを作成し、ページ内にインタラクティブなパーツとして配置することができます。そして、こうした「インタラクティブな UI を静的なページに埋め込む」という発想こそ、この記事のテーマである Islands Architecture の核心となります。

Islands Architecture は、Etsy 社のフロントエンドアーキテクトである Katie Sylor-Miller によって着想され、Preact の作者である Jason Miller の以下の記事によって具体化され認知されるようになりました:

https://jasonformat.com/islands-architecture/

上の記事によれば、Islands Architecture とは

* サーバーで各ページの HTML をレンダリングする
* ページ内の動的な領域に placeholders/slots を配置しておく
* placeholders/slots には、動的なパーツに対応する HTML が含まれる
* クライアント上でこれらの動的な領域をハイドレートする

という特徴をもつレンダリングパターンです。ここで述べた placeholders/slots こそ islands であり、Islands Architecture とは、大海原に点在する島のように静的 HTML 内に動的な UI パーツを配置するという、ページの構成メカニズムを指します。

また、

なお、Astro 以外の Islands Architecture に基づくフレームワークには、たとえば以下のようなものがあります:

* Marko
* îles
* is-land
* Fresh

その他にも Islands Architecture に対応した数多くのフレームワークがあるため、気になった方は https://github.com/lxsmnsyc/awesome-islands などから興味のあるものを試してみてください。

# Astro における Islands の導入

続いて、Astro で React などの UI ライブラリを Islands として使用するための方法について述べます。

Astro には、いわゆるプラグインのように、プロジェクトに手軽に機能を追加するための仕組みとしてインテグレーション (Integration) というものがあります。インテグレーションは、大まかに

* React や Vue などの UI ライブラリを Astro において使用するためのもの
* Netlify や Vercel、Cloudflare Pages などのホスティングサービスとの連携をおこなうためのもの (これらはアダプター (Adapter) と呼ばれます)
* Tailwind CSS の有効化、サイトマップの自動生成、Image コンポーネントの使用、などその他のカテゴリ

という 3 種類に分類することができます。この記事では UI ライブラリを Islands として動かしたいため、一番上のカテゴリが重要です。

さて、インテグレーションについて理解できたところで、Astro において Islands を動かすための大まかな流れを述べると、以下のようになります:

1. Astro プロジェクトをセットアップする
2. プロジェクトに UI ライブラリ用のインテグレーションを追加する
3. UI ライブラリを用いてコンポーネントを作成する
4. 作成したコンポーネントを `.astro` ファイル内で使用し、ハイドレーションの方針をディレクティブによって指示する

ステップ 4 が少し複雑ですが、以下で例を用いて説明していきますので、ご安心ください。

## Astro プロジェクトのセットアップ

Astro には、他のフレームワークやライブラリと同様に、プロジェクトを自動でセットアップするためのコマンドが用意されています。今回はこのコマンドを用いてプロジェクトを作成します:

```sh
$ pnpm create astro@latest
╭─────╮  Houston:
│ ◠ ◡ ◠  Initiating launch sequence... right... now!
╰─────╯

 astro   v1.9.1 Launch sequence initiated.

✔ Where would you like to create your new project? … my-first-islands
✔ How would you like to setup your new project? › a few best practices (recommended)
✔ Template copied!
✔ Would you like to install pnpm dependencies? (recommended) … yes
✔ Packages installed!
✔ Would you like to initialize a new git repository? (optional) … yes
✔ Git repository created!
✔ How would you like to setup TypeScript? › Strict
✔ TypeScript settings applied!

  next   Liftoff confirmed. Explore your project!

         Enter your project directory using cd ./my-first-islands 
         Run pnpm dev to start the dev server. CTRL+C to stop.
         Add frameworks like react or tailwind using astro add.

         Stuck? Join us at https://astro.build/chat

╭─────╮  Houston:
│ ◠ ◡ ◠  Good luck out there, astronaut!
╰─────╯
```

今回は pnpm を用いていますが、npm の場合は `npm create astro@latest` を、yarn の場合は `yarn create astro` を実行してください。プロジェクトの名前や、パッケージをその場でインストールするかどうか、Git リポジトリを作成するかどうかなど、いくつかの質問をされますが、今回はすべてデフォルトのままにしてあります。

なお、このコマンドを使用すると Astro のマスコットキャラクターである Houston^[なお、Houston のロゴカラーをベースとして作成された [Astro 公式の VS Code テーマ](https://marketplace.visualstudio.com/items?itemName=astro-build.houston)も存在します。] が出迎えてくれます。かわいいですね。

無事にプロジェクトのセットアップが完了したら、以下のコマンドを実行して Astro の開発サーバーを起動してみましょう:

```sh
$ cd my-first-islands
$ pnpm run dev

> @example/basics@0.0.1 dev /home/foo/dev/my-first-islands
> astro dev

  🚀  astro  v1.9.1 started in 58ms
  
  ┃ Local    http://localhost:3000/
  ┃ Network  use --host to expose

```

ブラウザで http://localhost:3000/ を開くと、以下のページが表示されます:

![](/images/islands-architecture-with-astro/welcome.png)

## プロジェクトに React 用のインテグレーションを追加する

次に、プロジェクトに UI ライブラリ用のインテグレーションを追加します。今回は Astro がサポートしている UI ライブラリの中から React を選択します。他のライブラリを使用する場合でも、同じような流れとなるはずです。

インテグレーションを追加するためには、

* 必要なパッケージのインストール
* Astro の設定ファイルにてインテグレーションを適用
* tsconfig.json の更新

などのステップが必要です。Astro には、これらのステップを自動化するための `astro add` コマンドが用意されているため、今回はそれを利用します:

```sh
$ pnpm astro add react

> @example/basics@0.0.1 astro /home/foo/dev/my-first-islands
> astro "add" "react"

✔ Resolving packages...

  Astro will run the following command:
  If you skip this step, you can always run it yourself later

 ╭─────────────────────────────────────────────────────────────────────────────────────────────────────────╮
 │ pnpm add @astrojs/react @types/react-dom@^18.0.6 @types/react@^18.0.21 react-dom@^18.0.0 react@^18.0.0  │
 ╰─────────────────────────────────────────────────────────────────────────────────────────────────────────╯

✔ Continue? … yes
✔ Installing dependencies...

  Astro will make the following changes to your config file:

 ╭ astro.config.mjs ─────────────────────────────╮
 │ import { defineConfig } from 'astro/config';  │
 │                                               │
 │ // https://astro.build/config                 │
 │ import react from "@astrojs/react";           │
 │                                               │
 │ // https://astro.build/config                 │
 │ export default defineConfig({                 │
 │   integrations: [react()]                     │
 │ });                                           │
 ╰───────────────────────────────────────────────╯

✔ Continue? … yes
  
   success  Added the following integration to your project:
  - @astrojs/react

  Astro will make the following changes to your tsconfig.json:

 ╭ tsconfig.json ──────────────────────────╮
 │ {                                       │
 │   "extends": "astro/tsconfigs/strict",  │
 │   "compilerOptions": {                  │
 │     "jsx": "react-jsx",                 │
 │     "jsxImportSource": "react"          │
 │   }                                     │
 │ }                                       │
 ╰─────────────────────────────────────────╯

✔ Continue? … yes
  
   success  Successfully updated TypeScript settings
```

コマンドを実行すると、これからどのような変更がおこなわれるかが説明され、それを実行して構わないかどうかを確認するプロンプトが表示される、という流れが複数回繰り返されます。今回はすべて yes を選択しました。

以上により、Astro プロジェクトにおいて React を使用するための準備が整いました。

## React を用いてコンポーネントを作成する

続いて、React を用いてコンポーネントを作成してみましょう。

Astro では一般に、再利用可能なコンポーネントは `src/components` ディレクトリ以下に配置します。今回は React の複雑な機能は特に用いず、以下のような単純なコンポーネントをまずは作成してみます:

```tsx:src/components/MyFirstIsland.tsx
import { useState } from "react";

export function MyFirstIsland() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}

```

## 作成したコンポーネントを使用する

それでは、上で作成したコンポーネントを使用してみましょう。

Islands を浮かべるための海に対応するのが `.astro` という拡張子をもつ Astro コンポーネントです。Astro コンポーネントは以下の構造をもちます:

```astro
---
// コンポーネントスクリプト (JavaScript)
---
<!-- コンポーネントテンプレート (HTML + JS Expressions) -->
```

`---` は「コードフェンス」と呼ばれ、このフェンスで囲まれた部分がコンポーネントスクリプトです。このコンポーネントスクリプトには、下部のコンポーネントテンプレートをレンダリングするために必要な JavaScript を記述します。そして下部のコンポーネントテンプレートでは、コンポーネントが出力する HTML を組み立てるための JSX ライクな構文を記述します。

よって、上で作成したコンポーネントを使用するためには、

1. コンポーネントスクリプトにおいて対象コンポーネントをインポートし、
2. コンポーネントテンプレートにおいて対象コンポーネントを使用する

という 2 ステップを辿ればいいわけです。以下がそのコードとなります:

```tsx:src/pages/index.astro
---
import { MyFirstIsland } from '../components/MyFirstIsland';
---
<MyFirstIsland />
```

Astro では、`src/pages` 以下にある `.astro` ファイルはページとみなされます。上のファイルは `pages` の直下に `index.astro` という名前で置かれているため、`/` に対応するページとなります。

`pnpm run dev` により開発サーバを起動し `http://localhost:3000` をブラウザで開くと、

> Clicked 0 times

というボタンが表示されるはずです。

## コンポーネントをハイドレーションする

さて、実は上のコンポーネントはハイドレーションされていません。言い換えると、`http://localhost:3000` にアクセスして表示されたボタンにはイベントハンドラーがアタッチされておらず、ボタンをクリックしても数字は変化しないのです。Astro ではこのようにして、クライアントサイドでの不要な JavaScript の実行を抑制しているわけです。

コンポーネントをハイドレーションするためには、`client:*` ディレクティブを使用します。この `client:*` ディレクティブにより、あるコンポーネントをハイドレーションするかどうか、またそれに必要なコードを送信するタイミングをどうするか、を Astro に対して指示することができます。

たとえば、`client:load` を使用すると、コンポーネントの実行に必要なコードはページロード時に送信されます:

```tsx:src/pages/index.astro
---
import { MyFirstIsland } from '../components/MyFirstIsland';
---
<MyFirstIsland client:load />
```

これをブラウザで開くと、見た目上の変化はありませんが、開発者ツールから

* 以前は `<button>Clicked 0 times</button>` という HTML が埋め込まれていた箇所に、`<style>` や `<script>`、`<astro-island>` などの要素が埋め込まれていること
* 通信されるファイル数が増えていること

などが確認できるはずです。こうした追加のコストを払うことで、コンポーネントを Island として独立して動作させることができます。

なお、`client:load` 以外のディレクティブとしては、ユーザーの viewport にコンポーネントが入ったタイミングでコードのローディングを開始する `client:visible` や、メディアクエリによってローディングのタイミングを指定する `client:media` など、様々なものが用意されています。詳しくは Astro のドキュメントを参照してください:

https://docs.astro.build/en/reference/directives-reference/#client-directives

## Islands

ここまでに書いた内容で、Astro における Islands Architecture

# 補論: Astro におけるレンダリングパターンと Prerender API、そして Astro v2 の話

# おわりに

# 参考

https://docs.astro.build/en/concepts/islands/
https://jasonformat.com/islands-architecture/
https://dev.to/this-is-learning/is-0kb-of-javascript-in-your-future-48og
https://changelog.com/jsparty/105
https://www.patterns.dev/posts/islands-architecture/
https://dev.to/this-is-learning/resumability-wtf-2gcm
