---
title: "AST とは何か"
---

この章では、本書を理解するために必要な、AST の概要やその役割、また JavaScript 特有の AST を取り巻く状況について説明します。


## AST の基礎知識

AST (Abstract Syntax Tree、抽象構文木) とは、ソースコードという一連の文字列を構文解析、すなわちパース (parse) した結果を表わすデータ構造のことです。JavaScript における AST はオブジェクト (JSON) として表現されます。ソースコードを AST へと変換することで、文字列のままでは難しかったコードの解析や変換が容易になります。

AST はその名の通り、構文解析されたコードの構造を木構造として表現したものです。木構造とは、ノード (node) と呼ばれる要素が、エッジ (edge) と呼ばれる線で結ばれた構造のことです。ソースコードがパースされる際、変数や関数、リテラルなどの要素が対応するノードへとマッピングされ、各ノードがエッジにより結ばれて木構造を形成します。たとえば以下は、`const x = 1;` というコードをパースした結果の AST を表わす画像です^[この画像は https://www.jointjs.com/demos/abstract-syntax-tree にて生成しました。]:

![AST のビジュアル表現](/images/abstract-syntax-tree-for-frontend-developers/ast.png)

上の画像から、まずこの AST は Program というノードをルートにもつことがわかります。そしてその子ノードとして、`const x = 1;` に対応する VariableDeclaration ノードがあり、さらにその子ノードとして `x = 1` に対応する VariableDeclarator ノードが存在しています。さらに VariableDeclarator ノードは、`x` に対応するノードと `1` に対応するノードを子ノードとしてもっており、`1` という値を `x` という変数に代入するという意図が表現されています。全体として、もとのコードが達成しようとしていた変数の宣言が

Abstract Syntax Tree や抽象構文木という言葉には「Abstract」や「抽象」という言葉が含まれていますが、この意味は上の図からわかります。上の図の中には、変数が宣言されたことや、その変数にどういった値が入るかとった、ソースコードが表現する意味に関する内容は表現されていますが、`x = 1;` の中のスペースの数やセミコロンの存在など、言語の意味と関係ない部分については捨象されています。このように、AST はコードの意味的な構造のみを抽出したものであることから、「抽象」などの語によって形容されているというわけです^[なお、スペースの数やセミコロンの有無など、ソースコードの詳細をすべて含んだ木構造は Concrete Syntax Tree、具象構文木と呼ばれます。]。

なお、上の AST の図はあくまでわかりやすさのために簡略化されたものであり、実際の AST は既に述べたように JSON として表現され、より細かい情報も含まれることに注意してください。以下では実例として、Esprima というパーサーによって生成された AST を示します:

```json:"const x = 1;" の AST
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "x",
            "range": [
              6,
              7
            ]
          },
          "init": {
            "type": "Literal",
            "value": 1,
            "raw": "1",
            "range": [
              10,
              11
            ]
          },
          "range": [
            6,
            11
          ]
        }
      ],
      "kind": "const",
      "range": [
        0,
        12
      ]
    }
  ],
  "sourceType": "module",
  "range": [
    0,
    12
  ]
}
```

`const x = 1;` という短いコードに対して、一見するとかなり複雑なデータが生成されており、ぎょっとするかもしれませんが、よく見れば先ほどの図と対応した構造になっていることがわかります。`type` というフィールドには、先ほど見た Program や VariableDeclaration などのノードの種類が記述されており、各 `type` に対応するオブジェクトの包含関係により木構造が表現されています。さらに、ノードがソースコード上でどの位置にあるかを示す `range` などのフィールドにより、ノードとソースコードの対応関係が保持されていることなどもわかります。

プログラミングの過程において、ここまで説明してきた AST は幅広い用途で利用されます。たとえば ESLint や Prettier は、AST を起点としてコードの問題点を検出したり、コードを整形します。あるいは TypeScript は、AST を利用して型情報の解析やコードの変換をおこないます。さらには、あなたが書いたコードを実行する際にも、JavaScript エンジンは AST を中間形態として生成します。このように、プログラムの記述から実行に至るあらゆる段階において、AST は重要な役割を果たしているのです。本書では、AST が各段階においてどのように使われているかを理解し、さらには必要に応じて自分自身で AST を操作できるようになることを目指します。


## JavaScript と AST

JavaScript プロジェクトの開発では、他の言語と比較し AST を意識することが多くなります。これは、JavaScript の実行環境が多様であるという特殊事情に起因します。JavaScript の代表的な実行環境はブラウザですが、ユーザーの使用するブラウザは様々であり、サポートされる JavaScript の機能もまちまちです。そのため、開発者はコードを配布する前に、より多くのブラウザでコードが動作するようにコードの変換、いわゆるトランスパイル (transpile) をおこなうことが一般的です。トランスパイルの際、コードは AST へと変換され、特定のノードは「動作は等しいがより幅広い環境で動作する」別のコードに対応するノードへと置換されます。

また、TypeScript によりコードを記述することは、2024 年現在もはやモダンですらないほどに当たり前のこととなりましたが、TypeScript はあくまで JavaScript のスーパーセットであり、そのままでは JavaScript の処理系は実行できません^[[Node.js v22.6.0](https://nodejs.org/en/blog/release/v22.6.0) において `--experimental-strip-types` というフラグが実験的な機能として追加されました。これは型アノテーションを自動的に削除することで、`.ts` ファイルを Node.js が直接実行することを可能にするものです。Enum や Namespaces など、TypeScript の一部の機能はサポートされてはいませんが、Deno や Bun などのように処理系そのものが TypeScript をサポートし、コード変換を不要としようとする流れがあるようです。]。そこで、TypeScript のコードをまず JavaScript へとコンパイルし、コンパイルされた JavaScript を実行するという手順が取られるわけですが、このコンパイルの過程においても AST が生成されており、そこでたとえば型アノテーションなどの TypeScript 固有の構文に対応するノードが削除あるいは d.ts ファイルに変換されるといった処理がおこなわれます。

さらに、うんたらかんたら

:::message
[コラム] コンパイルとトランスパイル
:::


## ESTree と各種パーサー

JavaScript のエコシステムにおいて、AST の仕様としてデファクトスタンダードとなっているのが [ESTree](https://github.com/estree/estree) です。ESTree の仕様は https://github.com/estree/estree にて Markdown として公開されており、その運営は主に ESLint や Babel、Acorn のメンバーによっておこなわれています。ECMAScript の仕様を定めた [ECMA-262](https://ecma-international.org/publications-and-standards/standards/ecma-262/) のようないわゆるウェブ標準とは異なり、ESTree はあくまでコミュニティによって定められた AST の表現に関する「ゆるい約束事」であり、そのため ESTree にある程度準拠しつつも必要に応じて拡張・改変された方言が複数存在しているというのが、JavaScript の AST に関する状況です^[ESTree の概要や目的については、https://sosukesuzuki.dev/advent/2022/06/ が詳しいです。]。

ソースコードをパースするソフトウェアのことを一般にパーサー (parser) と呼びます。上で JavaScript の AST は複数の種類があると述べましたが、これはつまり複数のパーサーが存在し、それぞれが異なる AST を出力するということです。以下に代表的な JavaScript のパーサーを挙げます:

TODO: 単に並列するのではなく、「何系と何系があり、X は何系に分類される」というかたちにする？

- [Acorn](https://github.com/acornjs/acorn)
- [@babel/parser](https://babeljs.io/docs/babel-parser)
- [@typescript-eslint/parser](https://typescript-eslint.io/packages/parser/)
- [Esprima](https://esprima.org/)
- [Espree](https://github.com/eslint/js)


## AST と付き合う際に便利なツールたち


## 参考

- [AST Explorer](https://astexplorer.net/)
- [JavaScript AST Visualizer](https://www.jointjs.com/demos/abstract-syntax-tree)
- [The ESTree Spec](https://github.com/estree/estree)
- [ESTree とは](https://sosukesuzuki.dev/advent/2022/06/)
- [JavaScript ASTを始める最初の一歩](https://efcl.info/2016/03/06/ast-first-step/)
- [ESTree 互換っぽい AST を出力する JavaScript のパーサーまとめ](https://zenn.dev/sosukesuzuki/scraps/fa4d48f9098d66)
- [Understand Abstract Syntax Trees - ASTs - in Practical and Useful Ways for Frontend Developers](https://www.youtube.com/watch?v=tM_S-pa4xDk)
- [Harnessing The Power of Abstract Syntax Trees by Jamund Ferguson](https://www.youtube.com/watch?v=8uOXIM4giH8)
