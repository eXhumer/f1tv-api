import { getGlobalDispatcher, setGlobalDispatcher } from 'undici';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { F1TVClient, verifyF1TVSubscriptionToken } from '../src/client';
import { F1TV } from '../src/type';
import packageJson from '../package.json';
import {
  ANON_LOCATION,
  anonymousClient,
  bareClient,
  CONFIG,
  ENTITLEMENT,
  FakeF1TV,
  location,
  loggedInClient,
  serveJwks,
  signToken,
  USER_LOCATION,
} from './helpers';

const DEVICE = { os: 'macOS', browser: 'Chrome', browserVersion: 155, osVersion: '27.0.1' };

beforeAll(() => {
  serveJwks();
});

describe('verifyF1TVSubscriptionToken', () => {
  it('returns the claims of a token signed with F1’s key', async () => {
    const payload = await verifyF1TVSubscriptionToken(await signToken({ claims: { SubscriberId: '42' } }));
    expect(payload).toMatchObject({ SubscriberId: '42', FirstName: 'Max' });
  });

  it('rejects an empty or non-string token', async () => {
    await expect(verifyF1TVSubscriptionToken('')).rejects.toThrow('not a valid JWT token');
    await expect(verifyF1TVSubscriptionToken(42 as unknown as string)).rejects.toThrow('not a valid JWT token');
  });

  it('rejects a token without a key ID', async () => {
    await expect(verifyF1TVSubscriptionToken(await signToken({ kid: null }))).rejects.toThrow('KID not available');
  });

  it('rejects a token signed with another key', async () => {
    await expect(verifyF1TVSubscriptionToken(await signToken({ wrongKey: true }))).rejects.toThrow();
  });
});

describe('F1TVClient.create', () => {
  it('loads the config and the anonymous location', async () => {
    const { client, server } = await anonymousClient();
    expect(client.config).toEqual(CONFIG);
    expect(client.location).toEqual(location().resultObj);
    expect(client.loginStatus()).toBe('A');
    expect([client.ascendon, client.decodedAscendon, client.entitlement]).toEqual([null, null, null]);
    expect([client.language, client.platform]).toEqual([F1TV.Language.ENGLISH, F1TV.Platform.WEB_DASH]);
    expect(server.last('/config').headers['user-agent']).toBe(
      `${packageJson.name}/${packageJson.version} (${packageJson.repository.url})`,
    );
    server.done();
  });

  it('uses the language, platform and user agent it is given', async () => {
    const server = new FakeF1TV()
      .on('GET', '/config', 200, CONFIG)
      .on('GET', '/1.0/A/NLD/MOBILE_HLS/ALL/USER/LOCATION', 200, location());
    await F1TVClient.create({
      dispatcher: server.agent,
      language: F1TV.Language.DUTCH,
      platform: F1TV.Platform.MOBILE_HLS,
      userAgent: 'test-agent/1.0',
    });
    expect(server.last('/config').headers['user-agent']).toBe('test-agent/1.0');
    server.done();
  });

  describe('with the global dispatcher', () => {
    const original = getGlobalDispatcher();
    afterEach(() => setGlobalDispatcher(original));

    it('uses it when none is given', async () => {
      const server = new FakeF1TV().on('GET', '/config', 200, CONFIG).on('GET', ANON_LOCATION, 200, location());
      setGlobalDispatcher(server.agent);
      await F1TVClient.create();
      server.done();
    });
  });

  it('logs in when given a token', async () => {
    const { client, server, ascendon } = await loggedInClient();
    expect(client.ascendon).toBe(ascendon);
    expect(client.entitlement).toBe('entitlement-token');
    expect(client.decodedAscendon).toMatchObject({ SubscriberId: '1234' });
    expect(client.loginStatus()).toBe('R');
    expect(client.location.userLocation[0]?.entitlement).toBe('PREMIUM');
    server.done();
  });

  it('rejects when the config or the location cannot be loaded', async () => {
    const configDown = new FakeF1TV().on('GET', '/config', 503, 'down').on('GET', ANON_LOCATION, 200, location());
    await expect(F1TVClient.create({ dispatcher: configDown.agent })).rejects.toThrow(
      'Failed to get config (Status Code 503): down',
    );
    const locationDown = new FakeF1TV().on('GET', '/config', 200, CONFIG).on('GET', ANON_LOCATION, 500, 'oops');
    await expect(F1TVClient.create({ dispatcher: locationDown.agent })).rejects.toThrow(
      'Failed to get location (Status Code 500): oops',
    );
  });
});

