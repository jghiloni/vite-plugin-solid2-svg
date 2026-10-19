import fs, { existsSync } from "node:fs";
import path, { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createFilter, Plugin, transformWithOxc, type ResolvedConfig } from "vite";

import { htmlToSolid } from "./htmlToSolid";
import { type VitePluginSvgSolidOptions } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function transformSvgToSolid(svgCode: string): string {
  // Convert the SVG string directly to Solid code
  const solidCode = htmlToSolid(svgCode);

  // Wrap the converted code in a component
  const componentCode = `
 import { createElement } from "@createElement";
 import { merge } from "solid-js";


export default function SVGComponent(props = {}) {
	return ${solidCode.code};
};
`.trim();

  return componentCode;
}

export default function vitePluginSvgSolid(options: VitePluginSvgSolidOptions = {}): Plugin {
  const { oxcOptions, include = ["**/*.svg?solid"], exclude } = options;
  const filter = createFilter(include, exclude);
  const postfixRE = /[?#].*$/s;
  let config: ResolvedConfig;

  return {
    name: "solid-svg",
    enforce: "pre",
    // istanbul ignore next - impossible to test outside of vite runtime
    configResolved(cfg: ResolvedConfig) {
      config = cfg;
    },
    // istanbul ignore next - impossible to test outside of vite runtime
    config() {
      return {
        resolve: {
          alias: {
            "@createElement": path.resolve(__dirname, "./createElement.js"),
          },
        },
      };
    },
    async load(id: string) {
      if (filter(id)) {
        const file = id.replace(postfixRE, "");
        const filePath = resolveSVGFile(file, config);

        // Read the SVG file
        const svgCode = await fs.promises.readFile(filePath, "utf8");

        // Transform SVG to Solid component
        const componentCode = transformSvgToSolid(svgCode);

        // Transform component to ESM

        const transformer = transformWithOxc;
        const langProp = "lang";
        // const mapProp = isOxc ? "source_map" : "sourcemap";
        const options = oxcOptions ?? {};

        // Transform the component code using esbuild/oxc
        const result = await transformer(componentCode, id, {
          [langProp]: "js",
          sourcemap: true,
          ...options,
        });

        return {
          code: result.code,
          map: result.map
            ? typeof result.map === "string"
              ? JSON.parse(result.map)
              : result.map
            : /* istanbul ignore next @preserve */ null,
        };
      }
      return null;
    },
  } as Plugin;
}

const resolveSVGFile = (file: string, cfg?: ResolvedConfig): string => {
  if (file.startsWith("/")) {
    const publicFile = resolve(cfg?.publicDir ?? "public", file.slice(1));
    if (existsSync(publicFile)) {
      return publicFile;
    }
  }

  return file;
};
