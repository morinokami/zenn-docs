---
title: "Astro Actions により型安全な通信を実現する"
emoji: "🎬"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["astro"]
published: false
---

## はじめに

[Astro Actions](https://docs.astro.build/en/guides/actions/)（以下、基本的にアクションと呼びます）は、2024 年に Astro に追加された^[[v4.8](https://astro.build/blog/astro-480/#experimental-astro-actions) において実験的な機能として導入され、[v4.15](https://astro.build/blog/astro-4150/#stable-astro-actions) において安定版となりました。]、型安全にサーバーと通信をおこなうための新しい機能です。2024 年の Astro は、[DB](https://docs.astro.build/en/guides/astro-db/) の導入などサーバーサイドの機能を積極的に拡充してきた印象ですが、そうしたコンテクストにおいてサーバーと通信するための要としてアクションが追加されました。Astro では従来も[エンドポイント](https://docs.astro.build/en/guides/endpoints/)を定義してサーバーと通信することは可能でしたが、サーバーから返されるデータの型の扱いやサーバーサイドでのバリデーションなどをしっかりとおこなうためには、多くのボイラープレートコードを書く必要があります。アクションにより、こうしたボイラープレートコードが削減され、サーバーサイドのコードを型安全かつ手軽に実行できるようになりました^[ここまでの議論により Next.js の Route Handlers と Server Actions の関係を想起された方も多いと思いますが、実際 Server Actions と Astro Actions が解決する問題には共通点が少なくありません。]。

この記事では、アクションの基本についてまず紹介した上で、アクションを実際に作成して Astro コンポーネントや React コンポーネントなどから呼び出す方法について解説します。

なお、動画により概要を知りたいという方は、アクションの開発の中心を担ってきた Ben Holmes による、[Astro Together 2024](https://astro.build/blog/astro-together-montreal/) での解説動画を参照することをおすすめします。アクションを導入した動機や基本的な使い方、機能のデモに至るまで、アクションの全体像がコンパクトにまとめられています:

https://www.youtube.com/watch?v=VkYQMhit_04

## Astro Actions の基礎

上述したように、アクションはサーバーサイドのコードを型安全に呼び出すための機能です。アクションを使うと、以下のようなメリットを手軽に享受できます:

- [Zod](https://zod.dev/) による入力データのバリデーション
- アクションを呼び出すための型安全な関数の自動生成
- [isInputError](https://docs.astro.build/en/reference/modules/astro-actions/#isinputerror) 関数や [ActionError](https://docs.astro.build/en/reference/modules/astro-actions/#actionerror) 型により標準化されたエラーハンドリング

アクションを定義するには、`src/actions/index.ts` を作成し、そこから `server` オブジェクトを `export` します。`server` オブジェクトには、アクションの名前をキーとし、その実装を値として与えます。またアクションの実装は [`defineAction`](https://docs.astro.build/en/reference/modules/astro-actions/#defineaction) 関数を用いておこないます。以下は簡単なアクションを実装する例です^[https://docs.astro.build/en/reference/modules/astro-actions/ にあるコードを改変しました。]:

```ts:src/actions/index.ts
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const server = {
  // getGreeting アクションの定義
  getGreeting: defineAction({
    // クライアントから送信されるデータ型の定義
    input: z.object({
      name: z.string(),
    }),
    // getGreeting が呼び出された際に実行されるロジックの定義
    handler: async (input, context) => {
      return `Hello, ${input.name}!`;
    }
  })
}
```

`getGreeting: defineAction({ ... })` により、`getGreeting` という名前のアクションが定義されます。`defineAction` に渡すオブジェクトには、このアクションがクライアントから受け取るデータの型として `input` が、またアクションが呼び出された際に実行されるロジックとして `handler` が与えられています。

`handler` に与えられる引数は `input` と `context` です。`input` にはクライアントから送信されたデータが入っていますが、`handler` が実行される時点でこのデータは Zod によりバリデーションされているため、バリデーションのためのロジックをここに書く必要はありません。クライアントから送信されたデータがバリデーションに失敗した場合、`handler` は実行されず、エラーが自動的に返されます。また `context` には、エンドポイントを呼び出した際に渡される [APIContext](https://docs.astro.build/en/reference/api-reference/#endpoint-context) から一部のプロパティを除いたデータが含まれています（ここでは使用されていません）。`handler` の返り値は、そのままアクションの返り値となります。

ここで作成したアクションは、後述するように様々なクライアントから通常の関数のように呼び出すことができます。たとえば Astro コンポーネント内のボタンがクリックされた際にこのアクションを呼び出すには、以下のようにします:

```ts:src/components/GreetButton.astro
---
---

<button>挨拶する</button>

<script>
// getGreeting が定義された actions を import
import { actions } from "astro:actions";

const button = document.querySelector("button");
button?.addEventListener("click", async () => {
  // getGreeting の呼び出し
  const { data, error } = await actions.getGreeting({ name: "Actions" });
  // エラーがなければアラートを表示
  if (!error) alert(data);
})
</script>
```

まず `actions` オブジェクトをインポートしていますが、ここには `src/actions/index.ts` で定義した `getGreeting` アクションが自動的に含まれます。コード生成のためのコマンドの実行などのステップは必要ありません。続いてボタンのクリックイベントに対してイベントリスナーを登録し、その内部で `actions.getGreeting` を呼び出しています。アクションの定義時に用いた `input` によりこの関数には型が自動的に付与されているため、引数が誤っていれば警告が表示されます。さらに、エディター上で関数を `cmd + click` して定義にジャンプしたり、ホバーしてインプットの型を確認したりすることも可能です:

![型付けされた Action](/images/astro-actions-in-action/typed-action.png)

アクションの返り値となるオブジェクトには、`data` と `error` というプロパティが含まれています。`data` にはアクションの返り値が、`error` にはバリデーションエラーや `handler` 実行時のエラーが含まれます。エラーがなければ `data` にはアクションの返り値が入るため、ここではそれを `alert` により表示するようにしています。

最後に、アクションを使用するにはオンデマンドレンダリングを有効化する必要があるため、[`output: "server"`](https://docs.astro.build/en/basics/rendering-modes/#on-demand-rendered) を Astro の設定ファイルに記述しておきます。ここまでの準備の上で、このコンポーネントをページ内に配置しボタンをクリックすると、「Hello, Actions!」というアラートが表示されるはずです:

![Hello, Actions!](/images/astro-actions-in-action/hello-actions.png)

以上により、基本的なアクションの定義や呼び出し方について紹介しました。ところで、アクションは実際にはどのような仕組みによりサーバーと通信しているのでしょうか？まずは外形的にその挙動を確認するために、ブラウザの開発者ツールを使って通信内容を確認してみましょう。

ブラウザで先ほどのボタンを表示しているページを開き、開発者ツールのネットワークタブを表示しておきます。ここでボタンをクリックすると、以下のような POST リクエストが一度だけ送信されていることがわかります:

![Action リクエスト](/images/astro-actions-in-action/action-request.png)

Request URL から `/_actions/getGreeting` というエンドポイントが作成されていることがわかります。そしてペイロードには以下のような JSON が含まれています:

```json
{"name":"Actions"}
```

つまり、アクションの呼び出しとは、実は単なる POST リクエストの送信だということです。よって、たとえば以下のように `curl` コマンドを使ってアクションを呼び出すことも可能です:

```sh
curl -X POST -H 'Content-Type: application/json' -d '{"name":"Actions"}' http://localhost:4321/_actions/getGreeting
```

実際、アクションを呼び出している[ソースコード](https://github.com/withastro/astro/blob/bdc0890061533466da19660ff83a331a3136f6c4/packages/astro/templates/actions.mjs#L76-L99)を確認すると、以下のようになっています:

```ts
// When running client-side, make a fetch request to the action path.
const headers = new Headers();
headers.set('Accept', 'application/json');
let body = param;
if (!(body instanceof FormData)) {
  try {
    body = JSON.stringify(param);
  } catch (e) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: `Failed to serialize request body to JSON. Full error: ${e.message}`,
    });
  }
  if (body) {
    headers.set('Content-Type', 'application/json');
  } else {
    headers.set('Content-Length', '0');
  }
}
const rawResult = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/_actions/${path}`, {
  method: 'POST',
  body,
  headers,
});
```

このように具体的なソースコードからも、アクションの呼び出し時に `fetch` を使ってシンプルに POST リクエストを送信していることがわかります。よって、特別な配慮をせずとも、アクションの実装に含まれる環境変数などの秘匿すべき情報がクライアントに漏れることはありません。ここで抜粋したコード自体は今後変更される可能性があるため細かく追う必要はありませんが、アクションが実際には単なるサーバーサイドの API エンドポイントであるという点は留意しておいたほうがよいでしょう。

以上により、アクションの基本的な使い方や内部の仕組みについて理解できたと思います。次に、上の例よりも少しだけ複雑なアクションを作成し、エラーハンドリングやアクションを呼び出す複数の方法などについて見ていきましょう。


## Astro Actions ハンズオン

以下では、問い合わせフォームからデータを受け取るという想定でアクションを作成していきます。すぐに手元で動かせるようにリポジトリも用意していますので、必要に応じてそちらも参照してください:

https://github.com/morinokami/astro-actions-example

### アクションの作成

ここでは問い合わせフォームから以下のようなデータが送信されるとします。すべて必須のフィールドです:

- `name`: 名前
- `email`: メールアドレス
- `message`: メッセージ

実際のプロジェクトにおいては、これを受け取ったアクションは各データを DB に保存したり、受け付け完了メールを送信したりするはずです。しかし、ここでは簡単のために受け取ったデータをそのままログに出力するだけとしておきましょう。

このアクションは、成功した場合は成功メッセージを文字列として返すものとします。また、（実装はしていないものの）ビジネスロジックの失敗をシミュレートするため、意図的に半分の確率でエラーを返すようにしてみます。

大まかな仕様が決まったので実装に取り掛かりたいところですが、その前にアクションの整理の仕方について簡単に触れておきます。上で述べたように、アクションは `src/actions/index.ts` に直接定義できますが、アクションが増えるとこのファイルが肥大化し、管理が難しくなります。そうした事態を防ぐため、アクションを複数のファイルに分割して管理することが可能です。具体的には、`src/actions` ディレクトリ内に

```ts:src/actions/foo.ts
import { defineAction } from "astro:actions";

export const foo = {
  getFoo: defineAction({ ... }),
  createFoo: defineAction({ ... }),
  ...
}
```

のようなファイルを作成し、`src/actions/index.ts` で各アクションをまとめます:

```ts:src/actions/index.ts
import { foo } from './foo';

export const server = {
  foo,
  // その他のアクション
}
```

こうして定義された各アクションは、`actions` オブジェクトを通じて `actions.foo.getFoo` のように呼び出すことができます。

アクションを何らかの単位で分割して管理していくことは、ある程度複雑な実際のプロジェクトでは必須となるでしょう。分割の単位は様々考えられますが、Astro のドキュメントやサンプルコードなどでは、アクションの対象となるリソースを単位として分割することを推奨しているようです^[具体例については https://github.com/withastro/storefront などのリポジトリを確認してください。]。

ここで作成するアクションの数は一つだけであるため、分割をおこなう必要性は特にありませんが、雰囲気を出すために上のような構成としてみましょう。まずは `src/actions/contact.ts` を作成し、問い合わせ情報を受け付けるアクションの骨組みを定義します:

```ts:src/actions/contact.ts
import { defineAction } from "astro:actions";

export const contact = {
  add: defineAction({ /* TODO */ }),
};
```

`src/actions/index.ts` で `contact` オブジェクトをインポートし、`server` オブジェクトに追加します:

```ts:src/actions/index.ts
import { contact } from './contact';

export const server = {
  contact,
}
```

これで準備完了です。`contact.ts` においてアクションの実装に取り掛かりましょう。まずは、クライアントから送信されるデータの型を Zod により定義します:

```ts:src/actions/contact.ts
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const contact = {
  add: defineAction({
    input: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      message: z.string().min(1),
    }),
    // TODO: handler の実装
  }),
};
```

続いて `handler` の実装をおこないます。上で述べたように、ここでは半分の確率でエラーを返すようにします。アクションからエラーを `throw` する際は、`ActionError` を使うことが推奨されています。`ActionError` を使用するには、HTTP ステータスコードに対応する `code` と、エラーメッセージに対応する`message` を指定します。`ActionError` を使用することでステータスコードの指定ができ、またクライアント側でのエラーハンドリングも容易になるため、ここでも `ActionError` を使ってアクションにおけるエラーを表現します:

```ts:src/actions/contact.ts
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";

export const contact = {
  add: defineAction({
    input: z.object({ ... }),
    handler: async (input) => {
      // TODO: フォームの内容を保存し、メールを送信する
      console.log(input);

      // ランダムに失敗させる
      if (Math.random() < 0.5) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "サーバーエラー",
        });
      }

      // 成功メッセージを返す
      return "お問い合わせを受け付けました！";
    },
  }),
};
```

以上により、上で定めた仕様に沿ったアクションの定義が完了しました。最後に、ここではフォームから JSON ではなく FormData を送信するため、[`accept: "form"`](https://docs.astro.build/en/reference/modules/astro-actions/#use-with-accept-form) を `defineAction` に渡すオブジェクトに追加しておきます:

```ts:src/actions/contact.ts
export const contact = {
  add: defineAction({
    accept: "form",
    input: z.object({ ... }),
    handler: async (input) => { ... },
  }),
};
```

続いて、このアクションを呼び出すクライアント側のコードを、挙動を基本的に変えずに 3 パターン実装していきます。

### アクションの呼び出し - JavaScript

アクションを呼び出す最も基本的な方法は、上でも述べた Astro コンポーネント内の `<script>` タグ内から `actions` オブジェクトを経由して呼び出すというものです。たとえば以下のようなコードによりこれを実現できます:

```ts:src/pages/js.astro
<h1>問い合わせ</h1>
<form>
  <label>
    名前:
    <input type="text" name="name" />
  </label>
  <br />
  <label>
    Email:
    <input type="email" name="email" />
  </label>
  <br />
  <label>
    メッセージ:
    <textarea name="message"></textarea>
  </label>
  <br />
  <button type="submit">送信</button>
</form>

<script>
  import { actions, isInputError } from "astro:actions";

  const form = document.querySelector("form");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    // アクションの呼び出し
    const formData = new FormData(form);
    const { data, error } = await actions.contact.add(formData);

    // エラー処理
    if (error) {
      if (isInputError(error)) {
        alert("入力エラー");
      } else if (error.code === "INTERNAL_SERVER_ERROR") {
        alert(error.message);
      } else {
        alert("不明なエラー");
      }
      return;
    }

    // 成功時の処理
    alert(data);
  });
