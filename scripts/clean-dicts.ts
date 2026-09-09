#!/usr/bin/env tsx
/**
 * CLI Tool: clean-dicts.ts
 *
 * Scans dictionaries for Tier A garbage and fuzzy near-duplicates.
 * Supports local files (`public/*.txt`) or Cloudflare KV (`--source=kv`).
 *
 * Usage:
 *   pnpm tsx scripts/clean-dicts.ts [--source=local|kv] [--dict=vn,names...] [--dry-run] [--apply] [--tier=A]
 */

import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { auditDictionary, type DictName } from "../src/utils/dict-quality"

const ALL_DICTS: DictName[] = ["vn", "names", "non-vn", "custom"]

const DICT_TO_FILE: Record<DictName, string> = {
  vn: "public/vn-dict.txt",
  names: "public/names-dict.txt",
  "non-vn": "public/non-vn-dict.txt",
  custom: "public/custom-dict.txt"
}

interface CliOptions {
  source: "local" | "kv"
  namespaceId?: string
  dicts: DictName[]
  dryRun: boolean
  tier: "A" | "all"
  benchmark: boolean
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  let source: "local" | "kv" = "local"
  let namespaceId: string | undefined
  let dicts: DictName[] = [...ALL_DICTS]
  let dryRun = true
  let tier: "A" | "all" = "A"
  let benchmark = false

  for (const arg of args) {
    if (arg.startsWith("--source=")) {
      const s = arg.split("=")[1]?.toLowerCase()
      if (s === "kv" || s === "local") source = s
    } else if (arg.startsWith("--namespace-id=")) {
      namespaceId = arg.split("=")[1]
    } else if (arg.startsWith("--dict=")) {
      const d = arg
        .split("=")[1]
        .split(",")
        .map((x) => x.trim()) as DictName[]
      dicts = d.filter((x) => ALL_DICTS.includes(x))
    } else if (arg === "--apply") {
      dryRun = false
    } else if (arg === "--dry-run") {
      dryRun = true
    } else if (arg === "--benchmark") {
      benchmark = true
    } else if (arg.startsWith("--tier=")) {
      const t = arg.split("=")[1]?.toUpperCase()
      if (t === "A" || t === "ALL") tier = t === "A" ? "A" : "all"
    }
  }

  return { source, namespaceId, dicts, dryRun, tier, benchmark }
}

function getNamespaceIdFromWrangler(): string | undefined {
  const wranglerPath = path.resolve(process.cwd(), "wrangler.toml")
  if (!fs.existsSync(wranglerPath)) return undefined
  const content = fs.readFileSync(wranglerPath, "utf8")
  const match = content.match(/id\s*=\s*"([^"]+)"/)
  return match ? match[1] : undefined
}

function readDictContent(
  dictName: DictName,
  source: "local" | "kv",
  namespaceId?: string
): string[] {
  if (source === "local") {
    const filePath = path.resolve(process.cwd(), DICT_TO_FILE[dictName])
    if (!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, "utf8")
    return raw
      .split(/\r?\n/)
      .map((w) => w.trim())
      .filter(Boolean)
  }

  // KV source via wrangler
  const nsId = namespaceId || getNamespaceIdFromWrangler()
  if (!nsId) {
    throw new Error(
      "Không tìm thấy KV namespace-id. Vui lòng truyền --namespace-id=<id> hoặc khai báo trong wrangler.toml"
    )
  }

  try {
    const cmd = `npx wrangler kv key get "dict:${dictName}:content" --namespace-id "${nsId}" --remote`
    const output = execSync(cmd, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"]
    })
    return output
      .split(/\r?\n/)
      .map((w) => w.trim())
      .filter(Boolean)
  } catch (err) {
    console.warn(
      `⚠️  Không thể đọc KV cho từ điển "${dictName}":`,
      err instanceof Error ? err.message : String(err)
    )
    return []
  }
}

function readIgnoredPairs(
  dictName: DictName,
  source: "local" | "kv",
  namespaceId?: string
): Set<string> {
  if (source === "kv") {
    const nsId = namespaceId || getNamespaceIdFromWrangler()
    if (nsId) {
      try {
        const cmd = `npx wrangler kv key get "dict:${dictName}:ignored-pairs" --namespace-id "${nsId}" --remote`
        const output = execSync(cmd, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "ignore"]
        })
        if (output) {
          const parsed = JSON.parse(output)
          if (Array.isArray(parsed)) return new Set(parsed)
        }
      } catch {
        /* no ignored pairs or offline */
      }
    }
  }
  return new Set()
}

