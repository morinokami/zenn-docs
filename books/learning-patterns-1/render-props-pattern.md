---
title: "レンダープロップパターン"
---

---

> 

---

![](/images/learning-patterns/render-props-pattern-1280w.jpg)

<!-- TODO: パスがあっているか確認 -->
[高階コンポーネント](/books/learning-patterns/hoc-pattern%252Emd)のセクションでは、複数のコンポーネントが同じデータにアクセスする場合や、同じロジックを含む場合に、コンポーネントのロジックを再利用できると非常に便利であることを確認しました。

コンポーネントを再利用しやすくするもう一つの方法が、レンダープロップ (render prop) パターンです。レンダープロップとはコンポーネントの prop であり、その値は JSX の要素を返す関数です。コンポーネント自身は、レンダープロップ以外のものをレンダリングしません。コンポーネントは、独自のレンダリングロジックを実装する代わりに、単にレンダープロップを呼び出すだけとなります。

`Title` コンポーネントがあると想像してください。Title コンポーネントは、渡された値をレンダリングする以外のことをしてはいけません。ここでレンダープロップを使うことができます！`Title` コンポーネントにレンダリングさせたい値を `render` prop に渡してみましょう。

```jsx
<Title render={() => <h1>I am a render prop!</h1>} />
```

`Title` コンポーネントの中で呼び出した `render` prop を返すことで、このデータをレンダリングすることができます！

```js
const Title = props => props.render();
```

`Title` 要素には、React 要素を返す関数である `render` という `prop` を渡す必要があります。

```js:index.js
import React from "react";
import { render } from "react-dom";

import "./styles.css";

const Title = (props) => props.render();

render(
  <div className="App">
    <Title
      render={() => (
        <h1>
          <span role="img" aria-label="emoji">
            ✨
          </span>
          I am a render prop!{" "}
          <span role="img" aria-label="emoji">
            ✨
          </span>
        </h1>
      )}
    />
  </div>,
  document.getElementById("root")
);
```

