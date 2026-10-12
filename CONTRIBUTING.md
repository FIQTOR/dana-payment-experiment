# Contributing to DANA Payment Experiment Lab

First off, thanks for taking the time to contribute! 🎉

This is an **experimental** project for learning and testing the DANA Business API
(SNAP) integration. Contributions that improve correctness, security, docs, or
developer experience are very welcome.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [How to contribute](#how-to-contribute)
- [Commit convention](#commit-convention)
- [Reporting bugs](#reporting-bugs)

## Code of conduct

Be respectful and constructive. We follow the
[Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Getting started

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/dana-payment-experiment.git
cd dana-payment-experiment

# 2. Install everything
npm install
npm run install:all

# 3. Set up the backend env
cp backend/.env.example backend/.env
npm run keygen          # generates an RSA keypair in backend/certs

# 4. Run both servers
npm run dev             # backend :4000 + frontend :5173
```

The project runs in **mock mode** by default (`DANA_MOCK_MODE=true`), so you do
**not** need real DANA credentials to develop.

## Project structure

```
dana-payment-experiment/
├── backend/     Express.js API (SNAP signing, QRIS, webhooks)
├── frontend/    React + Vite + TailwindCSS v4 + Tabler Icons
└── docs/        API mapping & setup guides
```

## How to contribute

1. **Open an issue first** for significant changes so we can align.
2. Create a branch: `git checkout -b feat/my-feature`.
3. Make your changes.
4. Run the checks:
   ```bash
   npm run lint --prefix frontend
   npm run build --prefix frontend
   ```
5. Commit (see convention below) and push.
6. Open a Pull Request against `main`.

### Guidelines

- Keep the code style consistent with the existing files (ESM, 2-space indent).
- Never commit secrets, real credentials, or `.pem` keys.
- Add/update docs when you change behavior.
- Prefer small, focused PRs.

## Commit convention

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add refund endpoint
fix: correct SNAP signature body hash
docs: clarify sandbox setup steps
chore: bump dependencies
```

## Reporting bugs

Open an issue with:

- What you expected vs. what happened
- Steps to reproduce
- Environment (OS, Node version, mock or live mode)
- Relevant logs (**redact any secrets/credentials**)

---

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
