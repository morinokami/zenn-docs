---
title: "モジュールパターン"
---

---

> コードを再利用可能な小さな部品へと分割する

---

![](/images/learning-patterns/module-pattern-1280w.jpg)

アプリケーションとコードベースが大きくなるにつれて、コードを保守しやすく分割しておくことがより重要になります。モジュールパターンは、コードを再利用可能な小さな部品へと分割することを可能にします。

再利用可能な小さな部品へとコードを分割できることに加え、モジュールはファイル内の特定の値を*非公開*にすることも可能とします。モジュール内の変数の宣言は、デフォルトではそのモジュールにスコープ (*カプセル化*) されます。ある値を明示的にエクスポートしなければ、その値はモジュールの外では利用できません。これにより、コードベースの他の部分で宣言された値がグローバルスコープで利用できなくなるため、名前が衝突する危険性を減らすことができます。

---

### ES2015 のモジュール

ES2015 では、組み込みの JavaScript モジュールが導入されました。モジュールとは、JavaScript のコードを含むファイルをいい、通常のスクリプトと比較して動作に多少の違いがあります。

数学の関数を含む `math.js` というモジュールの例を見てみましょう。

```js:math.js
function add(x, y) {
  return x + y;
}
function multiply(x) {
  return x * 2;
}
function subtract(x, y) {
  return x - y;
}
function square(x) {
  return x * x;
}
```

```js:index.js
console.log(add(2, 3));
console.log(multiply(2));
console.log(subtract(2, 3));
console.log(square(2));
```

