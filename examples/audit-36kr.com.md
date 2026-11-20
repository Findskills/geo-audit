# GEO 可见度审计报告 — 36kr.com

审计时间：2026-11-18T16:47:42.368Z
审计 URL：https://36kr.com/
总分：48/100（差）

## 检查结果

| 工具名 | 结论 verdict | 关键发现 |
|---|---|---|
| check_robots | pass | 未发现问题 |
| check_sitemap | warn | sitemap 中未解析到任何 URL |
| check_meta | fail | 缺少 title |
| check_schema | fail | 未发现 JSON-LD |
| check_ai_files | pass | 未发现问题 |

## 整改清单

### P0
- 无

### P1
- **补充 Organization JSON-LD**（check_schema）：在 HTML 中提供可解析的 Organization 结构化数据。
- **修正页面标题**（check_meta）：提供 1–60 字符的准确页面标题。
- **修正页面描述**（check_meta）：提供 50–160 字符且准确概括页面的描述。
- **设置 canonical**（check_meta）：为页面设置规范地址。

### P2
- **补齐 Open Graph 标签**（check_meta）：补充 og:title、og:description 和 og:image。
- **补充 sitemap lastmod**（check_sitemap）：仅在更新时间真实可追溯时提供 lastmod。

本审计为诊断性检查，不保证排名、不保证被 ChatGPT 提及。