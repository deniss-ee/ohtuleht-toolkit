// opentype.js has no type declarations of its own; only what the gift card needs.
declare module "opentype.js" {
  export function parse(buffer: ArrayBuffer): import("@ohtuleht/templates").FontLike;
}
