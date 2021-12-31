---
title: "フックパターン"
---

---

> 関数を使いアプリケーション内の複数のコンポーネントでステートフルなロジックを再利用する

---

![](/images/learning-patterns/hooks-pattern-1280w.jpg)

React 16.8 では、[フック](https://reactjs.org/docs/hooks-intro.html)と呼ばれる新機能が導入されました。フックにより、ES2015 のクラスコンポーネントを使わなくても、React の状態やライフサイクルメソッドを利用することができるようになります。

フックは必ずしもデザインパターンというわけではありませんが、アプリケーションの設計において非常に重要な役割を果たします。従来のデザインパターンの多くは、フックによって置き換えることができます。

---

## クラスコンポーネント

React にフックが導入される前は、コンポーネントに状態やライフサイクルメソッドを追加するためには、クラスコンポーネントを使用する必要がありました。React の典型的なクラスコンポーネントは、次のようになります:

```js
class MyComponent extends React.Component {
  /* Adding state and binding custom methods */
  constructor() {
    super()
    this.state = { ... }

    this.customMethodOne = this.customMethodOne.bind(this)
    this.customMethodTwo = this.customMethodTwo.bind(this)
  }

  /* Lifecycle Methods */
  componentDidMount() { ...}
  componentWillUnmount() { ... }

  /* Custom methods */
  customMethodOne() { ... }
  customMethodTwo() { ... }

  render() { return { ... }}
}
```

クラスコンポーネントは、コンストラクタにステートを、コンポーネントのライフサイクルに基づいて副作用を実行する `componentDidMount` や `componentWillUnmount` などのライフサイクルメソッドを、そしてクラスにロジックを追加するためのカスタムメソッドをもつことができます。

React フックの導入後もクラスコンポーネントを使用することはできますが、それによりいくつかのデメリットが発生する可能性があります。クラスコンポーネントを使用する際の最も一般的な問題点を見てみましょう。

### ES2015 のクラスを理解する

React フックス以前は、クラスコンポーネントがステートやライフサイクルメソッドを扱える唯一のコンポーネントだったため、機能を追加するために、関数コンポーネントをクラスコンポーネントへとリファクタリングしなければならないことがよくありました。

ここでは、ボタンとして機能するシンプルな `div` を考えます。

```jsx
function Button() {
  return <div className="btn">disabled</div>;
}
```

常に `disabled` を表示するのではなく、ユーザーがボタンをクリックしたときに `enabled` として、同時にボタンに特別な CSS スタイルを追加したいと思います。

そうするには、ステータスが `enabled` か `disabled` かを知るために、コンポーネントにステートを追加する必要があります。つまり、関数コンポーネントを完全にリファクタし、ボタンのステートを保持するクラスコンポーネントに変える必要があるのです。

```jsx
export default class Button extends React.Component {
  constructor() {
    super();
    this.state = { enabled: false };
  }

  render() {
    const { enabled } = this.state;
    const btnText = enabled ? "enabled" : "disabled";

    return (
      <div
        className={`btn enabled-${enabled}`}
        onClick={() => this.setState({ enabled: !enabled })}
      >
        {btnText}
      </div>
    );
  }
}
```

これでボタンが想定通りに動くようになりました！

```jsx:Button.js
import React from "react";
import "./styles.css";

export default class Button extends React.Component {
  constructor() {
    super();
    this.state = { enabled: false };
  }

  render() {
    const { enabled } = this.state;
    const btnText = enabled ? "enabled" : "disabled";

    return (
      <div
        className={`btn enabled-${enabled}`}
        onClick={() => this.setState({ enabled: !enabled })}
      >
        {btnText}
      </div>
    );
  }
}
```

@[codesandbox](https://codesandbox.io/embed/throbbing-currying-2lp9w)

この例では、コンポーネントがとても小さかったため、リファクタリングはそれほど大変ではありませんでした。しかし、実際のコンポーネントのコードの行数はもっと多いでしょうし、コンポーネントのリファクタリングもより大変になるはずです。

コンポーネントのリファクタリング中に誤って動作を変更しないようにすることに加えて、**ES2015 のクラスの仕組みを理解する**必要があります。なぜカスタムメソッドを `bind` する必要があるのでしょうか？`constructor` は何をするのでしょうか？`this` キーワードはどこから来たのでしょうか？データの流れを誤って変更することなくコンポーネントを適切にリファクタリングすことは、難しいかもしれません。

### 再構築

<!-- TODO: パスがあっているか確認 -->
複数のコンポーネント間でコードを共有する一般的な方法は、[高階コンポーネント](/books/learning-patterns/hoc-pattern%252Emd)または[レンダープロップ](/books/learning-patterns/render-props-pattern%252Emd)パターンを使用することです。どちらのパターンも有効で良い方法ですが、あとからこれらのパターンを追加する場合はアプリケーションを再構築する必要があります。

コンポーネントが大きくなるほど厄介となるアプリケーションの再構築に加え、深くネストされたコンポーネント間でコードを共有するために多くのラッパーコンポーネントをもつことは、_**ラッパー地獄 (wrapper hell)**_ と呼ばれる状態につながる可能性があります。開発者ツールを開き、次のような構造を見掛けることは珍しくはありません:

```jsx
<WrapperOne>
  <WrapperTwo>
    <WrapperThree>
      <WrapperFour>
        <WrapperFive>
          <Component>
            <h1>Finally in the component!</h1>
          </Component>
        </WrapperFive>
      </WrapperFour>
    </WrapperThree>
  </WrapperTwo>
</WrapperOne>
```

*ラッパー地獄*になると、アプリケーションの中でデータがどのように流れているのかが分かりにくくなり、予想外の動作が発生する原因を突き止めることが難しくなります。

### 複雑性

クラスコンポーネントにロジックを追加していくと、コンポーネントのサイズはどんどん大きくなっていきます。コンポーネント内のロジックは**複雑に絡み合い、構造が失われていく**ため、開発者はクラスコンポーネントのどこで特定のロジックが使用されているかを把握することが困難になります。これにより、デバッグやパフォーマンスの最適化が難しくなってしまいます。

また、ライフサイクルメソッドは、コード内に多くの重複を発生させます。`Counter` コンポーネントと `Width` コンポーネントを使用した例を見てみましょう。

```jsx:App.js
import React from "react";
import "./styles.css";

import { Count } from "./Count";
import { Width } from "./Width";

export default class Counter extends React.Component {
  constructor() {
    super();
    this.state = {
      count: 0,
      width: 0
    };
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  increment = () => {
    this.setState(({ count }) => ({ count: count + 1 }));
  };

  decrement = () => {
    this.setState(({ count }) => ({ count: count - 1 }));
  };

  handleResize = () => {
    this.setState({ width: window.innerWidth });
  };

  render() {
    return (
      <div className="App">
        <Count
          count={this.state.count}
          increment={this.increment}
          decrement={this.decrement}
        />
        <div id="divider" />
        <Width width={this.state.width} />
      </div>
    );
  }
}
```

@[codesandbox](https://codesandbox.io/embed/bold-brown-bzhpw)

App コンポーネントの構造は、次のように可視化できます:

![](/images/learning-patterns/hooks-pattern-1.png)

これは小さなコンポーネントですが、コンポーネント内のロジックはすでにかなり絡まり合っています。ある部分は `Counter` のロジックに特化しており、また他の部分は `Width` のロジックに特化しています。コンポーネントが大きくなるにつれて、コンポーネント内のロジックを構造化すること、コンポーネント内の関連するロジックを見つけることがより困難になっていきます。

絡み合うロジックに加え、ライフサイクルメソッドの中でロジックが重複しています。`componentDidMount` と `componentWillUnmount` の両方で、ウィンドウの `resize` イベントに基づきアプリケーションの動作をカスタマイズしています。

---

## フック

クラスコンポーネントが React の優れた機能であるとは限らないことは明らかです。クラスコンポーネントを使用する際に React 開発者が遭遇する共通の問題を解決するために、React は**フック**を導入しました。フックは、コンポーネントの状態やライフサイクルメソッドを管理するための関数です。フックを使うと、以下のようなことが可能になります。

* 関数コンポーネントにステートを追加する
* `componentDidMount` や `componentWillUnmount` などのライフサイクルメソッドを使用せずに、コンポーネントのライフサイクルを管理する
* アプリ内の複数のコンポーネントで同じステートフルなロジックを再利用する

まず、フックを使って関数コンポーネントにステートを追加する方法について説明します。

### State フック

Reactには、`useState` という、関数コンポーネント内のステートを管理するためのフックがあります。

`useState` フックを使って、クラスコンポーネントをどのように関数コンポーネントへと再構成できるかを見てみましょう。`Input` という、入力フィールドをレンダリングするクラスコンポーネントがあるとします。ユーザーが入力フィールドに何かを入力すると、ステート内の `input` の値が更新されます。

```jsx
class Input extends React.Component {
  constructor() {
    super();
    this.state = { input: "" };

    this.handleInput = this.handleInput.bind(this);
  }

  handleInput(e) {
    this.setState({ input: e.target.value });
  }

  render() {
    <input onChange={handleInput} value={this.state.input} />;
  }
}
```

`useState` フックを使うには、React が提供する `useState` メソッドにアクセスする必要があります。`useState` メソッドの引数はステートの初期値となるため、この例の場合は空文字列が入ります。

`useState` メソッドから 2 つの値を取得することができます:

1. ステートの現在値
2. ステートを更新するためのメソッド

```js
const [value, setValue] = React.useState(initialValue);
```

最初の値は、クラスコンポーネントの `this.state.[value]` に対応します。2 つ目の値は、クラスコンポーネントの `this.setState` メソッドに対応します。

今はインプットの値を扱っているので、ステートの現在の値を `input`、ステートを更新するためのメソッドを `setInput` と呼ぶことにしましょう。初期値は空文字列としておきます。

```js
const [input, setInput] = React.useState("");
```

これで、`Input` クラスのコンポーネントをステートフルな関数コンポーネントへとリファクタリングすることができます。

```jsx
function Input() {
  const [input, setInput] = React.useState("");

  return <input onChange={(e) => setInput(e.target.value)} value={input} />;
}
```

クラスコンポーネントの例と同様、入力フィールドの値は `input` ステートの現在値と等しくなります。ユーザーが入力フィールドに文字を入力すると、`setInput` メソッドによって `input` の値が新しい値へと更新されます。

```jsx:Input.js
import React, { useState } from "react";

export default function Input() {
  const [input, setInput] = useState("");

  return (
    <input
      onChange={e => setInput(e.target.value)}
      value={input}
      placeholder="Type something..."
    />
  );
}
```

@[codesandbox](https://codesandbox.io/embed/nervous-hoover-oicu6)

### Effect フック
