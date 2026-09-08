// Cloudflare Pages Function — returns authentication and session status
// Checks if the user is authenticated via Cloudflare Zero Trust (Access) or has ADMIN_TOKEN configured.

interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

interface Env {
  DICT_KV: KVNamespace
  ADMIN_TOKEN?: string
}

interface RequestContext {
  request: Request
  env: Env
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  })
}

export async function onRequestGet(context: RequestContext): Promise<Response> {
  const authHeader = context.request.headers.get("authorization") ?? ""
  const providedToken = authHeader.replace(/^Bearer\s+/i, "").trim()
  const tokenValid = Boolean(
    context.env.ADMIN_TOKEN &&
      providedToken &&
      providedToken === context.env.ADMIN_TOKEN
  )

  return jsonResponse({
    authenticated: tokenValid,
    authType: tokenValid ? "token" : "none",
    email: null
  })
}
