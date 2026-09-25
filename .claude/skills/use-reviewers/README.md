# Use-Reviewers Skill - Quick Reference

Launch independent code reviewers for GitHub pull requests.

## Quick Start

```bash
# Default pair (Correctness + Security)
/use-reviewers 5 eanorambuena/kalmate

# Frontend-focused
/use-reviewers 5 eanorambuena/kalmate frontend

# Backend/Data-focused  
/use-reviewers 5 eanorambuena/kalmate backend

# Large/Critical (adds 3rd reviewer)
/use-reviewers 5 eanorambuena/kalmate critical
```

## Reviewer Pairs

| Type | Reviewers | Best For |
|------|-----------|----------|
| **Default** | Alice + Marcus | Type safety + Security |
| **Frontend** | Evan + Alice | UI components + Types |
| **Backend** | Sam + Marcus | APIs + Security |
| **Critical** | Alice + Priya | Architecture deep dive |

## Reviewer Profiles (2-3 line summary)

| Name | Focus | Looks For |
|------|-------|-----------|
| **Dr. Alice Chen** | Type Safety | Missing types, null checks, test gaps |
| **Marcus Rodriguez** | Security | Injection risks, rate limits, perf bottlenecks |
| **Evan Brooks** | Frontend | Component API, accessibility, UX |
| **Sam Okoro** | Backend | Query efficiency, API design, validation |
| **Dr. Priya Patel** | Architecture | Module coupling, API consistency, patterns |

## Three Verdicts

| Verdict | Meaning | Next Step |
|---------|---------|-----------|
| **✓ Approval Recommended** | Code ready to merge | Monitor for other reviewer |
| **✗ Changes Requested** | Found real issues | Fix and respond in PR |
| **? Needs Further Review** | Uncertain/complex | Add 3rd reviewer |

## Response Guide

**Fix found (pertinent):**
```
✓ Fixed in commit {HASH}. Changed {what} to {why per finding}.
```

**Suggestion only (not pertinent):**
```
✗ Appreciate the suggestion. This is by design for {reason}. Not changing this round.
```

## Merge Criteria (ALL must pass)

- ✓ Both reviewers: "Approval Recommended"
- ✓ CI passes on latest commit
- ✓ No merge conflicts
- ✓ All pertinent comments addressed
- ✓ Commit attribution footers present

## Pertinent vs Non-Pertinent

**PERTINENT (Fix it):**
- Type errors
- Null pointer bugs
- Security vulnerabilities
- Performance bottlenecks (N+1, slow algorithms)
- Missing input validation
- Test coverage gaps on critical paths

**NOT PERTINENT (Explain it):**
- Formatting/style preferences
- Naming suggestions
- Refactoring without bugs
- Library suggestions
- Documentation improvements

## Approval Hierarchy

When reviewers disagree, apply this priority:

1. **Type Safety** (Alice's domain)
2. **Security** (Marcus's domain)  
3. **Performance** (Marcus's domain)
4. **Architecture** (Priya's domain)
5. **UX/Frontend** (Evan's domain)
6. **Style** (lowest priority)

**Example:** Alice wants types, Marcus says be flexible → Add the types (safety first).

## Files for Reference

- `SKILL.md` — Full reviewer profiles and verdict rubrics
- `EXAMPLES.md` — Real workflow examples with code
- `README.md` — This file (quick reference)

## Common Issues

**Reviewers not launching?**
- Was PR created via `mcp__github__create_pull_request`? (not manually)
- Is `.claude/settings.json` hook enabled? Check: `jq '.hooks' .claude/settings.json`

**Too many "Changes Requested"?**
- Real issues were found — prioritize by severity
- Fix security > correctness > performance > style
- Test locally before pushing

**One reviewer approved, one said changes needed?**
- Fix the issues from "Changes Requested" reviewer
- Push fix commits
- Respond in PR thread with brief explanation
- Re-request review from that reviewer
- Once approved: MERGE ✓

**Conflicting opinions?**
- Type safety takes precedence → add the types
- Security takes precedence → fix the vulnerability
- Add 3rd reviewer (Priya) if tie-breaking needed

## Workflow Loop

```
PR Created
    ↓
[Reviewers launch]
    ↓
[Review findings posted]
    ↓
Assess pertinence
├─ Real bug? → Fix + Commit + Respond
└─ Style nit? → Respond (no action)
    ↓
[Re-request review]
    ↓
Both approved?
├─ No → Fix more + Re-request
└─ Yes ✓ → MERGE
```

## Related Files

- `.claude/REVIEWER_AUTOMATION.md` — Detailed automation workflow
- `.claude/settings.json` — Hook configuration (PostToolUse)
- `CLAUDE.md` — Project-wide development guide

---

**Ready to review?** Run:
```
/use-reviewers {PR_NUMBER} eanorambuena/kalmate
```
