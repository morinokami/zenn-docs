---
title: "ESLint によるコード検査"
---

TODO: リストにおける日本語（主に「ですます」とするかどうか、句点の使用）を統一する


## 章の目標

この章では、前章までに学んだ AST に関する知識が、現実的な問題を解決する際にどう役に立つかについて学ぶために、ESLint のカスタムルールを作成します。具体的には、以下のような単純なルールを作成することを目標とします:

- コード内の文字列に「ぬるぽ」が含まれている場合、「ガッ 🔨」という警告文を出す

半分冗談のような内容ですが、こうした簡単なルールの作成においても AST の知識が顔を出すことをまず体験してもらうことが狙いです。また、ここで学んだ手法を応用することで、より複雑なルールも作成できそうだということも直観できるはずです。

このカスタムルールを [eslint-plugin-nullpo](https://www.npmjs.com/package/eslint-plugin-nullpo) という名のプラグインとして npm からダウンロードできるようにもしてあります。以下の StackBlitz のリンクなどから、実際の挙動を確認してみてください:

<!-- TODO: StackBlitz へのリンク -->

なお、この「ぬるぽ」と「ガッ」という言葉は、その昔、匿名掲示板 [2 ちゃんねる](https://ja.wikipedia.org/wiki/2%E3%81%A1%E3%82%83%E3%82%93%E3%81%AD%E3%82%8B)において流行した一種のネットミームです。「ぬるぽ」は NullPointerException の略語であり、あるユーザーが「ぬるぽ」と掲示板に書き込むと、それを見た他のユーザーにハンマーで「ガッ」されるという、一種の掛け合いがおこなわれていました:

![「ぬるぽ」と「ガッ」](/images/abstract-syntax-tree-for-frontend-developers/nullpo.png)
*出典: https://www.nullpo.org/test/read.cgi/nullpolog/1024553352/*


## 章の流れ

以下では、まず ESLint について概略し、ESLint を拡張するためのプラグインやカスタムルールについて説明します。さらに、ESLint が AST をどのように処理するかに関するイメージを提示します。その上で、ハンズオン形式により、「ぬるぽ」という文字列を検出し「ガッ」するカスタムルールを作成していきます。また、最後に発展的な話題として、ESLint を代替する可能性を秘めた Biome と、そのプラグイン記述言語の候補 GritQL について触れます。


## ESLint とプラグイン

[ESLint](https://eslint.org/) は、JavaScript のコードを静的解析し、コードに潜む問題を実行前に検出・修正するためのツールです。ESLint では、コードが特定の規則に従っているかどうかをチェックする仕組みを[ルール](https://eslint.org/docs/latest/use/core-concepts/#rules)と呼びます。多くのルールが初めから[組み込まれており](https://eslint.org/docs/latest/rules/)、使用されていない変数を検出する [no-unused-vars](https://eslint.org/docs/latest/rules/no-unused-vars) や、変数の命名規則にキャメルケースを要求する [camelcase](https://eslint.org/docs/latest/rules/camelcase) などがその例です。

こうした内蔵ルール以外が必要になった場合、ESLint をプラグインにより拡張できます。たとえば、React のコードを検査するためのルールは ESLint 本体には含まれていませんが、[eslint-plugin-react](https://www.npmjs.com/package/eslint-plugin-react) というサードパーティー製のプラグインを使用することで、React プロジェクト専用のルールを ESLint によりチェックすることができます。ESLint のコア機能を拡張するためのプラグインは無数にあり、プロジェクトに応じて必要なプラグインを取捨選択できる拡張性が ESLint の強みの一つとなっています。

また、サードパーティー製のプラグインにより必要な機能が提供されていない場合には、独自のルールを作成することも可能です。コア機能に含まれない独自のルールは[カスタムルール](https://eslint.org/docs/latest/extend/custom-rules)と呼ばれます。あとで詳しく説明しますが、カスタムルールは以下のような形式の JavaScript オブジェクトとして定義されます^[https://eslint.org/docs/latest/extend/custom-rules のサンプルを筆者が改変して引用しました。]:

```js:customRule.js
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "ルールの説明",
    },
    fixable: "code",
    schema: [] // オプションなし
  },
  create: function(context) {
    return {
      // コールバック関数
    };
  }
};
```

このルールには、`meta` と `create` という 2 つのプロパティが含まれています。`meta` はルールに関するメタ情報を含み、ざっくり眺めるだけでルールの説明（`description`）やその種類（`type`）、問題が自動的に修正可能かどうか（`fixable`）などの情報を記述可能なことがわかります。一方、`create` 関数はルールの本体であり、ESLint がコードの AST を走査する際に呼び出され問題の有無を判定するコールバック関数群をオブジェクトとして返します。このように定義されたカスタムルールを、以下のように `rules` というオブジェクトにまとめたものが[プラグイン](https://eslint.org/docs/latest/extend/plugins)です^[プラグインには、他にも設定値やプロセッサーを含められます。]:

```js:eslint-plugin-sample.js
const customRule = require("./customRule");
const plugin = {
  rules: {
    "do-something": customRule
  }
};
module.exports = plugin;
```

このようにプラグインを作成することで、他のプロジェクトの ESLint の設定ファイルにおいてこのプラグインを利用し、そこで定義されたカスタムルールを用いてプロジェクト内のコードを検査できるようになります。


## ESLint と AST

続いて、ESLint が AST を通じてコードをどのように検査しているかについてのメンタルモデルを提示します。ESLint の動作の詳細すべてを解説することはしませんが、カスタムルールを追加するにあたり把握しておくべき大まかな動作イメージをここでつかんでください。

ESLint はソースコードが与えられると、まずそれをパースし ESTree 互換の AST へと変換します。この際 [Espree](https://github.com/eslint/js/tree/main/packages/espree) と呼ばれる、[Acorn](https://github.com/ternjs/acorn) をベースとしたパーサーが使用されます。また、TypeScript など JavaScript の言語機能外のコードをパースするための[カスタムパーサー](https://eslint.org/docs/latest/extend/custom-parsers)を使用することもでき、たとえば [typescript-eslint](https://typescript-eslint.io/) は独自の [@typescript-eslint/parser](https://typescript-eslint.io/packages/parser) を提供しています。

<!-- TODO: 「ソースコード」->「AST」の変換のイメージ図 -->

ソースコードを AST に変換した上で、ESLint は AST を深さ優先で走査していきます。走査の過程では `VariableDeclarator` や `BinaryExpression` など様々なノードが現れますが、各ノードに対するチェック内容を定義したものが上で述べたカスタムルールです。ESLint は、あらかじめ設定ファイル内で有効化されているルールを保持しており、特定のノードに出会うたびに「このタイプのノードにはこのルールを適用する」という判断をおこないます。たとえば、オブジェクトリテラルにおけるキーの重複を禁止する [`no-dupe-keys`](https://eslint.org/docs/latest/rules/no-dupe-keys) というルールがありますが、このルールはオブジェクトリテラル全体を表わす `ObjectExpression` ノードや、その内部でプロパティに値を設定している `Property` ノードにおいてルールが適用されるように[実装](https://github.com/eslint/eslint/blob/main/lib/rules/no-dupe-keys.js)されています。つまり、`no-dupe-keys` が設定ファイルにおいて有効化されている場合、ESLint は `ObjectExpression` などのノードを見つけるたびに、同ルールを適用していくというわけです。

<!-- TODO: 深さ優先で探索し、特定のノードにルールを適用しているイメージ図 -->

ルールを適用して問題を検出した場合、ルール内で定義されたエラーメッセージを受け取り、それをユーザーに通知します。ここまでが、ユーザーが ESLint を通じてコードの問題点を発見するまでの一連の流れです。ソースコードから変換された AST を受け取った際、どのようにして特定の問題を検出しそれをユーザーに報告するかを定めたものが、ESLint におけるカスタムルールであるといえます。

以上により、ESLint のカスタムルールやプラグインの概要、ESlint が与えられたルールを用いてどのように AST を検査するかについて理解できたはずです。この準備をもとに、次節から実際にカスタムルールを作成していきます。


## カスタムルール作成のための準備

### プロジェクトの準備

まずはカスタムルールを実装するためのプロジェクトを準備しましょう。以下のコマンドにより、npm プロジェクトを初期化してください:

```sh
$ mkdir eslint-plugin-nullpo
$ cd eslint-plugin-nullpo
$ npm init -y
```

続いて、カスタムルールを配置するためのディレクトリと、必要となるファイルをプレースホルダーとして作成しておきます:

```sh
$ mkdir -p src/rules
$ touch src/index.ts src/rules/no-nullpo.ts src/rules/no-nullpo.test.ts
```

各ファイルの役割は以下の通りです:

- `src/index.ts`: プラグインのエントリーポイントとなるファイルです。ここでプラグインを定義し `export` します。
- `src/rules/no-nullpo.ts`: カスタムルールの実装を記述するファイルです。
- `src/rules/no-nullpo.test.ts`: カスタムルールのテストを記述するファイルです。

なお、`rules` ディレクトリにルールの実装とテストを置いていますが、これは必須ではありません。複数のカスタムルールを作成する場合には `rules` ディレクトリのような場所を用意して管理することが一般的^[たとえば [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin) や [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) などはこの構成となっています。]であるためそれに従っていますが、今回のようにルールの数が少ない場合は各ファイルをフラットに配置しても問題ないでしょう。

### TypeScript 環境の構築

カスタムルールを作成するにあたり、JavaScript を使うことも可能ですが、補完などの恩恵を受けるために TypeScript を使用することとします。以下のコマンドにより、必要なパッケージをインストールします:

```sh
$ npm install @typescript-eslint/utils
$ npm install @types/node @typescript-eslint/parser @typescript-eslint/rule-tester typescript --save-dev
```

カスタムルールを作成するにあたり特に重要なパッケージの役割は以下の 2 つです:

- `@typescript-eslint/utils`: ESLint のカスタムルールを作成するための `ESLintUtils` など、複数のユーティリティを提供するパッケージです。[`@typescript-eslint/eslint-plugin`](https://typescript-eslint.io/packages/eslint-plugin) が提供するプラグインはこのパッケージを使用して作成されています。詳しくは[ドキュメント](https://typescript-eslint.io/packages/utils)を参照してください。
- `@typescript-eslint/rule-tester`: ESLint に組み込まれている [`RuleTester`](https://eslint.org/docs/latest/integrate/nodejs-api#ruletester) をフォークし、TypeScript 向けのルールをテストするために拡張したパッケージです。ESLint の `RuleTester` と同様に、あるルールに対して「問題のない `valid` なコード例」と、「問題のある `invalid` なコード例と期待されるエラー内容」を設定し、ルールが正しく動作するかをテストします。詳しくは[ドキュメント](https://typescript-eslint.io/packages/rule-tester)を参照してください。

続いて tsconfig.json を作成します。今回は簡易的に `tsc` によりビルドすることとします:

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

最後に package.json に `"type": "module"` を指定しておきましょう:

```diff json:package.json
{
  "type": "module",
  // ...
}
```

### メタ情報の記述

準備ができたところで、カスタムルールの実装に取り掛かっていきましょう。`src/rules/no-nullpo.ts` に、このルールのメタ情報を記述します。まずは、`ESLintUtils` を `@typescript-eslint/utils` からインポートし、`createRule` というルールを作成するための関数を作成します:

```ts:src/rules/no-nullpo.ts
import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);
```

`ESLintUtils.RuleCreator` には、ルールの名前を引数に取り、そのルールのドキュメントの URL を返すような関数を渡します。たとえば `no-foo` と `no-bar` という複数のルールを作成する場合、それぞれのドキュメントの URL は `https://example.com/docs/rules/no-foo` と `https://example.com/docs/rules/no-bar` のように同一のパターンをもつことが多いでしょう。`RuleCreator` に URL 生成関数を渡すことで、同一のパターンをもつ URL 文字列を何度も書かずに済むようになります。各ルールに対して生成された URL は、ESLint のルールオブジェクトの `meta.docs.url` に自動的に設定されます。今回はドキュメントの URL もドキュメント自体も存在しないため、便宜的にルール名をそのまま返すようにしている点に留意してください。

続いて、上で作成した `createRule` を使ってルールを作成します:

```ts:src/rules/no-nullpo.ts
// ...

export const rule = createRule({
  create(context) {
    // TODO: ルールの実装
  },
  name: "no-nullpo",
  meta: {
    type: "problem",
    docs: {
      description: "Smack ぬるぽ (nullpo) with a hammer",
    },
    messages: {
      "ga!": "ガッ 🔨",
    },
    schema: [],
  },
  defaultOptions: [],
});
```

`name` にはカスタムルールの名前を記述します。今回は、ぬるぽ（nullpo）を禁止するルールであるため `no-nullpo` という名前を付けています^[ルール名に関する厳密な規則はありませんが、何かを禁止するようなルールの名前には `no-` や `ban-` をプレフィックスとして付けることが多いです。]。

`meta` にはルールのメタ情報を記述します。ここで設定している各値の意味は以下の通りです:

- `type`: ルールの種類を指定します。指定可能な値は以下となります:
  - `"problem"`: エラーやわかりづらい挙動を引き起こし得るようなコードを指摘します。
  - `"suggestion"`: エラーを発生させるわけではないものの、より良いコードの書き方があることを指摘します。
  - `"layout"`: 空白やセミコロンなど、コードの見た目に関する問題を指摘します。
- `docs`: ドキュメンテーションのための情報を記述します。ここではルールの短い説明を `description` に記述しています^[和訳すると『「ぬるぽ」をハンマーでぶっ叩く』のような意味となります。]。 
- `messages`: ルールが出力するメッセージのリストです。キーにはメッセージの ID を、値にはメッセージの内容を記述します。ここでは「ぬるぽ」を検出した際に出力したいメッセージである「ガッ 🔨」を `ga!` という ID で登録しています。
- `schema`: ルールのオプションを指定するためのスキーマを記述します。オプションがない場合は空の配列を指定します。

`defaultOptions` には、オプションのデフォルト値を指定します。今回はオプションがないため空の配列を指定しています。

`create` メソッド内にルールの本体を記述します。具体的な実装については後述しますので、今はプレースホルダーとしてコメントを残しておきます。


### テストの作成

ルールを実装する前にテストを書いておきましょう。上述したように、ESLint には `RuleTester` というルールをテストするためのユーティリティが用意されており、`@typescript-eslint/rule-tester` はこれを TypeScript 向けに拡張したものを提供しています。`src/rules/no-nullpo.test.ts` に、`RuleTester` を使ったテストの骨組みを記述しましょう:

```ts:src/rules/no-nullpo.test.ts
import { RuleTester } from "@typescript-eslint/rule-tester";

import { rule } from "./no-nullpo";

const ruleTester = new RuleTester();

ruleTester.run("no-nullpo", rule, {
  valid: [],
  invalid: [],
});
```

`@typescript-eslint/rule-tester` からインポートした `RuleTester` を初期化し、その `run` メソッドにルール名、ルールの実体、そしてテストケースである `valid` と `invalid` を渡します。`valid` には問題のないコード例、`invalid` には問題のあるコード例を記述します。

ところで、ESLint の `RuleTester` はテスト実行のために `afterAll` などのグローバルなフックが実行環境に存在していることを前提としています。今回はテストフレームワークとして [Vitest](https://vitest.dev/) を使用し、そこで提供されるフックを `RuleTester` に登録します。まずは以下のコマンドにより Vitest をインストールします:

```sh
$ npm install vitest --save-dev
```

続いて、`RuleTester` を初期化する直前でフックを登録します:

```ts:src/rules/no-nullpo.test.ts
// ...

import * as vitest from "vitest";

// ...

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester();
```

さらに、テスト用のコマンドを `package.json` に追加しておきましょう:

```json:package.json
{
  ...
  "scripts": {
    "test": "vitest"
  },
  ...
}
```

これでテストを記述するための準備が整いました。現時点でテストを実行すると、以下のようにテストが存在しない（`No test found`）というエラーが表示されるはずです:

```sh
$ npm run test

> eslint-plugin-nullpo@0.0.1 test
> vitest


 DEV  v2.0.5 /home/foo/dev/eslint-plugin-nullpo

 ❯ src/rules/no-nullpo.test.ts (0)
   ❯ no-nullpo (0)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Suites 2 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/rules/no-nullpo.test.ts [ src/rules/no-nullpo.test.ts ]
Error: No test found in suite src/rules/no-nullpo.test.ts
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

 FAIL  src/rules/no-nullpo.test.ts > no-nullpo
Error: No test found in suite no-nullpo
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯

 Test Files  1 failed (1)
      Tests  no tests
   Start at  19:02:02
   Duration  567ms (transform 28ms, setup 0ms, collect 414ms, tests 2ms, environment 0ms, prepare 43ms)


 FAIL  Tests failed. Watching for file changes...
       press h to show help, press q to quit
```

それでは、実際にテストを書いていきます。まず問題のないケースである `valid` について考えます。こうしたケースは無数に考えられますが、ここでは「ぬるぽ」を含まない文字列の使用をテストケースとします:

```ts:src/rules/no-nullpo.test.ts
ruleTester.run("no-nullpo", rule, {
  valid: [`const hoge = "ガッ";`],
  invalid: [],
});
```

続いて問題のあるケースである `invalid` ですが、こちらは逆に「ぬるぽ」を含む文字列を使用するコードを指定します:

```ts:src/rules/no-nullpo.test.ts
ruleTester.run("no-nullpo", rule, {
  valid: [`const hoge = "ガッ";`],
  invalid: [
    { code: `const nullpo = "ぬるぽ";`, errors: [{ messageId: "ga!" }] },
  ],
});
```

`invalid` の要素となるオブジェクトには、`code` に問題のあるコード例を、`errors` にはそのコード例に対して発生することが期待されるエラーを指定します。すでに `createRule` の `meta.messages` において期待されるエラーメッセージを登録してあるため、ここではその ID を用いてエラーを指定しています。

この段階でテストを実行すると、まだルールを実装していないため、`invalid` に指定したコードにおいてエラーが発生せず、テストが失敗するはずです:

```sh
 FAIL  src/rules/no-nullpo.test.ts > no-nullpo > invalid > const nullpo = "ぬるぽ";
AssertionError: Should have 1 error but had 0: []

- Expected
+ Received

- 1
+ 0
```

これでルールを実装するための準備が整いました！あとはこのテストを通すことがゴールとなります。


## カスタムルールの作成

### `create` 関数について

ここからは実際にカスタムルールの実装をおこなっていきます。上で TODO としていた `create` 関数の中身を埋めていきましょう。

`create` は、引数に `context` オブジェクトを取り、ESLint が AST を走査している際に呼び出されるコールバック関数を登録したオブジェクトを返します。具体的には、以下のようなコードとなります:

```ts
create(context) {
  return {
    // コールバック関数
  };
}
```

`context` オブジェクトはその名の通り、ESLint がコードをチェックする際のコンテキストを保持しています。たとえばチェック対象のファイルに関する情報や、使用しているパーサーなどの情報が含まれており、これらの情報をルールの実装に役立てることができます。また、`context` にはいくつかのメソッドも登録されており、その中でも最も重要なものが `report` です。`report` メソッドは、コード内の問題を検出した際に ESLint に対してその旨を伝えるためのメソッドであり、カスタムルールを作成する際には必ず使用します。たとえば、`createRule` において `messages` に `foo` という ID でメッセージを登録しており、そのメッセージを使ってエラーや警告を ESLint に伝えるには、以下のように `report` メソッドを呼び出します（`node` については後述します）:

```ts
context.report({
  node,
  messageId: "foo",
});
```

`report` には、これ以外にも問題の発生箇所を示す `loc` オブジェクトや、問題を解消するための `fix` 関数などを渡すこともできますが、ここでは実装をシンプルに保つために `messageId` のみを使用してエラーレポートをおこないます。

続いて、`create` が返すオブジェクトについて説明します。このオブジェクトは、「AST 内のあるノードに対し、ルールに適合しているかどうかを判定するための関数を与える」ことを目的とします。そこで指定された関数には引数としてノードの情報が `node` オブジェクトとして与えられるため、それをもとに問題の有無を判定し、問題がある場合は上述した `report` メソッドを呼び出すわけです。たとえば `ReturnStatement` ノードに対して関数を登録するには以下のように記述します:

```ts
create(context) {
  return {
    ReturnStatement(node) {
      // ReturnStatement ノードに対する処理
    },
  };
}
```

`node` オブジェクトがもつプロパティは、ノードの種類により異なります。たとえば上の `ReturnStatement` の場合、`node` は以下のようなプロパティをもちます:

- `type`: ノードの種類を表わす文字列
- `argument`: `ReturnStatement` が返す値を表わすノード
- `range`: ノードのファイル内での開始位置と終了位置を表わす配列、`[number, number]` という構造をもつ
- `loc`: ノードの開始位置と終了位置を表わすオブジェクト、`{ start: { line: number, column: number }, end: { line: number, column: number } }` という構造をもつ
- `parent`: ノードの親ノード

幸い、チェック対象のノードがどのようなプロパティをもつかは、エディターの補完機能を使って簡単に調べることができるため、必要に応じて都度確認することを心掛けましょう。

以上を総合すると、`create` 関数を実装するための基本的な流れは以下のようになります:

1. 検査対象となるノードを特定する
2. ノードに対して問題の有無を判定する処理を記述する
3. 問題がある場合は `report` メソッドを呼び出す

### ルールの実装

それではまず、`no-nullpo` ルールを実装するにあたり、検査対象となるノードを特定しましょう。typescript-eslint の場合、内部で使用されるパーサーは `@typescript-eslint/parser`、正確には [`@typescript-eslint/typescript-estree`](https://typescript-eslint.io/packages/typescript-estree) です。このパーサーは ESTree 互換の AST を生成しますが、内部で使用されるノードの種類の数は[非常に膨大](https://typescript-eslint.io/packages/typescript-estree/ast-spec)です。一見、対象となるノードを探すことは非常に骨が折れる作業のように思えますが、実際には [AST Explorer](https://astexplorer.net/) などの補助ツールを使うことで、多くの場合はノードを簡単に特定することが可能です。以下は、AST Explorer にて `const nullpo = "ぬるぽ";` というコードを入力した際のスクリーンショットです:

![AST Explorer の使用例](/images/abstract-syntax-tree-for-frontend-developers/nullpo-ast.png)

ここから、対象のノードの種類が `Literal` であるという当たりをつけることができます。念の為に配列の中の文字列や return 文の中の文字列なども同じ `Literal` ノードであることを確認してみてください。これにより、検査対象となるノードが `Literal` であることがわかりましたので、`create` 関数を次のように書き換えましょう:

```ts:src/rules/no-nullpo.ts
create(context) {
  return {
    Literal(node) {
      // TODO: 判定処理の実装
    },
  };
}
```

さて、続いてはこの `Literal` ノードが「ぬるぽ」を含む文字列かどうかの判定処理を記述します。`Literal` ノードは、その名前の通りリテラルを表わすノードであり、`1` や `false` など、文字列以外の値である可能性があります。よって、`node` を通じて値が文字列かどうかをまず判定する必要がありますが、`node` は `value` プロパティをもっており、ここにリテラル自体の値が格納されているため、その型を `typeof` 演算子を使って判定します:

```ts:src/rules/no-nullpo.ts
create(context) {
  return {
    Literal(node) {
      if (typeof node.value === "string") {
        // node.value は文字列
      }
    },
  };
}
```

続いて、文字列が「ぬるぽ」を含むかどうかを判定しますが、これも同様に `node.value` を使えば良さそうです:

```ts:src/rules/no-nullpo.ts
create(context) {
  return {
    Literal(node) {
      if (typeof node.value === "string" && node.value.includes("ぬるぽ")) {
        // node.value は文字列で、"ぬるぽ" を含む
      }
    },
  };
}
```

これで問題があるかどうかの判定処理の記述が完了しました。最後に、`report` メソッドを使用してコードに問題がある旨を ESLint に伝達しましょう:

```ts:src/rules/no-nullpo.ts
create(context) {
  return {
    Literal(node) {
      if (typeof node.value === "string" && node.value.includes("ぬるぽ")) {
        context.report({
          node,
          messageId: "ga!",
        });
      }
    },
  };
}
```

これで `no-nullpo` ルールの実装が完了しました！あとはテストを実行して、問題なく通ることを確認しましょう:

```sh
$ npm run test
 DEV  v2.0.5 /Users/foo/dev/eslint-plugin-nullpo

 ✓ src/rules/no-nullpo.test.ts (2)
   ✓ no-nullpo (2)
     ✓ valid (1)
       ✓ const hoge = "ガッ";
     ✓ invalid (1)
       ✓ const nullpo = "ぬるぽ";

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  01:02:19
   Duration  572ms (transform 30ms, setup 0ms, collect 395ms, tests 25ms, environment 0ms, prepare 42ms)


 PASS  Waiting for file changes...
       press h to show help, press q to quit
```

`src/rules/no-nullpo.ts` の全体は以下となります:

```ts:src/rules/no-nullpo.ts
import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule({
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === "string" && node.value.includes("ぬるぽ")) {
          context.report({
            node,
            messageId: "ga!",
          });
        }
      },
    };
  },
  name: "no-nullpo",
  meta: {
    type: "problem",
    docs: {
      description: "Smack ぬるぽ (nullpo) with a hammer",
    },
    messages: {
      "ga!": "ガッ 🔨",
    },
    schema: [],
  },
  defaultOptions: [],
});
```

TODO: Update
以上により、目的としていたカスタムルールを実装することができましたが、前章までに学んだ AST の知識が活きることを実感できたのではないでしょうか。また、上の実例をベースとして、たとえば「`nullpo` という変数には特定の文字列が格納される必要がある」といったルールを新たに作成することとなったとしても、AST を調べて対象のノードを特定し、判定処理を実装するという具体的なイメージをもてるようになったはずです。

カスタムルールの作成自体は以上で完了ですが、最後にこのルールをプラグイン化し、実際に他のプロジェクトで利用できることを確認しておきましょう。

### プラグインの作成

プラグインを作成することで、他のプロジェクトからカスタムルールを利用できるようになります。まずはプラグイン用のファイルである、`src/index.ts` を開いてください。

このファイルから [`meta`](https://eslint.org/docs/latest/extend/plugins#meta-data-in-plugins) と [`rules`](https://eslint.org/docs/latest/extend/plugins#rules-in-plugins) というキーをもつオブジェクトをエクスポートすれば、プラグインとしての最低限の要件を満たせます。`meta` には、プラグインの名前（`name`）とバージョン（`version`）など、プラグインに関するメタ情報を記述します。また `rules` オブジェクトには、プラグインが提供するカスタムルールをその名前をキーとして登録します:

```ts:src/index.ts
import fs from "node:fs";

import { rule as noNullpo } from "./rules/no-nullpo.js";

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

export default {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  rules: {
    "no-nullpo": noNullpo,
  },
};
```

最後に、package.json に、`files` と `main` フィールド、ビルド用のコマンド、そして `peerDependencies` を追加します:

```json:package.json
{
  ...
  "files": [
    "dist"
  ],
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  ...
  "peerDependencies": {
    "eslint": "^9.0.0"
  }
}
```

ビルドを実行し、`dist` ディレクトリにプラグインのビルドファイルが生成されていることを確認してください:

```sh
$ npm run build
$ tree dist
dist
├── index.d.ts
├── index.js
├── index.js.map
└── rules
    ├── no-nullpo.d.ts
    ├── no-nullpo.js
    └── no-nullpo.js.map

1 directory, 6 files
```

### 動作確認

まず、[`npm link`](https://docs.npmjs.com/cli/v10/commands/npm-link) コマンドをプラグインのルートディレクトリで実行し、プラグインへのグローバルなシンボリックリンクを作成しておきます:

```sh
$ npm link
$ npm ls -g # プラグインがリンクされていることを確認
```

続いて、別のディレクトリに移動した上で、プラグインをテストするためのプロジェクトを新たに作成します:

```sh
$ mkdir test-nullpo
$ cd test-nullpo
$ npm init -y
```

ESLint の初期化コマンドを実行します:

```sh
$ npm init @eslint/config@latest
@eslint/create-config: v1.3.1

✔ How would you like to use ESLint? · problems
✔ What type of modules does your project use? · esm
✔ Which framework does your project use? · none
✔ Does your project use TypeScript? · javascript
✔ Where does your code run? · node
The config that you've selected requires the following dependencies:

eslint, globals, @eslint/js
✔ Would you like to install them now? · No / Yes
✔ Which package manager do you want to use? · npm
☕️Installing...
```

プラグインをプロジェクトにリンクします:

```sh
$ npm link eslint-plugin-nullpo
```

生成された `eslint.config.mjs` を以下のように書き換えます:

```js:eslint.config.mjs
import globals from "globals";
import pluginJs from "@eslint/js";
import nullpo from "eslint-plugin-nullpo";

export default [
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  // 以下を追加
  {
    plugins: {
      nullpo,
    },
    rules: {
      "nullpo/no-nullpo": "error",
    },
  },
];
```

テスト対象のファイルを作成し、`"ぬるぽ"` を含む文字列を使用するコードを追加してください:

```sh
$ touch index.js
$ echo 'const nullpo = "ぬるぽ";' > index.js
```

この段階で ESLint を実行すると、プラグインが正しく問題点を検出してくれるはずです！

```sh
npx eslint index.js            

/home/foo/test-nullpo/index.js
  1:7   error  'nullpo' is assigned a value but never used  no-unused-vars
  1:16  error  ガッ 🔨                                        nullpo/no-nullpo

✖ 2 problems (2 errors, 0 warnings)
```

### 推奨設定の追加

ESLint のプラグインには、たとえば `@eslint/js` のように推奨設定が含まれていることがあります。推奨設定は、いわばそのプラグインのデフォルトの設定であり、ユーザーがプラグインを利用する際の設定の手間を省いたり、プラグインの最適な使い方を知るための手助けとなります。`src/index.ts` のプラグインオブジェクトに `configs` キーを追加し、そこに上で設定した内容を記述しましょう:

```ts:src/index.ts
// ...

const plugin = {
  configs: {
    get recommended() {
      return recommended;
    },
  },
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  rules: {
    "no-nullpo": noNullpo,
  },
};

const recommended = {
  plugins: {
    nullpo: plugin,
  },
  rules: {
    "nullpo/no-nullpo": "error",
  },
};

export default plugin;
```

これにより、ユーザー側の設定ファイルから推奨設定 `recommended` を参照できるようになりました。プラグインを再度ビルドした上で、テスト用プロジェクトにおいて `eslint.config.mjs` を以下のように書き換えます:

```js:eslint.config.mjs
import nullpo from "eslint-plugin-nullpo";

export default [
  // ...
  nullpo.configs.recommended,
]
```

再度 ESLint を実行し、以前と同様にルールが適用されていればプラグインの作成も完了です。お疲れ様でした！

```sh
$ npx eslint index.js

/home/foo/test-nullpo/index.js
  1:7   error  'nullpo' is assigned a value but never used  no-unused-vars
  1:16  error  ガッ 🔨                                        nullpo/no-nullpo

✖ 2 problems (2 errors, 0 warnings)
```


## 補論: Biome と GritQL

### Biome について

ESLint は現在のフロントエンド開発におけるデファクトスタンダードの一つです。同様の地位にあるツールとしては、その他にもコードフォーマッターの [Prettier](https://prettier.io/) などが挙げられるでしょう。両者ともに大変優れたソフトウェアですが、近年の開発ツールの Rust 化の波の中から台頭してきた、両者を代替する可能性をもつ新たなツール [Biome](https://biomejs.dev/) について最後に紹介しておきます。

Biome は、Rust 製のコードフォーマッター兼リンターです。その特徴は、なんといってもそのパフォーマンスの高さです。Biome の公式サイトには、

> Format, lint, and more in a fraction of a second.

という標語が掲げられており、その言葉通り、実際に Biome を使用してみるとその動作速度に驚くはずです。もともとは JavaScript と TypeScript のための開発ツールを統合することを目指した [Rome](https://github.com/rome/tools) というプロジェクトが存在していたのですが、開発の主体であった Rome Tools Inc. の資金ショートに伴うレイオフを受け、その開発は停滞していました。そんな中、Rome の開発メンバーであった [Emanuele Stoppa](https://x.com/ematipico) 氏が中心となってプロジェクトを引き継ぎ、2023 年に Rome をフォークして新たに開始したプロジェクトが Biome です。

AST との関連では、Biome のパーサーが Red-Green Tree というデータ構造を使用している点が特徴的です。Biome のコアコントリビューターである [unvalley](https://twitter.com/unvalley_) 氏の[スライド](https://speakerdeck.com/unvalley/behind-biome)によると、Biome のパーサーは AST を生成する前段において

- Green Tree: （スペースやタブ、コメントなど）コード内のトリビアを含むすべての情報をもつ、不変なデータ構造
- Red Tree: Green Tree から計算される、親子関係の情報をもつ可変なデータ構造

という二種類の木構造を生成し、その結果 Biome のパース処理は

- Lossless: コードが不正な場合でも、パーサーはツリーを正確に表現する
- Resillient: コードが不正な場合でも、パーサーは入力に含まれる構文の断片を可能な限りみようとする

という性質を備えているとのことです。詳細に説明することは筆者の手に余るため、興味のある方は上の unvalley 氏の資料や、同じくコアコントリビューターである [nissy-dev](https://x.com/nissy_dev) 氏の [JSConf 2023](https://jsconf.jp/2023/) での[トーク](https://www.youtube.com/watch?v=aJsxEL2z8ds)などを参照してみてください。

### GritQL について

さらに、2024 年現在 Biome はプラグイン機構の実装を[予定](https://biomejs.dev/blog/roadmap-2024/)しており、これを ESLint のプラグインと比較することも面白いでしょう。プラグインに関する議論は

https://github.com/biomejs/biome/discussions/1649

にてまず開始され、これをもとに以下においてより具体的なプラグインの仕様が提案されました:

https://github.com/biomejs/biome/discussions/1762

これを読んで興味深いことは、Biome のプラグイン の記述に [GritQL](https://docs.grit.io/) というクエリ言語の使用が検討されていることです。GritQL は、ソースコードを検索・変換するためのクエリ言語であり、SQL に似た宣言的な構文をもつことが特徴です。GritQL のチュートリアルからいくつか例を抜粋すると、まず「`"Hello world!"` という文字列をコンソールに出力するコード」を検索するクエリは、以下のようになります:

```
`console.log("Hello world!")`
```

一見すると単なる文字列のようですが、GritQL はこのクエリをまず AST へと変換し、それをもとに検索する構造的マッチング（structural matching）をおこないます。これにより、完全一致する文字列がマッチするだけでなく、たとえば

```js
console.log('Hello world!')
console.log(
  "Hello world!",
)
```

などのコードにもマッチします。また、メタ変数（metavariable）を使用し、コード内の特定のパターンをキャプチャーすることも可能です。たとえば `console.log` に渡される文字列をキャプチャーするには、`$` を使用した以下のようなクエリを書きます:

```
`console.log($my_message)`
```

このパターンによりキャプチャーされた内容を使用して、もとのコードを置き換えることも可能です。そのためには [`=>`](https://docs.grit.io/language/patterns#rewrite-operator) というオペレーターを使用します。以下は、`console.log` を [winston](https://github.com/winstonjs/winston) のロガーに置き換えるクエリの例です:

```
`console.log($my_message)` => `winston.info($my_message)`
```

クエリを実際に適用するには [`grit`](https://docs.grit.io/cli/quickstart) コマンドを使用します。たとえば以下のような JavaScript ファイルがあるとします:

```js:index.js
console.log("This message is different");

// Comment with console.log("Hello world!") in it

function main(me) {
  console.log(42)
  console.log("Hello world!")
  console.log("42")

  console.log({
    name: "John Doe",
    age: 42,
  })
  return me
};

console.error("This is an error message")
console.log(
  'Hello world!'
);
console.log("This is a user-facing message")
```

このファイルに対して先ほどのクエリを適用します。その際、[`apply`](https://docs.grit.io/cli/reference#grit-apply) サブコマンドを指定し、クエリを引数として渡します^[インラインでクエリを渡す以外に、[標準ライブラリ](https://docs.grit.io/patterns)や YAML ファイルに定義されたパターンを渡すことも可能です。]:

```sh
$ grit apply '`console.log($my_message)` => `winston.info($my_message)`'
./index.js
    -console.log("This message is different");
    +winston.info("This message is different");

     // Comment with console.log("Hello world!") in it

     function main(me) {
    -  console.log(42)
    -  console.log("Hello world!")
    -  console.log("42")
    +  winston.info(42)
    +  winston.info("Hello world!")
    +  winston.info("42")

    -  console.log({
    +  winston.info({
         name: "John Doe",
         age: 42,
       })
       return me
    -};
    +}

     console.error("This is an error message")
    -console.log(
    -  'Hello world!'
    -);
    -console.log("This is a user-facing message")
    +winston.info('Hello world!');
    +winston.info("This is a user-facing message")


Processed 1 files and found 7 matches
```

変換された index.js は以下のようになります。全体的に `console.log` が `winston.info` に置き換えられていますが、コメント内の `console.log` は変換されていないことに注意してください。これは、GritQL が単純な文字列のマッチングではなく、AST を使った構造的なマッチングをおこなっているためです:

```js:index.js
winston.info("This message is different");

// Comment with console.log("Hello world!") in it

function main(me) {
  winston.info(42)
  winston.info("Hello world!")
  winston.info("42")

  winston.info({
    name: "John Doe",
    age: 42,
  })
  return me
}

console.error("This is an error message")
winston.info('Hello world!');
winston.info("This is a user-facing message")
```

さらに、上の変換のパターンに対し、`where` 句を付加して変換対象を絞り込むことも可能です。たとえば `$my_message` が `"This is a user-facing message"` である場合のみ変換をおこなうクエリを書くには、[`<:`](https://docs.grit.io/language/conditions#match-condition) という左右のパターンが等価であるかどうかを評価するオペレーターを使用します:

```
`console.log($my_message)` => `alert($my_message)` where {
  $my_message <: `"This is a user-facing message"`
}
```

以上のように、GritQL ではコードの検索や置換をするために、簡単なパターンから徐々に複雑なパターンへとクエリをインクリメンタルに構築していくことが可能です。ここで紹介した内容以外にも様々な言語機能が用意されていますので、興味のある方は公式ドキュメントを参照してみてください。公式サイトには [Studio](https://app.grit.io/studio) というプレイグラウンド機能も用意されており、インストール不要ですぐに GritQL を試すことができますので、こちらも参照してみてください。

### Biome プラグインと GritQL

さて、ここまで GritQL について簡単に紹介してきましたが、Biome のプラグインを記述するためにどのようにして使用されるのかについては、上述した Biome Plugins Proposal にイメージが提示されています。たとえば Biome には [`noImplicitBoolean`](https://biomejs.dev/linter/rules/no-implicit-boolean/) という、 `<input disabled />` のように JSX において暗黙に `true` を渡すことを禁止するルールが存在しますが、これを GritQL を使ってプラグインとして表現すると以下のようになるとのことです^[インデントのみ修正して引用しています。]:

```
or {
  `<$component $attrs />`,
  `<$component $attrs>$...</$component>`
} where {
  $attrs <: some $attr => diagnostic(
    message = "Use explicit boolean values for boolean JSX props.",
    fixer = `$attr={true}`,
    fixerDescription = "Add explicit `true` literal for this attribute",
    category = "quickFix",
    applicability = "always"
  ) where $attr <: r"[\w-]+"
}`
```

まだ説明していない [`or`](https://docs.grit.io/language/conditions#or-condition) オペレーターやカスタム関数（`diagnostic`）などが出てきていますが、大まかな意図は理解できるのではないのでしょうか。上のクエリを簡単に言い換えると、「JSX において属性 $attrs が指定されており、その一部（`some`）が `[\w-]+` というパターンに当てはまる場合、`diagnostic` 関数により Biome に通知する」といった意味になるでしょう。`diagnostic` 関数は Biome 側で実装する関数であり、これは ESLint の `context.report` メソッドに相当します。特定のパターンを GritQL により記述し、問題点を Biome に通知するという、ESLint と共通する流れをおさえておけば良いでしょう。

ところで、GritQL によりパターンを記述する際に、表面上は AST をまったく意識する必要がない点に注目してください。ESLint や後述する jscodeshit などのツールを使って同様のことをおこなう場合、対象となるコードの AST 表現（この場合 `CallExpression`）を意識する必要があります。そのために AST Explorer などのツールを行き来してツリー構造を辿っていくわけですが、GridQL では「`console.log($my_message)` というパターンをまず見つけて、...」というように、コードの見た目をそのまま記述することができます。GritQL のドキュメントにおいてこうした特徴は宣言的 (declarative) という言葉によって表現されていますが、こうした宣言的なパターンによるコードの検索・変換という特徴は、類似のツールである [ast-grep](https://ast-grep.github.io/) などでも見られます。こうした新しいツールが徐々に広まることで、React が宣言的な UI 表現を普及させたように、AST の操作においても宣言的な仕組みが普及していくのかもしれません。


## 参考

- [ESLint](https://eslint.org/): ESLint の公式サイト
- [Create Plugins](https://eslint.org/docs/latest/extend/plugins): プラグインの概略
- [Custom Rules](https://eslint.org/docs/latest/extend/custom-rules): カスタムルールのリファレンス
- [RuleTester](https://eslint.org/docs/latest/integrate/nodejs-api#ruletester): `RuleTester` のリファレンス
- [Architecture](https://eslint.org/docs/latest/contribute/architecture/): ESLint のアーキテクチャに関するドキュメント
- [traverser.js](https://github.com/eslint/eslint/blob/main/lib/shared/traverser.js): ESLint が AST を走査する際に使用している Traverser クラスのソースコード
- [Building Custom Rules](https://typescript-eslint.io/developers/custom-rules): typescript-eslint によりカスタムルールを作成するためのガイド
- [Building ESLint Plungins](https://typescript-eslint.io/developers/eslint-plugins): typescript-eslint によりプラグインを作成するためのガイド
- [utils](https://typescript-eslint.io/packages/utils): `@typescript-eslint/utils` のドキュメント
- [rule-tester](https://typescript-eslint.io/packages/rule-tester): `@typescript-eslint/rule-tester` のドキュメント
- [eslint-plugin-example-typed-linting](https://github.com/typescript-eslint/examples/tree/main/packages/eslint-plugin-example-typed-linting): `@typescript-eslint/utils` を使用してプラグインを作成する公式のサンプル
- [Biome](https://biomejs.dev/): Biome の公式サイト
- [Announcing Biome](https://biomejs.dev/blog/annoucing-biome/): Biome の公式発表
- [Deep dive into Biome](https://speakerdeck.com/nissydev/deep-dive-into-biome-in-jsconf-2023): JSConf 2023 にて nissy-dev 氏がおこなったトーク Deep dive into Biome のスライド
  - 動画版: https://www.youtube.com/watch?v=aJsxEL2z8ds
- [Behind Biome](https://speakerdeck.com/unvalley/behind-biome): [BuriKaigi 2024](https://burikaigi.dev/) にて unvalley 氏がおこなったトーク Behind Biome のスライド
- [RFC: Biome plugins](https://github.com/biomejs/biome/discussions/1649): Biome のプラグインに関するディスカッション
- [RFC: Biome Plugins Proposal](https://github.com/biomejs/biome/discussions/1762): 上のディスカッションを受けて提案された Biome プラグインの仕様
- [ast-grep](https://ast-grep.github.io/): ast-grep の公式サイト
