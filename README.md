# GitLab MCP

A remote [Model Context Protocol](https://modelcontextprotocol.io/) server (NestJS + Streamable HTTP) that exposes GitLab actions to Claude and other MCP-compatible clients. Authenticates end-users with **GitHub OAuth** (via DCR) against an allowlist, then calls GitLab using a single server-side Personal Access Token.

Designed to be deployed to **Vercel** and added to Claude as a custom connector.

## Features

| Tool | Description |
| --- | --- |
| `gitlab_list_projects` | List projects visible to the authenticated user (search, pagination). |
| `gitlab_list_group_projects` | List projects inside a group (includes subgroups by default). |
| `gitlab_get_project` | Fetch a single project. |
| `gitlab_list_branches` | List branches of a project. |
| `gitlab_list_commits` | List commits (filter by ref, author, path, date range). |
| `gitlab_list_merge_requests` | List MRs (filter by state, author, reviewer, branches). |
| `gitlab_get_merge_request` | Fetch a single MR. |
| `gitlab_update_merge_request` | Edit title/description, close/reopen, change assignees/reviewers/labels. |
| `gitlab_list_merge_request_notes` | List MR comments. |
| `gitlab_create_merge_request_note` | Post a comment on an MR. |
| `gitlab_list_pipelines` | List pipelines. |
| `gitlab_get_pipeline` | Fetch a single pipeline. |
| `gitlab_list_pipeline_jobs` | List jobs in a pipeline. |
| `gitlab_get_job` | Fetch a single job. |
| `gitlab_get_job_trace` | Fetch job log (supports `tailLines` for long traces). |

## Architecture

```
┌──────────┐     OAuth 2.0 (DCR)      ┌──────────────────┐     GitHub OAuth    ┌──────────┐
│  Claude  │ ───────────────────────▶ │  gitlab-mcp      │ ──────────────────▶ │  GitHub  │
│          │ ◀── JWT access token ─── │  (Vercel)        │ ◀── identity ────── │          │
└────┬─────┘                          │                  │                     └──────────┘
     │    MCP (Streamable HTTP)       │                  │
     │      Bearer: <JWT>             │                  │     GitLab REST v4
     └───────────────────────────────▶│                  │ ──────────────────▶ ┌──────────┐
                                      │                  │ PRIVATE-TOKEN: PAT  │  GitLab  │
                                      └──────────────────┘                     └──────────┘
```

- **Claude → us**: MCP client authenticates with an OAuth bearer token we issue. Protected by `McpAuthJwtGuard` + `AllowlistGuard` (GitHub username allowlist).
- **Us → GitHub**: identity provider only — we read the authenticated user's GitHub username, check the allowlist, and discard the GitHub token.
- **Us → GitLab**: calls go out with a single server-side `GITLAB_TOKEN` (PAT). Claude's bearer is never forwarded (spec forbids token passthrough).

## Setup

### 1. GitHub OAuth app

Create one at [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App:

- **Application name**: `GitLab MCP` (anything)
- **Homepage URL**: `https://<your-vercel-project>.vercel.app`
- **Authorization callback URL**: `https://<your-vercel-project>.vercel.app/callback`

Copy the Client ID and generate a Client Secret.

### 2. GitLab Personal Access Token

Create at `<GITLAB_BASE_URL>/-/user_settings/personal_access_tokens` with the `api` scope.

### 3. JWT signing secret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 4. Environment variables

Copy [.env.example](.env.example) to `.env.local` for local dev, or set each on Vercel:

| Var | Value |
| --- | --- |
| `PUBLIC_BASE_URL` | `https://<your-vercel-project>.vercel.app` (no trailing slash) |
| `GITLAB_BASE_URL` | `https://gitlab.com` or your self-hosted URL |
| `GITLAB_TOKEN` | The PAT from step 2 |
| `GITHUB_CLIENT_ID` | From step 1 |
| `GITHUB_CLIENT_SECRET` | From step 1 |
| `GITHUB_USERNAMES_ALLOWLIST` | `your-gh-username,coworker1,coworker2` |
| `JWT_SECRET` | From step 3 |

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in values; PUBLIC_BASE_URL=http://localhost:3000
pnpm start:dev
```

The server listens on `:3000`. OAuth discovery at `http://localhost:3000/.well-known/oauth-authorization-server`. MCP endpoint at `http://localhost:3000/mcp`.

> For local OAuth to work with Claude, expose localhost via `ngrok http 3000` and set `PUBLIC_BASE_URL` + the GitHub OAuth callback to the ngrok URL.

## Deploying to Vercel

```bash
pnpm dlx vercel
pnpm dlx vercel env add        # add each variable from the table above (Production)
pnpm dlx vercel --prod
```

After the first deploy, go back to your GitHub OAuth app and confirm the callback URL points at the production Vercel URL.

## Connecting Claude

1. Open Claude → Settings → Connectors → **Add custom connector**.
2. Paste the URL: `https://<your-vercel-project>.vercel.app`.
3. Claude fetches OAuth metadata, registers itself via DCR, and opens a browser tab.
4. Log in with GitHub. If your username is on the allowlist, Claude receives a 24-hour access token.
5. The `gitlab_*` tools appear in any Claude conversation.

Coworkers follow the same steps.

## Project structure

```
api/
└── index.ts                    # Vercel serverless entry
src/
├── main.ts                     # local HTTP bootstrap
├── app.module.ts
├── config/
│   └── env.config.ts           # Zod-validated env schema
├── common/
│   └── exceptions/             # BaseException hierarchy
└── modules/
    ├── logger/                 # AppLogger
    ├── auth/                   # McpAuthModule wiring + allowlist guard
    │   ├── auth.module.ts
    │   └── guards/allowlist.guard.ts
    ├── gitlab/                 # HTTP client + feature services
    │   ├── services/
    │   │   ├── gitlab-api.service.ts
    │   │   ├── projects.service.ts
    │   │   ├── branches.service.ts
    │   │   ├── commits.service.ts
    │   │   ├── merge-requests.service.ts
    │   │   └── pipelines.service.ts
    │   └── types/
    └── mcp/                    # MCP tool registrations
        ├── mcp.module.ts       # Streamable HTTP transport + guards
        ├── tools/
        └── utils/mcp-response.util.ts
```

### Layering

- **`GitlabApiService`** — only place that calls `fetch`. Owns auth header, URL building, error → `BaseException` mapping.
- **Feature services** — typed methods per GitLab resource; MCP-agnostic.
- **MCP tools** — thin zod-validated adapters that call a feature service and wrap the response.
- **`AuthModule`** — delegates all OAuth AS plumbing to `@rekog/mcp-nest`'s `McpAuthModule` (metadata, DCR, authorize, token, callback, JWT issuance/validation).
- **`AllowlistGuard`** — runs after JWT validation on `/mcp`, enforces the GitHub username allowlist.

Adding a new action:

1. Add a method to the relevant feature service (or a new service + register in `GitlabModule`).
2. Add an `@Tool`-decorated method to the matching tool class (or a new tool class + register in `McpModule`).

## Security notes

- **No token passthrough**: the bearer Claude sends us is our own JWT, unrelated to the server-side `GITLAB_TOKEN`.
- **Audience check**: JWTs carry `aud: PUBLIC_BASE_URL` and are rejected if minted for a different server.
- **Stateless storage**: the built-in auth module uses in-memory storage for DCR client records. Cold starts on Vercel may reset registrations — Claude re-registers automatically on the next connect. Access tokens are self-contained JWTs and survive restarts for their full 24h lifetime.
- **Revocation**: rotate `JWT_SECRET` to invalidate all outstanding tokens (forces everyone to re-auth). Remove a username from `GITHUB_USERNAMES_ALLOWLIST` + redeploy to revoke a single user — they'll be rejected on their next call.

## Conventions

Mirrors `ownership-monitor-api`: path aliases (`@/config/*`, `@/exceptions/*`, `@/modules/*`), Zod for env validation, custom `BaseException` hierarchy, ESLint import ordering + blank-line rules, arrow functions + JSDoc on public methods, early-exit pattern.
