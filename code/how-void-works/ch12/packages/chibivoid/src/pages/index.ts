// フレームワークアダプター（@chibivoid/react など）の Vite プラグインが使う、Node.js 側の API。
export { createPagesPlugin, CLIENT_ENTRY_ID, RENDERER_ID } from "./plugin.ts";
export { generateComponentManifest } from "./manifest.ts";
export { scanPages, resolveLayoutIds } from "./scan.ts";
export type { PageDefinition, LayoutDefinition, PageScanResult } from "./scan.ts";
