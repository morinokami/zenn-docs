export type RouteDefinition = {
  /** URL パターン（Hono の書式）。例: "/api/users/:id" */
  pattern: string;
  /** 動的パラメータの名前。例: ["id"] */
  params: string[];
  /** `[...slug]` のようなキャッチオールを含むか */
  catchAll: boolean;
  /** routes/（または pages/）からの相対パス。例: "api/users/[id].ts" */
  filePath: string;
  /** エクスポートされている HTTP メソッド。スキャナーが後から埋める */
  methods: string[];
};

/** ルートファイルとして扱う拡張子 */
export const ROUTE_FILE_RE = /\.(ts|tsx|js|jsx|mts|mjs)$/;

/**
 * routes/ からの相対パスを、URL パターンに変換する。
 *
 * 1. 拡張子を取る          api/users/[id].ts → api/users/[id]
 * 2. 末尾の index を取る   api/users/index   → api/users
 * 3. (group) を取り除く    (admin)/stats     → stats
 * 4. 動的セグメントを変換  [id] → :id、[...slug] → :slug{.+}
 * 5. 先頭に / を付ける
 */
export function parseRouteFilename(relativePath: string): RouteDefinition {
  const path = relativePath.replaceAll('\\', '/').replace(ROUTE_FILE_RE, '');

  const segments = path.split('/');
  if (segments.at(-1) === 'index') {
    segments.pop();
  }

  const params: string[] = [];
  let catchAll = false;
  const converted = segments
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .map((segment) => {
      if (segment.startsWith('[...') && segment.endsWith(']')) {
        const name = segment.slice(4, -1);
        params.push(name);
        catchAll = true;
        // Hono では `:name{.+}` で「残りのパス全部」にマッチする
        return `:${name}{.+}`;
      }
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const name = segment.slice(1, -1);
        params.push(name);
        return `:${name}`;
      }
      return segment;
    });

  return {
    pattern: '/' + converted.join('/'),
    params,
    catchAll,
    filePath: relativePath,
    methods: [],
  };
}