@[codesandbox](https://codesandbox.io/embed/design-patterns10-44n1k)

簡単な数学的ロジックを含む `math.js` ファイルがあります。その内部には、ユーザーが足し算、掛け算、引き算、そして渡した値の二乗を求めるための関数があります。

しかし、ここではこれらの関数を `math.js` ファイル内で使用したいわけではなく、`index.js` ファイル内で参照できるようにしたいのです！現在、`index.js` ファイル内ではエラーが発生しています。`index.js` ファイル内には `add`、`subtract`、`multiply`、`square` という関数が存在しないのです。つまり、`index.js` ファイル内に存在しない関数を参照しようとしているのです。

`math.js` の関数を他のファイルから利用できるようにするには、関数を*エクスポート*する必要があります。モジュールからコードをエクスポートするには、`export` キーワードを使用します。関数をエクスポートする 1 つの方法は、*名前付きエクスポート (named export)* を使用することです。そのためには、外部に公開したい部分の前に `export` キーワードを追加します。ここでは、`index.js` が 4 つの関数すべてにアクセスできる必要があるため、すべての関数の前に `export` キーワードを追加したいと思います。

```js:math.js
export function add(x, y) {
  return x + y;
}

export function multiply(x) {
  return x * 2;
}

export function subtract(x, y) {
  return x - y;
}

export function square(x) {
  return x * x;
}
```

これで `add`、`multiply`、`subtract`、`square` 関数をエクスポートできるようになりました。しかし、モジュールから値をエクスポートするだけでは、任意のファイルからそれらの値を使用することはできません。モジュールからエクスポートされた値を使えるようにするためには、値を参照するファイルにおいて明示的に*インポート*する必要があります。

`index.js` ファイルの先頭で、`import` キーワードを使用して値をインポートする必要があります。また、どのモジュールからこれらの関数をインポートしたいのかを JavaScript に知らせるために、`from` キーワードとモジュールへの相対パスも追加する必要があります。

```js:index.js
import { add, multiply, subtract, square } from "./math.js";
```

`index.js` ファイルに `math.js` モジュールから 4 つの関数をインポートできました。それでは、これらの関数が使えるかどうか試してみましょう！

```js:index.js
import { add, multiply, subtract, square } from "./math";

console.log(add(2, 3));
console.log(multiply(2));
console.log(subtract(2, 3));
console.log(square(2));
```

@[codesandbox](https://codesandbox.io/embed/holy-cookies-7t2cp)

参照エラーがなくなり、モジュールからエクスポートされた値を使用できるようになっています！

モジュールの大きな利点は、`export` キーワードを使って*明示的にエクスポートした値のみアクセスできる*ことです。`export` キーワードにより明示的にエクスポートしなかった値は、そのモジュールの中でしか利用できません。

`privateValue` という、`math.js` ファイル内でのみ参照可能な値を作ってみましょう。

```js:math.js
const privateValue = "This is a value private to the module!";

export function add(x, y) {
  return x + y;
}

export function multiply(x) {
  return x * 2;
}

export function subtract(x, y) {
  return x - y;
}

export function square(x) {
  return x * x;
}
```

`privateValue` の前に `export` キーワードを追加していないことに注目してください。変数 `privateValue` をエクスポートしていないため、この値を `math.js` モジュールの外から参照することはできません！

```js:index.js
import { add, multiply, subtract, square } from "./math.js";

console.log(privateValue);
/* Error: privateValue is not defined */
```

値をモジュールの外部に非公開とすることで、誤ってグローバルスコープを汚染するリスクを減らすことができます。あなたのモジュールを使っている別の開発者が作った値を、モジュール内の同じ名前をもつプライベートな値により誤って上書きしてしまう心配はありません。つまり、名前の衝突を防ぐことができるのです。

---

エクスポートされた名前がローカルの値と衝突してしまうことがあります。

```js:index.js
import { add, multiply, subtract, square } from "./math.js";

function add(...args) {
  return args.reduce((acc, cur) => cur + acc);
}
/* Error: add has  already been declared */

function multiply(...args) {
  return args.reduce((acc, cur) => cur * acc);
}
/* Error: multiply has already been declared */
```

ここでは、`index.js` に `add` と `multiply` という関数があります。同じ名前の値をインポートしようとすると、`add` と `multiply` はすでに宣言されているため、名前の衝突が起きてしまうのです！幸いなことに、`as` キーワードを使えば、インポートした値の*名前を変更*することができます。

インポートされた `add` と `multiply` 関数の名前を `addValues` と `multiplyValues` に変更してみましょう。

```js:index.js
import {
  add as addValues,
  multiply as multiplyValues,
  subtract,
  square
} from "./math.js";

function add(...args) {
  return args.reduce((acc, cur) => cur + acc);
}

function multiply(...args) {
  return args.reduce((acc, cur) => cur * acc);
}

/* From math.js module */
addValues(7, 8);
multiplyValues(8, 9);
subtract(10, 3);
square(3);

/* From index.js file */
add(8, 9, 2, 10);
multiply(8, 9, 2, 10);
```

`export` キーワードだけで定義される名前付きエクスポートの他に、*デフォルトエクスポート*を使用することもできます。デフォルトエクスポートは、1 つのモジュールに **1 つ**だけもつことができます。

他の関数は名前付きエクスポートとしたままで、`add` 関数をデフォルトエクスポートしてみましょう。デフォルト値をエクスポートするには、値の前に `export default` を付けます。

```js:math.js
export default function add(x, y) {
  return x + y;
}

export function multiply(x) {
  return x * 2;
}

export function subtract(x, y) {
  return x - y;
}

export function square(x) {
  return x * x;
}
```

名前付きエクスポートとデフォルトエクスポートの違いは、値がモジュールからエクスポートされる方法であり、これにより値をインポートする方法も変わります。

ここまでは、名前付きエクスポートのために、`import { module } from 'module'` のように、ブラケットを使用しなければなりませんでした。デフォルトエクスポートでは、`import module from 'module'` のように、ブラケット*なしで*値をインポートできます。

```js:index.js
import add, { multiply, subtract, square } from "./math.js";

add(7, 8);
multiply(8, 9);
subtract(10, 3);
square(3);
```

デフォルトエクスポートがある場合、モジュールからブラケットなしでインポートされる値は、常にデフォルトエクスポートの値になります。

JavaScript はこの値が常にデフォルトエクスポートされた値であることを知っているため、インポートされたデフォルト値に、それがエクスポートされたときの名前とは異なる名前を付けることができます。`add` という名前により `add` 関数をインポートする代わりに、例えば `addValues` と呼ぶことができます。

```js:index.js
import addValues, { multiply, subtract, square } from "./math.js";

addValues(7, 8);
multiply(8, 9);
subtract(10, 3);
square(3);
```

JavaScript はデフォルトエクスポートをインポートしていることを知っているため、`add` という名前でエクスポートされた関数であっても、好きな名前でインポートすることができるのです。

また、アスタリスク `*` を使ってインポートしたいモジュールに名前を指定することで、モジュールからエクスポートされるすべての値、つまり、名前付きエクスポートとデフォルトエクスポートをインポートすることもできます。ここでインポートされる値は、エクスポートされたすべての値を含むオブジェクトとなります。例えば、モジュール全体を `math` としてインポートしてみます。

```js:index.js
import * as math from "./math.js";
```

インポートされた値は、`math` オブジェクトのプロパティとなります。

```js:index.js
import * as math from "./math.js";

math.default(7, 8);
math.multiply(8, 9);
math.subtract(10, 3);
math.square(3);
```

この場合、モジュールから*すべての*エクスポートをインポートしていることになります。このとき、不必要な値をインポートしてしまうことがあるため、注意してください。

`*` を使用してインポートされるのは、エクスポートされた値だけです。モジュール内のプライベートな値は、明示的にエクスポートしない限り、モジュールをインポートするファイルからは使用できません。

---

### React

React でアプリケーションを作成する際、大量のコンポーネントを扱わなければならないことがよくあります。これらのコンポーネントを 1 つのファイルにまとめて書くのではなく、コンポーネントごとにそれぞれのファイルへと分割することができますが、これは本質的には個々のコンポーネントのモジュールを作成しているのです。

*リスト*、*リストアイテム*、*入力フィールド*、*ボタン*を含む簡単な Todo リストを考えます。

```jsx:index.js
import React from "react";
import { render } from "react-dom";

import { TodoList } from "./components/TodoList";
import "./styles.css";

render(
  <div className="App">
    <TodoList />
  </div>,
  document.getElementById("root")
);
```

```jsx:Button.js
import React from "react";
import Button from "@material-ui/core/Button";

const style = {
  root: {
    borderRadius: 3,
    border: 0,
    color: "white",
    margin: "0 20px"
  },
  primary: {
    background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)"
  },
  secondary: {
    background: "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)"
  }
};

export default function CustomButton(props) {
  return (
    <Button {...props} style={{ ...style.root, ...style[props.color] }}>
      {props.children}
    </Button>
  );
}
```

```jsx:Input.js
import React from "react";
import Input from "@material-ui/core/Input";

const style = {
  root: { padding: "5px", backgroundColor: "#434343", color: "#fff" }
};

export default function CustomInput(props, { variant = "standard" }) {
  return (
    <Input
      style={style.root}
      {...props}
      variant={variant}
      placeholder="Type..."
    />
  );
}
```

@[codesandbox](https://codesandbox.io/embed/heuristic-brattain-ipcyb)

コンポーネントを別々のファイルに分割しました:

* `List` コンポーネント用の `TodoList.js`
* *カスタマイズされた* `Button` コンポーネント用の `Button.js`
* *カスタマイズされた* `Input` コンポーネント用の `Input.js`

アプリケーション全体を通じて、[`material-ui`](https://material-ui.com/) ライブラリからインポートされたデフォルトの `Button` と `Input` コンポーネントを使用したくありません。代わりに、それらをカスタマイズしたコンポーネントを使用し、各ファイルの `styles` オブジェクトにおいて定義されるカスタムスタイルを追加したいと思います。これにより、アプリケーションの中で毎回デフォルトの `Button` と `Input` コンポーネントをインポートしてカスタムスタイルを何度も追加するのではなく、デフォルトの `Button` と `Input` コンポーネントを一度だけインポートしてスタイルを追加し、そのカスタムコンポーネントをエクスポートするだけでよくなります。

`Button.js` と `Input.js` の両方に `style` というオブジェクトがあることに注目してください。この値はモジュールにスコープされているため、名前の衝突のリスクを負うことなく、同じ変数名を再利用することができるのです。

---

### ダイナミックインポート

ファイルの先頭でモジュールをインポートする場合、それらはファイルの残りの部分よりも先にロードされます。ところで、ある条件に基づいてモジュールをインポートする必要があるケースも存在します。**ダイナミックインポート**を使えば、オンデマンドにモジュールをインポートすることができます。

```js
import("module").then(module => {
  module.default();
  module.namedExport();
});

// Or with async/await
(async () => {
  const module = await import("module");
  module.default();
  module.namedExport();
})();
```

上で使用した `math.js` の例を動的にインポートしてみましょう。

このモジュールは、ユーザーがボタンをクリックした場合にのみ読み込まれます。

```js:index.js
const button = document.getElementById("btn");

button.addEventListener("click", () => {
  import("./math.js").then((module) => {
    console.log("Add: ", module.add(1, 2));
    console.log("Multiply: ", module.multiply(3, 2));

    const button = document.getElementById("btn");
    button.innerHTML = "Check the console";
  });
});

/*************************** */
/**** Or with async/await ****/
/*************************** */
// button.addEventListener("click", async () => {
//   const module = await import("./math.js");
//   console.log("Add: ", module.add(1, 2));
//   console.log("Multiply: ", module.multiply(3, 2));
// });
```

@[codesandbox](https://codesandbox.io/embed/green-sound-j60fl)

モジュールを動的にインポートすることで、ページの読み込み時間を短縮することができます。ユーザーが本当に必要なコードを、*必要になってから***読み込み**、**パース**し、**コンパイル**すればよいのです。

<!-- TODO: "Besides being able to import modules on-demand..." から始まる文章が噛み合っていないため翻訳不可 -->

---

モジュールパターンにより、コードの中で公開してはいけない部分をカプセル化することができます。これにより、意図しない名前の衝突やグローバルスコープの汚染を防ぐことができ、複数の依存関係や名前空間を扱う際に生じるリスクが軽減されます。ES2015 モジュールをすべての JavaScript ランタイムで使用できるようにするためには、[Babel](https://babeljs.io/) のようなトランスパイラが必要です。
