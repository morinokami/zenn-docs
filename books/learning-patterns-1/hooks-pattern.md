---
title: "フックパターン"
---

---

> 関数により、アプリケーション内の複数のコンポーネントでステートフルなロジックを再利用する

---

![](/images/learning-patterns/hooks-pattern-1280w.jpg)

React 16.8 では、[フック](https://reactjs.org/docs/hooks-intro.html) (hook) と呼ばれる新機能が導入されました。フックにより、ES2015 のクラスコンポーネントを使わずに、React のステートやライフサイクルメソッドを利用することができるようになります。

フックは必ずしもデザインパターンというわけではありませんが、アプリケーションの設計において非常に重要な役割を果たします。従来のデザインパターンの多くは、フックによって置き換えることができます。

---

## クラスコンポーネント

React にフックが導入される前は、コンポーネントにステートやライフサイクルメソッドを追加するためには、クラスコンポーネントを使用する必要がありました。React の典型的なクラスコンポーネントは、次のようになります:

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

フックの導入後もクラスコンポーネントを使用することはできますが、それによりいくつかのデメリットが発生する可能性があります。クラスコンポーネントを使用した際の最も一般的な問題点を見ていきましょう。

### ES2015 のクラスを理解しなければならない

フックの導入前は、クラスコンポーネントがステートやライフサイクルメソッドを扱うことができる唯一のコンポーネントでした。その結果、機能追加のために、関数コンポーネントをクラスコンポーネントへとリファクタリングしなければならないことがよくありました。

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

コンポーネントのリファクタリング中に誤って動作を変更しないようにすることに加えて、**ES2015 のクラスの仕組みを理解する**必要もあります。なぜカスタムメソッドを `bind` する必要があるのでしょうか？`constructor` は何をするのでしょうか？`this` キーワードはどこから来たのでしょうか？データの流れを誤って変更することなくコンポーネントを適切にリファクタリングすることは、簡単ではありません。

### アプリケーションを再構成する必要性

複数のコンポーネント間でコードを共有する一般的な方法は、[高階コンポーネント](/morinokami/books/learning-patterns-1/viewer/hoc-pattern)または[レンダープロップ](/morinokami/books/learning-patterns-1/viewer/render-props-pattern)パターンを使用することです。どちらのパターンも有効で良い方法ですが、あとからこれらのパターンを追加する場合、アプリケーションを再構成する必要があります。

コンポーネントが大きいほど厄介となるアプリケーションの再構成に加え、深くネストされたコンポーネント間でコードを共有するために多くのラッパーコンポーネントをもつことで、_**ラッパー地獄 (wrapper hell)**_ と呼ばれる状態につながる可能性もあります。開発者ツールを開き、次のような構造を見掛けることは珍しくはありません:

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

*ラッパー地獄*になると、アプリケーションの中でデータがどのように流れているのかが分かりにくくなり、予想外の動作が発生した原因を突き止めることが難しくなります。

### ロジックの複雑化

クラスコンポーネントにロジックを追加していくと、コンポーネントのサイズはどんどん大きくなっていきます。コンポーネント内のロジックは**複雑に絡み合い、構造が失われていく**ため、クラスコンポーネントのどこで特定のロジックが使用されているかを開発者が把握することは困難になります。これにより、デバッグやパフォーマンスの最適化が難しくなってしまいます。

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

絡み合うロジックに加え、ライフサイクルメソッドの中でロジックが**重複しています**。`componentDidMount` と `componentWillUnmount` の両方で、ウィンドウの `resize` イベント用いてアプリケーションの動作をカスタマイズしています。

---

## フック

クラスコンポーネントが React の優れた機能であるとは限らないことは明らかです。クラスコンポーネントを使用する際に React 開発者が遭遇する共通の問題を解決するために、React は**フック**を導入しました。フックは、コンポーネントの状態やライフサイクルメソッドを管理するための関数です。フックを使うと、以下のようなことが可能になります。

* 関数コンポーネントにステートを追加する
* `componentDidMount` や `componentWillUnmount` などのライフサイクルメソッドを使用せずに、コンポーネントのライフサイクルを管理する
* アプリ内の複数のコンポーネントで同じステートフルなロジックを再利用する

まず、フックを使って関数コンポーネントにステートを追加する方法について見ていきましょう。

### ステートフック

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

`useState` メソッドから分割代入により 2 つの値を取得することができます:

1. ステートの**現在値**
2. ステートを**更新するためのメソッド**

```js
const [value, setValue] = React.useState(initialValue);
```

最初の値は、クラスコンポーネントの `this.state.[value]` に対応します。2 つ目の値は、クラスコンポーネントの `this.setState` メソッドに対応します。

今はインプットの値を扱っているので、ステートの現在の値を `input`、ステートを更新するためのメソッドを `setInput` と呼ぶことにしましょう。初期値は空文字列としておきます。

```js
const [input, setInput] = React.useState("");
```

これで、`Input` クラスコンポーネントを、ステートフルな関数コンポーネントへとリファクタリングすることができます。

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

### 副作用フック

ここまで `useState` フックを使って関数コンポーネント内のステートを管理できることを見てきましたが、クラスコンポーネントのもう一つの利点は、コンポーネントにライフサイクルメソッドを追加できることでした。

`useEffect` フックを使えば、コンポーネントのライフサイクルに「接続する (hook into)」ことができます。`useEffect` フックは、`componentDidMount`、`componentDidUpdate`、`componentWillUnmount` ライフサイクルメソッドを統合したものです。

```js
componentDidMount() { ... }
useEffect(() => { ... }, [])

componentWillUnmount() { ... }
useEffect(() => { return () => { ... } })

componentDidUpdate() { ... }
useEffect(() => { ... })
```

ステートフックのセクションで使ったインプットの例を使ってみましょう。ユーザーが入力フィールドに何か入力するたびに、その値をコンソールに出力したいと思います。

そのためには、`input` の値を「リッスン」する `useEffect` フックを使用する必要があります。`useEffect` フックの**依存配列**に `input` を追加することで、それが可能になります。依存配列は、`useEffect` フックが受け取る 2 番目の引数です。

```js
useEffect(() => {
  console.log(`The user typed ${input}`);
}, [input]);
```

試してみましょう！

```jsx:Input.js
import React, { useState, useEffect } from "react";

export default function Input() {
  const [input, setInput] = useState("");

  useEffect(() => {
    console.log(`The user typed ${input}`);
  }, [input]);

  return (
    <input
      onChange={e => setInput(e.target.value)}
      value={input}
      placeholder="Type something..."
    />
  );
}
```

@[codesandbox](https://codesandbox.io/embed/blissful-ramanujan-p237n)

ユーザーが値を入力するたびに、入力された値がコンソールに出力されるようになりました。

---

## カスタムフック

React が提供する組み込みのフック (`useState`、`useEffect`、`useReducer`、`useRef`、`useContext`、`useMemo`、`useImperativeHandle`、`useLayoutEffect`、`useDebugValue`、`useCallback`) に加え、独自のカスタムフックを作成することも簡単にできます。

すべてのフックの名前が `use` で始まっていることに気付いたかもしれません。[フックのルール](https://reactjs.org/docs/hooks-rules.html)に違反していないかどうか React がチェックするために、フックの名前を `use` で始めることは重要です。

たとえば、入力時にユーザーが押した特定のキーを記録しておきたいとします。カスタムフックは、対象となるキーを引数として受け取るようにします。

```js
function useKeyPress(targetKey) {}
```

このフックのユーザーが引数として渡したキーに対して、`keydown` と `keyup` のイベントリスナーを追加しようと思います。ユーザーがそのキーを押したとき、つまり `keydown` イベントが発生したとき、フック内のステートは `true` へと切り替わります。そうでない場合、すなわち、ユーザーがそのボタンを押すのをやめたとき、`keyup` イベントが発生し、ステートが `false` へと切り替わります。

```js
function useKeyPress(targetKey) {
  const [keyPressed, setKeyPressed] = React.useState(false);

  function handleDown({ key }) {
    if (key === targetKey) {
      setKeyPressed(true);
    }
  }

  function handleUp({ key }) {
    if (key === targetKey) {
      setKeyPressed(false);
    }
  }

  React.useEffect(() => {
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);

    return () => {
      window.removeEventListener("keydown", handleDown);
      window.addEventListener("keyup", handleUp);
    };
  }, []);

  return keyPressed;
}
```

完璧です！このカスタムフックは、上で見たインプットアプリケーションで使うことができます。ユーザーが `q`、`l`、`w` キーを押すごとに、コンソールにログを出力してみましょう。

```jsx:Input.js
import React from "react";
import useKeyPress from "./useKeyPress";

export default function Input() {
  const [input, setInput] = React.useState("");
  const pressQ = useKeyPress("q");
  const pressW = useKeyPress("w");
  const pressL = useKeyPress("l");

  React.useEffect(() => {
    console.log(`The user pressed Q!`);
  }, [pressQ]);

  React.useEffect(() => {
    console.log(`The user pressed W!`);
  }, [pressW]);

  React.useEffect(() => {
    console.log(`The user pressed L!`);
  }, [pressL]);

  return (
    <input
      onChange={e => setInput(e.target.value)}
      value={input}
      placeholder="Type something..."
    />
  );
}
```

@[codesandbox](https://codesandbox.io/embed/billowing-pine-xplez)

キー押下のロジックが `Input` コンポーネントの内部に閉じ込められていないため、複数のコンポーネントで `useKeyPress` フックを再利用することができます。同じロジックを何度も繰り返し書く必要はないのです。

フックのもう一つの大きなメリットは、コミュニティがフックを作って共有できることです。ここでは `useKeyPress` フックを自分たちで作成しましたが、実はその必要はまったくありませんでした。このフックはすでに他の人が[作ってくれており](https://github.com/streamich/react-use/blob/master/docs/useKeyPress.md)、それをインストールすればすぐに使うことができたのです。

コミュニティによって作成され、すぐに使えるようになっているフックのリストを掲載したウェブサイトをいくつか紹介します。

* [React Use](https://github.com/streamich/react-use)
* [useHooks](https://usehooks.com/)
* [Collection of React Hooks](https://nikgraf.github.io/react-hooks/)

---

前節で見た `Counter` と `Width` の例を書き換えてみましょう。クラスコンポーネントを使わないよう、フックを使って書き換えていきます。

```jsx:App.js
import React, { useState, useEffect } from "react";
import "./styles.css";

import { Count } from "./Count";
import { Width } from "./Width";

function useCounter() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);

  return { count, increment, decrement };
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.addEventListener("resize", handleResize);
  });

  return width;
}

export default function App() {
  const counter = useCounter();
  const width = useWindowWidth();

  return (
    <div className="App">
      <Count
        count={counter.count}
        increment={counter.increment}
        decrement={counter.decrement}
      />
      <div id="divider" />
      <Width width={width} />
    </div>
  );
}
```

@[codesandbox](https://codesandbox.io/embed/eloquent-bhabha-2w0ll)

`App` 関数内のロジックを分割しました:

* `useCounter`: `count` の現在値、`increment` メソッド、`decrement` メソッドを返すカスタムフック
* `useWindowWidth`: ウィンドウの現在の幅を返すカスタムフック
* `App`: `Counter` と `Width` コンポーネントを返す、ステートフルな関数コンポーネント

クラスコンポーネントの代わりにフックを使用することで、再利用可能な小さなまとまりへとロジックを分割することができました。

今おこなった変更を、以前の `App` クラスコンポーネントと比較して可視化してみましょう。

![](/images/learning-patterns/hooks-pattern-2.png)

フックを使用することで、コンポーネントのロジックをいくつかの小さなまとまりへと**分割する**ことが、より明確になりました。同じステートフルなロジックを*再利用する*ことがより容易になり、コンポーネントをステートフルにしたい場合に関数コンポーネントをクラスコンポーネントへと書き換える必要もなくなりました。ES2015 クラスに関する深い理解はもはや不要となり、そして、再利用可能なステートフルロジックにより、コンポーネントのテスト可能性、柔軟性、可読性も向上します。

## フックに関する追加的説明

### フックを追加する

他のコンポーネントと同様に、コードにフックを追加したい場合に使用する特別な関数があります。ここでは、いくつかの一般的なフック関数について簡単に説明します。

**1. useState**

`useState` フックを使うと、コンポーネントをクラスコンポーネントへと変換する必要なしに、関数コンポーネント内のステートを更新したり操作したりすることができます。このフックの利点は、シンプルで、他のフックほどの複雑さがないことです。

**2. useEffect**

`useEffect` フックは、関数コンポーネントにおいて、主なライフサイクルイベントが発生した際にコードを実行するために使用されます。関数コンポーネントのボディ直下では、ミューテーション、サブスクリプション、タイマー、ロギング、その他の副作用は許可されていません。それらが許可されてしまうと、ややこしいバグや UI の不整合を引き起こす可能性があるからです。`useEffect` フックは、これらの「副作用」をすべて防ぎ、UI をスムーズに動作させます。`componentDidMount`、`componentDidUpdate`、`componentWillUnmount` を 1 つに統合したものといえます。

**3. useContext**

`useContext` フックは、`React.createContext` から返されるコンテクストオブジェクトを受け取り、そのコンテクストの現在値を返します。`useContext` フックは React のコンテクスト APIと連携し、props を様々な階層で受け渡していく必要なしに、アプリケーション全体でデータを共有できるようにします。

`useContext` フックに渡される引数はコンテクストオブジェクトそのものでなければならないこと、`useContext` を呼び出すコンポーネントは、コンテクストの値が変わるたびに常に再レンダリングされることに注意してください。

**4. useReducer**

`useReducer` フックは `setState` の代替であり、複数の値にまたがる複雑なステートロジックをもつ場合や、次のステートが前のステートに依存する場合に、特に使用が推奨されます。`useReducer` は、`reducer` 関数とステートの初期値を受け取り、配列の分割代入によって現在のステートと `dispatch` 関数を返します。また、`useReducer` は、複数階層にまたがる更新を引き起こすコンポーネントのパフォーマンス最適化もおこないます。

**フックの長所と短所**

フックを利用することで、以下のようなメリットがあります:

**コード行数の削減**

フックを使うと、ライフサイクルではなく、関心事や機能によってコードをグループ化することができます。その結果、コードがすっきりと簡潔になるだけでなく、記述量も少なくなります。以下は、React を使用した、検索可能な商品データテーブルを表わすシンプルなステートフルコンポーネントと、`useState` フックを使用した場合とを比較したものです。

**ステートフルコンポーネント**

```jsx
class TweetSearchResults extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: '',
      inThisLocation: false
    };

    this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
    this.handleInThisLocationChange = this.handleInThisLocationChange.bind(this);
  }

  handleFilterTextChange(filterText) {
    this.setState({
      filterText: filterText
    });
  }

  handleInThisLocationChange(inThisLocation) {
    this.setState({
      inThisLocation: inThisLocation
    })
  }

  render() {
    return (
      <div>
        <SearchBar
          filterText={this.state.filterText}
          inThisLocation={this.state.inThisLocation}
          onFilterTextChange={this.handleFilterTextChange}
          onInThisLocationChange={this.handleInThisLocationChange}
        />
        <TweetList
          tweets={this.props.tweets}
          filterText={this.state.filterText}
          inThisLocation={this.state.inThisLocation}
        />
      </div>
    );
  }
}
```

**フックを使用した場合**

```jsx
const TweetSearchResults = ({tweets}) => {
  const [filterText, setFilterText] = useState('');
  const [inThisLocation, setInThisLocation] = useState(false);
  return (
    <div>
      <SearchBar
        filterText={filterText}
        inThisLocation={inThisLocation}
        setFilterText={setFilterText}
        setInThisLocation={setInThisLocation}
      />
      <TweetList
        tweets={tweets}
        filterText={filterText}
        inThisLocation={inThisLocation}
      />
    </div>
  );
}
```

**複雑なコンポーネントをシンプルにする**

JavaScript のクラスは管理が難しく、ホットリロードとの相性も悪く、またミニファイがうまくいかないこともあります。フックはこれらの問題を解決し、関数型プログラミングを簡単におこなえるようにしました。フックの実装により、クラスコンポーネントは不要となりました。

**ステートフルなロジックを再利用する**

JavaScript のクラスは多段階の継承を助長し、全体的な複雑さとエラーの可能性を急速に増大させます。しかし、フックを使えば、クラスを書かずにステートや他の React の機能を使うことができます。React では、コードを何度も書き直す必要なしに、常にステートフルなロジックを再利用することができるのです。そのため、エラーが発生する可能性は下がり、プレーンな関数と組み合わせることも可能となります。


**見た目と関係しないロジックの共有**

フックが実装されるまで、React には見た目と関係しないロジックを抜き出して共有する方法がありませんでした。そのため、ごく一般的な問題を解決するために、HOC パターンやレンダープロップなど、より複雑な仕組みを導入せざるを得ませんでした。しかし、フックの登場により、ステートフルなロジックをシンプルな JavaScript の関数として抽出できるようになり、この問題が解決されました。

もちろん、フックには留意すべき潜在的な欠点もあります。

* フックごとのルールを尊重しなければならないが、リンタープラグインなしでは、どのルールが破られているか気付くことが難しい
* 正しく使うにはかなりの練習を必要とする (例: useEffect)
* 使い方を間違えないよう気を付けなければならない (例: useCallback、useMemo)

### フックとクラスの比較

React にフックが導入されたとき、新たな問題が発生しました。フックを使った関数コンポーネントとクラスコンポーネントの使い分けはどうすればいいのでしょうか？フックの助けを借りれば、関数コンポーネントでもステートや一部のライフサイクルフックを取得することが可能です。また、フックを使うことで、クラスを書かずにローカルなステートやその他の React の機能を利用することもできます。

以下でフックとクラスの相違点をいくつか紹介しますので、判断材料としてください:

| フック | クラス |
| ---- | ---- |
| 多層化した構造を避け、コードを明確にすることができる | 一般に、HOC やレンダープロップを使用する場合、開発者ツールで確認するために、アプリケーションを複数の階層にわたって再構成しなければならない |
| コンポーネント間で統一性をもたせることができる | バインディングや関数が呼び出されるコンテクストを理解する必要があるため、人間と機械の両方を混乱させる |
