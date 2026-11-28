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
