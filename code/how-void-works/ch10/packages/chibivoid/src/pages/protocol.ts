import type { Context } from "hono";
import { ValidationError } from "../runtime/handler.ts";

/**
 * サーバーからクライアントへ渡す「ページオブジェクト」。
 * 初回は HTML に埋め込まれ、クライアント遷移では JSON として返される。
 */
export type PageObject = {
  /** 描画するページコンポーネントの ID。例: "users/[id]" */
  component: string;
  /** loader が返した値（コンポーネントの props になる） */
  props: Record<string, unknown>;
  /** URL パラメータ。例: { id: "1" } */
  params: Record<string, string>;
  /** このページの URL（パス + クエリ） */
  url: string;
  /** action のバリデーションエラー（フィールド名 → メッセージ） */
  errors: Record<string, string> | null;
};

/** HTML に差し込む <script> などのタグ */
export type AssetTags = {
  /** <head> の中に入れるもの */
  head: string;
  /** <body> の最後に入れるもの */
  body: string;
};

/** フレームワークアダプターが提供する「ページを HTML 文字列にする関数」 */
export type RenderPage = (pageObj: PageObject, assetTags: AssetTags) => Promise<string>;

export type PageHandler = (c: Context) => unknown;

export type PageRouteOptions = {
  componentId: string;
  render: RenderPage;
  assets: (request: Request, env: unknown) => Promise<AssetTags>;
};

/** `<script type="application/json">` に安全に埋め込めるように JSON をエスケープする */
export function serializePageData(pageObj: PageObject): string {
  return JSON.stringify(pageObj).replace(/[<>&\u2028\u2029]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

/** クライアント遷移（fetch）からのリクエストかどうか */
function isPagesRequest(c: Context): boolean {
  return c.req.header("X-ChibivoidPages") === "true";
}

/**
 * ページオブジェクトを、リクエストに応じて JSON か HTML で返す。
 * 同じ URL でも中身が変わるため、キャッシュのために `Vary: X-ChibivoidPages` を付ける。
 */
async function respondWithPage(
  c: Context,
  pageObj: PageObject,
  options: PageRouteOptions,
): Promise<Response> {
  const headers = new Headers({ Vary: "X-ChibivoidPages" });
  if (isPagesRequest(c)) {
    headers.set("X-ChibivoidPages", "true");
    return Response.json(pageObj, { headers });
  }
  const html = await options.render(pageObj, await options.assets(c.req.raw, c.env));
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(html, { headers });
}

/** loader を実行して props を得る。Response（リダイレクトなど）が返された場合はそのまま返す */
async function runLoader(
  loader: PageHandler | undefined,
  c: Context,
): Promise<Response | Record<string, unknown>> {
  if (!loader) {
    return {};
  }
  const result = await loader(c);
  if (result instanceof Response) {
    return result;
  }
  return (result ?? {}) as Record<string, unknown>;
}

function createPageObject(
  c: Context,
  componentId: string,
  props: Record<string, unknown>,
  errors: Record<string, string> | null,
): PageObject {
  const url = new URL(c.req.url);
  return {
    component: componentId,
    props,
    params: c.req.param(),
    url: url.pathname + url.search,
    errors,
  };
}

/** GET: loader を実行し、ページを返す */
export async function handlePageGet(
  loader: PageHandler | undefined,
  c: Context,
  options: PageRouteOptions,
): Promise<Response> {
  const props = await runLoader(loader, c);
  if (props instanceof Response) {
    return props;
  }
  return respondWithPage(c, createPageObject(c, options.componentId, props, null), options);
}

/**
 * POST などの変更リクエスト: action を実行し、
 * - Response（リダイレクトなど）が返された場合はそれを返す
 * - ValidationError が投げられた場合は、loader をもう一度実行して、エラー付きでページを返す
 * - それ以外は loader をもう一度実行して、最新の props でページを返す
 */
export async function handlePageMutation(
  action: PageHandler,
  loader: PageHandler | undefined,
  c: Context,
  options: PageRouteOptions,
): Promise<Response> {
  if (!isSameOrigin(c.req.raw)) {
    return new Response("Cross-origin page actions are not allowed.", { status: 403 });
  }
  let errors: Record<string, string> | null = null;
  try {
    const result = await action(c);
    if (result instanceof Response) {
      return result;
    }
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw error;
    }
    errors = error.errors;
  }
  const props = await runLoader(loader, c);
  if (props instanceof Response) {
    return props;
  }
  const pageObj = createPageObject(c, options.componentId, props, errors);
  return respondWithPage(c, pageObj, options);
}

/** 別サイトのページから勝手にフォームを送信させる攻撃（CSRF）を防ぐ */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (origin !== null) {
    return origin === new URL(request.url).origin;
  }
  const site = request.headers.get("Sec-Fetch-Site");
  return !site || site === "same-origin" || site === "none";
}
