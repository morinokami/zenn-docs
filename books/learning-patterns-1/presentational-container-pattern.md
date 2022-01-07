---
title: "コンテナ・プレゼンテーションパターン"
---

---

> ビューとアプリケーションロジックを分け、関心の分離を実現する

---

![](/images/learning-patterns/presentational-container-1280w.jpg)

:::message
原文は[こちら](https://www.patterns.dev/posts/presentational-container-pattern/)
:::

## コンテナ・プレゼンテーションパターン

React において**関心の分離** (**separation of concerns**) を実現する方法の一つとして、**コンテナ・プレゼンテーションパターン** (Container/Presentational pattern) があります。このパターンにより、ビューをアプリケーションロジックから分離することができます。

---

たとえば、6 枚の犬の画像を取得し、それらを画面に表示するアプリケーションを作成したいとします。

このプロセスを 2 つに分けることで、**関心の分離**を図りたいと思います。

1. **プレゼンテーションコンポーネント**: データがユーザーに**どのように**表示されるかを管理するコンポーネント。この例では、*犬の画像のリストをレンダリング*します。
2. **コンテナコンポーネント**: **何の**データがユーザーに表示されるかを管理するコンポーネント。この例では、*犬の画像を取得*します。

---

[動画による説明](https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056518/patterns.dev/jspat-40_af2vga.mp4)

犬の画像の取得は**アプリケーションロジック**に対応し、画像の表示は**ビュー**にのみ対応します。

---

## プレゼンテーションコンポーネント

プレゼンテーションコンポーネントは、 `props` を通じてデータを受け取ります。その主な役割は、受け取ったデータを*変更することなく*、スタイルも含めて意図通りに表示することです。

犬の画像を表示する例について考えてみましょう。犬の画像を表示したい場合に必要なことは、API から取得した各画像をマップし、それらを表示することです。これを実現するには、`props` を通じてデータを受け取り、受け取ったデータをレンダリングする関数コンポーネントを作成します。

```js:DogImages.js
import React from "react";

export default function DogImages({ dogs }) {
  return dogs.map((dog, i) => <img src={dog} key={i} alt="Dog" />);
}
```

この `DogImages` コンポーネントはプレゼンテーションコンポーネントです。プレゼンテーションコンポーネントは*通常*、ステートをもちません。UI のためにステートが必要な場合を除き、自身のステートをもたないということです。受け取ったデータは、プレゼンテーションコンポーネントによって変更されることはありません。

プレゼンテーションコンポーネントは、**コンテナコンポーネント**からデータを受け取ります。

---

## コンテナコンポーネント

コンテナコンポーネントの主な役割は、自身が*含む*プレゼンテーションコンポーネントに**データを受け渡す**ことです。コンテナコンポーネント自身は、通常、受け取ったデータを扱うプレゼンテーションコンポーネント以外のコンポーネントをレンダリングすることはありません。コンテナコンポーネント自身は何もレンダリングしないため、通常はスタイルももちません。

私たちの例では、犬の画像をプレゼンテーションコンポーネントである `DogImages` に渡します。それを実現するためにまず、外部の API から画像を取得する必要があります。そしてそれを画面に表示させるために、画像データを取得する**コンテナコンポーネント**を作成し、そのデータをプレゼンテーションコンポーネントである `DogsImages` に渡します。

```jsx:DogImageContainer.js
import React from "react";
import DogImages from "./DogImages";

export default class DogImagesContainer extends React.Component {
  constructor() {
    super();
    this.state = {
      dogs: []
    };
  }

  componentDidMount() {
    fetch("https://dog.ceo/api/breed/labrador/images/random/6")
      .then(res => res.json())
      .then(({ message }) => this.setState({ dogs: message }));
  }

  render() {
    return <DogImages dogs={this.state.dogs} />;
  }
}
```

@[codesandbox](https://codesandbox.io/embed/sleepy-murdock-if0ec)

この 2 つのコンポーネントを組み合わせることで、アプリケーションロジックの処理とビューを分離することが可能になります。

[動画による説明](https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056519/patterns.dev/jspat-45_budnfb.mp4)

---

## フック

多くの場合、コンテナ・プレゼンテーションパターンは React のフックに置き換えることができます。フックの導入により、開発者はステートを提供するコンテナコンポーネントを必要とせずに、簡単にアプリケーションをステートフルにすることができるようになりました。

`DogImagesContainer` コンポーネントにデータ取得ロジックをもたせる代わりに、画像を取得して犬の配列を返すカスタムフックを作成することができます。

```js
export default function useDogImages() {
  const [dogs, setDogs] = useState([]);

  useEffect(() => {
    fetch("https://dog.ceo/api/breed/labrador/images/random/6")
      .then(res => res.json())
      .then(({ message }) => setDogs(message));
  }, []);

  return dogs;
}
```

このフックを使うことで、もはやデータを取得するラッパーである `DogImagesContainer` コンポーネントは不要となり、表示用の `DogImages` コンポーネントにデータを送る必要もなくなります。代わりに、このフックを `DogImages` コンポーネントの中で直接使うことができるのです。

```js:DogImages.js
import React from "react";
import useDogImages from "./useDogImages";

export default function DogImages() {
  const dogs = useDogImages();

  return dogs.map((dog, i) => <img src={dog} key={i} alt="Dog" />);
}
```

```js:useDogImages.js
import { useState, useEffect } from "react";

export default function useDogImages() {
  const [dogs, setDogs] = useState([]);

  useEffect(() => {
    async function fetchDogs() {
      const res = await fetch(
        "https://dog.ceo/api/breed/labrador/images/random/6"
      );
      const { message } = await res.json();
      setDogs(message);
    }

    fetchDogs();
  }, []);

  return dogs;
}
```

@[codesandbox](https://codesandbox.io/embed/rough-brook-tzp7i)

`useDogImages` フックを使うことによっても、アプリケーションのロジックをビューから切り離すことができています。`useDogImages` フックから返されたデータは、`DogImages` コンポーネント内で変更されることなく、単に表示のために使用されています。

[動画による説明](https://res.cloudinary.com/ddxwdqwkr/video/upload/v1609056518/patterns.dev/jspat-46_evhhpd.mp4)

フックを使うと、コンテナ・プレゼンテーションパターンと同じように、コンポーネント内でロジックとビューを簡単に分離することができます。フックにより、プレゼンテーションコンポーネントをラップするために必要であった、コンテナコンポーネントという余分なレイヤーを省くことができるのです。

---

## Pros

コンテナ・プレゼンテーションパターンを使用すると、多くの利点があります。

コンテナ・プレゼンテーションパターンは、**関心の分離**を促進します。プレゼンテーションコンポーネントは UI を担当する純粋関数となるのに対し、コンテナコンポーネントはアプリケーションのステートやデータを担当します。このため、**関心の分離**を容易に実現することができるのです。

プレゼンテーションコンポーネントは、データを変更することなく*表示する*だけなので、再利用が容易です。アプリケーション全体で、異なる目的のためにプレゼンテーションコンポーネントを再利用することができます。

プレゼンテーションコンポーネントはアプリケーションロジックを変更しないため、デザイナーのようにコードベースの知識がない人でも、簡単にプレゼンテーションコンポーネントの外観を変更することができます。プレゼンテーションコンポーネントがアプリケーションの多くの箇所で再利用される場合、その変更はアプリケーション全体で一貫したものとなるはずです。

プレゼンテーションコンポーネントは通常、純粋関数であるため、テストが容易です。入力となるデータからコンポーネントが何をレンダリングするかを知ることができ、データストアをモックしなくてよいのです。

---

## Cons

コンテナ・プレゼンテーションパターンを用いると、アプリケーションロジックとレンダリングロジックを簡単に分離することができます。しかし、フックを使えば、コンテナ・プレゼンテーションパターンを使わなくても、また、ステートレスな関数コンポーネントをクラスコンポーネントに書き換えなくても、同じ結果を得ることができます。なお、現在では、ステートを利用するためにクラスコンポーネントを作成する必要はないことに注意してください。

現在でも コンテナ・プレゼンテーションパターンを使うことはできますが (フックと組み合わせることもできます)、このパターンは小規模なアプリケーションでは不要に複雑となりがちです。

---

## 参考文献

* [Presentational and Container Components - Dan Abramov](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)
