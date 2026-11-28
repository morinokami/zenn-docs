import { chibivoidReact } from "@chibivoid/react/plugin";
import { chibivoidPlugin } from "chibivoid";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [chibivoidPlugin(), chibivoidReact()],
});
