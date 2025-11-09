## Contributing

Thanks for your interest in improving the IEEE Quchan SB website!

### Prerequisites
- Node.js 18.18+ or 20.x (see `.nvmrc`)
- npm

### Setup
```bash
git clone git@github.com:Admiral-haking/IEEE-website-origin.git
cd IEEE-website-origin
npm install
cp .env.example .env.local # then edit values
npm run dev
```

### Branching
- `main` is protected. Create feature branches from `main`:
  - `feat/<short-name>` for features
  - `fix/<short-name>` for bug fixes
  - `chore/<short-name>` for misc

### Commits
- Use concise, present-tense messages:
  - `feat: add team member avatar upload`
  - `fix: sanitize email query`
  - `chore: bump MUI to 7.3.2`

### Lint & Build
```bash
npm run lint
npm run build
```

### Pull Requests
- Keep PRs focused and small.
- Add context in the description (what/why, screenshots if UI).
- Ensure CI is green.

### Security
- Never commit secrets. Use `.env.local` locally and server-side env on production.
- See `SECURITY.md` for reporting vulnerabilities.

