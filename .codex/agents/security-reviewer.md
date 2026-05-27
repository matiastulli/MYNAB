---
name: security-reviewer
source: ../../.claude/agents/security-reviewer.md
codex_agent_type: explorer
---

# Codex Adapter: Security Reviewer

Use this adapter when the user explicitly asks for delegated security review or parallel security verification.

Spawn a Codex `explorer` for independent security review. Ask it to inspect the relevant files and report vulnerabilities only. It should not edit files unless specifically asked.

Preserve the source Claude role's threat model:

1. Data isolation breach.
2. Authentication bypass or role escalation.
3. OTP or verification abuse.
4. File upload attacks.
5. SQL or command injection.
6. Sensitive data exposure.

Required checks:

- Every `SELECT`, `UPDATE`, and `DELETE` on `budget_entry`, `files`, and `auth_user` must be scoped to the authenticated user or protected by equivalent ownership logic.
- Pagination queries must be user-scoped.
- Delete endpoints must verify ownership before deleting.
- Non-public routes must use `Depends(require_role([]))` or explicit role dependencies.
- Refresh token validation and logout expiry must remain intact.
- OTP codes must have short expiry, attempt limits, single-use enforcement, and `code_type` validation.
- File parsing must use in-memory bytes, not attacker-controlled paths.
- Bank dispatch must use an allowlist, not dynamic attribute access or `eval`.
- Query params such as `currency`, `start_date`, and `end_date` must be validated.
- Raw exception messages must not leak outside debug environments.
- User schemas must not expose password or sensitive fields.
- `file_base64` must not appear in list/detail responses.
- Frontend must not render user-controlled data through unsafe HTML.
- CORS wildcard origins are unacceptable outside local environments.

Report format:

```text
[SEVERITY] Module/File -> Vulnerability description
Impact: what an attacker can do
Reproduce: minimal steps or code path
Fix: concrete recommendation
```

Severity levels:

- `CRITICAL`: cross-user data exposure or modification, auth bypass, code execution.
- `HIGH`: OTP brute force, sensitive PII in response, missing ownership check.
- `MEDIUM`: missing input validation, overly broad CORS, stack trace leakage.
- `LOW`: defense-in-depth gap or minor information disclosure.
