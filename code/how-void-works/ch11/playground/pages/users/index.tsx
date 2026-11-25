import { Form, Link, useErrors } from "@chibivoid/react";
import type { Props } from "./index.server.ts";

export default function Users({ users }: Props) {
  const errors = useErrors();
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <Link href={`/users/${user.id}`}>{user.name}</Link>
          </li>
        ))}
      </ul>
      <Form>
        <input name="name" placeholder="名前" />
        <button type="submit">追加</button>
        {errors.name && <p role="alert">{errors.name}</p>}
      </Form>
    </div>
  );
}
