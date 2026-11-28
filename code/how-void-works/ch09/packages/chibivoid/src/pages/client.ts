// ブラウザで動く、フレームワーク非依存のナビゲーションエンジン。
// React、Vue、Svelte、Solid のアダプターが共通で使う想定の部分。
import type { PageObject } from "./protocol.ts";

export type { PageObject };

export type VisitOptions = {
  /** false の場合は履歴を操作しない（戻る・進むボタンの場合） */
  history?: boolean;
};

export type Router = {
  /** URL のページをサーバーから取ってきて、画面を差し替える */
  visit(url: string, options?: VisitOptions): Promise<PageObject | undefined>;
};

/** サーバーが HTML に埋め込んだ、最初のページオブジェクトを読む */
export function readInitialPage(): PageObject {
  const element = document.getElementById("__CHIBIVOID_PAGE_DATA__");
  if (!element?.textContent) {
    throw new Error("pages: #__CHIBIVOID_PAGE_DATA__ が見つかりません");
  }
  return JSON.parse(element.textContent) as PageObject;
}

function currentUrl(): string {
  return location.pathname + location.search;
}

export function createRouter(options: {
  initialPage: PageObject;
  /** 新しいページオブジェクトが届いた際に呼ばれる（アダプターが画面を描き直す） */
  onPage: (page: PageObject) => Promise<void>;
}): Router {
  let latestVisit = 0;

  async function visit(url: string, visitOptions: VisitOptions = {}) {
    const { history: updateHistory = true } = visitOptions;
    const visitId = ++latestVisit;

    // 「HTML ではなくページオブジェクト（JSON）をください」という合図のヘッダー
    const response = await fetch(url, {
      headers: { "X-ChibivoidPages": "true", Accept: "application/json" },
    });
    if (visitId !== latestVisit) {
      // 待っている間に別の遷移が始まったため、この結果は捨てる
      return undefined;
    }
    if (response.headers.get("X-ChibivoidPages") !== "true") {
      // ページ以外（API のエラーなど）が返ってきた場合は、通常の画面遷移に切り替える
      location.href = response.url;
      return undefined;
    }

    const page = (await response.json()) as PageObject;
    await options.onPage(page);

    if (updateHistory) {
      if (page.url !== currentUrl()) {
        history.pushState({ chibivoidPage: true }, "", page.url);
      } else {
        history.replaceState({ chibivoidPage: true }, "", page.url);
      }
      window.scrollTo(0, 0);
    }
    return page;
  }

  history.replaceState({ chibivoidPage: true }, "");
  // ブラウザの「戻る」、「進む」では、その URL のページを取り直す
  window.addEventListener("popstate", () => {
    void visit(currentUrl(), { history: false });
  });

  return { visit };
}
