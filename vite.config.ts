import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { contentPolicyPlugin } from "./scripts/content-policy-plugin.js";

const dataDir = resolve(import.meta.dirname, "data");

export default defineConfig({
  plugins: [contentPolicyPlugin(dataDir), vue()],
});