describe('refreshConfig', () => {
  it('trims API versions and ignores ones that are not x.y', async () => {
    const { client, server } = await anonymousClient();
    server
      .on('GET', '/config', 200, { apiConfig: { playAPIVersion: ' 2.1 ', videoAPIVersion: 3 } })
      .on('GET', ENTITLEMENT, 200, { resultObj: { entitlementToken: 'e' } })
      .on('GET', USER_LOCATION, 200, location('PREMIUM'))
      .on('GET', '/2.1/R/ENG/WEB_DASH/ALL/CONTENT/PLAY', 200, {});
    await client.refreshConfig();
    await expect(client.contentVideo(1)).rejects.toThrow('video API version is not available from config');
    await client.login(await signToken());
    await client.contentPlay(1, 'player_tm');
    server.done();
  });

  it('treats a config without apiConfig as having no API versions', async () => {
    const { client } = await loggedInClient({}, { config: {} });
    await expect(client.contentPlay(1, 'player_tm')).rejects.toThrow('play API version is not available from config');
    await expect(client.contentVideo(1)).rejects.toThrow('video API version is not available from config');
  });
});

describe('login and logout', () => {
  it('logs out back to the anonymous location', async () => {
    const { client, server } = await loggedInClient();
    server.on('GET', ANON_LOCATION, 200, location('REGISTERED', 2));
    await client.logout();
    expect([client.ascendon, client.decodedAscendon, client.entitlement]).toEqual([null, null, null]);
    expect(client.location.userLocation[0]).toEqual({ entitlement: 'REGISTERED', groupId: 2 });
    server.done();
  });

  it('sends the entitlement token when loading the location of a logged-in user', async () => {
    const { server } = await loggedInClient();
    expect(server.last(USER_LOCATION).headers['entitlementtoken']).toBe('entitlement-token');
    expect(server.last(ANON_LOCATION).headers['entitlementtoken']).toBeUndefined();
    expect(server.last(ENTITLEMENT).headers['ascendontoken']).toBeDefined();
  });

  it('keeps the previous state when the entitlement request fails', async () => {
    const { client, server } = await anonymousClient();
    server.on('GET', ENTITLEMENT, 401, 'no subscription');
    await expect(client.login(await signToken())).rejects.toThrow('Failed to get entitlement (Status Code 401): no subscription');
    expect(client.ascendon).toBeNull();
  });

  it('rejects a login that a later logout overtook', async () => {
    const { client, server } = await anonymousClient();
    server
      .on('GET', ENTITLEMENT, 200, { resultObj: { entitlementToken: 'e' } })
      .on('GET', ANON_LOCATION, 200, location());
    const login = client.login(await signToken());
    await client.logout();
    await expect(login).rejects.toThrow('login superseded by a later login() or logout()');
    expect(client.ascendon).toBeNull();
    server.done();
  });

  it('drops a location that arrives after a newer login or logout', async () => {
    const { client, server } = await anonymousClient();
    server.on('GET', ANON_LOCATION, 200, location('STALE')).on('GET', ANON_LOCATION, 200, location('FRESH'));
    const stale = client.refreshLocation();
    await client.logout();
    expect((await stale).userLocation[0]?.entitlement).toBe('STALE');
    expect(client.location.userLocation[0]?.entitlement).toBe('FRESH');
  });
});

describe('refreshEntitlement', () => {
  it('needs a login', async () => {
    const { client } = await anonymousClient();
    await expect(client.refreshEntitlement()).rejects.toThrow('ascendon token is not set');
  });

  it('replaces the entitlement token', async () => {
    const { client, server } = await loggedInClient();
    server.on('GET', ENTITLEMENT, 200, { resultObj: { entitlementToken: 'renewed' } });
    await expect(client.refreshEntitlement()).resolves.toBe('renewed');
    expect(client.entitlement).toBe('renewed');
  });

  it('does not bring back an entitlement after a logout', async () => {
    const { client, server } = await loggedInClient();
    server
      .on('GET', ENTITLEMENT, 200, { resultObj: { entitlementToken: 'late' } })
      .on('GET', ANON_LOCATION, 200, location());
    const refresh = client.refreshEntitlement();
    await client.logout();
    await expect(refresh).resolves.toBe('late');
    expect(client.entitlement).toBeNull();
  });
});

