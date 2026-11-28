import { join } from "node:path";
import { scanPages, type PageScanResult } from "../pages/scan.ts";
import { listFiles } from "../shared/list-files.ts";
import { detectHttpExports } from "./detect-exports.ts";
import { parseRouteFilename, ROUTE_FILE_RE, type RouteDefinition } from "./parse-filename.ts";
import { compareRouteSpecificity } from "./route-order.ts";

export type ProjectPaths = {
  routesDir: string;
  middlewareDir: string;
  pagesDir: string;
};

export type MiddlewareDefinition = {
  /** middleware/ からの相対パス。例: "01.logger.ts" */
  filePath: string;
};

export type ScanResult = {
  routes: RouteDefinition[];
  middleware: MiddlewareDefinition[];
  pages: PageScanResult;
};

/** routes/ をスキャンして、ルート定義の一覧を、より具体的なルートが先に来るように並べて返す */
export function scanRoutes(routesDir: string): RouteDefinition[] {
  return listFiles(routesDir)
    .filter((file) => ROUTE_FILE_RE.test(file))
    .map((file) => ({
      ...parseRouteFilename(file),
      methods: detectHttpExports(join(routesDir, file)),
    }))
    .sort(compareRouteSpecificity);
}

/** middleware/ をスキャンする。`01.logger.ts` のような数字の接頭辞の順に並べる */
export function scanMiddleware(middlewareDir: string): MiddlewareDefinition[] {
  return listFiles(middlewareDir)
    .filter((file) => ROUTE_FILE_RE.test(file) && !file.includes("/"))
    .map((filePath) => ({ filePath }));
}

export function scanApp(paths: ProjectPaths): ScanResult {
  return {
    routes: scanRoutes(paths.routesDir),
    middleware: scanMiddleware(paths.middlewareDir),
    pages: scanPages(paths.pagesDir),
  };
}
