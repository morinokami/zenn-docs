// `import { fetch } from 'chibivoid/client'` で使う、型付きの fetch。
import type { RouteMap } from './routes.ts';

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
 *   const { message } = await fetch('/api/hello');
 *   const user = await fetch('/api/users/[id]', { params: { id: 1 } });
 */
export function fetch<P extends DynamicPath, M extends MethodOf<P> = Extract<'GET', MethodOf<P>>>(
  path: P,
  options: FetchOptions<M> & { params: Record<ParamNames<P>, string | number> },
): Promise<OutputOf<P, M>>;
export function fetch<P extends StaticPath, M extends MethodOf<P> = Extract<'GET', MethodOf<P>>>(
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
    method: options.method ?? 'GET',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
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
  const contentType = response.headers.get('Content-Type') ?? '';
  return contentType.includes('application/json') ? response.json() : response.text();
}
