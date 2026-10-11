/*
  f1tv-api - Unofficial F1TV API client for JavaScript/TypeScript
  Copyright (C) 2024-2026  eXhumer

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';

import { Dispatcher, getGlobalDispatcher, request } from 'undici';

import { buildDeviceInfo, type F1TVDeviceInfo } from './device-info';
import { F1TV, DecodedAscendonToken } from './type';
import { name, repository, version } from '../package.json';

type RequestOptions = Omit<Dispatcher.RequestOptions, "origin" | "path" | "method"> & Partial<Pick<Dispatcher.RequestOptions, "method">>;

const F1TV_JWKS = createRemoteJWKSet(new URL('https://api.formula1.com/static/jwks.json'));

export const verifyF1TVSubscriptionToken = async (subscriptionToken: string): Promise<DecodedAscendonToken> => {
  if (typeof subscriptionToken !== 'string' || subscriptionToken.length === 0)
    throw new Error('subscriptionToken provided is not a valid JWT token!');

  if (!decodeProtectedHeader(subscriptionToken).kid)
    throw new Error('KID not available in subscriptionToken header!');

  const { payload } = await jwtVerify<DecodedAscendonToken>(subscriptionToken, F1TV_JWKS);

  return payload;
};

export type F1TVClientOptions = {
  ascendon?: string | null;
  language?: F1TV.Language;
  platform?: F1TV.Platform;
  dispatcher?: Dispatcher;
  userAgent?: string;
  /**
   * Values for the `x-f1-device-info` header sent with contentPlay(), actionPlay() and
   * contentUserSelections(). `multiView` defaults to
   * `true` and is only sent as `true` for OPS, VIP or PREMIUM locations.
   */
  deviceInfo?: F1TVDeviceInfo;
};

export class F1TVClient {
  static BASE_URL = 'https://f1tv.formula1.com';
  static IMAGE_RESIZER_URL = 'https://f1tv.formula1.com/image-resizer/image';
  readonly language: F1TV.Language;
  readonly platform: F1TV.Platform;
  private _ascendon: string | null = null;
  private _decodedAscendon: DecodedAscendonToken | null = null;
  private _deviceInfo: F1TVDeviceInfo | null;
  private _config!: F1TV.Config;
  private _dispatcher: Dispatcher;
  private _entitlement: string | null = null;
  private _location!: F1TV.LocationResult;
  private _playApiVersion: string | null = null;
  private _videoApiVersion: string | null = null;
  // Bumped by every login() and logout() so a slower, older call can't overwrite newer state.
  private _session = 0;
  private _user_agent: string;

  private constructor({
    language = F1TV.Language.ENGLISH,
    platform = F1TV.Platform.WEB_DASH,
    dispatcher = getGlobalDispatcher(),
    userAgent = `${name}/${version} (${repository.url})`,
    deviceInfo,
  }: F1TVClientOptions) {
    this._deviceInfo = deviceInfo ?? null;
    this._dispatcher = dispatcher;
    this._user_agent = userAgent;

    this.language = language;
    this.platform = platform;
  }

  /**
   * Creates a client with config and location loaded. If `ascendon` is given, also logs in and
   * rejects if the token is invalid.
   */
  static async create(options: F1TVClientOptions = {}) {
    const client = new F1TVClient(options);

    await Promise.all([client.refreshConfig(), client.refreshLocation()]);

    if (options.ascendon)
      await client.login(options.ascendon);

    return client;
  }

