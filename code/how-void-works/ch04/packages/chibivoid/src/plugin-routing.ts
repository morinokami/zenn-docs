import type { Plugin } from "vite";
import { compileRouteTable } from "./router/compile.ts";

const VIRTUAL_ROUTES_ID = "virtual:chibivoid-routes";
const RESOLVED_VIRTUAL_ROUTES_ID = "\0" + VIRTUAL_ROUTES_ID;

/**
 * ルーティングを担当するプラグイン。
 * 今はまだ、固定の Hono アプリケーションを仮想モジュール `virtual:chibivoid-routes` として提供するだけ。
 */
export function routingPlugin(): Plugin {
  return {
    name: "chibivoid:routing",
    // Vite 本体の解決処理より先に動いてほしいため "pre"
    enforce: "pre",

    resolveId(id) {
      if (id === VIRTUAL_ROUTES_ID) {
        return RESOLVED_VIRTUAL_ROUTES_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ROUTES_ID) {
        return compileRouteTable();
      }
    },
  };
}
