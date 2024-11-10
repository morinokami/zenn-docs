---
title: "unified によるコンテンツ処理"
---

## 章の目標

ウェブはコンテンツで溢れています。ウェブ上のコンテンツを消費する際、典型的にはサーバーから取得した HTML をブラウザにより閲覧することになりますが、コンテンツは常に HTML によって記述されているわけではありません。たとえば、あなたが今（おそらくブラウザ上で）読んでいるこの文章は、もともと Markdown という形式の言語により記述されていましたが、それが HTML へと変換された上で現在ブラウザ内にレンダリングされています。そしてその変換の過程において、たとえば単なるヘッダーをリンク付きのものへと置き換えるなど、特定の HTML 要素を望ましいかたちに加工することもよくおこなわれます。このように、コンテンツがブラウザ上に表示されるまでには、さまざまな形式のデータが加工・変換されるプロセスが含まれることが少なくありません。

<!-- こうしたコンテンツ形式の相互変換においても、AST が活躍します。 -->

この章では、こうしたコンテンツ処理のプロセスを、unified という仕組みを用いて統一的におこなう方法について解説します。unified は、HTML や Markdown、自然言語などのコンテンツを AST を通じて処理するためのツールチェーンを提供しており、シンプルかつ一貫した設計思想に基づき作成されています。また拡張性にも優れており、独自のプラグインを unified エコシステムの中で活用することも可能です。

