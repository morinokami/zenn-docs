---
title: "プロバイダパターン: 複数の子コンポーネントでデータを利用できるようにする"
---

![](/images/learning-patterns/provider-pattern-1280w.jpg)

アプリケーション内の (すべてではないにせよ) 多くのコンポーネントからデータを利用できるようにしたい場合があります。`props` を使用してコンポーネントにデータを渡すことはできますが、アプリケーション内のほぼすべてのコンポーネントが props の値にアクセスする必要がある場合には、これは困難となります。

コンポーネントツリーのずっと下の方に prop を渡していく、*prop のバケツリレー* (prop drilling) と呼ばれる事態に陥ることがよくあります。props に依存するコードのリファクタリングはほとんど不可能となり、あるデータがどこから来たのかを知ることも難しくなります。

例えば、あるデータを含む `App` コンポーネントがあるとします。そしてコンポーネントツリーのずっと下の方に、`ListItem`、`Header`、`Text` コンポーネントがあり、これらはすべてこのデータを必要とします。これらのコンポーネントにデータを届けるには、何層ものコンポーネントを経由して受け渡していかなければなりません。

<video width="100%" src="https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056518/patterns.dev/jspat-48_jxmuyy.mp4" autoplay="" controls=""><source src="https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056518/patterns.dev/jspat-48_jxmuyy.mp4"></video>

我々のコードベースは、以下のようになります:

```js
function App() {
  const data = { ... }

  return (
    <div>
      <SideBar data={data} />
      <Content data={data} />
    </div>
  )
}

const SideBar = ({ data }) => <List data={data} />
const List = ({ data }) => <ListItem data={data} />
const ListItem = ({ data }) => <span>{data.listItem}</span>

const Content = ({ data }) => (
  <div>
    <Header data={data} />
    <Block data={data} />
  </div>
)
const Header = ({ data }) => <div>{data.title}</div>
const Block = ({ data }) => <Text data={data} />
const Text = ({ data }) => <h1>{data.text}</h1>
```

このように props を渡していると、かなり面倒なことになります。もし将来 `data` prop の名前を変更したくなった場合、すべてのコンポーネントで名前を変更しなければなりません。アプリケーションが大きくなればなるほど、prop のバケツリレーはやっかいなものとなっていきます。

このデータを使う必要のないコンポーネントのレイヤーをすべてスキップできれば最善です。prop のバケツリレーをせず、`data` の値にアクセスする必要のあるコンポーネントが、直接そこにアクセスできるような仕組みが必要です。

ここで**プロバイダパターン**が役に立ちます。プロバイダパターンにより、複数のコンポーネントがデータを利用できるようになります。props を通じて各レイヤーにデータを渡していくのではなく、すべてのコンポーネントを `Provider` でラップするのです。Provider は、`Context` オブジェクトによって提供される高階 (higher order) コンポーネントです。Context オブジェクトは、React が提供する `createContext` メソッドを使って作成することができます。

Provider は、受け渡したいデータが格納されている `value` prop を受け取ります。この Provider にラップされている*すべての*コンポーネントは、`value` prop の値にアクセスすることができます。

```js
const DataContext = React.createContext()

function App() {
  const data = { ... }

  return (
    <div>
      <DataContext.Provider value={data}>
        <SideBar />
        <Content />
      </DataContext.Provider>
    </div>
  )
}
```

手動で各コンポーネントに `data` prop を渡す必要はもうありません！では、`ListItem`、`Header`、`Text` コンポーネントは、どのようにして `data` の値にアクセスできるのでしょうか？

各コンポーネントは、`useContext` フックを使って `data` にアクセスすることができます。このフックは、`data` を参照する Context (この場合は `DataContext`) を受け取ります。`useContext` フックにより、Context オブジェクトを通じてデータの読み書きができるようになるのです。

```js
const DataContext = React.createContext();

function App() {
  const data = { ... }

  return (
    <div>
      <SideBar />
      <Content />
    </div>
  )
}

const SideBar = () => <List />
const List = () => <ListItem />
const Content = () => <div><Header /><Block /></div>


function ListItem() {
  const { data } = React.useContext(DataContext);
  return <span>{data.listItem}</span>;
}

function Text() {
  const { data } = React.useContext(DataContext);
  return <h1>{data.text}</h1>;
}

function Header() {
  const { data } = React.useContext(DataContext);
  return <div>{data.title}</div>;
}
```

`data` の値を使用しないコンポーネントは、`data` について気にする必要がまったくなくなります。props の値を使用しないコンポーネントを何階層も経由して props を受け渡していく必要がなくなるため、リファクタリングがとても楽になります。

<video width="100%" src="https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056519/patterns.dev/jspat-49_ksvtl8.mp4" autoplay="" controls=""><source src="https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056519/patterns.dev/jspat-49_ksvtl8.mp4"></video>

---

プロバイダパターンは、グローバルなデータを共有するのに非常に有効です。プロバイダパターンの一般的な使用例としては、UI テーマに関する状態を多くのコンポーネントで共有することが挙げられます。

例えば、リストを表示するシンプルなアプリケーションがあるとします。

```js:index.js
import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  rootElement
);
```

```js:App.js
import React from "react";
import "./styles.css";

import List from "./List";
import Toggle from "./Toggle";

export default function App() {
  return (
    <div className="App">
      <Toggle />
      <List />
    </div>
  );
}
```

```js:List.js
import React from "react";
import ListItem from "./ListItem";

export default function Boxes() {
  return (
    <ul className="list">
      {new Array(10).fill(0).map((x, i) => (
        <ListItem key={i} />
      ))}
    </ul>
  );
}
```

@[codesandbox](https://codesandbox.io/embed/busy-oskar-ifz3w)

---

### 参考文献

* [Context - React](https://reactjs.org/docs/context.html)
* [How To Use React Context Effectively - Kent C. Dodds](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
