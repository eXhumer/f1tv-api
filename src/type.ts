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

export type APIResult<T> = {
  resultCode: string;
  message: string;
  errorDescription: string;
  resultObj: T;
  systemTime: number;
};

export type DecodedAscendonToken = {
  ExternalAuthorizationsContextData: string;
  SubscriptionStatus: string;
  SubscriberId: string;
  FirstName: string;
  ents: {
    country: string;
    ent: string;
  }[];
  LastName: string;
  exp: number;
  SessionId: string;
  iat: number;
  SubscribedProduct: string;
  jti: string;
};

export type LocationResult = {
  userLocation: {
    detectedCountryIsoCode: string;
    registeredCountryIsoCode: string;
    detectedCountryIsoCodeAlpha3: string;
    registeredCountryIsoCodeAlpha3: string;
    groupId: number;
    entitlement: string;
  }[];
  countries: any[];
};
