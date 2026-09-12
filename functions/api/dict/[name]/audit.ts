// Cloudflare Pages Function — runs quality audit and handles ignore pairs on KV dictionaries
// GET  /api/dict/:name/audit        -> runs scanDictionaryForGarbage and fuzzy duplicates
// POST /api/dict/:name/audit/ignore -> saves ignored duplicate pair into dict:{name}:ignored-pairs

import {
  auditDictionary,
  type DictName
} from "../../../../src/utils/dict-quality"

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

const AUDIT_ENGINE_VERSION = "v2"

function contentKey(name: string) {
  return `dict:${name}:content`
}

function ignoredPairsKey(name: string) {
  return `dict:${name}:ignored-pairs`
}

function auditCacheKey(name: string) {
  return `dict:${name}:audit:cache:${AUDIT_ENGINE_VERSION}`
}

function auditVersionKey(name: string) {
  return `dict:${name}:audit:version:${AUDIT_ENGINE_VERSION}`
}

function updatedKey(name: string) {
  return `dict:${name}:updated`
}

function resolveName(params: RequestContext["params"]): DictName | null {
  const raw = Array.isArray(params.name) ? params.name[0] : params.name
  if (!raw || !ALLOWED_NAMES.has(raw)) return null
  return raw as DictName
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

function isAuthenticated(context: RequestContext): boolean {
  const adminToken = context.env.ADMIN_TOKEN
  if (adminToken) {
    const authHeader = context.request.headers.get("authorization") ?? ""
    const providedToken = authHeader.replace(/^Bearer\s+/i, "").trim()
    if (providedToken && providedToken === adminToken) {
      return true
    }
  }
  return false
}

export async function onRequestGet(context: RequestContext): Promise<Response> {
  const name = resolveName(context.params)
  if (!name) {
    return jsonResponse({ error: "Unknown dictionary name" }, 404)
  }

  // Fallback dev mode allows request if no token configured
  const isDev = !context.env.ADMIN_TOKEN
  if (!isDev && !isAuthenticated(context)) {
    return jsonResponse(
      { error: "Unauthorized: Vui lòng cung cấp mã ADMIN_TOKEN hợp lệ" },
      401
    )
  }

  const url = new URL(context.request.url)
  const forceRefresh =
    url.searchParams.get("refresh") === "true" ||
    url.searchParams.get("force") === "true"

  const currentUpdated =
    (await context.env.DICT_KV.get(updatedKey(name))) ?? "initial"
  const cachedVersion = await context.env.DICT_KV.get(auditVersionKey(name))

  // Fast path: if dictionary hasn't changed and no force refresh requested, return cached audit result
  if (!forceRefresh && cachedVersion && cachedVersion === currentUpdated) {
    const cachedData = await context.env.DICT_KV.get(auditCacheKey(name))
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        return jsonResponse(parsed)
      } catch {
        /* proceed to full audit if cache corrupted */
      }
    }
  }

  const content = (await context.env.DICT_KV.get(contentKey(name))) ?? ""
  const words = content
    .split(/\r?\n/)
    .map((w) => w.trim())
    .filter(Boolean)

  let ignoredPairs = new Set<string>()
  try {
    const ignoredJson = await context.env.DICT_KV.get(ignoredPairsKey(name))
    if (ignoredJson) {
      const parsed = JSON.parse(ignoredJson)
      if (Array.isArray(parsed)) {
        ignoredPairs = new Set(parsed)
      }
    }
  } catch {
    /* ignore parsing errors */
  }

  const auditResult = auditDictionary(name, words, ignoredPairs)

  // Save to cache asynchronously (fire-and-forget / non-blocking)
  try {
    await context.env.DICT_KV.put(
      auditCacheKey(name),
      JSON.stringify(auditResult)
    )
    await context.env.DICT_KV.put(auditVersionKey(name), currentUpdated)
  } catch {
    /* ignore cache save error */
  }

  return jsonResponse(auditResult)
}

export async function onRequestPost(
  context: RequestContext
): Promise<Response> {
  const name = resolveName(context.params)
  if (!name) {
    return jsonResponse({ error: "Unknown dictionary name" }, 404)
  }

  const isDev = !context.env.ADMIN_TOKEN
  if (!isDev && !isAuthenticated(context)) {
    return jsonResponse(
      { error: "Unauthorized: Vui lòng cung cấp mã ADMIN_TOKEN hợp lệ" },
      401
    )
  }

  let payload: { pairKey?: string }
  try {
    payload = await context.request.json()
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400)
  }

  const pairKey = payload.pairKey?.trim()
  if (!pairKey || pairKey.length > 100) {
    return jsonResponse(
      { error: "Invalid pairKey: must be non-empty and <= 100 characters" },
      400
    )
  }

  let ignoredList: string[] = []
  try {
    const existing = await context.env.DICT_KV.get(ignoredPairsKey(name))
    if (existing) {
      const parsed = JSON.parse(existing)
      if (Array.isArray(parsed)) {
        ignoredList = parsed
      }
    }
  } catch {
    /* ignore */
  }

  if (!ignoredList.includes(pairKey)) {
    ignoredList.push(pairKey)
    await context.env.DICT_KV.put(
      ignoredPairsKey(name),
      JSON.stringify(ignoredList)
    )
  }

  return jsonResponse({
    success: true,
    ignoredCount: ignoredList.length,
    pairKey
  })
}