  /**
   * Saves the resume position for VOD content (`POST /1.0/R/…/ACTION/PLAY`). `playHeadPosition` is
   * in seconds and is rounded. The web app reports it on pause, seek, stop, errors, at 25/50/75/90%
   * and every `config.bitmovin.playProgressCapture.interval` ms, but never for live streams and only
   * when the position is above `playProgressCapture.minResumeSeconds`.
   */
  public actionPlay = async (contentId: number, playHeadPosition: number, contentSubType: string) => {
    if (!this._ascendon || !this._entitlement)
      throw new Error('ascendon token or entitlement token is not set, unable to report play position');

    const actionPlayUrl = [
      F1TVClient.BASE_URL,
      '1.0',
      'R',
      this.language,
      this.platform,
      'ALL/ACTION/PLAY',
    ].join('/');

    const headers: Record<string, string> = {
      ascendontoken: this._ascendon,
      entitlementtoken: this._entitlement,
      'content-type': 'application/json',
    };
    const deviceInfo = this.getDeviceInfo();

    if (deviceInfo)
      headers['x-f1-device-info'] = deviceInfo;

    const res = await this.requestUA(actionPlayUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ contentId, playHeadPosition: Math.round(playHeadPosition), contentSubType }),
    });

    if (res.statusCode >= 400)
      throw new Error(`Failed to report play position (Status Code ${res.statusCode}): ${await res.body.text()}`);

    return await res.body.json() as F1TV.ActionPlayAPIResult;
  };

  public get ascendon() {
    return this._ascendon;
  }

  public get config() {
    return this._config;
  }

  public get decodedAscendon() {
    return this._decodedAscendon;
  }

  public get entitlement() {
    return this._entitlement;
  }

  public get location() {
    return this._location;
  }

  /** Uses the play API version from the cached config. The result shape depends on `player`. */
  public contentPlay = async <P extends F1TV.Player>(contentId: number, player: P, channelId?: number, platform?: F1TV.Platform) => {
    if (!this._ascendon || !this._entitlement)
      throw new Error('ascendon token or entitlement token is not set, unable to play content');

    if (!this._playApiVersion)
      throw new Error('play API version is not available from config');
  
    let contentPlayUrl = [
      F1TVClient.BASE_URL,
      this._playApiVersion,
      this.loginStatus(),
      this.language,
      platform || this.platform,
      'ALL/CONTENT/PLAY',
    ].join('/');

    const params: {
      contentId: string;
      channelId?: string;
      player: F1TV.Player;
    } = { contentId: contentId.toString(), player };
    if (channelId)
      params.channelId = channelId.toString();

    contentPlayUrl += '?' + new URLSearchParams(params).toString();

    const headers: Record<string, string> = { ascendontoken: this._ascendon, entitlementtoken: this._entitlement };
    const deviceInfo = this.getDeviceInfo();

    if (deviceInfo)
      headers['x-f1-device-info'] = deviceInfo;

    const res = await this.requestUA(contentPlayUrl, { headers });

    if (res.statusCode >= 400)
      throw new Error(`Failed to play content (Status Code ${res.statusCode}): ${await res.body.text()}`);

    return await res.body.json() as F1TV.ContentPlayAPIResult<P>;
  };

  /**
   * Gets the saved resume position and My List state (`POST /2.0/R/…/CONTENT/USERSELECTIONS`), keyed by
   * content ID. `duration` is the content's `metadata.duration` in seconds. The web app sends this
   * request (the `personalisation` part of the VIDEO result) when a video page opens, and resumes from
   * `user.resume.playHeadPosition`.
   */
  public contentUserSelections = async (contents: { contentId: number; duration: number }[]) => {
    if (!this._entitlement)
      throw new Error('entitlement token is not set, unable to get user selections');

    if (!this._location || this._location.userLocation.length === 0)
      throw new Error('location is not set');

    const userLocation = this._location.userLocation[0];

    const userSelectionsUrl = [
      F1TVClient.BASE_URL,
      '2.0',
      'R',
      this.language,
      this.platform,
      'ALL/CONTENT/USERSELECTIONS',
      userLocation.entitlement,
      userLocation.groupId.toString(),
    ].join('/');

    const headers: Record<string, string> = {
      entitlementtoken: this._entitlement,
      'content-type': 'text/plain;charset=UTF-8',
    };
    const deviceInfo = this.getDeviceInfo();

    if (deviceInfo)
      headers['x-f1-device-info'] = deviceInfo;

    const body = Object.fromEntries(contents.map(({ contentId, duration }) => [contentId, { duration }]));

    const res = await this.requestUA(userSelectionsUrl, { method: 'POST', headers, body: JSON.stringify(body) });

    if (res.statusCode >= 400)
      throw new Error(`Failed to get user selections (Status Code ${res.statusCode}): ${await res.body.text()}`);

    return await res.body.json() as F1TV.ContentUserSelectionsAPIResult;
  };

  /**
   * Uses the video API version from the cached config. Returns the first container if F1TV returns
   * more than one.
   */
  public contentVideo = async (contentId: number) => {
    if (!this._location || this._location.userLocation.length === 0)
      throw new Error('location is not set');

    if (!this._videoApiVersion)
      throw new Error('video API version is not available from config');

    const userLocation = this._location.userLocation[0];

    let contentVideoUrl = [
      F1TVClient.BASE_URL,
      this._videoApiVersion,
      this.loginStatus(),
      this.language,
      this.platform,
      'ALL/CONTENT/VIDEO',
      contentId.toString(),
      userLocation.entitlement,
      userLocation.groupId.toString(),
    ].join('/');

    let headers: { entitlementtoken?: string } = {};

    if (this._entitlement)
      headers.entitlementtoken = this._entitlement;
      
    const res = await this.requestUA(contentVideoUrl, { headers });

    if (res.statusCode >= 400)
      throw new Error(`Failed to get video content (Status Code ${res.statusCode}): ${await res.body.text()}`);

    const { resultObj } = await res.body.json() as F1TV.ContentVideoAPIResult;

    if (resultObj.containers.length === 0)
      throw new Error('No containers found');

    return resultObj.containers[0];
  };

  public liveNow = async () => {
    if (!this._location || this._location.userLocation.length === 0)
      throw new Error('location is not set');

    const userLocation = this._location.userLocation[0];

    let liveNowUrl = [
      F1TVClient.BASE_URL,
      '1.0',
      this.loginStatus(),
      this.language,
      this.platform,
      'ALL/EVENTS/LIVENOW',
      userLocation.entitlement,
      userLocation.groupId.toString(),
    ].join('/');

    const res = await this.requestUA(liveNowUrl);

    if (res.statusCode >= 400)
      throw new Error(`Failed to get live now (Status Code ${res.statusCode}): ${await res.body.text()}`);

    return await res.body.json() as F1TV.LiveNowAPIResult;
  };

  /**
   * Verifies the ascendon token, fetches its entitlement and refreshes location. On failure the
   * client keeps its previous state. Rejects if a later login() or logout() was called meanwhile.
   */
  public login = async (ascendon: string) => {
    const session = ++this._session;

    const decodedAscendon = await verifyF1TVSubscriptionToken(ascendon);
    const entitlement = await this.fetchEntitlement(ascendon);

    if (session !== this._session)
      throw new Error('login superseded by a later login() or logout()');

    this._ascendon = ascendon;
    this._decodedAscendon = decodedAscendon;
    this._entitlement = entitlement;

    await this.refreshLocation();

    return decodedAscendon;
  };

  /** Clears the ascendon token and entitlement, then refreshes location as anonymous. */
  public logout = async () => {
    this._session++;
    this._ascendon = null;
    this._decodedAscendon = null;
    this._entitlement = null;

    await this.refreshLocation();
  };

  /**
   * Builds the `x-f1-device-info` header value from the `deviceInfo` option, or returns null if it
   * wasn't given. Like the web app, `p` (multiview) is only `true` when the current location
   * entitlement is OPS, VIP or PREMIUM, and never on Safari.
   */
  public getDeviceInfo = () => {
    if (!this._deviceInfo)
      return null;

    const entitlement = this._location?.userLocation[0]?.entitlement ?? '';
    const multiView = (this._deviceInfo.multiView ?? true)
      && ['OPS', 'VIP', 'PREMIUM'].includes(entitlement)
      && this._deviceInfo.browser.toLowerCase() !== 'safari';

    return buildDeviceInfo({ ...this._deviceInfo, multiView });
  };

  public loginStatus = () => {
    return this._ascendon === null ? 'A' : 'R';
  }

  /** `variant` picks the web app's crops, for example `/{slug}/landscape_web`. */
  public picture = async (slug: string, width: number, height: number, q?: 'HI', o?: 'L', fallback?: 'true', variant?: F1TV.PictureVariant) => {
    let pictureUrl = `${F1TVClient.IMAGE_RESIZER_URL}/${slug}`;

    if (variant)
      pictureUrl += `/${variant}`;

    const pictureParams = new URLSearchParams({ w: width.toString(), h: height.toString() });

    if (q)
      pictureParams.append('q', q);

    if (o)
      pictureParams.append('o', o);

    if (fallback)
      pictureParams.append('fallback', fallback);

    pictureUrl += '?' + pictureParams.toString();

    const res = await this.requestUA(pictureUrl);

    if (res.statusCode >= 400)
      throw new Error(`Failed to get picture (Status Code ${res.statusCode}): ${await res.body.text()}`);

    return await res.body.blob();
  };

  public refreshConfig = async () => {
    const res = await this.requestUA(`${F1TVClient.BASE_URL}/config`);

    if (res.statusCode >= 400)
      throw new Error(`Failed to get config (Status Code ${res.statusCode}): ${await res.body.text()}`);

    const config = await res.body.json() as F1TV.Config;

    this._config = config;
    this._playApiVersion = F1TVClient.parseApiVersion(config.apiConfig?.playAPIVersion);
    this._videoApiVersion = F1TVClient.parseApiVersion(config.apiConfig?.videoAPIVersion);

    return config;
  };

  public refreshEntitlement = async () => {
    if (!this._ascendon)
      throw new Error('ascendon token is not set');

    const session = this._session;
    const entitlement = await this.fetchEntitlement(this._ascendon);

    if (session === this._session)
      this._entitlement = entitlement;

    return entitlement;
  };

  public refreshLocation = async () => {
    const session = this._session;

    const locationUrl = [
      F1TVClient.BASE_URL,
      '1.0',
      this.loginStatus(),
      this.language,
      this.platform,
      'ALL/USER/LOCATION',
    ].join('/');

    const res = await this.requestUA(locationUrl, { headers: this._entitlement ? { entitlementtoken: this._entitlement } : undefined });

    if (res.statusCode >= 400)
      throw new Error(`Failed to get location (Status Code ${res.statusCode}): ${await res.body.text()}`);

    const { resultObj } = await res.body.json() as F1TV.LocationAPIResult;

    if (session === this._session)
      this._location = resultObj;

    return resultObj;
  };

  /** Returns an API version such as `3.0` as used in URL paths, or null if it isn't one. */
  private static parseApiVersion(version: unknown) {
    return typeof version === 'string' && /^\d+\.\d+$/.test(version.trim()) ? version.trim() : null;
  }

  private fetchEntitlement = async (ascendon: string) => {
    const entitlementUrl = [
      F1TVClient.BASE_URL,
      '2.0',
      'R',
      this.language,
      this.platform,
      'ALL/USER/ENTITLEMENT',
    ].join('/');

    const res = await this.requestUA(entitlementUrl, { headers: { ascendontoken: ascendon } });

    if (res.statusCode >= 400)
      throw new Error(`Failed to get entitlement (Status Code ${res.statusCode}): ${await res.body.text()}`);

    const { resultObj } = await res.body.json() as F1TV.EntitlementAPIResult;

    return resultObj.entitlementToken;
  };

  private requestUA = (url: string, opts: RequestOptions = {}) => {
    return request(url, {
      ...opts,
      dispatcher: this._dispatcher,
      headers: {
        'User-Agent': this._user_agent,
        ...opts.headers,
      },
    });
  };

  public searchVod = async (params?: F1TV.SearchVodParams) => {
    if (!this._location || this._location.userLocation.length === 0)
      throw new Error('location is not set');

    const currentUserLocation = this._location.userLocation[0];

    let searchVodUrl = [
      F1TVClient.BASE_URL,
      '2.0',
      this.loginStatus(),
      this.language,
      this.platform,
      'ALL/PAGE/SEARCH/VOD',
      currentUserLocation.entitlement,
      currentUserLocation.groupId.toString(),
    ].join('/');

    if (params)
      searchVodUrl += '?' + new URLSearchParams(params).toString();

    const res = await this.requestUA(searchVodUrl);

    if (res.statusCode >= 400)
      throw new Error(`Failed to search VOD (Status Code ${res.statusCode}): ${await res.body.text()}`);

    return await res.body.json() as F1TV.SearchVodAPIResult;
  };
}
