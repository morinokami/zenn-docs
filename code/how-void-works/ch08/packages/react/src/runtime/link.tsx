import type { AnchorHTMLAttributes } from 'react';

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** ページ間のリンク。今はまだ普通の <a>（第 9 章でクライアント遷移にする） */
export function Link(props: LinkProps) {
  return <a {...props} />;
}
