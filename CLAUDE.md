# Kalmate — Claude Code Development Guide

This guide explains how to work with Claude Code in this project, with emphasis on the automatic code review system.

## Quick Start

When working with Claude Code in this project:

1. **Create changes** on a feature branch
2. **Create a PR** with `mcp__github__create_pull_request`
3. **Automatic reviewers launch** (hook fires immediately)
4. **Respond to comments** in the PR thread
   - Fix pertinent issues → commit → re-request review
   - Explain non-pertinent issues → no action needed
5. **Merge when** both reviewers post "Approval Recommended" ✓

## Automatic Reviewer System

### How It Works

**After each PR creation**, the `.claude/settings.json` hook automatically:

1. Detects the PR number and changed files
2. Selects appropriate reviewers based on the PR focus:
   - **Default**: Dr. Alice Chen + Marcus Rodriguez
   - **Frontend**: Evan Brooks + Dr. Alice Chen  
   - **Backend/Data**: Sam Okoro + Marcus Rodriguez
3. Launches independent review agents with complete PR context
4. Posts review findings with clear verdicts

### The Loop

```
PR Created
    ↓
[Hook triggers]
    ↓
2 Reviewers launch independently
    ↓
Both review PR, post verdicts
    ↓
Review Comments Appear
    ↓
Assess Pertinence
├─ Real bug? → Fix + Commit + Respond + Re-request
└─ Style nit? → Respond + No action needed
    ↓
Reviewers reassess
    ↓
Both approve? → MERGE ✓
```

### Reviewer Profiles

| Name | Focus | Best For |
|------|-------|----------|
| **Dr. Alice Chen** | Correctness & Type Safety | Type errors, null checks, logic bugs, validations |
| **Marcus Rodriguez** | Security & Performance | Injection risks, encoding, auth gaps, bottlenecks |
| **Dr. Priya Patel** | Architecture & Design | API consistency, module coupling, test coverage |
| **Evan Brooks** | Frontend/UX | Component API, state, accessibility, perf |
| **Sam Okoro** | Backend/Data | DB queries, caching, API design, error handling |

## Handling Reviewer Comments

### Pertinence Assessment

**These are PERTINENT (fix them)** ✓:
- Type mismatches or missing imports
- Null pointer/array bounds errors
- Security vulnerabilities
- Performance bottlenecks (N+1 queries, unnecessary computation)
- Missing validation on untrusted input
- Test coverage gaps on critical paths

