# Binara — Phase 4 Supplement: Serverless Licence API

## Overview

Add a single Vercel serverless API route to proxy LemonSqueezy licence operations. This keeps the API key secret while maintaining zero-infrastructure (no database, no server to manage).

**Add this to the existing Phase 4 build.** It replaces the direct browser→LemonSqueezy API calls in `src/lib/pro.ts`.

---

## 1. Environment Variable

Add to `.env.local` (and Vercel dashboard → Settings → Environment Variables):

```
LEMONSQUEEZY_API_KEY=your_api_key_here
```

Add to `.env.example` for documentation:

```
LEMONSQUEEZY_API_KEY=
```

Add `.env.local` to `.gitignore` if not already there.

---

## 2. API Route

### File: `src/app/api/licence/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const LEMONSQUEEZY_API = 'https://api.lemonsqueezy.com/v1/licenses';
const API_KEY = process.env.LEMONSQUEEZY_API_KEY;

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { action, licence_key } = body;

    if (!licence_key || typeof licence_key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing licence key' },
        { status: 400 }
      );
    }

    if (action === 'activate') {
      const response = await fetch(`${LEMONSQUEEZY_API}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          license_key: licence_key,
          instance_name: 'binara-web',
        }),
      });

      const data = await response.json();

      if (data.activated || data.valid) {
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({
        success: false,
        error: data.error || 'Invalid licence key',
      });
    }

    if (action === 'verify') {
      const response = await fetch(`${LEMONSQUEEZY_API}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          license_key: licence_key,
        }),
      });

      const data = await response.json();

      return NextResponse.json({
        success: true,
        valid: data.valid === true,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "activate" or "verify".' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
```

---

## 3. Update `src/lib/pro.ts`

Replace all direct LemonSqueezy API calls with calls to our own API route.

### Replace `activatePro`:

```typescript
// BEFORE (direct call — exposes API key):
// const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', { ... });

// AFTER (proxied through our serverless route):
async function activatePro(licenceKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/licence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'activate',
        licence_key: licenceKey,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setProState({
        isActive: true,
        licenceKey,
        activatedAt: new Date().toISOString(),
        lastVerified: new Date().toISOString(),
      });
      return { success: true };
    }

    return { success: false, error: data.error || 'Activation failed' };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}
```

### Replace `verifyLicence`:

```typescript
// BEFORE (direct call):
// const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', { ... });

// AFTER:
async function verifyLicence(licenceKey: string): Promise<boolean> {
  try {
    const response = await fetch('/api/licence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        licence_key: licenceKey,
      }),
    });

    const data = await response.json();
    return data.success && data.valid;
  } catch {
    return false; // Network error — offline grace period handles this
  }
}
```

No other changes needed. The `checkProOnLoad()` function and 7-day offline grace period logic remain exactly the same.

---

## 4. Deployment Note

Since this uses a serverless API route (`src/app/api/`), the project **must be deployed to Vercel** (not GitHub Pages). This is already the case for binara.app — just make sure the `LEMONSQUEEZY_API_KEY` environment variable is set in the Vercel dashboard.

Static export (`next export`) won't work with API routes. The `next.config.ts` should NOT have `output: 'export'`. Vercel handles this automatically.

---

## 5. Summary

| What changed | Before | After |
|---|---|---|
| LemonSqueezy calls | Browser → LemonSqueezy API (API key exposed) | Browser → `/api/licence` → LemonSqueezy API |
| New files | — | `src/app/api/licence/route.ts` |
| Modified files | — | `src/lib/pro.ts` (2 functions updated) |
| Env vars | — | `LEMONSQUEEZY_API_KEY` |
| Hosting requirement | Static (GitHub Pages OK) | Vercel (for serverless function) |
