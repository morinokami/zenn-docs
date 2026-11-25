import { useState } from "react";
import type { Props } from "./index.server.ts";

export default function Home({ title, renderedAt }: Props) {
  // ハイドレーションされると、このボタンが動くようになる
  const [clicks, setClicks] = useState(0);

  return (
    <div>
      <h1>{title}</h1>
      <p>サーバーで描画した時刻: {renderedAt}</p>
      <button onClick={() => setClicks(clicks + 1)}>クリック: {clicks}</button>
    </div>
  );
}
