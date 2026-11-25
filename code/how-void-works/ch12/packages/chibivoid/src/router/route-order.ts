type SegmentKind = "static" | "param" | "rest";

/** パターンの 1 セグメントが「固定文字列」、「:param」、「残り全部」のどれかを判定する */
function segmentKind(segment: string): SegmentKind {
  if (segment === "*" || segment.endsWith("{.+}")) {
    return "rest";
  }
  return segment.startsWith(":") ? "param" : "static";
}

const RANK: Record<SegmentKind, number> = { static: 0, param: 1, rest: 2 };

/**
 * 同じ URL にマッチしうる 2 つのルートのうち、より具体的なほうが先に来るように並べる。
 * Hono は「先に登録されたもの」から順に試すため、登録順がそのまま優先順位になる。
 *
 * - キャッチオールは最後
 * - 左から 1 セグメントずつ比べ、最初に種類が違ったところで決める（固定 > :param > 残り全部）
 */
export function compareRouteSpecificity(
  a: { pattern: string; catchAll: boolean },
  b: { pattern: string; catchAll: boolean },
): number {
  if (a.catchAll !== b.catchAll) {
    return a.catchAll ? 1 : -1;
  }
  const aSegments = a.pattern.split("/");
  const bSegments = b.pattern.split("/");
  const shared = Math.min(aSegments.length, bSegments.length);
  for (let i = 0; i < shared; i++) {
    const diff = RANK[segmentKind(aSegments[i])] - RANK[segmentKind(bSegments[i])];
    if (diff !== 0) {
      return diff;
    }
  }
  // それでも決まらなければ、短いほうを先に。最後は文字列順で安定させる
  if (aSegments.length !== bSegments.length) {
    return aSegments.length - bSegments.length;
  }
  return a.pattern < b.pattern ? -1 : a.pattern > b.pattern ? 1 : 0;
}
