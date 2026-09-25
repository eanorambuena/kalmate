#!/bin/bash
# Automatic Code Reviewer System — Standalone Installer
# Uso: bash install-reviewers-standalone.sh
# Compatible con cualquier repo, devcontainer, entorno

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Automatic Code Reviewer Installation ===${NC}\n"

# Verificar git
if [ ! -d ".git" ]; then
  echo -e "${RED}✗ Not a git repo${NC}"
  exit 1
fi

# Crear estructura
mkdir -p .claude/skills/use-reviewers

# SKILL.md
cat > .claude/skills/use-reviewers/SKILL.md << 'SKILL_EOF'
---
name: use-reviewers
description: Launch independent code reviewers for PR assessment. Use this skill to trigger Dr. Alice Chen (Correctness & Type Safety) and Marcus Rodriguez (Security & Performance) to independently review changes and post verdicts. Reviewers provide domain-specific feedback—Alice catches type errors and correctness issues, Marcus identifies security risks and performance bottlenecks. When reviewers post "Changes Requested", fix pertinent issues (bugs, security gaps, test gaps) and respond in PR threads; skip style nits. Re-request review after fixes. Both must post "Approval Recommended ✓" before merge.
---

# Use Reviewers Skill

## When to Use

- **After PR Creation**: Triggered automatically by PostToolUse hook on PR creation
- **For Code Quality**: Get specialized feedback before merge
- **Security Reviews**: Marcus targets injection risks, encoding, performance
- **Type Safety**: Alice focuses on correctness, null checks, type errors

## Reviewer Profiles

### Dr. Alice Chen — Correctness & Type Safety
- Finds: Type mismatches, missing imports, logic bugs, validation gaps, test coverage
- Focus: Compile-time safety, null pointer checks, logic correctness
- Verdict: "Approval Recommended ✓" or "Changes Requested ✗"

### Marcus Rodriguez — Security & Performance
- Finds: Injection risks, encoding issues, DOS vectors, N+1 queries, inefficiency
- Focus: Security vulnerabilities, performance bottlenecks, input validation
- Verdict: "Approval Recommended ✓" or "Changes Requested ✗"

### Optional 3rd Reviewers (for large/complex PRs)
- **Dr. Priya Patel** (Architecture & Design): API consistency, module coupling
- **Evan Brooks** (Frontend/UX): Component API, state, accessibility
- **Sam Okoro** (Backend/Data): Database queries, caching, API design

## How It Works

1. PR Created → Hook fires automatically
2. Two reviewers launch in parallel (Alice + Marcus)
3. Each independently examines changes
4. Both post findings in PR comments
5. Developer assesses findings:
   - **Real bugs** (security, type errors, perf) → Fix
   - **Style nits** (naming, formatting) → Explain
6. Re-request review after fixes
7. Repeat until both post "Approval Recommended ✓"

## Pertinence Assessment

### Fix These ✓ (Real Issues)
- Type mismatches, missing imports
- Security vulnerabilities (injection, encoding, auth)
- Performance bottlenecks (N+1 queries, wasteful computation)
- Logic bugs, missing validation
- Test coverage gaps

### Explain These ✗ (Not Real Issues)
- Style preferences (naming, formatting)
- Refactoring suggestions without bugs
- "Could use X library" suggestions
- Whitespace/indentation preferences
- Comment improvements (separate task)

## Approval Criteria

**Merge only when:**
- ✓ Both reviewers post "Approval Recommended"
- ✓ All tests pass
- ✓ No merge conflicts
- ✓ All pertinent issues addressed

## Example Workflow

```
PR Created → Reviewers Launch
     ↓
Alice: "Type error on line 10" → Changes Requested ✗
Marcus: "Security: need URL encoding" → Changes Requested ✗
     ↓
Developer: Fix both issues in separate commits
     ↓
Developer: Respond in PR thread
     - "✓ Alice: Fixed in abc123"
     - "✓ Marcus: Fixed in def456"
     ↓
Developer: Re-request review
     ↓
Alice: "Type fix is good" → Approval Recommended ✓
Marcus: "Encoding is correct" → Approval Recommended ✓
     ↓
MERGE (both approved + CI green)
```

