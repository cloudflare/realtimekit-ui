# Documentation Automation Setup

This document explains how to set up the automated documentation workflow that creates PRs to the cloudflare-docs repository when `components.d.ts` changes.

## Required Setup

### 1. GitHub Personal Access Token

Create a Personal Access Token (PAT) with the following permissions:

**For the cloudflare-docs repository:**

- `repo` (Full control of private repositories)
- `workflow` (Update GitHub Action workflows)
- `pull_requests:write` (Create and update pull requests)

**Steps to create the token:**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set expiration and select the required scopes above
4. Generate and copy the token

### 2. Repository Secret

Add the PAT as a repository secret in the realtimekit-ui repository:

1. Go to realtimekit-ui repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `DOCS_REPO_TOKEN`
4. Value: The PAT created in step 1
5. Click "Add secret"

### 3. Permissions

Ensure the GitHub Actions in this repository have permission to:

- Read repository contents
- Create issues and pull requests (for commenting on PRs)

## How It Works

### Trigger Conditions

The workflow runs when:

- Changes are pushed to `main` branch
- The changed files include `packages/core/src/components.d.ts`

### Workflow Steps

1. **Generate Documentation**: Runs `npm run docs:generate` to create MDX files
2. **Checkout cloudflare-docs**: Clones the target repository using the PAT
3. **Create Branch**: Creates a timestamped branch for the changes
4. **Copy Documentation**: Copies generated docs to the correct path
5. **Commit Changes**: Commits the documentation updates
6. **Create PR**: Opens a pull request in cloudflare-docs

### Target Location

Documentation is copied to:

```
cloudflare-docs/src/content/docs/realtime/realtimekit/ui-kit/api-reference/
├── core/
│   ├── index.mdx
│   ├── rtk-component-1.mdx
│   └── ...
├── react/
│   ├── index.mdx
│   ├── RtkComponent1.mdx
│   └── ...
└── angular/
    ├── index.mdx
    ├── rtk-component-1.mdx
    └── ...
```
