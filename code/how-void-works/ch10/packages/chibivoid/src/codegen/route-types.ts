import { relative } from 'node:path';
import type { ProjectPaths, ScanResult } from '../router/scan.ts';

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
    '// chibivoid が自動生成したファイルです。編集しないでください。',
    // トップレベルにエクスポート文があると、生成するファイルは「モジュール」になり、
    // 下の `declare module` は既存のモジュールの「拡張」（augmentation）として扱われる。
    'export {};',
    '',
    '// JSON にした際の型（Date は文字列になり、関数は消える）',
    'type Serialize<T> =',
    '  T extends Date ? string :',
    '  T extends (...args: any[]) => any ? never :',
    '  T extends ReadonlyArray<infer U> ? Array<Serialize<U>> :',
    '  T extends object ? { [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: Serialize<T[K]> } :',
    '  T;',
    '',
    "declare module 'chibivoid/routes' {",
    '  interface RouteMap {',
  ];

  for (const route of scan.routes) {
    // .chibivoid/ から見た相対パスで、ルートファイルをインポートする
    const importPath = relative(outDir, `${paths.routesDir}/${route.filePath}`).replaceAll('\\', '/');
    // キーは fetch() に渡すパスになるため、ファイル名と同じかたちにする
    lines.push(`    ${JSON.stringify(publicPattern(route.pattern))}: {`);
    for (const method of route.methods) {
      lines.push(
        `      ${method}: { output: Serialize<(typeof import(${JSON.stringify(importPath)}))[${JSON.stringify(method)}]["__output"]> };`,
      );
    }
    lines.push('    };');
  }

  lines.push('  }', '}', '');
  return lines.join('\n');
}