function backupAndWrite(
  dictName: DictName,
  source: "local" | "kv",
  originalWords: string[],
  cleanWords: string[],
  namespaceId?: string
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

  if (source === "local") {
    const backupDir = path.resolve(process.cwd(), "public/.backup")
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    const backupFile = path.join(backupDir, `${dictName}-dict.${timestamp}.txt`)
    fs.writeFileSync(backupFile, `${originalWords.join("\n")}\n`, "utf8")
    console.log(
      `  💾 Đã sao lưu bản cũ vào: ${path.relative(process.cwd(), backupFile)}`
    )

    const targetFile = path.resolve(process.cwd(), DICT_TO_FILE[dictName])
    fs.writeFileSync(targetFile, `${cleanWords.join("\n")}\n`, "utf8")
    console.log(
      `  ✓ Đã ghi đè ${cleanWords.length} từ sạch vào ${DICT_TO_FILE[dictName]}`
    )
  } else {
    const nsId = namespaceId || getNamespaceIdFromWrangler()
    if (!nsId) throw new Error("Missing namespace-id for KV write")

    const backupKey = `dict:${dictName}:content:backup:${timestamp}`
    const tempBackupFile = path.resolve(
      process.cwd(),
      `.backup-temp-${dictName}.txt`
    )
    fs.writeFileSync(tempBackupFile, originalWords.join("\n"), "utf8")

    try {
      execSync(
        `npx wrangler kv key put "${backupKey}" --path "${tempBackupFile}" --namespace-id "${nsId}" --remote`,
        { stdio: "inherit" }
      )
      console.log(`  💾 Đã sao lưu KV backup key: ${backupKey}`)

      const tempCleanFile = path.resolve(
        process.cwd(),
        `.clean-temp-${dictName}.txt`
      )
      fs.writeFileSync(tempCleanFile, cleanWords.join("\n"), "utf8")
      execSync(
        `npx wrangler kv key put "dict:${dictName}:content" --path "${tempCleanFile}" --namespace-id "${nsId}" --remote`,
        { stdio: "inherit" }
      )
      execSync(
        `npx wrangler kv key put "dict:${dictName}:updated" "${new Date().toISOString()}" --namespace-id "${nsId}" --remote`,
        { stdio: "inherit" }
      )
      console.log(
        `  ✓ Đã cập nhật ${cleanWords.length} từ sạch vào KV dict:${dictName}:content`
      )

      if (fs.existsSync(tempCleanFile)) fs.unlinkSync(tempCleanFile)
    } finally {
      if (fs.existsSync(tempBackupFile)) fs.unlinkSync(tempBackupFile)
    }
  }
}

