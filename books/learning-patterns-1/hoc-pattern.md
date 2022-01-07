---
title: "HOC パターン"
---

---

> アプリケーション全体で再利用可能なロジックを props からコンポーネントに渡す

---

![](/images/learning-patterns/hoc-pattern-1280w.jpg)

## HOC パターン

アプリケーションの中で、同じロジックを複数のコンポーネントにおいて使いたいことがよくあります。このロジックには、コンポーネントに特定のスタイルを適用すること、認可を要求すること、グローバルな状態を追加することなどが含まれます。

複数のコンポーネントで同じロジックを再利用する方法の 1 つとして **HOC** パターンがあります。このパターンにより、アプリケーション全体でコンポーネントロジックを再利用することができます。

高階コンポーネント (HOC、Higher Order Component) は、他のコンポーネントを受け取るコンポーネントです。HOC には、パラメータとして渡されるコンポーネントに適用する何らかのロジックが含まれています。そのロジックを適用した上で、HOC は追加されたロジックとともに要素を返します。

たとえば、アプリケーションの複数のコンポーネントに、あるスタイルを常に追加したいとします。毎回ローカルに `style` オブジェクトを作成する代わりに、渡されたコンポーネントに `style` オブジェクトを追加する HOC を作成することができます。

```jsx
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

ここで作成した `StyledButton` と `StyledText` コンポーネントは、`Button` と `Text` コンポーネントが変更されたものです。これらは両方とも `withStyles` HOC において追加されたスタイルを含んでいます！

以前にコンテナ・プレゼンテーションパターンで使用したものと同じ `DogImages` の例を見てみましょう。このアプリケーションは、API から取得した犬の画像のリストをレンダリングすること以外は何もしません。

@[codesandbox](https://codesandbox.io/embed/hoc-pattern-1-tzp7i)

ユーザー体験を少し向上させましょう。データの取得中、ユーザーに `"Loading..."` という画面を表示しようと思います。`DogImages` コンポーネントに直接データを追加するのではなく、そのロジックを追加するための高階コンポーネントを使用します。

`withLoader` という名前の HOC を作りましょう。HOC は、コンポーネントを受け取り、そのコンポーネントを返さなければなりません。ここでは、`withLoader` HOC は、データが取得されるまでは `Loading...` と表示したいような要素を受け取るはずです。

`withLoader` HOC のミニマムバージョンは以下のようになります。

```jsx
function withLoader(Element) {
  return props => <Element />;
}
```

しかし、私たちは単に受け取った要素を返したいわけではありません。この要素に、データがまだロード中かどうかを示すロジックを与えたいのです。

`withLoader` HOC を再利用しやすくするために、コンポーネントに Dog API の URL をハードコードしないようにします。その代わり、URL を `withLoader` HOC の引数として渡すようにし、異なる API エンドポイントからデータを取得する際にローディングインジケータを必要とする任意のコンポーネントに対して、このローダーを使用できるようにします。

```js
function withLoader(Element, url) {
  return props => {};
}
```

HOC は要素、ここでは関数コンポーネント `props => {}` を返します。ここに、データがまだ取得中であるときに `Loading...` というテキストを表示するためのロジックを追加します。データの取得が終わると、コンポーネントは取得したデータを prop として受け取ります。

```jsx:withLoader.js
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

1. `useEffect` フックで、`withLoader` HOC は `url` の値として渡された API エンドポイントからデータを取得します。データがまだ返されていなければ、`Loading...` というテキストを含む要素を返します。
2. データを取得できたら、`data` に取得したデータをセットします。この段階で `data` はもはや `null` ではないため、HOC に渡した要素を表示することができます！

では、この挙動をアプリケーションに追加して、`DogImages` リストに `Loading...` インジケータを実際に表示するにはどうすればよいのでしょうか。

`DogImages.js` において、素の `DogImages` コンポーネントをエクスポートしないようにします。代わりに、`DogImages` コンポーネントを `withLoader` HOC で「ラップ」したものをエクスポートします。

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

`withLoader` HOC は、要素 (ここでは `DogImages`) に `data` prop を追加して返すため、`DogImages` コンポーネントから `data` prop にアクセスすることができます。

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

## 合成

複数の高階コンポーネントを**合成する** (compose) こともできます。たとえば、ユーザーが `DogImages` リストをホバーしたときに、`Hovering!` というテキストボックスを表示する機能を追加したいとします。

渡された要素に `hovering` prop を提供する HOC を作成します。その prop を使えば、ユーザーが `DogImages` リストの上をホバーしているかどうかに基づいて、テキストボックスを条件付きでレンダリングすることができます。

```js:withHover.js
import React, { useState } from "react";

export default function withHover(Element) {
  return props => {
    const [hovering, setHover] = useState(false);

    return (
      <Element
        {...props}
        hovering={hovering}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      />
    );
  };
}
```

