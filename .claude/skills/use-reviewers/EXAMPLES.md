# Use Reviewers — Execution Examples

## Example 1: Simple Backend Fix (2 Reviewers)

```bash
# PR #42: Fix URL encoding in getFundamentals()
# Files changed: utils/yahoo.ts, server/api/fundamentals.get.ts
# Type: Security fix
```

**Step 1: Launch Reviewers**

Agent 1 (Dr. Alice Chen):
- Focus: Type safety, validation in fundamentals.get.ts
- Check: Is symbol validation correct? Are types imported?

Agent 2 (Marcus Rodriguez):
- Focus: Security, URL encoding
- Check: encodeURIComponent() applied everywhere? Any injection risks?

**Step 2: Reviewers Post Findings**

Alice:
```
File: server/api/fundamentals.get.ts:18
Summary: getCached<any> should use explicit type FundamentalsData
Verdict: CONFIRMED

Fix: Add import type { FundamentalsData }, change getCached<any> to getCached<FundamentalsData>

Approval Recommended ✓
```

Marcus:
```
File: utils/yahoo.ts:107
Summary: Symbol parameter not URL-encoded in getFundamentals()
Verdict: CONFIRMED — searchTickers() uses encodeURIComponent() but getFundamentals() doesn't

Scenario: symbol="BRK.A&injection" → would pass unsanitized to Yahoo API

Fix: encodeURIComponent(symbol) in URL

Approval Recommended ✓
```

**Step 3: Respond & Fix**

You respond in PR:
```
✓ Alice: Fixed in commit abc123. Added FundamentalsData import and proper typing.
✓ Marcus: Fixed in commit def456. Applied encodeURIComponent() to symbol param.
```

Push commits, CI passes → **MERGE** ✓

---

## Example 2: Complex Feature (3 Reviewers — Conditional)

```bash
# PR #47: Add recommendation node pipeline
# Files changed: utils/pipeline/nodeDefinitions.ts, utils/pipeline/runner.ts, types.ts
# Type: Feature + refactor
```

**Step 1: Launch Reviewers**

Agent 1 (Dr. Alice Chen):
- Type safety across recommendation logic
- RSI extraction duplicate call bug?

Agent 2 (Marcus Rodriguez):
- Performance: Is there unnecessary computation?
- Security: Any data exposure?

Agent 3 (Dr. Priya Patel) [OPTIONAL — conditional on findings]:
- Architecture: Does recommendation node fit the pipeline model?
- Is API consistent with other nodes?

**Step 2: Findings Come Back**

Alice:
```
File: utils/pipeline/runner.ts:266
Summary: toSeriesValues(rsiInput) called twice
Verdict: CONFIRMED

Scenario: Large price series (10k+ points) → unnecessary processing

Approval Recommended (with fix) ✓
```

Marcus:
```
File: utils/pipeline/nodeDefinitions.ts:87-91
Summary: kalmanFilter outputs missing 'cycle' declaration
Verdict: CONFIRMED

Impact: validatePipelinePlan() drops cycle edge, recommendation node can't receive cycle input

Approval Recommended (with fix) ✓
```

Priya:
```
File: utils/pipeline/runner.ts (line 246)
Summary: Recommendation node mixes Kalman + RSI + Fundamentals scoring
Verdict: PLAUSIBLE

Question: Is the 30/30/40 weighting documented anywhere? Should it be configurable?

Status: Needs Further Review
→ Escalate to architecture discussion
```

**Step 3: Respond & Fix**

You respond:
```
✓ Alice: Fixed in commit 111aaa. Cached toSeriesValues() result.
✓ Marcus: Fixed in commit 222bbb. Added cycle output to nodeDefinition.
→ Priya: Opened issue #99 for weighting documentation. For now, weights are 
  hardcoded per design. Not blocking this PR.
```

**Step 4: Re-request from Priya**

Priya reviews again:
```
Documentation issue understood. The implementation is correct for v1.
Current weights (30/30/40) are consistent with Schwartz-Smith model.

Approval Recommended ✓
```

→ **MERGE** ✓ (all 3 approved)

---

## Example 3: Non-Pertinent Comment Handling

```bash
# PR #50: Refactor pipeline executor
# Reviewer: Marcus Rodriguez
```

