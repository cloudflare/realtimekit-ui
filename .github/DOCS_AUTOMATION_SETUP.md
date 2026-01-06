# Documentation Automation Setup

This document explains how to set up the automated documentation workflow that creates PRs to the cloudflare-docs repository when `components.d.ts` changes.

## Required Setup

### 1. GitHub App for cloudflare-docs access

The workflow authenticates to `cloudflare/cloudflare-docs` using a GitHub App installation token generated at runtime via `actions/create-github-app-token@v1`.

This avoids using a long-lived Personal Access Token.

The GitHub App must be installed for the `cloudflare` org (or at minimum have access to the `cloudflare/cloudflare-docs` repository) with sufficient permissions to:

- Create and push branches to `cloudflare/cloudflare-docs`
- Create pull requests in `cloudflare/cloudflare-docs`

### 2. Repository secrets

Add these secrets to the `realtimekit-ui` repository:

1. Go to `realtimekit-ui` → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add:

- `GH_APP_ID`: GitHub App ID
- `GH_APP_PRIVATE_KEY`: GitHub App private key (PEM)

### 3. Workflow permissions

The workflow itself requests:

- `contents: write`
- `pull-requests: write`
- `id-token: write`

Note that the PR creation and pushes to `cloudflare-docs` are performed using the GitHub App token, not the workflow `GITHUB_TOKEN`.
