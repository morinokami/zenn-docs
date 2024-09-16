---
title: "unified によるコンテンツ処理"
---

## 章の目標

TODO: unified と AST の関係を説明する

ウェブはコンテンツで溢れています。ウェブ上のコンテンツを消費する際、典型的にはブラウザを用いてサーバーから取得した HTML を閲覧することになりますが、コンテンツは常に HTML によって記述されているわけではありません。たとえば、あなたが今（おそらくブラウザ上で）読んでいるこの文章は、もともと Markdown という形式の言語により記述されましたが、それが HTML へと変換された上で現在ブラウザ内にレンダリングされています。あるいはブログ記事などの場合、CMS（Content Management System）上でコンテンツを作成し、そのデータを API 経由で取得し、サーバーで HTML をビルドしてからブラウザに送信しているかもしれません。このように、コンテンツがブラウザ上に表示されるまでには、さまざまな形式のデータが加工・変換されるプロセスが含まれることが少なくありません。

この章では、こうしたコンテンツ処理のプロセスを、unified という仕組みを用いて統一的におこなう方法について解説します。unified は、HTML や Markdown、自然言語などのコンテンツを処理するためのツールチェーンを提供しており、シンプルかつ一貫した設計思想に基づき作成されています。また拡張性にも優れており、独自のプラグインを unified エコシステムの中で活用することも可能です。

あとで説明するように、unified において HTML を扱うための枠組みは rehype と呼ばれているのですが、前章と同様にこの章でも rehype のプラグインを作成していきます。具体的には、ほげほげ


## 章の流れ


## unified とそのエコシステム


## rehype プラグインの作成


## 参考

- [unified](https://unifiedjs.com/): unified の公式サイト
- [Create a retext plugin](https://unifiedjs.com/learn/guide/create-a-retext-plugin/): retext プラグインを作成する公式チュートリアル
- [Create a remark plugin](https://unifiedjs.com/learn/guide/create-a-remark-plugin/): remark プラグインを作成する公式チュートリアル
- [Create a rehype plugin](https://unifiedjs.com/learn/guide/create-a-rehype-plugin/): rehype プラグインを作成する公式チュートリアル
