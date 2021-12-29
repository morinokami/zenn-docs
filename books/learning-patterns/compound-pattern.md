---
title: "複合パターン: 1 つのタスクを実行するために連携する複数のコンポーネントを作成する"
---

![](/images/learning-patterns/compound-pattern-1280w.jpg)

多くのアプリケーションは、互いに関連し合うコンポーネントをもちます。それらは共有された状態を通じて互いに依存し合い、ロジックを共有します。例えば、`select`、ドロップダウン、メニューなどのコンポーネントがこれにあたります。複合コンポーネントパターンを使うと、あるタスクを実行するために連携するコンポーネントを作成することができます。

---

## Context API

例として、リスの画像のリストを見てみましょう。リスの画像を表示するだけでなく、ユーザーが画像を編集したり削除したりできるボタンを追加したいと思います。`FlyOut`[^1] コンポーネントを実装して、ユーザーがコンポーネントをトグルすると、リストが表示されるようにします。

[^1]: 訳注: ポップアップを意味します。

@[codesandbox](https://codesandbox.io/embed/provider-pattern-2-ck29r)

`FlyOut` コンポーネントの内部には、本質的には以下の 3 つのものがあります:

* トグルボタンとリストを含む、`FlyOut` ラッパー
* `List` をトグルする `Toggle` ボタン
* メニュー項目のリストを格納する `List`

この例では、複合コンポーネントパターンと React の [Context API](https://reactjs.org/docs/context.html) の組み合わせが最適です！

まず、`FlyOut` コンポーネントを作成しましょう。このコンポーネントは**状態**を保持し、受け取ったすべての**子コンポーネント**に対するトグルの値をもつ `FlyOutProvider` を返します。

```jsx
const FlyOutContext = createContext();

function FlyOut(props) {
  const [open, toggle] = useState(false);

  const providerValue = { open, toggle };

  return (
    <FlyOutContext.Provider value={providerValue}>
      {props.children}
    </FlyOutContext.Provider>
  );
}
```

これで、ステートフルな `FlyOut` コンポーネントができあがり、`open` と `toggle` の値を子コンポーネントに渡すことができるようになりました！

`Toggle` コンポーネントを作成しましょう。このコンポーネントは、ユーザーがクリックするとメニューをトグルするコンポーネントをレンダリングします。

```jsx
function Toggle() {
  const { open, toggle } = useContext(FlyOutContext);

  return (
    <div onClick={() => toggle(!open)}>
      <Icon />
    </div>
  );
}
```

`Toggle` が `FlyOutContext` プロバイダに実際にアクセスできるようにするには、`Toggle` を `FlyOut` の子コンポーネントとしてレンダリングする必要があります！ここで単純に子コンポーネントとしてレンダリングすることも*可能です*。しかし、`Toggle` コンポーネントを `FlyOut` コンポーネントのプロパティとするという方法もあります。

```jsx
const FlyOutContext = createContext();

function FlyOut(props) {
  const [open, toggle] = useState(false);

  return (
    <FlyOutContext.Provider value={{ open, toggle }}>
      {props.children}
    </FlyOutContext.Provider>
  );
}

function Toggle() {
  const { open, toggle } = useContext(FlyOutContext);

  return (
    <div onClick={() => toggle(!open)}>
      <Icon />
    </div>
  );
}

FlyOut.Toggle = Toggle;
```

こうすれば、`FlyOut` コンポーネントを他のファイルで使用したい場合は、`FlyOut` をインポートするだけで済みます。

```jsx
import React from "react";
import { FlyOut } from "./FlyOut";

export default function FlyoutMenu() {
  return (
    <FlyOut>
      <FlyOut.Toggle />
    </FlyOut>
  );
}
```

トグルだけでは十分ではありません。リストアイテムをもつリストも必要で、これは `open` の値に基づいて開閉します。

```jsx
function List({ children }) {
  const { open } = React.useContext(FlyOutContext);
  return open && <ul>{children}</ul>;
}

function Item({ children }) {
  return <li>{children}</li>;
}
```

`List` コンポーネントは、`open` の値が `true` か `false` かによって子コンポーネントをレンダリングします。`Toggle` コンポーネントでおこなったように、`List` と `Item` を `FlyOut` コンポーネントのプロパティとしましょう。

```jsx
const FlyOutContext = createContext();

function FlyOut(props) {
  const [open, toggle] = useState(false);

  return (
    <FlyOutContext.Provider value={{ open, toggle }}>
      {props.children}
    </FlyOutContext.Provider>
  );
}

function Toggle() {
  const { open, toggle } = useContext(FlyOutContext);

  return (
    <div onClick={() => toggle(!open)}>
      <Icon />
    </div>
  );
}

function List({ children }) {
  const { open } = useContext(FlyOutContext);
  return open && <ul>{children}</ul>;
}

function Item({ children }) {
  return <li>{children}</li>;
}

FlyOut.Toggle = Toggle;
FlyOut.List = List;
FlyOut.Item = Item;
```

これで、`FlyOut` コンポーネントのプロパティとして使用できるようになりました！ここでは、ユーザーに **Edit** と **Delete** という 2 つのオプションを表示したいと思います。2 つの `FlyOut.Item` コンポーネントをレンダリングする `FlyOut.List` を作成し、1 つは **Edit** 用、もう 1 つは **Delete** 用とします。

```jsx
import React from "react";
import { FlyOut } from "./FlyOut";

export default function FlyoutMenu() {
  return (
    <FlyOut>
      <FlyOut.Toggle />
      <FlyOut.List>
        <FlyOut.Item>Edit</FlyOut.Item>
        <FlyOut.Item>Delete</FlyOut.Item>
      </FlyOut.List>
    </FlyOut>
  );
}
```

完璧です！`FlyOutMenu` 自体に状態を追加することなく、`FlyOut` コンポーネント全体を作成することができました。

複合パターンは、コンポーネントライブラリを作成するときに便利です。[Semantic UI](https://react.semantic-ui.com/modules/dropdown/#types-dropdown) のような UI ライブラリを使うときに、このパターンをよく見かけるはずです。

---

## [React.Children.map](https://reactjs.org/docs/react-api.html#reactchildrenmap)

コンポーネントの子要素をマッピングして複合コンポーネントパターンを実装することもできます。 `open` と `toggle` プロパティを[クローン](https://reactjs.org/docs/react-api.html#cloneelement)し、子コンポーネントに `open` と `toggle` プロパティを追加することができます。

```jsx
export function FlyOut(props) {
  const [open, toggle] = React.useState(false);

  return (
    <div>
      {React.Children.map(props.children, child =>
        React.cloneElement(child, { open, toggle })
      )}
    </div>
  );
}
```

すべての子コンポーネントはクローンされ、`open` と `toggle` の値が渡されます。前の例のように Context API を使用する代わりに、`props` を通じてこれら 2 つの値にアクセスできるようになりました。

```jsx
import React from "react";
import Icon from "./Icon";

const FlyOutContext = React.createContext();

export function FlyOut(props) {
  const [open, toggle] = React.useState(false);

  return (
    <div>
      {React.Children.map(props.children, child =>
        React.cloneElement(child, { open, toggle })
      )}
    </div>
  );
}

function Toggle() {
  const { open, toggle } = React.useContext(FlyOutContext);

  return (
    <div className="flyout-btn" onClick={() => toggle(!open)}>
      <Icon />
    </div>
  );
}

function List({ children }) {
  const { open } = React.useContext(FlyOutContext);
  return open && <ul className="flyout-list">{children}</ul>;
}

function Item({ children }) {
  return <li className="flyout-item">{children}</li>;
}

FlyOut.Toggle = Toggle;
FlyOut.List = List;
FlyOut.Item = Item;
```

@[codesandbox](https://codesandbox.io/embed/provider-pattern-2-j9l1k)

---

## Pros

---

## Cons

---

### 参考文献

* [Render Props - React](https://reactjs.org/docs/render-props.html)
* [React Hooks: Compound Components - Kent C. Dodds](https://kentcdodds.com/blog/compound-components-with-react-hooks)
