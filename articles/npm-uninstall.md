---
title: "Node.js の進化により不要となった (?) パッケージ"
emoji: "🐢"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["npm", "nodejs"]
published: false
---

## tl;dr

https://twitter.com/bholmesdev/status/1784972421776199697

## はじめに

2024 年の 4 月 24 日に [Node.js 22](https://nodejs.org/en/blog/announcements/v22-release-announce) がリリースされました。ESM を 条件付きで `require` する機能や、`--run` フラグによる npm スクリプトのパフォーマンス改善などが v22 で追加され、2009 年に Ryan Dahl が Node.js をリリースしてから 15 年が経つ今も、Node.js は進化を続けています^[[Node.js: The Documentary](https://www.youtube.com/watch?v=LB8KwiiUGy0) はいいぞ。]。

こうして Node.js の機能が強化されていくにつれ、以前はサードパーティーのパッケージを使用して実現することが一般的であった機能が Node.js のみで実現可能となる場合があります。冒頭に引用した Ben Holmes の動画では、そのように不要となったパッケージとして

- `dotenv`
- `node-fetch`
- `chalk`
- `mocha`

が挙げられていますが、この記事では「これらのパッケージ + α が本当に不要になったのか」、あるいは「不要とまでは言えなくとも、特定条件下で乗り換えるべきか」について考察していきます。

ところで、サードパーティーのパッケージにより提供されていた機能が Node.js に組み込まれることのメリットは何でしょうか。依存関係が減ることはそれ自体が良いことであると素朴に感じられますが、改めて考えてみると、以下のようなメリットがありそうです:

- 一貫性: 
- セキュリティ:
- パフォーマンス:
- 保守性:

blah blah

## node-fetch

[node-fetch](https://github.com/node-fetch/node-fetch) は、ブラウザの [Fetch](https://fetch.spec.whatwg.org/) API を Node.js で使用するためのパッケージです。現在でこそ Node.js には [Stable](https://nodejs.org/api/documentation.html#stability-index) な機能として [`fetch`](https://nodejs.org/docs/latest-v22.x/api/globals.html#fetch) が組み込まれていますが、この API がフラグ付きで使用可能となったのは [v17.5.0](https://nodejs.org/en/blog/release/v17.5.0)、[v16.15.0](https://nodejs.org/en/blog/release/v16.15.0) からであり、それ以前にブラウザの Fetch API を Node.js で使用するためには `node-fetch` を使用する必要がありました。

`node-fetch` の目的が「ブラウザと互換性のある Fetch API を Node.js の世界にもたらすこと」であるとすると、v22 で同じ目的の `fetch` が Stable として組み込まれた時点で、`node-fetch` を積極的に使用する理由はほとんどなくなったと言えるでしょう。Node.js の `fetch` が内部的に使用している [undici](https://github.com/nodejs/undici) の README には[仕様との差分](https://github.com/nodejs/undici?tab=readme-ov-file#specification-compliance)に関する言及がありますが^[少し前にも、ガベージコレクションの挙動の差異を原因とするメモリリークについて触れた [Malte Ubl のツイート](https://twitter.com/cramforce/status/1762142087930433999) が話題となっていました。]、こうした差分は当然ながら `node-fetch` にも[存在](https://github.com/node-fetch/node-fetch?tab=readme-ov-file#difference-from-client-side-fetch)しており、使用するコンテキストによっては具体的な差分の内容が重要となりそうですが、差分自体の有無という点では両者とも同様です。個人的には、[web-platform-tests](https://github.com/web-platform-tests/wpt) などのテストスイートの結果が[確認](https://wpt.fyi/results/?label=master&product=node.js-18%5Bstable%5D&product=node.js-20%5Bstable%5D&product=node.js-21%5Bstable%5D&product=node.js%5Bexperimental%5D&view=subtest)可能となっている点や、単純に使用者すなわち監視の目が多いことから、仕様へのコンプライアンスという観点からは Node.js の `fetch` の方が今後は信頼できるのではないかと考えています。

なお、パフォーマンスの観点から `node-fetch` を使用する理由があるかどうかについては、[Matteo Collina](https://twitter.com/matteocollina) による以下の記事が参考になります:

https://adventures.nodeland.dev/archive/which-http-client-for-nodejs-should-nodejs-stop/

記事によると、`fetch` は `node-fetch` のパフォーマンスをすでに超えているということなので、速度的な観点でも `node-fetch` を使用する根拠はなさそうです。

## Dotenv

[v20.6.0](https://nodejs.org/en/blog/release/v20.6.0) において [`--env-file`](https://nodejs.org/docs/latest-v22.x/api/cli.html#--env-fileconfig) オプションが追加されるまで、Node.js において `.env` ファイルから環境変数を読み込むためには [Dotenv](https://github.com/motdotla/dotenv) を使用することが一般的でした。Dotenv を使用すると、`require('dotenv').config()` または `import 'dotenv/config'` というコードを記述すれば、`process.env` にプロジェクトのルートに置かれた `.env` ファイルの内容が読み込まれ、環境変数として利用可能となります。

ファイルから環境変数を読み込むためのこうした機能を提供するためのオプションが、上述した `--env-file` です。`node --env-file=.env index.js` のようにプログラムを実行すれば、Dotenv を使用した場合と同様の効果が得られます。dotenv では、`.env` ファイルにコメントを記述したり、複数行に渡る値の設定が可能ですが、`--env-file` でも同じことができます。シンプルに `.env` ファイルの内容を環境変数として読み込むだけであれば、`--env-file` があれば十分であると言えそうです。

また、[Node.js を設定するための環境変数](https://nodejs.org/docs/latest-v22.x/api/cli.html#environment-variables)を設定した `.env` を `--env-file` により読み込むと、その設定が適用された状態で Node.js が実行されます。仕組み上、Node.js プロセスの実行後に環境変数を読み込む必要がある dotenv ではこうした挙動を実現することは[難しい](https://github.com/motdotla/dotenv/issues/314)ため、この点は `--env-file` のユニークな点と言えるでしょう。

ただし、Dotenv では [dotenv-expand](https://github.com/motdotla/dotenv-expand) により変数の展開が可能ですが、`--env-file` ではそのような機能は提供されていません。また、これは `--env-file` オプションの責務からは逸脱する機能ですが、[dotenv-vault](https://github.com/dotenv-org/dotenv-vault) が提供する `.env` を共有するための仕組みも Node.js には現状存在しません。こうした機能が必要な場合は、引き続き dotenv を使用することが必要です。

さらに、API の Stability は現在 1.1 Active development となっており、今後小さな変更が生じる可能性はあるため、完全に安定した状態の機能を使いたい場合も dotenv の使用を検討すべきでしょう。

なお、Node.js の `.env` ファイルサポートに関する開発状況は以下の issue から確認可能です:

https://github.com/nodejs/node/issues/49148

## Chalk

CLI 向けのコマンドを作成する際、ターミナルに表示する文字列のスタイルを変更するためには [ANSI エスケープシーケンス](https://en.wikipedia.org/wiki/ANSI_escape_code) を使用するという選択肢がありますが、エスケープシーケンスを文字列に正確に埋め込みながらコードを書くのは煩雑です。こうした難点を解消し、ターミナル上に表示する文字列を簡単にスタイリングするためのパッケージが [chalk](https://github.com/chalk/chalk) です。chalk により、`chalk.red('Hello, world!')` のような直感的にわかりやすいコードを使用して、文字列に色を付けたり、文字の太さを変えたりすることができます。

[v21.7.0](https://nodejs.org/en/blog/release/v21.7.0) と [v20.12.0](https://nodejs.org/en/blog/release/v20.12.0) において、Chalk のようにターミナル上の文字列をスタイリングするための [`util.styleText`](https://nodejs.org/docs/latest-v22.x/api/util.html#utilstyletextformat-text) という API が追加されました。使い方は `format` と `text` を引数として与えるだけで、たとえば以下のようにして簡単に文字列をスタイリングできます:

```js
import { styleText } from 'node:util';
console.log(styleText('red', 'Hello, world!'));
```

`util.styleText` でサポートされている `format` は以下の通りです:

- 修飾子
  - `reset`
  - `bold`
  - `italic`
  - `underline`
  - `strikethrough` (エイリアス: `strikeThrough`、c`rossedout`、`crossedOut`)
  - `hidden` (エイリアス: `conceal`)
  - `dim` (エイリアス: `faint`)
  - `overlined`
  - `blink`
  - `inverse` (エイリアス: `swapcolors`、`swapColors`)
  - `doubleunderline` (エイリアス: `doubleUnderline`)
  - `framed`
- 前景色
  - `black`
  - `red`
  - `green`
  - `yellow`
  - `blue`
  - `magenta`
  - `cyan`
  - `white`
  - `gray` (エイリアス: `grey`、`blackBright`)
  - `redBright`
  - `greenBright`
  - `yellowBright`
  - `blueBright`
  - `magentaBright`
  - `cyanBright`
  - `whiteBright`
- 背景色
  - `bgBlack`
  - `bgRed`
  - `bgGreen`
  - `bgYellow`
  - `bgBlue`
  - `bgMagenta`
  - `bgCyan`
  - `bgWhite`
  - `bgGray` (エイリアス: `bgGrey`、`bgBlackBright`)
  - `bgRedBright`
  - `bgGreenBright`
  - `bgYellowBright`
  - `bgBlueBright`
  - `bgMagentaBright`
  - `bgCyanBright`
  - `bgWhiteBright`

ほとんどの項目は chalk とオーバーラップしているため、基本的なスタイリングが目的であれば `util.styleText` で十分そうです。[Wes Bos](https://twitter.com/wesbos) の[動画](https://x.com/wesbos/status/1773001110057337130) を参考に、すべての前景色と背景色を組み合わせた画像を作成してみましたので、こちらも参考にしてください:

![styleText でサポートされている前景色と背景色の組み合わせ](/images//npm-uninstall/styleText.png)

ただし、chalk のようなスタイルをチェーンする書き方が好みである場合や、chalk でしか提供されていない [API](https://www.npmjs.com/package/chalk#api) が必要な場合などは、そのまま chalk を使い続ければよいでしょう。

ところで、パフォーマンスについても一応調べてみたところ、以下のような簡単なベンチマークでは Chalk に軍配が上がったことも付記しておきます。[Vitest](https://vitest.dev/) には experimental な機能として [bench](https://vitest.dev/api/#bench) 関数があり、これは内部で [Tinybench](https://github.com/tinylibs/tinybench) を使用しているのですが、テストコードを書くように気軽にベンチマークが今回はこれを用いて以下のコードを実行しました:

```js
import chalk from 'chalk'
import { styleText } from 'node:util'
import { bench, describe } from 'vitest'

describe('Combine styled and normal strings', () => {
  bench('chalk', () => {
    chalk.blue('Hello') + ' World' + chalk.red('!')
  })
  bench('styleText', () => {
    styleText('blue', 'Hello') + ' World' + styleText('red', '!')
  })
})

describe('Compose multiple styles', () => {
  bench('chalk', () => {
    chalk.blue.bgRed.bold('Hello World!')
  })
  bench('styleText', () => {
    styleText(['blue', 'bgRed', 'bold'], 'Hello World!')
  })
})

describe('Nest styles', () => {
  bench('chalk', () => {
    chalk.blue('Hello', chalk.underline(' World') + '!')
  })
  bench('styleText', () => {
    styleText('blue', 'Hello' + styleText('underline', ' World') + '!')
  })
})
```

Node.js 22.1.0 on Ryzen 9 5900X + Ubuntu 22.04 という環境での実行結果は以下の通りでした:

```
 ✓ tests/color.bench.js (6) 6951ms
   ✓ Combine styled and normal strings (2) 2199ms
     name                 hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · chalk      2,975,898.70  0.0003  0.1753  0.0003  0.0003  0.0006  0.0006  0.0008  ±0.10%  1487950   fastest
   · styleText  2,078,918.75  0.0004  0.2335  0.0005  0.0005  0.0009  0.0010  0.0011  ±0.12%  1039460  
   ✓ Compose multiple styles (2) 2698ms
     name                 hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · chalk      5,099,670.12  0.0002  0.0241  0.0002  0.0002  0.0003  0.0004  0.0004  ±0.04%  2549836   fastest
   · styleText  2,842,975.26  0.0003  0.3307  0.0004  0.0003  0.0007  0.0007  0.0009  ±0.46%  1421488  
   ✓ Nest styles (2) 2052ms
     name                 hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · chalk      2,180,543.15  0.0004  0.0154  0.0005  0.0005  0.0007  0.0008  0.0010  ±0.04%  1090272   fastest
   · styleText  2,116,827.76  0.0004  0.5064  0.0005  0.0005  0.0008  0.0009  0.0010  ±0.26%  1058414  


 BENCH  Summary

  chalk - tests/color.bench.js > Combine styled and normal strings
    1.43x faster than styleText

  chalk - tests/color.bench.js > Compose multiple styles
    1.79x faster than styleText

  chalk - tests/color.bench.js > Nest styles
    1.03x faster than styleText
```

各項目の細かい説明は省略しますが、Summary からわかるように、すべてのベンチマークにおいて Chalk のパフォーマンスが優れていました。結果を一度だけ表示するような CLI コマンドを作成する際には文字列の表示速度をそれほど気にする必要はないかもしれませんが、パフォーマンスが重要なコンテキストにおいては、現状では Chalk を使用したほうが良いかもしれません。

## Mocha

[Mocha](https://mochajs.org/) は Node.js 向けのテストフレームワークです。

## Nodemon

[Nodemon](https://nodemon.io/) は、ディレクトリ内のファイルの変更を検知し、アプリケーションを自動的に再起動するためのツールです。`nodemon index.js` のように実行したいアプリケーションを `nodemon` コマンドに続けて指定するだけで、ファイルの変更を検知してアプリケーションを再起動してくれます。

こうしたファイルを監視してアプリケーションを再起動するための [`--watch`](https://nodejs.org/docs/latest-v22.x/api/cli.html#--watch) オプションが、[v18.11.0](https://nodejs.org/en/blog/release/v18.11.0) と [v16.19.0](https://nodejs.org/en/blog/release/v16.19.0) で追加されました。`node --watch index.js` のようにエントリーポイントを指定するだけで、このファイルとその依存関係を監視し、更新があればアプリケーションを再起動してくれます。このオプションは [v22](https://nodejs.org/en/blog/announcements/v22-release-announce#watch-mode-node---watch) において Stable となりました。

Nodemon と異なり、`--watch` はエントリーポイントと関係のないパスを監視してくれません。そうした目的のためには `--watch-path` というオプションが用意されており、`node --watch-path=./src index.js` のように監視対象のパスを指定できます。ただし、[ドキュメント](https://nodejs.org/docs/latest-v22.x/api/cli.html#--watch-path)によると、公式にサポートされている OS は macOS と Windows だけとされており、Linux では動作しない可能性がある点に注意してください^[筆者が Ubuntu 22.04 で試した限りにおいては動いているようでした。]。

このように、「ファイルの変更を検知してアプリケーションを再起動する」という目的においては、`--watch` と `--watch-path` オプションで単純なケースであれば対応できそうです。ただし、たとえば glob パターンにより監視対象を指定したり、特定の監視イベントに対して何らかの処理を実行するなど、Nodemon にできてこれらのオプションだけではできないことは多岐にわたります。よって、乗り換えの前にきちんとユースケースを検討することが重要になりそうです。

## glob、fast-glob

[v22.0.0](https://nodejs.org/en/blog/announcements/v22-release-announce) で [glob](https://nodejs.org/docs/latest-v22.x/api/fs.html#fspromisesglobpattern-options) と [globSync](https://nodejs.org/docs/latest-v22.x/api/fs.html#fsglobsyncpattern-options) という関数が実験的な機能として追加されました。
