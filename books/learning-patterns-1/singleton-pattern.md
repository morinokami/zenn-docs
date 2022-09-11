---
title: "シングルトンパターン"
---

---

> 単一のインスタンスをアプリケーション全体で共有する

---

![](/images/learning-patterns/singleton-pattern-1280w.jpg)

:::message
原文は[こちら](https://www.patterns.dev/posts/singleton-pattern/)
:::

## シングルトンパターン

シングルトン (singleton) は、一度だけインスタンス化でき、グローバルにアクセスできるようなクラスのことです。この*単一のインスタンス*をアプリケーション全体で共有できることから、シングルトンはアプリケーションのグローバルな状態を管理するのに適しています。

まず、ES2015 のクラスを使って、シングルトンがどのようなものかを見てみましょう。例として、以下のメソッドをもつ `Counter` クラスを作成します:

* インスタンスの値を返す `getInstance` メソッド
* `counter` 変数の現在値を返す `getCount` メソッド
* `counter` の値を 1 だけ増やす `increment` メソッド
* `counter` の値を 1 だけ減らす `decrement` メソッド

```js
let counter = 0;

class Counter {
  getInstance() {
    return this;
  }

  getCount() {
    return counter;
  }

  increment() {
    return ++counter;
  }

  decrement() {
    return --counter;
  }
}
```

ところで、このクラスはシングルトンであるための基準を満たしていません。シングルトンは**一度しかインスタンス化できない**はずです。ところが現在、`Counter` クラスのインスタンスを複数作成することができてしまいます。

```js
let counter = 0;

class Counter {
  getInstance() {
    return this;
  }

  getCount() {
    return counter;
  }

  increment() {
    return ++counter;
  }

  decrement() {
    return --counter;
  }
}

const counter1 = new Counter();
const counter2 = new Counter();

console.log(counter1.getInstance() === counter2.getInstance()); // false
```

`new` メソッドが 2 回呼ばれ、`counter1` と `counter2` に異なるインスタンスがセットされます。`counter1` と `counter2` の `getInstance` メソッドが返す値は、異なるインスタンスへの参照となります。両者は厳密に等価 (strictly equal) ではありません！

![](/images/learning-patterns/singleton-pattern-1.mp4.gif)
:::message
もとの動画は[こちら](https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056519/patterns.dev/jspat-52_zkwyk1.mp4)
:::

`Counter` クラスのインスタンスが **1 つ**だけ作成されるようにしていきましょう。

1 つのインスタンスしか作成できないようにする方法としては、`instance` という変数を作成するというものがあります。`Counter` のコンストラクタで新しいインスタンスが作成されるときに、`instance` にそのインスタンスへの参照をセットするのです。変数 `instance` にすでに値がセットされているかどうかをチェックすることで、新しいインスタンスが作られないようにすることができます。もし値がセットされていれば、すでにインスタンスが存在するということです。その際はエラーを投げてユーザーに知らせます。

```js
let instance;
let counter = 0;

class Counter {
  constructor() {
    if (instance) {
      throw new Error("You can only create one instance!");
    }
    instance = this;
  }

  getInstance() {
    return this;
  }

  getCount() {
    return counter;
  }

  increment() {
    return ++counter;
  }

  decrement() {
    return --counter;
  }
}

const counter = new Counter();
const counter2 = new Counter();
// Error: You can only create one instance!
```

完璧です！これでもう複数のインスタンスを作成することはできなくなりました。

このファイルから `Counter` のインスタンスをエクスポートしましょう。ただ、そうする前に、インスタンスを**凍結 (freeze)** しておく必要があります。`Object.freeze` メソッドは、利用者側であるコードからシングルトンを変更できないようにします。凍結したインスタンスのプロパティに対して追加や変更ができないため、誤ってシングルトンの値を上書きしてしまう危険性が低くなります。

```js
let instance;
let counter = 0;

class Counter {
  constructor() {
    if (instance) {
      throw new Error("You can only create one instance!");
    }
    instance = this;
  }

  getInstance() {
    return this;
  }

  getCount() {
    return counter;
  }

  increment() {
    return ++counter;
  }

  decrement() {
    return --counter;
  }
}

const singletonCounter = Object.freeze(new Counter());
export default singletonCounter;
```

---

`Counter` を実装したアプリケーションについて考えてみましょう。以下のファイルがあるとします:

* `counter.js`: `Counter` クラスを定義し、**`Counter` のインスタンス**をデフォルトエクスポートします
* `index.js`: `redButton.js` と `blueButton.js` モジュールをロードします
* `redButton.js`: `Counter` をインポートし、**赤い**ボタンのイベントリスナーとして `Counter` の `increment` メソッドを追加し、`getCount` メソッドを呼び出して `counter` の現在値をログ出力します
* `blueButton.js`: `Counter` をインポートし、**青い**ボタンのイベントリスナーとして `Counter` の `increment` メソッドを追加し、`getCount` メソッドを呼び出して `counter` の現在値をログ出力します

`blueButton.js` と `redButton.js` は、どちらも `counter.js` から**同じインスタンス**をインポートします。このインスタンスは、どちらのファイルにおいても `Counter` としてインポートされています。

![](/images/learning-patterns/singleton-pattern-2.mp4.gif)
:::message
もとの動画は[こちら](https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056519/patterns.dev/jspat-56_wylvcf.mp4)
:::

`redButton.js` と `blueButton.js` のいずれかで `increment` メソッドを呼び出すと、両方のファイルで `Counter` インスタンスの `counter` プロパティの値が更新されます。赤いボタンと青いボタンのどちらをクリックするかは関係ありません。同じ値がすべてのインスタンスで共有されているのです。このため、異なるファイルでメソッドを呼び出しても、カウンターは 1 ずつ増加します。

---

## 利点と欠点

インスタンス化を一度に限定することで、使用されるメモリ容量を大幅に削減できる可能性があります。新しいインスタンスのためにメモリを毎回確保するのではなく、アプリケーション全体で参照される 1 つのインスタンスのためにメモリを確保すればよいからです。しかし、シングルトンは実際には**アンチパターン**と考えられており、JavaScript ではこれを避けることができます (というよりも、避ける*べき*です)。

Java や C++ などの多くのプログラミング言語では、JavaScript のようにオブジェクトを直接作成することはできません。これらのオブジェクト指向プログラミング言語では、まずクラスを作成する必要があり、そのクラスがオブジェクトを作成します。作成されたオブジェクトは、上記の JavaScript の例における `instance` のように、クラスのインスタンスの値をもちます。

しかし、上記の例で示したクラスの実装は、実はやり過ぎなのです。JavaScript ではオブジェクトを直接作成できるため、通常のオブジェクトを使用するだけでまったく同じ結果を得ることができます。シングルトンを使うことのデメリットをいくつか見てみましょう！

#### 通常のオブジェクトを使う

前回と同じ例を使います。しかし今回は、`counter` は以下のプロパティをもつ単なるオブジェクトです:

* `count` プロパティ
* `count` の値を 1 だけ増やす `increment` メソッド
* `count` の値を 1 だけ減らす `decrement` メソッド

```js:counter.js
let count = 0;

const counter = {
  increment() {
    return ++count;
  },
  decrement() {
    return --count;
  }
};

Object.freeze(counter);
export { counter };
```

@[codesandbox](https://codesandbox.io/embed/competent-moon-rvzrr)

オブジェクトは参照渡しであるため、`redButton.js` も `blueButton.js` も同じ `counter` オブジェクトへの参照をインポートしていることになります。これらのファイルのどちらかで `count` の値を変更すると `counter` の値が変更され、その結果へはいずれのファイルからでもアクセスすることができます。

### テスト

シングルトンに依存するコードのテストは厄介な場合があります。毎回新しいインスタンスを作成することができないため、すべてのテストは直前のテストのグローバルインスタンスに対する変更に依存します。この場合、テストの順番が重要であり、ちょっとした修正によりテストスイート全体が失敗する可能性もあります。テスト終了後、テストによる変更をリセットするために、インスタンス全体をリセットする必要があります。

```js:test.js
import Counter from "../src/counterTest";

test("incrementing 1 time should be 1", () => {
  Counter.increment();
  expect(Counter.getCount()).toBe(1);
});

test("incrementing 3 extra times should be 4", () => {
  Counter.increment();
  Counter.increment();
  Counter.increment();
  expect(Counter.getCount()).toBe(4);
});

test("decrementing 1  times should be 3", () => {
  Counter.decrement();
  expect(Counter.getCount()).toBe(3);
});
```

@[codesandbox](https://codesandbox.io/embed/sweet-cache-n55vi)

### 依存関係の隠蔽

他のモジュール (ここでは `superCounter.js`) をインポートする際、そのモジュールがシングルトンをインポートしていることが明らかではない場合があります。他のファイル、たとえばこの場合は `index.js` などで、そのモジュールをインポートしてメソッドを呼び出すかもしれません。このようにして、誤ってシングルトンの値を変更してしまうことがあります。アプリケーション全体でシングルトンの複数のインスタンスが共有されており、それらがすべて変更されてしまうことから、予期せぬ挙動をもたらす可能性があります。

```js:index.js
import Counter from "./counter";
import SuperCounter from "./superCounter";
const counter = new SuperCounter();

counter.increment();
counter.increment();
counter.increment();

console.log("Counter in counter.js: ", Counter.getCount());
```

@[codesandbox](https://codesandbox.io/embed/sweet-cache-n55vi)

### グローバルな動作

シングルトンのインスタンスは、アプリケーション全体から参照できるようにする必要があります。グローバル変数も、本質的には同じ性質をもちます。グローバル変数はグローバルスコープで利用可能であるため、アプリケーション全体でそれらの変数にアクセスすることができるからです。

グローバル変数をもつことは、設計における悪い判断であると一般に考えられています。グローバルスコープの汚染は、誤ってグローバル変数の値を上書きしてしまい、その結果多くの予期せぬ動作につながる可能性があるためです。

ES2015 において、グローバル変数を作成することはほとんどありません。新しいキーワードである `let` と `const` は、この 2 つのキーワードにより宣言された変数をブロックスコープで管理するため、開発者が誤ってグローバルスコープを汚染することを防ぎます。JavaScript の新しい `module` システムでは、モジュールから値を `export` し、他のファイルでその値を `import` することができるため、グローバルスコープを汚染せずにグローバルにアクセス可能な値を作成することが容易になっているのです。

しかし、シングルトンの一般的なユースケースは、アプリケーション全体にある種の**グローバルな状態**をもたせることです。コードベースの複数の箇所が同じ**ミュータブルなオブジェクト**に依存していると、予期せぬ動作につながることがあります。

通常、コードベースのある部分はグローバルな状態の値を変更し、他の部分はそのデータを使用します。ここでは実行順序が重要となります。使用するデータが (まだ) ないときに、誤ってデータにアクセスしてしまわないようにしなければなりません。グローバルな状態を保持しつつデータの流れを理解することは、アプリケーションが成長し、何十ものコンポーネントが互いに依存し合うようになると、非常に厄介なものとなります。

### React における状態管理

React では、シングルトンではなく、**Redux** や **コンテクスト** などの状態管理ツールを使ってグローバルな状態を利用することが一般的です。そのグローバルな状態の振る舞いはシングルトンと似ているように見えるかもしれませんが、これらのツールはシングルトンのような*ミュータブルな*状態ではなく、**リードオンリーな状態**を提供します。Redux を使用する場合、コンポーネントが *dispatcher* を介して *action* を送信したあとに、純粋関数である *reducer* のみが状態を更新することができます。

これらのツールを使うことで、グローバルな状態をもつことの欠点が魔法のように消えるわけではありませんが、コンポーネントが状態を直接更新できないことにより、少なくともグローバルな状態が意図したとおりに変更されるようにできるのです。

---

## 参考文献

* [Do React Hooks replace Redux - Eric Elliott](https://medium.com/javascript-scene/do-react-hooks-replace-redux-210bab340672)
* [Working with Singletons in JavaScript - Vijay Prasanna](https://alligator.io/js/js-singletons/)
* [JavaScript Design Patterns: The Singleton - Samier Saeed](https://www.sitepoint.com/javascript-design-patterns-singleton/)
* [Singleton - Refactoring Guru](https://refactoring.guru/design-patterns/singleton)
