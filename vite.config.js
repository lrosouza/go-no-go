import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/go-no-go/",
  plugins: [react()],
});