describe('getDeviceInfo', () => {
  it('is null without the deviceInfo option', async () => {
    const { client } = await loggedInClient();
    expect(client.getDeviceInfo()).toBeNull();
  });

  it('allows multiview only for OPS, VIP or PREMIUM locations, never on Safari, and when not turned off', async () => {
    expect((await loggedInClient({ deviceInfo: DEVICE })).client.getDeviceInfo()).toContain(';p=true;');
    for (const entitlement of ['OPS', 'VIP']) {
      const { client } = await loggedInClient({ deviceInfo: DEVICE }, { userLocation: location(entitlement) });
      expect(client.getDeviceInfo()).toContain(';p=true;');
    }
    expect((await anonymousClient({ deviceInfo: DEVICE })).client.getDeviceInfo()).toContain(';p=false;');
    expect((await loggedInClient({ deviceInfo: { ...DEVICE, browser: 'Safari' } })).client.getDeviceInfo()).toContain(';p=false;');
    expect((await loggedInClient({ deviceInfo: { ...DEVICE, multiView: false } })).client.getDeviceInfo()).toContain(';p=false;');
  });

  it('allows no multiview without a location', async () => {
    expect(bareClient({ deviceInfo: DEVICE }).getDeviceInfo()).toContain(';p=false;');
    const { client } = await anonymousClient({ deviceInfo: DEVICE }, { anonLocation: { resultObj: { userLocation: [] } } });
    expect(client.getDeviceInfo()).toContain(';p=false;');
  });
});

describe('actionPlay', () => {
  const PATH = '/1.0/R/ENG/WEB_DASH/ALL/ACTION/PLAY';

  it('needs a login', async () => {
    const { client } = await anonymousClient();
    await expect(client.actionPlay(1, 10, 'REPLAY')).rejects.toThrow('unable to report play position');
  });

  it('posts the rounded position with both tokens and the device info', async () => {
    const { client, server, ascendon } = await loggedInClient({ deviceInfo: DEVICE });
    server.on('POST', PATH, 200, { resultCode: 'OK' });
    await expect(client.actionPlay(1000, 125.6, 'REPLAY')).resolves.toEqual({ resultCode: 'OK' });
    const request = server.last(PATH);
    expect(JSON.parse(request.body!)).toEqual({ contentId: 1000, playHeadPosition: 126, contentSubType: 'REPLAY' });
    expect(request.headers).toMatchObject({
      ascendontoken: ascendon,
      entitlementtoken: 'entitlement-token',
      'content-type': 'application/json',
      'x-f1-device-info': expect.stringContaining('device=web;screen=browser;os=macos'),
    });
  });

  it('leaves the device info out without the option, and reports errors', async () => {
    const { client, server } = await loggedInClient();
    server.on('POST', PATH, 200, {}).on('POST', PATH, 500, 'nope');
    await client.actionPlay(1, 10, 'REPLAY');
    expect(server.last(PATH).headers['x-f1-device-info']).toBeUndefined();
    await expect(client.actionPlay(1, 10, 'REPLAY')).rejects.toThrow('Failed to report play position (Status Code 500): nope');
  });
});

