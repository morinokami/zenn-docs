import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { parseSync } from "vite";

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

/**
 * ファイルを「実行せずに」解析して、エクスポートされている値の名前を列挙する。
 * Vite 8 が内部で使っている Oxc のパーサー（parseSync）は、
 * ESM のインポートとエクスポートの一覧（`module`）も一緒に返してくれる。
 */
export function detectExports(absPath: string): string[] {
  const code = readFileSync(absPath, "utf8");
  const { module, errors } = parseSync(basename(absPath), code);
  if (errors.length > 0) {
    return [];
  }
  const names: string[] = [];
  for (const statement of module.staticExports) {
    for (const entry of statement.entries) {
      // `export type { Foo }` のような型だけのエクスポートは実行時には存在しないため除く
      if (!entry.isType && entry.exportName.name) {
        names.push(entry.exportName.name);
      }
    }
  }
  return names;
}

/** `export const GET = ...` のような HTTP メソッド名のエクスポートだけを取り出す */
export function detectHttpExports(absPath: string): string[] {
  return detectExports(absPath).filter((name) => HTTP_METHODS.has(name));
}
