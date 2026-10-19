import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { VitePluginSvgSolidOptions } from "../src/types";
import { mockPlugin8Context } from "./fixtures/mock.ts";

// import plugin
import svgSolid from "../src/index";

import { JSX, ValidComponent } from "@solidjs/web";
import { createElement } from "../src/createElement";
import { htmlToSolid } from "../src/htmlToSolid";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

describe("vite-solid-svg", () => {
  it("should be a function", () => {
    expect(typeof svgSolid).toBe("function");
  });

  it("should return a vite plugin object", () => {
    const plugin = svgSolid();
    expect(plugin).toHaveProperty("name", "solid-svg");
    expect(plugin).toHaveProperty("enforce", "pre");
    expect(typeof plugin.load).toBe("function");
  });

  it("should transform svg files with ?solid query with vite 8", async () => {
    const plugin = svgSolid();
    // @ts-expect-error - this is testing
    plugin?.buildStart?.call(mockPlugin8Context);
    const svgPath = resolve(__dirname, "./fixtures/solid.svg");
    const result = await (plugin.load as Load)(svgPath + "?solid");

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

  
  it("should not transform non-svg files", async () => {
    const plugin = svgSolid();
    const result = await (plugin.load as Load)("test.js?solid");
    expect(result).toBeNull();
  });

  it("should not transform svg files without ?solid query", async () => {
    const plugin = svgSolid();
    const result = await (plugin.load as Load)("test.svg");
    expect(result).toBeNull();
  });

  it("should work with aria and data attributes", () => {
    // a set of tests to add full coverage
    const html = `
  <fieldset>
    "This is a text node"
    <button class="btn" aria-disabled="true" data-disabled="true" disabled>click me</button>
  </fieldset>
    `.trim();

    const code = htmlToSolid(html);
    expect(code.attributes).toEqual({});
  });

  it("should not quote single-char attribute names", () => {
    const { code } = htmlToSolid(
      '<svg viewBox="0 0 10 10"><text x="10" y="6">hi</text><path d="M0 0"/></svg>',
    );
    expect(code).toContain('x: "10"');
    expect(code).toContain('y: "6"');
    expect(code).toContain('d: "M0 0"');
    expect(code).not.toContain('"x"');
  });

  it("should escape attribute values so generated code stays valid", () => {
    const { code } = htmlToSolid(
      `<svg viewBox="0 0 10 10" aria-label='say "hi"'></svg>`,
    );
    expect(code).toContain(`\\"hi\\"`);
    expect(
      () => new Function("createElement", "merge", "props", `return (${code})`),
    ).not.toThrow();
  });

  it("should escape text content so generated code stays valid", () => {
    const { code } = htmlToSolid(
      '<svg viewBox="0 0 10 10"><text>`tick` ${evil} a\\b</text></svg>',
    );
    expect(code).toContain("\\`tick\\` \\${evil} a\\\\b");
    expect(
      () => new Function("createElement", "merge", "props", `return (${code})`),
    ).not.toThrow();
  });

  it("should handle invalid markup", () => {
    expect(htmlToSolid()).toEqual({ code: "", attributes: {} });

    try {
      // @ts-expect-error - we need to test this case
      htmlToSolid({});
    } catch (er: unknown) {
      expect(er).toBeInstanceOf(TypeError);
      expect((er as TypeError).message).toEqual("input must be a string");
    }
  });

  it("createElement merges component, props and children in one pass", () => {
    type T = { t: string };

    const noKids = getRenderedElement<T>("path", { d: "M0 0" });
    expect(noKids).toStrictEqual({ t: `<path d="M0 0"></path>` });
    const oneKid = getRenderedElement<T>("text", {}, ["hi"]);
    expect(oneKid!.t).toContain("hi");

    const twoKids = getRenderedElement<T>("g", { fill: "none" }, ["a", "b"]);
    expect(twoKids!.t).toContain("ab");
    expect(twoKids!.t).toContain('fill="none"');
  });

  it("should accept plugin options", () => {
    const options: Partial<VitePluginSvgSolidOptions> = {
      include: "**/*.svg",
    };
    const plugin = svgSolid(options);
    expect(plugin).toBeDefined();
  });
});

function getRenderedElement<T>(
  tagName: ValidComponent,
  props: Record<string, unknown> = {},
  children?: JSX.Element[],
): T | null | undefined {
  const element = createElement(tagName, props, ...(children ?? []));
  let rendered: T | null | undefined = element as T;

  if (typeof element === "function") {
    rendered = (element as Function)() as T;
  }

  return rendered;
}
