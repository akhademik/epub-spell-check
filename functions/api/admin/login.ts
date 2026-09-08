// Cloudflare Pages Function — handles login redirect for Cloudflare Access
// If protected by Cloudflare Access, accessing this URL forces Google/OTP login and redirects back to admin dashboard.

interface RequestContext {
  request: Request
}

export async function onRequestGet(context: RequestContext): Promise<Response> {
  const url = new URL(context.request.url)
  const redirectTarget = url.searchParams.get("redirect") || "/?view=admin"

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTarget,
      "cache-control": "no-store"
    }
  })
}
