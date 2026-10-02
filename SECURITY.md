# Security Policy

## Supported Versions

Security fixes are applied to the actively maintained version of DiagramLab.

| Version | Security Support |
|---|---|
| Current `main` | Supported |
| Older releases | Best effort |

## Reporting a Vulnerability

Please do not disclose security vulnerabilities in a public GitHub issue.

For sensitive reports, use GitHub's private vulnerability reporting/security advisory mechanism when enabled for the repository. If private reporting is not available, contact the repository maintainer through the contact information listed on the maintainer's GitHub profile and include:

- A clear description of the vulnerability
- Affected component or endpoint
- Reproduction steps or proof of concept
- Potential security impact
- Suggested mitigation, if known

Please avoid including real API keys, passwords, tokens, personal data, or other secrets in the report.

## Security Architecture

DiagramLab uses a small Express server between the browser and the Gemini API.

```text
User Browser
     |
     | HTTPS
     v
DiagramLab / Express
     |
     | server-side secret
     v
Google Gemini API
```

The Gemini API key is intended to remain server-side. It must not be placed in frontend code or exposed through `VITE_*` environment variables.

## Current Defensive Controls

### HTTP hardening

The server disables the Express `X-Powered-By` header and applies:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

### Request limits

The API applies:

- JSON body limit of 1 MB
- AI prompt limit of 2,000 characters
- Null-byte removal
- AI endpoint rate limiting

### Generated-data validation

AI-generated diagrams are treated as untrusted data.

The server:

- Validates the presence of `nodes` and `edges`
- Normalizes node fields
- Restricts coordinates and dimensions
- Limits label lengths
- Validates connector handles
- Validates connector line and arrow types
- Removes edges that reference unknown nodes

### Browser storage

Project data is stored in browser local storage. Applications using DiagramLab should not assume that browser storage is a secure server-side database or a reliable backup mechanism.

### Third-party AI processing

Prompts sent to the AI endpoint are forwarded to the configured Gemini API provider. Users should avoid entering confidential or regulated information unless they have appropriate authorization and data-processing controls.

## Deployment Security

For Render deployments:

1. Store `GEMINI_API_KEY` only in Render Environment Variables.
2. Never commit `.env` files.
3. Never paste secrets into README files, screenshots, issues, or pull requests.
4. Use HTTPS.
5. Keep Node.js and dependencies current.
6. Review deployment logs for accidental secret disclosure.
7. Rotate exposed credentials immediately.

## Known Production Considerations

The following are intentionally documented rather than hidden:

- The current rate limiter is in-memory and therefore local to one server instance.
- Browser local storage is not suitable for shared persistent project storage.
- There is currently no application-level user authentication.
- There is no authorization layer because projects are not stored server-side.
- AI usage is subject to the configured provider's quota and billing policies.

For a multi-user SaaS deployment, consider adding authentication, authorization, persistent storage, distributed rate limiting, audit logging, abuse controls, and stronger content/security validation.

## Dependency Security

Recommended checks:

```bash
npm audit
npm outdated
```

Review dependency updates before applying them to production.

## Secret Exposure Response

If a Gemini API key or other secret is accidentally exposed:

1. Revoke or rotate the exposed credential immediately.
2. Remove it from source control where practical.
3. Check Git history if the secret was committed.
4. Review provider usage logs.
5. Update the production environment with the replacement secret.
6. Redeploy the service.

## Scope

This policy covers security issues in the DiagramLab application and its maintained source code.

Third-party provider infrastructure, including Render and Google Gemini infrastructure, should be reported to the respective provider through its security process.
