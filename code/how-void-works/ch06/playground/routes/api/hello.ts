import { defineHandler } from 'chibivoid';

export const GET = defineHandler(() => {
  return { message: 'Hello from chibivoid!' };
});
