import { Link } from '@chibivoid/react';
import type { Props } from './[id].server.ts';

export default function UserPage({ user }: Props) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>ID: {user.id}</p>
      <Link href="/users">← 一覧へ</Link>
    </div>
  );
}
