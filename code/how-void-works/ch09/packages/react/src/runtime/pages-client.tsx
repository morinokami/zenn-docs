// ブラウザで、サーバーが描画した HTML を React に引き継がせ（ハイドレーション）、
// 以後のページ遷移をクライアント側でおこなう。
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { createRouter, readInitialPage } from "chibivoid/pages-client";
import { loadPageModules, PageView, type ComponentMap, type LayoutTree } from "./page-view.tsx";

export async function startReactPages(options: {
  components: ComponentMap;
  layoutTree: LayoutTree;
}): Promise<void> {
  const { components, layoutTree } = options;

  // 1. サーバーが HTML に埋め込んだページオブジェクトを読み、同じコンポーネントを読み込む
  const initialPage = readInitialPage();
  const initialModules = await loadPageModules(initialPage, components, layoutTree);

  // 2. ルーター: 新しいページオブジェクトが届いた際に、そのページを描画し直す
  const router = createRouter({
    initialPage,
    async onPage(page) {
      const modules = await loadPageModules(page, components, layoutTree);
      // 画面の更新を同期的に確定させてから、履歴の更新やスクロールに進む
      flushSync(() => {
        root.render(<PageView page={page} modules={modules} router={router} />);
      });
    },
  });

  // 3. サーバーと同じものを描画して、既存の DOM を React に引き継がせる
  const root = hydrateRoot(
    document.getElementById("app")!,
    <PageView page={initialPage} modules={initialModules} router={router} />,
  );
}