あとで説明するように、unified において HTML を扱うための枠組みは rehype と呼ばれており、前章と同様にこの章でも rehype のプラグインを作成していきます。プログラミング能力を確認するための代表的なお題として [Fizz buzz](https://en.wikipedia.org/wiki/Fizz_buzz) が有名ですが、今回はお笑い界の Fizz buzz である[桂三度](https://ja.wikipedia.org/wiki/%E6%A1%82%E4%B8%89%E5%BA%A6)（世界のナベアツ）氏の「3 の倍数と 3 が付く数字のときだけアホになる」ネタを応用して、「3 の倍数と 3 が付く数字のときだけヘッダーがアホになる」プラグインをお題として作成していきます。「アホになる」の部分については、「ヘッダーの先頭に 🤪 を挿入する」という処理をおこなうことで実現します。以下は、例としてこのプラグインを [Astro のドキュメント](https://docs.astro.build/)に実際に適用した際のスクリーンショットです:

![3 の倍数と 3 が付く数字のときだけヘッダーがアホになる Astro ドキュメント](/images/abstract-syntax-tree-for-frontend-developers/fool-on-three-demo.png)

今回作成するプラグインも、[rehype-fool-on-three](https://www.npmjs.com/package/rehype-fool-on-three) という名の npm パッケージとして公開しています。以下の StackBlitz のリンクから、このプラグインを実際に Astro のドキュメントに適用した例の確認も可能です:

<!-- TODO: StackBlitz へのリンク -->


## 章の流れ


## unified とそのエコシステム

### unified について

[unified](https://unifiedjs.com/) は、AST を通じてコンテンツを処理するためのインターフェースです。ここで「コンテンツ」とは、HTML や Markdown、自然言語などの形式のデータを指します。また「処理」という言葉には、以下の要素が含まれます:

- 構文解析（parse）: コンテンツを AST へと変換する
- 変換（transform）: AST に対する操作・検査や、ある AST から別の AST への変換をおこなう。複数の変換処理を組み合わせることができる
- 文字列化（stringify）: AST を特定の形式の文字列データへと変換する

以上をまとめた図を [unified の GitHub リポジトリ](https://github.com/unifiedjs/unified)の README から引用します:

```
| ........................ process ........................... |
| .......... parse ... | ... run ... | ... stringify ..........|

          +--------+                     +----------+
Input ->- | Parser | ->- Syntax Tree ->- | Compiler | ->- Output
          +--------+          |          +----------+
                              X
                              |
                       +--------------+
                       | Transformers |
                       +--------------+
```

上で、unified は「インターフェース」であると述べました。ここがわかりづらい点なのですが、unified 自体は上で述べたコンテンツを処理するための機能を直接提供しているというわけではなく、それらを統一的につなぎ合わせる役割のみを担います。各プロセスをつなぎ合わせるパイプには特定のかたち、すなわちインターフェースがあり、ユーザーはこのインターフェースに合わせてプラグインを作成することで、unified が提供するエコシステムと組み合わせることができます。

このことを、具体的なコードにより確認しましょう。以下は、Markdown ファイルを unified により HTML に変換するプログラムです:

```js
import fs from "node:fs/promises";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const document = await fs.readFile("example.md", "utf8");

const file = await unified()
  .use(remarkParse)     // 構文解析
  .use(remarkRehype)    // Markdown から HTML への変換
  .use(rehypeStringify) // 文字列化
  .process(document);   // コンテンツの読み込み
```

これと逆の処理、すなわち HTML を Markdown に変換するプログラムは以下のようになります:

```js
import fs from "node:fs/promises";
import remarkStringify from "remark-stringify";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import { unified } from "unified";

const document = await fs.readFile("example.html", "utf8");

const file = await unified()
  .use(rehypeParse)     // 構文解析
  .use(rehypeRemark)    // HTML から Markdown への変換
  .use(remarkStringify) // 文字列化
  .process(document);   // コンテンツの読み込み
```

一見すると違いがほとんどありませんが、これこそが unified が統一的な枠組みを提供していることの証左です。細かく見れば、与えられるコンテンツの形式に応じて

- パーサーの種類（`remarkParse` と `rehypeParse`）
- 変換方法（`remarkRehype` と `rehypeRemark`）
- 文字列化の方法（`rehypeStringify` と `remarkStringify`）

などが異なっていますが、大枠として、どちらのプログラムも `unified` 関数を呼び出し、その戻り値に対して `use` メソッドをチェインし「構文解析、変換、文字列化」という処理を適用している点は共通しています。また、プラグインの命名規則も一貫していることがわかるはずです。このように、unified は様々なコンテンツに対して共通の形式により処理を適用できるようになっているため、ユーザーは一度その仕組みを理解してしまえば、異なる形式のコンテンツに対しても同じようなプログラムを書くことができるというわけです。

### unified のエコシステム

unified の大まかなイメージがつかめたところで、続いて詳細について見ていきましょう。上で述べたように、unified では

- 構文解析
- AST の変換・検査
- 文字列化

という要素を指定しますが、各ステップに対応するパッケージが数多く提供されていますので、ここでその一部を紹介します。

#### 構文解析

まず、構文解析に関するパッケージとしては、以下のようなものがあります:

- [rehype-parse](https://unifiedjs.com/explore/package/rehype-parse/): HTML パーサー
- [remark-parse](https://unifiedjs.com/explore/package/remark-parse/): Markdown パーサー
- [retext-english](https://unifiedjs.com/explore/package/retext-english/): 英文パーサー

これらのパーサーによりコンテンツは AST へと変換されますが、ここで unified 独特の言葉遣いについて確認しておきましょう。unified の世界では、たとえば Markdown に関連するエコシステムは remark という名前により分類されています。慣れるまでは混乱するかもしれませんが、頻繁に使用するものの数はそれほど多くないため、何度か使用するうちに自然と覚えてしまうはずです。コンテンツの形式とそのエコシステムの呼び名の対応関係は以下のようになります:

- [rehype](https://github.com/rehypejs/rehype): HTML
- [remark](https://github.com/remarkjs/remark): Markdown
- [retext](https://github.com/retextjs/retext): 自然言語

また、各種パーサーが生成する AST も、コンテンツの形式ごとに名前が異なります:

- [hast](https://github.com/syntax-tree/hast): HTML
- [mdast](https://github.com/syntax-tree/mdast): Markdown
- [nlcst](https://github.com/syntax-tree/nlcst): 自然言語

各 AST は [unist](https://github.com/syntax-tree/unist) という構文木の仕様をベースに拡張されており、「unist により規定された共通部分 + コンテンツの形式ごとの拡張部分」という構成になっています。

#### 変換

unified の目的は AST を通じたコンテンツの処理であるため、変換用のパッケージの数は最も多くなっています。大まかには、たとえば mdast から hast への変換のように AST の種類を変換するタイプと、AST の内容を改変あるいは検査するタイプとに分類できます。以下は代表的な変換用パッケージの例です:

- AST の種類を変換する
  - [remark-rehype](https://unifiedjs.com/explore/package/remark-rehype/): mdast から hast への変換
  - [rehype-remark](https://unifiedjs.com/explore/package/rehype-remark/): hast から mdast への変換
  - [remark-retext](https://unifiedjs.com/explore/package/remark-retext/): mdast から nlcst への変換
  - [rehype-retext](https://unifiedjs.com/explore/package/rehype-retext/): hast から nlcst への変換
- AST の内容を改変・検査する
  - [rehype-slug](https://unifiedjs.com/explore/package/rehype-slug/): ヘッダー要素に ID を付与する
  - [rehype-minify-whitespace](https://unifiedjs.com/explore/package/rehype-minify-whitespace/): HTML 内の不要な空白を削除する。同様の処理（いわゆる minification）をおこなうパッケージは https://unifiedjs.com/explore/project/rehypejs/rehype-minify/ にまとめられている
  - TODO: 他にもある

#### 文字列化

文字列化に関するパッケージとしては、以下のようなものがあります:

- [rehype-stringify](https://unifiedjs.com/explore/package/rehype-stringify/): HTML の文字列化
- [remark-stringify](https://unifiedjs.com/explore/package/remark-stringify/): Markdown の文字列化
- [retext-stringify](https://unifiedjs.com/explore/package/retext-stringify/): 自然言語の文字列化


## rehype プラグイン作成のための準備

ここまでの説明により、unified とそのエコシステムに関する概要を理解できたはずです。ここからは、実際に rehype プラグインを作成していきましょう。

この章の冒頭で述べたように、目標は「3 の倍数と 3 が付く数字のときだけヘッダーがアホになる」プラグインを作成することです。これを unified の知識を用いて言い換えると、「HTML のAST である hast が与えられたときに、その中のヘッダー要素をカウントしていき、その番号が 3 の倍数と 3 が付く数であれば、ヘッダー要素内のテキストノードの先頭に『🤪』を挿入する」という処理をおこなうような rehype プラグインを作成する、ということになります。構文解析や文字列化についてはその外部においておこなわれるため、それらについては考慮する必要はなく、hast を走査し必要な変換をおこなうことに集中すればよいわけです。

### プロジェクトの作成

プラグインを作成するための準備として、まずは以下のコマンドを実行してプロジェクトを作成しましょう:

```sh
$ mkdir rehype-fool-on-three
$ cd rehype-fool-on-three
$ npm init -y
```

続いて、プラグインを実装するファイルと、そのテストに必要なファイルとディレクトリをそれぞれ作成します:

```sh
$ mkdir -p src/fixtures
$ touch src/index.ts src/index.test.ts
```

各ファイルとディレクトリの役割は以下の通りです:

- `src/index.ts`: プラグインの実装
- `src/fixtures/`: プラグインのテストに用いる HTML ファイルを格納する。a.html と a.out.html のように、入力と期待される出力のペアを配置することとする
- `src/index.test.ts`: プラグインのテスト。`fixtures` ディレクトリ内のファイルを読み込み、プラグインを適用した結果が期待される出力と一致することを確認する

さらに、プラグインの作成に必要となるパッケージの一部についてインストールしておきましょう:

```sh
npm install unified unist-util-visit
```

`unist-util-visit` は、名前の中に visit という単語が含まれていることからわかる通り、AST を走査するためのユーティリティです。プラグインの実装において、与えられた hast を走査するためにこれを使用します。

また、package.json に `"type": "module"` を追加しておきましょう:

```json:package.json
{
  "type": "module",
  // ...
}
```

### TypeScript 環境のセットアップ

AST を扱う際、型情報は非常に有用となります。ここでも TypeScript を用いてプラグインを実装していきましょう。必要となるパッケージをインストールします:

```sh
npm install @types/hast @types/node rehype typescript --save-dev
```

tsconfig.json を以下の内容で作成します:

```json:tsconfig.json
{
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"],
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "outDir": "dist",
    "declaration": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

ビルドコマンドも設定しておきましょう。今回は簡易的に `tsc` を用いてビルドすることとします:

```json:package.json
  "scripts": {
    "build": "tsc"
  },
  // ...
}
```

### テストの作成

プラグインを実装する前に、プラグインの振る舞いを確認するためのテストを作成しておきましょう。テストランナーには Vitest を使用するため、以下のコマンドを実行してインストールします:

```sh
npm install -D vitest
```

package.json にテスト用コマンドを追加します:

```json:package.json
{
  // ...
  "scripts": {
    // ...
    "test": "vitest"
  },
  // ...
}
```

上でも述べた通り、今回は `fixtures` ディレクトリ内に入力と期待される出力のペアを配置してテストに使用します。そこで、まずは入力に対応する HTML ファイルを `a.html` として `fixtures` ディレクトリ内に作成しましょう。ここではわかりやすさのため、`<h>` タグをの中に 1 から 14 までの数字を記述したものを並べます。また、`<h>` 以外は無視されることを確認するために、`<p>` タグも差し込んでおきます:

```html:src/fixtures/a.html
<h1>1</h1>
<p>hoge</p>
<h2>2</h2>
<h2>3</h2>
<h2>4</h2>
<h3>5</h3>
<h4>6</h4>
<h4>7</h4>
<h3>8</h3>
<h2>9</h2>
<h3>10</h3>
<h3>11</h3>
<h4>12</h4>
<h5>13</h5>
<h6>14</h6>
```

次に、この HTML ファイルに対してプラグインを適用した際に期待される出力を `a.out.html` として作成します:

```html:src/fixtures/a.out.html
<h1>1</h1>
<p>hoge</p>
<h2>2</h2>
<h2>🤪 3</h2>
<h2>4</h2>
<h3>5</h3>
<h4>🤪 6</h4>
<h4>7</h4>
<h3>8</h3>
<h2>🤪 9</h2>
<h3>10</h3>
<h3>11</h3>
<h4>🤪 12</h4>
<h5>🤪 13</h5>
<h6>14</h6>
```

さらに、`<h>` タグの中に別のタグが含まれている場合や、`<h>` タグの中が空である場合の振る舞いについてもテストすることにしましょう:

```html:src/fixtures/b.html
<h1>1</h1>
<h2>2</h2>
<h2><a>3</a> <a>meh</a></h2>
<h3>4</h3>
<h3>5</h3>
<h3></h3>
```

このようなケースにおいてどのように絵文字を挿入するべきでしょうか。これはプラグインの仕様次第ですが、ここでは `<h>` タグ内の最初のテキストノードの先頭に絵文字を挿入し、テキストノードが存在しなければ絵文字を含む新しいテキストノードを挿入する、というルールとします:

```html:src/fixtures/b.out.html
<h1>1</h1>
<h2>2</h2>
<h2><a>🤪 3</a> <a>meh</a></h2>
<h3>4</h3>
<h3>5</h3>
<h3>🤪</h3>
```

以上により、テストの入力と期待値が用意できたため、続いてテストを記述していきます。このテストでは、実際に `a.html` などの入力用ファイルをパースして hast へと変換した上でプラグインを適用し、その結果を再度 HTML 文字列へと戻したものを、期待値と比較します。以下がそのテストコードです:

```typescript:src/index.test.ts
import fs from "node:fs";
import { rehype } from "rehype";
import { describe, expect, test } from "vitest";

import rehypeFoolOnThree from "./index";

function readFixture(name: string): string {  // 1. フィクスチャーファイルを読み込む関数
  return fs.readFileSync(
    new URL(`./fixtures/${name}`, import.meta.url),
    "utf8",
  );
}

describe("rehypeFoolOnThree", async () => {
  test.each([  // 2. 複数のテストケースを順に実行
    ["a.html", "a.out.html"],
    ["b.html", "b.out.html"],
  ])("%s", async (input, expected) => {
    const file = await rehype()  // 3. unified プロセッサーを初期化し rehype-parse と rehype-stringify を適用
      .data("settings", { fragment: true })  // 4. インプットの HTML が不完全であることを指定
      .use(rehypeFoolOnThree)  // 5. プラグインを適用
      .process(readFixture(input));

    expect(file.toString()).toBe(readFixture(expected));
  });
});
```

上のコメントに従って、テストコードの各部分について説明します:

1. `readFixture` 関数は、`fixtures` ディレクトリ内のファイルを読み込むためのヘルパー関数です
2. [`test.each`](https://vitest.dev/api/#test-each) は、複数のテストケースを順に実行するための関数です。ここでは `a.html` と `b.html` の 2 つのテストケースを順に実行します


## プラグインの実装


## 参考

- [unified](https://unifiedjs.com/): unified の公式サイト
- [Intro to unified](https://unifiedjs.com/learn/guide/introduction-to-unified/): unified の概要
- [Create a retext plugin](https://unifiedjs.com/learn/guide/create-a-retext-plugin/): retext プラグインを作成する公式チュートリアル
- [Create a remark plugin](https://unifiedjs.com/learn/guide/create-a-remark-plugin/): remark プラグインを作成する公式チュートリアル
- [Create a rehype plugin](https://unifiedjs.com/learn/guide/create-a-rehype-plugin/): rehype プラグインを作成する公式チュートリアル
