import { toast } from "sonner";
import { ui } from "@/content";

// Copies text and tells the person with a short message. When the browser refuses, say so instead of failing silently.
export async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error(ui.copyFailed);
  }
}