</script>
```

まず前半でフォームを定義し、`<script>` 内で `submit` イベントに対してイベントリスナーを登録しています。コールバック関数内ではフォームの内容を引数として `actions.contact.add` を呼び出し、エラーの場合はその旨を、成功の場合はアクションが返したメッセージをアラートで表示するようにしています。

ここで重要なことは、上で定義したアクションは

- 自動的に `throw` されるインプットのバリデーションエラー
- `INTERNAL_SERVER_ERROR` コードがセットされた `ActionError`
- その他のエラー

という 3 種類のエラーを発生させる可能性がある点です。コード内でも、各エラーに対する処理を分岐させています。

まずバリデーションエラーについては、Astro が用意してくれている [`isInputError`](https://docs.astro.build/en/reference/modules/astro-actions/#isinputerror) という便利関数があるため、それを使用して `error` オブジェクトをチェックしています。続いて `ActionError` については、`error.code` によりエラーの種類を判別します。ここでは `INTERNAL_SERVER_ERROR` が発生する可能性があるため、単純に文字列の比較によりチェックしています。これら以外のエラーについては想定外のエラーであるため、その場合は`"不明なエラー"` というメッセージを表示するようにしています。

以上のように、組み込みの `ActionError` を使用してアクションにおけるエラーを表現することにより、クライアント側でのエラーハンドリングに一定の秩序を与えることができます。また、`ActionError` に適切にエラーコードを設定することで、レスポンスの HTTP ステータスコードも対応するものが設定され、デバッグが容易になるなどのメリットがあるため、アクションにおいてエラーを扱う際には `ActionError` を積極的に使用していきましょう。

### アクションの呼び出し - React

React などの UI コンポーネントからアクションを呼び出すことも可能です。そのために特別な準備をする必要は特になく、以下のように `actions` オブジェクトをインポートして呼び出すだけで、先ほどの Astro コンポーネントと同様の処理となります:

```tsx:src/components/contact-form.tsx
import { actions, isInputError } from "astro:actions";

