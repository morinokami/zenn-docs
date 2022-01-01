---
title: "プロバイダパターン"
---

---

> 複数の子コンポーネントからデータを利用できるようにする

---

![](/images/learning-patterns/provider-pattern-1280w.jpg)

アプリケーション内の (すべてではないにせよ) 多くのコンポーネントからデータを利用できるようにしたい場合があります。`props` を使用してコンポーネントにデータを渡すことはできますが、アプリケーション内のほぼすべてのコンポーネントがその props の値にアクセスする必要がある場合には、これは困難となります。

コンポーネントツリーのずっと下の方に props を渡していく、*prop のバケツリレー* (prop drilling) と呼ばれる事態に陥ることがよくあります。その props に依存するコードのリファクタリングはほとんど不可能となり、あるデータがどこから来たのかを把握することも難しくなります。

たとえば、あるデータを含む `App` コンポーネントがあるとします。そしてコンポーネントツリーのずっと下の方に、`ListItem`、`Header`、`Text` コンポーネントがあり、これらはすべてこのデータを必要とします。これらのコンポーネントにデータを届けるには、何層ものコンポーネントを経由してデータを受け渡していかなければなりません。

[動画による説明](https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056518/patterns.dev/jspat-48_jxmuyy.mp4)

これをコードにより表現すると、以下のようになります:

```jsx
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

このデータを使う必要のないコンポーネントのレイヤーをすべてスキップできれば最善です。prop のバケツリレーなしに、`data` の値にアクセスする必要のあるコンポーネントを、直接それにアクセスできるようにする仕組みが必要です。

ここで**プロバイダパターン**が役に立ちます。プロバイダパターンにより、複数のコンポーネントがデータを利用できるようになります。props を通じて各レイヤーにデータを渡していくのではなく、すべてのコンポーネントを `Provider` でラップするのです。プロバイダは、`Context` オブジェクトによって提供される高階コンポーネントです。コンテクストオブジェクトは、React が提供する `createContext` メソッドにより作成することができます。

プロバイダは、受け渡したいデータを格納する `value` prop を受け取ります。このプロバイダにラップされている*すべての*コンポーネントは、`value` prop の値にアクセスすることができます。

```jsx
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

手動で各コンポーネントに `data` prop を渡していく必要はもうありません！では、`ListItem`、`Header`、`Text` コンポーネントは、どのようにして `data` の値にアクセスできるのでしょうか？

各コンポーネントは、`useContext` フックを使って `data` にアクセスすることができます。このフックは、`data` を参照するコンテクスト (この場合は `DataContext`) を受け取ります。`useContext` フックにより、コンテクストオブジェクトを通じてデータの読み書きができるようになるのです。

```jsx
const DataContext = React.createContext();

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

const SideBar = () => <List />
const List = () => <ListItem />
const Content = () => <div><Header /><Block /></div>
const Block = () => <Text />

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

`data` の値を使用しないコンポーネントは、`data` について気にする必要がまったくなくなりました。props の値を使用しないコンポーネントを何階層も経由して props を受け渡していく必要がなくなったため、リファクタリングがとても楽になります。

[動画による説明](https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056519/patterns.dev/jspat-49_ksvtl8.mp4)

---

プロバイダパターンは、グローバルなデータの共有に非常に有効です。プロバイダパターンの一般的なユースケースとしては、UI テーマに関するステートを多くのコンポーネントで共有することが挙げられます。

たとえば、リストを表示するシンプルなアプリケーションがあるとします。

```jsx:App.js
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

```jsx:List.js
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

スイッチを切り替えることで、ユーザーがライトモードとダークモードを切り替えることができるようにしたいと思います。ユーザーがダークモードからライトモードに切り替えるとき、またはその逆のとき、背景色とテキストの色が変わるはずです。現在のテーマの値を各コンポーネントに渡していく代わりに、コンポーネントを `ThemeContext` でラップし、現在のテーマカラーをそのプロバイダに渡すことができます。

```jsx
export const ThemeContext = React.createContext();

const themes = {
  light: {
    background: "#fff",
    color: "#000"
  },
  dark: {
    background: "#171717",
    color: "#fff"
  }
};

