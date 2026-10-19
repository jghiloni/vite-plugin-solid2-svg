import { dynamic, JSX, ValidComponent } from "@solidjs/web";
import { merge } from "solid-js";

export function createElement(
  tagName: ValidComponent,
  props: Record<string, unknown> = {},
  ...children: JSX.Element[]
): JSX.Element {
  const Element = dynamic(() => tagName);
  const merged = merge(props, { children });
  return Element(merged);
}