export function ContactForm() {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // アクションの呼び出し
    const form = event.currentTarget;
    const formData = new FormData(form);
    const { data, error } = await actions.contact.add(formData);

    // エラー処理
    if (error) {
      if (isInputError(error)) {
        alert("入力エラー");
      } else if (error.code === "INTERNAL_SERVER_ERROR") {
        alert(error.message);
      } else {
        alert("不明なエラー");
      }
      return;
    }

    // 成功時の処理
    alert(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        名前:
        <input type="text" name="name" />
      </label>
      <br />
      <label>
        Email:
        <input type="email" name="email" />
      </label>
      <br />
      <label>
        メッセージ:
        <textarea name="message"></textarea>
      </label>
      <br />
      <button type="submit">送信</button>
    </form>
  );
}
```

ところで、React 19 において [useActionState](https://react.dev/reference/react/useActionState) という Hook が追加されますが、この引数に Astro Actions を渡せるようにする [experimental_withState](https://astro.build/blog/astro-490/#react-19-support) という実験的な API も存在しています。興味があればリンク先の記事から使用法などを確認してみてください。

### アクションの呼び出し - HTML form action

これまでのアクションの呼び出しは、Astro コンポーネントにせよ React コンポーネントにせよ、JavaScript によりおこなわれていました。しかし、`<form>` 要素の `action` 属性にアクションを指定すれば、JavaScript なしで呼び出すことも可能です。

この場合、まずフォームの `method` 属性に `POST` を指定し、`action` 属性にアクションそのものを指定します。クライアントサイドの JavaScript を使用しないため、アクションの結果を処理するのはサーバーサイドとなりますが、その際は [`getActionResult`](https://docs.astro.build/en/reference/api-reference/#astrogetactionresult) 関数によりアクションの結果を取得できます:

```tsx:src/pages/form-action.astro
---
import { actions, isInputError } from "astro:actions";

