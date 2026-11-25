import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * ディレクトリ配下のファイルを再帰的に列挙する（スラッシュ区切りの相対パス）。
 * `_` や `.` で始まるファイル・ディレクトリは無視する。
 */
export function listFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).replaceAll("\\", "/"))
    .filter((file) => !file.split("/").some((segment) => /^[_.]/.test(segment)))
    .sort();
}
