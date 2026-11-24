import { defineHandler } from 'chibivoid';
import { kv } from 'chibivoid/kv';

export const GET = defineHandler(async () => {
  return { count: (await kv.get<number>('count')) ?? 0 };
});

export const POST = defineHandler(async () => {
  const count = ((await kv.get<number>('count')) ?? 0) + 1;
  await kv.put('count', count);
  return { count };
});
