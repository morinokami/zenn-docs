---
title: "unified によるコンテンツ処理"
---

## 章の目標

TODO: unified と AST の関係を説明する

ウェブはコンテンツで溢れています。ウェブ上のコンテンツを消費する際、典型的にはサーバーから取得した HTML をブラウザにより閲覧することになりますが、コンテンツは常に HTML によって記述されているわけではありません。たとえば、あなたが今（おそらくブラウザ上で）読んでいるこの文章は、もともと Markdown という形式の言語により記述されていましたが、それが HTML へと変換された上で現在ブラウザ内にレンダリングされています。そしてその変換の過程において、たとえば単なるヘッダーをリンク付きのものへと置き換えるなど、特定の HTML 要素を望ましいかたちに加工することもよくおこなわれます。このように、コンテンツがブラウザ上に表示されるまでには、さまざまな形式のデータが加工・変換されるプロセスが含まれることが少なくありません。

<!-- こうしたコンテンツ形式の相互変換においても、AST が活躍します。 -->

この章では、こうしたコンテンツ処理のプロセスを、unified という仕組みを用いて統一的におこなう方法について解説します。unified は、HTML や Markdown、自然言語などのコンテンツを処理するためのツールチェーンを提供しており、シンプルかつ一貫した設計思想に基づき作成されています。また拡張性にも優れており、独自のプラグインを unified エコシステムの中で活用することも可能です。

あとで説明するように、unified において HTML を扱うための枠組みは rehype と呼ばれているのですが、前章と同様にこの章でも rehype のプラグインを作成していきます。プログラミング能力を確認するための代表的なお題として [Fizz buzz](https://en.wikipedia.org/wiki/Fizz_buzz) が有名ですが、今回はお笑い界の Fizz buzz である[桂三度](https://ja.wikipedia.org/wiki/%E6%A1%82%E4%B8%89%E5%BA%A6)（世界のナベアツ）氏の「3 の倍数と 3 が付く数字のときだけアホになる」ネタを応用して、「3 の倍数と 3 が付く数字のときだけヘッダーがアホになる」プラグインを作成していきます。「アホになる」の部分については、「ヘッダーの先頭に 🤪 を挿入する」という処理をおこなうことで実現します。以下は、このプラグインを Astro のドキュメントに実際に適用した例となります:

![3 の倍数と 3 が付く数字のときだけアホになる Astro ドキュメント](/images/abstract-syntax-tree-for-frontend-developers/fool-on-three-demo.png)

今回作成するプラグインも、[rehype-fool-on-three](https://www.npmjs.com/package/rehype-fool-on-three) という名の npm パッケージとして公開しています。以下の StackBlitz のリンクから、このプラグインを実際に Astro のドキュメントに適用した例の確認も可能です:

<!-- TODO: StackBlitz へのリンク -->


## 章の流れ


## unified とそのエコシステム


## rehype プラグインの作成


## 参考

- [unified](https://unifiedjs.com/): unified の公式サイト
- [Create a retext plugin](https://unifiedjs.com/learn/guide/create-a-retext-plugin/): retext プラグインを作成する公式チュートリアル
- [Create a remark plugin](https://unifiedjs.com/learn/guide/create-a-remark-plugin/): remark プラグインを作成する公式チュートリアル
- [Create a rehype plugin](https://unifiedjs.com/learn/guide/create-a-rehype-plugin/): rehype プラグインを作成する公式チュートリアル
