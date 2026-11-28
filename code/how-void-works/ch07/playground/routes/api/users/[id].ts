import { defineHandler } from "chibivoid";

export const GET = defineHandler((c) => {
  return { id: c.req.param("id") };
});