const result = Astro.getActionResult(actions.contact.add);
let message = "";
if (result) {
  if (result.error) {
    if (isInputError(result.error)) {
      message = "入力エラー";
    } else if (result.error.code === "INTERNAL_SERVER_ERROR") {
      message = result.error.message;
    } else {
      message = "不明なエラー";
    }
  } else {
    message = result.data;
  }
}
---

<h1>問い合わせ</h1>
<form method="post" action={actions.contact.add}>
  <label>
    名前:
    <input type="text" name="name" />
  </label>
  <br />
  <label>
    Email:
    <input type="email" name="email" />
  </label>
  <br />
  <label>
    メッセージ:
    <textarea name="message"></textarea>
  </label>
  <br />
  <button type="submit">送信</button>
</form>

{
  message.length > 0 && (
    <script define:vars={{ message }}>alert(message)</script>
  )
}
```

このページを表示すると、初回はアクションを実行していないため `result` は `undefined` となります。その結果 `message` は空文字列のままであるため下部の `<script>` タグはページに追加されません。その後フォームの送信ボタンを押下するとアクションが実行され、このページが再度サーバーサイドでレンダリングされますが、この際は `result` に `data` や `error` オブジェクトが含まれるため、その結果に応じて `message` に適切なメッセージを代入できます。最後に、サーバーサイドの `message` をクライアントサイドの `<script>` に [`define:vars`](https://docs.astro.build/en/reference/directives-reference/#definevars) ディレクティブを使用して渡し、`alert` でメッセージを表示します。

注意点として、この方法ではフォームの送信時にページがリロードされるため、入力した値はその都度クリアされます。入力値を保持したい場合は、別途 [`transition:persist` ディレクティブを使用する](https://docs.astro.build/en/guides/actions/#preserve-input-values-on-error)必要があります。

この他にも、Action の完了後にリダイレクトさせたい場合には、`"/path" + actions.contact.add` のように[遷移先のパスをアクションと結合させて `action` 属性に指定する](https://docs.astro.build/en/guides/actions/#redirect-on-action-success)ことで可能となります。もちろんサーバーサイドで [Astro.redirect](https://docs.astro.build/en/reference/api-reference/#astroredirect) を呼んでも構いません。


## まとめ

以上見てきたように、Astro Actions により、従来のエンドポイントを使用する場合よりもより型安全かつ手軽にサーバーサイドのコードを呼び出すことが可能となりました。まだまだ発展途上の機能ではありますが、Zod による自動バリデーションやエラーハンドリングの標準化など、実際にサーバーサイドのコードを実行するために必要な抽象化が最低限整備されており、また素の JavaScript や Astro コンポーネントなど様々な方法でアクションを呼び出せるようになっているため、この記事で興味をもった方はぜひ自分のプロジェクトにアクションを取り入れてみてください。

## 参考

https://docs.astro.build/en/guides/actions/
https://docs.astro.build/en/reference/modules/astro-actions/
https://github.com/withastro/roadmap/blob/main/proposals/0046-actions.md