export default function App() {
  const [theme, setTheme] = useState("dark");

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  const providerValue = {
    theme: themes[theme],
    toggleTheme
  };

  return (
    <div className={`App theme-${theme}`}>
      <ThemeContext.Provider value={providerValue}>
        <Toggle />
        <List />
      </ThemeContext.Provider>
    </div>
  );
}
```

`Toggle` コンポーネントと `List` コンポーネントはどちらも `ThemeContext` プロバイダの中にラップされているため、プロバイダに `value` として渡される `theme` と `toggleTheme` の値にアクセスすることができます。

`Toggle` コンポーネント内では、`toggleTheme` 関数を使用してテーマを適宜更新することができます。

```jsx
import React, { useContext } from "react";
import { ThemeContext } from "./App";

export default function Toggle() {
  const theme = useContext(ThemeContext);

  return (
    <label className="switch">
      <input type="checkbox" onClick={theme.toggleTheme} />
      <span className="slider round" />
    </label>
  );
}
```

`List` コンポーネント自体は、現在のテーマの値を気にしません。しかし、`ListItem` コンポーネントは異なります！`ListItem` の中で、`theme` コンテクストを直接使用することができます。

```jsx
import React, { useContext } from "react";
import { ThemeContext } from "./App";

export default function ListItem() {
  const theme = useContext(ThemeContext);

  return <li style={theme.theme}>...</li>;
}
```

完璧です！テーマの現在値に関心がないコンポーネントにデータを渡す必要がなくなりました。

@[codesandbox](https://codesandbox.io/embed/quirky-sun-9djpl)

---

## フック

コンポーネントにコンテクストを提供するフック (hook) を作ることができます。各コンポーネントで `useContext` とコンテクストをインポートする代わりに、必要となるコンテクストを返すフックを使うのです。

```js
function useThemeContext() {
  const theme = useContext(ThemeContext);
  return theme;
}
```

テーマが必ず有効なものとなるように、`useContext(ThemeContext)` が偽値 (falsy value) を返したらエラーを投げるようにしましょう。

```js
function useThemeContext() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return theme;
}
```

コンポーネントを `ThemeContext.Provider` コンポーネントにより直接ラップする代わりに、提供された値 (provided value) とともにこのコンポーネントを返す HOC を作成することができます。こうすれば、コンテクストのロジックをレンダリングコンポーネントから分離することができ、プロバイダの再利用性が向上します。

```jsx
function ThemeProvider({children}) {
  const [theme, setTheme] = useState("dark");

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  const providerValue = {
    theme: themes[theme],
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={providerValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <div className={`App theme-${theme}`}>
      <ThemeProvider>
        <Toggle />
        <List />
      </ThemeProvider>
    </div>
  );
}
```

これで、`ThemeContext` にアクセスする必要のある各コンポーネントは、シンプルに `useThemeContext` フックを使えばよくなりました。

```jsx
export default function ListItem() {
  const theme = useThemeContext();

  return <li style={theme.theme}>...</li>;
}
```

異なるコンテクスト用のフックを作ることで、プロバイダのロジックとデータをレンダリングするコンポーネントを簡単に切り離すことができるのです。

---

## ケーススタディ

ライブラリが組み込みのプロバイダをもつ場合は、そこで提供される値をコンポーネントの中で使用することができます。[styled-components](https://styled-components.com/docs/advanced) が良い例です。

> この例を理解するために、styled-components の経験は必要ありません。

styled-components ライブラリは `ThemeProvider` を提供します。*スタイル付きコンポーネント* (styled component) は、このプロバイダの値にアクセスすることが出来ます。自らコンテクスト API を作る代わりに、提供されたものを使うことが出来るのです！

同じ List の例を用い、styled-component ライブラリからインポートされた `ThemeProvider` でコンポーネントをラップしてみましょう。

```jsx
import { ThemeProvider } from "styled-components";

export default function App() {
  const [theme, setTheme] = useState("dark");

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <div className={`App theme-${theme}`}>
      <ThemeProvider theme={themes[theme]}>
        <>
          <Toggle toggleTheme={toggleTheme} />
          <List />
        </>
      </ThemeProvider>
    </div>
  );
}
```

`ListItem` コンポーネントにインラインで `style` prop を渡す代わりに、`ListItem` コンポーネントを `styled.li` コンポーネントへと変更します。このコンポーネントはスタイル付きコンポーネントであるため、`theme` の値にアクセスすることができます！

```jsx
import styled from "styled-components";