**These are NOT PERTINENT (explain, don't fix)** ✗:
- Formatting or style preferences
- Naming suggestions (if names are clear)
- Refactoring suggestions without bugs
- "This could use X library" (unless breaking)
- Comments/docs improvements (separate task)

### Response Patterns

**For pertinent findings:**
```
✓ Fixed in commit {HASH}. {Brief description of change}.
```

**For non-pertinent findings:**
```
✗ Appreciate the suggestion. This is {WHY we're doing it this way}.
Not changing this round.
```

**For design questions:**
```
Good question. {Explanation}. Keeping as-is per {CONTEXT}.
Consider opening an issue for v2 customization.
```

## Commit Messages

Use **Conventional Commits**:

```
type(scope): description

Optional longer explanation

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WLvn9Uasuk1kunbeoSpQtZ
```

**Types**: `feat`, `fix`, `refactor`, `ci`, `chore`, `docs`, `test`, `perf`

**Examples**:
- `feat(pipeline): add recommendation node with scoring`
- `fix(security): encode symbol parameter in Yahoo API call`
- `refactor(market): replace N+1 quote polls with shared poller`

## Testing

Before every commit:

```bash
pnpm test        # Run unit tests
pnpm test:all    # Run full test suite
```

The pre-commit hook runs these automatically.

## Tech Stack Reference

- **Nuxt 4** + Vue 3 + TypeScript
- **Tailwind CSS** for styling
- **pnpm** for package management (never npm)
- **Cloudflare Pages** for deployment
- `node:test` + `node:assert/strict` for tests

## i18n Requirements

- Default language: English
- All user-facing text must be in English
- No Spanish hardcoded strings
- Translations managed separately

## Project Structure

```
kalmate/
├── .claude/
│   ├── settings.json                 # Hook configuration + permissions
│   ├── REVIEWER_AUTOMATION.md         # Automation details
│   └── skills/use-reviewers/          # Reviewer skill + examples
│       ├── SKILL.md
│       ├── EXAMPLES.md
│       └── README.md
├── AGENTS.md                          # Agent/commit guidelines
├── CLAUDE.md                          # This file
├── src/
│   ├── components/                    # Vue components
│   ├── pages/                         # Nuxt pages
│   └── server/                        # Server API routes
├── tests/                             # Test files
└── pnpm-lock.yaml
```

## Common Workflows

### Creating a New Feature

1. Create feature branch: `git checkout -b feat/new-feature`
2. Make changes and run tests: `pnpm test`
3. Commit with conventional format: `git commit -m "feat(scope): description"`
4. Push to branch: `git push -u origin feat/new-feature`
5. Create PR with `mcp__github__create_pull_request`
6. Wait for automatic reviewer launch
7. Respond to reviewer comments (fix pertinent issues)
8. Push fixes and re-request review
9. Merge when both reviewers approve and CI is green

### Fixing a Bug

1. Create fix branch: `git checkout -b fix/issue-description`
2. Write test for the bug first
3. Fix the code
4. Verify test passes: `pnpm test`
5. Commit: `git commit -m "fix(scope): brief description of fix"`
6. Push: `git push -u origin fix/issue-description`
7. Create PR → automatic reviewers launch
8. Follow same approval flow as features

### Refactoring

1. Create refactor branch: `git checkout -b refactor/area-to-refactor`
2. Make changes, run tests: `pnpm test`
3. Commit: `git commit -m "refactor(scope): what and why"`
4. Push and create PR
5. For large refactors (300+ lines), expect 3 reviewers (add Dr. Priya Patel)

## Approval Criteria

Before merge, ensure:

| Requirement | Status |
|------------|--------|
| Both reviewers posted verdicts | ✓ Required |
| Both posted "Approval Recommended" | ✓ Required |
| CI/tests pass on latest commit | ✓ Required |
| No merge conflicts | ✓ Required |
| All pertinent comments addressed | ✓ Required |
| Reviewer attribution footers present | ✓ Required |

**MERGE** only when all are satisfied.

## Troubleshooting

**Reviewers not launching after PR creation?**
- Verify PR was created via Claude Code (not manually on GitHub)
- Check `.claude/settings.json` is valid: `jq .hooks .claude/settings.json`
- Ensure hook is in PostToolUse for `mcp__github__create_pull_request`

**Reviewer keeps requesting changes?**
- Review all findings carefully — real issues found
- Prioritize: security > correctness > performance > style
- After each fix, provide clear PR comment response
- Re-request review only after pushing commits

**Too many conflicts?**
- Fetch main: `git fetch origin main`
- Merge main branch: `git merge origin/main` (not rebase)
- Resolve conflicts, commit, push, re-request review

**One reviewer approved, one said "Changes Requested"?**
- Fix the issues from "Changes Requested" reviewer
- Push commits with clear PR responses
- Re-request review from that reviewer
- Once approved, both are on board → **MERGE** ✓

## Advanced: Customizing Reviewers

To use different reviewer combinations:

1. Read `.claude/skills/use-reviewers/SKILL.md` for reviewer profiles
2. Modify the hook in `.claude/settings.json` to specify different reviewers
3. Example for architecture-focused PR:
   ```
   Launch: Dr. Priya Patel (Architecture) + Dr. Alice Chen (Correctness)
   ```

## References

- `.claude/REVIEWER_AUTOMATION.md` — Event-driven loop details
- `.claude/skills/use-reviewers/SKILL.md` — Reviewer focus areas & prompts
- `.claude/skills/use-reviewers/EXAMPLES.md` — Real workflow examples
- `AGENTS.md` — Commit and test guidelines

## Contact / Questions

For questions about this workflow or Claude Code usage:
- Check `REVIEWER_AUTOMATION.md` for automation details
- Check `.claude/skills/use-reviewers/` for reviewer guidelines
- Run `/help` in Claude Code for general help
