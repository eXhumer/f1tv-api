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
import { APIResult, DecodedAscendonToken, LocationResult } from "./type";

export class F1TVClient {
  static BASE_URL = "https://f1tv.formula1.com";
  private ascendon?: string;
  readonly language: string;
  readonly platform: string;

  constructor(ascendon?: string, language: string = "ENG", platform: string = "WEB_DASH") {
    if (ascendon)
      try {
        this.ascendon = ascendon;
        this.decodedAscendon();
      } catch (e) {
        if (e instanceof InvalidTokenError)
          throw new Error("Invalid Ascendon token");

        else
          throw e;
      }

    this.language = language;
    this.platform = platform;
  }

  public decodedAscendon = () => {
    if (!this.ascendon)
      throw new Error("ascendon token is not set");

    return jwtDecode<DecodedAscendonToken>(this.ascendon);
  }

  public location = async () => {
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
      throw new Error(`Failed to get location: ${res.statusText}`);
  
    return await res.json() as APIResult<LocationResult>;
  }

  public loginStatus = () => {
    return this.ascendon === undefined ? "A" : "R";
  }

  public setAscendon = (ascendon: string) => {
    try {
      this.ascendon = ascendon;
      this.decodedAscendon();
    } catch (e) {
      if (e instanceof InvalidTokenError)
        throw new Error("Invalid Ascendon token");

      else
        throw e;
    }
  }
}
