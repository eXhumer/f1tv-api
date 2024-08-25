/*
  f1tv-api - Unofficial F1TV API client for JavaScript/TypeScript
  Copyright (C) 2024  eXhumer

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

import { jwtDecode, InvalidTokenError } from 'jwt-decode';
import { F1TV, DecodedAscendonToken } from './type';
import { TypedEventEmitter } from '@tiny-libs/typed-event-emitter'
import { Dispatcher, getGlobalDispatcher, request } from 'undici';
import { name, repository, version } from '../package.json';

type RequestOptions = Omit<Dispatcher.RequestOptions, "origin" | "path" | "method"> & Partial<Pick<Dispatcher.RequestOptions, "method">>;

export class F1TVClient extends TypedEventEmitter<F1TV.ClientEvent> {
  static BASE_URL = 'https://f1tv.formula1.com';
  static IMAGE_RESIZER_URL = 'https://f1tv.formula1.com/image-resizer/image';
  readonly language: string;
  readonly platform: string;
  private _ascendon: string | null = null;
  private _config: F1TV.Config | null = null;
  private _dispatcher: Dispatcher;
  private _entitlement: string | null = null;
  private _location: F1TV.LocationResult | null = null;
  private _user_agent: string;

  constructor(ascendon: string | null = null,
              language: F1TV.Language = F1TV.Language.ENGLISH,
              platform: F1TV.Platform = F1TV.Platform.WEB_DASH,
              dispatcher: Dispatcher = getGlobalDispatcher(),
              user_agent = `${name}/${version} (${repository.url})`) {
    super();
    this._dispatcher = dispatcher;
    this._user_agent = user_agent;

    this.ascendon = ascendon;
    this.language = language;
    this.platform = platform;

    this.once('ascendonUpdated', () => {
      this.once('locationUpdated', () => {
        this.once('configUpdated', () => {
          this.emit('ready');
        });

        this.refreshConfig();
      });

      this.refreshLocation();
    });
  }

  public get ascendon() {
    return this._ascendon;
  }

  public set ascendon (ascendon: string | null) {
    try {
      this._ascendon = ascendon;
      this._entitlement = null;

      if (ascendon) {
        this.decodedAscendon;
        this.refreshEntitlement();
      }

      this.emit('ascendonUpdated');
    } catch (e) {
      this.emit('ascendonError',
        e instanceof InvalidTokenError ?
          Error('Invalid Ascendon token') :
          e as Error);
    }
  }

  public get config() {
    return this._config;
  }

  public get decodedAscendon() {
    if (!this._ascendon)
      throw new Error('ascendon token is not set');

    return jwtDecode<DecodedAscendonToken>(this._ascendon);
  }

  public get entitlement() {
    return this._entitlement;
  }

  public get location() {
    return this._location;
  }

  public contentPlay = async (contentId: number, channelId?: number) => {
    if (!this._ascendon || !this._entitlement)
      throw new Error('ascendon token or entitlement token is not set, unable to play content');
  
    let contentPlayUrl = [
      F1TVClient.BASE_URL,
      '2.0',
      this.loginStatus(),
      this.language,
      this.platform,
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
      throw new Error(`Failed to play content (Status Code ${res.statusCode}) ${await res.body.text()}`);

    return await res.body.json() as F1TV.ContentPlayAPIResult;
  };

  public contentVideo = async (contentId: number) => {
    if (!this._location || this._location.userLocation.length === 0)
      throw new Error('location is not set');

    if (!this._entitlement)
      console.warn('entitlement token is not set');

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
      throw new Error(`Failed to get video content (Status Code ${res.statusCode}):${await res.body.text()}`);

    const { resultObj } = await res.body.json() as F1TV.ContentVideoAPIResult;

    if (resultObj.containers.length === 0)
      throw new Error('No containers found');

    else if (resultObj.containers.length > 1)
      console.warn('Multiple containers found, returning the first one');

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
      throw new Error(`Failed to get live now (Status Code${res.statusCode}): ${await res.body.text()}`);

    return await res.body.json() as F1TV.LiveNowAPIResult;
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

  public refreshConfig = () => {
    this.requestUA(`${F1TVClient.BASE_URL}/config`)
      .then(async res => {
        if (res.statusCode >= 400)
          throw new Error(`Failed to get config (Status Code ${res.statusCode}): ${await res.body.text()}`);
    
        this._config = await res.body.json() as F1TV.Config;
    
        this.emit('configUpdated');
      })
      .catch(err => {
        this.emit('configError', err);
      });
  };

  public refreshEntitlement = () => {
    if (!this.ascendon)
      throw new Error('ascendon token is not set');

    let entitlementUrl = [
      F1TVClient.BASE_URL,
      '2.0',
      this.loginStatus(),
      this.language,
      this.platform,
      'ALL/USER/ENTITLEMENT',
    ].join('/');

    this.requestUA(entitlementUrl, { headers: { ascendontoken: this.ascendon } })
      .then(async res => {
        if (res.statusCode >= 400)
          throw new Error(`Failed to get entitlement (Status Code ${res.statusCode}): ${await res.body.text()}}`);
      
        const { resultObj } = await res.body.json() as F1TV.EntitlementAPIResult;
    
        this._entitlement = resultObj.entitlementToken;

        this.emit('entitlementUpdated');
      })
      .catch(err => {
        this.emit('entitlementError', err);
      });
  };

  public refreshLocation = () => {
    const locationUrl = [
      F1TVClient.BASE_URL,
      '1.0',
      this.loginStatus(),
      this.language,
      this.platform,
      'ALL/USER/LOCATION',
    ].join('/');

    this.requestUA(locationUrl, { headers: this._entitlement ? { entitlementtoken: this._entitlement } : undefined })
      .then(async res => {
        if (res.statusCode >= 400)
          throw new Error(`Failed to get location (Status Code ${res.statusCode}): ${await res.body.text()}`);

        const { resultObj } = await res.body.json() as F1TV.LocationAPIResult;
        this._location = resultObj;
        this.emit('locationUpdated');
      })
      .catch(err => {
        this.emit('locationError', err);
      });
  }

  private requestUA = (url: any, opts?: RequestOptions) => {
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers = {
      'User-Agent': this._user_agent,
      ...opts.headers,
    };

    return request(url, { dispatcher: this._dispatcher } && opts);
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
