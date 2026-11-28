import { useContext, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { RouterContext } from "./context.ts";

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/**
 * ページ間のリンク。普通の <a> として描画され、
 * JavaScript が動いていればクリックをインターセプトしてクライアント遷移にする。
 */
export function Link({ href, onClick, ...rest }: LinkProps) {
  const router = useContext(RouterContext);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    // 新しいタブで開く操作などは、ブラウザに任せる
    if (
      !router ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target
    ) {
      return;
    }
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) {
      return;
    }
    event.preventDefault();
    void router.visit(url.pathname + url.search);
  }

  return <a href={href} onClick={handleClick} {...rest} />;
}
