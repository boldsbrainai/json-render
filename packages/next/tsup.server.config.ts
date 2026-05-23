import { defineConfig } from "tsup";

const sharedExternal = [
  "react",
  "react-dom",
  "next",
  "next/link",
  "next/navigation",
  "@json-render/core",
  "@json-render/react",
];

export default defineConfig({
  entry: { server: "src/server.ts" },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  splitting: false,
  external: [...sharedExternal, /page-renderer-client/],
});
