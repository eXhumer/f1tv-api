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
import {
  APIResult,
  Config,
  ContentPlayResult,
  ContentVideoResult,
  DecodedAscendonToken,
  EntitlementResult,
  Language,
  LiveNowResult,
  LocationResult,
  Platform,
  SearchVodParams,
  SearchVodResult,
} from './type';
import { TypedEventEmitter } from '@tiny-libs/typed-event-emitter'

type F1TVClientEvents = {
  locationReady: () => void;
};

export class F1TVClient extends TypedEventEmitter<F1TVClientEvents> {
  static BASE_URL = 'https://f1tv.formula1.com';
  static IMAGE_RESIZER_URL = 'https://f1tv.formula1.com/image-resizer/image';
  readonly language: string;
  readonly platform: string;
  private _ascendon: string | null = null;
  private _config: Config | null = null;
  private _entitlement: string | null = null;
  private _location: LocationResult | null = null;

  constructor(ascendon: string | null = null, language: Language = Language.ENGLISH, platform: Platform = Platform.WEB_DASH) {
    super();

    this.ascendon = ascendon;
    this.language = language;
    this.platform = platform;
  
    if (!ascendon)
      this.refreshLocation();

    this.refreshConfig();
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
    } catch (e) {
      if (e instanceof InvalidTokenError)
        throw new Error('Invalid Ascendon token');

      else
        throw e;
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

    const res = await fetch(contentPlayUrl, { headers: { ascendontoken: this._ascendon, entitlementtoken: this._entitlement } });

    if (!res.ok)
      throw new Error(`Failed to play content: ${res.statusText} ${JSON.stringify(await res.json())}`);

    return await res.json() as APIResult<ContentPlayResult>;
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
      
    const res = await fetch(contentVideoUrl, { headers });

    if (!res.ok)
      throw new Error(`Failed to get video content: ${res.statusText} ${JSON.stringify(await res.json())}`);

    const { resultObj } = await res.json() as APIResult<ContentVideoResult>;

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

    const res = await fetch(liveNowUrl);

    if (!res.ok)
      throw new Error(`Failed to get live now: ${res.statusText} ${JSON.stringify(await res.json())}`);

    return await res.json() as APIResult<LiveNowResult>;
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

    const res = await fetch(pictureUrl);

    if (!res.ok)
      throw new Error(`Failed to get picture: ${res.statusText} ${JSON.stringify(await res.json())}`);

    return await res.blob();
  };

  private refreshConfig = async () => {
    const res = await fetch(`${F1TVClient.BASE_URL}/config`);

    if (!res.ok)
      throw new Error(`Failed to get config: ${res.statusText} ${JSON.stringify(await res.json())}`);

    this._config = await res.json() as Config;
  };

  public refreshEntitlement = async () => {
    if (!this.ascendon)
      throw new Error('ascendon token is not set, unable to retrieve entitlement');

    let entitlementUrl = [
      F1TVClient.BASE_URL,
      '2.0',
      this.loginStatus(),
      this.language,
      this.platform,
      'ALL/USER/ENTITLEMENT',
    ].join('/');

    const res = await fetch(entitlementUrl, { headers: { ascendontoken: this.ascendon } });

    if (!res.ok)
      throw new Error(`Failed to get entitlement: ${res.statusText} ${JSON.stringify(await res.json())}`);
  
    const { resultObj } = await res.json() as APIResult<EntitlementResult>;

    this._entitlement = resultObj.entitlementToken;

    await this.refreshLocation();
  };

  public refreshLocation = async () => {
    const locationUrl = [
      F1TVClient.BASE_URL,
      '1.0',
      this.loginStatus(),
      this.language,
      this.platform,
      'ALL/USER/LOCATION',
    ].join('/');

    const res = await fetch(locationUrl, { headers: this._entitlement ? { entitlementtoken: this._entitlement } : undefined });

    if (!res.ok)
      throw new Error(`Failed to get location: ${res.statusText} ${JSON.stringify(await res.json())}`);

    const { resultObj } = await res.json() as APIResult<LocationResult>;
    const oldLocation = this._location;
    this._location = resultObj;

    if (!oldLocation)
      this.emit('locationReady');
  }

  public searchVod = async (params?: SearchVodParams) => {
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

    const res = await fetch(searchVodUrl);

    if (!res.ok)
      throw new Error(`Failed to search VOD: ${res.statusText} ${JSON.stringify(await res.json())}`);

    return await res.json() as APIResult<SearchVodResult>;
  };

  public whenLocationReady = async () => {
    if (this._location)
      return;

    return await new Promise<void>((resolve) => {
      this.once('locationReady', resolve);
    });
  };
}
