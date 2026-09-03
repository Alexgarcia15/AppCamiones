# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AppCamiones ("HECGAR GPS") is a fleet-tracking system with two parts in this repo:

- **Mobile app** (repo root + `mobile/`): an Expo/React Native app. Entry point is `App.tsx` at the repo root, which pulls screens/logic from `mobile/src/`.
- **Socket/API server** (`ServidorSocketsCamiones/`): a standalone Node.js server (Express + Socket.IO + `pg`) that ingests raw GPS-tracker traffic over TCP, stores it in PostgreSQL, and pushes live updates to the mobile app over Socket.IO. It is deployed separately (DigitalOcean droplet) and is not started by the Expo tooling.

There is a `backend/` directory at the root but it is currently empty — all server logic lives in `ServidorSocketsCamiones/`.

## Commands

Run from the repo root (mobile app):
```
npm start          # expo start
npm run android     # expo run:android
npm run ios         # expo run:ios
npm run web         # expo start --web
```

Run from `ServidorSocketsCamiones/` (tracking server):
```
node server.js       # starts the API + Socket.IO + both TCP receivers
node simulador.js    # sends one fake Coban-protocol location packet to port 5001, for testing without hardware
```
There is no configured test runner in either package (`ServidorSocketsCamiones/package.json`'s `test` script is a stub) and no lint script — don't assume either exists.

EAS builds (`eas.json`) define `development`, `preview`, and per-owner preview profiles (`preview-hector`, `preview-nini`, `preview-aguita`) that each bake a different `EXPO_PUBLIC_OWNER_TOKEN` into the build — see Auth model below.

## Architecture

### Data flow: physical GPS device → app

1. A physical GPS tracker (Coban TK403 protocol, or a Concox GT06N over the GT06/binary protocol) opens a raw TCP connection to `ServidorSocketsCamiones/server.js`:
   - Port `5001` — Coban text protocol (`procesarTramaCoban`).
   - Port `5002` — GT06 binary protocol (`procesarPaqueteGT06`, including login/heartbeat handshake and CRC16-ITU framing).
2. Both protocol handlers funnel into `actualizarYNotificar(imei, lat, lon, velocidad)`, which updates `camiones` and appends to `historial_ubicaciones` in Postgres, then emits a `camion_${imei}` Socket.IO event to the room named after that truck's `owner_id`.
3. The mobile app authenticates its socket connection once (see `socketService.ts`) by emitting `autenticar` with the owner's token; the server joins that socket to the room matching `owner_id`. Screens then subscribe to `camion_${imei}` events for the trucks they care about.
4. REST endpoints (`/api/mi-perfil`, `/api/mis-camiones`, `/api/apagar-camion`) are separately protected by `verificarToken` (Bearer token looked up against `duenos.token`) and scoped to `req.dueno.owner_id`.

### Remote engine shutdown

`conexionesGT06` (a `Map<imei, tcpSocket>`) keeps the live TCP socket for each connected GT06 device. `POST /api/apagar-camion` verifies the truck belongs to the calling owner, looks up its live connection, and writes a hand-built GT06 command packet (`construirComandoGT06`) to cut the engine — this only works while the device currently has a live TCP connection to the server. This path is implemented but explicitly noted in the code as not yet validated against real hardware.

### Auth model (multi-tenant by "owner")

There's no per-user login/password — each fleet owner (`duenos` table: `owner_id`, `token`, `activo`) has a static bearer token. A build of the mobile app can either:
- Have a token baked in at build time via `EXPO_PUBLIC_OWNER_TOKEN` (see `eas.json` preview profiles — used for client-specific APKs that skip the login screen), or
- Prompt for the token at runtime (`LoginScreen` → `AuthContext.loginWithCode`), persisted in `AsyncStorage`.

`AuthContext.tsx` (`mobile/src/context/AuthContext.tsx`) is the source of truth for `API_BASE_URL`, the current user, and the truck list; `socketService.ts` is a singleton that owns the one Socket.IO connection and must be authenticated once after login (not per-screen, to avoid duplicate listeners as the user navigates between truck screens).

### Mobile app structure

- `mobile/src/navigation/AppNavigator.tsx` — single stack navigator that swaps between an auth stack (Home/Login/Register) and the app stack (Dashboard/Trucks/TruckDetail/LiveMap/Alerts/Profile) based on `AuthContext`'s `user`.
- `mobile/src/context/` — `AuthContext` (session/trucks) and `AlertsContext` (in-app critical alerts: sound + vibration, see below). Both are mounted around the whole app in `App.tsx`.
- `mobile/src/services/` — `socketService` (Socket.IO singleton), `beepService`/`alertSoundService` (audio), `remoteShutdownService` (calls `/api/apagar-camion`).
- `mobile/src/screens/` — one screen per route name registered in `AppNavigator`.

**Dead code / in-progress design, not wired up**: `mobile/src/services/criticalAlertsService.ts`, `mobile/src/screens/TruckDetailScreen_Enhanced.tsx`, `mobile/src/screens/LiveMapScreen_Enhanced.tsx`, and the English-named `TruckStateEnum`/`AlertTypeEnum` types in `mobile/src/types/truckTypes.ts` describe a more elaborate 5-alert, 6-state design documented in `mobile/src/ARQUITECTURA_COMPLETA.ts` and `mobile/src/RESUMEN_IMPLEMENTACION.ts`. None of these `_Enhanced` files or `criticalAlertsService` are imported anywhere in the actually-running app — the live alert system is the simpler Spanish-keyed `AlertsContext.tsx` (`triggerAlert('ruta' | 'velocidad' | 'aceite' | 'seguro' | 'ignicion')`) combined with `beepService`. Treat the two `.ts` docs and the `_Enhanced` screens as a design reference, not current behavior — check what's actually imported before assuming a feature described there exists.

### Database

Postgres (`fleet_system` DB). Two tables matter: `duenos` (owner_id, token, activo) and `camiones` (owner_id, imei, ficha, lat/lon/velocidad, ...), plus `historial_ubicaciones` for location history. `ServidorSocketsCamiones/datos.sql` is a data-only dump useful for seeding a local DB; various one-off scripts in `ServidorSocketsCamiones/` (`agregarCamion.js`, `agregarDueno.js`, `actualizarNombre.js`, `ponerUbicacion*.js`, `verToken.js`) are manual admin utilities run directly with `node`, not part of any app flow.

**Note:** `server.js` has the Postgres password and `eas.json`/`datos.sql` have owner tokens hardcoded/committed in plaintext. Be careful not to further propagate these into new files, logs, or output.
