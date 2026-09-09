#!/usr/bin/env tsx
/**
 * Git Pre-commit Hook Script: pull-dicts-from-kv.ts
 *
 * Automatically pulls the latest dictionary content from Cloudflare KV,
 * compares with public/*-dict.txt, and stages any updates before commit.
 *
 * IMPORTANT: Non-blocking design! If network or credentials fail,
 * it logs a warning and exits with code 0 so commit is never blocked.
 */

import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const ALL_DICTS = ["vn", "names", "non-vn", "custom"] as const
type DictName = (typeof ALL_DICTS)[number]

const DICT_TO_FILE: Record<DictName, string> = {
  vn: "public/vn-dict.txt",
  names: "public/names-dict.txt",
  "non-vn": "public/non-vn-dict.txt",
  custom: "public/custom-dict.txt"
}

function getNamespaceId(): string | null {
  const wranglerPath = path.resolve(process.cwd(), "wrangler.toml")
  if (!fs.existsSync(wranglerPath)) return null
  const content = fs.readFileSync(wranglerPath, "utf8")
  const match = content.match(/id\s*=\s*"([^"]+)"/)
  return match ? match[1] : null
}

async function main() {
  const namespaceId = getNamespaceId()
  if (!namespaceId) {
    console.warn(
      "⚠️  [dict-sync] Không tìm thấy KV namespace id trong wrangler.toml, bỏ qua sync."
    )
    process.exit(0)
  }

  let updatedCount = 0

  for (const dict of ALL_DICTS) {
    const localFilePath = path.resolve(process.cwd(), DICT_TO_FILE[dict])
    let localContent = ""
    if (fs.existsSync(localFilePath)) {
      localContent = fs.readFileSync(localFilePath, "utf8")
    }

    try {
      // Execute wrangler kv key get via pnpm dlx (works without adding wrangler to package dependencies)
      const cmd = `pnpm dlx wrangler kv key get "dict:${dict}:content" --namespace-id "${namespaceId}" --remote`
      const remoteContent = execSync(cmd, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 5000
      })

      // Normalize line endings
      const normLocal = localContent.replace(/\r\n/g, "\n").trim()
      const normRemote = remoteContent.replace(/\r\n/g, "\n").trim()

      if (normLocal !== normRemote) {
        fs.writeFileSync(
          localFilePath,
          normRemote ? `${normRemote}\n` : "",
          "utf8"
        )
        try {
          execSync(`git add "${DICT_TO_FILE[dict]}"`, { stdio: "ignore" })
        } catch {
          /* ignore */
        }
        const localWords = normLocal ? normLocal.split("\n").length : 0
        const remoteWords = normRemote ? normRemote.split("\n").length : 0
        const diff = remoteWords - localWords
        const sign = diff >= 0 ? `+${diff}` : `${diff}`
        console.log(
          `✓ Đã cập nhật ${DICT_TO_FILE[dict]} từ KV (${sign} từ, hiện có ${remoteWords} từ)`
        )
        updatedCount++
      }
    } catch {
      // Non-blocking but observable: warn developer that KV sync was skipped
      console.warn(
        `⚠️  [dict-sync] Không thể đồng bộ từ điển "${dict}" từ Cloudflare KV (Commit vẫn tiếp tục).`
      )
    }
  }

  if (updatedCount > 0) {
    console.log(
      `🔄 [dict-sync] Đã tự động đồng bộ ${updatedCount} file từ điển từ KV vào commit này.`
    )
  }

  process.exit(0)
}

main().catch(() => {
  console.warn(
    "⚠️  [dict-sync] Quá trình kiểm tra KV gặp sự cố. Bỏ qua sync để không gián đoạn commit."
  )
  process.exit(0)
})
