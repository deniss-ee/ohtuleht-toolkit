// Email signature: a small table with inline styles only, because mail programs (Outlook above all) ignore classes and modern CSS.
import { LIVE_URL } from "@/lib/bookmarklet";

export interface SignatureData {
  name: string;
  title: string;
  department: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  address: string;
  company: string;
  logo: boolean;
}

export const emptySignature = (): SignatureData => ({ name: "", title: "", department: "", phone: "", mobile: "", email: "", website: "www.ohtuleht.ee", address: "", company: "Õhtuleht", logo: true });

// Mail programs need a full web address for the picture (a picture inside the page would not arrive). It is the file on the live site.
export const LOGO_URL = `${LIVE_URL}signature/ohtuleht-logo.png`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const RED = "#f50000"; // brand red 600
const INK = "#2a2a2d"; // brand ink 950
const GREY = "#67686f"; // brand ink 700
const FONT = "font-family:Arial,Helvetica,sans-serif;";

// A phone number as a link people can tap on a phone: only digits and +.
const tel = (s: string) => s.replace(/[^\d+]/g, "");
const web = (s: string) => (/^https?:\/\//i.test(s) ? s : `https://${s}`);

export function signatureHtml(d: SignatureData, logoSrc = LOGO_URL): string {
  const lines: string[] = [];
  const row = (label: string, value: string) => `<tr><td style="${FONT}font-size:12px;line-height:18px;color:${GREY};padding:0 8px 0 0;">${label}</td><td style="${FONT}font-size:12px;line-height:18px;color:${INK};">${value}</td></tr>`;
  if (d.phone.trim()) lines.push(row("T", `<a href="tel:${esc(tel(d.phone))}" style="color:${INK};text-decoration:none;">${esc(d.phone.trim())}</a>`));
  if (d.mobile.trim()) lines.push(row("M", `<a href="tel:${esc(tel(d.mobile))}" style="color:${INK};text-decoration:none;">${esc(d.mobile.trim())}</a>`));
  if (d.email.trim()) lines.push(row("E", `<a href="mailto:${esc(d.email.trim())}" style="color:${INK};text-decoration:none;">${esc(d.email.trim())}</a>`));
  if (d.website.trim()) lines.push(row("W", `<a href="${esc(web(d.website.trim()))}" style="color:${RED};text-decoration:none;">${esc(d.website.trim())}</a>`));
  const role = [d.title.trim(), d.department.trim()].filter(Boolean).map(esc).join(", ");
  const place = [d.company.trim(), d.address.trim()].filter(Boolean).map(esc).join(" &middot; ");
  return (
    `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">` +
    `<tr><td style="padding:0 0 10px 0;${FONT}">` +
    (d.name.trim() ? `<div style="${FONT}font-size:16px;line-height:22px;font-weight:bold;color:${INK};">${esc(d.name.trim())}</div>` : "") +
    (role ? `<div style="${FONT}font-size:13px;line-height:18px;color:${GREY};">${role}</div>` : "") +
    `</td></tr>` +
    `<tr><td style="border-top:2px solid ${RED};padding:10px 0 0 0;">` +
    (lines.length ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">${lines.join("")}</table>` : "") +
    (place ? `<div style="${FONT}font-size:12px;line-height:18px;color:${GREY};padding:6px 0 0 0;">${place}</div>` : "") +
    (d.logo ? `<div style="padding:10px 0 0 0;"><img src="${esc(logoSrc)}" width="168" height="32" alt="Õhtuleht" style="display:block;border:0;width:168px;height:32px;"></div>` : "") +
    `</td></tr></table>`
  );
}

// The same signature as plain text, for mail programs that send text only.
export function signatureText(d: SignatureData): string {
  const out = [d.name.trim(), [d.title.trim(), d.department.trim()].filter(Boolean).join(", ")].filter(Boolean);
  const contact = [d.phone && `T ${d.phone.trim()}`, d.mobile && `M ${d.mobile.trim()}`, d.email && `E ${d.email.trim()}`, d.website && `W ${d.website.trim()}`].filter(Boolean) as string[];
  const place = [d.company.trim(), d.address.trim()].filter(Boolean).join(" | ");
  return [...out, ...(contact.length ? ["", ...contact] : []), ...(place ? ["", place] : [])].join("\n");
}

// Puts the signature on the clipboard as formatted text (pastes into Outlook with the look) and plain text. Returns false when the browser refuses.
export async function copyRich(html: string, text: string): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]);
    return true;
  } catch {
    return false;
  }
}