## Configuration

Edit `.claude/settings.json` to:
- Change default reviewer pair (Evan+Alice for frontend, Sam+Marcus for backend)
- Add 3rd reviewer for large PRs (Dr. Priya Patel)
- Customize reviewer focus areas

See EXAMPLES.md for real-world scenarios.
SKILL_EOF

# README.md
cat > .claude/skills/use-reviewers/README.md << 'README_EOF'
# Use-Reviewers — Quick Start

## Installation Complete ✓

Your repo now has automatic code reviewers.

## Usage

### Automatic (Default)
```bash
git push -u origin feature-branch
# Hook fires automatically
# Reviewers launch in 2-3 seconds
# They post verdicts on your PR
```

### Manual (If Needed)
Type in Claude Code:
```
/use-reviewers
```

## Reviewer Verdicts

| ✓ | ✗ | ? |
|---|---|---|
| **Approval Recommended** | **Changes Requested** | **Needs Further Review** |
| Code ready to merge | Fix issues, re-request | Add 3rd reviewer |

## Quick Decision Guide

| Feedback | Action |
|----------|--------|
| "Missing type annotation" | **FIX** (real bug) |
| "Variable name could be clearer" | **EXPLAIN** (style preference) |
| "URL parameter not encoded" | **FIX** (security issue) |
| "Could use async/await" | **EXPLAIN** (style preference) |
| "Missing input validation" | **FIX** (real bug) |
| "Semicolons inconsistent" | **EXPLAIN** (use linter) |

## Workflow

1. Create PR
2. Reviewers post findings (2-3 min)
3. Assess and respond (pertinent issues only)
4. Fix + commit + re-request (5-10 min)
5. Both approve + merge ✓

## References

- `SKILL.md` — Full documentation
- `EXAMPLES.md` — Real-world scenarios (in same dir if installed)
- `.claude/settings.json` — Hook configuration
- `CLAUDE.md` — Developer guide (in repo root if created)

**Questions?** See `CLAUDE.md` or `.claude/skills/use-reviewers/SKILL.md`
README_EOF

# EXAMPLES.md
cat > .claude/skills/use-reviewers/EXAMPLES.md << 'EXAMPLES_EOF'
# Use-Reviewers — Real-World Examples

## Example 1: Two Reviewers, Two Fixes

**PR**: Add rate limiting to API endpoint

**Alice Chen** (2 min later):
```
File: server/api/data.ts:10
Missing type on RATE_LIMIT constant
→ Changes Requested ✗
```

**Marcus Rodriguez** (3 min later):
```
File: server/api/data.ts:15
Rate limiting implementation looks good
→ Approval Recommended ✓
```

**Developer Response**:
```
✓ Alice: Fixed in abc123. Added type: const RATE_LIMIT: number = 30
Marcus: Thanks for confirming the design!
```

**Result**: Re-request → Alice approves ✓ → Both approved → Merge

---

## Example 2: Non-Pertinent Feedback

**Alice**: "Variable `x` should be `variableName`"
→ Changes Requested ✗

**Developer Assessment**: This is a STYLE preference, not a bug.

**Developer Response**:
```
✗ Alice: Keeping as `x` per local naming convention.
This matches other variables in the module.
```

**Result**: Alice reassesses context → Approval Recommended ✓

---

## Example 3: Security Issue

**Marcus**: "Symbol parameter not URL-encoded in fetch call"
→ Changes Requested ✗

**Developer Assessment**: This is a REAL BUG (security vulnerability).

**Developer Response**:
```
✓ Marcus: Fixed in def456. Applied encodeURIComponent(symbol).
```

**Result**: Re-request → Marcus: "Encoding is correct" → Approval ✓

---

## Pertinence Decision Tree

```
Reviewer finds issue X
    ↓
Is it a type error, null pointer, logic bug?
    ├─ YES → FIX (pertinent)
    └─ NO  → Continue
    ↓
Is it a security/injection/encoding issue?
    ├─ YES → FIX (pertinent)
    └─ NO  → Continue
    ↓
Is it a performance bottleneck (confirmed)?
    ├─ YES → FIX (pertinent)
    └─ NO  → Continue
    ↓
Is it a test coverage gap?
    ├─ YES → FIX (pertinent)
    └─ NO  → Continue
    ↓
→ EXPLAIN (style preference, not pertinent)
```

