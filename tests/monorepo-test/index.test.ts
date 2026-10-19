import svgSolid from "@jghiloni/vite-plugin-solid2-svg";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const mockPlugin8Context = {
  meta: {
    viteVersion: "8.0.0",
    // Mock rolldownVersion if needed for Vite 8+
    rolldownVersion: "0.100.0",
  },
};

type Load = (
  id: string,
  ops?: { ssr: boolean },
) => Promise<{ code: string; map: null } | null>;

vi.mock("vite", async () => {
  const actual = await vi.importActual("vite");
  return {
    ...actual,
    // Mock any Vite exports if necessary
    transformWithOxc: vi.fn().mockImplementation((code: string) =>
      Promise.resolve({
        code, // return the same code that was passed
        map: `[{"file": "./file.ts"}]`,
      }),
    ),
  };
});

describe("vite-solid-svg monorepo test", () => {
  it("should transform ?solid svg files from a dependency", async () => {
    const plugin = svgSolid();
    // @ts-expect-error
    plugin?.buildStart?.call(mockPlugin8Context);

    const svgPath = resolve(
      __dirname,
      "..",
      "..",
      "node_modules",
      "heroicons",
      "16",
      "solid",
      "academic-cap.svg?solid",
    );
    const result = await (plugin.load as Load)(svgPath);

    expect(result).toBeDefined();
    expect(typeof result?.code).toBe("string");

    // Check if the transformed code includes Solid imports
    expect(result?.code).toContain("import { createElement } from");

    // Check if the transformed code includes Solid imports
    expect(result?.code).toContain("import { merge } from");

    // Check if the transformed code creates a component
    expect(result?.code).toContain("export default function SVGComponent");

    // Check if the component handles props
    expect(result?.code).toContain("props = {}");

    // Check if SVG content is included
    expect(result?.code).toContain("viewBox");

    // Check map is generated
    expect(result?.map).not.toBe(null);
  });
});
