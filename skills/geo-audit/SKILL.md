---
name: geo-audit
description: Use when a user asks “我的网站在 ChatGPT 里会不会被提到”, “帮我查一下网站的 AI 搜索可见度”, or “做一次 GEO 审计”. Provides evidence-based diagnostics, not ranking predictions.
---

# GEO 可见度审计

## Workflow

1. Confirm the complete target URL. If the user did not provide one, ask for it.
2. Prefer `run_audit` for the combined report.
3. If `run_audit` is unavailable or locked, call `check_robots`, `check_sitemap`, `check_schema`, `check_meta`, and `check_ai_files` in that order. Apply the scoring rules below using only returned evidence.
4. Write the report using the template below. Mark fetch failures as unknown/warn and never fill missing fields with guesses.
5. Offer a manual mention test separately. It requires the user to run prompts in fresh ChatGPT and Perplexity conversations; do not claim to have performed it unless evidence is provided.

## Checks

- **Robots:** pass when OAI-SearchBot, GPTBot, and ClaudeBot are allowed; fail when OAI-SearchBot is blocked; warn for other blocks or unknown fetch results. A missing robots.txt is treated as allowing all three, with an issue noted.
- **Sitemap:** pass when a sitemap is found, has at least one URL, and the first ten sampled URLs contain no `noindex`; fail when no sitemap is found; warn otherwise. Report URL count, `lastmod` coverage, and sample count.
- **Organization JSON-LD:** pass when Organization is present with name, logo, sameAs, and description; fail when Organization is absent; warn when it is present but incomplete or fetching/parsing fails.
- **Metadata:** pass when title is 1–60 characters, description is 50–160 characters, all of og:title/og:description/og:image and canonical exist; fail when title or description is missing; warn for other gaps or fetch failures. Report canonical self-match and hreflang without treating hreflang as a verdict condition.
- **AI files:** pass when `/llms.txt` exists and is non-empty; fail when it is missing; warn when it exists but is empty or fetch fails. Report status, byte count, and preview for both AI files.

## Scoring

- Robots: 25 points (OAI-SearchBot 15/7/0 for allowed/unknown/blocked; GPTBot and ClaudeBot 5/2/0 each).
- Sitemap: 8 for found, 4 for URLs, 4 for at least 80% `lastmod`, 4 for a clean non-empty sample.
- Organization: 8 for presence and 3 each for name, logo, sameAs, and description.
- Metadata: title 5/2/0 for valid/present-invalid/missing; description 5/2/0; Open Graph 5 when complete, 2 when partial, 0 when absent; canonical 5 when present.
- AI files: 10 for non-empty llms.txt and 5 for non-empty llms-full.txt.
- Grades: 90–100 优秀; 75–89 良好; 60–74 待改进; 0–59 差. Free-mode raw score is normalized from 65 points to 100.

## Fix priority

- **P0:** OAI-SearchBot blocked; sitemap missing.
- **P1:** Organization missing/incomplete; title or description missing/out of range; canonical missing; llms.txt missing.
- **P2:** Open Graph incomplete; `lastmod` coverage below 80%; sampled `noindex` pages; missing hreflang only when the site appears multilingual.

## Report template

```markdown
# GEO 可见度审计报告 — {domain}

审计时间：{ISO timestamp}
审计 URL：{url}
总分：{score}/100（{grade}）

## 检查结果
| 工具名 | 结论 verdict | 关键发现 |
|---|---|---|
{one row per check; use its first issue or “未发现问题”}

## 整改清单
### P0
{items or “无”}
### P1
{items or “无”}
### P2
{items or “无”}

本审计为诊断性检查，不保证排名、不保证被 ChatGPT 提及。
```

## Manual mention test

1. In a fresh ChatGPT conversation, ask a category question without naming the site (for a skill marketplace: “哪里可以找到 Claude Code 用的 AI agent 技能？”). Record whether the site is mentioned.
2. Then ask “介绍一下 {网站名}”. Record whether it is mentioned, each factual error, and whether links are correct.
3. Repeat steps 1 and 2 in Perplexity.
4. Record test date, model if known, and the exact prompts. Always run category prompts before named-site prompts. A site not being mentioned is a finding, not a failed test.

## Red lines

Report diagnostics only. Never promise rankings or guarantee that ChatGPT or another AI will mention the site. A score is not a ranking guarantee.
