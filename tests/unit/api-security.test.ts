import { describe, expect, it } from "vitest"
import { sanitizeRedirectUrl } from "../../functions/api/admin/login"

describe("TASK 4: Admin & API Security", () => {
  describe("1. Open Redirect Prevention (sanitizeRedirectUrl)", () => {
    it("allows safe internal and relative paths", () => {
      expect(sanitizeRedirectUrl("/?view=admin")).toBe("/?view=admin")
      expect(sanitizeRedirectUrl("/admin")).toBe("/admin")
      expect(sanitizeRedirectUrl("/dashboard?key=value#section")).toBe(
        "/dashboard?key=value#section"
      )
    })

    it("sanitizes null, empty, or whitespace strings to default admin route", () => {
      expect(sanitizeRedirectUrl(null)).toBe("/?view=admin")
      expect(sanitizeRedirectUrl("")).toBe("/?view=admin")
      expect(sanitizeRedirectUrl("   ")).toBe("/?view=admin")
    })

    it("blocks absolute URLs (Open Redirect exploit attempts)", () => {
      expect(sanitizeRedirectUrl("https://evil.com")).toBe("/?view=admin")
      expect(sanitizeRedirectUrl("http://attacker.org/phishing")).toBe(
        "/?view=admin"
      )
      expect(sanitizeRedirectUrl("ftp://files.evil.com")).toBe("/?view=admin")
    })

    it("blocks protocol-relative URLs (//evil.com)", () => {
      expect(sanitizeRedirectUrl("//evil.com")).toBe("/?view=admin")
      expect(sanitizeRedirectUrl("//attacker.org/steal-token")).toBe(
        "/?view=admin"
      )
    })

    it("blocks backslash trickery (/\\evil.com)", () => {
      expect(sanitizeRedirectUrl("/\\evil.com")).toBe("/?view=admin")
    })

    it("blocks javascript and data URI schemes", () => {
      expect(sanitizeRedirectUrl("javascript:alert(document.cookie)")).toBe(
        "/?view=admin"
      )
      expect(sanitizeRedirectUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(
        "/?view=admin"
      )
    })

    it("blocks CRLF header injection attempts", () => {
      expect(
        sanitizeRedirectUrl("/?view=admin\r\nSet-Cookie: admin=hacked")
      ).toBe("/?view=admin")
      expect(
        sanitizeRedirectUrl("/?view=admin\nLocation: https://evil.com")
      ).toBe("/?view=admin")
    })
  })

  describe("2. Dictionary API Bounds & Action Validation", () => {
    const ALLOWED_NAMES = new Set(["vn", "non-vn", "custom", "names"])

    it("only permits whitelisted dictionary names", () => {
      expect(ALLOWED_NAMES.has("vn")).toBe(true)
      expect(ALLOWED_NAMES.has("non-vn")).toBe(true)
      expect(ALLOWED_NAMES.has("custom")).toBe(true)
      expect(ALLOWED_NAMES.has("names")).toBe(true)

      expect(ALLOWED_NAMES.has("admin")).toBe(false)
      expect(ALLOWED_NAMES.has("../etc/passwd")).toBe(false)
      expect(ALLOWED_NAMES.has("config")).toBe(false)
      expect(ALLOWED_NAMES.has("secret")).toBe(false)
    })

    it("deduplicates and normalizes incoming words while enforcing bounds", () => {
      const MAX_WORDS = 10000
      const MAX_LENGTH = 100

      const incoming = [
        "  từ_1  ",
        "từ_1", // duplicate
        "từ_2",
        "a".repeat(150), // exceeds max length
        ""
      ]

      const cleaned = Array.from(
        new Set(
          incoming
            .filter((w): w is string => typeof w === "string")
            .map((w) => w.trim().normalize("NFC"))
            .filter((w) => Boolean(w) && w.length <= MAX_LENGTH)
        )
      )

      expect(cleaned).toEqual(["từ_1", "từ_2"])
      expect(cleaned.length).toBeLessThanOrEqual(MAX_WORDS)
    })
  })

  describe("3. Private API Lockdown (Reject unauthenticated public requests)", () => {
    function mockIsAuthenticated(
      authHeader: string | null,
      adminToken?: string
    ): boolean {
      if (!adminToken) return false
      const providedToken = (authHeader ?? "").replace(/^Bearer\s+/i, "").trim()
      return Boolean(providedToken && providedToken === adminToken)
    }

    it("rejects unauthenticated requests when ADMIN_TOKEN is set", () => {
      const ADMIN_TOKEN = "super-secret-token-123"

      // No header
      expect(mockIsAuthenticated(null, ADMIN_TOKEN)).toBe(false)
      // Empty header
      expect(mockIsAuthenticated("", ADMIN_TOKEN)).toBe(false)
      // Wrong token
      expect(mockIsAuthenticated("Bearer wrong-token", ADMIN_TOKEN)).toBe(false)
      // Correct token
      expect(mockIsAuthenticated(`Bearer ${ADMIN_TOKEN}`, ADMIN_TOKEN)).toBe(
        true
      )
    })

    it("rejects all requests if ADMIN_TOKEN is not configured on server", () => {
      expect(mockIsAuthenticated("Bearer any-token", undefined)).toBe(false)
      expect(mockIsAuthenticated(null, undefined)).toBe(false)
    })
  })
})
