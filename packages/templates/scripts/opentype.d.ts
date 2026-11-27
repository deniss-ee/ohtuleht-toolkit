// opentype.js has no type declarations of its own; only what the card code needs.
// (Node loads its CommonJS build, so the script uses the default import; the app uses the named one.)
declare module "opentype.js" {
  export function parse(buffer: ArrayBuffer): import("../src/giftcard.ts").FontLike;
  const opentype: { parse: typeof parse };
  export default opentype;
}
