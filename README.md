# f1tv-api

[![Publish Package to NPM registry](https://github.com/eXhumer/f1tv-api/actions/workflows/publish.yml/badge.svg)](https://github.com/eXhumer/f1tv-api/actions/workflows/publish.yml)

Unofficial F1TV API client for JavaScript/TypeScript.

**This package is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing BV.**

## Installation
To install this package from npm registry:
  ```bash
  npm install @exhumer/f1tv-api
  ```

To install this package from Git:
  ```bash
  npm install git+https://github.com/eXhumer/f1tv-api.git
  ```

## Usage
```ts
import { F1TV, F1TVClient } from '@exhumer/f1tv-api';

// Loads F1TV config and your location, then resolves.
const f1tv = await F1TVClient.create({
  language: F1TV.Language.ENGLISH,   // default
  platform: F1TV.Platform.WEB_DASH,  // default
  // dispatcher: an undici Dispatcher (default: the global dispatcher)
  // userAgent: custom User-Agent header
  // ascendon: log in as part of create(); rejects if the token is invalid
});

// Verifies the ascendon (subscription) token, fetches the entitlement token
// and refreshes location. Throws if the token is invalid.
const user = await f1tv.login(ascendonToken);

const liveNow = await f1tv.liveNow();
const video = await f1tv.contentVideo(contentId);
const play = await f1tv.contentPlay(contentId);

// Clears the tokens and refreshes location as an anonymous user.
await f1tv.logout();
```

Requires Node.js 22.19 or later. The package ships both ESM and CommonJS builds.

## Migrating from 2.x
- `new F1TVClient(ascendon, language, platform, dispatcher, userAgent)` is replaced by `await F1TVClient.create({ ascendon, language, platform, dispatcher, userAgent })`. The constructor is private.
- The client no longer emits events. Wait for `create()` instead of `ready`. Instead of the `*Updated` and `*Error` events, await `login()`, `logout()`, `refreshConfig()`, `refreshLocation()` and `refreshEntitlement()`. They resolve with their data or throw.
- The `ascendon` setter is replaced by `await login(token)` and `await logout()`. Both refresh location, so after login the client uses your subscription's entitlement instead of staying anonymous.
- If `login()` or `logout()` is called while an earlier `login()` is still running, the earlier call rejects without changing state.
- `isReady` was removed, because a client returned by `create()` is always ready.
- Token verification uses `jose`, so verification errors are jose's error classes (for example `JWTExpired`) instead of jsonwebtoken's.

## Credits
* [robvdpol](https://github.com/robvdpol) and contributors of [RaceControl](https://github.com/robvdpol/RaceControl/). The addition of searchVod method was possbile thanks to their contribution to the project.

## License

This package is licensed under the AGPL-3.0-only License. See the [LICENSE](LICENSE.md) file for more information.
