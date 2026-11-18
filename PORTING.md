# Porting map: customer-web → joya-mobile

## Source pin

- **Repo:** `joya-energy/joya-monorepo`
- **Path:** `apps/customer-web`
- **Commit SHA:** `9c37176f83f069b5e8869ce518997049d5d1ae79`
- **Copied on:** 2026-11-18

## Copied trees

| Source | Destination | Status |
|--------|-------------|--------|
| `src/lib/**` | `src/lib/**` | Copied; `api.ts` / `api-base-url.ts` adjusted for Bearer |
| `src/types/**` | `src/types/**` | Copied; `LoginResponse` extended for flat tokens |
| `src/hooks/**` | `src/hooks/**` | Copied (needs nav/storage swaps) |
| `src/contexts/**` | `src/contexts/**` | Copied (needs SecureStore wiring) |
| `src/components/{client,auth,landing,devis,approval,joya,notifications,onboarding,profile,ui,installateurs}` | same | Copied; DOM→RN adjust pending |
| `src/styles/joya-tokens.css` | `src/theme/joya-tokens.css` | Copied; resolved hex in `colors.js` |
| `public/brand/**` | `assets/brand/**` | Copied |
| `public/dashboard/**` | `assets/dashboard/**` | Copied |

## Platform adapters (new)

| Adapter | Path | Replaces |
|---------|------|----------|
| Storage | `src/platform/storage.ts` | localStorage / sessionStorage |
| Secure tokens | `src/platform/secure-storage.ts` | httpOnly cookies |
| Events | `src/platform/events.ts` | window CustomEvent |

## Backend prerequisites (monorepo)

- Login / refresh return `accessToken`, `refreshToken`, `expiresIn`, `tokenType`
- `GET /auth/socket-token` accepts Bearer
- `DELETE /users/me` with `{ confirmation: "DELETE" }` for App Store account deletion
- `STORAGE_BASE_PUBLIC_URL` must be device-reachable

## Deviations

- No Next.js `/V1` BFF — direct `EXPO_PUBLIC_API_URL/V1`
- Phone-only Tailwind screens (no sm/md/lg)
- UI form components still web DOM — adjusting screen-by-screen
