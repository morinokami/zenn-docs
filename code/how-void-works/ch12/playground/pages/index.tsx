import { useState } from 'react';
import { fetch } from 'chibivoid/client';
import type { Props } from './index.server.ts';

export default function Home({ title, renderedAt }: Props) {
  const [count, setCount] = useState<number | null>(null);

  async function like() {
    const result = await fetch('/api/counter', { method: 'POST' });
    setCount(result.count);
  }

  return (
    <div>
      <h1>{title}</h1>
      <p>サーバーで描画した時刻: {renderedAt}</p>
      <button onClick={like}>いいね {count ?? ''}</button>
    </div>
  );
}
