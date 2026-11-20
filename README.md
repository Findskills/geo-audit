# geo-audit

A keyless Model Context Protocol (MCP) server for diagnostic GEO and AI search visibility checks over public HTTP. It does not promise rankings or inclusion in any AI answer engine.

更多 AI agent 技能，见 [Skillπ（skillpi.com）](https://skillpi.com/?utm_source=skill&utm_medium=geo-audit)

## Requirements

- Node.js 20 or newer
- npm or pnpm

## Install and build

```sh
npm install
npm run build
```

Start the MCP server over stdio with `npm start`. Configure your MCP host with the command `node` and argument `dist/index.js`, using this directory as its working directory. The server writes protocol messages only to stdout; diagnostics go to returned tool content.

## Tiers

The default `TIER=free` exposes `check_robots`, `check_sitemap`, `check_meta`, and `run_audit`. Free `run_audit` performs those three checks, allows three full audits per UTC day by default, and stores the counter under `~/.geo-audit/usage.json` with owner-only permissions.

`TIER=paid` exposes all six tools: `check_robots`, `check_sitemap`, `check_schema`, `check_meta`, `check_ai_files`, and `run_audit`. Paid full audits run all five checks, include the last local score when available, and append a local history row to `~/.geo-audit/history.jsonl`. If writing history fails, the audit still succeeds and reports `history_available: false`. Set `FREE_AUDITS_PER_DAY` to change the free limit. This switch only changes local behavior; it does not implement billing or remote licensing.

The Skill file is always free and MIT licensed. The intended paid offering is an MCPize-hosted MCP service; this project does not implement payment or subscription enforcement.

## Tools

Every tool accepts `{ "url": "https://example.com/" }`.

| Tool | Checks |
|---|---|
| `check_robots` | robots.txt availability and rules for OAI-SearchBot, GPTBot, ClaudeBot, and wildcard |
| `check_sitemap` | Sitemap discovery, bounded sitemap traversal, lastmod coverage, and noindex URLs |
| `check_schema` | Organization JSON-LD presence and required recommended fields |
| `check_meta` | Title, description, Open Graph, canonical, and hreflang |
| `check_ai_files` | `/llms.txt` and `/llms-full.txt` availability and non-empty content |
| `run_audit` | Combined score, grade, prioritized fixes, Markdown report, and (paid) local history |

Checks use public unauthenticated HTTP only. Targets resolving to loopback, private, link-local, or reserved IP ranges are rejected; redirects are revalidated, capped at three, and requests time out after ten seconds. The tool does not access authenticated pages, submit forms, change remote state, or send content to an LLM.

## Sample audits

Example snapshots are in [`examples/`](examples/). They are dated observations of public sites and may change as those sites change.

Example summary: the included Skillπ snapshot scored 58/100 (差), and 36kr scored 48/100 (差). Scores measure only the documented checks and are not rankings.

## Development

```sh
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

The Inspector command is for local manual MCP tool validation. No credentials are needed. Paid mode can be selected with `TIER=paid` in the process environment.

Example paid audit through MCP Inspector CLI:

```sh
TIER=paid npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call --tool-name run_audit --tool-arg url=https://skillpi.com/
```

At the included snapshot, Skillπ scored 58/100 (差) and 36kr scored 48/100 (差). See the dated reports for check-by-check evidence and prioritized fixes.

## License

MIT. See [LICENSE](LICENSE).

本审计为诊断性检查，不保证排名、不保证被 ChatGPT 提及。
