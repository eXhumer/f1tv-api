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

export type ContentPlayResult = {
  entitlementToken: string;
  url: string;
  streamType: string;
  channelId: number;
  settings: {
    upnext: {
      jitter: number;
    };
  };
};

export type ContentVideoResult = {
  personalisation: {
    url: string;
    httpMethod: string;
    body: string;
  };
  total: number;
  containers: {
    metadata: {
      longDescription: string;
      country: string;
      year: string;
      emfAttributes: {
        sessionEndTime: string;
        video: string;
        multipartEventIndex: string;
        session_index: string;
        captions: string;
        MeetingSessionKey: string;
        multipartEvent: string;
        multipartEventNextHouseId: string;
        sessionStartDate: string;
        VideoType: string;
        OBC: boolean;
        multipartEventMainMSK: string;
        MeetingCountryKey: string;
        Meeting_Country_Name: string;
        multipartEventTotal: string;
        Diplay_In_Schedule: string;
        Global_Title: string;
        state: string;
        Circuit_Short_Name: string;
        Meeting_Name: string;
        Meeting_Number: string;
        multipartEventMainHouseId: string;
        Global_Meeting_Name: string;
        CircuitKey: string;
        Global_Meeting_Country_Name: string;
        MeetingKey: string;
        Series: string;
        Meeting_Location: string;
        bug: string;
        ContentCategory: string;
        sessionEndDate: string;
        Meeting_Code: string;
      };
      isADVAllowed: boolean;
      contentId: number;
      title: string;
      episodeNumber: number;
      objectType: string;
      duration: number;
      contentProvider: string;
      isLatest: boolean;
      genres: string[];
      isOnAir: boolean;
      isEncrypted: boolean;
      objectSubtype: string;
      metadataLanguage: string;
      season: number;
      pcLevelVod: string;
      isParent: boolean
      contractStartDate: number;
      pictureUrl: string
      availableLanguages: {
        languageCode: string;
        languageName: string;
      }[];
      contractEndDate: number;
      externalId: string;
      advTags: string;
      shortDescription: string;
      leavingSoon: boolean;
      availableAlso: string[];
      pcVodLabel: string;
      isGeoBlocked: boolean;
      filter: string;
      titleBrief: string;
      comingSoon: boolean;
      isPopularEpisode: boolean;
      primaryCategoryId: number;
      uiDuration: string;
      meetingKey: string;
      entitlement: string;
      locked: boolean;
      videoType: string;
      parentalAdvisory: string;
      contentSubtype: string;
      contentType: string;
      additionalStreams?: {
        racingNumber: number;
        teamName: string;
        type: string;
        playbackUrl: string;
        driverImg: string;
        teamImg: string;
        channelId: number;
        title: string;
        reportingName: string;
        default: boolean;
        identifier: string;
      }[];
    };
    platformVariants: {
      audioLanguages: {
        audioLanguageName: string;
        audioId: string;
        isPreferred: boolean;
      }[];
      cpId: string;
      videoType: string;
      pictureUrl: string;
      technicalPackages: {
        packageId: number;
        packageName: string;
        packageType: string;
      }[];
      trailerUrl: string;
      hasTrailer: boolean;
    }[];
    popularity: {
      shortPeriod: number;
      longPeriod: number;
      allTime: number;
    };
    contentId: number;
    containers: {
      bundles: {
        bundleSubtype: string;
        isParent: boolean;
        orderId: number;
        bundleId: number;
        bundleType: string;
      }[];
      categories: {
        categoryPathIds: number[];
        externalPathIds: string[];
        endDate: number;
        orderId: number;
        isPrimary: boolean;
        categoryName: string;
        categoryId: number;
        startDate: number;
      }[];
    }[];
    suggest: {
      input: string[];
      payload: {
        objectSubtype: string;
        contentId: string;
        title: string;
        objectType: string;
      };
    };
    platformName: string;
    properties: {
      sessionStartDate: number;
      meeting_Start_Date: number;
      lastUpdatedDate: number;
      season_Meeting_Ordinal: number;
      series: string;
      sessionEndTime: number;
      meeting_Number: number;
      season: number;
      lastIndexedDate: number;
      meeting_End_Date: number;
      session_index: number;
      sessionEndDate: number;
    }[];
    id: number;
    layout: string;
    liveNow: {
      enabled: {
        AMAZONFIRE: boolean;
        AMAZONFIRETV: boolean;
        ANDROID: boolean;
        ANDROIDTV: boolean;
        IOS: boolean;
        ROKU: boolean;
        SAMSUNG: boolean;
        TVOS: boolean;
        WEB: boolean;
      };
      url: string;
    };
  }[];
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

export type EntitlementResult = {
  entitlementToken: string;
};

export enum Language {
  ENGLISH = "ENG",
  DUTCH = "NLD",
  PORTUGUESE = "POR",
  SPANISH = "SPA",
  GERMAN = "DEU",
  FRENCH = "FRA",
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

export enum Platform {
  BIG_SCREEN_DASH = "BIG_SCREEN_DASH",
  BIG_SCREEN_HLS = "BIG_SCREEN_HLS",
  MOBILE_DASH = "MOBILE_DASH",
  MOBILE_HLS = "MOBILE_HLS",
  TABLET_DASH = "TABLET_DASH",
  TABLET_HLS = "TABLET_HLS",
  WEB_DASH = "WEB_DASH",
  WEB_HLS = "WEB_HLS",
};

export type SearchVodParams = {
  filter_genres?: string;
  filter_MeetingKey?: string;
  filter_objectSubtype?: string;
  filter_orderByFom?: string;
  filter_season?: string;
  filter_year?: string;
  maxResults?: string;
  orderBy?: string;
  sortOrder?: "asc" | "desc";
};
