import type { Props } from "./index.server.ts";

export default function Home({ title, renderedAt }: Props) {
  return (
    <div>
      <h1>{title}</h1>
      <p>サーバーで描画した時刻: {renderedAt}</p>
    </div>
  );
}
