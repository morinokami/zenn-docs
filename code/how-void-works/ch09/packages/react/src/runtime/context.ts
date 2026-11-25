import { createContext } from "react";
import type { PageObject, Router } from "chibivoid/pages-client";

/** クライアント遷移に使うルーター（サーバーでの描画中は null） */
export const RouterContext = createContext<Router | null>(null);

/** 今表示しているページのページオブジェクト */
export const PageContext = createContext<PageObject | null>(null);
