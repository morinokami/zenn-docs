---
title: "Next.js 概論"
---

---

> ハイブリッド React アプリケーションのための Vercel のフレームワーク

---

![](/images/learning-patterns/nextjs-1280w.jpg)

:::message
原文は[こちら](https://www.patterns.dev/posts/nextjs/)
:::

## Next.js 入門

Vercel により作られた Next.js は、ハイブリッド React アプリケーションのためのフレームワークです。コンテンツを読み込むためのさまざまな手法を理解することは、なかなか難しいものです。Next.js はこれを抽象化し、できる限り簡単にしてくれます。このフレームワークは、スケーラブルでハイパフォーマンスな React コードを構築することを可能とし、また設定を不要とするアプローチのもと提供されています。これにより、開発者は機能の開発に集中することができるのです。

それでは、私たちの議論に関連する範囲で Next.js の機能について見ていきましょう。

## 基本的な機能

### プリレンダリング

<!-- TODO: without actually manipulating it -->
デフォルトでは、Next.js は各ページの HTML をクライアントサイドで生成せず、事前に生成しておきます。このプロセスを[プリレンダリング (pre-rendering)](https://nextjs.org/docs/basic-features/pages#pre-rendering) と呼びます。Next.js は、ページをインタラクティブにするために必要な JavaScript コードが、生成されたHTMLと関連付けられるようにします。この JavaScript コードは、ページがロードされた時点で実行されます。このタイミングで React は、仮想 DOM (virtual DOM) 上において、レンダリングされたコンテンツと、React アプリケーションがレンダリングしようとするものとが一致するようにします。このプロセスを[ハイドレーション (hydration)](https://blog.somewhatabstract.com/2020/03/16/hydration-and-server-side-rendering/) と呼びます。

各ページは、pages ディレクトリにある `.js`、`.jsx`、`.ts`、または `.tsx` ファイルからエクスポートされた React コンポーネントです。ルート (route) はファイル名により決定されます。たとえば、`pages/about.js` は `/about` というルートに対応します。Next.js は、サーバーサイドレンダリング (Server-Side Rendering、SSR) とスタティックジェネレーション (static generation) の両方によるプリレンダリングをサポートしています。また、同じアプリケーションの中で、あるページは SSR を使用し、あるページはスタティックジェネレーションを使用するといった具合に、異なるレンダリング方法を混在させることもできます。ページ内の特定の要素をレンダリングするために、クライアントサイドレンダリングを使用することもできます。

### データの取得

Next.js では、SSR とスタティックジェネレーションのいずれにおいてもデータの取得をサポートしています。そのためには、Next.js の以下の機能を利用します。

1. [`getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation)
    * スタティックジェネレーションにおいてデータをレンダリングするために使用します
2. [`getStaticPaths`](https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation)
    * スタティックジェネレーションにおいて動的ルートをレンダリングするために使用します
3. [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering)
    * SSR に適用されます

### 静的ファイルの配信

画像などの静的ファイルはルートディレクトリの `public` フォルダから[配信する](https://nextjs.org/docs/basic-features/static-file-serving)ことができます。配置された画像は、たとえば `src="/logo.png"` のようにルート URL を通じて、各ページ内の `<img>` タグから参照することができます。

### 画像の自動最適化

Next.js は、ブラウザが対応していれば、画像のリサイズ、最適化、モダンなフォーマットによる配信などの、[画像の自動最適化](https://nextjs.org/docs/basic-features/image-optimization)をおこないます。これにより、大きな画像は必要に応じて小さなビューポート用にリサイズされます。画像の最適化は、HTMLの `<img>` 要素を拡張した Next.js の Image コンポーネントをインポートすることで実装できます。Image コンポーネントを使用するためには、以下のようにインポートします。

```js
import Image from 'next/image'
```

次のコードにより Image コンポーネントをページ上に表示することができます。

```jsx
<Image src="/logo.png" alt="Logo" width={500} height={500} />
```

### ルーティング

Next.js では `pages` ディレクトリを通じてルーティングをおこないます。このディレクトリやその内部のディレクトリに置かれた .js ファイルは、対応するルートをもつページとなります。また、Next.js では、名前付きパラメータを使った[動的なルート](https://nextjs.org/docs/routing/dynamic-routes)の作成もサポートしています。この場合、実際に表示されるドキュメントはパラメータの値によって決定されます。

たとえば、`pages/products/[pid].js` というページは `/products/1` などのルートにマッチし、`pid=1` がクエリパラメータの 1 つとなります。Next.js では、[こうした動的なルートをもつ他のページへのリンク](https://nextjs.org/docs/api-reference/next/link#if-the-route-has-dynamic-segments)もサポートされています。

### コード分割

コード分割 (code splitting) により、必要な JavaScript だけがクライアントに送信されるようになるため、パフォーマンスを向上させることができます。Next.js は 2 種類のコード分割をサポートしています。

1. ルート単位: これは Next.js ではデフォルトで実装されています。ユーザーがあるルートにアクセスすると、Next.js はそのルートに必要なコードだけを送信します。その他のコードは、ユーザーがアプリケーション内を遷移する際に、必要に応じてダウンロードされます。これにより、一度にパース・コンパイルされるコードの量が制限されるため、ページのロード時間が改善されます。
2. コンポーネント単位: このタイプのコード分割では、大きなコンポーネントを個別のチャンクへと分割し、必要なときに遅延読み込みすることができます。Next.js は、[dynamic import()](https://nextjs.org/docs/advanced-features/dynamic-import) によってコンポーネント単位のコード分割をサポートしています。これにより、(React のコンポーネントを含む) JavaScript モジュールを動的にインポートし、それぞれのインポートを個別にロードすることができます。

## Next.js を使い始める

Next.js は、Node.js 10.13 以降を搭載した Linux、Windows、Mac OS にインストールすることができます。自動と手動、両方の[セットアップ](https://nextjs.org/docs/getting-started)オプションが利用可能です。

### create-next-app を使った自動セットアップ

```sh
npx create-next-app
# or
yarn create next-app
```

インストールが完了すると、開発用サーバーを起動して http://localhost:3000 以下のページにアクセスできるようになります。

それでは、Next.js の紹介が終わったところで、続いてさまざまなパターンの実装について見ていきましょう。
