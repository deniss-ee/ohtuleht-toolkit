import { toast } from "sonner";
import { ui } from "@/content";

// Copies formatted text (HTML) together with plain text. Mail programs paste the HTML with its paragraphs and line breaks;
// plain-text fields get the text with Windows line breaks. Falls back to plain text when the browser has no rich copy.
export async function copyRichText(html: string, text: string, message: string) {
  const plain = text.replace(/\r?\n/g, "\r\n");
  try {
    await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([plain], { type: "text/plain" }) })]);
    toast.success(message);
  } catch {
    await copyText(plain, message);
  }
}

// Copies text and tells the person with a short message. When the browser refuses, say so instead of failing silently.
export async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error(ui.copyFailed);
  }
}
