# Reviewer Automation Workflow

This document describes the automatic code review system that launches independent reviewers after each PR creation and manages the approval loop.

## How It Works

### 1. PR Creation Trigger
When Claude creates a pull request via `mcp__github__create_pull_request`, the post-creation hook automatically:
- Detects the PR number and changed files
- Selects appropriate reviewers based on the PR's focus area
- Launches 2+ independent reviewer agents with clear review prompts
- Monitors the PR thread for reviewer responses

### 2. Reviewer Launch (Automatic)
The hook invokes the **use-reviewers skill** with:
- **Default pair**: Dr. Alice Chen (Correctness & Type Safety) + Marcus Rodriguez (Security & Performance)
- **Frontend PRs**: Evan Brooks + Dr. Alice Chen
- **Backend/Data PRs**: Sam Okoro + Marcus Rodriguez
- **Large/Critical PRs**: Add Dr. Priya Patel (Architecture & Design) for 3-reviewer consensus

Each reviewer receives:
- Full PR diff and context
- Review prompt from SKILL.md template
- Specific focus areas (see `.claude/skills/use-reviewers/SKILL.md` for details)

### 3. Verdict Loop

Reviewers post one of three verdicts:

| Verdict | Next Action |
|---------|------------|
| **"Approval Recommended" ✓** | Monitor for other reviewer(s) |
| **"Changes Requested" ✗** | Assess comments → fix → respond → re-request |
| **"Needs Further Review" ?** | Add 3rd reviewer |

### 4. Comment Assessment & Response
When a reviewer posts "Changes Requested":

1. **Assess Pertinence**:
   - **Pertinent** ✓ (fix it): Real bugs, security issues, validation gaps, performance bottlenecks, test coverage gaps
   - **Not Pertinent** ✗ (skip it): Style nits, naming preferences, "could refactor" suggestions, formatting preferences

2. **Respond in PR Thread**:
   ```
   For pertinent findings:
   "✓ Fixed in commit {HASH}. Changed {WHAT} to {WHY per comment}."
   
   For non-pertinent findings:
   "✗ This is by design for {REASON}. Keeping as-is per {CONTEXT}."
   ```

3. **Create Fix Commit** (if pertinent):
   - Use conventional commits: `fix(scope): address reviewer comment`
   - Push to the same branch
   - Small, focused changes (one finding per commit if possible)

4. **Re-Request Review**:
   - Push changes first
   - Then request review from the same reviewer(s)
   - CI must pass on latest commit

### 5. Approval & Merge Criteria

Both reviewers must post **"Approval Recommended"** before merge:

```
✓ Dr. Alice Chen: "Approval Recommended"
✓ Marcus Rodriguez: "Approval Recommended"
→ MERGE when CI passes and no merge conflicts
```

### 6. Edge Cases

**Conflicting Reviewer Opinions**:
- Alice says "add types", Marcus says "keep flexible"
- Decision: Type safety takes precedence (favor safety over flexibility)
- Respond: "Added types per Alice's suggestion. This maintains flexibility through generic parameters."
- Re-request from Marcus

**Flaky Tests**:
- If CI fails but the failure isn't related to your PR changes
- Comment once with: "CI failure in {test} is pre-existing on main. Not addressing in this PR."
- Don't re-run unless it's a temporary flake (network, timeout)

**Base Branch Changes**:
- If main is updated while your PR is under review
- Merge main into your PR branch
- Push and re-request review (don't rebase, keeps their checkout valid)

## Practical Example

### Step 1: Create PR
```bash
git push -u origin fix/url-encoding
# Hook fires automatically
```

**Hook output**:
```
Launching code review...
- Dr. Alice Chen (Correctness & Type Safety)
- Marcus Rodriguez (Security & Performance)

PR #42: Fix URL encoding in getFundamentals()
Files: utils/yahoo.ts, server/api/fundamentals.get.ts
```

### Step 2: Reviewers Post Findings

**Alice (2 min later)**:
```
File: server/api/fundamentals.get.ts:18
Summary: getCached<any> should use explicit type FundamentalsData
Verdict: CONFIRMED

Approval Recommended ✓
```

**Marcus (3 min later)**:
```
File: utils/yahoo.ts:107
Summary: Symbol parameter not URL-encoded in getFundamentals()
Scenario: symbol="BRK.A&injection" → passes unsanitized to Yahoo API
Verdict: CONFIRMED

Changes Requested ✗
```

### Step 3: Assess & Fix

**Alice's finding**:
- Pertinent ✓ (type safety issue)
- Action: Add FundamentalsData import, fix getCached<FundamentalsData>

**Marcus's finding**:
- Pertinent ✓ (security issue)
- Action: Apply encodeURIComponent(symbol)

### Step 4: Commit & Respond

```bash
git commit -m "fix(yahoo): add type safety to cached call"
git commit -m "fix(yahoo): URL-encode symbol parameter"
git push
```

**PR Thread Response**:
```
✓ Alice: Fixed in commit abc123. Added FundamentalsData type import.
✓ Marcus: Fixed in commit def456. Applied encodeURIComponent() to symbol.
```

### Step 5: Re-Request Review
Both reviewers re-assess. CI passes → Both post "Approval Recommended" → **MERGE** ✓

## When to Use 3+ Reviewers

| Scenario | Add 3rd Reviewer |
|----------|------------------|
| Large refactor (300+ lines) | Yes, add Priya (Architecture) |
| Security-critical code | Maybe, if uncertain between Alice & Marcus |
| API/schema changes | Yes, add Priya for API consistency |
| Either reviewer says "Needs Further Review" | Yes, for tie-breaking |

## Troubleshooting

### Reviewer Loop Not Starting
1. Check that PR was created via `mcp__github__create_pull_request` (not manually on GitHub)
2. Verify hook is enabled: `jq '.hooks.PostToolUse' .claude/settings.json`
3. Check PR description is clear (helps reviewers focus)

### Reviewer Not Responding
1. PR may need more context — add PR description details
2. Try re-requesting review explicitly
3. As last resort, post a comment: "Ready for review when available"

### Too Many "Changes Requested"
1. Reviewers found real issues — prioritize by severity (security > correctness > performance > style)
2. Fix pertinent issues first, respond on others
3. Test locally before pushing fixes (running CI)

### Merge Conflicts
1. Fetch main: `git fetch origin main`
2. Merge: `git merge origin/main` (don't rebase)
3. Resolve conflicts
4. Commit: `git commit -m "Merge main into fix branch"`
5. Push and re-request review

## Reviewer Attribution

Every review comment must include the attribution footer:

```

---
_Generated by [Claude Code](https://claude.ai/code)_
```

This is automatically added by `.claude/settings.json` via the attribution config.

## Skill Reference

For detailed reviewer focus areas, approval matrices, and examples:
- See `.claude/skills/use-reviewers/SKILL.md` for reviewer profiles
- See `.claude/skills/use-reviewers/EXAMPLES.md` for workflow examples
- See `.claude/skills/use-reviewers/README.md` for quick reference

## Summary

The automatic reviewer system:
✓ Launches 2+ independent reviewers after PR creation
✓ Monitors for verdicts and comments
✓ Assesses comment pertinence (bug vs style)
✓ Creates fix commits for real issues
✓ Responds to reviewers in PR threads
✓ Re-requests review after fixes
✓ Loops until both reviewers approve
✓ Blocks merge until all criteria met (green CI, both approvals, no conflicts)

**Key principle**: Real bugs get fixed, style nits get explained, both reviewers must approve.
