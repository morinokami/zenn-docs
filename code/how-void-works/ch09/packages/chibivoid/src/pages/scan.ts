import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectExports } from '../router/detect-exports.ts';
import { parseRouteFilename } from '../router/parse-filename.ts';
import { compareRouteSpecificity } from '../router/route-order.ts';
import { listFiles } from '../shared/list-files.ts';

export type PageDefinition = {
  /** URL パターン。例: "/users/:id" */
  pattern: string;
  params: string[];
  catchAll: boolean;
  /** ページを識別する ID（拡張子を除いたパス）。例: "users/[id]" */
  componentId: string;
  /** コンポーネントファイル（pages/ からの相対パス）。例: "users/[id].tsx" */
  componentPath: string;
  /** 対になるサーバーファイル。例: "users/[id].server.ts"（なければ null） */
  serverPath: string | null;
  /** サーバーファイルがエクスポートしているもの（"loader"/"action"） */
  methods: string[];
};

export type LayoutDefinition = {
  /** レイアウトを識別する ID。例: "layout"、"users/layout" */
  id: string;
  /** pages/ からの相対パス。例: "users/layout.tsx" */
  filePath: string;
  /** レイアウトが置かれたディレクトリ。例: ""、"users" */
  directory: string;
};

export type PageScanResult = {
  pages: PageDefinition[];
  layouts: LayoutDefinition[];
};

/** ページコンポーネントとして扱う拡張子（chibivoid は React だけに対応する） */
const COMPONENT_RE = /\.(tsx|jsx)$/;
/** `.server.ts` などのコンパニオンファイル */
const SERVER_RE = /\.server\.(ts|tsx|js|jsx|mts|mjs)$/;
const SERVER_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'mts', 'mjs'];
const PAGE_METHODS = new Set(['loader', 'action']);

/** pages/ をスキャンして、ページとレイアウトの一覧を返す */
export function scanPages(pagesDir: string): PageScanResult {
  const pages: PageDefinition[] = [];
  const layouts: LayoutDefinition[] = [];

  for (const file of listFiles(pagesDir)) {
    if (SERVER_RE.test(file) || !COMPONENT_RE.test(file)) {
      continue;
    }
    const componentId = file.replace(COMPONENT_RE, '');
    const segments = componentId.split('/');
    if (segments.at(-1) === 'layout') {
      layouts.push({ id: componentId, filePath: file, directory: segments.slice(0, -1).join('/') });
      continue;
    }

    // URL パターンの作り方は routes/ とまったく同じ
    const route = parseRouteFilename(file);
    const serverPath =
      SERVER_EXTENSIONS.map((ext) => `${componentId}.server.${ext}`).find((candidate) =>
        existsSync(join(pagesDir, candidate)),
      ) ?? null;
    const methods = serverPath
      ? detectExports(join(pagesDir, serverPath)).filter((name) => PAGE_METHODS.has(name))
      : [];

    pages.push({
      pattern: route.pattern,
      params: route.params,
      catchAll: route.catchAll,
      componentId,
      componentPath: file,
      serverPath,
      methods,
    });
  }

  pages.sort(compareRouteSpecificity);
  return { pages, layouts };
}

/**
 * ページに適用されるレイアウトの ID を、外側から順に返す。
 * 例: "users/[id]" → ["layout", "users/layout"]（存在するものだけ）
 */
export function resolveLayoutIds(page: PageDefinition, layouts: LayoutDefinition[]): string[] {
  const directories = [''];
  const segments = page.componentId.split('/').slice(0, -1);
  for (let i = 1; i <= segments.length; i++) {
    directories.push(segments.slice(0, i).join('/'));
  }
  return directories.flatMap((directory) =>
    layouts.filter((layout) => layout.directory === directory).map((layout) => layout.id),
  );
}
