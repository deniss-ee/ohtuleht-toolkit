# Microsoft login, sending mail, and who sees what

Planned, **not built**. This document is the plan for adding sign-in with the company's Microsoft account (Entra ID, the login behind Microsoft 365 / Exchange Online), for sending a banner request **from the person's own mailbox**, and for showing different content to signed-in and signed-out people.

Facts here were read from the Microsoft and Cloudflare documentation on 2026-11-02. Re-check anything marked *(check)* when you build, and use the current docs and package versions (see section 6).

## Contents

1. [Who may see what](#1-who-may-see-what): choose one of three designs
2. [Login is not permission](#2-login-is-not-permission)
3. [What IT needs to create](#3-what-it-needs-to-create)
4. [Sending mail as the person](#4-sending-mail-as-the-person)
5. [Showing different content to different people](#5-showing-different-content-to-different-people)
6. [How the code would change](#6-how-the-code-would-change)
7. [Order of work](#7-order-of-work)
8. [What to ask IT](#8-what-to-ask-it)

## 1. Who may see what

Three designs. They are not exclusive; the hybrid is common.

| | A. Whole site behind login | B. Public site, login inside the app | C. Two sites (hybrid) |
|---|---|---|---|
| Idea | Nobody sees anything without signing in. The login happens **before** the page is served | Anybody can open the site. Parts of it ask for sign-in; the API checks the login | A public address with the open parts (brand manual, tools). An internal address (behind login) with the rest |
| Who sees what | Only signed-in company people see anything | Public: tools, brand manual. Signed in: guide with real names, tracker, sending mail | Public site and internal site are separate builds |
| Code to write | Almost none for the pages (the login is a setting); the API still must check the login | A login library in the app, a check in the API, "signed in / signed out" parts in the interface | Two builds and two addresses; shared code stays in the repository |
| How you do it | **Cloudflare Access** in front of the Worker that serves the site (Entra ID as the login), or single sign-on on a company server | **MSAL** in the browser plus a token check in the Worker | A + B on different addresses |
| Mail sending | Needs MSAL anyway (see below) | Built in | Built in the internal site |
| Good for | An internal toolkit that nobody outside should see | A mix of tools useful to the public and internal parts | When part of it should stay public, for example the brand manual |
| Watch out | Free limits of the access product and its seat counting are *(check)*; the `workers.dev` address may not be allowed for Access, a domain on Cloudflare is needed *(check, not confirmed in the docs we read)* | Everything in the static files is still downloadable by anybody: put **no private content in the build**, only fetch it from the API after login | More to maintain |

**Recommendation:** start with **A** if the toolkit is meant for employees only. It is the least code and the least to get wrong. Add the small MSAL part only for sending mail ([section 4](#4-sending-mail-as-the-person)), because a Cloudflare Access login does not give the app a Microsoft Graph token. Choose **B** or **C** if some parts must stay public.

Today the repository and the site are public, and the guide already keeps private values out of the build ([GUIDE.md](GUIDE.md)), so both A and B are possible without rewriting content.

### Hosting that fits design A (Cloudflare Workers)

The static build can be served by a Worker with *static assets*; the same Worker can answer `/api/*`. In `wrangler.jsonc` (names from the Cloudflare docs, *check* the current page before use):

```jsonc
{
  "name": "ohtuleht-toolkit",
  "main": "src/index.ts",            // the API (today apps/api/src/index.ts)
  "compatibility_date": "2026-11-02",
  "assets": {
    "directory": "../generator/dist", // the built app
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]    // the API runs first for /api
  }
}
```

Then one address serves the app and the API (no CORS needed, no `API_URL` guess). Cloudflare's own page says to start new projects on Workers rather than Pages.

Cloudflare Access (Zero Trust) steps, from the docs: add Microsoft Entra ID as a login method (Zero Trust, Integrations, Identity providers, "Azure AD"; the redirect address is `https://<team-name>.cloudflareaccess.com/cdn-cgi/access/callback`, it needs the app's client ID, tenant ID and a client secret, and admin consent). Create a self-hosted application for the hostname, with a policy such as "allow e-mails ending in `@ohtuleht.ee`" (access is denied by default). Access adds the header `Cf-Access-Jwt-Assertion`; the Worker should check it (signature against `https://<team-name>.cloudflareaccess.com/cdn-cgi/access/certs`, `iss`, and the application's `aud` tag) and read the e-mail from it. The `jose` package does this (version 6.2.15 on 2026-11-02).

## 2. Login is not permission

Two different questions:

- **Authentication**: who are you? Answered by Microsoft.
- **Authorisation**: what may you do here? Answered by this project.

Suggested roles (an Entra **app role** each; the role arrives in the sign-in token as the `roles` claim; assign people or groups in Entra, Enterprise applications, your app, Users and groups):

| Role | May |
|---|---|
| (any signed-in employee) | Use the tools, read the guide with real values, send a banner request |
| `Designer` | Move cards on the board, see all requests |
| `Admin` | Edit the clients and the guide values, see usage |

Assign roles to people or to groups of people. Microsoft's page warns that a *service* added to a group does not get the `roles` claim, which does not matter here. The limit is 700 permission definitions per app, far above our needs.

The Worker enforces roles on every request. Hiding a button in the interface is for friendliness; the real check is in the API.

## 3. What IT needs to create

One **app registration** in Microsoft Entra (Entra admin center, App registrations, New registration):

| Setting | Value |
|---|---|
| Name | Õhtuleht Toolkit |
| Supported account types | Accounts in this organizational directory only (single tenant) |
| Platform and redirect | **Single-page application**. Redirect URIs: the site address (for example `https://toolkit.example.com/`) and `http://localhost:5173/` for development |
| Authentication | Nothing to configure beyond the platform above. Microsoft's single-page-app tutorial uses only the client ID and the authority, with **no client secret** (a browser cannot keep one). MSAL's authorization-code flow with PKCE is the standard for this *(check on the current page)* |
| API permissions (delegated) | `User.Read`, `Mail.Send` (and `openid`, `profile`). `Mail.Send` delegated does not need admin consent by default, per the permissions reference *(check; the tenant can still restrict user consent, then an admin grants it once for everybody)* |
| App roles | Optional: `Designer`, `Admin` (above) |
| What to hand back | **Application (client) ID** and **Directory (tenant) ID**. Neither is secret |

If design A with Cloudflare Access is used, Access needs its **own** registration (or the same one with the Access redirect added) and **does** use a client secret: store it only in the Cloudflare dashboard, never in the repository.

For the API to accept the app's tokens, also *expose an API* (an Application ID URI and a scope such as `access_as_user`), so the browser can ask for a token meant for the Worker. The Worker accepts only tokens whose `aud` is its own application ID URI, signed by the keys of your tenant, with the right `iss` and `tid`.

## 4. Sending mail as the person

Microsoft Graph, `POST https://graph.microsoft.com/v1.0/me/sendMail`, with the signed-in person's own token:

```json
{
  "message": {
    "subject": "Banner request: Spring sale (Rimi)",
    "body": { "contentType": "Text", "content": "Title: ...\n..." },
    "toRecipients": [{ "emailAddress": { "address": "designer@example.com" } }]
  },
  "saveToSentItems": true
}
```

- Permission: **`Mail.Send` (delegated)**. The reply is `202 Accepted` with no body; delivery is then up to Exchange Online (limits and throttling apply).
- The mail comes **from the signed-in person** and is kept in their Sent Items. Works on a phone or any computer, with any default mail program, because Microsoft sends it, not the device.
- The person needs a **mailbox in Exchange Online**. With an Exchange server inside the company (not Microsoft 365) Graph does not apply and another route is needed.
- The token is obtained in the browser with MSAL (`acquireTokenSilent`, falling back to a pop-up) and goes **directly from the browser to Graph**. The Worker never sees the mail and needs no mail permission.
- Keep the fallback: when the person is not signed in or sending fails, "Copy email text" and "Open in email" still work (they exist today).
- The same Graph call could send a **status mail** later (for example "your banner is ready"), from the designer.

Alternative if mail should come from one shared mailbox instead: the *Application* permission `Mail.Send` (requires admin consent, lets the app send as **any** user: restrict it with an Exchange application access policy). Not recommended unless the requirement is a shared sender.

## 5. Showing different content to different people

Rule: **private content never ships inside the static files.** Anybody can read the built JavaScript. Private content is fetched from the API after login; the API refuses without a valid token.

Three levels of control:

| Level | How | Example |
|---|---|---|
| Whole site | Design A (Access in front) | Nothing is visible signed out |
| A page (menu item) | A field on the menu entry (`nav` in `content.en.ts`), for example `access: "public" \| "signed-in" \| "role:Designer"`, checked in one place before the page renders; signed-out visitors see a "Sign in" screen or the item is hidden | Task tracker visible only to signed-in people |
| A piece of a page | Two small components, `<SignedIn>` and `<SignedOut>`, around the content | The guide: signed out shows a grey "after sign-in" chip, signed in shows the real phone number |

The guide already works this way: `[[key]]` placeholders in public text, real values from `GET /api/values` once `AUTH_MODE` is not `open` ([GUIDE.md](GUIDE.md)).

## 6. How the code would change

Check the current docs and versions first. On 2026-11-02 the npm packages were `@azure/msal-browser` 5.27.0 and `@azure/msal-react` 5.7.4.

| Where | Change |
|---|---|
| `apps/generator` | Add `@azure/msal-browser` and `@azure/msal-react` (`yarn workspace @ohtuleht/generator add ...`). New `lib/auth.ts` with the MSAL configuration (client ID and authority `https://login.microsoftonline.com/<tenant ID>` from `VITE_ENTRA_CLIENT_ID` and `VITE_ENTRA_TENANT_ID`: not secrets), a provider around the app, and a `useUser()` hook (name, e-mail, roles) |
| `apps/generator/src/lib/sync.ts` | Send `Authorization: Bearer <token>` on every call to the API |
| `apps/generator/src/content.*.ts` | `access` on menu entries; "Sign in / Sign out" in the top bar; switch Banner request and Task tracker on (`ready: true`) for signed-in people |
| `apps/api/src/index.ts` | Implement `authorised()` (today it returns true when `AUTH_MODE` is `open`): read the bearer token, verify signature (keys from `https://login.microsoftonline.com/<tenant>/discovery/v2.0/keys`, picked by `kid`), `iss`, `aud`, `exp`, `tid`; read `roles`; return 401/403. Set `AUTH_MODE` to `entra`. The `/api/values` endpoint then starts serving the guide's private values |
| Sending mail | A function `sendBannerRequest()` calling Graph with a token for the scope `https://graph.microsoft.com/Mail.Send` |
| Tests | Test with a second, non-admin Entra account and with a signed-out browser, both in the browser and with `curl` against the API |

## 7. Order of work

1. IT decides visibility and hosting ([TRANSFER.md](TRANSFER.md)) and creates the app registration; hand back client ID and tenant ID.
2. Put the Worker behind a custom domain; serve the app and API from one Worker (above).
3. Add login to the Worker (`AUTH_MODE=entra`) and to the app. Verify with a signed-out request: it must get 401.
4. Switch on Banner request and Task tracker; move the real guide values into `guide_values`.
5. Add mail sending with Graph.
6. Add roles if needed.
7. Only then enter real customer data.

## 8. What to ask IT

1. Is the company mail on **Exchange Online (Microsoft 365)**, or on a server? (Graph needs Exchange Online.)
2. Who creates the Entra app registration, and can users consent to `Mail.Send` themselves, or must an admin grant it?
3. Should the toolkit be visible to anyone on the internet, or only to employees? (Section 1.)
4. Which address will it have, and is the domain already on Cloudflare? (Cloudflare Access needs a domain on the account *(check)*.)
5. Are there groups in Entra that already match the roles above?
6. Where should the Scoro connection run, and who gets the API key? (Through the Worker only, never in browser code.)
