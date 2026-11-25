import { createContext } from "react";
import type { PageObject } from "chibivoid/pages-protocol";

/** 今表示しているページのページオブジェクト */
export const PageContext = createContext<PageObject | null>(null);
