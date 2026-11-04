# Email signature

Tools, Email signature. Fill in name, job title, department, phone, mobile, email, website, address; get a signature for Outlook or any mail program.

- Output: a small table with inline styles only (Outlook ignores classes). Fonts are Arial (mail programs do not have Inter). Colours are brand red 600 and ink.
- Copy signature: puts formatted text on the clipboard (paste into the Outlook signature editor). Copy HTML code and plain text are fallbacks.
- The form is remembered in the browser (`localStorage`, key `ol-signature`). Nothing is sent anywhere.
- Logo: `apps/generator/public/signature/ohtuleht-logo.png` (336x64 PNG, shown at 168x32 for sharp screens). Mail programs need a full web address, so the signature points to `https://deniss-ee.github.io/ohtuleht-toolkit/signature/ohtuleht-logo.png`. It shows in mail only after the site is published. If the site address changes, change `LIVE_URL` in `lib/bookmarklet.ts`.
- Code: `lib/signature.ts` (HTML and text), `pages/SignatureGenerator.tsx`, texts in `content.*.ts` (`signature`).
- Open: ask IT for the official company line and address, and whether Exchange can set signatures centrally.
