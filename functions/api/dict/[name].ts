// Cloudflare Pages Function — serves and updates dictionary word lists from KV.
//
// GET  /api/dict/:name        -> returns the dictionary content as plain text or JSON
//                                 (supports query param `?format=json` or Header `Accept: application/json`)
// POST /api/dict/:name        -> adds/removes words
//                                 Auth: Cloudflare Access (Zero Trust) or Bearer <ADMIN_TOKEN>
//                                 body: { "words": string[], "action"?: "add" | "remove" }
//
// KV bindings expected (set in Cloudflare Pages dashboard -> Settings -> Functions):
//   DICT_KV      KV namespace, seeded via scripts/seed-kv.sh
//   ADMIN_TOKEN  secret string, fallback authorization token

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
  params: { name?: string | string[] }
}

const ALLOWED_NAMES = new Set(["vn", "non-vn", "custom", "names"])

function contentKey(name: string) {
  return `dict:${name}:content`
}

function updatedKey(name: string) {
  return `dict:${name}:updated`
}

function resolveName(params: RequestContext["params"]): string | null {
  const raw = Array.isArray(params.name) ? params.name[0] : params.name
  if (!raw || !ALLOWED_NAMES.has(raw)) return null
  return raw
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

/**
 * Checks if the request is authenticated via either:
 * 1. Cloudflare Zero Trust (Access) headers (e.g. `Cf-Access-Authenticated-User-Email` or `Cf-Access-Jwt-Assertion`)
 * 2. `Authorization: Bearer <ADMIN_TOKEN>`
 */
function isAuthenticated(context: RequestContext): {
  authorized: boolean
  user?: string
} {
  // 1. Cloudflare Access (Zero Trust) authentication
  const cfEmail = context.request.headers.get(
    "cf-access-authenticated-user-email"
  )
  const cfJwt = context.request.headers.get("cf-access-jwt-assertion")
  if (cfEmail || cfJwt) {
    return {
      authorized: true,
      user: cfEmail ?? "cloudflare-access-user"
    }
  }

  // 2. Token-based fallback authentication
  const adminToken = context.env.ADMIN_TOKEN
  if (adminToken) {
    const authHeader = context.request.headers.get("authorization") ?? ""
    const providedToken = authHeader.replace(/^Bearer\s+/i, "").trim()
    if (providedToken && providedToken === adminToken) {
      return {
        authorized: true,
        user: "admin-token-user"
      }
    }
  }

  return { authorized: false }
}

export async function onRequestGet(context: RequestContext): Promise<Response> {
  const name = resolveName(context.params)
  if (!name) {
    return jsonResponse({ error: "Unknown dictionary name" }, 404)
  }

  const content = await context.env.DICT_KV.get(contentKey(name))
  if (content === null) {
    return jsonResponse(
      { error: `Dictionary "${name}" is not seeded in KV yet` },
      404
    )
  }

  const url = new URL(context.request.url)
  const wantsJson =
    url.searchParams.get("format") === "json" ||
    context.request.headers.get("accept")?.includes("application/json")

  if (wantsJson) {
    const lines = content
      .split(/\r?\n/)
      .map((w) => w.trim())
      .filter(Boolean)

    const updatedAt =
      (await context.env.DICT_KV.get(updatedKey(name))) ??
      new Date().toISOString()

    return jsonResponse({
      name,
      totalCount: lines.length,
      updatedAt,
      words: lines
    })
  }

  return new Response(content, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  })
}

export async function onRequestPost(
  context: RequestContext
): Promise<Response> {
  const name = resolveName(context.params)
  if (!name) {
    return jsonResponse({ error: "Unknown dictionary name" }, 404)
  }

  const auth = isAuthenticated(context)
  if (!auth.authorized) {
    return jsonResponse(
      {
        error:
          "Unauthorized: Vui lòng đăng nhập qua Cloudflare Access hoặc cung cấp ADMIN_TOKEN"
      },
      401
    )
  }

  let payload: { words?: unknown; action?: unknown }
  try {
    payload = await context.request.json()
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400)
  }

  const action = payload.action === "remove" ? "remove" : "add"
  const incoming = Array.isArray(payload.words) ? payload.words : []
  const newWords = incoming
    .filter((w): w is string => typeof w === "string")
    .map((w) => w.trim())
    .filter(Boolean)

  if (newWords.length === 0) {
    return jsonResponse({ error: "No valid words provided" }, 400)
  }

  const existing = (await context.env.DICT_KV.get(contentKey(name))) ?? ""
  const existingLines = existing
    .split(/\r?\n/)
    .map((w) => w.trim())
    .filter(Boolean)

  const wordSet = new Set(existingLines)
  let affectedCount = 0

  if (action === "remove") {
    for (const w of newWords) {
      if (wordSet.delete(w)) affectedCount++
    }
  } else {
    for (const w of newWords) {
      if (!wordSet.has(w)) {
        wordSet.add(w)
        affectedCount++
      }
    }
  }

  const updatedContent = Array.from(wordSet)
    .sort((a, b) => a.localeCompare(b, "vi"))
    .join("\n")
  const updatedAt = new Date().toISOString()

  await context.env.DICT_KV.put(contentKey(name), updatedContent)
  await context.env.DICT_KV.put(updatedKey(name), updatedAt)

  return jsonResponse({
    name,
    action,
    affectedCount,
    addedCount: action === "add" ? affectedCount : 0,
    removedCount: action === "remove" ? affectedCount : 0,
    totalCount: wordSet.size,
    updatedAt,
    user: auth.user
  })
}