describe('contentPlay', () => {
  const PATH = '/2.0/R/ENG/WEB_DASH/ALL/CONTENT/PLAY';

  it('needs a login', async () => {
    const { client } = await anonymousClient();
    await expect(client.contentPlay(1, 'player_tm')).rejects.toThrow('unable to play content');
  });

  it('asks for the content with the player, and the channel when given', async () => {
    const { client, server } = await loggedInClient({ deviceInfo: DEVICE });
    server
      .on('GET', PATH, 200, { resultObj: { url: 'a' } })
      .on('GET', '/2.0/R/ENG/BIG_SCREEN_HLS/ALL/CONTENT/PLAY', 200, { resultObj: { url: 'b' } });
    await expect(client.contentPlay(1000, 'player_tm')).resolves.toEqual({ resultObj: { url: 'a' } });
    expect(server.last(PATH).path).toBe(`${PATH}?contentId=1000&player=player_tm`);
    expect(server.last(PATH).headers['x-f1-device-info']).toContain('p=true');
    await client.contentPlay(1000, 'player_bm', 1033, F1TV.Platform.BIG_SCREEN_HLS);
    expect(server.last('/2.0/R/ENG/BIG_SCREEN_HLS/ALL/CONTENT/PLAY').path).toBe(
      '/2.0/R/ENG/BIG_SCREEN_HLS/ALL/CONTENT/PLAY?contentId=1000&player=player_bm&channelId=1033',
    );
  });

  it('leaves the device info out without the option, and reports errors', async () => {
    const { client, server } = await loggedInClient();
    server.on('GET', PATH, 200, {}).on('GET', PATH, 403, 'geo');
    await client.contentPlay(1, 'player_tm');
    expect(server.last(PATH).headers['x-f1-device-info']).toBeUndefined();
    await expect(client.contentPlay(1, 'player_tm')).rejects.toThrow('Failed to play content (Status Code 403): geo');
  });
});

describe('contentUserSelections', () => {
  const PATH = '/2.0/R/ENG/WEB_DASH/ALL/CONTENT/USERSELECTIONS/PREMIUM/14';

  it('needs a login and a location', async () => {
    await expect((await anonymousClient()).client.contentUserSelections([])).rejects.toThrow('entitlement token is not set');
    const { client } = await loggedInClient({}, { userLocation: { resultObj: { userLocation: [] } } });
    await expect(client.contentUserSelections([])).rejects.toThrow('location is not set');
    const bare = bareClient();
    (bare as unknown as { _entitlement: string })._entitlement = 'e';
    await expect(bare.contentUserSelections([])).rejects.toThrow('location is not set');
  });

  it('posts each content’s duration keyed by ID', async () => {
    const { client, server } = await loggedInClient({ deviceInfo: DEVICE });
    server.on('POST', PATH, 200, { resultObj: { 1000: { user: { resume: { playHeadPosition: 90 } } } } });
    const result = await client.contentUserSelections([
      { contentId: 1000, duration: 7200 },
      { contentId: 1001, duration: 600 },
    ]);
    expect(result).toEqual({ resultObj: { 1000: { user: { resume: { playHeadPosition: 90 } } } } });
    const request = server.last(PATH);
    expect(JSON.parse(request.body!)).toEqual({ 1000: { duration: 7200 }, 1001: { duration: 600 } });
    expect(request.headers).toMatchObject({ entitlementtoken: 'entitlement-token', 'content-type': 'text/plain;charset=UTF-8' });
    expect(request.headers['x-f1-device-info']).toContain('p=true');
  });

  it('leaves the device info out without the option, and reports errors', async () => {
    const { client, server } = await loggedInClient();
    server.on('POST', PATH, 200, {}).on('POST', PATH, 500, 'bad');
    await client.contentUserSelections([]);
    expect(server.last(PATH).headers['x-f1-device-info']).toBeUndefined();
    await expect(client.contentUserSelections([])).rejects.toThrow('Failed to get user selections (Status Code 500): bad');
  });
});

