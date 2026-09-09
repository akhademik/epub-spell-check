export type DictSourceName = "vn" | "non-vn" | "custom" | "names"

export interface DictUpdateResult {
  name: DictSourceName
  action: "add" | "remove"
  affectedCount: number
  addedCount?: number
  removedCount?: number
  totalCount: number
  updatedAt: string
  user?: string
}

export interface DictDetailResponse {
  name: DictSourceName
  totalCount: number
  updatedAt: string
  words: string[]
}

export interface AuthStatusResponse {
  authenticated: boolean
  authType: "token" | "none"
  email: string | null
  hasTokenConfigured?: boolean
}

/**
 * Checks authentication status with the server using the provided token.
 */
export async function checkAuthStatus(
  token?: string
): Promise<AuthStatusResponse> {
  const isDev = Boolean(import.meta.env?.DEV)

  const headers: Record<string, string> = {}
  if (token?.trim()) {
    headers.authorization = `Bearer ${token.trim()}`
  }

  try {
    const res = await fetch("/api/admin/auth-status", { headers })
    if (res.ok) {
      const contentType = res.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        return (await res.json()) as AuthStatusResponse
      }
    }
  } catch {
    /* fallback */
  }

  // In local Vite dev (`pnpm run dev`), Cloudflare Functions are not running.
  // We automatically authenticate local developer so you can inspect UI and test.
  if (isDev) {
    return {
      authenticated: true,
      authType: "token",
      email: null,
      hasTokenConfigured: false
    }
  }

  return {
    authenticated: false,
    authType: "none",
    email: null,
    hasTokenConfigured: false
  }
}

/**
 * Fetches the full dictionary word list as an array along with metadata.
 */
export async function fetchDictionaryDetails(
  dictName: DictSourceName
): Promise<DictDetailResponse> {
  const res = await fetch(`/api/dict/${dictName}?format=json`, {
    headers: {
      accept: "application/json"
    }
  })

  if (res.ok) {
    const contentType = res.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      return (await res.json()) as DictDetailResponse
    }
  }

  // Fallback if API only returned plain text (e.g. static server / fallback)
  const textRes = await fetch(`/${dictName}-dict.txt`)
  const text = await textRes.text()
  const words = text
    .split(/\r?\n/)
    .map((w) => w.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "vi"))

  return {
    name: dictName,
    totalCount: words.length,
    updatedAt: new Date().toISOString(),
    words
  }
}

/**
 * Adds or removes words from a dictionary via the /api/dict/:name endpoint.
 * Supports Cloudflare Access (Zero Trust session cookie) or optional ADMIN_TOKEN.
 */
export async function updateDictionaryWords(
  dictName: DictSourceName,
  words: string[],
  token?: string,
  action: "add" | "remove" = "add"
): Promise<DictUpdateResult> {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  }

  if (token?.trim()) {
    headers.authorization = `Bearer ${token.trim()}`
  }

  const res = await fetch(`/api/dict/${dictName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ words, action })
  })

  if (res.status === 401) {
    throw new Error(
      "Chưa được cấp quyền (401). Vui lòng nhập mã ADMIN_TOKEN hợp lệ."
    )
  }
  if (!res.ok) {
    let detail = ""
    try {
      const body = (await res.json()) as { error?: string }
      detail = body.error ?? ""
    } catch {
      /* intentional no-op */
    }
    throw new Error(
      `Không thể cập nhật từ điển (mã lỗi ${res.status}). ${detail}`.trim()
    )
  }

  return (await res.json()) as DictUpdateResult
}

export interface DictAuditResponse {
  garbage: {
    word: string
    dictName: DictSourceName
    tier: "A" | "B"
    reasons: string[]
  }[]
  duplicateClusters: {
    id: string
    words: {
      word: string
      garbageScore: number
      suggestion: "keep" | "delete" | "neutral"
      reasons?: string[]
    }[]
    confidence: "high" | "low"
  }[]
}

/**
 * Runs a dictionary quality audit via /api/dict/:name/audit or local fallback.
 */
export async function fetchDictionaryAudit(
  dictName: DictSourceName,
  token?: string
): Promise<DictAuditResponse> {
  const headers: Record<string, string> = {
    accept: "application/json"
  }
  if (token?.trim()) {
    headers.authorization = `Bearer ${token.trim()}`
  }

  try {
    const res = await fetch(`/api/dict/${dictName}/audit`, { headers })
    if (res.ok) {
      return (await res.json()) as DictAuditResponse
    }
  } catch {
    /* fallback */
  }

  // Fallback for local development if Cloudflare Functions are not running
  const details = await fetchDictionaryDetails(dictName)
  const { auditDictionary } = await import("./dict-quality")
  return auditDictionary(dictName, details.words)
}

/**
 * Saves an ignored pair via /api/dict/:name/audit/ignore.
 */
export async function ignoreDuplicatePair(
  dictName: DictSourceName,
  pairKey: string,
  token?: string
): Promise<boolean> {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  }
  if (token?.trim()) {
    headers.authorization = `Bearer ${token.trim()}`
  }

  try {
    const res = await fetch(`/api/dict/${dictName}/audit/ignore`, {
      method: "POST",
      headers,
      body: JSON.stringify({ pairKey })
    })
    return res.ok
  } catch {
    return true
  }
}
