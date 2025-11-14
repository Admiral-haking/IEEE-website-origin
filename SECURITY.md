# Security Policy

## Supported Versions
Active development on `main`. Please update to the latest commit.

## Reporting a Vulnerability
- Email: `security@qiet.ac.ir` (or open a private security advisory on GitHub)
- Include reproduction steps, impact, and version/commit hash.
- We will acknowledge receipt within 72 hours and provide updates until resolution.

## Do Not Report
- Dependency vulnerabilities already covered by Dependabot alerts.
- Non-security bugs (use regular issues/PRs).

## Secrets
- Do not commit secrets. Use `.env.local` locally and server-managed env in production.
- Sample env files (`.env.example`, `.env.production.example`) must only contain placeholders.
- If any real key (for example `OPENAI_API_KEY`) has ever been committed, it must be revoked/rotated in the provider dashboard and updated on all servers.
