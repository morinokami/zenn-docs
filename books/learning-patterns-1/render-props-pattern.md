---
title: "レンダープロップパターン"
---

---

> props を 通じて JSX 要素をコンポーネントに渡す

---

![](/images/learning-patterns/render-props-pattern-1280w.jpg)

:::message
原文は[こちら](https://www.patterns.dev/posts/render-props-pattern/)
:::

## レンダープロップパターン

[高階コンポーネント](/morinokami/books/learning-patterns-1/viewer/hoc-pattern)のセクションでは、複数のコンポーネントが同じデータにアクセスする場合や、同じロジックを含む場合に、コンポーネントのロジックを再利用できると非常に便利であることを確認しました。

コンポーネントを再利用しやすくするもう一つの方法が、レンダープロップ (render prop) パターンです。レンダープロップは、JSX の要素を返す関数を値とするコンポーネントの prop です。コンポーネント自身は、レンダープロップ以外のものをレンダリングしません。コンポーネントは、独自のレンダリングロジックを実装する代わりに、単にレンダープロップを呼び出すだけとなります。

`Title` コンポーネントがあると想像してください。ここでは、`Title` コンポーネントは、渡された値をレンダリングする以外のことをしてはいけません。ここでレンダープロップを使うことができます！`Title` コンポーネントにレンダリングさせたい値を `render` prop に渡してみましょう。

```jsx
<Title render={() => <h1>I am a render prop!</h1>} />
```

`Title` コンポーネントの中から、呼び出した `render` prop を返すことで、このデータをレンダリングすることができます！

```js
const Title = props => props.render();
```

`Title` 要素には、React の要素を返す関数である `render` という prop を渡す必要があります。

```jsx:index.js
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

完璧です！上手く動作しています。レンダープロップの良い点は、prop を受け取るコンポーネントを再利用しやすいことです。`render`プロップに異なる値を渡して、何度でも使用することができます。

```jsx:index.js
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

レンダープロップと呼ばれてはいますが、レンダープロップを必ずしも `render` とする必要はありません。JSX をレンダリングする prop はすべてレンダープロップとみなされます。上の例で使ったレンダープロップをリネームし、具体的な名前をつけてみましょう。

```jsx:index.js
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

```jsx:App.js
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

うーん、どうも問題があるようです。ステートをもつ `Input` コンポーネントにユーザーの入力値が含まれています。つまり、`Fahrenheit` と `Kelvin` コンポーネントは、ユーザーの入力値にアクセスできないのです！

---

### ステートを持ち上げる

上の例で、ユーザーの入力値を `Fahrenheit` と `Kelvin` 両方のコンポーネントから利用できるようにするためは、ステートを上位に移動する必要があります。

`Input` コンポーネントがステートを保持していますが、兄弟コンポーネントである `Fahrenheit` と `Kelvin` もこのデータにアクセスする必要があるのです。そこで、`Input` コンポーネントがステートをもつ代わりに、`Input`、`Fahrenheit`、`Kelvin` と接続する最初の共通の祖先コンポーネント、この場合は `App` コンポーネントまで**ステートを持ち上げる**のです。

```jsx
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

これは有効な解決策ではありますが、多くの子コンポーネントを扱う大規模なアプリケーションでは、**ステートを持ち上げる**ことが難しい場合があります。ステートを変更するたびに、データを受け取らないものも含めて、すべての子コンポーネントが再レンダリングされる可能性があるため、アプリケーションのパフォーマンスに悪影響が出るかもしれません。

---

## レンダープロップ

ここでレンダープロップの出番です！`Input` コンポーネントが、レンダープロップを受け取るように変更しましょう。

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

## 関数を子として渡す

React のコンポーネントには、通常の JSX コンポーネント以外に、関数を子として渡すことができます。この関数は `children` prop を通じて利用することができ、技術的には `render` プロップと同等です。

`Input` コンポーネントを変更してみましょう。明示的に `render` prop を渡す代わりに、`Input` コンポーネントの子として関数を渡すことにします。

```jsx
export default function App() {
  return (
    <div className="App">
      <h1>☃️ Temperature Converter 🌞</h1>
      <Input>
        {value => (
          <>
            <Kelvin value={value} />
            <Fahrenheit value={value} />
          </>
        )}
      </Input>
    </div>
  );
}
```

この関数には、`Input` コンポーネントから利用可能な `props.children` prop を通じてアクセスすることができます。ユーザーが入力した値によって `props.render` を呼び出す代わりに、`props.children` を呼び出すことにします。

```jsx
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
      {props.children(value)}
    </>
  );
}
```

このようにすると、`render` prop の名前を気にする必要なく、`Kelvin` と `Fahrenheit` コンポーネントが値にアクセスできるようになります。

---

## フック

レンダープロップをフックに置き換えられる場合もあります。この良い例が [Apollo Client](https://www.apollographql.com/docs/react) です。

> この例を理解するために、Apollo Client の経験は必要ありません。

Apollo Client を使う方法の一つに、`Mutation` と `Query` コンポーネントによるものがあります。高階コンポーネントのセクションで取り上げたものと同じ `Input` の例を見てみましょう。ここでは、`graphql()` 高階コンポーネントの代わりに、レンダープロップを受け取る `Mutation` コンポーネントを使用します。

```jsx:InputRenderProp.js
import React from "react";
import "./styles.css";

