---
title: "型安全性: ルートの型生成と型付き fetch()"
---

Void の特徴の 1 つは、サーバーとクライアントの間で型がつながっていることです。たとえば、`routes/api/hello.ts` に次のような API ルートがあるとします:

```ts
// routes/api/hello.ts → GET /api/hello
import { defineHandler } from "void";

export const GET = defineHandler(() => {
  return { message: "Hello from Void" };
});
```

ブラウザのコードから [`void/client` の `fetch()`](https://void.cloud/guide/typed-fetch) によりこの API を呼び出すと、その戻り値には `GET` が返す値の型が付きます:

```ts
// ブラウザのコード
import { fetch } from "void/client";

const { message } = await fetch("/api/hello"); // message は string 型
```

そのため、API の戻り値を変更した際に、クライアントのコードがその変更に追従していなければ型エラーになります。この章では、このしくみを chibivoid に実装していきます。

## この章のゴール

- ファイル構成から、ルートのファイルの型を参照するだけの型定義を生成し、型の計算そのものは TypeScript に任せるという方針を理解する
- `declare module` によるモジュール拡張（module augmentation）を使用して、生成した型をライブラリの型にマージする
- パスとメソッドから戻り値の型が決まり、パラメータの渡し忘れも型エラーになる `fetch()` を作成する

## 型付き `fetch()` でできること

この章を終えると、chibivoid でも次のようなコードを記述することができるようになります:

```ts
import { fetch } from "chibivoid/client";

const hello = await fetch("/api/hello");
hello.message; // string

const user = await fetch("/api/users/[id]", { params: { id: 1 } });
const counter = await fetch("/api/counter", { method: "POST" });
counter.count; // number
```

そして、次のような誤ったコードは、型チェックによりエラーとなります:

```ts
hello.message.toFixed();
// error TS2551: Property 'toFixed' does not exist on type 'string'. Did you mean 'fixed'?

await fetch("/api/helo");
// error TS2345: Argument of type '"/api/helo"' is not assignable to parameter of type 'StaticPath'.

await fetch("/api/users/[id]");
// error TS2345: Argument of type '"/api/users/[id]"' is not assignable to parameter of type 'StaticPath'.
// （[id] のあるルートには params が必要）

await fetch("/api/hello", { method: "DELETE" });
// error TS2769: No overload matches this call.
//   The last overload gave the following error.
//     Type '"DELETE"' is not assignable to type '"GET"'.
```

## 方針: 型の計算は TypeScript に任せる

`fetch("/api/hello")` の戻り値の型を決めるには、「`/api/hello` への `GET` リクエストの結果は、`routes/api/hello.ts` の `GET` が返す値の型になる」という対応を、TypeScript に伝える必要があります。

この対応は、ルートのファイルの型を直接解析して求めることもできます。しかし、そのためにはコード生成の中で TypeScript のコンパイラーを動かし、ルートのファイルと、そこからインポートされるファイルの型をすべて解析する必要があり、処理が重くなってしまいます。そこで、Void は型を自分で解析するのではなく、ファイル構成から次のような型定義を生成し、型の計算そのものは TypeScript に任せています:

```ts
interface RouteMap {
  "/api/hello": {
    GET: { output: (typeof import("../routes/api/hello.ts"))["GET"]["__output"] };
  };
}
```

`output` に記述した型は、次の 3 つの部分からなります:

- [`typeof import("../routes/api/hello.ts")`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-9.html#import-types) は、指定したファイルのモジュールの型、つまりそのファイルがエクスポートしているものの型を表わします
- `["GET"]` は、モジュールの型から `GET` という名前でエクスポートされたものの型を取り出します。これは、`defineHandler()` が返した `TypedHandler<R>` 型です
- `["__output"]` は、第 8 章の「コア: loader の戻り値の型を取り出す」で用意した幽霊型のプロパティ `__output` から、ハンドラーの戻り値の型 `R` を取り出します

コード生成に必要な情報は、どのファイルがどの URL のどのメソッドを処理するのかということだけです。そしてこの情報は、第 5 章の「`routes/` をスキャンする」で作成した `scanApp()` のスキャン結果にすでに含まれています。つまり、ルートテーブルを生成するのと同じ情報から、型定義も生成することができます。

## モジュール拡張により型をマージする

では、生成した `RouteMap` を `chibivoid/client` の `fetch()` からどのように参照すればよいでしょうか。ライブラリのコードから、利用者のプロジェクトにある `.chibivoid/routes.d.ts` をインポートすることはできません。

そこで、TypeScript のモジュール拡張を使います。まずは、ライブラリの側に空のインターフェイス `RouteMap` を用意しておきます:

```ts
// chibivoid/routes
export interface RouteMap {}
```

そして、chibivoid が生成する `.chibivoid/routes.d.ts` の中で、`declare module` により `chibivoid/routes` の `RouteMap` にプロパティを追加する宣言をおこないます:

```ts
// .chibivoid/routes.d.ts（生成されるファイル）
export {};

declare module "chibivoid/routes" {
  interface RouteMap {
    "/api/hello": { GET: { output: { message: string } } };
  }
}
```

TypeScript では、同じモジュールの中に同じ名前のインターフェイスの宣言が複数ある場合、それらは 1 つのインターフェイスにまとめられます。これを宣言のマージ（[declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)）と呼びます。そして、`declare module "chibivoid/routes"` の中に記述した宣言は、`chibivoid/routes` というモジュールの中で宣言されたものとして扱われます。そのため、生成したファイルの `RouteMap` は、ライブラリの `RouteMap` と同じモジュールの中にある同じ名前のインターフェイスとなり、2 つの宣言は 1 つにマージされます。その結果、`chibivoid/routes` の `RouteMap` は、次のように宣言した場合と同じ型になります:

```ts
// chibivoid/routes（マージ後）
export interface RouteMap {
  "/api/hello": { GET: { output: { message: string } } };
}
```

これにより、`fetch()` は、`.chibivoid/routes.d.ts` をインポートすることなく、`RouteMap` を参照するだけで利用者のルートの型を知ることができます。

ただし、TypeScript が `.chibivoid/routes.d.ts` を読み込まなければ、宣言のマージはおこなわれません。TypeScript は、`tsconfig.json` の [`include`](https://www.typescriptlang.org/tsconfig/#include) に指定したファイルと、そこからインポートされるファイルを型チェックの対象として読み込みます。`.chibivoid/routes.d.ts` はどこからもインポートされないため、`include` に追加しておく必要があります。この設定は「型付き `fetch()` を使ってみる」でおこないます。

なお、生成するファイルの先頭にある `export {};` は省略することができません。トップレベルに `import` や `export` が 1 つもないファイルは、TypeScript から[モジュールではなくスクリプトとして扱われます](https://www.typescriptlang.org/docs/handbook/2/modules.html#how-javascript-modules-are-defined)。その場合、ファイルの中の `declare module "chibivoid/routes"` は、既存のモジュールの拡張ではなく、新しいモジュールの宣言になってしまいます。その結果、本物の `chibivoid/routes` の `RouteMap` は空のままになり、`fetch()` の呼び出しはすべて型エラーになります。

## 型定義の生成と型付き `fetch()` を実装する

### `runtime/routes.ts`: 拡張される空のインターフェイス

まずは、拡張される側の空のインターフェイス `RouteMap` を `runtime/routes.ts` に作成します:

<!-- file: code/how-void-works/ch11/packages/chibivoid/src/runtime/routes.ts -->
```ts:packages/chibivoid/src/runtime/routes.ts
/**
 * サーバールートの型の一覧。中身は空で、
 * 自動生成される `.chibivoid/routes.d.ts` が `declare module` でこのインターフェイスを拡張する（第 11 章）。
 *
 *   interface RouteMap {
 *     "/api/hello": { GET: { output: { message: string } } };
 *   }
 */
export interface RouteMap {}
```
<!-- /file -->

### `codegen/route-types.ts`: 型定義を生成する関数

次に、型定義を生成するコードを置くための `codegen/` ディレクトリを作成します:

```sh
mkdir -p packages/chibivoid/src/codegen
```

そして、`.chibivoid/routes.d.ts` の中身を生成する `generateRouteTypes()` を `codegen/route-types.ts` に作成します:

<!-- file: code/how-void-works/ch11/packages/chibivoid/src/codegen/route-types.ts -->
```ts:packages/chibivoid/src/codegen/route-types.ts
import { relative } from "node:path";
import type { ProjectPaths, ScanResult } from "../router/scan.ts";

/**
 * Hono の書式のパターンを、ファイル名と同じかたちに戻す。
 * 例: "/api/users/:id" → "/api/users/[id]"、"/docs/:slug{.+}" → "/docs/[...slug]"
 */
function publicPattern(pattern: string): string {
  return pattern.replace(/:(\w+)(\{\.\+\})?/g, (_match, name: string, catchAll?: string) =>
    catchAll ? `[...${name}]` : `[${name}]`,
  );
}

/**
 * `.chibivoid/routes.d.ts` の中身を生成する。
 *
 * 型を自分で解析するのではなく、`typeof import("...")` による参照だけを生成し、
 * 実際の型の計算は TypeScript に任せるのがポイント。
 */
export function generateRouteTypes(scan: ScanResult, paths: ProjectPaths, outDir: string): string {
  const lines: string[] = [
    "// chibivoid が自動生成したファイルです。編集しないでください。",
    // トップレベルにエクスポート文があると、生成するファイルは「モジュール」になり、
    // 下の `declare module` は既存のモジュールの「拡張」（augmentation）として扱われる。
    "export {};",
    "",
    "// JSON にした際の型（Date は文字列になり、関数は消える）",
    "type Serialize<T> =",
    "  T extends Date ? string :",
    "  T extends (...args: any[]) => any ? never :",
    "  T extends ReadonlyArray<infer U> ? Array<Serialize<U>> :",
    "  T extends object ? { [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: Serialize<T[K]> } :",
    "  T;",
    "",
    'declare module "chibivoid/routes" {',
    "  interface RouteMap {",
  ];

  for (const route of scan.routes) {
    // .chibivoid/ から見た相対パスで、ルートファイルをインポートする
    const importPath = relative(outDir, `${paths.routesDir}/${route.filePath}`).replaceAll(
      "\\",
      "/",
    );
    // キーは fetch() に渡すパスになるため、ファイル名と同じかたちにする
    lines.push(`    ${JSON.stringify(publicPattern(route.pattern))}: {`);
    for (const method of route.methods) {
      lines.push(
        `      ${method}: { output: Serialize<(typeof import(${JSON.stringify(importPath)}))[${JSON.stringify(method)}]["__output"]> };`,
      );
    }
    lines.push("    };");
  }

  lines.push("  }", "}", "");
  return lines.join("\n");
}
```
<!-- /file -->

`generateRouteTypes()` は、スキャン結果のルートごと、メソッドごとに、`typeof import(...)` を使った行を並べているだけです。インポートするパスは、生成するファイルを置く `.chibivoid/` ディレクトリからの相対パスにしています。

また、`RouteMap` のキーには、第 5 章の「ファイル名を URL パターンに変換する」で作成した Hono の書式のパターン（`/api/users/:id`）をそのまま使うのではなく、`publicPattern()` によりファイル名と同じかたちに戻したもの（`/api/users/[id]`）を使います。これは、利用者がこのキーを `fetch()` に渡すためです。この章では、`[id]` や `[...slug]` のようにセグメント全体を占め、名前が半角英数字と `_` で構成されるパラメータを扱います。

生成するファイルの先頭で定義している `Serialize<T>` は、値を JSON に変換してから元に戻した際の型を表わします。サーバーが返したオブジェクトは、JSON としてネットワークを通るため、たとえば `Date` はクライアントでは文字列になります。また、関数は JSON に変換されないため、消えてしまいます。`Serialize<T>` は、この変換を型の上で再現しています。

たとえば playground では、次のような `.chibivoid/routes.d.ts` が生成されます:

```ts
// chibivoid が自動生成したファイルです。編集しないでください。
export {};

// JSON にした際の型（Date は文字列になり、関数は消える）
type Serialize<T> = ...;

declare module "chibivoid/routes" {
  interface RouteMap {
    "/api/counter": {
      GET: { output: Serialize<(typeof import("../routes/api/counter.ts"))["GET"]["__output"]> };
      POST: { output: Serialize<(typeof import("../routes/api/counter.ts"))["POST"]["__output"]> };
    };
    "/api/hello": {
      GET: { output: Serialize<(typeof import("../routes/api/hello.ts"))["GET"]["__output"]> };
    };
    "/api/users/me": {
      GET: { output: Serialize<(typeof import("../routes/api/users/me.ts"))["GET"]["__output"]> };
    };
    "/api/users/[id]": {
      GET: { output: Serialize<(typeof import("../routes/api/users/[id].ts"))["GET"]["__output"]> };
    };
  }
}
```

### `codegen/write-if-changed.ts`: 内容が変わった場合にだけ書き込む関数

続いて、ファイルの内容が変わった場合にだけ書き込む `writeFileIfChanged()` を `codegen/write-if-changed.ts` に作成します:

<!-- file: code/how-void-works/ch11/packages/chibivoid/src/codegen/write-if-changed.ts -->
```ts:packages/chibivoid/src/codegen/write-if-changed.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * 内容が変わった場合だけファイルを書き出す。
 * 同じ内容を書き直すと、ファイル監視や TypeScript の再チェックが無駄に走ってしまうため。
 */
export function writeFileIfChanged(path: string, content: string): void {
  if (existsSync(path) && readFileSync(path, "utf8") === content) {
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}
```
<!-- /file -->

`writeFileIfChanged()` は、書き込む内容が既存のファイルと同じ場合は何もしません。ファイルを書き込むと、エディターの TypeScript がプロジェクトを再チェックしたり、Vite のファイル監視が反応したりするため、不要な書き込みを避けています。

### スキャンのたびに型定義を書き出す

そして、`plugin-routing.ts` の `rescan()` を変更し、ルートテーブルのためのスキャンと一緒に型定義も書き出すようにします。`rescan()` は、開発サーバーの起動時とビルドの開始時に呼ばれる `buildStart` フックと、第 6 章の「ファイルを監視してルートテーブルを作り直す」で追加したファイルの監視の処理の両方から呼び出されます。そのため、ルートを追加したり削除したりすると、型定義も即座に更新されます:

<!-- diff: code/how-void-works/ch10/packages/chibivoid/src/plugin-routing.ts code/how-void-works/ch11/packages/chibivoid/src/plugin-routing.ts -->
```diff ts:packages/chibivoid/src/plugin-routing.ts
@@ -1,6 +1,8 @@
 import { join } from "node:path";
 import { fileURLToPath } from "node:url";
 import { normalizePath, type Plugin } from "vite";
+import { generateRouteTypes } from "./codegen/route-types.ts";
+import { writeFileIfChanged } from "./codegen/write-if-changed.ts";
 import { compileRouteTable } from "./router/compile.ts";
 import { scanApp, type ProjectPaths, type ScanResult } from "./router/scan.ts";
 
@@ -22,11 +24,14 @@
     middlewareDir: normalizePath(join(root, "middleware")),
     pagesDir: normalizePath(join(root, "pages")),
   };
+  const outDir = join(root, ".chibivoid");
   let scan: ScanResult | undefined;
   let dev = false;
 
   function rescan(): ScanResult {
     scan = scanApp(paths);
+    // ルートの型定義 `.chibivoid/routes.d.ts` も一緒に更新する
+    writeFileIfChanged(join(outDir, "routes.d.ts"), generateRouteTypes(scan, paths, outDir));
     return scan;
   }
 
```
<!-- /diff -->

なお、ハンドラーの戻り値を変更しただけでは、`.chibivoid/routes.d.ts` は書き換わりません。ファイルを保存すると `rescan()` は呼ばれますが、生成される型定義にはルートのファイルへの参照が書かれているだけで、戻り値の型そのものは含まれていません。そのため、生成される内容は前回と同じになり、`writeFileIfChanged()` は何も書き込みません。それでも、クライアント側の型は戻り値の変更に追従します。TypeScript が、参照先のルートのファイルから戻り値の型を計算し直すためです。

### `runtime/fetch.ts`: 型付き `fetch()`

いよいよ、型付き `fetch()` を `runtime/fetch.ts` に作成します。実行時の処理は単純で、パスにパラメータの値を埋め込んで `globalThis.fetch()` を呼び出し、レスポンスの本文を返すだけです。工夫のほとんどは、型の部分にあります:

<!-- file: code/how-void-works/ch11/packages/chibivoid/src/runtime/fetch.ts -->
```ts:packages/chibivoid/src/runtime/fetch.ts
// `import { fetch } from "chibivoid/client"` で使う、型付きの fetch。
import type { RouteMap } from "./routes.ts";

type RoutePath = keyof RouteMap & string;
type MethodOf<P extends RoutePath> = keyof RouteMap[P] & string;
type OutputOf<P extends RoutePath, M extends string> = M extends keyof RouteMap[P]
  ? RouteMap[P][M] extends { output: infer O }
    ? O
    : unknown
  : unknown;

/** "/api/users/[id]" → "id" のように、パターンからパラメータ名を取り出す */
type ParamName<S extends string> = S extends `[...${infer Name}]`
  ? Name
  : S extends `[${infer Name}]`
    ? Name
    : never;
type ParamNames<P extends string> = P extends `${infer Head}/${infer Tail}`
  ? ParamName<Head> | ParamNames<Tail>
  : ParamName<P>;

/** パラメータのないルートと、あるルート */
type StaticPath = { [P in RoutePath]: [ParamNames<P>] extends [never] ? P : never }[RoutePath];
type DynamicPath = Exclude<RoutePath, StaticPath>;

type FetchOptions<M extends string> = {
  method?: M;
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * パスとメソッドから、レスポンスの型が自動で決まる fetch。
 *
 *   const { message } = await fetch("/api/hello");
 *   const user = await fetch("/api/users/[id]", { params: { id: 1 } });
 */
export function fetch<P extends DynamicPath, M extends MethodOf<P> = Extract<"GET", MethodOf<P>>>(
  path: P,
  options: FetchOptions<M> & { params: Record<ParamNames<P>, string | number> },
): Promise<OutputOf<P, M>>;
export function fetch<P extends StaticPath, M extends MethodOf<P> = Extract<"GET", MethodOf<P>>>(
  path: P,
  options?: FetchOptions<M>,
): Promise<OutputOf<P, M>>;
export async function fetch(
  path: string,
  options: FetchOptions<string> & { params?: Record<string, string | number> } = {},
): Promise<unknown> {
  const params = options.params ?? {};
  // "[id]" や "[...slug]" を実際の値で置き換える
  const url = path.replace(/\[(?:\.\.\.)?(\w+)\]/g, (_match, name: string) =>
    encodeURIComponent(String(params[name])),
  );
  const hasBody = options.body !== undefined;
  const response = await globalThis.fetch(url, {
    method: options.method ?? "GET",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`fetch: ${response.status} ${response.statusText} (${url})`);
  }
  if (response.status === 204) {
    return undefined;
  }
  const contentType = response.headers.get("Content-Type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}
```
<!-- /file -->

型の部分を順に見ていきましょう:

- `RoutePath` は、`RouteMap` のキー、つまりすべてのルートのパターンからなるユニオン型です（`"/api/hello" | "/api/users/[id]" | ...`）
- `MethodOf<P>` は、ルート `P` のメソッドからなるユニオン型です（`"GET" | "POST"` など）
- `OutputOf<P, M>` は、ルート `P` とメソッド `M` から `output` の型を取り出します
- `ParamNames<P>` は、テンプレートリテラル型によりパターンを `/` で分解し、`[` と `]` で囲まれた部分からパラメータ名を取り出します。たとえば、`"/api/users/[id]"` であれば `"id"` になります。`[...slug]` のようなパラメータの場合は、`...` を除いた `"slug"` を取り出します
- `StaticPath`/`DynamicPath` は、`RoutePath` をパラメータのないルートとあるルートに分けたものです

`fetch()` には 2 つのオーバーロードがあります。オーバーロードとは、同じ関数に対する、引数の型が異なる複数の宣言のことです。1 つ目のオーバーロードは、パラメータのあるルート（`DynamicPath`）のためのもので、`params` を含むオプションを必須にしています。一方、2 つ目のオーバーロードは、パラメータのないルート（`StaticPath`）のためのもので、オプション自体を省略することができます。

メソッドの型 `M` は、オプションの `method` から推論されます。`method` を省略した場合は、デフォルトの型である `Extract<"GET", MethodOf<P>>` が使われるため、そのルートが `GET` をエクスポートしていれば、`M` は `"GET"` になります。

最後に、`package.json` の `exports` に `./client` と `./routes` を追加し、`chibivoid/client` と `chibivoid/routes` からインポートできるようにします:

<!-- diff: code/how-void-works/ch10/packages/chibivoid/package.json code/how-void-works/ch11/packages/chibivoid/package.json -->
```diff json:packages/chibivoid/package.json
@@ -6,6 +6,8 @@
   "exports": {
     ".": "./src/index.ts",
     "./kv": "./src/runtime/kv.ts",
+    "./client": "./src/runtime/fetch.ts",
+    "./routes": "./src/runtime/routes.ts",
     "./pages": "./src/pages/index.ts",
     "./pages-protocol": "./src/pages/protocol.ts",
     "./pages-client": "./src/pages/client.ts",
```
<!-- /diff -->

## 型付き `fetch()` を使ってみる

### 生成した型定義を読み込ませる

それでは、playground で型付き `fetch()` を使ってみましょう。まずは、`.chibivoid/routes.d.ts` が型チェックの対象に入るように、playground の `tsconfig.json` の `include` に `.chibivoid/*.d.ts` を追加します:

<!-- diff: code/how-void-works/ch10/playground/tsconfig.json code/how-void-works/ch11/playground/tsconfig.json -->
```diff json:playground/tsconfig.json
@@ -13,5 +13,13 @@
     "erasableSyntaxOnly": true,
     "types": ["node"]
   },
-  "include": ["routes", "middleware", "pages", "src", "vite.config.ts", "../packages"]
+  "include": [
+    "routes",
+    "middleware",
+    "pages",
+    "src",
+    "vite.config.ts",
+    "../packages",
+    ".chibivoid/*.d.ts"
+  ]
 }
```
<!-- /diff -->

### 「いいね」ボタンを作成する

次に、第 9 章の「動かしてみる」でハイドレーションが成功したことを確かめるために追加したトップページのボタンを、第 7 章の「動かしてみる」で作成したカウンターの API を呼び出す「いいね」ボタンに変更します:

<!-- diff: code/how-void-works/ch10/playground/pages/index.tsx code/how-void-works/ch11/playground/pages/index.tsx -->
```diff tsx:playground/pages/index.tsx
@@ -1,15 +1,20 @@
 import { useState } from "react";
+import { fetch } from "chibivoid/client";
 import type { Props } from "./index.server.ts";
 
 export default function Home({ title, renderedAt }: Props) {
-  // ハイドレーションされると、このボタンが動くようになる
-  const [clicks, setClicks] = useState(0);
+  const [count, setCount] = useState<number | null>(null);
+
+  async function like() {
+    const result = await fetch("/api/counter", { method: "POST" });
+    setCount(result.count);
+  }
 
   return (
     <div>
       <h1>{title}</h1>
       <p>サーバーで描画した時刻: {renderedAt}</p>
-      <button onClick={() => setClicks(clicks + 1)}>クリック: {clicks}</button>
+      <button onClick={like}>いいね {count ?? ""}</button>
     </div>
   );
 }
```
<!-- /diff -->

`like()` は、`fetch()` により `/api/counter` に `POST` リクエストを送り、返ってきた `count` をボタンに表示します。このとき、`result.count` の型は `routes/api/counter.ts` の `POST` が返す `{ count: number }` から決まり、`number` になります。

この章では、`plugin-routing.ts` など、chibivoid 本体のプラグインのコードを変更しました。そのため、開発サーバーを起動している場合は、いったん止めてから起動し直してください:

```sh
npm run dev
```

開発サーバーを起動すると、`playground/.chibivoid/routes.d.ts` が生成されるはずです。ブラウザでトップページを開き、「いいね」ボタンをクリックしてみましょう。クリックするたびに、ボタンの数字が増えていくはずです。

### 型チェックを実行する

`.chibivoid/routes.d.ts` は、chibivoid のプラグインが `routes/` をスキャンした際に生成されます。スキャンがおこなわれるのは、開発サーバーやビルドを実行している間だけであるため、どちらも実行していない状態では、型定義がまだ生成されていなかったり、古いままになっていたりすることがあります。型定義が生成される前に型チェックをおこなうと、`RouteMap` が空のままであるため、`fetch()` の呼び出しがすべてエラーになってしまいます。そこで、playground の `typecheck` スクリプトを、先にビルドして型定義を生成してから型チェックをおこなうように変更しておきます:

<!-- diff: code/how-void-works/ch10/playground/package.json code/how-void-works/ch11/playground/package.json -->
```diff json:playground/package.json
@@ -6,7 +6,7 @@
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview",
-    "typecheck": "tsc --noEmit"
+    "typecheck": "vite build && tsc --noEmit"
   },
   "dependencies": {
     "@chibivoid/react": "*",
```
<!-- /diff -->

モノレポのルートで次のコマンドを実行して、playground の型チェックをおこないましょう:

```sh
npm run typecheck --workspace playground
```

型エラーが出力されなければ成功です。また、エディターで `pages/index.tsx` を開き、`fetch("` まで入力してみてください。ルートのパターンが補完の候補として表示されるはずです。

さらに、「型付き `fetch()` でできること」で見たような誤ったコードを記述して、もう一度 `typecheck` スクリプトを実行し、エラーになることも確かめてみましょう。また、`routes/api/counter.ts` の `POST` が返す `{ count }` を `{ total: count }` に変更すると、`pages/index.tsx` の `result.count` がエラーになるはずです。このように、サーバー側のコードの変更が、クライアント側のコードの型エラーとして現れます。

:::message
型定義を生成するためだけに、型チェックのたびにビルドをおこなうと、型チェックに時間がかかってしまいます。Void には、Vite を起動せずに `routes/` などのスキャンだけをおこなって型定義を生成する [`void prepare`](https://void.cloud/guide/type-safety#setup) というコマンドがあります。
:::

## まとめ

- コード生成では、型を自分で解析するのではなく、`typeof import("...")["GET"]["__output"]` のような参照だけを生成し、型の計算は TypeScript に任せる
- `declare module` によるモジュール拡張を使って、生成した `RouteMap` をライブラリの空のインターフェイスにマージする。そのためには、生成するファイルを `export {}` によりモジュールにしておく必要がある
- ルートテーブルと型定義は、どちらも同じスキャン結果から生成される
- 型付き `fetch()` は、テンプレートリテラル型によりパターンからパラメータ名を取り出し、オーバーロードによりパラメータの有無を区別する

## Void の実装

Void では、`packages/void/src/codegen/route-types.ts` の `generateRouteTypes()` が型定義を生成します。そのコメントには、「The codegen generates scaffolding only — never analyzes types itself.」と、この章の方針がそのまま書かれています。生成される `.void/routes.d.ts` の `RouteMap` は、各ルートの `input` と `output` の型をもちます。`input` は `defineHandler.withValidator()` のスキーマから決まる `body`、`query`、`params` の型で、`__validators` というもう 1 つの幽霊型のプロパティから取り出します。同じファイルには、他にもページの URL パラメータや action の入力の型などが生成されます。

これらの型のパターンも、chibivoid と同じく、ルートテーブルで使う Hono の書式のパターンを、ファイル名と同じかたち（`/api/users/[id]` など）に戻したものです。この変換は、`codegen/route-types.ts` の `publicRoutePattern()` がおこないます。

また、Void は、chibivoid のように `tsconfig.json` の `include` に型定義を追加するのではなく、`.void/tsconfig.json` を生成し、利用者の `tsconfig.json` に `"extends": "./.void/tsconfig.json"` によりこのファイルを継承してもらうことで、型定義を読み込ませています。`.void/tsconfig.json` は `codegen/project-tsconfig.ts` が生成します。

「型付き `fetch()` を使ってみる」で紹介した `void prepare` コマンドは、`cli/prepare.ts` と `codegen/prepare.ts` に実装されています。

型付き `fetch()` は、`packages/void/src/runtime/client/fetch.ts` に実装されており、`void/client` として公開されています。HTTP の処理には ofetch を使っています。必須の入力があるかどうかによってオーバーロードを分けるという考え方は、chibivoid と同じです。ただし、何を必須とみなすかについては異なります。Void で必須になるのは、`defineHandler.withValidator()` によりバリデーションスキーマを指定した `body`、`query`、`params` と、`GET` 以外のリクエストを送る際の `method` です。chibivoid とは異なり、パターンの `[id]` から `params` を必須にすることはしていないため、`withValidator()` を使っていないルートであれば、`fetch("/api/users/[id]")` のように `params` を省略した場合でも、型エラーになりません。
