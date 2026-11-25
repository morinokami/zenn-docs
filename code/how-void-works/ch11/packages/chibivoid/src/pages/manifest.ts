import { resolveLayoutIds, type PageScanResult } from "./scan.ts";

/**
 * ページとレイアウトのコンポーネントを「動的インポートする関数」の表と、
 * 各ページに適用するレイアウトの表を、JavaScript のソースコードとして生成する。
 * サーバー用のレンダラーとブラウザ用のエントリの両方に埋め込まれる。
 *
 *   const components = { "users/index": () => import("/abs/pages/users/index.tsx"), ... };
 *   const layoutTree = { "users/index": ["layout"], ... };
 */
export function generateComponentManifest(scan: PageScanResult, pagesDir: string): string {
  const load = (filePath: string) => `() => import(${JSON.stringify(`${pagesDir}/${filePath}`)})`;
  const lines: string[] = ["const components = {"];
  for (const page of scan.pages) {
    lines.push(`  ${JSON.stringify(page.componentId)}: ${load(page.componentPath)},`);
  }
  for (const layout of scan.layouts) {
    lines.push(`  ${JSON.stringify(layout.id)}: ${load(layout.filePath)},`);
  }
  lines.push("};");
  lines.push("const layoutTree = {");
  for (const page of scan.pages) {
    const layoutIds = resolveLayoutIds(page, scan.layouts);
    lines.push(`  ${JSON.stringify(page.componentId)}: ${JSON.stringify(layoutIds)},`);
  }
  lines.push("};");
  return lines.join("\n");
}