@[codesandbox](https://codesandbox.io/embed/renderprops2-y6wst)

完璧です！上手く動作しています。レンダープロップの良い点は、prop を受け取るコンポーネントを再利用しやすいことです。何度でも使用することができ、`render`プロップに毎回異なる値を渡すことができます。

```js:index.js
import React from "react";
import { render } from "react-dom";
import "./styles.css";

const Title = (props) => props.render();

render(
  <div className="App">
    <Title render={() => <h1>✨ First render prop! ✨</h1>} />
    <Title render={() => <h2>🔥 Second render prop! 🔥</h2>} />
    <Title render={() => <h3>🚀 Third render prop! 🚀</h3>} />
  </div>,
  document.getElementById("root")
);
```

@[codesandbox](https://codesandbox.io/embed/young-silence-hou0c)

レンダープロップという名前をもっていますが、レンダープロップを必ずしも `render` とする必要はありません。JSX をレンダリングする prop はすべてレンダープロップとみなされます。上の例で使ったレンダープロップの名前を変えて、代わりに具体的な名前をつけてみましょう。

```js:index.js
import React from "react";
import { render } from "react-dom";
import "./styles.css";

const Title = (props) => (
  <>
    {props.renderFirstComponent()}
    {props.renderSecondComponent()}
    {props.renderThirdComponent()}
  </>
);

render(
  <div className="App">
    <Title
      renderFirstComponent={() => <h1>✨ First render prop! ✨</h1>}
      renderSecondComponent={() => <h2>🔥 Second render prop! 🔥</h2>}
      renderThirdComponent={() => <h3>🚀 Third render prop! 🚀</h3>}
    />
  </div>,
  document.getElementById("root")
);
```

@[codesandbox](https://codesandbox.io/embed/renderprops2-u0sfh)

いい感じです。レンダープロップに毎回異なるデータを渡せることから、コンポーネントを再利用可能にするためにレンダープロップを使用できることがわかりました。しかし、これの何が嬉しいのでしょうか？

レンダープロップを受け取るコンポーネントは、通常、単に `render` prop を呼び出すだけでなく、もっと多くのことをおこないます。具体的には、レンダープロップを受け取るコンポーネントから、レンダープロップとして渡す要素にデータを渡したいことが多いです。

```js
function Component(props) {
  const data = { ... }

  return props.render(data)
}
```

レンダープロップは、引数として渡された値を受け取ることができます。

```jsx
<Component render={data => <ChildComponent data={data} />} />
```

---

例を見てみましょう。ユーザーが摂氏で温度を入力できる簡単なアプリケーションを考えます。このアプリケーションは、この温度の値を華氏とケルビンで表示します。

```js:App.js
import React, { useState } from "react";
import "./styles.css";

function Input() {
  const [value, setValue] = useState("");

  return (
    <input
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      placeholder="Temp in °C"
    />
  );
}

export default function App() {
  return (
    <div className="App">
      <h1>☃️ Temperature Converter 🌞</h1>
      <Input />
      <Kelvin />
      <Fahrenheit />
    </div>
  );
}

function Kelvin({ value = 0 }) {
  return <div className="temp">{value + 273.15}K</div>;
}

function Fahrenheit({ value = 0 }) {
  return <div className="temp">{(value * 9) / 5 + 32}°F</div>;
}
```

@[codesandbox](https://codesandbox.io/embed/suspicious-hill-wk0uy)

うーん、どうも問題があるようです。状態をもつ `Input` コンポーネントにユーザーの入力値が含まれています。つまり、`Fahrenheit` と `Kelvin` コンポーネントは、ユーザーの入力値にアクセスできないのです！

---

<!-- TODO: この表現でいいのか？ -->
### 状態を持ち上げる

上の例で、ユーザーの入力値を `Fahrenheit` と `Kelvin` 両方のコンポーネントから利用できるようにするには、状態を上位に移動する必要があります。

ここでは、状態を保持する `Input` コンポーネントがあります。しかし、兄弟コンポーネントである `Fahrenheit` と `Kelvin` もこのデータにアクセスする必要があります。そこで、`Input` コンポーネントが状態をもつ代わりに、`Input`、`Fahrenheit`、`Kelvin` と接続する最初の共通の祖先コンポーネント、この場合は `App` コンポーネントまで**状態を持ち上げる**のです。

```js
function Input({ value, handleChange }) {
  return <input value={value} onChange={e => handleChange(e.target.value)} />;
}

export default function App() {
  const [value, setValue] = useState("");

  return (
    <div className="App">
      <h1>☃️ Temperature Converter 🌞</h1>
      <Input value={value} handleChange={setValue} />
      <Kelvin value={value} />
      <Fahrenheit value={value} />
    </div>
  );
}
```

これは有効な解決策ではありますが、多くの子コンポーネントを扱う大規模なアプリケーションでは、**状態を持ち上げる**ことが難しい場合もあります。状態を変更するたびに、データを受け取らないものも含めて、すべての子コンポーネントの再レンダリングが発生するため、アプリケーションのパフォーマンスに悪影響が出る可能性があります。

---

### レンダープロップ

ここでレンダープロップの出番です！`Input` コンポーネントを、レンダープロップを受け取るように変更しましょう。

```js
function Input(props) {
  const [value, setValue] = useState("");

  return (
    <>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Temp in °C"
      />
      {props.render(value)}
    </>
  );
}

export default function App() {
  return (
    <div className="App">
      <h1>☃️ Temperature Converter 🌞</h1>
      <Input
        render={value => (
          <>
            <Kelvin value={value} />
            <Fahrenheit value={value} />
          </>
        )}
      />
    </div>
  );
}
```

完璧です！`Kelvin` コンポーネントと `Fahrenheit` コンポーネントが、ユーザーの入力値にアクセスできるようになりました。

---

## Children as a function

---

## Hooks

---

### Pros

---

### Cons

---

### 参考文献

* [Render Props - React](https://reactjs.org/docs/render-props.html)
* [React, Inline Functions, and Performance - Ryan Florence](https://cdb.reacttraining.com/react-inline-functions-and-performance-bdff784f5578)
* [Use a Render Prop! - Michael Jackson](https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce)