async function main() {
  const options = parseArgs()

  console.log("==================================================")
  console.log("🧹 EPUB-SPELL-CHECK: DICTIONARY CLEAN & AUDIT TOOL")
  console.log("==================================================")
  console.log(`- Nguồn dữ liệu (Source) : ${options.source.toUpperCase()}`)
  console.log(`- Danh sách từ điển      : ${options.dicts.join(", ")}`)
  console.log(
    `- Chế độ thực thi        : ${options.dryRun ? "DRY-RUN (Chỉ kiểm tra, KHÔNG ghi)" : "APPLY (GHI THAY ĐỔI)"}`
  )
  console.log(
    `- Cấp độ dọn rác         : ${options.tier === "A" ? "Tier A (Độ tin cậy rất cao)" : "Tier A & B"}`
  )
  console.log("--------------------------------------------------\n")

  const reportDir = path.resolve(process.cwd(), "reports")
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const reportPath = path.join(reportDir, `dict-clean-${timestamp}.md`)
  let markdownReport = `# Báo Cáo Kiểm Tra & Dọn Rác Từ Điển (${new Date().toLocaleString("vi-VN")})\n\n`
  markdownReport += `- Nguồn: \`${options.source}\`\n- Chế độ: \`${options.dryRun ? "DRY-RUN" : "APPLY"}\`\n\n`

  for (const dictName of options.dicts) {
    console.log(`🔍 Đang kiểm tra từ điển "${dictName}"...`)
    const words = readDictContent(dictName, options.source, options.namespaceId)
    const ignoredPairs = readIgnoredPairs(
      dictName,
      options.source,
      options.namespaceId
    )

    if (words.length === 0) {
      console.log(`  (Từ điển "${dictName}" trống hoặc không đọc được)\n`)
      continue
    }

    const { garbage, duplicateClusters, timing } = auditDictionary(
      dictName,
      words,
      ignoredPairs
    )
    const tierAFindings = garbage.filter((g) => g.tier === "A")
    const tierBFindings = garbage.filter((g) => g.tier === "B")

    console.log(
      `  - Tổng số từ                  : ${words.length.toLocaleString()}`
    )
    console.log(`  - Rác Tier A (Độ tin cậy cao) : ${tierAFindings.length}`)
    console.log(`  - Nghi vấn Tier B (Cần review): ${tierBFindings.length}`)
    console.log(`  - Cụm trùng lặp mờ (Clusters) : ${duplicateClusters.length}`)
    if (timing) {
      console.log(
        `  - Hiệu năng (Telemetry)       : Tổng ${timing.totalMs}ms (Rác: ${timing.garbageScanMs}ms, Index: ${timing.indexBuildMs}ms, Fuzzy: ${timing.fuzzyScanMs}ms)`
      )
      console.log(
        `  - Phép tính (Computations)    : ${timing.candidateCount.toLocaleString()} candidates -> ${timing.levenshteinCheckCount.toLocaleString()} Levenshtein -> ${timing.matchedPairCount} matches (${timing.clusterCount} cụm)`
      )
    }

    markdownReport += `## Từ điển: \`${dictName}\`\n\n`
    markdownReport += `- **Tổng số từ**: ${words.length.toLocaleString()}\n`
    markdownReport += `- **Tier A**: ${tierAFindings.length}\n`
    markdownReport += `- **Tier B**: ${tierBFindings.length}\n`
    markdownReport += `- **Cụm trùng lặp mờ**: ${duplicateClusters.length}\n`
    if (timing) {
      markdownReport += `- **Thời gian chạy**: ${timing.totalMs}ms (${timing.candidateCount.toLocaleString()} candidates, ${timing.levenshteinCheckCount.toLocaleString()} Levenshtein, ${timing.matchedPairCount} matches)\n`
    }
    markdownReport += "\n"

    if (tierAFindings.length > 0) {
      markdownReport += `### ❌ Danh sách Tier A (${tierAFindings.length} từ):\n`
      for (const f of tierAFindings.slice(0, 50)) {
        markdownReport += `- \`${f.word}\`: ${f.reasons.join(", ")}\n`
      }
      if (tierAFindings.length > 50) {
        markdownReport += `*(...và ${tierAFindings.length - 50} từ khác)*\n`
      }
      markdownReport += "\n"
    }

    if (tierBFindings.length > 0) {
      markdownReport += `### ⚠️ Danh sách Tier B (${tierBFindings.length} từ):\n`
      for (const f of tierBFindings.slice(0, 30)) {
        markdownReport += `- \`${f.word}\`: ${f.reasons.join(", ")}\n`
      }
      markdownReport += "\n"
    }

    if (!options.dryRun && tierAFindings.length > 0) {
      const tierASet = new Set(tierAFindings.map((g) => g.word))
      const cleanWords = words.filter((w) => !tierASet.has(w))
      backupAndWrite(
        dictName,
        options.source,
        words,
        cleanWords,
        options.namespaceId
      )
    }

    console.log("")
  }

  fs.writeFileSync(reportPath, markdownReport, "utf8")
  console.log(
    `📄 Báo cáo chi tiết đã được lưu tại: ${path.relative(process.cwd(), reportPath)}`
  )
  console.log("\n✅ Hoàn thành.")
}

if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("clean-dicts.ts") ||
    process.argv[1].endsWith("clean-dicts.js"))
) {
  main().catch((err) => {
    console.error("Lỗi thực thi clean-dicts:", err)
    process.exit(1)
  })
}
