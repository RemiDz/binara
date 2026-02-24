# Binara — Phase 4 Addendum: Pro Unlocked for Testing

## Override

During the testing/polish phase, **all Pro features should be unlocked by default**. LemonSqueezy integration code stays in place (fully wired) but is dormant.

### Change in `src/lib/pro.ts`

Add a single flag at the top of the file:

```typescript
// ━━━ TESTING MODE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Set to false to activate LemonSqueezy licence checks
const TESTING_MODE = true;
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Update `isPro()`:

```typescript
function isPro(): boolean {
  if (TESTING_MODE) return true;
  const state = getProState();
  return state.isActive;
}
```

### Update `checkProOnLoad()`:

```typescript
async function checkProOnLoad(): Promise<boolean> {
  if (TESTING_MODE) return true;
  // ... existing LemonSqueezy verification logic unchanged
}
```

### What this means:

- ✅ All Pro features unlocked (sensors, export, sharing, unlimited layers/saves)
- ✅ ProGate overlays never appear
- ✅ LemonSqueezy code is fully built and wired — just not called
- ✅ ProUpgrade modal still accessible (for UI testing) but not required
- ✅ Header shows "PRO" badge
- ✅ One-line change (`TESTING_MODE = false`) activates the paywall when ready

### When ready to go live:

1. Set `TESTING_MODE = false`
2. Create product in LemonSqueezy dashboard
3. Set `LEMONSQUEEZY_API_KEY` in Vercel env vars
4. Update checkout URL constant in `ProUpgrade.tsx`
5. Deploy
