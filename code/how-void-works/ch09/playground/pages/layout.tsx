import type { ReactNode } from 'react';
import { Link } from '@chibivoid/react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link> | <Link href="/users">Users</Link> |{' '}
        <Link href="/about">About</Link>
      </nav>
      <hr />
      <main>{children}</main>
    </div>
  );
}
