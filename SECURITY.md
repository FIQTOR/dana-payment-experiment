# Security Policy

## ⚠️ This is an experimental project

This repository is a **learning/experimentation** project for the DANA Business API.
It is **not** hardened for production use out of the box. If you deploy it, review
the [Production hardening](#production-hardening) section below.

## Reporting a vulnerability

If you discover a security issue, **please do not open a public issue**.

Instead, report it privately via GitHub's
[Security Advisories](https://github.com/FIQTOR/dana-payment-experiment/security/advisories/new)
or email the maintainer. Please include:

- A description of the issue and its impact
- Steps to reproduce
- Any suggested remediation

We aim to acknowledge reports within **72 hours**.

## Secrets & credentials

- **Never commit** `.env` files or `.pem` keys — they are `.gitignore`d.
- The repo ships in **mock mode** (`DANA_MOCK_MODE=true`) by default, so no
  credentials are needed to run it.
- If you ever expose a **Client Secret** or **private key** (e.g. paste it into a
  chat, issue, or commit), **rotate it immediately** in the DANA dashboard.
- Production credentials should live in a secret manager / environment
  variables — never on disk in the repo.

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | ✅ |
| older tags | ❌ |

## Production hardening

Before any non-experimental use, consider adding:

- [ ] **Rate limiting** tightened per route (`RATE_LIMIT_MAX`)
- [ ] **Authentication** on the operator dashboard / API
- [ ] **HTTPS** termination + HSTS
- [ ] **Input validation** extended to every field (zod schemas are a good start)
- [ ] **Persistent storage** with backups (MySQL via Sequelize is included)
- [ ] **Logging/auditing** without leaking PII or secrets
- [ ] **Idempotency** handling for retries
- [ ] **Webhook signature verification enforced** (do not run with it skipped)
- [ ] **Dependency scanning** (Dependabot/Renovate enabled)
