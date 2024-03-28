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

import { jwtDecode, InvalidTokenError } from "jwt-decode";
import {
  APIResult,
  ContentPlayResult,
  ContentVideoResult,
  DecodedAscendonToken,
  EntitlementResult,
  Language,
  LocationResult,
  Platform,
} from "./type";
import { TypedEventEmitter } from '@tiny-libs/typed-event-emitter'

type F1TVClientEvents = {
  ascendonUpdated: (ascendon?: string) => void;
  entitlementUpdated: (entitlement?: string) => void;
  locationUpdated: (location: LocationResult) => void;
};

export class F1TVClient extends TypedEventEmitter<F1TVClientEvents> {
  static BASE_URL = "https://f1tv.formula1.com";
  private ascendon?: string;
  readonly language: string;
  readonly platform: string;
  private entitlement?: string;
  private location?: LocationResult;

  constructor(ascendon?: string, language: Language = Language.ENGLISH, platform: Platform = Platform.WEB_DASH) {
    super();

    this.ascendon = ascendon;

    if (ascendon) {
      try {
        this.decodedAscendon();
      } catch (e) {
        if (e instanceof InvalidTokenError)
          throw new Error("Invalid Ascendon token");

        else
          throw e;
      }
    }

    this.language = language;
    this.platform = platform;

    this.emit("ascendonUpdated", ascendon);
    
    this.refreshLocation()
      .then(() => {
        console.log("Location updated");
      });

    if (ascendon)
      this.refreshEntitlement()
        .then(() => {
          console.log("Entitlement updated");
        });
  }

  public contentPlay = async (contentId: number, channelId?: number) => {
    if (!this.ascendon || !this.entitlement)
      throw new Error("ascendon token or entitlement token is not set, unable to play content");
  
    let contentPlayUrl = [
      F1TVClient.BASE_URL,
      "2.0",
      this.loginStatus(),
      this.language,
      this.platform,
      "ALL/CONTENT/PLAY",
    ].join("/");

    const params: {
      contentId: string;
      channelId?: string;
    } = { contentId: contentId.toString() };
    if (channelId)
      params.channelId = channelId.toString();

    contentPlayUrl += "?" + new URLSearchParams(params).toString();

    const res = await fetch(contentPlayUrl, { headers: { ascendontoken: this.ascendon, entitlementtoken: this.entitlement } });

    if (!res.ok)
      throw new Error(`Failed to play content: ${res.statusText} ${JSON.stringify(await res.json())}`);

    return await res.json() as APIResult<ContentPlayResult>;
  };

  public contentVideo = async (contentId: number) => {
    if (!this.location || this.location.userLocation.length === 0)
      throw new Error("location is not set");

    if (!this.entitlement)
      console.warn("entitlement token is not set");

    const userLocation = this.location.userLocation[0];

    let contentVideoUrl = [
      F1TVClient.BASE_URL,
      "4.0",
      this.loginStatus(),
      this.language,
      this.platform,
      "ALL/CONTENT/VIDEO",
      contentId.toString(),
      userLocation.entitlement,
      userLocation.groupId.toString(),
    ].join("/");

    let headers: { entitlementtoken?: string } = {};

    if (this.entitlement)
      headers.entitlementtoken = this.entitlement;
      
    const res = await fetch(contentVideoUrl, { headers });

    if (!res.ok)
      throw new Error(`Failed to get video content: ${res.statusText} ${JSON.stringify(await res.json())}`);

    return await res.json() as APIResult<ContentVideoResult>;
  };

  public decodedAscendon = () => {
    if (!this.ascendon)
      throw new Error("ascendon token is not set");

    return jwtDecode<DecodedAscendonToken>(this.ascendon);
  }

  public refreshEntitlement = async () => {
    if (!this.ascendon)
      throw new Error("ascendon token is not set, unable to retrieve entitlement");

    let entitlementUrl = [
      F1TVClient.BASE_URL,
      "2.0",
      this.loginStatus(),
      this.language,
      this.platform,
      "ALL/USER/ENTITLEMENT",
    ].join("/");

    const res = await fetch(entitlementUrl, { headers: { ascendontoken: this.ascendon } });

    if (!res.ok)
      throw new Error(`Failed to get entitlement: ${res.statusText} ${JSON.stringify(await res.json())}`);
  
    const { resultObj } = await res.json() as APIResult<EntitlementResult>;

    this.entitlement = resultObj.entitlementToken;

    this.emit("entitlementUpdated", this.entitlement);
  };

  public refreshLocation = async () => {
    let locationUrl = [
      F1TVClient.BASE_URL,
      "1.0",
      this.loginStatus(),
      this.language,
      this.platform,
      "ALL/USER/LOCATION",
    ].join("/");

    if (this.ascendon)
      locationUrl += "?" + new URLSearchParams({ homeCountry: this.decodedAscendon().ExternalAuthorizationsContextData }).toString()

    const res = await fetch(locationUrl);

    if (!res.ok)
      throw new Error(`Failed to get location: ${res.statusText} ${JSON.stringify(await res.json())}`);
  
    const { resultObj } = await res.json() as APIResult<LocationResult>;

    this.emit("locationUpdated", resultObj)
  }

  public loginStatus = () => {
    return this.ascendon === undefined ? "A" : "R";
  }

  public setAscendon = (ascendon?: string) => {
    try {
      this.ascendon = ascendon;
      this.entitlement = undefined;
      
      if (ascendon)
        this.decodedAscendon();

      this.emit("ascendonUpdated", ascendon);

      if (ascendon) {
        this.refreshEntitlement()
          .then(() => {
            console.log("Entitlement updated");
          });
      } else {
        this.emit("entitlementUpdated", this.entitlement);
      }

    } catch (e) {
      if (e instanceof InvalidTokenError)
        throw new Error("Invalid Ascendon token");

      else
        throw e;
    }
  }
}
