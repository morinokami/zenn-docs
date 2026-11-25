import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import type { Plugin } from "vite";
import { inferProjectBindings } from "./inference/walk.ts";
import { routingPlugin } from "./plugin-routing.ts";
import { compileWorkerEntry } from "./router/compile.ts";

/** Worker のコードを動かす Vite 環境の名前（Void では `void_worker`） */
export const WORKER_ENVIRONMENT_NAME = "chibivoid_worker";

/**
 * chibivoid の Vite プラグイン。
 * Void の `voidPlugin()` と同じく「プラグインの配列」を返す。
 */
export function chibivoidPlugin(): Plugin[] {
  const root = process.cwd();
  const outDir = join(root, ".chibivoid");
  mkdirSync(outDir, { recursive: true });

  // Cloudflare プラグインは設定を解決する時点で `main` のファイルを必要とする。
  // そのため、どのフックよりも前（= chibivoidPlugin() が呼ばれた瞬間）にエントリを書き出しておく。
  const entryPath = join(outDir, "entry.ts");
  writeFileSync(entryPath, compileWorkerEntry());

  // ソースコードを静的解析して、必要な Cloudflare リソースを推論する
  const bindings = inferProjectBindings(root);

  return [
    routingPlugin(root),
    ...cloudflare({
      // Worker 用の Vite 環境に名前を付ける
      viteEnvironment: { name: WORKER_ENVIRONMENT_NAME },
      // wrangler.jsonc に記述する代わりに、設定をここで組み立てて渡す
      config: {
        name: readWorkerName(root),
        main: entryPath,
        compatibility_date: "2026-10-01",
        // `chibivoid/kv` が使われていれば KV バインディングを追加する
        kv_namespaces: bindings.needsKV ? [{ binding: "KV", id: "local" }] : [],
      },
    }),
  ];
}

/** package.json の name から Worker 名を作る */
export function readWorkerName(root: string): string {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { name?: string };
  const name = (pkg.name ?? "chibivoid-app")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return name || "chibivoid-app";
}

// アプリのコードから `import { defineHandler } from "chibivoid"` と記述することができるように再エクスポートする。
// （Worker の中ではこの index.ts ではなく runtime/handler.ts に差し替えられる）
export { defineHandler, defineMiddleware } from "./runtime/handler.ts";
export type { CloudContext, InferProps, TypedHandler } from "./runtime/handler.ts";
