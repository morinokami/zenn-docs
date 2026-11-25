/**
 * ハンドラーの戻り値をウェブ標準の Response に変換する。
 *
 * - Response            → そのまま
 * - null/undefined      → 204 No Content
 * - 文字列              → text/html
 * - それ以外（オブジェクトなど） → JSON
 */
export function convertReturnValue(value: unknown): Response {
  if (value instanceof Response) {
    return value;
  }
  if (value === null || value === undefined) {
    return new Response(null, { status: 204 });
  }
  if (typeof value === "string") {
    return new Response(value, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  return Response.json(value);
}
