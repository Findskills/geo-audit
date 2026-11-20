# GEO 可见度审计报告 — skillpi.com

审计时间：2026-11-18T16:43:33.813Z
审计 URL：https://skillpi.com/
总分：58/100（差）

## 检查结果

| 工具名 | 结论 verdict | 关键发现 |
|---|---|---|
| check_robots | pass | 未发现问题 |
| check_sitemap | pass | 未发现问题 |
| check_meta | warn | title 超过 60 字符 |
| check_schema | fail | Organization 缺少字段：name, logo, sameAs, description |
| check_ai_files | fail | llms.txt 缺失——AI 爬虫无结构化入口 |

## 整改清单

### P0
- 无

### P1
- **补充 Organization JSON-LD**（check_schema）：在 HTML 中提供可解析的 Organization 结构化数据。
- **修正页面标题**（check_meta）：提供 1–60 字符的准确页面标题。
- **添加 llms.txt**（check_ai_files）：在站点根目录提供可读的 llms.txt 文件。

### P2
- **补充 sitemap lastmod**（check_sitemap）：仅在更新时间真实可追溯时提供 lastmod。

本审计为诊断性检查，不保证排名、不保证被 ChatGPT 提及。
