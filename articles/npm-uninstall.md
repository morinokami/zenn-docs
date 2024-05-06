---
title: "Node.js の進化に伴い不要となったかもしれないパッケージたち"
emoji: "🐢"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["npm", "nodejs"]
published: true
---

## tl;dr

https://twitter.com/bholmesdev/status/1784972421776199697

## はじめに

2024 年の 4 月 24 日に [Node.js 22](https://nodejs.org/en/blog/announcements/v22-release-announce) がリリースされました。ESM を 条件付きで `require` する機能や、`--run` フラグによる npm スクリプトのパフォーマンス改善などが v22 で追加され、2009 年に Ryan Dahl が Node.js をリリースしてから 15 年が経つ今も、Node.js は進化を続けています^[[Node.js: The Documentary](https://www.youtube.com/watch?v=LB8KwiiUGy0) はいいぞ。]。

こうして Node.js 自身が強化されていくにつれ、以前はサードパーティーのパッケージを使用して実現することが一般的であった機能が Node.js のみで実現可能となり、当該パッケージが不要となるような場合があります。冒頭に引用した Ben Holmes の動画では、そのように不要となったパッケージとして

- `dotenv`
- `node-fetch`
- `chalk`
- `mocha`

が挙げられていますが、この記事では「これらのパッケージ + α が本当に不要になったのか」、あるいは「不要とまでは言えなくとも、特定条件下で乗り換えるべきか」について考察していきます^[たとえば Promise がネイティブに組み込まれたことにより [Bluebird](https://github.com/petkaantonov/bluebird/) が不要になったりなど、過去に遡ればこういった例は数多くあるでしょうが、この記事ではすべてを網羅することは目指しません。あくまで上のツイートを起点として、2024 年というタイミングで重要そうないくつかのパッケージについて触れるにとどめます。]。

ところで、サードパーティーのパッケージにより提供されていた機能が Node.js に組み込まれることのメリットは何でしょうか。依存関係が減ることはそれ自体が良いことであると素朴に感じられますが、改めて考えてみると、以下のようなメリットが期待できそうです:

- 保守性
  - パッケージの管理コストが減る
  - 互換性問題が減る (たとえば特定のパッケージが最新の Node.js に対応していない場合、そのパッケージを使用しているプロジェクトは Node.js のバージョンアップができないといった問題が発生しうる)
- パフォーマンス
  - サードパーティーのパッケージと比べ開発リソースが豊富な Node.js が提供するバージョンの方が高速である、あるいは将来的に高速化されると期待できる
  - (やや些末だが) パッケージインストールの時間が短縮され、その結果 CI/CD の実行時間も短縮される
  - (やや些末だが) パッケージのロード時間が短縮される
  - (やや些末だが) バンドルサイズが減る
- セキュリティ
  - 脆弱性が埋め込まれたコードを実行するリスクが減る
- 一貫性
  - (サードパーティーのパッケージをパッチワークすることに比較し) Node.js という主体が統一的な API を提供することが期待される

ただし、これらの多くはあくまで「期待」であり、実際には真逆の結果となるかもしれないことに注意が必要です。たとえばパフォーマンスの項目などはわかりやすいですが、実際にはサードパーティー製のパッケージのほうが高速であるということは容易に起こり得るため、速度が重要であるような状況であれば、外部のパッケージをあえて使い続けるという判断も必要になってきます。API の一貫性といった側面も、人によって結論は異なってくるでしょう。よって、実際にパッケージを置き換えるかどうかを判断する際には、上のような様々な観点から検討することが重要です。

それでは以下で、実際に各パッケージについて検討していきます。

## node-fetch

[node-fetch](https://github.com/node-fetch/node-fetch) は、ブラウザの [Fetch](https://fetch.spec.whatwg.org/) API を Node.js で使用するためのパッケージです。現在でこそ Node.js には [Stable](https://nodejs.org/api/documentation.html#stability-index) な機能として [`fetch`](https://nodejs.org/docs/latest-v22.x/api/globals.html#fetch) が組み込まれていますが、この API がフラグ付きで使用可能となったのは [v17.5.0](https://nodejs.org/en/blog/release/v17.5.0)、[v16.15.0](https://nodejs.org/en/blog/release/v16.15.0) からであり、それ以前にブラウザの Fetch API を Node.js で使用するためには `node-fetch` を使用する必要がありました。

`node-fetch` の目的が「ブラウザと互換性のある Fetch API を Node.js の世界にもたらすこと」であるとすると、v22 で同じ目的の `fetch` が Stable として組み込まれた時点で、`node-fetch` を積極的に使用する理由はほとんどなくなったと言えるでしょう。Node.js の `fetch` が内部的に使用している [undici](https://github.com/nodejs/undici) の README には[仕様との差分](https://github.com/nodejs/undici?tab=readme-ov-file#specification-compliance)に関する言及がありますが^[少し前にも、ガベージコレクションの挙動の差異を原因とするメモリリークについて触れた [Malte Ubl のツイート](https://twitter.com/cramforce/status/1762142087930433999)が話題となっていました。]、こうした差分は当然ながら `node-fetch` にも[存在](https://github.com/node-fetch/node-fetch?tab=readme-ov-file#difference-from-client-side-fetch)しており、使用するコンテキストによっては具体的な差分の内容が重要となりそうですが、差分自体の有無という点では両者とも同様です。個人的には、[web-platform-tests](https://github.com/web-platform-tests/wpt) などのテストスイートの結果が[確認](https://wpt.fyi/results/?label=master&product=node.js-18%5Bstable%5D&product=node.js-20%5Bstable%5D&product=node.js-21%5Bstable%5D&product=node.js%5Bexperimental%5D&view=subtest)可能となっている点や、単純に使用者すなわち監視の目が多いことから、仕様へのコンプライアンスという観点からは Node.js の `fetch` の方が信頼できるのではないかと考えています。

なお、パフォーマンスの観点から `node-fetch` を使用する理由があるかどうかについては、[Matteo Collina](https://twitter.com/matteocollina) による以下の記事が参考になります:

https://adventures.nodeland.dev/archive/which-http-client-for-nodejs-should-nodejs-stop/

記事によると、`fetch` は `node-fetch` のパフォーマンスをすでに超えているということなので、速度的な観点でも `node-fetch` を使用する根拠はなさそうです。

## Dotenv

[v20.6.0](https://nodejs.org/en/blog/release/v20.6.0) で [`--env-file`](https://nodejs.org/docs/latest-v22.x/api/cli.html#--env-fileconfig) オプションが追加されるまで、Node.js において `.env` ファイルから環境変数を読み込むためには [Dotenv](https://github.com/motdotla/dotenv) を使用することが一般的でした。Dotenv を使用すると、`require('dotenv').config()` または `import 'dotenv/config'` というコードを記述すれば、プロジェクトのルートに置かれた `.env` ファイルの内容が `process.env` に読み込まれ、環境変数として利用可能となります。

ファイルから環境変数を読み込むためのこうした機能を提供するためのオプションが、上述した `--env-file` です。`node --env-file=.env index.js` のようにプログラムを実行すれば、Dotenv を使用した場合と同様の効果が得られます。Dotenv では、`.env` ファイルにコメントを記述したり、複数行に渡る値の設定が可能ですが、`--env-file` でも同じことができます。シンプルに `.env` ファイルの内容を環境変数として読み込むだけであれば、`--env-file` があれば十分であると言えそうです。

また、[Node.js 自体を設定するための環境変数](https://nodejs.org/docs/latest-v22.x/api/cli.html#environment-variables)を記載した `.env` を `--env-file` により読み込むと、その設定が適用された状態で Node.js が実行されます。仕組み上、Node.js プロセスの実行後に環境変数を読み込む必要がある Dotenv ではこうした挙動を実現することは[難しい](https://github.com/motdotla/dotenv/issues/314)ため、この点は `--env-file` のユニークな点と言えるでしょう。

ただし、Dotenv では [dotenv-expand](https://github.com/motdotla/dotenv-expand) により変数の展開が可能ですが、`--env-file` ではそのような機能は 2024 年現在提供されていません。また、これは `--env-file` オプションの責務からは逸脱する機能ですが、[dotenv-vault](https://github.com/dotenv-org/dotenv-vault) が提供する `.env` を共有するための仕組みも Node.js には現状存在しません。こうした機能が必要な場合は、引き続き Dotenv およびそのエコシステムを使用することが必要です。

さらに、API の Stability は現在 1.1 Active development となっており、今後何らかの小さな変更が生じる可能性はあるため、完全に安定した状態の機能を使いたい場合も Dotenv の使用を検討すべきでしょう。

なお、Node.js の `.env` ファイルサポートに関する開発状況は以下の issue から確認可能です:

https://github.com/nodejs/node/issues/49148

## Chalk

CLI 向けのコマンドを作成する際、ターミナルに表示する文字列のスタイルを変更するためには [ANSI エスケープシーケンス](https://en.wikipedia.org/wiki/ANSI_escape_code) を使用するという選択肢がありますが、エスケープシーケンスを文字列に正確に埋め込みながらコードを書くのは煩雑です。こうした難点を解消し、ターミナル上に表示する文字列を簡単にスタイリングするためのパッケージが [Chalk](https://github.com/chalk/chalk) です。Chalk により、`chalk.red('Hello, world!')` のような直感的にわかりやすいコードを使用して、文字列に色を付けたり、文字の太さを変えたりすることができます。

[v21.7.0](https://nodejs.org/en/blog/release/v21.7.0) と [v20.12.0](https://nodejs.org/en/blog/release/v20.12.0) において、Chalk のようにターミナル上の文字列をスタイリングするための [`util.styleText`](https://nodejs.org/docs/latest-v22.x/api/util.html#utilstyletextformat-text) という API が Node.js に追加されました。使い方は `format` と `text` を引数として与えるだけで、たとえば以下のようにして簡単に文字列をスタイリングできます:

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

多くの項目は Chalk とオーバーラップしているため、基本的なスタイリングが目的であれば `util.styleText` で十分そうです。[Wes Bos](https://twitter.com/wesbos) の[動画](https://x.com/wesbos/status/1773001110057337130) を参考に、すべての前景色と背景色を組み合わせた画像を作成してみましたので、こちらも参考にしてください:

![styleText でサポートされている前景色と背景色の組み合わせ](/images/npm-uninstall/styleText.png)

ただし、Chalk のようなスタイルをチェーンする書き方が好みである場合や、Chalk でしか提供されていない [API](https://www.npmjs.com/package/chalk#api) が必要な場合などは、そのまま Chalk を使い続ければよいでしょう。

ところで、パフォーマンスについても一応調べてみたところ、以下のような簡単なベンチマークでは Chalk に軍配が上がったことも付記しておきます。[Vitest](https://vitest.dev/) には Experimental な機能として [bench](https://vitest.dev/api/#bench) 関数があり、これは内部で [Tinybench](https://github.com/tinylibs/tinybench) を使用しているのですが、テストコードを書くように気軽にベンチマークが実行できる点が最近気に入っているため、今回はこれを用いて以下のコードを実行しました:

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

Node.js 22.1.0 on Ryzen 9 5900X + Ubuntu 22.04 という環境での実行結果は以下の通りでした^[Node.js 22.1.0 on Apple M1 + macOS Sonoma 14.4.1 でも試しましたが同様の結果でした。]:

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

[Mocha](https://mochajs.org/) は Node.js 向けの軽量なテストフレームワークです。同様のテストフレームワークとしては [Jest](https://jestjs.io/) や [Vitest](https://vitest.dev/) なども有名ですが、Mocha は [Chai](https://www.chaijs.com/) などのアサーションライブラリと組み合わせて使用するように設計されており、軽量なテストランナーといった趣きがあるのが特徴です。

Node.js の [v18.0.0](https://nodejs.org/en/blog/release/v18.0.0) と [v16.17.0](https://nodejs.org/en/blog/release/v16.17.0) において[テストランナー](https://nodejs.org/docs/latest-v22.x/api/test.html)の機能が組み込まれたことにより、Mocha の役割をある程度代替することが可能となりました。特に [v20.0.0](https://nodejs.org/en/blog/release/v20.0.0) からは Stable な機能となっており、[`--test-reporter`](https://nodejs.org/docs/latest-v22.x/api/test.html#test-reporters) によるフィードバック形式の指定、[`--watch`](https://nodejs.org/docs/latest-v22.x/api/test.html#watch-mode) によるウォッチモードでのテスト実行、[`assert`](https://nodejs.org/docs/latest-v22.x/api/assert.html) による様々な形式のアサーション、[カバレッジ](https://nodejs.org/docs/latest-v22.x/api/test.html#collecting-code-coverage) の取得、等々がサポートされており、本格的なテストを記述するための準備が出来上がってきていると言えそうです。

他と異なり検討事項が多く、また筆者が Mocha についてあまり詳しくないため、Mocha を代替可能かどうかについて断定することは避けますが、基本的なテストを記述することは十分に可能なように見えるため、小規模なプロジェクトなどで本 API を試し始めていくのが良さそうです。

なお、大きなプロジェクトで Mocha から Node.js のテストランナーに乗り換えた事例としては、[Astro](https://astro.build/) があります:

https://astro.build/blog/node-test-migration/

これを読むと、Node.js のテストランナーがテストファイルごとにプロセスを生成しており速度的な課題があったことや、Chai と比較してアサーションの表現力が劣る点があること、OSS プロジェクトとしてどのようにマイグレーションを進めていったか、など興味深い内容を知ることができます。Astro のような著名なプロジェクトが、各局面でどういった判断を下していったかを報告している貴重な資料であるため、興味がある方はぜひ一読することをおすすめします。

## Nodemon

[Nodemon](https://nodemon.io/) は、ディレクトリ内のファイルの変更を検知し、アプリケーションを自動的に再起動するためのツールです。`nodemon index.js` のように実行したいアプリケーションを `nodemon` コマンドに続けて指定するだけで、ファイルの変更を検知してアプリケーションを再起動してくれます。

Nodemon と同様にファイルを監視してアプリケーションを再起動するための [`--watch`](https://nodejs.org/docs/latest-v22.x/api/cli.html#--watch) オプションが、[v18.11.0](https://nodejs.org/en/blog/release/v18.11.0) と [v16.19.0](https://nodejs.org/en/blog/release/v16.19.0) で追加されました。`node --watch index.js` のようにエントリーポイントを指定するだけで、このファイルとその依存関係を監視し、更新があればアプリケーションを再起動してくれます。このオプションは [v22](https://nodejs.org/en/blog/announcements/v22-release-announce#watch-mode-node---watch) において Stable となりました。

Nodemon と異なり、`--watch` はエントリーポイントと関係のないパスを監視してくれません。そうした目的のためには `--watch-path` というオプションが用意されており、`node --watch-path=./src index.js` のように監視対象のパスを指定できます。ただし[ドキュメント](https://nodejs.org/docs/latest-v22.x/api/cli.html#--watch-path)によると、公式にサポートされている OS は macOS と Windows だけとされており、Linux では動作しない可能性がある点に注意してください^[筆者が Ubuntu 22.04 で試した限りにおいては動いているようでした。]。

このように、「ファイルの変更を検知してアプリケーションを再起動する」という目的においては、`--watch` と `--watch-path` オプションで単純なケースであれば対応できそうです。ただし、たとえば glob パターンにより監視対象を指定したり、特定の監視イベントに対して何らかの処理を実行するなど、Nodemon にできてこれらのオプションだけではできないことは多岐にわたります。よって、乗り換えの前にきちんとユースケースを検討することが重要になりそうです。

## glob

[v22.0.0](https://nodejs.org/en/blog/announcements/v22-release-announce) で [glob](https://nodejs.org/docs/latest-v22.x/api/fs.html#fspromisesglobpattern-options) と [globSync](https://nodejs.org/docs/latest-v22.x/api/fs.html#fsglobsyncpattern-options) という関数が実験的な機能として追加されました。[Glob](https://en.wikipedia.org/wiki/Glob_(programming)) とは一般に、ワイルドカードを使用してファイルパスを指定するためのパターンマッチングのことを指しますが、Node.js において Glob を使用するには従来 [glob](https://www.npmjs.com/package/glob) や [fast-glob](https://www.npmjs.com/package/fast-glob) などのサードパーティーパッケージを使用する必要がありました。

v22 によって glob が Node.js 本体に組み込まれたため、たとえば

```js
import { globSync } from 'node:fs';
console.log(globSync('**/*.js'));
```

のようにしてファイルパスを簡単に取得できるようになりました。シンプルなパターンであれば、これで一旦は対応できそうです。

なお、パフォーマンスに関して、https://github.com/isaacs/node-glob?tab=readme-ov-file#benchmark-results にあるパターンを `globSync` のみ測定した限りでは、`glob` や `fast-glob` に分がありそうです。長くなるため、気になる方は以下のアコーディオンをクリックして詳細を表示してください:

:::details `globSync` のパフォーマンス比較
実行したコードは以下の通りです:

```js
import * as fg from 'fast-glob'
import * as glob from 'glob'
import * as fs from 'node:fs'
import { bench, describe } from 'vitest'

describe('**', () => {
  bench('glob', () => {
    glob.globSync('**')
  })
  bench('fast-glob', () => {
    fg.globSync('**')
  })
  bench('fs', () => {
    fs.globSync('**')
  })
})

describe('**/..', () => {
  bench('glob', () => {
    glob.globSync('**/..')
  })
  bench('fast-glob', () => {
    fg.globSync('**/..')
  })
  bench('fs', () => {
    fs.globSync('**/..')
  })
})

describe('./**/0/**/0/**/0/**/0/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./**/0/**/0/**/0/**/0/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./**/0/**/0/**/0/**/0/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./**/0/**/0/**/0/**/0/**/*.txt')
  })
})

describe('./**/[01]/**/[12]/**/[23]/**/[45]/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./**/[01]/**/[12]/**/[23]/**/[45]/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./**/[01]/**/[12]/**/[23]/**/[45]/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./**/[01]/**/[12]/**/[23]/**/[45]/**/*.txt')
  })
})

describe('./**/0/**/0/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./**/0/**/0/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./**/0/**/0/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./**/0/**/0/**/*.txt')
  })
})

describe('**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('**/*.txt')
  })
})

describe('{**/*.txt,**/?/**/*.txt,**/?/**/?/**/*.txt,**/?/**/?/**/?/**/*.txt,**/?/**/?/**/?/**/?/**/*.txt}', () => {
  bench('glob', () => {
    glob.globSync('{**/*.txt,**/?/**/*.txt,**/?/**/?/**/*.txt,**/?/**/?/**/?/**/*.txt,**/?/**/?/**/?/**/?/**/*.txt}')
  })
  bench('fast-glob', () => {
    fg.globSync('{**/*.txt,**/?/**/*.txt,**/?/**/?/**/*.txt,**/?/**/?/**/?/**/*.txt,**/?/**/?/**/?/**/?/**/*.txt}')
  })
  bench('fs', () => {
    fs.globSync('{**/*.txt,**/?/**/*.txt,**/?/**/?/**/*.txt,**/?/**/?/**/?/**/*.txt,**/?/**/?/**/?/**/?/**/*.txt}')
  })
})

describe('**/5555/0000/*.txt', () => {
  bench('glob', () => {
    glob.globSync('**/5555/0000/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('**/5555/0000/*.txt')
  })
  bench('fs', () => {
    fs.globSync('**/5555/0000/*.txt')
  })
})

describe('./**/0/**/../[01]/**/0/../**/0/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./**/0/**/../[01]/**/0/../**/0/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./**/0/**/../[01]/**/0/../**/0/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./**/0/**/../[01]/**/0/../**/0/*.txt')
  })
})

describe('**/????/????/????/????/*.txt', () => {
  bench('glob', () => {
    glob.globSync('**/????/????/????/????/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('**/????/????/????/????/*.txt')
  })
  bench('fs', () => {
    fs.globSync('**/????/????/????/????/*.txt')
  })
})

describe('./{**/?{/**/?{/**/?{/**/?,,,,},,,,},,,,},,,}/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./{**/?{/**/?{/**/?{/**/?,,,,},,,,},,,,},,,}/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./{**/?{/**/?{/**/?{/**/?,,,,},,,,},,,,},,,}/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./{**/?{/**/?{/**/?{/**/?,,,,},,,,},,,,},,,}/**/*.txt')
  })
})

describe('**/!(0|9).txt', () => {
  bench('glob', () => {
    glob.globSync('**/!(0|9).txt')
  })
  bench('fast-glob', () => {
    fg.globSync('**/!(0|9).txt')
  })
  bench('fs', () => {
    fs.globSync('**/!(0|9).txt')
  })
})

describe('./{*/**/../{*/**/../{*/**/../{*/**/../{*/**,,,,},,,,},,,,},,,,},,,,}/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./{*/**/../{*/**/../{*/**/../{*/**/../{*/**,,,,},,,,},,,,},,,,},,,,}/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./{*/**/../{*/**/../{*/**/../{*/**/../{*/**,,,,},,,,},,,,},,,,},,,,}/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./{*/**/../{*/**/../{*/**/../{*/**/../{*/**,,,,},,,,},,,,},,,,},,,,}/*.txt')
  })
})

describe('./*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/*.txt')
  })
})

describe('./*/**/../*/**/../*/**/../*/**/../*/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./*/**/../*/**/../*/**/../*/**/../*/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./*/**/../*/**/../*/**/../*/**/../*/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./*/**/../*/**/../*/**/../*/**/../*/**/*.txt')
  })
})

describe('./0/**/../1/**/../2/**/../3/**/../4/**/../5/**/../6/**/../7/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./0/**/../1/**/../2/**/../3/**/../4/**/../5/**/../6/**/../7/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./0/**/../1/**/../2/**/../3/**/../4/**/../5/**/../6/**/../7/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./0/**/../1/**/../2/**/../3/**/../4/**/../5/**/../6/**/../7/**/*.txt')
  })
})

describe('./**/?/**/?/**/?/**/?/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./**/?/**/?/**/?/**/?/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./**/?/**/?/**/?/**/?/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./**/?/**/?/**/?/**/?/**/*.txt')
  })
})

describe('**/*/**/*/**/*/**/*/**', () => {
  bench('glob', () => {
    glob.globSync('**/*/**/*/**/*/**/*/**')
  })
  bench('fast-glob', () => {
    fg.globSync('**/*/**/*/**/*/**/*/**')
  })
  bench('fs', () => {
    fs.globSync('**/*/**/*/**/*/**/*/**')
  })
})

describe('./**/*/**/*/**/*/**/*/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./**/*/**/*/**/*/**/*/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./**/*/**/*/**/*/**/*/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./**/*/**/*/**/*/**/*/**/*.txt')
  })
})

describe('./**/**/**/**/**/**/**/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('./**/**/**/**/**/**/**/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('./**/**/**/**/**/**/**/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('./**/**/**/**/**/**/**/**/*.txt')
  })
})

describe('**/*/*.txt', () => {
  bench('glob', () => {
    glob.globSync('**/*/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('**/*/*.txt')
  })
  bench('fs', () => {
    fs.globSync('**/*/*.txt')
  })
})

describe('**/*/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('**/*/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('**/*/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('**/*/**/*.txt')
  })
})

describe('**/[0-9]/**/*.txt', () => {
  bench('glob', () => {
    glob.globSync('**/[0-9]/**/*.txt')
  })
  bench('fast-glob', () => {
    fg.globSync('**/[0-9]/**/*.txt')
  })
  bench('fs', () => {
    fs.globSync('**/[0-9]/**/*.txt')
  })
})
```

実行結果は以下の通りとなりました:

```
 ✓ tests/glob.bench.js (69) 42929ms
   ✓ ** (3) 1881ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       113.32  4.8546  98.5830  8.8248  6.7211  98.5830  98.5830  98.5830  ±41.02%       57   slowest
   · fast-glob  216.99  4.0431  11.2906  4.6085  4.8396   5.8854  11.2906  11.2906   ±3.20%      109   fastest
   · fs         141.77  6.2543   8.8528  7.0537  7.3294   8.8528   8.8528   8.8528   ±1.93%       71
   ✓ **/.. (3) 1877ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       145.40  4.3822  87.9975  6.8775  6.0419  87.9975  87.9975  87.9975  ±33.46%       74   slowest
   · fast-glob  245.53  3.8536   5.4069  4.0728  4.0830   5.0975   5.4069   5.4069   ±1.19%      123   fastest
   · fs         148.76  6.2633   7.8895  6.7220  7.0513   7.8895   7.8895   7.8895   ±1.31%       75
   ✓ ./**/0/**/0/**/0/**/0/**/*.txt (3) 1851ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       205.16  4.1240   7.7028  4.8742  5.3673   7.4834   7.7028   7.7028   ±3.09%      103   fastest
   · fast-glob  193.93  3.8691  61.9729  5.1566  4.6539  61.9729  61.9729  61.9729  ±23.58%       97
   · fs         143.61  6.4944   8.5380  6.9635  7.1978   8.5380   8.5380   8.5380   ±1.50%       72   slowest
   ✓ ./**/[01]/**/[12]/**/[23]/**/[45]/**/*.txt (3) 1906ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       197.98  4.1941   8.5955  5.0510  5.3996   8.2710   8.5955   8.5955   ±3.11%      100   fastest
   · fast-glob  170.73  3.9933  72.4826  5.8572  4.8392  72.4826  72.4826  72.4826  ±29.21%       93
   · fs         139.35  6.6269   8.7886  7.1760  7.3960   8.7886   8.7886   8.7886   ±1.75%       70   slowest
   ✓ ./**/0/**/0/**/*.txt (3) 1848ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       216.00  4.0717   6.3122  4.6296  5.0088   6.3009   6.3122   6.3122   ±2.44%      108
   · fast-glob  244.51  3.8660   4.9823  4.0898  4.2290   4.9574   4.9823   4.9823   ±1.13%      123   fastest
   · fs         113.87  6.3623  53.8540  8.7819  7.4448  53.8540  53.8540  53.8540  ±26.15%       57   slowest
   ✓ **/*.txt (3) 1856ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       214.25  4.1049   6.7463  4.6674  5.0210   6.4188   6.7463   6.7463   ±2.42%      108
   · fast-glob  239.53  3.9331   5.4114  4.1748  4.2344   5.3673   5.4114   5.4114   ±1.31%      120   fastest
   · fs         129.60  6.1572  29.9861  7.7162  7.4608  29.9861  29.9861  29.9861  ±10.54%       65   slowest
   ✓ {**/*.txt,**/?/**/*.txt,**/?/**/?/**/*.txt,**/?/**/?/**/?/**/*.txt,**/?/**/?/**/?/**/?/**/*.txt} (3) 1901ms
     name            hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · glob        198.82   4.4492   8.0885   5.0296   5.4659   6.5957   8.0885   8.0885  ±2.43%      100
   · fast-glob   208.94   4.5496   5.8909   4.7861   4.8349   5.7184   5.8909   5.8909  ±1.13%      105   fastest
   · fs         50.7169  18.1543  24.3457  19.7173  19.9703  24.3457  24.3457  24.3457  ±3.09%       26   slowest
   ✓ **/5555/0000/*.txt (3) 1864ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       181.75  4.0950  37.9464  5.5020  5.5252  37.9464  37.9464  37.9464  ±13.91%       91
   · fast-glob  246.60  3.8361   5.3238  4.0552  4.0637   5.1471   5.3238   5.3238   ±1.16%      124   fastest
   · fs         145.12  6.1828   8.3297  6.8907  7.2526   8.3297   8.3297   8.3297   ±1.99%       73   slowest
   ✓ ./**/0/**/../[01]/**/0/../**/0/*.txt (3) 1867ms
     name            hz     min      max     mean      p75      p99     p995     p999      rme  samples
   · glob        171.70  4.2964  31.4052   5.8241   5.7767  31.4052  31.4052  31.4052  ±11.82%       86
   · fast-glob   251.42  3.8561   4.6463   3.9774   3.9898   4.4931   4.6463   4.6463   ±0.70%      126   fastest
   · fs         63.0568  9.8307   112.10  15.8587  12.4407   112.10   112.10   112.10  ±41.90%       32   slowest
   ✓ **/????/????/????/????/*.txt (3) 1856ms
     name           hz     min      max    mean     p75      p99     p995     p999     rme  samples
   · glob       209.66  4.1012   8.0333  4.7697  5.2483   7.1307   8.0333   8.0333  ±3.02%      105
   · fast-glob  232.56  3.8346   7.7895  4.3000  4.4621   6.6667   7.7895   7.7895  ±2.60%      117   fastest
   · fs         141.31  6.3033  10.0012  7.0765  7.5553  10.0012  10.0012  10.0012  ±2.53%       71   slowest
   ✓ ./{**/?{/**/?{/**/?{/**/?,,,,},,,,},,,,},,,}/**/*.txt (3) 1891ms
     name            hz      min      max     mean      p75      p99     p995     p999      rme  samples
   · glob        186.49   4.5379   8.9847   5.3622   5.6831   8.9847   8.9847   8.9847   ±3.23%       94   fastest
   · fast-glob   130.61   4.6183  32.9973   7.6563   7.9482  32.9973  32.9973  32.9973  ±15.24%       66
   · fs         49.0208  19.5948  21.5136  20.3995  20.7745  21.5136  21.5136  21.5136   ±1.05%       25   slowest
   ✓ **/!(0|9).txt (3) 1871ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       205.68  4.1866   7.8510  4.8619  5.2790   6.8577   7.8510   7.8510   ±2.86%      103
   · fast-glob  243.38  3.9246   5.0857  4.1089  4.1474   5.0750   5.0857   5.0857   ±1.12%      122   fastest
   · fs         128.29  6.3918  38.0924  7.7951  7.3733  38.0924  38.0924  38.0924  ±14.18%       65   slowest
   ✓ ./{*/**/../{*/**/../{*/**/../{*/**/../{*/**,,,,},,,,},,,,},,,,},,,,}/*.txt (3) 1886ms
     name            hz      min      max     mean      p75      p99     p995     p999      rme  samples
   · glob        158.19   5.5495   9.0565   6.3215   6.6645   9.0565   9.0565   9.0565   ±2.13%       80
   · fast-glob   238.81   3.8613   5.5281   4.1874   4.4124   5.2933   5.5281   5.5281   ±1.47%      120   fastest
   · fs         66.2732  11.5230  86.9126  15.0891  13.0505  86.9126  86.9126  86.9126  ±29.59%       34   slowest
   ✓ ./*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/*.txt (3) 1861ms
     name           hz     min      max    mean     p75      p99     p995     p999     rme  samples
   · glob       175.31  5.0608   8.4763  5.7041  6.1189   8.4763   8.4763   8.4763  ±2.11%       88
   · fast-glob  242.83  3.8849   4.9059  4.1182  4.2812   4.8403   4.9059   4.9059  ±1.03%      122   fastest
   · fs         107.77  8.2525  15.2572  9.2791  9.3240  15.2572  15.2572  15.2572  ±4.13%       54   slowest
   ✓ ./*/**/../*/**/../*/**/../*/**/../*/**/*.txt (3) 1853ms
     name           hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · glob       193.41  4.5927  7.9756  5.1703  5.7163  7.9756  7.9756  7.9756  ±2.23%       97
   · fast-glob  238.14  3.8687  5.3547  4.1992  4.3932  4.9689  5.3547  5.3547  ±1.29%      120   fastest
   · fs         129.55  7.2153  9.0693  7.7193  7.9746  9.0693  9.0693  9.0693  ±1.32%       65   slowest
   ✓ ./0/**/../1/**/../2/**/../3/**/../4/**/../5/**/../6/**/../7/**/*.txt (3) 1824ms
     name              hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · glob          735.29  1.1960  4.5898  1.3600  1.3839  3.2482  4.4349  4.5898  ±2.71%      368
   · fast-glob  25,505.49  0.0300  2.5715  0.0392  0.0343  0.0773  0.1450  1.6269  ±3.89%    12753   fastest
   · fs            432.48  2.1939  2.8817  2.3122  2.3782  2.7649  2.7965  2.8817  ±0.72%      217   slowest
   ✓ ./**/?/**/?/**/?/**/?/**/*.txt (3) 1870ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       191.12  4.0779  39.1255  5.2322  5.3968  39.1255  39.1255  39.1255  ±13.78%       99
   · fast-glob  240.04  3.8902  11.7147  4.1660  4.1399   6.6125  11.7147  11.7147   ±3.32%      121   fastest
   · fs         142.55  6.4803   7.9945  7.0151  7.3281   7.9945   7.9945   7.9945   ±1.34%       72   slowest
   ✓ **/*/**/*/**/*/**/*/** (3) 1869ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       188.25  4.6475   6.7591  5.3121  5.8537   6.7591   6.7591   6.7591   ±2.23%       95   fastest
   · fast-glob  170.66  4.6015  24.0452  5.8596  5.5817  24.0452  24.0452  24.0452  ±10.09%       86
   · fs         118.72  7.7093  10.0317  8.4230  8.9300  10.0317  10.0317  10.0317   ±1.85%       60   slowest
   ✓ ./**/*/**/*/**/*/**/*/**/*.txt (3) 1867ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       191.44  4.4333   8.9459  5.2235  5.6585   8.9459   8.9459   8.9459   ±3.41%       96   fastest
   · fast-glob  159.54  5.1703  44.8609  6.2678  6.1527  44.8609  44.8609  44.8609  ±15.79%       80
   · fs         121.01  7.7415   9.2315  8.2635  8.6832   9.2315   9.2315   9.2315   ±1.48%       61   slowest
   ✓ ./**/**/**/**/**/**/**/**/*.txt (3) 1852ms
     name           hz     min      max    mean     p75      p99     p995     p999     rme  samples
   · glob       209.38  4.1413   8.1267  4.7760  5.2608   8.0191   8.1267   8.1267  ±3.06%      105   fastest
   · fast-glob  207.98  3.9507  17.9885  4.8082  4.8776  13.4335  17.9885  17.9885  ±7.11%      104
   · fs         126.43  6.3830  16.2043  7.9096  8.0078  16.2043  16.2043  16.2043  ±6.47%       64   slowest
   ✓ **/*/*.txt (3) 1854ms
     name           hz     min      max    mean     p75      p99     p995     p999      rme  samples
   · glob       185.44  4.2857  14.3469  5.3927  5.5844  14.3469  14.3469  14.3469   ±5.83%       93
   · fast-glob  234.24  4.0245   5.2329  4.2692  4.3831   5.2123   5.2329   5.2329   ±1.31%      118   fastest
   · fs         121.88  6.6029  28.5266  8.2050  7.6272  28.5266  28.5266  28.5266  ±11.19%       61   slowest
   ✓ **/*/**/*.txt (3) 1863ms
     name           hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · glob       199.63  4.2537  8.2889  5.0091  5.2935  7.8715  8.2889  8.2889  ±3.31%      101
   · fast-glob  217.02  4.3337  5.6199  4.6079  4.7862  5.5467  5.6199  5.6199  ±1.30%      109   fastest
   · fs         138.06  6.6851  8.6301  7.2430  7.5631  8.6301  8.6301  8.6301  ±1.77%       70   slowest
   ✓ **/[0-9]/**/*.txt (3) 1858ms
     name           hz     min      max    mean     p75      p99     p995     p999     rme  samples
   · glob       189.91  4.2157  11.7635  5.2657  5.6619  11.7635  11.7635  11.7635  ±4.79%       95
   · fast-glob  240.39  3.8569   5.4217  4.1599  4.3755   5.4138   5.4217   5.4217  ±1.50%      121   fastest
   · fs         146.27  6.2664   7.9613  6.8366  7.0962   7.9613   7.9613   7.9613  ±1.46%       74   slowest


 BENCH  Summary

  fast-glob - tests/glob.bench.js > **
    1.53x faster than fs
    1.91x faster than glob

  fast-glob - tests/glob.bench.js > **/..
    1.65x faster than fs
    1.69x faster than glob

  glob - tests/glob.bench.js > ./**/0/**/0/**/0/**/0/**/*.txt
    1.06x faster than fast-glob
    1.43x faster than fs

  glob - tests/glob.bench.js > ./**/[01]/**/[12]/**/[23]/**/[45]/**/*.txt
    1.16x faster than fast-glob
    1.42x faster than fs

  fast-glob - tests/glob.bench.js > ./**/0/**/0/**/*.txt
    1.13x faster than glob
    2.15x faster than fs

  fast-glob - tests/glob.bench.js > **/*.txt
    1.12x faster than glob
    1.85x faster than fs

  fast-glob - tests/glob.bench.js > {**/*.txt,**/?/**/*.txt,**/?/**/?/**/*.txt,**/?/**/?/**/?/**/*.txt,**/?/**/?/**/?/**/?/**/*.txt}
    1.05x faster than glob
    4.12x faster than fs

  fast-glob - tests/glob.bench.js > **/5555/0000/*.txt
    1.36x faster than glob
    1.70x faster than fs

  fast-glob - tests/glob.bench.js > ./**/0/**/../[01]/**/0/../**/0/*.txt
    1.46x faster than glob
    3.99x faster than fs

  fast-glob - tests/glob.bench.js > **/????/????/????/????/*.txt
    1.11x faster than glob
    1.65x faster than fs

  glob - tests/glob.bench.js > ./{**/?{/**/?{/**/?{/**/?,,,,},,,,},,,,},,,}/**/*.txt
    1.43x faster than fast-glob
    3.80x faster than fs

  fast-glob - tests/glob.bench.js > **/!(0|9).txt
    1.18x faster than glob
    1.90x faster than fs

  fast-glob - tests/glob.bench.js > ./{*/**/../{*/**/../{*/**/../{*/**/../{*/**,,,,},,,,},,,,},,,,},,,,}/*.txt
    1.51x faster than glob
    3.60x faster than fs

  fast-glob - tests/glob.bench.js > ./*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/../*/**/*.txt
    1.39x faster than glob
    2.25x faster than fs

  fast-glob - tests/glob.bench.js > ./*/**/../*/**/../*/**/../*/**/../*/**/*.txt
    1.23x faster than glob
    1.84x faster than fs

  fast-glob - tests/glob.bench.js > ./0/**/../1/**/../2/**/../3/**/../4/**/../5/**/../6/**/../7/**/*.txt
    34.69x faster than glob
    58.97x faster than fs

  fast-glob - tests/glob.bench.js > ./**/?/**/?/**/?/**/?/**/*.txt
    1.26x faster than glob
    1.68x faster than fs

  glob - tests/glob.bench.js > **/*/**/*/**/*/**/*/**
    1.10x faster than fast-glob
    1.59x faster than fs

  glob - tests/glob.bench.js > ./**/*/**/*/**/*/**/*/**/*.txt
    1.20x faster than fast-glob
    1.58x faster than fs

  glob - tests/glob.bench.js > ./**/**/**/**/**/**/**/**/*.txt
    1.01x faster than fast-glob
    1.66x faster than fs

  fast-glob - tests/glob.bench.js > **/*/*.txt
    1.26x faster than glob
    1.92x faster than fs

  fast-glob - tests/glob.bench.js > **/*/**/*.txt
    1.09x faster than glob
    1.57x faster than fs

  fast-glob - tests/glob.bench.js > **/[0-9]/**/*.txt
    1.27x faster than glob
    1.64x faster than fs
```

このように、ほぼすべてのパターンにおいて `fs.globSync` が最も遅い結果となりました。
:::

現在指定可能なオプションは `cwd` と `exclude` のみとまだ限られており、Stability のステータスも上述のように Experimental の扱いであるため、既存の glob パッケージ等をすぐに置き換え可能であるとは言い難いでしょう。

## おわりに

自分は普段から基本的にプロジェクトの依存を少なくしたいと考えており、それに関する情報を目にするたびに適宜試しているのですが、そうした情報がどこかにまとまっていれば便利だと思いこの記事を書きました。時間が経つに連れて Stability のステータスや API が変化したり、他のパッケージが不要になっていくことが予想されますが、なるべく記事の情報を最新に保っていく予定です。

なお、言うまでもないことですが、各パッケージの背後には無数のコントリビューターがおり、彼らのおかげで便利な機能が提供され、またそのことが Node.js 本体の改善を促し、エコシステム全体が発展してきました。不要となって削除することとなっても、開発に関わった人たちへのリスペクトの気持ちは忘れずにいたいと思います^[気を整え、拝み、祈り、構えて、`npm uninstall` 🙏]。
