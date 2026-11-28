import { join } from "node:path";
import { listFiles } from "../shared/list-files.ts";
import { detectHttpExports } from "./detect-exports.ts";
import { parseRouteFilename, ROUTE_FILE_RE, type RouteDefinition } from "./parse-filename.ts";
import { compareRouteSpecificity } from "./route-order.ts";

export type ProjectPaths = {
  routesDir: string;
};

export type ScanResult = {
  routes: RouteDefinition[];
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

export function scanApp(paths: ProjectPaths): ScanResult {
  return {
    routes: scanRoutes(paths.routesDir),
  };
}