---

## Timeline

| Time | Event |
|------|-------|
| T+0:00 | PR Created |
| T+0:05 | Hook fires, reviewers launch |
| T+2:00 | Alice posts findings |
| T+3:00 | Marcus posts findings |
| T+5:00 | Dev fixes issues, responds |
| T+5:10 | Dev re-requests review |
| T+7:00 | Both approve |
| T+7:15 | MERGE |

**Total: ~7 minutes to merge** (for typical 2-reviewer PR)
EXAMPLES_EOF

# settings.json
if [ ! -f ".claude/settings.json" ]; then
  cat > .claude/settings.json << 'SETTINGS_EOF'
{
  "permissions": {
    "allow": ["Bash(git *)", "Read", "Write", "Edit", "Grep", "Glob"]
  },
  "attribution": {
    "commit": "Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>",
    "pr": "🤖 Generated with [Claude Code](https://claude.com/claude-code)"
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "mcp__github__create_pull_request",
        "hooks": [
          {
            "type": "agent",
            "prompt": "Launch the use-reviewers skill to review this PR. Use Dr. Alice Chen (Correctness & Type Safety) + Marcus Rodriguez (Security & Performance) as default reviewers. Have them independently review changes and post verdicts as GitHub comments with clear findings."
          }
        ]
      }
    ]
  }
}
SETTINGS_EOF
  echo -e "${GREEN}✓ .claude/settings.json${NC}"
else
  echo -e "${BLUE}ℹ .claude/settings.json exists (skipped)${NC}"
fi

# CLAUDE.md
if [ ! -f "CLAUDE.md" ]; then
  cat > CLAUDE.md << 'CLAUDE_EOF'
# Claude Code Development Guide

## Automatic Code Review System

This project uses automatic reviewers to assess PRs.

### Quick Start

1. Create PR: `git push -u origin feature-branch`
2. Reviewers launch automatically (2-3 sec)
3. Read their feedback (2-3 min)
4. Fix real issues, explain style preferences (5-10 min)
5. Re-request review
6. Merge when both approve ✓

### Reviewers

| Name | Focus |
|------|-------|
| Dr. Alice Chen | Type safety, correctness, test coverage |
| Marcus Rodriguez | Security, performance, DOS prevention |

### Verdicts

- ✓ **Approval Recommended** → Ready to merge
- ✗ **Changes Requested** → Fix issues, re-request review
- ? **Needs Further Review** → Escalate to 3rd reviewer

### Pertinence Guide

**Fix these** ✓: Type errors, security bugs, perf issues, test gaps, logic errors
**Explain these** ✗: Style preferences, naming suggestions, refactoring ideas

### Approval Criteria

Merge when:
- ✓ Both reviewers approve
- ✓ All tests pass
- ✓ No merge conflicts
- ✓ All pertinent issues addressed

### References

- `.claude/skills/use-reviewers/SKILL.md` — Full documentation
- `.claude/skills/use-reviewers/EXAMPLES.md` — Workflow examples
CLAUDE_EOF
  echo -e "${GREEN}✓ CLAUDE.md${NC}"
else
  echo -e "${BLUE}ℹ CLAUDE.md exists (skipped)${NC}"
fi

# Validate
echo -e "\n${BLUE}Validating...${NC}"
[ -d ".claude/skills/use-reviewers" ] && echo -e "${GREEN}✓ Skill files${NC}"
[ -f ".claude/settings.json" ] && echo -e "${GREEN}✓ Hook config${NC}"
[ -f "CLAUDE.md" ] && echo -e "${GREEN}✓ Developer guide${NC}"

echo -e "\n${GREEN}=== Complete! ===${NC}"
echo -e "\nNext: ${BLUE}git push -u origin feature-branch${NC}"
echo -e "Reviewers will launch automatically! 🚀\n"
