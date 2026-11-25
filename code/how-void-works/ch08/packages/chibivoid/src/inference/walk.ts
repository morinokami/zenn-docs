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
