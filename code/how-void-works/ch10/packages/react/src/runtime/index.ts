// `import { Link } from "@chibivoid/react"` でアプリから使う API。
import { useContext } from "react";
import { PageContext } from "./context.ts";

export { Form } from "./form.tsx";
export { Link } from "./link.tsx";

/** URL パラメータ（例: pages/users/[id].tsx の id） */
export function useParams(): Record<string, string> {
  return useContext(PageContext)?.params ?? {};
}

/** action のバリデーションエラー（フィールド名 → メッセージ） */
export function useErrors(): Record<string, string> {
  return useContext(PageContext)?.errors ?? {};
}
