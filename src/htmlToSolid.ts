import type { RootLike } from "@thednp/domparser";
import { Parser } from "@thednp/domparser/parser";

import { ChildEl, SolidCode } from "./types";

const quoteText = (key: string): string => (/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(key) ? key : `"${key}"`);

const solidValue = (val: string | number) => JSON.stringify(val);

/**
 * Converts HTML to Solid code.
 *
 */
const htmlToDOM = (input?: string): RootLike => {
  if (!input) return { nodeName: "#document", children: [] };
  return Parser().parseFromString(input).root;
};

/**
 * Converts a `DOMNode` to a Solid code string
 */
const DOMToSolid = (input: Partial<ChildEl>, depth: number = 0): string => {
  const { tagName, nodeName, attributes, children, nodeValue } = input;
  const isText = nodeName === "#text";
  const firstChildIsText = children?.[0]?.nodeName === "#text";
  const attributeEntries = Object.entries(attributes || {});
  const spaces = "  ".repeat(depth); // Calculate spaces based on depth
  let output = isText ? "" : spaces + `createElement("${tagName}", `;

  const attrs = attributeEntries.length
    ? attributeEntries.map(([key, value]) => `${quoteText(key)}: ${solidValue(value)}`).join(", ")
    : "";
  output += !isText ? (depth === 0 ? `merge({${attrs}}, props)` : `{${attrs}}`) : "";

  output += !isText && children?.length ? "," : "";

  if (children?.length) {
    const childrenHTML = children
      // Increase depth for children
      .map(
        child =>
          (firstChildIsText ? (attributeEntries.length ? " " : "") : "\n" + "  ".repeat(depth + 1)) +
          DOMToSolid(child, depth + 1),
      )
      .join(",");
    output += childrenHTML;
  }
  if (nodeValue) {
    // Escape template literal special chars so the generated code is valid
    const text = nodeValue.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
    output += `\`${text}\``;
  }
  // Adjust newline for closing bracket
  output += isText ? "" : children?.length && !firstChildIsText ? "\n" + "  ".repeat(depth + 1) + ")" : ")";

  return output;
};

export const htmlToSolid = (input?: string): SolidCode => {
  const doc = htmlToDOM(input);
  if (!doc?.children.length) return { code: "", attributes: {} };
  const { tagName, nodeName, attributes, children } = doc.children[0];
  const code = DOMToSolid({ tagName, nodeName, attributes, children });

  return { code, attributes };
};
