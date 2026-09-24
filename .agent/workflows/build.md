---
description: How to build the project for distribution
---

# Build Workflow

## Prerequisites

- Node.js 18+
- npm or pnpm

## Quick Build

// turbo

```bash
npm run build
```

## Available Versions

### 1. Tampermonkey Userscript (Recommended)

**File**: `dist/nix-helper.user.js`

Auto-loads when visiting NIX LMS websites. Install via Tampermonkey.

### 2. Console Paste Version

**File**: `paste-to-console.js`

Copy and paste into browser console (F12).

The build copies the canonical runtime into a userscript artifact with
Tampermonkey metadata, including update and download URLs.