import { Mutation } from "react-apollo";
import { ADD_MESSAGE } from "./resolvers";

export default class Input extends React.Component {
  constructor() {
    super();
    this.state = { message: "" };
  }

  handleChange = (e) => {
    this.setState({ message: e.target.value });
  };

  render() {
    return (
      <Mutation
        mutation={ADD_MESSAGE}
        variables={{ message: this.state.message }}
        onCompleted={() =>
          console.log(`Added with render prop: ${this.state.message} `)
        }
      >
        {(addMessage) => (
          <div className="input-row">
            <input
              onChange={this.handleChange}
              type="text"
              placeholder="Type something..."
            />
            <button onClick={addMessage}>Add</button>
          </div>
        )}
      </Mutation>
    );
  }
}
```

@[codesandbox](https://codesandbox.io/embed/confident-lederberg-jfdxg)

`Mutation` コンポーネントからデータを必要とする要素にデータを渡すために、子要素として関数を渡します。この関数は、引数を通じてデータの値を受け取ります。

```jsx
<Mutation mutation={...} variables={...}>
  {addMessage => <div className="input-row">...</div>}
</Mutation>
```

レンダープロップパターンを使用することは現在も可能であり、HOC パターンと比較して好ましいことも多いですが、欠点もあります。

欠点のひとつは、コンポーネントのネストが深くなることです。コンポーネントが複数のミューテーションやクエリにアクセスする必要がある場合、複数の `Mutation` や `Query` コンポーネントをネストすることができます。

```jsx
<Mutation mutation={FIRST_MUTATION}>
  {firstMutation => (
    <Mutation mutation={SECOND_MUTATION}>
      {secondMutation => (
        <Mutation mutation={THIRD_MUTATION}>
          {thirdMutation => (
            <Element
              firstMutation={firstMutation}
              secondMutation={secondMutation}
              thirdMutation={thirdMutation}
            />
          )}
        </Mutation>
      )}
    </Mutation>
  )}
</Mutation>
```

フックのリリース後、Apollo は Apollo Client ライブラリにフックのサポートを追加しました。その結果、`Mutation` や `Query` レンダープロップを使用する代わりに、ライブラリが提供するフックを介して直接データにアクセスできるようになりました。

`Mutation` レンダープロップを使用した例とまったく同じデータを使用する例を見てみましょう。今回は、Apollo Client が提供する `useMutation` フックを使って、コンポーネントにデータを提供します。

```jsx:InputHooks.js
import React, { useState } from "react";
import "./styles.css";

import { useMutation } from "@apollo/react-hooks";
import { ADD_MESSAGE } from "./resolvers";

export default function Input() {
  const [message, setMessage] = useState("");
  const [addMessage] = useMutation(ADD_MESSAGE, {
    variables: { message }
  });

  return (
    <div className="input-row">
      <input
        onChange={(e) => setMessage(e.target.value)}
        type="text"
        placeholder="Type something..."
      />
      <button onClick={addMessage}>Add</button>
    </div>
  );
}
```

@[codesandbox](https://codesandbox.io/embed/apollo-hoc-hooks-n3td8)

`useMutation` フックを使うことで、コンポーネントにデータを提供するために必要なコードの量を減らすことができました。

---

## Pros

レンダープロップパターンを使えば、複数のコンポーネント間でロジックやデータを共有することが簡単にできます。render や `children` prop を使用することで、コンポーネントの再利用性が高まります。HOC パターンも基本的に**再利用性**と**データの共有**という共通の問題を解決しますが、レンダープロップパターンは HOC パターンにより発生する可能性のあるいくつかの問題を解決してくれます。

HOC パターンで発生する可能性のある**名前の衝突**の問題は、props を自動的にマージしなくなることにより、レンダープロップパターンにおいては解消されます。親コンポーネントによって提供される値は、子コンポーネントに明示的に props として渡されます。

明示的に props が渡されることで、HOC の**暗黙の props** の問題が解決されます。要素に渡すべき props は、レンダープロップの引数のリストですべて確認することができます。このようにして、特定の props がどこから来たのかを正確に把握することができるのです。

レンダープロップにより、レンダリングを担うコンポーネントからアプリケーションのロジックを分離することができます。レンダープロップを受け取ったステートフルコンポーネントが、データをレンダリングするだけのステートレスコンポーネントにデータを渡すようにできる、ということです。

---

## Cons

レンダープロップで解決しようとした問題の大部分は、フックによって置き換えられました。再利用性とデータ共有の仕組みをコンポーネントに追加する方法を変えたことで、多くの場合、フックはレンダープロップパターンを置き換えることができるのです。

`render` prop にはライフサイクルメソッドを追加することができないため、受け取ったデータを変更する必要のないコンポーネントに対してのみ使用することができます。

---

## 参考文献

* [Render Props - React](https://reactjs.org/docs/render-props.html)
* [React, Inline Functions, and Performance - Ryan Florence](https://cdb.reacttraining.com/react-inline-functions-and-performance-bdff784f5578)
* [Use a Render Prop! - Michael Jackson](https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce)
