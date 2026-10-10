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
};

export class F1TVClient {
  static BASE_URL = 'https://f1tv.formula1.com';
  static IMAGE_RESIZER_URL = 'https://f1tv.formula1.com/image-resizer/image';
  readonly language: F1TV.Language;
  readonly platform: F1TV.Platform;
  private _ascendon: string | null = null;
  private _decodedAscendon: DecodedAscendonToken | null = null;
  private _config!: F1TV.Config;
  private _dispatcher: Dispatcher;
  private _entitlement: string | null = null;
  private _location!: F1TV.LocationResult;
  // Bumped by every login() and logout() so a slower, older call can't overwrite newer state.
  private _session = 0;
  private _user_agent: string;

  private constructor({
    language = F1TV.Language.ENGLISH,
    platform = F1TV.Platform.WEB_DASH,
    dispatcher = getGlobalDispatcher(),
    userAgent = `${name}/${version} (${repository.url})`,
  }: F1TVClientOptions) {
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

  public contentPlay = async (contentId: number, channelId?: number, platform?: F1TV.Platform) => {
    if (!this._ascendon || !this._entitlement)
      throw new Error('ascendon token or entitlement token is not set, unable to play content');
  
    let contentPlayUrl = [
      F1TVClient.BASE_URL,
      '2.0',
      this.loginStatus(),
      this.language,
      platform || this.platform,
      'ALL/CONTENT/PLAY',
    ].join('/');

    const params: {
      contentId: string;
      channelId?: string;
    } = { contentId: contentId.toString() };
    if (channelId)
      params.channelId = channelId.toString();

    contentPlayUrl += '?' + new URLSearchParams(params).toString();

    const res = await this.requestUA(contentPlayUrl, { headers: { ascendontoken: this._ascendon, entitlementtoken: this._entitlement } });

    if (res.statusCode >= 400)
      throw new Error(`Failed to play content (Status Code ${res.statusCode}): ${await res.body.text()}`);

    return await res.body.json() as F1TV.ContentPlayAPIResult;
  };

  /** Returns the first container if F1TV returns more than one. */
  public contentVideo = async (contentId: number) => {
    if (!this._location || this._location.userLocation.length === 0)
      throw new Error('location is not set');

    const userLocation = this._location.userLocation[0];

    let contentVideoUrl = [
      F1TVClient.BASE_URL,
      '4.0',
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

  public loginStatus = () => {
    return this._ascendon === null ? 'A' : 'R';
  }

  public picture = async (slug: string, width: number, height: number, q?: 'HI', o?: 'L', fallback?: 'true') => {
    let pictureUrl = `${F1TVClient.IMAGE_RESIZER_URL}/${slug}`;

    const pictureParams = new URLSearchParams({ width: width.toString(), height: height.toString() });

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

    this._config = await res.body.json() as F1TV.Config;

    return this._config;
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
