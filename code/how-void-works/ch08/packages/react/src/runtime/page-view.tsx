// サーバーでの描画とブラウザでのハイドレーションの両方で使う、ページの組み立て部分。
import type { ComponentType, ReactNode } from 'react';
import type { PageObject, Router } from 'chibivoid/pages-client';
import { PageContext, RouterContext } from './context.ts';

type ComponentModule = { default: ComponentType<any> };
export type ComponentMap = Record<string, () => Promise<ComponentModule>>;
export type LayoutTree = Record<string, string[]>;

/** ページ 1 枚を描画するのに必要な、ページとレイアウトのコンポーネント */
export type PageModules = {
  Page: ComponentType<Record<string, unknown>>;
  layouts: ComponentType<{ children: ReactNode }>[];
};

/** ページオブジェクトの component ID から、ページとレイアウトのコンポーネントを読み込む */
export async function loadPageModules(
  page: PageObject,
  components: ComponentMap,
  layoutTree: LayoutTree,
): Promise<PageModules> {
  const load = async (id: string) => {
    const loader = components[id];
    if (!loader) {
      throw new Error(`pages: コンポーネント "${id}" が見つかりません`);
    }
    return (await loader()).default;
  };
  const [Page, ...layouts] = await Promise.all([
    load(page.component),
    ...(layoutTree[page.component] ?? []).map(load),
  ]);
  return { Page, layouts };
}

/** <Layout><Layout><Page {...props} /></Layout></Layout> を組み立てる */
export function PageView(props: { page: PageObject; modules: PageModules; router: Router | null }) {
  const { page, modules, router } = props;
  let element: ReactNode = <modules.Page {...page.props} />;
  // 内側のレイアウトから順に包んでいく
  for (const Layout of [...modules.layouts].reverse()) {
    element = <Layout>{element}</Layout>;
  }
  return (
    <RouterContext value={router}>
      <PageContext value={page}>{element}</PageContext>
    </RouterContext>
  );
}
