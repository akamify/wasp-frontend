const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

module.exports = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
      "@app": path.resolve(process.cwd(), "./src/app"),
      "@modules": path.resolve(process.cwd(), "./src/modules"),
      "@shared": path.resolve(process.cwd(), "./src/shared"),
      "@components": path.resolve(process.cwd(), "./src/components"),
      "@pages": path.resolve(process.cwd(), "./src/pages"),
      "@api": path.resolve(process.cwd(), "./src/api"),
      "@assets": path.resolve(process.cwd(), "./src/assets"),
      "@styles": path.resolve(process.cwd(), "./src/styles"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

