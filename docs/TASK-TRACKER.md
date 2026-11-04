# Banner request and Task tracker

> **Status: built, switched off.** Both are finished as prototypes and hidden ("Soon" in the menu) until Microsoft login exists, because they hold clients and requests. Switch them on by setting `ready: true` for `request` and `tasks` in `nav` (`content.en.ts` and `content.et.ts`). Nothing else has to change. Login and mail: [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md).

## The problem

Three departments ask the designer for banners, each in its own way. Information is missing or scattered: sizes, texts, pictures, links, deadlines. The goal: **one clear request**, the same everywhere, that becomes one tidy email, and a board where the work can be followed.

## Two tools, one data set

| | Banner request | Task tracker |
|---|---|---|
| Menu item / link | **Banner request**, `?section=request` | **Task tracker**, `?section=tasks` |
| For | Anybody who needs a banner | The designer and managers |
| Does | A guided page: What is it for, Who is asking, When, Which banners, What do we need. A checklist shows what is missing; the email appears on the right. Buttons: send email and add to board; copy email and add to board; add to board only | A **Board** (columns New, In design, Review, Delivered, Live, Closed; drag cards), a **Table**, and **Clients**. A card opens as the same page, with a status and "Make: <banner>" buttons that open the banner maker |
| Code | `pages/BannerRequest.tsx`, `components/editor/BriefPage.tsx` | `pages/TaskTracker.tsx`, `BriefPage.tsx` |

Shared code: `lib/tracker.ts` (fields, validation, the email text, sample briefs), `lib/clients.ts` (client list, CSV import and export), `lib/sync.ts` (API with an offline outbox), `components/editor/DatePicker.tsx` (`@daypicker/react`), `ClientCombobox.tsx`.

## Brief fields

| Field | Notes |
|---|---|
| Title, client | Required. The client is chosen from a dropdown or typed; a new one joins the client list |
| Requester, department, e-mail | Requester required |
| Needed by | Required (date) |
| Banner runs | Optional (first and last day) |
| Banners | One or more rows: format (picture tiles), where it runs, text, link. At least one row with a place or text |
| Article links, materials, notes | Optional |
| Status | Not asked for a new request (starts as New); a dropdown on an existing card |

## The email

The brief becomes a subject and a body in a fixed order (`briefEmail` in `lib/tracker.ts`). Copying puts **formatted text** and plain text on the clipboard (paragraphs and line breaks survive in mail programs). "Open in email" uses a `mailto:` link and falls back to copying when the text is too long for a link. The designer's address is remembered in the browser.

After Microsoft login the email is sent **from the person's own mailbox** with Microsoft Graph ([AUTH-MICROSOFT.md](AUTH-MICROSOFT.md#4-sending-mail-as-the-person)). The copy and `mailto:` routes stay as fallback.

## Where the data is kept

| Data | Today |
|---|---|
| Briefs and clients | In the browser (`localStorage`: `ol-briefs`, `ol-clients`) **and** in the Cloudflare D1 database through the API (`lib/sync.ts`). Changes made offline wait in an outbox (`ol-outbox`) and are sent later; a record made offline is uploaded, a record deleted by somebody else is dropped here |
| Sample data | Five example briefs and five example clients are shown on the first visit and are **never sent** to the server; using a sample client in a brief turns it into a real one |
| Shared client list in the repository | `apps/generator/public/clients.json` (a list of `{ "name", "contact", "email", "phone", "note" }`) is merged into everybody's list by name when the Task tracker opens. Empty today |
| Backup | **Back up** and **Load backup** (JSON) on the board; **Export CSV** and **Import CSV** for clients (a Scoro export with columns name or company, e-mail, phone, contact works) |

The API is in test mode: **no login, test data only** ([CLOUDFLARE.md](CLOUDFLARE.md)). Real data waits for login.

## Scoro

No access yet. Plan: a Worker route reads the clients from Scoro with an API key kept as a Worker secret (never in browser code), and fills `Client.scoro` (a field reserved for the Scoro id) so the lists can be matched. Until then: CSV import.

## Not built yet

- Login, roles, who sees which briefs ([AUTH-MICROSOFT.md](AUTH-MICROSOFT.md)).
- Sending from the person's mailbox; status mails.
- Assignee, comments and history.
- Scoro link.
- Opening the banner maker pre-filled from a brief row (today it opens an empty one of the same type).
- Reports (workload per designer, turnaround time).

## Open questions

1. Which departments use it, and who owns each template (required fields)?
2. Is there an existing tool (Outlook tasks, Planner, Jira) it should replace or connect to?
3. Who may see which briefs?
4. Where do uploaded pictures live (Cloudflare R2 or company storage)? Today only links are stored.
5. Languages: the interface is English and Estonian; the email text is English.
