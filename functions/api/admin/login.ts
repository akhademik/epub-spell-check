// Cloudflare Pages Function — handles login redirect for Cloudflare Access
// If protected by Cloudflare Access, accessing this URL forces Google/OTP login and redirects back to admin dashboard.

interface RequestContext {
  request: Request
}

/**
 * Sanitizes redirect target to prevent Open Redirect attacks.
 * Only allows relative paths on the same origin (e.g. '/?view=admin').
 */
export function sanitizeRedirectUrl(rawUrl: string | null): string {
  if (!rawUrl) return "/?view=admin"

  const trimmed = rawUrl.trim()

  // Must start with '/' and not '//' or '/\' to prevent protocol-relative redirects
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\")
  ) {
    return "/?view=admin"
  }

  // Reject URLs with schemes (e.g. javascript:, data:, http:, https:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return "/?view=admin"
  }

  // Reject CRLF injection characters (\r, \n)
  if (/[\r\n]/.test(trimmed)) {
    return "/?view=admin"
  }

  return trimmed
}

export async function onRequestGet(context: RequestContext): Promise<Response> {
  const url = new URL(context.request.url)
  const redirectTarget = sanitizeRedirectUrl(url.searchParams.get("redirect"))

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTarget,
      "cache-control": "no-store"
    }
  })
}
