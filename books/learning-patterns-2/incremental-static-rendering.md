---
title: "Incremental Static Generation"
---

---

> サイトのビルド後に静的コンテンツを更新する

---

![](/images/learning-patterns/incremental-static-rendering-1280w.jpg)

:::message
原文は[こちら](https://www.patterns.dev/posts/incremental-static-rendering/)
:::

# Incremental Static Generation

Static Generation (SSG) は、SSR と CSR の多くの問題を解決しますが、それが適するのはほぼ静的なコンテンツのレンダリングです。レンダリングするコンテンツが動的、あるいは頻繁に変更される場合には限界があります。

たとえば、複数の記事をもつブログについて考えましょう。ある記事のタイポを修正するためだけに、サイトをもう一度ビルドしてデプロイしたいとは思わないでしょう。同様に、新しい記事を追加するために、既存のすべてのページを再ビルドすることは望ましくありません。このように、SSG のみでは大規模なウェブサイトやアプリケーションをレンダリングするために十分であるとは言えません。

Incremental Static Generation (iSSG) パターンは、こうした動的データに関する問題を解決し、変更頻度の高い大量のデータを扱う静的サイトをスケールさせるために、SSG のアップグレードとして導入されました。iSSG では、新しいリクエストが来る合間に、バックグラウンドでページのサブセットをプリレンダリングすることで、既存のページを更新したり新しいページを追加したりすることができます。

## iSSG のサンプルコード

<!-- TODO: front -->
iSSG works on two fronts to incrementally introduce updates to an existing static site after it has been built.

iSSG は、既存の静的サイトをビルド後に段階的に更新するための 2 つの側面を持っています。

1. 新しいページの追加を可能にする
2. 既存ページの更新を可能にする (Incremental Static "Re"generation とも呼ばれる)

### 新しいページの追加

ビルド後のウェブサイトに新しいページを追加するために、遅延ロードの概念が導入されます。つまり、最初のリクエストにおいて即座に新しいページが生成されるのです。生成がおこなわれている間は、フロントエンドではフォールバック用のページまたはローディングインジケーターをユーザーに表示することができます。これを、前述した個々の商品の詳細ページに関する SSG のシナリオと比較してみましょう。そこでは、存在しないページに対するフォールバックとして、404 エラーページを表示していました。

では、まだ存在しないページを iSSG により遅延ロードするための Next.js のコードを見てみましょう。

```jsx:pages/products/[id].js
// getStaticPaths() では、ビルド時にプリレンダリングしたい
// 商品ページ (/products/[id]) の id のリストを返す必要があります。
// データベースからすべての商品を取得することも可能です。
export async function getStaticPaths() {
  const products = await getProductsFromDatabase();

  const paths = products.map((product) => ({
     params: { id: product.id }
  }));

  // fallback: true は、存在しないページは 404 にならず、
  // 代わりにフォールバックをレンダリングすることを意味します。
  return { paths, fallback: true };
}

// params will contain the id for each generated page.
// params には、生成された各ページの ID が入ります。
export async function getStaticProps({ params }) {
  return {
    props: {
      product: await getProductFromDatabase(params.id)
    }
  }
}

export default function Product({ product }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  // 商品をレンダリングします。
}
```

<!-- TODO: revalidate -->
ここで `fallback: true` が指定されています。これにより、特定の商品に対応するページが存在しない場合、上の Product 関数におけるローディングインジケーターのように、フォールバック用のページがまず表示されます。しかしその一方で、Next.js はバックグラウンドにおいて新しいページを生成します。そして生成が完了すると、新しいページはキャッシュされた上で、フォールバック用ページの代わりに表示されます。キャッシュされたページは、以後のリクエストにおいて即座に表示されます。ところで、新規および既存のページの両方について、Next.js がページを再検証 (revalidate) および更新するまでの有効期限を設定することができます。これは、次のセクションで示すように、revalidate プロパティを使用することで実現できます。

### 既存ページの更新

既存のページを再レンダリングするために、ページに適切なタイムアウトを設定します。これにより、指定されたタイムアウトの期間が経過するたびにページが revalidate されるようになります。タイムアウトは 1 秒から設定することができます。ページの revalidate が完了するまで、ユーザーは前のバージョンのページにアクセスすることができます。つまり、iSSG では、revalidate がおこなわれている間はキャッシュまたは古いバージョンをユーザーに提供するという、[stale-while-revalidate](https://web.dev/stale-while-revalidate/) 戦略が使用されます。revalidate は、全体を再ビルドをすることなく、完全にバックグラウンドでおこなわれます。

データベースのデータをもとに静的な商品一覧ページを生成する例に戻りましょう。商品のリストをより動的にするために、ページが再ビルドされるまでのタイムアウトを設定するコードを導入します。タイムアウトを含むコードは次のようになります。

```jsx:pages/products/[id].js
// この関数はビルドサーバー上でビルド時に実行されます
export async function getStaticProps() {
  return {
    props: {
      products: await getProductsFromDatabase(),
      revalidate: 60, // この設定により 60 秒後にページが revalidate されるようになります
    }
  }
}

// このコンポーネントはビルド時に getStaticProps から products prop を受け取ります
export default function Products({ products }) {
  return (
    <>
      <h1>Products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </>
  )
}
```

ページを 60 秒後に revalidate するコードは、`getStaticProps()` 関数に含まれています。リクエストが来ると、まず既存の静的ページが表示されます。そして 1 分ごとに、静的ページが新しいデータをもとにバックグラウンドで更新されます。生成が完了すると、新しいバージョンの静的ファイルが利用可能となり、その後 1 分間は新しいリクエストに対して提供されます。この機能は Next.js 9.5 以降で利用可能となっています。

## iSSG の利点

iSSG は、SSG の強みのすべて、そしてさらにそれ以上のものを提供します。以下のリストで、そうした利点について詳しく説明します。

1. **動的データ**: 最初の利点は iSSG が考案された理由そのものです。つまり、サイト全体を再ビルドすることなく、動的データをサポートすることができるという点です。
2. **スピード**: iSSG は、データの取得とレンダリングがバックグラウンドでおこなわれるため、少なくとも SSG と同程度のスピードとなります。クライアントやサーバーで必要な処理はほとんどありません。
3. **可用性**: どのページについてもほぼ最新のバージョンが常にオンラインで利用可能であり、ユーザーがアクセスできるようになっています。仮にバックグラウンドでの再生成に失敗したとしても、古いバージョンは変更されずにそのまま残ります。
4. **一貫性**: 再生成はサーバー上でページごとにおこなわれるため、データベースやバックエンドの負荷は低く、パフォーマンスも一貫します。その結果、待ち時間のスパイクが発生することはありません。
5. **配布の容易さ**: SSG サイトと同様に、iSSG サイトも、プリレンダリングされたウェブページを提供する CDN ネットワークを通じて配布することができます。
