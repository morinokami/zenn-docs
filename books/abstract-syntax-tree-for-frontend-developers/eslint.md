---
title: "ESLint によるコード検査"
---


## 章の目標

この章では、前章までに学んだ AST に関する知識が、現実的な問題を解決する際にどう役に立つかを学ぶために、ESLint のカスタムルールを作成します。具体的には、以下のような単純なルールを作成することを目標とします:

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


## カスタムルールの作成

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
$ touch src/index.ts src/rules/ban-nullpo.ts src/rules/ban-nullpo.test.ts
```

各ファイルの役割は以下の通りです:

- `src/index.ts`: プラグインのエントリーポイントとなるファイルです。ここでプラグインを定義し `export` します。
- `src/rules/ban-nullpo.ts`: カスタムルールの実装を記述するファイルです。
- `src/rules/ban-nullpo.test.ts`: カスタムルールのテストを記述するファイルです。

なお、`rules` ディレクトリにルールの実装とテストを置いていますが、これは必須ではありません。複数のカスタムルールを作成する場合には `rules` ディレクトリのような場所を用意して管理することが一般的^[たとえば [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin) や [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) などはこの構成となっています。]ですが、今回のようにルールの数が少ない場合はフラットに配置しても問題ないでしょう。

### TypeScript 環境の構築

カスタムルールを作成するにあたり、JavaScript を使うことも可能ですが、補完などの恩恵を受けるために TypeScript を使用します。以下のコマンドにより、必要なパッケージをインストールします:

```sh
$ npm install @typescript-eslint/utils
$ npm install @types/node @typescript-eslint/parser @typescript-eslint/rule-tester typescript vitest
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

### テストの作成

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