describe('contentVideo', () => {
  it('needs a location', async () => {
    await expect(bareClient().contentVideo(1)).rejects.toThrow('location is not set');
    const { client } = await anonymousClient({}, { anonLocation: { resultObj: { userLocation: [] } } });
    await expect(client.contentVideo(1)).rejects.toThrow('location is not set');
  });

  it('returns the first container, sending the entitlement only when logged in', async () => {
    const anonymous = await anonymousClient();
    anonymous.server.on('GET', '/3.0/A/ENG/WEB_DASH/ALL/CONTENT/VIDEO/1000/REGISTERED/14', 200, {
      resultObj: { containers: [{ id: 'first' }, { id: 'second' }] },
    });
    await expect(anonymous.client.contentVideo(1000)).resolves.toEqual({ id: 'first' });
    expect(anonymous.server.last('/3.0/A/ENG/WEB_DASH/ALL/CONTENT/VIDEO/1000/REGISTERED/14').headers['entitlementtoken']).toBeUndefined();

    const user = await loggedInClient();
    const path = '/3.0/R/ENG/WEB_DASH/ALL/CONTENT/VIDEO/1000/PREMIUM/14';
    user.server.on('GET', path, 200, { resultObj: { containers: [{ id: 'first' }] } });
    await user.client.contentVideo(1000);
    expect(user.server.last(path).headers['entitlementtoken']).toBe('entitlement-token');
  });

  it('reports errors and empty results', async () => {
    const { client, server } = await anonymousClient();
    const path = '/3.0/A/ENG/WEB_DASH/ALL/CONTENT/VIDEO/1/REGISTERED/14';
    server.on('GET', path, 404, 'missing').on('GET', path, 200, { resultObj: { containers: [] } });
    await expect(client.contentVideo(1)).rejects.toThrow('Failed to get video content (Status Code 404): missing');
    await expect(client.contentVideo(1)).rejects.toThrow('No containers found');
  });
});

describe('liveNow', () => {
  const PATH = '/1.0/A/ENG/WEB_DASH/ALL/EVENTS/LIVENOW/REGISTERED/14';

  it('needs a location', async () => {
    await expect(bareClient().liveNow()).rejects.toThrow('location is not set');
    const { client } = await anonymousClient({}, { anonLocation: { resultObj: { userLocation: [] } } });
    await expect(client.liveNow()).rejects.toThrow('location is not set');
  });

  it('returns what is live, or reports the error', async () => {
    const { client, server } = await anonymousClient();
    server.on('GET', PATH, 200, { resultObj: { containers: [] } }).on('GET', PATH, 500, 'down');
    await expect(client.liveNow()).resolves.toEqual({ resultObj: { containers: [] } });
    await expect(client.liveNow()).rejects.toThrow('Failed to get live now (Status Code 500): down');
  });
});

describe('picture', () => {
  it('asks the image resizer for the size and options given', async () => {
    const { client, server } = await anonymousClient();
    const plain = '/image-resizer/image/1000-abc';
    const cropped = '/image-resizer/image/1000-abc/landscape_web';
    server.on('GET', plain, 200, 'jpeg-bytes').on('GET', cropped, 200, 'png-bytes');

    const blob = await client.picture('1000-abc', 640, 360);
    expect(await blob.text()).toBe('jpeg-bytes');
    expect(server.last(plain).path).toBe(`${plain}?w=640&h=360`);

    await client.picture('1000-abc', 1280, 720, 'HI', 'L', 'true', 'landscape_web');
    expect(server.last(cropped).path).toBe(`${cropped}?w=1280&h=720&q=HI&o=L&fallback=true`);
  });

  it('reports errors', async () => {
    const { client, server } = await anonymousClient();
    server.on('GET', '/image-resizer/image/x', 404, 'no image');
    await expect(client.picture('x', 1, 1)).rejects.toThrow('Failed to get picture (Status Code 404): no image');
  });
});

describe('searchVod', () => {
  const PATH = '/2.0/A/ENG/WEB_DASH/ALL/PAGE/SEARCH/VOD/REGISTERED/14';

  it('needs a location', async () => {
    await expect(bareClient().searchVod()).rejects.toThrow('location is not set');
    const { client } = await anonymousClient({}, { anonLocation: { resultObj: { userLocation: [] } } });
    await expect(client.searchVod()).rejects.toThrow('location is not set');
  });

  it('searches with the filters given, or none', async () => {
    const { client, server } = await anonymousClient();
    server.on('GET', PATH, 200, { resultObj: { containers: [] } }).on('GET', PATH, 200, { resultObj: { containers: [] } });
    await client.searchVod();
    expect(server.last(PATH).path).toBe(PATH);
    await client.searchVod({ filter_MeetingKey: '1300', filter_objectSubtype: 'Meeting' });
    expect(server.last(PATH).path).toBe(`${PATH}?filter_MeetingKey=1300&filter_objectSubtype=Meeting`);
  });

  it('reports errors', async () => {
    const { client, server } = await anonymousClient();
    server.on('GET', PATH, 502, 'gateway');
    await expect(client.searchVod()).rejects.toThrow('Failed to search VOD (Status Code 502): gateway');
  });
});
