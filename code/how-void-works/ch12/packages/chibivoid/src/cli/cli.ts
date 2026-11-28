#!/usr/bin/env node
// `chibivoid` コマンドの入り口。Node.js が TypeScript をそのまま実行する（型注釈を取り除くだけ）。
import { parseArgs } from "node:util";
import { runDeploy } from "./deploy.ts";

// 知らないオプション（`--dryrun` のような打ち間違いも）はエラーにする
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { "dry-run": { type: "boolean", default: false } },
});
const [command] = positionals;
const root = process.cwd();

switch (command) {
  case "deploy":
    await runDeploy(root, { dryRun: values["dry-run"] });
    break;
  default:
    console.log("使い方: chibivoid deploy [--dry-run]");
    process.exitCode = command ? 1 : 0;
}
