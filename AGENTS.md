# Kalmate — Agent Guidelines

# Kalmate — Agent Guidelines

## Commits
- Use **Conventional Commits**: `type(scope): description`
  - Types: `feat`, `fix`, `refactor`, `ci`, `chore`, `docs`, `test`, `perf`, `a11y`, `seo`, `i18n`
  - Examples: `fix(pipeline): translate remaining Spanish tooltips`, `ci: add pre-commit hook with unit tests`, `refactor(market): replace N+1 quote polls with shared poller`

## Tests
- Run `pnpm test` (or `pnpm test:all`) before every commit — pre-commit hook does this automatically
- Tests use `node:test` + `node:assert/strict`

## Tech Stack
- Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS
- pnpm (never npm)
- Cloudflare Pages deployment

## i18n
- Default language: English
- All user-facing text must be in English
- No Spanish hardcoded strings
