---
title: "ESLint によるコード検査"
---


## 章の目標

この章では、前章までに学んだ AST に関する知識が、現実的な問題を解決する際にどう役に立つかについて学ぶために、ESLint のカスタムルールを作成します。具体的には、以下のような単純なルールを作成することを目標とします:

- コード内の文字列に「ぬるぽ」が含まれている場合、「ガッ 🔨」という警告文を出す

半分冗談のような内容ですが、こうした簡単なルールの作成においても AST の知識が顔を出すことをまず体験してもらうことが狙いです。また、ここで学んだ手法を応用することで、より複雑なルールも作成できそうだということも直観できるはずです。

このカスタムルールを [eslint-plugin-nullpo](https://www.npmjs.com/package/eslint-plugin-nullpo) という名のプラグインとして npm からダウンロードできるようにもしてあります。以下の StackBlitz のリンクなどから、実際の挙動を確認してみてください:

<!-- TODO: StackBlitz へのリンク -->

なお、この「ぬるぽ」と「ガッ」という言葉は、以前匿名掲示板 [2 ちゃんねる](https://ja.wikipedia.org/wiki/2%E3%81%A1%E3%82%83%E3%82%93%E3%81%AD%E3%82%8B)において流行した一種のネットミームです。「ぬるぽ」は NullPointerException の略語であり、あるユーザーが「ぬるぽ」と掲示板に書き込むと、それを見た他のユーザーにハンマーで「ガッ」されるという、一種の掛け合いがおこなわれていました:

![「ぬるぽ」と「ガッ」](/images/abstract-syntax-tree-for-frontend-developers/nullpo.png)
*出典: https://www.nullpo.org/test/read.cgi/nullpolog/1024553352/*


### 流れ

以下では、まず ESLint について概略し、ESLint を拡張するためのプラグインやカスタムルールについて説明します。その上で、ハンズオン形式により、「ぬるぽ」という文字列を検出し「ガッ」するカスタムルールを作成していきます。また、最後に発展的な話題として、ESLint を代替する可能性を秘めた Biome と、そのプラグイン記述言語の候補 GritQL について触れます。


## ESLint とプラグイン

[ESLint](https://eslint.org/) は、JavaScript のコードを静的解析し、コードに潜む問題を検出・修正するためのツールです。ESLint では、コードが特定の規則に従っているかどうかをチェックする仕組みをルールと呼びます。多くのルールが初めから[組み込まれており](https://eslint.org/docs/latest/rules/)、使用されていない変数を検出する [no-unused-vars](https://eslint.org/docs/latest/rules/no-unused-vars) や、変数の命名規則にキャメルケースを要求する [camelcase](https://eslint.org/docs/latest/rules/camelcase) などがその例です。

こうした内蔵ルール以外が必要になった場合、ESLint をプラグインにより拡張できます。たとえば、React プロジェクトを検査するためのルールは ESLint 本体には含まれていませんが、[eslint-plugin-react](https://www.npmjs.com/package/eslint-plugin-react) というサードパーティー製のプラグインを使用することで、React プロジェクト専用のルールを ESLint によりチェックすることができます。ESLint のコア機能を拡張するためのプラグインは無数にあり、プロジェクトに応じて必要なプラグインを取捨選択できる拡張性が ESLint の強みの一つとなっています。

また、サードパーティー製のプラグインにより必要な機能が提供されていない場合には、独自のルールを作成することも可能です。この独自のルールは[カスタムルール](https://eslint.org/docs/latest/extend/custom-rules)と呼ばれます。あとで詳しく説明しますが、カスタムルールは以下のような形式の JavaScript オブジェクトとして定義されます^[https://eslint.org/docs/latest/extend/custom-rules のサンプルを筆者が改変して引用しました。]:

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

このルールには、`meta` と `create` という 2 つのプロパティが含まれています。`meta` はルールに関するメタ情報を含み、ざっくり眺めるだけでルールの説明 (`description`) やルールの種類 (`type`)、ルールが自動的に修正可能かどうか (`fixable`) などの情報が記述されていることがわかります。`create` はルールの本体であり、ESLint がコードの AST を走査する際に呼び出されるコールバック関数を返します。このように定義されたカスタムルールを、以下のように `rules` というオブジェクトに登録したものがプラグインです:

```js:eslint-plugin-sample.js
const customRule = require("./customRule");
const plugin = {
  rules: {
    "do-something": customRule
  }
};
module.exports = plugin;
```

このようにプラグインを定義することで、ESLint の設定ファイルからプラグインを登録し、カスタムルールによりプロジェクト内のコードを検査できるようになります。

以上により、ESLint の概要と、カスタムルールやプラグインの意義や関係について理解できたところで、次節から実際にカスタムルールを作成していきます。


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

なお、`rules` ディレクトリにルールの実装とテストを置いていますが、これは必須ではありません。複数のカスタムルールを作成する場合には `rules` ディレクトリのような場所を用意して管理することが一般的^[たとえば [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin) や [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) などはこの構成となっています。]ですが、今回のようにルールの数が少ない場合はフラットに配置しても問題ないでしょう。

### TypeScript 環境の構築

カスタムルールを作成するにあたり、JavaScript を使うことも可能ですが、補完などの恩恵を受けるために TypeScript を使用します。以下のコマンドにより、必要なパッケージをインストールします:

```sh
$ npm install @typescript-eslint/utils
$ npm install @types/node @typescript-eslint/parser @typescript-eslint/rule-tester typescript --save-dev
```

カスタムルールを作成するにあたり特に重要なパッケージの役割は以下の 2 つです:

- `@typescript-eslint/utils`: ESLint のカスタムルールを作成するための `ESLintUtils` などのユーティリティ関数を提供するパッケージです。[`@typescript-eslint/eslint-plugin`](https://typescript-eslint.io/packages/eslint-plugin) のプラグインはこのパッケージを使用して作成されています。詳しくは[ドキュメント](https://typescript-eslint.io/packages/utils)を参照してください。
- `@typescript-eslint/rule-tester`: ESLint に組み込まれている [`RuleTester`](https://eslint.org/docs/latest/integrate/nodejs-api#ruletester) をフォークし、TypeScript 向けのルールをテストするために拡張したパッケージです。ESLint の `RuleTester` と同様に、あるルールに対して問題のない `valid` なコード例と、問題のある `invalid` なコード例と期待されるエラー内容を設定し、ルールが正しく動作するかをテストします。詳しくは[ドキュメント](https://typescript-eslint.io/packages/rule-tester)を参照してください。

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

最後に、package.json にビルド用コマンドと `peerDependencies` を追加しておきましょう:

```json:package.json
{
  ...
  "scripts": {
    "build": "tsc"
  },
  ...
  "peerDependencies": {
    "eslint": "^9.0.0"
  }
}
```

### メタ情報の記述

準備ができたところで、カスタムルールの実装に取り掛かっていきましょう。`src/rules/no-nullpo.ts` に、このルールのメタ情報を記述します。まずは、`ESLintUtils` を `@typescript-eslint/utils` からインポートし、`createRule` というルールを作成するための関数を作成します:

```ts:src/rules/no-nullpo.ts
import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);
```

`ESLintUtils.RuleCreator` には、ルールの名前を引数に取り、そのルールのドキュメントの URL を返すような関数を渡します。たとえば `no-foo` と `no-bar` という複数のルールを作成する場合、それぞれのドキュメントの URL は `https://example.com/docs/rules/no-foo` と `https://example.com/docs/rules/no-bar` のように同一のパターンをもつことが多いでしょう。`RuleCreator` に URL 生成関数を渡すことで、同一のパターンをもつ URL 文字列を何度も書かずに済むようになります。各ルールに対して生成された URL は、ESLint のルールオブジェクトの `meta.docs.url` に自動的に設定されます。今回はドキュメントの URL は存在しないため、便宜的にルール名をそのまま返すようにしている点に留意してください。

続いて、上で作成した `createRule` を使ってルールを作成します:

```ts:src/rules/no-nullpo.ts
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

`name` にはカスタムルールの名前を記述します。今回は、ぬるぽ (nullpo) を禁止するルールであるため `no-nullpo` という名前を付けています^[ルール名に関する厳密な規則はありませんが、何かを禁止するようなルールの名前には `no-` や `ban-` をプレフィックスとして付けることが多いです。]。

`meta` にはルールのメタ情報を記述します。ここで設定している各値の意味は以下の通りです:

- `type`: ルールの種類を指定します。指定可能な値は以下となります:
  - `"problem"`: エラーやわかりづらい挙動を引き起こし得るようなコードを指摘します。
  - `"suggestion"`: エラーを発生させるわけではないが、より良いコードの書き方を提案します。
  - `"layout"`: 空白やセミコロンなど、コードの見た目に関する問題を指摘します。
- `docs`: 
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

ところで、ESLint の `RuleTester` はテスト実行のために `afterAll` などのグローバルなフックが実行環境に存在していることを前提としています。今回はテストフレームワークとして [Vitest](https://vitest.dev/) を使用し、そこで提供されるフックを `RuleTester` に登録します。まずは Vitest をインストールします:

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
    "build": "tsc",
    "test": "vitest"
  },
  ...
}
```

これでテストを記述するための準備が整いました。現時点でテストを実行すると、以下のようにテストが存在しないというエラーが表示されるはずです:

```sh
$ npm run test
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

`invalid` の要素には、`code` に問題のあるコード例を、`errors` にはそのコード例に対して発生することが期待されるエラーを指定します。すでに `createRule` の `meta.messages` において期待されるエラーメッセージを登録してあるため、ここではその ID を用いてエラーを指定しています。

この段階でテストを実行すると、まだルールを実装していないため、`invalid` に指定したコードに対してエラーが発生せずテストが失敗するはずです:

```sh
 FAIL  src/rules/no-nullpo.test.ts > no-nullpo > invalid > const nullpo = "ぬるぽ";
AssertionError: Should have 1 error but had 0: []

- Expected
+ Received

- 1
+ 0
```

これでルールを実装するための準備が整いました。あとはこのテストを通すことがゴールとなります。


## カスタムルールの作成

### ルールの実装

### プラグインの作成

### 動作確認

### 推奨設定の追加


## Biome と GritQL


## 参考

- [ESLint](https://eslint.org/)
- [Create Plugins](https://eslint.org/docs/latest/extend/plugins)
- [RuleTester](https://eslint.org/docs/latest/integrate/nodejs-api#ruletester)
- [Building Custom Rules](https://typescript-eslint.io/developers/custom-rules)
- [Building ESLint Plungins](https://typescript-eslint.io/developers/eslint-plugins)
- [rule-tester](https://typescript-eslint.io/packages/rule-tester)
- [utils](https://typescript-eslint.io/packages/utils)
- [eslint-plugin-example-typed-linting](https://github.com/typescript-eslint/examples/tree/main/packages/eslint-plugin-example-typed-linting)
- [Biome](https://biomejs.dev/)
- [RFC: Biome plugins](https://github.com/biomejs/biome/discussions/1649)
- [RFC: Biome Plugins Proposal](https://github.com/biomejs/biome/discussions/1762)
