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
