import { defineHandler, type InferProps } from "chibivoid";
import { findUser } from "../../src/users.ts";

export const loader = defineHandler(async (c) => {
  const user = await findUser(Number(c.req.param("id")));
  if (!user) {
    return c.notFound();
  }
  return { user };
});

export type Props = InferProps<typeof loader>;
