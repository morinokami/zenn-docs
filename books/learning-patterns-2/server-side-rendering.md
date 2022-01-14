---
title: "サーバーサイドレンダリング"
---

---

> ユーザーのリクエストに応じて、レンダリングする HTML をサーバー上で生成する

---

![](/images/learning-patterns/server-side-rendering-1280w.jpg)

:::message
原文は[こちら](https://www.patterns.dev/posts/server-side-rendering/)
:::

## サーバーサイドレンダリング

サーバーサイドレンダリング (SSR) は、Web コンテンツのレンダリング手法として最も歴史のあるものの一つです。SSR では、ユーザーのリクエストに応じて、レンダリングするページコンテンツの完全な HTML を生成します。コンテンツには、データストアや外部 API から取得したデータが含まれることもあります。

<!-- TODO: mov どうする？ -->
[動画による説明](https://res.cloudinary.com/ddxwdqwkr/video/upload/v1617495417/patterns.dev/serverside-rendering-1.mov)

データソースへの接続とそこからのデータ取得は、サーバー上で処理されます。コンテンツを整えるために必要なHTMLもサーバーで生成されます。よって、SSR を使えば、データの取得とテンプレート化のための追加的なラウンドトリップを回避することができます。そのため、レンダリングをおこなうコードはクライアントには不要であり、これに対応する JavaScript をクライアントに送るも必要はありません。

SSR では、すべてのリクエストは別々に扱われ、サーバーにおいて新しいリクエストとして処理されます。連続する 2 つのリクエストの出力がほぼ同じだとしても、サーバーはそれを一から処理・生成します。サーバーはユーザー間で共有されるため、その処理能力も、ある時点でアクティブなすべてのユーザー間で共有されます。

## 古典的な SSR の実装

古典的な SSR と JavaScript を使った、現在時刻を表示するページの作り方について見てみましょう。

```html:index.html
<!DOCTYPE html>
<html>
   <head>
       <title>Time</title>
   </head>
   <body>
       <div>
       <h1>Hello, world!</h1>
       <b>It is <div id=currentTime></div></b>
       </div>
   </body>
</html>
```

```js:index.js
function tick() {
    var d = new Date();
    var n = d.toLocaleTimeString();
    document.getElementById("currentTime").innerHTML = n;
}
setInterval(tick, 1000);
```

同じ出力となる CSR のコードとの違いに注目してください。また、この HTML はサーバーによってレンダリングされますが、表示される時刻は JavaScript の関数 `tick()` によって計算される、クライアントのローカルタイムであることに注意してください。サーバーの時刻などのサーバー固有のデータを表示したい場合は、それをレンダリング前に HTML に埋め込む必要があります。つまり、サーバーへのラウンドトリップなしで自動的に更新されることはありません。

---

## SSR - 利点と欠点

レンダリング用のコードをサーバー上で実行し、JavaScript を削減することには、以下のようなメリットがあります。

### JavaScript を減らすと、FCP や TTI の高速化につながる

<!-- TODO: FCP = TTI は言い過ぎでは -->
ページ上に複数の UI 要素やアプリケーションロジックがある場合、SSR は CSR に比べ、JavaScript のサイズがかなり少なくなります。そのため、スクリプトの読み込みや処理に必要な時間が短くなります。**FP**、**FCP**、**TTI** は短くなり、**FCP** ＝ **TTI** となります。SSR を使えば、すべての画面要素が表示されてインタラクティブになるまでユーザーが待たされることはなくなります。

![](/images/learning-patterns/server-side-rendering-1.png)

画像の出典: https://developers.google.com/web/updates/2019/02/rendering-on-the-web

### クライアントサイド JavaScript のサイズに余裕が生まれる

開発チームは、望ましいパフォーマンスを達成するために、ページ上の JS の量を制限することが求められます。SSR では、ページのレンダリングに必要な JS が取り除かれるため、アプリケーションに必要なサードパーティの JS のためのスペースを確保することができます。

### SEO 対策

検索エンジンのクローラーは、SSR アプリケーションのコンテンツを問題なくクロールできるため、ページの SEO を確実におこなうことができます。

上記のような利点から、SSR は静的コンテンツに最適です。しかし、いくつかの欠点もあり、すべてのシナリオにおいて完璧というわけではありません。

### 遅い TTFB

すべての処理がサーバー上でおこなわれるため、以下のような場合、サーバーからのレスポンスが遅れる可能性があります。

* 複数のユーザーからの同時アクセスにより、サーバーに過剰な負荷がかかっている
* ネットワークが遅い
* サーバーのコードが最適化されていない

### 特定の操作においてページ全体の再読み込みが必要となる

クライアント上ですべてのコードが実行されるわけではないため、各操作においてサーバーとのラウンドトリップが何度も必要となり、ページの再読み込みが発生します。このため、ユーザーは操作の合間に長い時間待つ必要があり、応答時間が増加する可能性があります。このように、シングルページアプリケーションを SSR で実現することは不可能です。

こうした欠点に対処するため、モダンなフレームワークやライブラリでは、同じアプリケーションをサーバーとクライアントの両方でレンダリングできるようになっています。のちの章では、その詳細について説明していきます。ここではまず、Next.js を使ったシンプルな SSR について見てみましょう。

## Next.js による SSR

Next.js フレームワークも SSR をサポートしており、リクエストごとにサーバー上でページをプリレンダリングすることができます。これは次のように、`getServerSideProps()` という非同期関数をページからエクスポートすることで実現できます。

```js
export async function getServerSideProps(context) {
  return {
    props: {}, // will be passed to the page component as props
  }
}
```

context オブジェクトには、HTTP リクエストオブジェクトとレスポンスオブジェクト、ルーティングパラメータ、クエリストリング、ロケールなどのキーが含まれています。

<!-- The following implementation shows the use of getServerSideProps() for rendering data on a page formatted using React. The full implementation can be found here. -->

## サーバー向け React

React can be rendered isomorphically, which means that it can function both on the browser as well as other platforms like the server. Thus, UI elements may be rendered on the server using React.

React can also be used with universal code which will allow the same code to run in multiple environments. This is made possible by using Node.js on the server or what is known as a Node server. Thus, universal JavaScript may be used to fetch data on the server and then render it using isomorphic React.

これを可能にする React の関数を見てみましょう。

```js
ReactDOMServer.renderToString(element)
```

この関数は、React の要素に対応する HTML 文字列を返します。この HTML をクライアントにレンダリングすることでページの読み込みを高速化することができます。

[`renderToString()`](https://reactjs.org/docs/react-dom-server.html#rendertostring) 関数は、[`ReactDOM.hydrate()`](https://reactjs.org/docs/react-dom.html#hydrate) とあわせて使用することができます。これにより、レンダリングされた HTML はそのままでクライアントに保持され、イベントハンドラのみがロード後にアタッチされるようになります。

これを実装するためには、各ページごとに、クライアントとサーバーの両方で `.js` ファイルを使用します。サーバー上の `.js` ファイルが HTML コンテンツをレンダリングし、クライアント上の `.js` ファイルがそれをハイドレートします。

レンダリング対象の HTML を含む `App` という React 要素があり、ユニバーサルな `app.js` ファイルで定義されているとします。サーバーサイドとクライアントサイドの両方の React が、`App` 要素を認識できます。

サーバー上の `ipage.js` ファイルは、以下のようなコードをもちます:

```jsx
app.get('/', (req, res) => {
  const app = ReactDOMServer.renderToString(<App />);
})
```

定数 `App` が、レンダリング対象の HTML を生成するために使用できるようになりました。クライアント側の `ipage.js` は、`App` 要素がハイドレートされるよう以下のコードを実行します。

```jsx
ReactDOM.hydrate(<App />, document.getElementById('root'));
```

React を使った SSR の完全な例については、[こちら](https://www.digitalocean.com/community/tutorials/react-server-side-rendering)で確認することができます。
