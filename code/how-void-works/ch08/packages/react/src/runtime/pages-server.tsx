// Worker の中で、ページを HTML 文字列に描画する。
import { renderToReadableStream } from "react-dom/server";
import { serializePageData, type AssetTags, type PageObject } from "chibivoid/pages-protocol";
import { loadPageModules, PageView, type ComponentMap, type LayoutTree } from "./page-view.tsx";

export async function renderReactPage(options: {
  pageObj: PageObject;
  assetTags: AssetTags;
  components: ComponentMap;
  layoutTree: LayoutTree;
}): Promise<string> {
  const { pageObj, assetTags, components, layoutTree } = options;
  const modules = await loadPageModules(pageObj, components, layoutTree);

  // Workers ではウェブ標準のストリームを返す renderToReadableStream を使う
  const stream = await renderToReadableStream(<PageView page={pageObj} modules={modules} />);
  // 簡単のため、全部描画し終わるのを待ってから文字列にする（Void はストリーミングで返す）
  await stream.allReady;
  const appHtml = await new Response(stream).text();

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${assetTags.head}
</head>
<body>
<script id="__CHIBIVOID_PAGE_DATA__" type="application/json">${serializePageData(pageObj)}</script>
<div id="app">${appHtml}</div>
${assetTags.body}
</body>
</html>`;
}
