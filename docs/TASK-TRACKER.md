# Task tracker (future module)

A basic tracker for banner and campaign requests, so the three departments that send briefs use one structure instead of many email styles.

## Problem

Three departments write requests in their own way. Information is missing or scattered: sizes, text, images, links, deadlines.

## Goal

One unified brief per job, with everything the designer needs, linked to email and (later) to the banner generator.

## Brief fields (draft)

| Field | Notes |
|---|---|
| Title, client, campaign | Required |
| Requesting department and person | Required |
| Deadline | Required |
| Banner list | Each row: format (e.g. 1250x400, 600x500), size/placement ("площадь"), status |
| Text | Headline, body, badge, call to action; per language |
| Images | Uploads or links; usage notes |
| Links | Landing page, UTM, clickTag URLs |
| Articles | Content-marketing article URLs (feeds the banner generator) |
| Attachments | Briefs, logos, Figma links |
| Status | New, In design, Review, Delivered, Live, Closed |
| Assignee | Designer |
| Comments and history | Full audit trail |

## Key ideas

1. **Unified templates per department** so required fields are the same everywhere; missing info blocks submission.
2. **Link to the banner generator**: a brief row of type "articles banner" opens the generator pre-filled with campaign name, header, articles.
3. **Email integration (optional)**: Outlook/Exchange. Possible routes: Microsoft Graph (mail and calendar), a forwarding address that creates a task, or add-in. Not required for the first version; the tracker must work without it.
4. **Login via Microsoft Exchange / Entra ID**, shared with Phase 3 of the toolkit.
5. **Static fallback**: export a brief as a printable page or JSON if the service is down.

## Phases

| Step | Scope |
|---|---|
| T1 Design | Interview the three departments, collect real emails, define the brief schema and statuses |
| T2 Prototype | Simple form and list on Cloudflare (D1 database or KV), no email |
| T3 Login | Microsoft Entra ID |
| T4 Email | Create tasks from email, send status notifications (Microsoft Graph) |
| T5 Generator link | Open the banner generator from a brief row; attach exported zip back |
| T6 Reporting | Workload per designer, turnaround time |

## Open questions

1. Which departments, and who is the owner of each template?
2. Is there an existing tool (Outlook tasks, Planner, Jira) to replace or integrate?
3. Who can see which briefs?
4. Is Microsoft Graph access approved by IT?
5. Where do uploaded images live (Cloudflare R2, company storage)?
6. Languages for the interface and brief text.

## Status: first prototype (local)

Built in the toolkit (side menu, Task tracker). No server, no login: briefs live in this browser (`localStorage`, key `ol-briefs`) and can be backed up to a JSON file and loaded on another computer.

- **New brief**: title, client, requester, department, deadline, run dates, a list of banner rows (format, placement, text, link), article links, materials, notes. Required: title, client, requester, deadline, one banner with a place or text. Missing items are named.
- **One email for everyone**: the brief becomes a subject and a body in a fixed layout. Copy email text, or Open in email (a `mailto:` link; if the text is too long for a link it is copied instead). The designer's address is remembered.
- **My briefs**: list with status (New, In design, Review, Delivered, Live, Closed), overdue marking, filter by status, edit, delete, backup and restore.
- Code: `lib/tracker.ts` (fields, email text, storage), `pages/TaskTracker.tsx`, texts in `content.*.ts` (`tracker`).
- Not yet: sharing briefs between people, Outlook/Exchange (Microsoft Graph), login, assignee, comments, opening the banner generator from a row (T3 to T5 above). Sending needs the person's own mail program until Graph is approved by IT.

## Update: board, examples and clients

- **Board** (like Notion or Trello): one column per status, cards you drag between columns; also a **Table** view. A brief opens as a page in a window with its fields, banner rows and the email.
- **Examples** are shown on the first visit (five briefs, five clients) so the design can be judged; "Remove examples" clears them.
- **Clients** (third view): add a company once and pick it every time. A client typed in a brief for the first time is added automatically. Import a CSV (a Scoro export works: columns name or company, email, phone, contact), export CSV.
- **Where clients are kept, without a database:**
  1. This browser (`localStorage`, key `ol-clients`).
  2. The shared file `apps/generator/public/clients.json` in the repository (a list of `{ "name", "contact", "email", "phone", "note" }`). Everybody gets it when the page opens; add companies on GitHub and republish the site. It is merged with the person's own list by name.
  3. Later: Scoro (needs access and an API key, so it must go through a Cloudflare Worker, never browser code) or a Worker with D1/KV. `Client.scoro` is reserved for the Scoro id. GitHub Pages cannot store data written by visitors; that needs a Worker.

## Update: the request page

A new banner request is a full page, not a window: blocks with icons (What is it for, Who is asking, When, Which banners, What do we need), banner formats chosen as picture tiles, a real client dropdown (filters while typing, offers "add as new client"), and a calendar (`@daypicker/react`, brand red, Monday first, EN/ET). On the right a checklist shows what is still needed, and the email that will be sent. The status is not asked for a new request (it starts as New); it is a dropdown only when an existing card is opened. Sending adds the request to the board.

## Update: two tools

- **Banner request** (own menu item, `?section=request`): the form for anyone. After sending, the request lands on the board.
- **Task tracker** (`?section=tasks`): board, table and clients. A card opens as a page.
- Both read and write the same data (`lib/tracker.ts`, `lib/clients.ts`), for now in the same browser.

## Going online: Cloudflare (free plan is enough for this)

Limits of the Workers Free plan, read from the Cloudflare docs on 2026-10-30 (check again before building):

| Part | Free limit |
|---|---|
| Worker requests | 100,000 per day |
| D1 (SQL database) | 5 million rows read and 100,000 rows written per day, 5 GB in total, 500 MB per database, 10 databases |
| Workers KV | 100,000 reads and 1,000 writes per day, 1 GB |

A small team making tens of requests and a few hundred card moves a day is far below this. When a limit is hit D1 refuses queries until 00:00 UTC; there is no surprise bill on the free plan.

Plan: one Worker `api` with a D1 database (`briefs`, `clients`), the site (GitHub Pages) calls it. The same Worker later holds the Scoro API key and the article-by-ID scraper (#119, #40). Login (Microsoft Entra, #55) comes before real data is shared; until then only test data. The site keeps working offline with the browser copy as a fallback.
