---
title: "HOC パターン: アプリケーション全体で再利用可能なロジックを props としてコンポーネントに渡す"
---

![](/images/learning-patterns/hoc-pattern-1280w.jpg)

アプリケーションの中で、同じロジックを複数のコンポーネントにおいて使いたいことがよくあります。このロジックには、コンポーネントに特定のスタイルを適用すること、認可を要求すること、グローバルな状態を追加することなどが含まれます。

複数のコンポーネントで同じロジックを再利用する方法一つとして **HOC** パターンがあります。このパターンにより、アプリケーション全体でコンポーネントロジックを再利用することができます。

高階コンポーネント (HOC、Higher Order Component) は、他のコンポーネントを受け取るコンポーネントです。HOC には、パラメータとして渡されるコンポーネントに適用する何らかのロジックが含まれています。そのロジックを適用した上で、HOC は追加されたロジックをもつ要素を返します。

例えば、アプリケーションの複数のコンポーネントに、あるスタイルを常に追加したいとします。毎回ローカルに `style` オブジェクトを作成する代わりに、渡されたコンポーネントに `style` オブジェクトを追加する HOC を作成することができます。

```js
function withStyles(Component) {
  return props => {
    const style = { padding: '0.2rem', margin: '1rem' }
    return <Component style={style} {...props} />
  }
}

const Button = () = <button>Click me!</button>
const Text = () => <p>Hello World!</p>

const StyledButton = withStyles(Button)
const StyedText = withStyles(Text)
```

上で `StyledButton` と `StyledText` コンポーネントを作成しましたが、これは Button と Text コンポーネントが変更されたものです。これらは両方とも `withStyles` HOC において追加されたスタイルを含んでいます！

以前に Container/Presentational パターンで使用したものと同じ `DogImages` の例を見てみましょう。このアプリケーションは、API から取得した犬の画像のリストをレンダリングすること以外は何もしません。

@[codesandbox](https://codesandbox.io/embed/hoc-pattern-1-tzp7i)

ユーザー体験を少し向上させましょう。データの取得中に、ユーザーに `"Loading..."` という画面を表示しようと思います。`DogImages` コンポーネントに直接データを追加するのではなく、そのロジックを追加するための Higher Order Component を使用します。

`withLoader` という名前の HOC を作りましょう。HOC はコンポーネントを受け取り、そのコンポーネントを返さなければなりません。ここでは、`withLoader` HOC は、データが取得されるまで `Loading...` と表示する要素を受け取るはずです。

それでは `withLoader` HOC のミニマムバージョンを作ってみましょう！

```js
function withLoader(Element) {
  return props => <Element />;
}
```

ところで、私たちは単に受け取った要素を返したいわけではありません。そうではなく、この要素に、データがまだロード中かどうかを示すロジックを含ませたいのです。

`withLoader` HOC を再利用しやすくするために、コンポーネントに Dog API の URL をハードコードしないようにします。その代わり、URL を `withLoader` HOC の引数として渡し、異なる API エンドポイントからデータを取得する際にローディングインディケータを必要とする任意のコンポーネントに対して、このローダーを使用できるようにします。

```js
function withLoader(Element, url) {
  return props => {};
}
```

<!-- TODO: 原文で pass と書かれているのは receive の間違い？ -->
HOC は要素、ここでは関数コンポーネント `props => {}` を返します。ここに、データがまだ取得中であるときに `Loading...` というテキストを表示するためのロジックを追加します。データの取得が終わると、コンポーネントは取得したデータを prop として受け取ります。

```js:withLoader.js
import React, { useEffect, useState } from "react";

export default function withLoader(Element, url) {
  return (props) => {
    const [data, setData] = useState(null);

    useEffect(() => {
      async function getData() {
        const res = await fetch(url);
        const data = await res.json();
        setData(data);
      }

      getData();
    }, []);

    if (!data) {
      return <div>Loading...</div>;
    }

    return <Element {...props} data={data} />;
  };
}
```

完璧です！任意のコンポーネントと URL を受け取ることができる HOC を作成できました。

1. `useEffect` フックで、`withLoader` HOC は `url` の値として渡した API エンドポイントからデータを取得します。データがまだ返されていなければ、`Loading...` というテキストを含む要素を返します。
2. データを取得できたら、`data` に取得したデータをセットします。この段階で `data` はもはや `null` ではないため、HOC に渡した要素を表示することができます！

では、この挙動をアプリケーションに追加して、`DogImages` リストに `Loading...` インジケータを実際に表示するにはどうすればよいのでしょうか。

`DogImages.js` では、素の `DogImages` コンポーネントをエクスポートする必要はありません。代わりに、`DogImages` コンポーネントを `withLoader` HOC で「ラップ」したものをエクスポートします。

```js
export default withLoader(DogImages);
```

`withLoader` HOC は、どのエンドポイントからデータを取得するのかを知るために、URL も必要とします。ここでは、Dog API エンドポイントを追加します。

```js
export default withLoader(
  DogImages,
  "https://dog.ceo/api/breed/labrador/images/random/6"
);
```

`withLoader` HOC は、要素 (ここでは `DogImages`) に `data` prop を追加して返すため、`DogImages` コンポーネントでは `data` prop にアクセスすることができます。

```js:DogImages.js
import React from "react";
import withLoader from "./withLoader";

function DogImages(props) {
  return props.data.message.map((dog, index) => (
    <img src={dog} alt="Dog" key={index} />
  ));
}

export default withLoader(
  DogImages,
  "https://dog.ceo/api/breed/labrador/images/random/6"
);
```

@[codesandbox](https://codesandbox.io/embed/withloader-rslq4)

完璧です！データの取得中は `Loading...` の画面が表示されるようになりました。

HOC パターンを使うと、複数のコンポーネントに同一のロジックを提供し、かつそのロジックを一カ所にまとめておくことができます。`withLoader` HOC には、受け取るコンポーネントや URL の制限はありません。それが有効なコンポーネントで有効な API エンドポイントである限り、API エンドポイントから取得したデータをコンポーネントに受け渡すことだけをおこないます。

---

### 合成

複数の高階コンポーネントを**合成する (compose)** こともできます。たとえば、ユーザーが `DogImages` リストをホバーしたときに、`Hovering!` というテキストボックスを表示する機能を追加したいとします。

---

### 参考文献

* [Higher-Order Components - React](https://reactjs.org/docs/higher-order-components.html)
