import type { ChildLike, NodeLike } from "@thednp/domparser";
import type { FilterPattern, OxcOptions } from "vite";

export type VitePluginSvgSolidOptions = {
  oxcOptions?: OxcOptions;
  exclude?: FilterPattern;
  include?: FilterPattern;
};

export type SolidCode = {
  code: string;
  attributes?: Record<string, string | Record<string, string>>;
};

export type ChildEl = ChildLike &
  Omit<NodeLike, "attributes"> & {
    attributes: Record<string, string>;
  } & {
    children: ChildLike[];
  };
