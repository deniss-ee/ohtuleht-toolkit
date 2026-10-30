// ohtuleht-api: a small JSON API for briefs and clients on Cloudflare Workers + D1.
//   GET    /api/health
//   GET    /api/briefs            PUT /api/briefs/:id          DELETE /api/briefs/:id
//   GET    /api/clients           PUT /api/clients/:id         DELETE /api/clients/:id
// PUT takes the whole record as JSON and replaces it (last write wins). Nothing secret lives in this file.

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  AUTH_MODE: string; // "open" (test data only) or "entra" (Microsoft login, not built yet)
}

const MAX_BODY = 64 * 1024; // a brief is a few KB; anything bigger is refused
const ID = /^[\w-]{1,80}$/;

const json = (data: unknown, status = 200, extra: HeadersInit = {}) => Response.json(data, { status, headers: extra });

function corsHeaders(req: Request, env: Env): HeadersInit {
  const origin = req.headers.get("Origin") ?? "";
  const ok = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).includes(origin);
  return ok ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization", "Access-Control-Max-Age": "86400", Vary: "Origin" } : { Vary: "Origin" };
}

// Who may use the API. Open for now (test data). With Microsoft login this checks the token and the company tenant.
async function authorised(_req: Request, env: Env): Promise<boolean> {
  return env.AUTH_MODE === "open";
}

type Table = "briefs" | "clients";

async function list(env: Env, table: Table) {
  const { results } = await env.DB.prepare(`SELECT data FROM ${table} ORDER BY updated_at DESC`).all<{ data: string }>();
  return results.map((r) => JSON.parse(r.data));
}

async function put(env: Env, table: Table, id: string, record: Record<string, unknown>) {
  const now = new Date().toISOString();
  const data = JSON.stringify({ ...record, id });
  if (table === "briefs") {
    await env.DB.prepare("INSERT INTO briefs (id, status, deadline, data, updated_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(id) DO UPDATE SET status = ?2, deadline = ?3, data = ?4, updated_at = ?5")
      .bind(id, String(record.status ?? "new"), String(record.deadline ?? ""), data, now)
      .run();
  } else {
    await env.DB.prepare("INSERT INTO clients (id, name, data, updated_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(id) DO UPDATE SET name = ?2, data = ?3, updated_at = ?4")
      .bind(id, String(record.name ?? ""), data, now)
      .run();
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(req, env);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    if (url.pathname === "/api/health") return json({ ok: true, auth: env.AUTH_MODE }, 200, cors);
    if (!(await authorised(req, env))) return json({ error: "Sign in first." }, 401, cors);

    const m = /^\/api\/(briefs|clients)(?:\/([^/]+))?$/.exec(url.pathname);
    if (!m) return json({ error: "Not found." }, 404, cors);
    const table = m[1] as Table;
    const id = m[2];

    try {
      if (!id && req.method === "GET") return json(await list(env, table), 200, cors);
      if (id && !ID.test(id)) return json({ error: "Bad id." }, 400, cors);

      if (id && req.method === "PUT") {
        const text = await req.text();
        if (text.length > MAX_BODY) return json({ error: "Too big." }, 413, cors);
        let record: unknown;
        try {
          record = JSON.parse(text);
        } catch {
          return json({ error: "Not JSON." }, 400, cors);
        }
        if (!record || typeof record !== "object" || Array.isArray(record)) return json({ error: "Expected an object." }, 400, cors);
        const r = record as Record<string, unknown>;
        if (table === "briefs" && typeof r.title !== "string") return json({ error: "A brief needs a title." }, 400, cors);
        if (table === "clients" && (typeof r.name !== "string" || !r.name.trim())) return json({ error: "A client needs a name." }, 400, cors);
        await put(env, table, id, r);
        return json({ ok: true }, 200, cors);
      }

      if (id && req.method === "DELETE") {
        await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?1`).bind(id).run();
        return json({ ok: true }, 200, cors);
      }
      return json({ error: "Method not allowed." }, 405, cors);
    } catch (e) {
      // A client name that already exists (any letter case) is refused by the database.
      if (e instanceof Error && /UNIQUE/i.test(e.message)) return json({ error: "That client already exists." }, 409, cors);
      return json({ error: "Server error." }, 500, cors);
    }
  },
} satisfies ExportedHandler<Env>;
