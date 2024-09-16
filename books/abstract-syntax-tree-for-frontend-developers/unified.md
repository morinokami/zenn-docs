---
title: "unified によるコンテンツ処理"
---

## 章の目標

ウェブはコンテンツで溢れています。ウェブ上のコンテンツを消費する際、典型的にはサーバーから取得した HTML をブラウザにより閲覧することになりますが、コンテンツは常に HTML によって記述されているわけではありません。たとえば、あなたが今（おそらくブラウザ上で）読んでいるこの文章は、もともと Markdown という形式の言語により記述されていましたが、それが HTML へと変換された上で現在ブラウザ内にレンダリングされています。そしてその変換の過程において、たとえば単なるヘッダーをリンク付きのものへと置き換えるなど、特定の HTML 要素を望ましいかたちに加工することもよくおこなわれます。このように、コンテンツがブラウザ上に表示されるまでには、さまざまな形式のデータが加工・変換されるプロセスが含まれることが少なくありません。

<!-- こうしたコンテンツ形式の相互変換においても、AST が活躍します。 -->

この章では、こうしたコンテンツ処理のプロセスを、unified という仕組みを用いて統一的におこなう方法について解説します。unified は、HTML や Markdown、自然言語などのコンテンツを AST を通じて処理するためのツールチェーンを提供しており、シンプルかつ一貫した設計思想に基づき作成されています。また拡張性にも優れており、独自のプラグインを unified エコシステムの中で活用することも可能です。

あとで説明するように、unified において HTML を扱うための枠組みは rehype と呼ばれており、前章と同様にこの章でも rehype のプラグインを作成していきます。プログラミング能力を確認するための代表的なお題として [Fizz buzz](https://en.wikipedia.org/wiki/Fizz_buzz) が有名ですが、今回はお笑い界の Fizz buzz である[桂三度](https://ja.wikipedia.org/wiki/%E6%A1%82%E4%B8%89%E5%BA%A6)（世界のナベアツ）氏の「3 の倍数と 3 が付く数字のときだけアホになる」ネタを応用して、「3 の倍数と 3 が付く数字のときだけヘッダーがアホになる」プラグインを作成していきます。「アホになる」の部分については、「ヘッダーの先頭に 🤪 を挿入する」という処理をおこなうことで実現します。以下は、このプラグインを Astro のドキュメントに実際に適用した例となります:

![3 の倍数と 3 が付く数字のときだけヘッダーがアホになる Astro ドキュメント](/images/abstract-syntax-tree-for-frontend-developers/fool-on-three-demo.png)

今回作成するプラグインも、[rehype-fool-on-three](https://www.npmjs.com/package/rehype-fool-on-three) という名の npm パッケージとして公開しています。以下の StackBlitz のリンクから、このプラグインを実際に Astro のドキュメントに適用した例の確認も可能です:

<!-- TODO: StackBlitz へのリンク -->


## 章の流れ


## unified とそのエコシステム

### unified について

[unified](https://unifiedjs.com/) は、AST を通じてコンテンツを処理するためのインターフェースです。ここで「コンテンツ」とは、HTML や Markdown、自然言語などの形式のデータを指します。「処理」という言葉には、以下の要素が含まれます:

- 構文解析（parse）: コンテンツを AST へと変換する
- 変換（transform）: AST に対する操作や、ある AST から別の AST への変換をおこなう。複数の変換を組み合わせることができる
- 文字列化（stringify）: AST を特定の形式のデータへと戻す

以上をまとめた図を unified の GitHub リポジトリの README から引用します:

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

一見すると違いがほとんどありませんが、これこそが unified が統一的な枠組みを提供していることの証左です。細かく見れば、与えられるコンテンツの形式に応じてパーサーの種類（`remarkParse` と `rehypeParse`）や変換方法（`remarkRehype` と `rehypeRemark`）などが異なっていますが、大枠として、どちらのプログラムも `unified` 関数を呼び出し、その戻り値に対して `use` メソッドをチェインし「構文解析、変換、文字列化」という処理を適用している点は共通しています。また、プラグインの命名規則も一貫していることがわかるはずです。このように unified は、様々なコンテンツに対して共通の形式により処理を適用できるようになっているため、ユーザーは一度その仕組みを理解してしまえば、異なる形式のコンテンツに対しても同じようなプログラムを書くことができるというわけです。

### unified のエコシステム

unified の大まかなイメージがつかめたところで、続いて詳細について見ていきましょう。上で述べたように、unified では

- 構文解析
- 変換
- 文字列化

という流れを指定しますが、各ステップに対応するパッケージが数多く提供されていますので、ここでその一部を紹介します。

#### 構文解析

まず、構文解析に関するパッケージとしては、以下のようなものがあります:

- [rehype-parse](https://unifiedjs.com/explore/package/rehype-parse/): HTML パーサー
- [remark-parse](https://unifiedjs.com/explore/package/remark-parse/): Markdown パーサー
- [retext-english](https://unifiedjs.com/explore/package/retext-english/): 英文パーサー

これらのパーサーによりコンテンツは AST へと変換されますが、ここで unified 独特の言葉遣いに注意しましょう。unified の世界では、たとえば Markdown に関連するエコシステムは remark という名前により分類されています。慣れるまでは混乱するかもしれませんが、頻繁に使用するものの数はそれほど多くないため、何度か使用するうちに自然と覚えてしまうはずです。コンテンツの形式とそのエコシステムの呼び名の対応関係は以下のようになります:

- [rehype](https://github.com/rehypejs/rehype): HTML
- [remark](https://github.com/remarkjs/remark): Markdown
- [retext](https://github.com/retextjs/retext): 自然言語

また、各種パーサーが生成する AST も、コンテンツの形式ごとに名前が異なります:

- [hast](https://github.com/syntax-tree/hast): HTML
- [mdast](https://github.com/syntax-tree/mdast): Markdown
- [nlcst](https://github.com/syntax-tree/nlcst): 自然言語

各 AST は、[unist](https://github.com/syntax-tree/unist) という構文木の仕様をもとに標準化されています。これにより、ほげ


## rehype プラグインの作成


## 参考

- [unified](https://unifiedjs.com/): unified の公式サイト
- [Intro to unified](https://unifiedjs.com/learn/guide/introduction-to-unified/): unified の概要
- [Create a retext plugin](https://unifiedjs.com/learn/guide/create-a-retext-plugin/): retext プラグインを作成する公式チュートリアル
- [Create a remark plugin](https://unifiedjs.com/learn/guide/create-a-remark-plugin/): remark プラグインを作成する公式チュートリアル
- [Create a rehype plugin](https://unifiedjs.com/learn/guide/create-a-rehype-plugin/): rehype プラグインを作成する公式チュートリアル
