import { defineHandler } from 'chibivoid';

// /api/users/[id].ts より具体的であるため、こちらが優先される
export const GET = defineHandler(() => {
  return { id: 'me', name: 'あなた' };
});
