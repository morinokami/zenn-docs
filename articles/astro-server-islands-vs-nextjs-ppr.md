---
title: "Next.js PPR と比較して理解する Astro Server Islands"
emoji: "🎛️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["astro", "nextjs", "react"]
published: false
---

## はじめに


## Partial Prerendering のおさらい

まず、[Next.js v14](https://nextjs.org/blog/next-14#partial-prerendering-preview) において導入された Partial Prerendering（以降は PPR と略します）についておさらいします。ここでは Next.js プロジェクトを Vercel へとデプロイした場合を前提として説明するため、最初に Vercel へのリクエストがどのように処理されるかについて述べ、議論に必要な範囲で解像度を上げておきます。その上で、

- Static Rendering
- Dynamic Rendering
- Streaming
- Partial Prerendering

という各種のレンダリング方式について、ひとつひとつ解説していきます。

なお、各レンダリング方式を実際に体験できるよう、それぞれに対応したページをもつ Next.js プロジェクトを

https://nextjs-ppr-demo.vercel.app/

にデプロイしてありますので、ブラウザの開発者ツールを開きながら各ページにアクセスし、動作を確認してみてください。対応するソースコードは以下のリポジトリに置いてあります:

https://github.com/morinokami/nextjs-ppr

### Vercel へのリクエストの全体像

Vercel 上にデプロイされた Next.js アプリケーションにブラウザなどを通じてアクセスしようとすると、最終的には HTML などのリソースが返却されますが、その過程では何が起こっているのでしょうか？ここでは、以下の議論に必要な範囲で Vercel へのリクエストの全体像について説明します。なお、この節の内容や画像は、全体的に以下の記事に依拠しています:

https://vercel.com/blog/life-of-a-vercel-request-what-happens-when-a-user-presses-enter

まず、ユーザーが特定の URL をブラウザのアドレスバーに入力してエンターを押下するとリクエストが送信され、世界中に分散された PoP（Point of Presence）のなかから最適なものが選択されます。PoP に到達すると、Vercel のインフラである Edge Network へと入ります:

![](/images/astro-server-islands-vs-nextjs-ppr/pop_to_edge_network_dark.png)

Edge Network のなかでは、[Vercel Firewall](https://vercel.com/docs/security/vercel-firewall) によるセキュリティチェックが最初におこなわれます。これは、DDOS など不正なリクエストを遮断するためのプラットフォーム全体に及ぶファイアウォールと、特定の IP アドレスをブロックするようなアプリケーションごとのファイアウォールである [Web Application Firewall（WAF）](https://vercel.com/docs/security/vercel-waf)という二段階から構成されます。これらをパスすると、[Edge Middleware](https://vercel.com/docs/functions/edge-middleware) や [next.config.js](https://nextjs.org/docs/app/api-reference/next-config-js)などの設定ファイルにおける[リダイレクト](https://nextjs.org/docs/app/api-reference/next-config-js/redirects)や[リライト](https://nextjs.org/docs/app/api-reference/next-config-js/rewrites)による、いわゆるルーティング処理がおこなわれます:

![](/images/astro-server-islands-vs-nextjs-ppr/router_light-1.png)

ここからが本記事の内容に関わる重要な部分です。ルーティング処理を抜けると、リクエストは Vercel の [Edge Cache](https://vercel.com/docs/edge-network/caching) へと到達します。ここでは画像や HTML など、静的なリソースがキャッシュされており、キャッシュがヒットするとそれが即座に返却されます。キャッシュがヒットしなかった場合、またはキャッシュが Stale であった場合は、後続の Vercel Functions によるコンテンツ生成処理がおこなわれますが、生成結果はユーザーに返却されると同時に Edge Cache にキャッシュされます:

![](/images/astro-server-islands-vs-nextjs-ppr/edge_cache_dark.png)

リクエストの最終到達点が [Vercel Functions](https://vercel.com/docs/functions) です。Vercel Functions では [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) の実行やレンダリング処理などさまざまな処理がおこなわれ、特にレンダリング処理の場合はその結果である HTML を生成して返却します:

![](/images/astro-server-islands-vs-nextjs-ppr/functions_light-1.png)

駆け足での説明となりましたが、以上が Vercel へのリクエストの全体像です。Edge Cache と Vercel Functions は以下の説明においても登場するため、少なくともこれらについてはその呼び出し順序や役割などについて理解しておいてください。

### Next.js におけるレンダリング方式

[App Router](https://nextjs.org/docs/app) 以後の Next.js におけるレンダリング戦略は、以下の [3 つに大別](https://nextjs.org/docs/app/building-your-application/rendering/server-components)されます:

- Static Rendering
- Dynamic Rendering
- Streaming

これらに加え、Experimental な機能として Partial Prerendering が Next.js v14 において追加されました。PPR が本記事での主眼となりますが、その理解を深めるために、各方式について以下で順を追って説明していきます。その際、上でも述べたサンプルプロジェクトのコードを参照しますので、必要に応じて[ソースコード](https://github.com/morinokami/nextjs-ppr)を確認しながら読み進めてください。

#### Static Rendering

Static Rendering は、ビルド時または revalidate 後にページを静的に生成しておき、その結果を CDN へとキャッシュしておく方式です。Vercel にアプリケーションをデプロイした場合、Vercel Functions を経由せず Edge Cache から静的なファイルが直接返却されるため、最も高速なレンダリング方式であるといえます。ブログ記事や商品のマーケティングページなど、ユーザーごとに異なる動的なコンテンツを生成する必要がない場合に適しています。

Static Rendering されるページのコード例を見てみましょう。以下は、サンプルプロジェクトの `app/static/page.tsx` のコードです:

```tsx:app/static/page.tsx
import { SlowComponent } from "@/components/slow-component";

export const dynamic = "force-static";

export default function Static() {
  return (
    <>
      <h1>Static</h1>
      <SlowComponent />
    </>
  );
}
```

Next.js では、[Full Route Cache](https://nextjs.org/docs/app/building-your-application/caching#full-route-cache) によりデフォルトでページがキャッシュされますが、[`cookies`](https://nextjs.org/docs/app/api-reference/functions/cookies) や [`headers`](https://nextjs.org/docs/app/api-reference/functions/headers) などの [Dynamic API](https://nextjs.org/docs/app/building-your-application/caching#dynamic-apis) を使用するとその挙動がオプトアウトされます。上のコード例では、他のページと表示内容を揃えるために `SlowComponent` コンポーネントをレンダリングしていますが、これが `headers` を使用しているため、このページはそのままでは Static Rendering されません:

```tsx:components/slow-component.tsx
import { headers } from "next/headers";

export async function SlowComponent() {
  const headersList = await headers(); // Dynamic API
  const userAgent = headersList.get("user-agent") || "unknown";
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>🐢 ({userAgent})</div>;
}
```

そこで、このページのレンダリング方式を Static Rendering に変更するために [`dynamic`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic) 変数を `force-static` に設定しています。これにより、Dynamic API はこのページでは空の値を返すように変更され、その結果このページはキャッシュされるようになります。

このページは https://nextjs-ppr-demo.vercel.app/static からアクセスできますが、筆者の環境では概ね 50 ms 以下の時間で複数の静的ファイルがそれぞれダウンロードされます。ブラウザ上の見た目は以下のようになります:

![](/images/astro-server-islands-vs-nextjs-ppr/nextjs-ppr-static.png =110x)

上で述べたように、このページのビルド時には `headers` が呼ばれますが、`export const dynamic = "force-static";` の設定により空のオブジェクトが変えるため、SlowComponent の `userAgent` の値は `unknown` となります。上の画像においても「🐢 (unknown)」と表示されていることが確認でき、何度アクセスしても結果は変わらず、ビルド時に作成したキャッシュが返却され続けていることがわかります。

また、開発者ツールからもこのページが Edge Cache から返ってきていることを確認できます。Chrome の開発者ツールを開き、Network タブから `static` へのリクエストを選択すると、レスポンスヘッダーの `X-Vercel-Cache` が `HIT` に設定されているはずです:

![](/images/astro-server-islands-vs-nextjs-ppr/static-response.png)

同様の事実は Vercel の管理画面のログからも確認できます:

![](/images/astro-server-islands-vs-nextjs-ppr/static-vercel.png =395x)

#### Dynamic Rendering

#### Streaming

#### Partial Prerendering

https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering


## Server Islands

### Astro におけるレンダリング方式

https://docs.astro.build/en/guides/on-demand-rendering/
https://docs.astro.build/en/concepts/islands/
https://docs.astro.build/en/guides/server-islands/

#### Prerendering

#### On-demand Rendering

#### Server Islands

<!-- 従来の Client Island はレンダリングではなくインタラクションに関わるものであり、軸が異なるという考察 -->


## おわりに