Marcus posts:
```
File: utils/pipeline/runner.ts:173
Summary: Why use arrow function for mathOp instead of named function?
Verdict: PLAUSIBLE

This is just style preference. Named functions are more testable.
```

You respond:
```
Thanks Marcus! This is an architectural choice — executors is a registry 
object where inline arrows are idiomatic. No changes needed.
```

Marcus's finding is **not pertinent** → you don't fix it.

Both reviewers still post "Approval Recommended" → **MERGE** ✓

---

## Quick Reference: When Findings Are Pertinent

✓ **PERTINENT** (fix it):
- Type mismatch or missing import
- Null pointer or array bounds error
- Security vulnerability (injection, encoding, auth)
- Performance bottleneck (N+1, unnecessary computation)
- Missing validation on untrusted input
- Breaking change not backward compatible
- Test coverage missing for critical path

✗ **NOT PERTINENT** (skip it):
- Style/formatting preference
- Naming suggestion if names are clear
- "Could use const instead of let" (if logic depends on it)
- "Consider refactoring this function" (unless actually broken)
- "This library would be better" (unless breaking)
- Comment/documentation improvements (separate task)

? **ASSESS CASE-BY-CASE**:
- Performance micro-optimization
- Code clarity vs. conciseness
- Abstraction level changes

---

## Prompt Template for Quick Launch

Save this as a template to reuse:

```
You are **{REVIEWER_NAME}**, a code reviewer focused on **{FOCUS}**.

Review PR #{NUMBER} for {FOCUS} issues only.

Find real bugs: type errors, injection risks, null checks, validation gaps, 
performance bottlenecks, test coverage gaps.

Skip style nits and preference suggestions unless they break code.

Each finding:
- File: path:LINE
- Summary: one sentence
- Scenario: inputs → wrong output
- Verdict: CONFIRMED or PLAUSIBLE

End with: "Approval Recommended ✓" or "Changes Requested ✗"

Post as GitHub PR comment with attribution:

---
_Generated by [Claude Code](https://claude.ai/code)_
```

Customize {REVIEWER_NAME}, {FOCUS}, {NUMBER} for each agent.

---

## Approval Matrix Decision Tree

```
Both reviewers reviewed?
├─ NO → Wait, then check again
└─ YES:
   ├─ Both "Approval Recommended" ✓ 
   │  └─ MERGE ✓
   ├─ One "Approval", One "Changes Requested"
   │  └─ Address comment, re-request review
   ├─ Both "Changes Requested" ✗
   │  └─ Fix issues, re-request from both
   ├─ Either "Needs Further Review" ?
   │  └─ Add 3rd reviewer or clarify finding
   └─ Otherwise
      └─ HOLD until resolved
```

---

## Handling Conflicts Between Reviewers

**Scenario**: Alice says "Add type", Marcus says "Use any for flexibility"

Your call:
```
Alice's concern (type safety) ✓ PERTINENT
Marcus's concern (flexibility) ? ASSESS

Decision: If adding type doesn't break flexibility → do it (favor safety)
If it does break it → explain tradeoff in PR, let reviewers re-assess

Most likely: Both agree types are worth the tradeoff → FIXED
```

Then: Re-request from Marcus, Alice will approve as-is.

---

## When to Use 2 vs 3 Reviewers

| Change Type | Reviewers | Combo |
|-------------|-----------|-------|
| Small fix (bug fix < 50 lines) | 2 | Alice + Marcus |
| Medium feature (100-300 lines) | 2 | Pair based on domain |
| Large feature (300+ lines) | 3 | Alice + Marcus + Priya |
| Security-critical | 2 min | Always include Marcus |
| Architecture change | 3 min | Always include Priya |
| Frontend-heavy | 2+ | Evan + (Alice or Priya) |
| Backend-heavy | 2+ | Sam + Marcus |

---

## Merging Checklist

Before you merge:

- [ ] PR created with description
- [ ] At least 2 reviewers assigned (by name)
- [ ] Both posted reviews with clear verdicts
- [ ] Both posted "Approval Recommended" ✓
- [ ] All pertinent comments addressed and responded to
- [ ] All fixes committed and pushed
- [ ] CI passes on latest commit
- [ ] No merge conflicts
- [ ] Reviewer attribution footers present

→ **MERGE** ✓
