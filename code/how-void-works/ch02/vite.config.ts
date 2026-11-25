import { defineConfig } from "vite";
import { notesPlugin } from "./notes-plugin.ts";

export default defineConfig({
  plugins: [notesPlugin()],
});
