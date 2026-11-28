import { defineHandler, type InferProps } from "chibivoid";
import { listUsers } from "../../src/users.ts";

export const loader = defineHandler(async () => {
  return { users: await listUsers() };
});

export type Props = InferProps<typeof loader>;