これで、`withHover` HOC により `withLoader` HOC をラップすることができるようになりました。

```js:DogImages.js
import React from "react";
import withLoader from "./withLoader";
import withHover from "./withHover";

function DogImages(props) {
  return (
    <div {...props}>
      {props.hovering && <div id="hover">Hovering!</div>}
      <div id="list">
        {props.data.message.map((dog, index) => (
          <img src={dog} alt="Dog" key={index} />
        ))}
      </div>
    </div>
  );
}

export default withHover(
  withLoader(DogImages, "https://dog.ceo/api/breed/labrador/images/random/6")
);
```

@[codesandbox](https://codesandbox.io/embed/withhover-withloader-whhh0)

`DogImages` 要素に、`withHover` と `withLoader` の両方から渡されるすべての props が含まれるようになりました。これで、`hovering` prop の値が `true` か `false` かという条件に応じて `Hovering!` テキストボックスを表示することができるようになりました。

> HOC を作成するために使用される有名なライブラリに [recompose](https://github.com/acdlite/recompose) があります。HOC は React のフックによりかなりの部分を置き換えられるため、recompose ライブラリはもうメンテナンスされておらず、したがってこの記事では取り上げません。

---

## フック

HOC パターンを React のフックで置き換えることができる場合があります。

`withHover` HOCを `useHover` フックに置き換えてみましょう。高階コンポーネントを使用する代わりに、要素に `mouseover` と `mouseout` のイベントリスナーを追加するフックをエクスポートします。HOC でやったように要素を渡すことはもうできません。その代わり、`mouseover` と `mouseout` イベントを取得するためのフックから `ref` を返すことにします。

```js:useHover.js
import { useState, useRef, useEffect } from "react";

export default function useHover() {
  const [hovering, setHover] = useState(false);
  const ref = useRef(null);

  const handleMouseOver = () => setHover(true);
  const handleMouseOut = () => setHover(false);

  useEffect(() => {
    const node = ref.current;
    if (node) {
      node.addEventListener("mouseover", handleMouseOver);
      node.addEventListener("mouseout", handleMouseOut);

      return () => {
        node.removeEventListener("mouseover", handleMouseOver);
        node.removeEventListener("mouseout", handleMouseOut);
      };
    }
  }, [ref.current]);

  return [ref, hovering];
}
```

`useEffect` フックはイベントリスナーをコンポーネントに追加し、ユーザーが要素の上をホバーしているかどうかに応じて、`hovering` を `true` か `false` に設定します。フックからは `ref` と `hovering` の両方の値を返す必要があります。`ref` は `mouseover` と `mouseout` イベントを受け取るべきコンポーネントへの参照を追加するために、`hovering` は `Hovering!` というテキストボックスを条件に応じて表示するために使います。

`DogImages` コンポーネントを `withHover` HOC でラップする代わりに、`DogImages` コンポーネントの内部で `useHover` フックを使うことができます。

```js:DogImages.js
import React from "react";
import withLoader from "./withLoader";
import useHover from "./useHover";

function DogImages(props) {
  const [hoverRef, hovering] = useHover();

  return (
    <div ref={hoverRef} {...props}>
      {hovering && <div id="hover">Hovering!</div>}
      <div id="list">
        {props.data.message.map((dog, index) => (
          <img src={dog} alt="Dog" key={index} />
        ))}
      </div>
    </div>
  );
}

export default withLoader(
  DogImages,
  "https://dog.ceo/api/breed/labrador/images/random/6"
);
```

@[codesandbox](https://codesandbox.io/embed/usehover-withloader-npo50)

完璧です！`DogImages` コンポーネントを `withHover` コンポーネントでラップする代わりに、コンポーネント内で `useHover` フックを直接使えばよいのです。

---

一般に、React フックは HOC パターンを置き換えるものではありません。

> 多くの場合はフックで十分であり、これによりツリー内のネストを減らすことができます。- [React Docs](https://reactjs.org/docs/hooks-faq.html#do-hooks-replace-render-props-and-higher-order-components)

React のドキュメントにあるように、フックを使うことでコンポーネントツリーの深さを減らすことができます。HOC パターンを使用すると、深くネストしたコンポーネントツリーになってしまいがちです。

```jsx
<withAuth>
  <withLayout>
    <withLogging>
      <Component />
    </withLogging>
  </withLayout>
</withAuth>
```

コンポーネントに直接フックを追加することで、コンポーネントをラップする必要がなくなるのです。

高階コンポーネントを使用することで、多くのコンポーネントに同じロジックを提供しながらも、そのロジックをすべて一つの場所で管理することができます。フックにより、コンポーネント内にカスタマイズされた動作を追加することができますが、複数のコンポーネントがこの動作に依存している場合、HOC パターンと比較してバグを生むリスクが高まる可能性があります。

**HOC が最適なユースケース**:

* 同一の、*カスタマイズ不要な*ロジックが、アプリケーション全体で多くのコンポーネントによって使われる
* コンポーネントは、追加のカスタムロジックなしで、独立して動作する

**フックが最適なユースケース**:

* 各コンポーネントごとにロジックをカスタマイズしたい
* ロジックはアプリケーション全体で使われず、1 つまたはいくつかのコンポーネントだけが使用する
* ロジックによってコンポーネントに多くのプロパティが追加される

---

## ケーススタディ

HOC パターンを使用していたライブラリの一部は、フックのリリース後にそのサポートを追加しました。その一例として [Apollo Client](https://www.apollographql.com/docs/react) があります。

> この例を理解するために、Apollo Client の経験は必要ありません。

Apollo Client を使う方法の一つが、高階コンポーネント `graphql()` を使うものです。

```jsx:InputHOC.js
import React from "react";
import "./styles.css";

import { graphql } from "react-apollo";
import { ADD_MESSAGE } from "./resolvers";

class Input extends React.Component {
  constructor() {
    super();
    this.state = { message: "" };
  }

  handleChange = (e) => {
    this.setState({ message: e.target.value });
  };

  handleClick = () => {
    this.props.mutate({ variables: { message: this.state.message } });
  };

  render() {
    return (
      <div className="input-row">
        <input
          onChange={this.handleChange}
          type="text"
          placeholder="Type something..."
        />
        <button onClick={this.handleClick}>Add</button>
      </div>
    );
  }
}

export default graphql(ADD_MESSAGE)(Input);
```

`graphql()` HOC を使うと、Apollo Client のデータを、高階コンポーネントによってラップされたコンポーネントから利用できるようになります。ところで、現在も `graphql()` HOC を使うことはできますが、いくつか欠点もあります。

コンポーネントが複数のリゾルバにアクセスする必要がある場合、それを実現するために複数の `graphql()` 高階コンポーネントを**組み合わせる**必要があります。複数の HOC を組み合わせると、データがコンポーネントにどのように渡されるかを理解することが難しくなります。HOC の順序が問題になることもあり、コードのリファクタリング時にバグにつながりやすくなります。

フックのリリース後、Apollo は Apollo Client ライブラリにフックのサポートを追加しました。`graphql()` 高階コンポーネントを使用する代わりに、開発者はライブラリが提供するフックを介して直接データにアクセスできるようになりました。

`graphql()` 高階コンポーネントを使った例で見たものとまったく同じデータを使った例を見てみましょう。今回は Apollo Client が提供する `useMutation` フックを使ってコンポーネントにデータを提供します。

```js:InputHooks.js
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

`useMutation` フックにより、コンポーネントにデータを提供するために必要なコードの量を減らすことができました。

定型処理の削減に加えて、コンポーネント内で複数のリゾルバのデータを使用することも非常に簡単になりました。複数の高階コンポーネントを組み合わせる代わりに、コンポーネントの中に複数のフックを書くだけでよいのです。コンポーネントに渡されるデータを把握するには、この方法の方がはるかに容易ですし、コンポーネントをリファクタリングしたり、より小さな部品に分解したりする際の開発体験も向上します。

---

## Pros

HOC パターンを使うと、再利用したいロジックを一カ所にまとめておくことができます。つまり、バグを発生させる可能性のあるコードがアプリケーション内で重複した結果、意図せずしてアプリケーション全体にバグを拡散してしまうようなリスクを減らすことができるのです。また、ロジックを一箇所にまとめることは、`DRY` なコードを維持し、**関心の分離**を実現しやすくすることにもつながります。

---

## Cons

HOC が要素に渡す prop の名前が、他の名前と衝突する可能性があります。

```js
function withStyles(Component) {
  return props => {
    const style = { padding: '0.2rem', margin: '1rem' }
    return <Component style={style} {...props} />
  }
}

const Button = () = <button style={{ color: 'red' }}>Click me!</button>
const StyledButton = withStyles(Button)
```

この場合、`withStyles` HOC は、`style` という名前の prop を渡された要素に追加します。しかし、`Button` コンポーネントはすでに `style` という名前の prop をもっているため、これが上書きされてしまいます！prop の名前を変更するか、props をマージすることによって、思いがけない名前の衝突を HOC が回避できるようにする必要があります。

```js
function withStyles(Component) {
  return props => {
    const style = {
      padding: '0.2rem',
      margin: '1rem',
      ...props.style
    }

    return <Component style={style} {...props} />
  }
}

const Button = () = <button style={{ color: 'red' }}>Click me!</button>
const StyledButton = withStyles(Button)
```

ラップされた要素に props を渡すような HOC を複数**組み合わせて**使うと、どの prop がどの HOC に由来するのかを把握することが困難な場合があります。これは、アプリケーションのデバッグとスケーリングを難しくする原因となります。

---

## 参考文献

* [Higher-Order Components - React](https://reactjs.org/docs/higher-order-components.html)
