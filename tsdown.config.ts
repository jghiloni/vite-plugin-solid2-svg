import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/createElement.ts"],
  deps: {
    neverBundle: true,
  },
  clean: true,
  format: "es",
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  minify: true,
  dts: {
    generator: "oxc",
  },
  copy: ["src/*.d.ts"],
});
