# joya-mobile

Expo (React Native) client app for JOYA Energy. Built by **copying** [`apps/customer-web`](https://github.com/joya-energy/joya-monorepo) and adjusting for native — same visuals as the web mobile viewport, same `core-api` / `socket-api`.

## Prerequisites

1. Node 22+ recommended (Expo SDK 58)
2. Running `core-api` with mobile auth changes (tokens in login/refresh JSON, Bearer socket-token)
3. Device or emulator that can reach the API host

## Setup

```bash
cp .env.example .env
# Edit EXPO_PUBLIC_API_URL / EXPO_PUBLIC_SOCKET_URL (LAN IP for physical devices)

npm install --legacy-peer-deps
npx expo start
```

## Architecture notes

- Auth: Bearer JWT in SecureStore (not cookies)
- Styling: NativeWind + Joya tokens from customer-web
- Source of truth for features: copied trees under `src/` — see `PORTING.md`

## Bundle IDs

- iOS / Android: `com.joyaenergy.client`
