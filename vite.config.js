import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

// base: "./" makes all asset URLs relative, so the build works under ANY
// GitHub Pages path (https://user.github.io/<repo>/) without hardcoding the
// repo name. No config change needed if the repo is ever renamed.
export default defineConfig({
  base: "./",
  plugins: [react(), cloudflare()],
});