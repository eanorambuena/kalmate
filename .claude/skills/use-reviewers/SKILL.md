# Use Reviewers Skill

Launch independent code reviewers for GitHub pull requests with automatic verdict collection and approval workflow.

## How to Use

### Basic Usage

When reviewing a PR, invoke this skill with:

```
/use-reviewers <pr_number> <repo_owner>/<repo_name> [reviewer_pair]
```

### Examples

**Default pair (Correctness + Security):**
```
/use-reviewers 42 eanorambuena/kalmate
```

**Frontend-focused:**
```
/use-reviewers 42 eanorambuena/kalmate frontend
```

**Backend/Data-focused:**
```
/use-reviewers 42 eanorambuena/kalmate backend
```

**Large/Critical (3 reviewers):**
```
/use-reviewers 42 eanorambuena/kalmate critical
```

## Reviewer Profiles

### Dr. Alice Chen — Correctness & Type Safety
**Focuses on:**
- Type errors and missing imports
- Null pointer and array bounds errors
- Logic bugs and validation gaps
- Generic parameter usage
- Function signature correctness
- Test coverage on critical paths

**Verdict rubric:**
- ✓ **Approval Recommended**: No type issues, logic is sound, proper error handling
- ✗ **Changes Requested**: Type errors, missing validation, logic bugs, test gaps
- ? **Needs Further Review**: Unclear correctness implications, architectural concerns

---

### Marcus Rodriguez — Security & Performance
**Focuses on:**
- Injection attacks (SQL, command, XPath, URL parameter)
- Missing input sanitization or encoding
- Authentication and authorization gaps
- Sensitive data exposure in logs/errors
- Performance bottlenecks (N+1 queries, inefficient algorithms)
- Rate limiting and DDoS protection
- Encryption and secure storage

**Verdict rubric:**
- ✓ **Approval Recommended**: No security vulnerabilities, no performance regressions
- ✗ **Changes Requested**: Security issues found, performance bottlenecks, missing rate limits
- ? **Needs Further Review**: Potential security implications unclear, needs domain expert

---

### Evan Brooks — Frontend/UX
**Focuses on:**
- Component API design and ease of use
- State management patterns
- Accessibility (WCAG compliance)
- Browser compatibility
- Performance (rendering, bundle size)
- User experience consistency

**Verdict rubric:**
- ✓ **Approval Recommended**: Good component design, accessible, performant UX
- ✗ **Changes Requested**: Accessibility issues, poor component API, UX inconsistency
- ? **Needs Further Review**: Needs UX/design team input

---

### Sam Okoro — Backend/Data
**Focuses on:**
- Database query efficiency and indexes
- API design and consistency
- Error handling and recovery
- Caching strategies
- Data validation and integrity
- Scalability concerns

**Verdict rubric:**
- ✓ **Approval Recommended**: Efficient queries, clean API, proper error handling
- ✗ **Changes Requested**: Query bottlenecks, API inconsistencies, missing validation
- ? **Needs Further Review**: Needs architect or DBA review

---

### Dr. Priya Patel — Architecture & Design
**Focuses on:**
- Module coupling and cohesion
- API consistency across codebase
- Design pattern usage
- Long-term maintainability
- Test coverage strategy
- Documentation completeness

**Verdict rubric:**
- ✓ **Approval Recommended**: Sound architecture, consistent APIs, maintainable code
- ✗ **Changes Requested**: High coupling, API inconsistency, poor test strategy
- ? **Needs Further Review**: Needs stakeholder input on design direction

---

## Reviewer Pair Selection

| Scenario | Reviewers | Reason |
|----------|-----------|--------|
| **Most PRs** | Alice + Marcus | Correctness + Security cover 80% of issues |
| **Frontend PRs** | Evan + Alice | UI components + type safety critical |
| **Backend/Data PRs** | Sam + Marcus | API design + security critical |
| **Large refactors (300+L)** | Alice + Priya | Add architecture review for structure |
| **API changes** | Alice + Priya | Type safety + architecture consistency |
| **Security-critical** | Marcus + Priya | Security depth + arch assessment |
| **Uncertain focus** | Alice + Marcus | Default pair, safe choice |

## Verdict Workflow

### Three Verdict States

1. **"Approval Recommended ✓"**
   - Code is ready to merge
   - No changes required
   - CI should pass
   - Action: Merge when both approve