export default function ListItem() {
  return (
    <Li>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat.
    </Li>
  );
}

const Li = styled.li`
  ${({ theme }) => `
     background-color: ${theme.backgroundColor};
     color: ${theme.color};
  `}
`;
```

`ThemeProvider` を使って、すべてのスタイル付きコンポーネントに簡単にスタイルを適用できるようになりました！

```jsx:App.js
import React, { useState } from "react";
import { ThemeProvider } from "styled-components";
import "./styles.css";

import List from "./List";
import Toggle from "./Toggle";

export const themes = {
  light: {
    background: "#fff",
    color: "#000"
  },
  dark: {
    background: "#171717",
    color: "#fff"
  }
};

export default function App() {
  const [theme, setTheme] = useState("dark");

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <div className={`App theme-${theme}`}>
      <ThemeProvider theme={themes[theme]}>
        <>
          <Toggle toggleTheme={toggleTheme} />
          <List />
        </>
      </ThemeProvider>
    </div>
  );
}
```

```jsx:ListItem.js
import React from "react";
import styled from "styled-components";

export default function ListItem() {
  return (
    <Li>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat.
    </Li>
  );
}

const Li = styled.li`
  ${({ theme }) => `
    background-color: ${theme.backgroundColor};
    color: ${theme.color};
  `}
`;
```

@[codesandbox](https://codesandbox.io/embed/divine-platform-gbuls)

---

### Pros

プロバイダパターン (コンテクスト API) により、コンポーネントの各レイヤーに手動でデータを渡していくことなく、多くのコンポーネントにデータを届けることができるようになります。

これにより、コードをリファクタリングするときに、誤ってバグを導入するリスクが減ります。以前は、あとで prop の名前を変更したくなった場合、アプリケーション内のこの値が使われているすべて箇所で prop の名前を変更しなければなりませんでした。

アンチパターンともいえる *prop のバケツリレー*に対処する必要がなくなったのです。以前は、prop の値がどこから来たのかが必ずしも明確ではないことにより、アプリケーションのデータの流れを理解することは簡単ではありませんでした。プロバイダパターンにより、データを必要としないコンポーネントに無駄に prop を渡さなくてもよくなるのです。

ある種のグローバルな状態を保つことが、各コンポーネントがそのグローバルな状態にアクセスできるようになるという意味で、プロバイダパターンによって容易になったといえます。

---

### Cons

特定のケースでは、プロバイダパターンを使いすぎるとパフォーマンスの問題が発生することがあります。コンテクストを*消費する*すべてのコンポーネントは、ステートが変化するたびに再レンダリングするのです。

単純なカウンターの例を見てみましょう。`Button` コンポーネントの `Increment` ボタンをクリックすると値が増加するとします。また、`Reset` コンポーネントにはリセットボタンがあり、カウントを `0` にリセットします。

ここで、`Increment` をクリックすると、再レンダリングされるのはカウントだけでないことがわかります。`Reset` コンポーネントの日付も再レンダリングされるのです！

```jsx:index.js
import React, { useState, createContext, useContext, useEffect } from "react";
import ReactDOM from "react-dom";
import moment from "moment";

import "./styles.css";

const CountContext = createContext(null);

function Reset() {
  const { setCount } = useCountContext();

  return (
    <div className="app-col">
      <button onClick={() => setCount(0)}>Reset count</button>
      <div>Last reset: {moment().format("h:mm:ss a")}</div>
    </div>
  );
}
```

@[codesandbox](https://codesandbox.io/embed/provider-pattern-2-4ke0w)

`Reset` コンポーネントが再レンダリングされるのは、`useCountContext` を消費しているためです。小規模なアプリケーションでは、これはそれほど問題にはなりません。しかし、大規模なアプリケーションでは、頻繁に更新される値を多くのコンポーネントに渡すと、パフォーマンスに悪影響が出る可能性があります。

更新される可能性のある値を含むプロバイダをコンポーネントが不必要に消費しないよう、個別のユースケースごとに複数のプロバイダを作成するとよいでしょう。

---

### 参考文献

* [Context - React](https://reactjs.org/docs/context.html)
* [How To Use React Context Effectively - Kent C. Dodds](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
