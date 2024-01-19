---
title: "プログラミング言語 HTML 入門"
emoji: "🐨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["html", "htmx"]
published: true
---

## はじめに

以前 [uhyo](https://twitter.com/uhyo_) さんにより「HTML はプログラミング言語である」と[示された](https://qiita.com/uhyo/items/9b830c93fa4765bdd3e5)ことは記憶に新しいところですが、昨年末の [HTML, The Programming Language](https://html-lang.org/) の登場により、その主張はより強固なものとなりました。現代ではもはや、HTML は立派なプログラミング言語であるということは疑いようがありません。

この記事では、プログラミング言語 HTML, The Programming Language について、その概要と基本的な文法について説明します。そして最後に、HTML プログラミングの応用例として FizzBuzz やフィボナッチ数列の実装例を見ていきます。

## HTML, The Programming Language

HTML, The Programming Language (以下 HTML と略します) は、[HTMX](https://htmx.org/) を開発していることで有名な [Big Sky Software](https://bigsky.software/) により開発された、[チューリング完全](https://en.wikipedia.org/wiki/Turing_completeness)^[この点については公式サイトの Footnotes を確認してください。飛ぶぞ。]な[スタック指向](https://en.wikipedia.org/wiki/Stack-oriented_programming)のプログラミング言語です。昨年末の発表当時に Hacker News でも[大きな話題を呼んだ](https://news.ycombinator.com/item?id=38519719) HTML は、2024 年現在、最も注目されているプログラミング言語の一つであるといえるでしょう。

![HTML vs Rust](/images/html-the-programming-language/html-vs-rust.jpg)

HTML を始めてみたくなってきましたか？それでは、早速 HTML プログラミングの基本を学んでいきましょう。

## セットアップと基本的な文法

### インストール

HTML を使用するには、`html.js` ファイルを[ダウンロード](https://html-lang.org/html.js)し、それを任意の HTML ファイルから `<script>` タグにより読み込みます。その他のツールは不要です。気楽に始められるのも HTML の魅力といえます。

```html
<script src="html.js"></script>
```

### プログラムの構造

HTML プログラムは、`<main>` タグの中に記述します。C 言語の `main` 関数などとの類似性もあり、わかりやすいですね:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>HTML, the programming language</title>
  <script src="html.js"></script>
</head>
<body>
  <main>
    <!-- ここにプログラムを記述 -->
  </main>
</body>
```

以下では同一構造の繰り返しを避けるため、基本的に `<main>` タグの中身のみを記述することとします。

### はじめての HTML プログラム

まずは公式サイトにある、1 から 10 までの数をコンソールに出力するサンプルプログラムを眺めてみましょう:

```html
<data value="1"></data>      <!-- 1 をスタックにプッシュ -->
<output id="loop"></output>  <!-- スタックの先頭要素を出力 -->
<data value="1"></data>      <!-- 1 をスタックにプッシュ -->
<dd></dd>                    <!-- 1 を追加 -->
<dt></dt>                    <!-- スタックの先頭要素を複製 -->
<data value="11"></data>     <!-- 比較対象の 11 をプッシュ -->
<small></small>              <!-- 新しい値が 11 よりも小さいかどうか確認 -->
<i>                          <!-- 上の結果が真の場合 -->
  <a href="#loop"></a>         <!-- #loop にジャンプ -->
</i>
```

すでに述べたように、HTML はスタック指向のプログラミング言語です。つまり、スタックに値を積んでいき、各値に対して何らかの操作を加えていくというのが HTML プログラミングの基本的なスタイルです。スタックに対する各操作はコマンドと呼ばれ、`<command>` のようなタグにより記述されます。

上のプログラムでは、まず `<data>` タグにより `1` をスタックにプッシュしています。次に、`<output>` タグによりスタックの先頭要素をコンソールに出力します。そしてインクリメント用の `1` をスタックにプッシュし、`<dd>` (a**dd**) タグによりそれを最初の値に加算します。さらに、`<dt>` (duplicate top) タグにより足し算の結果を複製し、ループを終了すべきか確認するために `11` をプッシュします。`<smalll>` タグにより、スタックから値を 2 つポップし、両者の大小関係を比較してその結果をプッシュします。最後に、`<i>` (if) タグにより、直前の演算結果に応じた条件分岐をおこない、条件が真の場合に `<a>` タグによりプログラム冒頭の `#loop` にジャンプします。このようにして、1 から 10 までの数を順に出力できます。

初回のループにおけるスタックの状態遷移を図示すると以下のようになります:

```text
1
1 1
2
2 2
2 2 11
2 true
2
...
```

以上により、HTML プログラミングの雰囲気が掴めたのではないでしょうか。スタックに値を積みそれを操作していくというシンプルなプログラミングスタイルは、メンタルモデルとしてもわかりやすく、プログラミング初心者にとっても嬉しいポイントですね。

続いて、上で触れたものも含め、HTML における基本的なコマンドについて説明します。ここですべてを網羅することはできないため、詳しくは公式ドキュメントを参照してください。

### データ型

HTML では、数値を扱うことができます。`<data>` タグにより数値をスタックにプッシュできます:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
```

また、文字列を扱うこともできます。`<s>` タグにより文字列をスタックにプッシュできます:

```html
<s>hello, world</s>  <!-- "hello, world" をスタックにプッシュ -->
```

真偽値をスタックにプッシュするには、後述する `<cite>` タグを使用します。HTML では `true` や `false` は変数として定義されており、その値がスタックにプッシュされることに注意してください:

```html
<cite>true</cite>  <!-- true をスタックにプッシュ -->
```

この他にも、[配列](https://html-lang.org/#arrays)や[オブジェクト](https://html-lang.org/#objects)などのデータ型が用意されています。詳細は公式ドキュメントを参照してください。

### 入出力

スタックの先頭の値を出力するには `<output>` タグを使用します。デフォルトでは `console.log` が使用されますが、`html.meta.out` を上書きしてカスタマイズすることも可能です:

```html
<s>hello, world</s>  <!-- "hello, world" をスタックにプッシュ -->
<output></output>    <!-- スタックの先頭の値を出力 -->
```

ユーザーの入力を受け付けるには `<input>` タグを使用します。デフォルトでは JavaScript の `prompt()` が使用されます。`placeholder` 属性によりプロンプトのメッセージを指定できます:

```html
<input placeholder="What is your name?" />  <!-- プロンプトを表示 -->
<output></output>                           <!-- 入力された値を出力 -->
```

### 変数

変数を定義するには `<var>` タグを使用します。このタグは、スタックから値を 1 つポップし、`title` 属性で指定された名前の変数を定義します:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<var title="x"></var>    <!-- スタックの先頭の値をポップし、x という名前の変数を定義 -->
```

変数を参照するには `<cite>` タグを使用します:

```html
<cite>x</cite>     <!-- x という名前の変数の値をスタックにプッシュ -->
<output></output>  <!-- スタックの先頭の値を出力 -->
```

### 算術演算

HTML において加算をおこなうには `<dd>` (a**dd**) タグを使用します。このタグは、スタックから値を 2 つポップし、それらを加算した結果をスタックにプッシュします:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<data value="2"></data>  <!-- 2 をスタックにプッシュ -->
<dd></dd>                <!-- 1 と 2 をポップして加算し、計算結果である 3 をスタックにプッシュ -->
```

この他にも、[減算](https://html-lang.org/#subtraction) (`<sub>`)、[乗算](https://html-lang.org/#multiplication) (`<ul>` (m**ul**))、[除算](https://html-lang.org/#division) (`<div>`) などの演算が可能です。

### 比較演算

数値の大小を比較するには `<small>` タグや `<big>` タグを使用します。これらのタグは、スタックから値を 2 つポップし、それらを比較した結果をスタックにプッシュします:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<data value="2"></data>  <!-- 2 をスタックにプッシュ -->
<small></small>          <!-- 1 と 2 をポップして比較 (1 < 2) し、計算結果である true をスタックにプッシュ -->
```

また、値が等しいかどうかを確認するには `<em>` (equal (mostly)) タグを使用します:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<data value="2"></data>  <!-- 2 をスタックにプッシュ -->
<em></em>                <!-- 1 と 2 をポップして比較 (1 == 2) し、計算結果である false をスタックにプッシュ -->
```

### 論理演算

スタックに積まれた真偽値に対して論理演算をおこなうには `<b>` (論理積 and に対応) タグや `<bdo>` (論理和 or に対応) タグを使用します。これらのタグは、スタックから値を 2 つポップし、それらを論理演算した結果をスタックにプッシュします:

```html
<cite>true</cite>  <!-- true をスタックにプッシュ -->
<cite>false</cite> <!-- false をスタックにプッシュ -->
<b></b>            <!-- true と false をポップして論理演算 (true and false) し、計算結果である false をスタックにプッシュ -->
```

この他に、[否定](https://html-lang.org/#invert)に対応する `<bdi>` タグも用意されています。

### スタック演算

スタックの先頭要素を複製するには `<dt>` (duplicate top) タグを使用します。このタグは、スタックの先頭要素を複製し、その複製をスタックにプッシュします:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<dt></dt>                <!-- 1 を複製してスタックにプッシュ -->
```

また、スタックの先頭要素を破棄するには `<del>` タグを使用します:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<del></del>              <!-- 1 を破棄 -->
```

### 条件分岐

`<i>` (if) タグにより、直前の演算結果に応じた条件分岐をおこなうことができます。このタグは、スタックから値を 1 つポップし、それが真 (truthy) である場合に内部のコマンドを実行します。真偽の判定のためにスタックの先頭の値はポップされるため、値を後続の処理で使用する場合は `<dt>` タグにより複製しておく必要がある点に注意してください:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<em></em>                <!-- 1 と 1 をポップして比較し、計算結果である true をスタックにプッシュ -->
<i>                      <!-- スタックの先頭要素をポップし、それが真である場合 -->
  <s>1 == 1</s>            <!-- "1 == 1" をスタックにプッシュ -->
  <output></output>        <!-- スタックの先頭要素を出力 -->
</i>
```

値を複製する `<dt>` と真偽を反転させる `<bdi>` タグを使用すれば、if/else 文も実現できます:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<data value="2"></data>  <!-- 2 をスタックにプッシュ -->
<em></em>                <!-- 1 と 2 をポップして比較し、計算結果である false をスタックにプッシュ -->
<dt>                     <!-- スタックの先頭要素を複製 -->
<i>                      <!-- スタックの先頭要素をポップし、それが真である場合 -->
  <s>1 == 2</s>            <!-- "1 == 2" をスタックにプッシュ -->
  <output></output>        <!-- スタックの先頭要素を出力 -->
  <del>                    <!-- スタックの先頭要素を破棄 -->
</i>
<bdi>                    <!-- スタックの先頭要素の真偽を反転 -->
<i>                      <!-- スタックの先頭要素をポップし、それが真である場合 -->
  <s>1 != 2</s>            <!-- "1 != 2" をスタックにプッシュ -->
  <output></output>        <!-- スタックの先頭要素を出力 -->
</i>
```

### 繰り返し

`<a>` タグにより、プログラムの任意の位置にジャンプすることができます。任意のコマンドに `id` 属性を指定でき、`<a>` タグの `href` 属性にはその `id` を指定すると、そのコマンドにジャンプします。上で見た 1 から 10 までの数を出力するプログラムでは、`<a>` タグにより `#loop` にジャンプしていました:

```html
<data value="1"></data>      <!-- 1 をスタックにプッシュ -->
<output id="loop"></output>  <!-- スタックの先頭要素を出力 -->
<data value="1"></data>      <!-- 1 をスタックにプッシュ -->
<dd></dd>                    <!-- 1 を追加 -->
<dt></dt>                    <!-- スタックの先頭要素を複製 -->
<data value="11"></data>     <!-- 比較対象の 11 をプッシュ -->
<small></small>              <!-- 新しい値が 11 よりも小さいかどうか確認 -->
<i>                          <!-- 上の結果が真の場合 -->
  <a href="#loop"></a>         <!-- #loop にジャンプ -->
</i>
```

このようにして繰り返し処理を実現できます。

### 関数

関数の定義は `<dfn>` タグによりおこないます。`id` 属性に関数名を指定し、`<dfn>` タグの中に関数の本体を記述します。以下は、引数の値を 2 乗する関数 `square` を定義する例です:

```html
<dfn id="square">
  <dt></dt>  <!-- 関数の引数を複製 -->
  <ul></ul>  <!-- 関数の引数と上で複製した値をポップして乗算し、計算結果をスタックにプッシュ -->
</dfn>
```

関数を呼び出すには、`href` 属性を `javascript:[関数名]()` という形式で指定した `<a>` タグを使います。引数は子要素として記述する必要がある点に注意してください。以下は、上で定義した `square` 関数を呼び出す例となります:

```html
<a href="javascript:square()">  <!-- 関数 square の呼び出し -->
  <data value="12"></data>      <!-- 関数の引数 -->
</a>
<output></output>               <!-- スタックの先頭要素を出力 -->
```

なお、`<rt>` タグにより関数の実行を終了できます。

### コメント

すでに見てきたように、HTML では `<!--` と `-->` によりコメントを記述できます:

```html
<!-- これはコメントです -->
```

### 言語の拡張

HTML では、`html.meta.commands` を使用して JavaScript により言語を拡張し、新しいコマンドを定義できます。

たとえば、以下はスタックの内容を出力する `<pre>` コマンドを追加する例です。

```html
<script>
html.meta.commands["pre"] = function(elt, env) {
  console.log(env.stack);
}
</script>
```

`<main>` タグの前に上の `<script>` タグを実行しておくと、以下のように `<pre>` コマンドを使用してスタックの内容を出力できます:

```html
<data value="1"></data>  <!-- 1 をスタックにプッシュ -->
<data value="2"></data>  <!-- 2 をスタックにプッシュ -->
<data value="3"></data>  <!-- 3 をスタックにプッシュ -->
<pre></pre>              <!-- スタックの内容 [1, 2, 3] を出力 -->
```

## 応用例 1: FizzBuzz

これまで見てきた知識を総動員すれば、FizzBuzz プログラムを実装することもできます。以下は、1 から 100 までループし、3 で割り切れる場合は `"Fizz"`、5 で割り切れる場合は `"Buzz"`、15 で割り切れる場合は `"FizzBuzz"` を出力するプログラムです。コーディングテストで FizzBuzz が出題されてもこれで安心ですね。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>HTML, the programming language による FizzBuzz プログラム</title>
  <script src="html.js"></script>
  <script>
    // 剰余を計算する mod コマンドを追加
    html.meta.commands["mod"] = function(elt, env) {
      let top = env.stack.pop();
      let next = env.stack.pop();
      env.stack.push(next % top);
    }
  </script>
</head>
<body>
  <main>
    <!-- 0 をスタックにプッシュ -->
    <data value="0"></data>

    <!-- インクリメント -->
    <data value="1" id="loop"></data>
    <dd></dd>

    <!-- 15 で割り切れれば "FizzBuzz" を出力 -->
    <dt></dt>                 <!-- 値を複製 -->
    <data value="15"></data>  <!-- 15 をスタックにプッシュ -->
    <mod></mod>               <!-- 15 で割った余りを計算 -->
    <data value="0"></data>   <!-- 0 をスタックにプッシュ -->
    <em></em>                 <!-- 余りが 0 かどうかを計算 -->
    <i>                       <!-- 割り切れた場合 -->
      <s>FizzBuzz</s>           <!-- "FizzBuzz" をスタックにプッシュ -->
      <output></output>         <!-- スタックの値を出力 -->
      <del></del>               <!-- スタックの値を破棄 -->
      <a href="#break"></a>     <!-- #break にジャンプ -->
    </i>

    <!-- 3 で割り切れれば "Fizz" を出力 -->
    <dt></dt>
    <data value="3"></data>
    <mod></mod>
    <data value="0"></data>
    <em></em>
    <i>
      <s>Fizz</s>
      <output></output>
      <del></del>
      <a href="#break"></a>
    </i>

    <!-- 5 で割り切れれば "Buzz" を出力 -->
    <dt></dt>
    <data value="5"></data>
    <mod></mod>
    <data value="0"></data>
    <em></em>
    <i>
      <s>Buzz</s>
      <output></output>
      <del></del>
      <a href="#break"></a>
    </i>

    <!-- その他の場合は数値を出力 -->
    <output></output>

    <!-- 100 未満の場合は #loop にジャンプ -->
    <dt id="break"></dt>       <!-- 値を複製 -->
    <data value="100"></data>  <!-- 100 をスタックにプッシュ -->
    <small></small>            <!-- 100 未満かどうかを計算 -->
    <i>                        <!-- 100 未満の場合 -->
      <a href="#loop"></a>       <!-- #loop にジャンプ -->
    </i>
  </main>
</body>
</html>
```

## 応用例 2: フィボナッチ数列

以下は、公式ドキュメントに掲載されている、フィボナッチ数列の n 番目の項を返すプログラムの実装例です。フィボナッチ数列は、前の 2 つの数の和が次の数となるような数列です。関数の定義や再帰の練習として最適ですが、ここまでの知識が頭に入っていれば理解できるはずです:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>HTML, the programming language によるフィボナッチ数列の計算</title>
  <script src="html.js"></script>
</head>
<body>
  <main>
    <!-- 関数 fib を定義 -->
    <dfn id="fib">
      <!-- 引数を num という名前の変数として定義 -->
      <var title="num"></var>

      <!-- num < 1 の場合は 0 を返す -->
      <cite>num</cite>           <!-- 変数 num の値をスタックにプッシュ -->
      <data value="1"></data>    <!-- 1 をスタックにプッシュ -->
      <small></small>            <!-- num が 1 未満かどうか確認 -->
      <i>                        <!-- 上の結果が真の場合 -->
        <data value="0"></data>    <!-- 0 をスタックにプッシュ -->
        <rt></rt>                  <!-- リターン -->
      </i>

      <!-- num == 1 の場合は 1 を返す -->
      <cite>num</cite>
      <data value="1"></data>
      <em></em>
      <i>
        <data value="1"></data>
        <rt></rt>
      </i>

      <!-- num == 2 の場合は 1 を返す -->
      <cite>num</cite>
      <data value="2"></data>
      <em></em>
      <i>
        <data value="1"></data>
        <rt></rt>
      </i>

      <!-- num - 1 番目の項を再帰的に計算 -->
      <a href="javascript:fib()">
        <cite>num</cite>
        <data value="1"></data>
        <sub></sub>
      </a>

      <!-- num - 2 番目の項を再帰的に計算 -->
      <a href="javascript:fib()">
        <cite>num</cite>
        <data value="2"></data>
        <sub></sub>
      </a>

      <!-- fib(num - 1) + fib(num - 2) をスタックにプッシュ -->
      <dd></dd>
    </dfn>

    <!-- フィボナッチ数列の 10 番目の項 (55) を計算して出力 -->
    <a href="javascript:fib()">
      <data value="10"></data>
    </a>
    <output></output>
  </main>
</body>
</html>
```

## おわりに

HTML, The Programming Language について、その概要と基本的な文法について説明しました。HTML は、スタック指向のプログラミング言語としてシンプルでわかりやすい文法を備え、また JavaScript による拡張も可能であるため、プログラミング初心者から玄人まで幅広く楽しめる言語であるといえるでしょう。本文では説明できませんでしたが、組み込みのデバッガー [HDB](https://html-lang.org/#debugging) を用いてブレークポイントを設定したりすることも可能です。公式サイトも参考に、ぜひ HTML プログラミングを楽しんでみてください！

## 参考文献

https://html-lang.org/
