import { defineHandler, type InferProps } from "chibivoid";

export const loader = defineHandler(() => {
  return { title: "chibivoid へようこそ", renderedAt: new Date().toISOString() };
});

export type Props = InferProps<typeof loader>;
