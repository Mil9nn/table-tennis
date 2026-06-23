# Shared code (backend + mobile)

TypeScript shared between the **Vercel backend** and the **Play Store mobile app**. Each app bundles what it imports at build time; there is no runtime shared service.

## Layout

| Repo | Path |
|------|------|
| Backend (this repo) | `shared/` at repo root |
| Mobile (separate repo) | `shared/` inside the mobile project |

**Source of truth:** `shared/` in the **backend repo**. After changing shared code here, sync to the mobile repo before a mobile release.

## Sync to mobile

From the backend repo root:

```powershell
.\scripts\sync-shared-to-mobile.ps1 -MobileRepoPath "C:\path\to\TableTennisScorer"
```

```bash
./scripts/sync-shared-to-mobile.sh /path/to/TableTennisScorer
```

## Module guide

- `shared/match/teamMatchTypes.core.ts` — mobile-safe types and constants (no mongoose)
- `shared/match/teamMatchTypes.server.ts` — backend-only types (mongoose, `Shot`)
- `shared/match/teamMatchTypes.ts` — backend barrel (core + server)
- `shared/match/scoringRules.ts` — game/match win helpers
- `shared/match/teamLineup.ts` — lineup pairing and validation
- `shared/match/teamMatchSchemas.ts` — Zod schemas
- `shared/tournament/teamConfigUtils.ts` — team tournament config normalization

Mobile imports should use `teamMatchTypes.core`, not `teamMatchTypes` or `teamMatchTypes.server`.

## Release checklist

1. Change shared code in the backend repo
2. Run `npm run build` on the backend
3. Run `sync-shared-to-mobile` into the mobile repo
4. Build/test the mobile app
5. Deploy backend (Vercel) and mobile (Play Store) as usual
