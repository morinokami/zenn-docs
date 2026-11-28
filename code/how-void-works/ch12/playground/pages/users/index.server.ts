import { defineHandler, ValidationError, type InferProps } from "chibivoid";
import { addUser, listUsers } from "../../src/users.ts";

export const loader = defineHandler(async () => {
  return { users: await listUsers() };
});

export const action = defineHandler(async (c) => {
  const form = await c.req.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name) {
    throw new ValidationError({ name: "名前を入力してください" });
  }
  await addUser(name);
});

export type Props = InferProps<typeof loader>;
