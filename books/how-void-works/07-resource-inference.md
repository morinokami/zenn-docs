---
title: "リソース推論とバインディング"
---

Void の公式ドキュメント「[What is Void?](https://void.cloud/guide/)」のページには、次のように書かれています:

> Import `db` from `void/db` to query your database. Void provides a local database during development and provisions one when you deploy.

つまり Void では、設定ファイルに「データベースを使う」と記述する必要はなく、モジュールをインポートするだけでリソースを使うことができるのです。このしくみをリソース推論（resource inference）と呼びます。この章では、KV を題材にして、リソース推論を chibivoid に実装していきます。

## この章のゴール

- ソースコードを解析して、必要なバインディングを推論する
- 推論結果から Worker の設定（`kv_namespaces`）を組み立てる
- `AsyncLocalStorage` を使って、どこからでも「今のリクエストの `env`」を読むことができるようにする
- `import { kv } from "chibivoid/kv"` により KV を使うことができるようにする

## 解決すべき 2 つの問題

`import { kv } from "chibivoid/kv"` と記述するだけで KV を使うことができるようにするには、次の 2 つの問題を解決する必要があります。

### 問題 1: どのバインディングが必要かを、起動前に知る（Node.js 側）

第 3 章の「Cloudflare Workers とは何か」で見たように、Worker のバインディングは設定で宣言するものであり、実行中に増やすことはできません。開発中も、Miniflare は起動時の設定に従って KV を用意します。つまり、アプリのコードを動かす前に、「このアプリは KV を使う」ということを知っておく必要があります。

### 問題 2: どこからでも `env` を取り出す（Worker 側）

KV のバインディングは、Worker の `fetch(request, env, ctx)` が呼ばれる際に、`env.KV` として渡されます。一方、`import { kv } from "chibivoid/kv"` の `kv` は、モジュールのトップレベルで作成された 1 つのオブジェクトです。では、`kv.get("key")` が呼ばれた際に、`kv` はどのようにして今のリクエストの `env.KV` を見つければよいのでしょうか。

それでは、この 2 つの問題を順に解決していきましょう。

## 問題 1: ソースコードからバインディングを推論する

1 つ目の問題は、第 5 章の「ステップ 3: エクスポートを『実行せずに』調べる」と同じ方法により解決できます。つまり、ソースコードを実行せずに解析し、`chibivoid/kv` をインポートしているファイルがあるかどうかを調べればよいのです。

Void のドキュメントの「[Resource Inference](https://void.cloud/reference/resource-inference)」のページによると、Void は次の 2 種類の書き方からリソースの利用を検出しています:

| バインディング | インポートによる検出 | `env` へのアクセスによる検出 |
| --- | --- | --- |
| `DB`（D1） | `import { db } from "void/db"` | `env.DB`/`c.env.DB` |
| `KV` | `import { kv } from "void/kv"` | `env.KV`/`c.env.KV` |
| `STORAGE`（R2） | `import { storage } from "void/storage"` | `env.STORAGE`/`c.env.STORAGE` |
| ... | ... | ... |

chibivoid では、このうち KV だけを扱います。まずは、推論の処理をまとめるディレクトリを作成しておきましょう:

```sh
mkdir -p packages/chibivoid/src/inference
```

次に、推論の処理をおこなう `inference/walk.ts` を作成します:

<!-- file: code/how-void-works/ch07/packages/chibivoid/src/inference/walk.ts -->
```ts:packages/chibivoid/src/inference/walk.ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseSync } from "vite";

/** アプリが必要としている Cloudflare リソース */
export type InferredBindings = {
  needsKV: boolean;
};

/** このインポートが見つかった場合は、このリソースが必要だと判断する */
const MODULE_BINDINGS: Record<string, keyof InferredBindings> = {
  "chibivoid/kv": "needsKV",
};

/** `env.KV` のようなアクセスが見つかった場合は、このリソースが必要だと判断する */
const ENV_BINDINGS: Record<string, keyof InferredBindings> = {
  KV: "needsKV",
};

/** スキャンするディレクトリ（Void の DEFAULT_SCAN_DIRS を縮めたもの） */
const SCAN_DIRS = ["routes", "middleware", "pages", "src"];
const SOURCE_RE = /\.(ts|tsx|js|jsx|mts|mjs)$/;

type AstNode = { type: string; [key: string]: unknown };

/** 1 ファイル分のソースコードから、必要なリソースを推論する */
export function inferBindingsFromSource(code: string, filename: string): InferredBindings {
  const result: InferredBindings = { needsKV: false };
  const parsed = parseSync(basename(filename), code);
  if (parsed.errors.length > 0) {
    return result;
  }

  // 1. インポート文を調べる（型だけのインポートは KV を使うことにならないため除く）
  for (const statement of parsed.module.staticImports) {
    const typeOnly =
      statement.entries.length > 0 && statement.entries.every((entry) => entry.isType);
    const key = MODULE_BINDINGS[statement.moduleRequest.value];
    if (key && !typeOnly) {
      result[key] = true;
    }
  }

  // 2. 構文木（AST）をたどって `env.KV`/`c.env.KV` のようなアクセスを探す
  visit(parsed.program as unknown as AstNode, (node) => {
    if (node.type !== "MemberExpression" || node.computed) {
      return;
    }
    const object = node.object as AstNode;
    const property = node.property as AstNode & { name?: string };
    const isEnv =
      (object.type === "Identifier" && object.name === "env") ||
      (object.type === "MemberExpression" && (object.property as AstNode).name === "env");
    const key = property.name ? ENV_BINDINGS[property.name] : undefined;
    if (isEnv && key) {
      result[key] = true;
    }
  });

  return result;
}

/** AST の全ノードを深さ優先でたどる、ごく簡単なビジター */
function visit(node: AstNode, callback: (node: AstNode) => void): void {
  callback(node);
  for (const value of Object.values(node)) {
    const children = Array.isArray(value) ? value : [value];
    for (const child of children) {
      if (child && typeof child === "object" && typeof (child as AstNode).type === "string") {
        visit(child as AstNode, callback);
      }
    }
  }
}

/**
 * 推論の対象になるソースファイルを列挙する。
 * ルーティングと違い、`_utils.ts` のような `_` で始まるヘルパーも含める
 * （ヘルパーの中で KV を使うこともあるため）。
 */
function listSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && SOURCE_RE.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => !/[\\/]node_modules[\\/]/.test(file));
}

/** プロジェクト全体をスキャンして、必要なリソースをまとめる */
export function inferProjectBindings(root: string): InferredBindings {
  const result: InferredBindings = { needsKV: false };
  for (const dir of SCAN_DIRS) {
    for (const file of listSourceFiles(join(root, dir))) {
      const found = inferBindingsFromSource(readFileSync(file, "utf8"), file);
      result.needsKV ||= found.needsKV;
    }
  }
  return result;
}
```
<!-- /file -->

`inferBindingsFromSource()` は、1 つのファイルについて、次の 2 つの方法によりリソースの利用を調べます。

### 1. インポート文を調べる

`parseSync()` が返す `module.staticImports` には、ファイルの中のすべてのインポート文が入っています。それぞれのインポート文の `moduleRequest.value` には、インポート元（`"chibivoid/kv"` など）が入っています。ただし、`import type { KVClient } from "chibivoid/kv"` のような型だけのインポートは数えません。`import type` は実行時には消えてしまい、`kv` を実際に使うことはないためです。

### 2. 抽象構文木をたどって `env.KV` を探す

`c.env.KV.get(...)` のように、`chibivoid/kv` を使わずに直接バインディングにアクセスするコードもあります。このようなアクセスを見つけるために、抽象構文木（AST）をたどります。AST は、ソースコードの構造を木で表わしたデータです。たとえば、`c.env.KV` の AST は次のようになります:

```
MemberExpression            ← c.env.KV
├── object: MemberExpression  ← c.env
│   ├── object: Identifier "c"
│   └── property: Identifier "env"
└── property: Identifier "KV"
```

`visit()` は、AST のすべてのノードを深さ優先でたどる、ごく単純な関数です。`inferBindingsFromSource()` は、`visit()` によりノードを 1 つずつ調べ、`MemberExpression`（`a.b` のようなプロパティへのアクセス）のうち、左側が `env` または `何か.env` で、右側が `KV` であるものを見つけた場合に、KV が必要だと判断します。

ここまでは、1 つのファイルについての処理です。プロジェクト全体については、`inferProjectBindings()` が `routes/`、`middleware/`、`pages/`、`src/` の下にあるすべてのソースファイルについて推論し、その結果をまとめます。

ファイルの列挙に、第 5 章の「ステップ 4: `routes/` をスキャンする」で作成した `listFiles()` ではなく、専用の `listSourceFiles()` を使っている点に注意してください。ルーティングでは `_` で始まるファイルを無視しましたが、`_utils.ts` のようなヘルパーの中で KV を使うこともあります。ヘルパーを見落とすと、バインディングが用意されずにエラーになってしまうため、推論では `_` で始まるファイルも含めてすべてのソースファイルを調べます。Void も、ルートとして扱うファイルを選ぶ処理（`packages/void/src/shared/convention-files.ts`）と、推論のためにファイルを集める処理（`packages/void/src/plugin-inference.ts`）を分けています。

### 推論結果を設定に反映する

続いて、`chibivoidPlugin()` の中で推論を実行し、その結果から Cloudflare のプラグインに渡す設定を組み立てます:

<!-- diff: code/how-void-works/ch06/packages/chibivoid/src/index.ts code/how-void-works/ch07/packages/chibivoid/src/index.ts -->
```diff ts:packages/chibivoid/src/index.ts
@@ -2,6 +2,7 @@
 import { join } from "node:path";
 import { cloudflare } from "@cloudflare/vite-plugin";
 import type { Plugin } from "vite";
+import { inferProjectBindings } from "./inference/walk.ts";
 import { routingPlugin } from "./plugin-routing.ts";
 import { compileWorkerEntry } from "./router/compile.ts";
 
@@ -22,6 +23,9 @@
   const entryPath = join(outDir, "entry.ts");
   writeFileSync(entryPath, compileWorkerEntry());
 
+  // ソースコードを静的解析して、必要な Cloudflare リソースを推論する
+  const bindings = inferProjectBindings(root);
+
   return [
     routingPlugin(root),
     ...cloudflare({
@@ -32,6 +36,8 @@
         name: readWorkerName(root),
         main: entryPath,
         compatibility_date: "2026-10-01",
+        // `chibivoid/kv` が使われていれば KV バインディングを追加する
+        kv_namespaces: bindings.needsKV ? [{ binding: "KV", id: "local" }] : [],
       },
     }),
   ];
```
<!-- /diff -->

この変更では、KV が必要な場合に、`kv_namespaces` に `{ binding: "KV", id: "local" }` を追加しています。第 3 章と同じく、ローカルの Miniflare では ID は何でもよいため、`id` には仮の値を入れています。Void もまったく同じ値（`id: 'local'`）を入れています。本物の ID はデプロイの際に作成します（第 12 章）。

推論は、`chibivoidPlugin()` が呼ばれた時点、つまり Vite が `vite.config.ts` を読み込む際におこなわれます。Cloudflare のプラグインは、ここで組み立てた設定により Miniflare を起動するため、推論はそれより前に済ませておく必要があります。開発サーバーであれば、`chibivoidPlugin()` が呼ばれるのは起動時の 1 回だけであるため、推論の結果は起動し直すまで変わりません。そのため、開発サーバーを起動した後で初めて `chibivoid/kv` を使い始めた場合は、開発サーバーを起動し直す必要があります（「動かしてみる」で確かめます）。

## 問題 2: どこからでも `env` を取り出す

続いては、Worker 側の問題です。chibivoid が何もしなければ、利用者は、ハンドラーが受け取った `env` を使う場所まで引数で渡していくことになります:

```ts
export const GET = defineHandler(async (c) => {
  const count = await getCount(c.env.KV); // 使う場所まで、ずっと引数で渡していく
});
```

これでも確実に動きますが、データベースやストレージを使うすべての関数に `env` を渡していくのは手間がかかります。そこで、chibivoid 側で、今のリクエストの `env` をどこからでも取り出すことができるようにします。その方法としては、次の 2 つの案が考えられます。

### 案 A: グローバル変数に保存する

Worker の `fetch` ハンドラーが呼ばれるたびに、`env` をグローバル変数に保存しておく方法です:

```ts
let currentEnv;
export default {
  fetch(request, env) {
    currentEnv = env; // ← 危ない
    return app.fetch(request, env);
  },
};
```

この方法は危険です。Workers は、isolate と呼ばれる 1 つの実行単位で、複数のリクエストを並行して処理することがあります。そのため、リクエスト A の処理が `await` で待っている間にリクエスト B が来ると、`currentEnv` が B の値で上書きされ、A の続きの処理が B の `env` を使ってしまうおそれがあります。Cloudflare のドキュメントの「[Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#do-not-store-request-scoped-state-in-global-scope)」のページでも、リクエストごとの状態をグローバルスコープに保存してはいけないと説明されています。

### 案 B: `AsyncLocalStorage` を使う

[`AsyncLocalStorage`](https://developers.cloudflare.com/workers/runtime-apis/nodejs/asynclocalstorage/) は Node.js 由来の API で、「非同期の処理の流れ」ごとに値を保存することができます。たとえば、次のように使います:

```ts
const storage = new AsyncLocalStorage();

storage.run(envA, async () => {
  await somethingSlow();
  storage.getStore(); // ← 必ず envA が返る。途中で別の run が始まっても混ざらない
});
```

`storage.run(値, 関数)` の中で実行された処理は、その先で `await` をまたいだ場合でも、`storage.getStore()` により同じ値を取り出すことができます。並行して実行されている別の `storage.run()` の値と混ざることはありません。よって、リクエストごとに `storage.run()` を呼べば、「今のリクエストの `env`」をどこからでも安全に読むことができます。Void はこの方法を採用しており、chibivoid でもこの方法を使います。

`AsyncLocalStorage` は、Node.js と同じく `node:async_hooks` からインポートします。第 3 章の「Cloudflare Workers とは何か」で触れたように、chibivoid の `compatibility_date`（`2026-10-01`）では `nodejs_compat` が既定で有効になっているため、Workers でもこのモジュールを使うことができます。

### `runtime/env.ts`: リクエストごとの `env` を保存する

それでは、`AsyncLocalStorage` を使って、今のリクエストの `env` を保存しておく `runtime/env.ts` を作成しましょう:

<!-- file: code/how-void-works/ch07/packages/chibivoid/src/runtime/env.ts -->
```ts:packages/chibivoid/src/runtime/env.ts
import { AsyncLocalStorage } from "node:async_hooks";

type RuntimeEnv = Record<string, unknown>;

/**
 * 「今処理しているリクエストの env」を覚えておく入れ物。
 * AsyncLocalStorage を使うと、await をまたいでも、同時に来た別のリクエストと混ざらない。
 */
const envContext = new AsyncLocalStorage<RuntimeEnv>();

/** fn の実行中（その中の await の先も含む）は、getRuntimeEnv() が env を返すようになる */
export function withRuntimeEnv<T>(env: RuntimeEnv, fn: () => T): T {
  return envContext.run(env, fn);
}

export function getRuntimeEnv(): RuntimeEnv {
  const env = envContext.getStore();
  if (!env) {
    throw new Error("env: リクエストの処理中以外では、バインディングにアクセスできません");
  }
  return env;
}

/** 名前を指定してバインディングを取り出す。なければ、わかりやすいエラーにする */
export function requireRuntimeBinding<T>(name: string): T {
  const value = getRuntimeEnv()[name];
  if (value === undefined || value === null) {
    throw new Error(`env: Cloudflare のバインディング '${name}' がありません`);
  }
  return value as T;
}
```
<!-- /file -->

このファイルは、次の 3 つの関数をエクスポートしています:

- `withRuntimeEnv(env, fn)`: `env` を保存した状態で `fn` を実行する
- `getRuntimeEnv()`: 今のリクエストの `env` を返す。リクエストの外（`middleware/` のファイルのトップレベルなど）で呼ばれた場合はエラーにする
- `requireRuntimeBinding(name)`: `env` から指定された名前のバインディングを取り出す。見つからない場合は、わかりやすいエラーにする

### リクエストの処理全体を `withRuntimeEnv()` で包む

次に、Worker のエントリから呼ばれる `createWorkerFetch()` を変更し、リクエストの処理全体を `withRuntimeEnv()` で包みます:

<!-- diff: code/how-void-works/ch06/packages/chibivoid/src/runtime/routing.ts code/how-void-works/ch07/packages/chibivoid/src/runtime/routing.ts -->
```diff ts:packages/chibivoid/src/runtime/routing.ts
@@ -1,5 +1,6 @@
 // 生成されたルートテーブル（virtual:chibivoid-routes）と Worker エントリから呼ばれる実行時の関数。
 import type { Context, ExecutionContext, Hono } from "hono";
+import { withRuntimeEnv } from "./env.ts";
 import { convertReturnValue } from "./response.ts";
 
 type RouteModule = Record<string, ((c: Context) => unknown) | undefined>;
@@ -33,9 +34,13 @@
 
 type WorkerEnv = Record<string, unknown>;
 
-/** Hono アプリを Workers の `fetch` ハンドラーに変換する */
+/**
+ * Hono アプリを Workers の `fetch` ハンドラーに変換する。
+ * リクエストの処理全体を withRuntimeEnv で包むことで、
+ * `chibivoid/kv` などがどこからでも今のリクエストの env を読むことができるようになる。
+ */
 export function createWorkerFetch(app: Hono) {
   return (request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> => {
-    return Promise.resolve(app.fetch(request, env, ctx));
+    return withRuntimeEnv(env, async () => app.fetch(request, env, ctx));
   };
 }
```
<!-- /diff -->

これにより、ミドルウェアやルートのハンドラー、そしてそれらから呼ばれる関数のすべてが、今のリクエストの `env` を読むことができるようになります。

### `runtime/kv.ts`: KV クライアント

いよいよ、`chibivoid/kv` の本体である `runtime/kv.ts` を作成します:

<!-- file: code/how-void-works/ch07/packages/chibivoid/src/runtime/kv.ts -->
```ts:packages/chibivoid/src/runtime/kv.ts
// `import { kv } from "chibivoid/kv"` で使う KV クライアント。
import { requireRuntimeBinding } from "./env.ts";
import type { KVNamespaceLike } from "./handler.ts";

export type KVClient = {
  get<T = unknown>(key: string): Promise<T | null>;
  put(key: string, value: unknown, options?: { ttl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
};

/** 呼ばれるたびに「今のリクエストの」KV バインディングを取り出す */
function namespace(): KVNamespaceLike {
  return requireRuntimeBinding<KVNamespaceLike>("KV");
}

/** 値を JSON にして保存し、取り出す際に JSON から戻す KV クライアント */
export const kv: KVClient = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await namespace().get(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  },
  async put(key, value, options) {
    await namespace().put(
      key,
      JSON.stringify(value),
      options?.ttl ? { expirationTtl: options.ttl } : undefined,
    );
  },
  async delete(key) {
    await namespace().delete(key);
  },
};
```
<!-- /file -->

ここでは、`namespace()` が、呼ばれるたびに `requireRuntimeBinding("KV")` により今のリクエストのバインディングを取り出している点に注目してください。`kv` オブジェクト自体はモジュールのトップレベルで 1 つだけ作成されますが、KV のバインディングは `fetch` が呼ばれる際に `env` として渡されるものであるため、`kv` の中には保持しておきません。

また、`kv` は値を JSON にして保存し、取り出す際に JSON から元に戻しています。KV に保存できるのは文字列やバイト列であり、オブジェクトをそのまま保存することはできません。しかし、JSON にしておけば、数値やオブジェクトもそのまま扱うことができます。Void の `void/kv` も、値を JSON で保存します。

アプリのコードで `chibivoid/kv` からインポートできるように、`package.json` の `exports` に `./kv` を追加します:

<!-- diff: code/how-void-works/ch06/packages/chibivoid/package.json code/how-void-works/ch07/packages/chibivoid/package.json -->
```diff json:packages/chibivoid/package.json
@@ -5,6 +5,7 @@
   "type": "module",
   "exports": {
     ".": "./src/index.ts",
+    "./kv": "./src/runtime/kv.ts",
     "./runtime/*": "./src/runtime/*.ts"
   },
   "dependencies": {
```
<!-- /diff -->

最後に、`runtime/handler.ts` で `c.env` に型を付けておきます。KV ネームスペースの型は、chibivoid が使う部分だけを自前で定義しています:

<!-- diff: code/how-void-works/ch06/packages/chibivoid/src/runtime/handler.ts code/how-void-works/ch07/packages/chibivoid/src/runtime/handler.ts -->
```diff ts:packages/chibivoid/src/runtime/handler.ts
@@ -2,8 +2,21 @@
 // `import { defineHandler } from "chibivoid"` は、Worker ではこのファイルに解決される。
 import type { Context, MiddlewareHandler, Next } from "hono";
 
-/** ハンドラーが受け取るコンテキスト（Hono の Context） */
-export type CloudContext = Context;
+/** KV ネームスペースのうち、chibivoid が使う部分だけの型 */
+export type KVNamespaceLike = {
+  get(key: string): Promise<string | null>;
+  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
+  delete(key: string): Promise<void>;
+};
+
+/** Worker に渡される `env`（バインディング）の型 */
+export type CloudBindings = {
+  KV: KVNamespaceLike;
+  [key: string]: unknown;
+};
+
+/** ハンドラーが受け取るコンテキスト（Hono の Context に Bindings の型を付けたもの） */
+export type CloudContext = Context<{ Bindings: CloudBindings }>;
 
 /**
  * ルートハンドラーを定義する。
```
<!-- /diff -->

## 動かしてみる

この章では、`index.ts` など、chibivoid 本体のコードを変更しました。そのため、開発サーバーを起動している場合は、いったん止めてから進めてください。

第 3 章の「ビルドとプレビュー」で見たように、ビルドの際には、Cloudflare のプラグインがデプロイ用の Worker の設定を `wrangler.json` として出力します。まずは、KV を使わない状態でビルドして、この設定を確かめておきましょう:

```sh
npm run build
node -e 'console.log(require("./playground/dist/chibivoid_worker/wrangler.json").kv_namespaces)'
# []
```

`kv_namespaces` は空で、KV のバインディングはありません。次に、開発サーバーを起動しておきます:

```sh
npm run dev
```

開発サーバーを起動したまま、KV を使うルートを追加してみましょう。「いいね」の数を数えるカウンターの API です:

<!-- file: code/how-void-works/ch07/playground/routes/api/counter.ts -->
```ts:playground/routes/api/counter.ts
import { defineHandler } from "chibivoid";
import { kv } from "chibivoid/kv";

export const GET = defineHandler(async () => {
  return { count: (await kv.get<number>("count")) ?? 0 };
});

export const POST = defineHandler(async () => {
  const count = ((await kv.get<number>("count")) ?? 0) + 1;
  await kv.put("count", count);
  return { count };
});
```
<!-- /file -->

ファイルを保存したら、開発サーバーを起動し直さずに、このルートにリクエストを送ってみましょう:

```sh
curl -i -X POST http://localhost:5173/api/counter
# HTTP/1.1 500 Internal Server Error
```

ルートは第 6 章のしくみにより追加されますが、開発サーバーは KV のバインディングがない設定のまま動いているため、レスポンスは 500 Internal Server Error になります。このとき、開発サーバーのターミナルには、`requireRuntimeBinding()` が投げたエラーが表示されるはずです:

```
Error: env: Cloudflare のバインディング 'KV' がありません
```

推論の結果を設定に反映させるために、開発サーバーをいったん止めて（Ctrl+C）起動し直し、もう一度リクエストを送ってみましょう:

```sh
curl -X POST http://localhost:5173/api/counter
# {"count":1}
curl -X POST http://localhost:5173/api/counter
# {"count":2}
curl http://localhost:5173/api/counter
# {"count":2}
```

カウンターの値が KV に保存され、`POST` のたびに増えていることがわかります。第 3 章と同じく、KV のデータはローカルに保存されているため、開発サーバーを再起動した場合でも値は残ります。

playground をもう一度ビルドすると、今度は KV のバインディングが設定に含まれているはずです:

```sh
npm run build
node -e 'console.log(require("./playground/dist/chibivoid_worker/wrangler.json").kv_namespaces)'
# [ { binding: 'KV', id: 'local' } ]
```

設定ファイルを 1 行も変更することなく、`import { kv } from "chibivoid/kv"` と記述するだけで、KV を使うことができるようになりました。

:::message
`routes/api/counter.ts` を消してビルドし直すと、KV のバインディングも設定から消えます。このように、推論には、アプリが実際に使っているリソースだけを用意することができるという利点があります。
:::

## まとめ

- Worker のバインディングは起動前に決まっている必要があるため、ソースコードを実行せずに解析して、必要なリソースを推論する
- 推論では、インポート文と、`env.KV` のような AST 上のアクセスの両方を調べる
- 推論結果から `kv_namespaces` などの設定を組み立てて、Cloudflare のプラグインに渡す。ローカルの開発では、ID は仮の値（`local`）で問題ない
- `AsyncLocalStorage` にリクエストごとの `env` を保存しておくと、モジュールのトップレベルで作成した `kv` のようなオブジェクトからでも、今のリクエストのバインディングを安全に使うことができる

## Void の実装

推論（`packages/void/src/inference/walk.ts`）は、chibivoid とほぼ同じ構造をしています。`inferBindingsFromSource()` は、インポート（静的なインポート、`export ... from`、引数が文字列リテラルの `import()`）と、`env.XXX` へのアクセス（分割代入の `const { KV } = c.env` も含む）を調べ、`needsD1`、`needsKV`、`needsR2`、`needsAI`、`needsQueues` などのフラグを返します。AST をたどる処理には、estree-walker を使っています。

スキャンするディレクトリとしては、`packages/void/src/plugin-inference.ts` の `DEFAULT_SCAN_DIRS` に、`routes`、`middleware`、`queues`、`pages`、`crons`、`email`、`durable-objects`、`src` の 8 つが定義されています。推論の結果は、`application-analysis.ts` によりアプリ全体の解析結果にまとめられ、プラグインやデプロイの処理で共有されます。

設定への反映は、`packages/void/src/plugin-worker-bindings.ts` の `mergeWorkerBindings()` がおこないます。KV のバインディングを追加する処理は、次のようになっています:

```ts
const kvName = bindingNames?.kv ?? 'KV';
const kv: Array<{ binding: string; id: string }> = [];
if (bindings.needsKV && !hasBinding(resolved.kv_namespaces, kvName)) {
  kv.push({ binding: kvName, id: 'local' });
}
```

利用者が `void.config.ts` に自分でバインディング（本物の ID など）を記述している場合はそちらを優先し、記述していない場合にだけ仮のバインディングを追加しています。また、`inference.bindings` という設定により、バインディングの名前を変えることもできます。

`env` の取り出しは、`packages/void/src/runtime/env/runtime.ts` と `env/raw.ts` が担当しています。`withRuntimeEnv()` と `requireRuntimeBinding()` という名前も、chibivoid と同じです。ただし、Void は `AsyncLocalStorage` を、`Symbol.for('void.envContext.v1')` をキーとして `globalThis` に保存しています。Vite の依存の事前バンドル（第 2 章の「HMR と依存の事前バンドル」）などにより同じモジュールが 2 回評価されても、同じ `AsyncLocalStorage` を使うためです。

Void は、`AsyncLocalStorage` を使うためのフラグも自動で追加します。`voidPlugin()` は、`packages/void/src/cli/wrangler.ts` の `normalizeWranglerCompatibilityFlags()` により、`compatibility_flags` に `nodejs_compat` も `nodejs_als` もなければ `nodejs_als` を追加します。認証、PostgreSQL や MySQL、Sandbox SDK を使うアプリでは、他の Node.js の API も必要になるため、代わりに `nodejs_compat` を追加します。`void init` が `void.config.ts` に書き込む `compatibility_date` は、既定では `2026-02-24`（`LATEST_KNOWN_COMPAT_DATE`）です。この日付は `nodejs_compat` が既定で有効になる `2026-08-04` より前であるため、Void では chibivoid と違って、`AsyncLocalStorage` を使うためにフラグが必要になります。

`void/kv`（`packages/void/src/runtime/kv/index.ts`）は、chibivoid と同じく値を JSON で保存し、`requireRuntimeBinding('KV')` によりネームスペースを取り出します。

また、Void には、開発サーバーを起動した後で新しいリソースの利用を見つけると、再起動を促すしくみ（`packages/void/src/index.ts` の `bindingWatchPlugin`）もあります。ターミナルに `New KV (void/kv) binding detected. Restart to apply.` と表示し、さらにブラウザにもトーストで通知します。

最後に、chibivoid にはない、Void の大事なしくみをもう 1 つ紹介しておきます。それは、ブラウザ用の環境において、`void/kv` や `void/db` などを空のスタブに差し替えるプラグイン（`plugin-client-stubs.ts` の `createClientStubsPlugin()`）です。このプラグインにより、ブラウザ用のコードから誤って `void/kv` などをインポートしてしまった場合でも、`node:async_hooks` などがブラウザ向けのバンドルに入り込まずに済みます。第 5 章の「ステップ 7: プラグインにつなぐ」で `chibivoid` のインポートを差し替えたのと同じく、`resolveId` により環境ごとにインポートの行き先を変えています。
