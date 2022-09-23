---
title: "Hono + Cloudflare Workers で URL shortener を作る"
emoji: "🪄"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["typescript", "cloudflare", "cloudflareworkers", "hono"]
published: false
---

# はじめに

2022 年 9 月 22 日、Vercel の DevRel である [Steven Tey](https://twitter.com/steventey) 氏が [dub.sh](https://dub.sh) という短縮 URL 生成サービスを公開しました:

https://dub.sh

裏側は Vercel の [Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions) + [Upstash Redis](https://upstash.com/) という組み合わせらしいのですが、サイトを訪れた際の第一印象が心地よかったため、自分も手を動かして URL shortener の簡易版を作りたくなってしまいました。ただ、まったく同じ構成で作成しても面白くないため、自分があまり触ったことがない技術を使うという縛りを設け、Edge 環境として [Cloudflare Workers](https://workers.cloudflare.com) を、データストアとして Workers からアクセス可能なキーバリューストアである [KV](https://www.cloudflare.com/products/workers-kv/) を、そしてルーティングを手軽におこなうために [Hono](https://honojs.dev/) を使用して実装しました。以下では、その実装の概要をチュートリアル的に説明していきます。

# Cloudflare Workers について

Cloudflare Workers は、CDN Edge 上で動作するサーバレスの JavaScript 実行環境です。Cloudflare Workers についてはインターネット上に多くの情報が既に存在するため詳しく述べることは割愛します。当たり前のことですが、公式のドキュメントが情報の質と量ともにもっとも充実していますので、詳しく知りたい場合、まずはそちらを参照することをおすすめします:

https://developers.cloudflare.com/workers/

# Hono について

Hono は [yusukebe](https://twitter.com/yusukebe) 氏により作成されている、Cloudflare Workers 上で動作可能な Web フレームワークです:

https://honojs.dev

公式サイトのトップページには

* Ultrafast
* Zero-dependencies
* Middleware
* TypeScript
* Multi-runtime

などの特徴があることが書かれています。Hono については既に Zenn に素晴らしい記事が存在していますので、気になる方はそちらをチェックすることをおすすめします:

* [Hono\[炎\]っていうイケてる名前のフレームワークを作っている](https://zenn.dev/yusukebe/articles/0c7fed0949e6f7): yusukebe 氏自身による Hono の紹介記事、ざっと読むだけで雰囲気をつかめます
* [Hono + Cloudflare Workers で REST API を作ってみよう](https://zenn.dev/azukiazusa/articles/hono-cloudflare-workers-rest-api): Hono を Cloudflare Workers 上で動かし REST API を作成する過程が詳細に記述されています、重厚です

# 作成対象

ここでは超簡易版の URL shortener を作成します。プロジェクトの名前は、shorten という単語を shorten して shtn とします^[s -> h -> t -> n と打鍵しやすいためこの名前にしています、深い意味は特にありません。]。UI はなく、与えられた URL からランダムな短縮文字列を作成し、そしてその文字列からもとの URL を復元する API を作成することだけを目指します。

作成するエンドポイントの定義は以下のようになります:

* `GET /`: `shtn` という文字列を返す (単なる動作確認用であり、省略可)
* `POST /api/links`: リクエストボディに含まれる URL をストアへ登録し、対応する短縮文字列を返す
* `GET /api/links/:key`: パスとして与えられた短縮文字列 `key` に対応する URL を返す

# 事前準備

まず、Cloudflare Workers のサイトにてアカウントを作成しておきましょう:

https://workers.cloudflare.com/

続いて、Cloudflare Workers のプロジェクトを作成するために、CLI ツールである `wrangler` をインストールします:

```sh
$ npm install -g wrangler
$ wrangler --version
 ⛅️ wrangler 2.1.6 
-------------------
```

この時点でプロジェクトの作成などは可能となっていますが、上で作成したアカウントにより認証をおこなっておきます^[ここでログインしない場合は、`wrangler dev --local` コマンドによりローカルで完結するかたちで開発を進めてください。]:

```sh
$ wrangler login
 ⛅️ wrangler 2.1.6 
-------------------
Attempting to login via OAuth...
Opening a link in your default browser: https://dash.cloudflare.com/oauth2/auth?response_type=code&client_id=...
```

Wrangler に諸々の権限を与えるかどうかをブラウザ上で確認されるため、問題なければ Allow を選択してください。無事ログインが完了していれば、`wrangler whoami` コマンドにより、ログインしたアカウントの情報が表示されますので、そちらも確認しておきましょう。

# URL Shortener の実装

## プロジェクトの作成

以下のコマンドにより、プロジェクトを作成します:

```sh
$ wrangler init shtn
```

以下のコマンドにより、サーバが問題なく起動するどうか確認します:

```sh
$ cd shtn
$ wrangler dev
 ⛅️ wrangler 2.1.6
-------------------
Retrieving cached values for userId from node_modules/.cache/wrangler
⬣ Listening at http://0.0.0.0:8787
Total Upload: 0.19 KiB / gzip: 0.16 KiB
```

サーバが起動したら、レスポンスがきちんと返るかどうか確認します:

```sh
$ curl http://localhost:8787
Hello World!
```

ここまでで問題がなければ、準備は完了です。

## 簡易版の実装

まず、KV を使用せずダミーのストアを用いて簡易版の URL shortener を作成しましょう。

プロジェクトで使用するパッケージをインストールします^[[nanoid](https://github.com/ai/nanoid) はランダムな文字列を作成するために使用します。]:

```sh
$ npm install hono nanoid
```

これで Hono が使用できるようになったはずですので、`src/index.ts` を以下のように編集します:

```typescript
import { Hono } from 'hono'
const app = new Hono()

app.get('/', (c) => c.text('Hono!!'))

export default app
```

http://localhost:8787 にアクセスし、

```sh
Hono!!
```

と表示されていれば問題ありません。

上のプログラムからわかるように、Hono では `app.get` や `app.post` などのメソッドにより Route を登録します。最初の引数にはパスを、2 番目の引数にはハンドラを指定します。ハンドラの引数には `Context` が渡されます。`Context` にはリクエストに関する情報やレスポンスを返すためのメソッドが含まれています。他のフレームワークに触れたことがあればパット見で雰囲気をつかめるように API が設計されており、入門しやすい印象です。

### `GET /`

それでは、上のプログラムを改造して目的の API を作成していきます。まず、`/` にアクセスすると `shtn` という文字列を返すようにします:

```typescript
app.get('/', (c) => c.text('shtn'))
```

これは文字列を置き換えるだけなので簡単でした。

### `POST /api/links`

次に、与えられた URL に対して短縮文字列を生成し、それを URL と関連付けて保存した上で、短縮文字列を返す API を `/api/links` に定義します。ここではまだ KV を使用しないため、次のようなオブジェクトを変数としてメモリ上に保持して KV の代わりとします:

```typescript
const store: {
  [key: string]: { url: string; createdAt: number } | undefined
} = {}
```

また、ランダムな文字列を生成するために nanoid を初期化しておきます^[nanoid の使用法は上述した dub.sh のコードを参考にしています。]:

```typescript
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7,
)
```

`customAlphabet` により、英数字 62 文字 から 7 桁の文字列を生成する関数を作成しています。最後に、`/api/links` へと POST した際の挙動を定義します^[なお、この実装では「キーの衝突」や「URL の重複」など、短縮 URL 生成において一般に生じる問題への対策はおこなっていません。あくまで簡易版としての実装のため、その点はご了承ください。]:

```typescript
function shorten(url: string) {
  const key = nanoid()
  const createdAt = Date.now()
  store[key] = { url, createdAt }
  return { key }
}

app.post('/api/links', async (c) => {
  const { url } = await c.req.json<{ url: string }>()
  if (!url) {
    return c.text('Missing url', 400)
  }
  const { key } = shorten(url)
  return c.json({ key, url })
})
```

リクエストの Body を JSON としてパースし、`url` が存在しなければ 400 を返すという簡単なバリデーションをおこないます。そして、与えられた URL に対応する短縮文字列を `shorten` 関数により生成し、それをクライアントへと返します。`shorten` の内部では、`store` への書き込みもおこなっています。

以上により、与えられた URL に対して短縮文字列を返すような API を作成することができました。ローカルで動作確認すると、次のようなレスポンスが変えるはずです:

```sh
$ curl --request POST \
  --url http://localhost:8787/api/links \
  --header 'Content-Type: application/json' \
  --data '{ "url": "https://example.com" }'
{"key":"j8T0DOc","url":"https://example.com"}
```

実際のサービスでは、この API の結果を受け取ったプログラムは、たとえば `https://shtn.io/j8T0DOc` のようなかたちで、`key` の値を用いて短縮 URL をユーザーに表示するはずです。そしてこの短縮 URL へとアクセスしたユーザーは、もとの URL へとリダイレクトされるはずです。よって次に、このリダイレクトをおこなうプログラムが使用するであろう、短縮文字列をもとの URL へと戻すための API の作成に取り掛かります。

### `GET /api/links/:key`

上で取得した `key` をもとに対応する URL を取得するためのエンドポイントを定義しましょう。内容は以下のようになります:

```typescript
function getUrl(key: string) {
  return store[key]
}

app.get('/api/links/:key', (c) => {
  const key = c.req.param('key')
  const res = getUrl(key)
  if (!res) {
    return c.notFound()
  }
  return c.json({ key, url: res.url })
})
```

`getUrl` により対応する URL を取得し、それをレスポンスとして返します。URL が存在しない場合は 404 を返すようにしておきます。動作確認してみると、次のような結果となるはずです:

```sh
$ curl --request GET \
  --url http://localhost:8787/api/links/j8T0DOc
{"key":"j8T0DOc","url":"https://example.com"}
$ curl --request GET \
  --url http://localhost:8787/api/links/missing
404 Not Found
```

以上により、URL -> 短縮文字列、短縮文字列 -> URL という変換がおこなえるようになりました。続いて、ローカルの変数ではなくグローバルなキーバリューストアである KV へとデータを保存するようにしていきましょう。

## KV を使用した実装

まず、KV を使用するために KV namespace を作成します。namespace は、Production 用と開発時などの Preview 用に 2 つ作成します。ここでは `SHORT_URLS` という名前で作成していきます^[なお、以下で namespace の ID をそのまま記述していますが、これが問題のないことなのかどうか、自分はよくわかっていません。旧バージョンの Wrangler のコントリビュータであった [ashleygwilliams](https://github.com/ashleygwilliams) 氏が everything in a wrangler.toml is committable to publicly accessible version control と[述べている](https://github.com/cloudflare/wrangler/issues/209#issuecomment-541654484)こと、そして自分はクレジットカードを Cloudflare に紐づけていないことから、ここではそのまま公開していますが、これが本当に問題がないことかどうかはドキュメントを読んだ限りでは判断できませんでした。]:

```sh
$ wrangler kv:namespace create SHORT_URLS   
 ⛅️ wrangler 2.1.6 
-------------------
Retrieving cached values for account from node_modules/.cache/wrangler
🌀 Creating namespace with title "shtn-SHORT_URLS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SHORT_URLS", id = "99fc264e0c1a478c99f2ba10f7961f97" }
$ wrangler kv:namespace create SHORT_URLS --preview
 ⛅️ wrangler 2.1.6 
-------------------
Retrieving cached values for account from node_modules/.cache/wrangler
🌀 Creating namespace with title "shtn-SHORT_URLS_preview"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SHORT_URLS", preview_id = "f82a5b3e76d14d4d8f57c9c9b75956fe" }
```

続いて、これらの情報を `wrangler.toml` に次のように追記します:

```toml
kv_namespaces = [
  { binding = "SHORT_URLS", id = "99fc264e0c1a478c99f2ba10f7961f97", preview_id = "f82a5b3e76d14d4d8f57c9c9b75956fe" }
]
```

これで KV を使用する準備は整いました。しかし、KV は環境変数としてプログラムから使用されるため、TypeScript からアクセスし型の恩恵を受けるためにはもうひと手間必要です。次のように環境変数へとバインドされる型を定義し、Hono の初期化時にその情報を伝えてあげましょう:

```typescript
interface Env {
  SHORT_URLS: KVNamespace
}

const app = new Hono<{ Bindings: Env }>()
```

こうすることで、ハンドラ内の Context から `SHORT_URLS` という名前で KV にアクセスできるようになります。

`store` を KV に置き換えていきましょう。まずは URL 短縮の方から取り掛かります:

```typescript
async function shorten(kv: KVNamespace, url: string) {
  const key = nanoid()
  const createdAt = Date.now()
  await kv.put(key, JSON.stringify({ url, createdAt }))
  return { key }
}

app.post('/api/links', async (c) => {
  const { url } = await c.req.json<{ url: string }>()
  if (!url) {
    return c.text('Missing url', 400)
  }
  const { key } = await shorten(c.env.SHORT_URLS, url)
  return c.json({ key, url })
})
```

まず、`shorten` 内で `store[key]` として保存していたコードは、

```typescript
await kv.put(key, JSON.stringify({ url, createdAt }))
```

と、`KVNamespace` の `put` メソッドを使用して保存するように変更しています。`put` メソッドは、第一引数にキー、第二引数に値を受け取ります。`shorten` の第一引数には、

```typescript
const { key } = await shorten(c.env.SHORT_URLS, url)
```

と、`c.env` から `SHORT_URLS` を取得してそれを渡します。必要な変更はこれだけです。

さらに、短縮文字列から URL を復元する API については以下のように変更します:

```typescript
interface URL {
  url: string
  createdAt: number
}

async function getUrl(kv: KVNamespace, key: string) {
  return kv.get<URL>(key, 'json')
}

app.get('/api/links/:key', async (c) => {
  const key = c.req.param('key')
  const res = await getUrl(c.env.SHORT_URLS, key)
  if (!res) {
    return c.notFound()
  }
  return c.json({ key, url: res.url })
})
```

こちらに関しても、KV を直接操作する関数 `getUrl` に `SHORT_URLS` を渡している点と、`getUrl` 内部において `KVNamespace` の `get` メソッドを使用している点だけが変更点となります。

これらの変更により、これまで変数内に保存していたオブジェクトが KV によりグローバルに保存されるようになりました。ローカルで多少動作確認してから Cloudflare の[ダッシュボード](https://dash.cloudflare.com/) にアクセスし、Workers > KV から Preview 用の namespace を見てみると、値が保存されていることが確認できるはずです。

## 公開

作成したプロジェクトを公開するためには `publish` コマンドを実行します:

```sh
$ wrangler publish
 ⛅️ wrangler 2.1.6 
-------------------
Retrieving cached values for userId from node_modules/.cache/wrangler
Your worker has access to the following bindings:
- KV Namespaces:
  - SHORT_URLS: 99fc264e0c1a478c99f2ba10f7961f97
Total Upload: 33.34 KiB / gzip: 8.32 KiB
Uploaded shtn (0.69 sec)
Published shtn (0.21 sec)
  https://shtn.foo.workers.dev
```

これにより、https://shtn.foo.workers.dev を通じて API にアクセスすることができるようになります。

# まとめ

ここでは Hono を使って Cloudflare Workers 上に 短縮 URL 生成 API を作成しました。Hono は、ざっとドキュメントを確認した程度ですぐ試せるほどわかりやすく API が設計されていること、ドキュメントや Examples も小さくきれいにまとまっており全体像をつかみやすいこと、たとえば `c.req.param` の引数の指定でも補完が効くなどきちんと TypeScript に対応していること、などが印象に残りました。ここで紹介したような基本的な機能の実装においてはハマることはほぼなく、総じて印象が良かったです。また、Cloudflare Workers や KV についてもほぼ初めて使いましたが、Wrangler の使い心地の良さや、デプロイが爆速であること、インターネット上の情報もそこそこ充実していること、など、基本的に気持ちよく作業することができました。
