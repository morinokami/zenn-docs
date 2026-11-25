import { kv } from "chibivoid/kv";

export type User = { id: number; name: string };

const SEED: User[] = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Linus" },
];

export async function listUsers(): Promise<User[]> {
  return (await kv.get<User[]>("users")) ?? SEED;
}

export async function findUser(id: number): Promise<User | null> {
  return (await listUsers()).find((user) => user.id === id) ?? null;
}

export async function addUser(name: string): Promise<User> {
  const users = await listUsers();
  const user = { id: Math.max(0, ...users.map((u) => u.id)) + 1, name };
  await kv.put("users", [...users, user]);
  return user;
}