2. **"Changes Requested ✗"**
   - Found real issues (bugs, security, performance, validation)
   - PR author must fix and respond
   - Action: Fix issues, respond in PR thread, re-request review

3. **"Needs Further Review ?"**
   - Uncertain or complex issue
   - Needs 3rd reviewer or SME input
   - Action: Add 3rd reviewer, continue loop

### Response Pattern for PR Authors

**For pertinent findings (real bugs):**
```
✓ Fixed in commit {HASH}. {What changed and why per finding}.
```

**For non-pertinent findings (style, naming, suggestions):**
```
✗ Appreciate the suggestion. {Why we're doing it this way}. Not changing this round.
```

**For design questions:**
```
Good question. {Explanation}. Keeping as-is per {context}. Consider opening issue for v2.
```

## Approval & Merge Criteria

All of the following must be true before merging:

| Item | Requirement |
|------|------------|
| **Alice Chen (Correctness)** | "Approval Recommended ✓" |
| **Marcus Rodriguez (Security)** | "Approval Recommended ✓" |
| **CI/Tests** | All passing on latest commit |
| **Merge Conflicts** | None |
| **Pertinent Comments** | All addressed (responded or fixed) |
| **Attribution** | Commit footers present |

**ONLY MERGE when all boxes are checked.**

## Launch Procedure

1. **Fetch PR details:**
   - PR number and description
   - Changed files and their paths
   - Latest commit SHA

2. **Select reviewer pair** based on PR focus (see table above)

3. **Create independent sessions** for each reviewer:
   - Session 1: Reviewer A
   - Session 2: Reviewer B

4. **Send context to each:**
   - Full PR diff and description
   - List of changed files
   - Reviewer-specific focus areas (from profile above)
   - Request verdict: ✓ Approval Recommended / ✗ Changes Requested / ? Needs Further Review

5. **Collect verdicts:**
   - Wait for both reviewers to post comments
   - Collect their findings and verdict

6. **Post summary:**
   - Summarize findings from both reviewers
   - Post verdict matrix showing which files were reviewed by whom
   - Provide clear next steps for PR author

## Common Review Findings

### Type Safety (Alice's domain)
- ❌ `getCached<any>` → Use explicit type `getCached<FundamentalsData>`
- ❌ Missing import for type → Add import statement
- ❌ Optional field without null check → Add `if (field !== null)` guard
- ✓ Generic types properly constrained → No action

### Security (Marcus's domain)
- ❌ `?symbol=${symbol}` → Use `?symbol=${encodeURIComponent(symbol)}`
- ❌ No rate limiting on API → Add per-IP rate limiter
- ❌ Error messages expose internals → Sanitize error messages in logs
- ✓ All inputs URL-encoded → No action

### Performance (Marcus's domain)
- ❌ O(n²) cleanup loop → Refactor to O(n) amortized
- ❌ N+1 queries in loop → Use batch query
- ✓ Efficient algorithm → No action

## Escalation Triggers

Automatically add 3rd reviewer when:
- ❌ Either reviewer says "Needs Further Review ?"
- ❌ Reviewers disagree fundamentally (Alice wants types, Marcus says be flexible)
- ❌ Security-critical code and Marcus uncertain
- ❌ Large refactor (300+ lines) and no architecture review

**Add 3rd reviewer:**
```
Dr. Priya Patel (Architecture & Design) or
Evan Brooks (Frontend) if PR is frontend-focused
```

## Troubleshooting

**Reviewers not launching?**
- Check PR was created via `mcp__github__create_pull_request`
- Verify `.claude/settings.json` PostToolUse hook is enabled
- Ensure PR description is clear and contains changed files

**Reviewer stuck on something?**
- Post in PR: "Ready for review when available"
- Wait 5 minutes, then re-request if still pending
- Escalate to 3rd reviewer if needed

**Conflicting verdicts?**
- Type safety takes precedence over flexibility
- Security takes precedence over performance
- Correctness takes precedence over style
- Follow decision principle, respond to both, re-request

## Files Changed by This Skill

This skill:
- ✓ Creates independent reviewer sessions
- ✓ Fetches PR details from GitHub
- ✓ Posts review comments on PR thread
- ✓ Tracks verdicts and approval status
- ✗ Does NOT modify code in the PR branch
- ✗ Does NOT merge PRs automatically
