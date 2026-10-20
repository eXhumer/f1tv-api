# f1tv-api

[![CI](https://github.com/eXhumer/f1tv-api/actions/workflows/ci.yml/badge.svg)](https://github.com/eXhumer/f1tv-api/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/eXhumer/f1tv-api/branch/main/graph/badge.svg)](https://codecov.io/gh/eXhumer/f1tv-api)
[![npm](https://img.shields.io/npm/v/@exhumer/f1tv-api)](https://www.npmjs.com/package/@exhumer/f1tv-api)

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
  // deviceInfo: { os, browser, browserVersion, osVersion, model? } for the
  //   x-f1-device-info header sent with contentPlay(), actionPlay() and
  //   contentUserSelections()
});

// Verifies the ascendon (subscription) token, fetches the entitlement token
// and refreshes location. Throws if the token is invalid.
const user = await f1tv.login(ascendonToken);

const liveNow = await f1tv.liveNow();
const video = await f1tv.contentVideo(contentId);
// player: 'player_bm' (Bitmovin, a single stream url) or 'player_tm' (Tiled Media,
// Premium; every feed in result.tme.feeds). The result type follows the player.
const play = await f1tv.contentPlay(contentId, 'player_bm', channelId);

// Saves the resume position (seconds) for VOD, like the web player's heartbeat.
// contentSubType is the container's metadata.contentSubtype, for example 'REPLAY'.
await f1tv.actionPlay(contentId, player.currentTime, 'REPLAY');

// Reads the saved resume position (and My List state), keyed by content ID.
const selections = await f1tv.contentUserSelections([{ contentId, duration: video.metadata.duration }]);
const resumeAt = selections.resultObj[contentId].user.resume.playHeadPosition;

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
- `contentPlay(contentId, channelId?, platform?)` is now `contentPlay(contentId, player, channelId?, platform?)`, where `player` is `'player_bm'` or `'player_tm'`. It calls the play API version from F1TV's config (currently 3.0), and the result is typed for the player you pass. `drmToken` is gone; use `laURL` for the Widevine license.
- `contentVideo()` also takes its API version from the config (currently 4.0).
- `picture()` sends `w`/`h` like the web app, and takes an optional `variant` (`landscape_web` or `landscape_hero_web`) as its last argument.
- Token verification uses `jose`, so verification errors are jose's error classes (for example `JWTExpired`) instead of jsonwebtoken's.

## Development

```sh
npm install
npm run typecheck
npm run build
npm test
npm run coverage
```

The tests answer the client's requests with an undici `MockAgent` (the client's
`dispatcher` option), and sign test tokens with a key whose JWKS stands in for
F1's, so they never reach F1. Coverage must stay at 100%; `npm run coverage`
fails below it.

## Credits
* [robvdpol](https://github.com/robvdpol) and contributors of [RaceControl](https://github.com/robvdpol/RaceControl/). The addition of searchVod method was possbile thanks to their contribution to the project.

## License

[MIT](LICENSE.md)
