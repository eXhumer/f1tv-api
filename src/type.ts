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

export type Config = {
  apiConfig: {
    proto: string;
    domain: string;
    prefix: string;
    version: string;
    channel: string;
    playAPIVersion: string;
    videoAPIVersion: string;
  };
  appIsoCode: string;
  bitmovin: {
    playbackOffsets: {
      wif: {
        obc: number;
        other: number;
      };
      obc: {
        wif: number;
        other: number;
      };
      other: {
        wif: number;
        obc: number;
      };
    };
    bitmovinKeys: {
      player: string;
      analytics: string;
    };
    chromecast: {
      receiverApplicationId: string;
      messageNamespace: string;
      customPlayApiHeaders: {};
    };
    emptyManifestsManagement: boolean;
    playProgressCapture: {
      enabled: boolean;
      interval: number;
      minResumeSeconds: number;
    };
    buffer: {
      video: {
        forwardduration: number;
        backwardduration: number;
      };
      audio: {
        forwardduration: number;
        backwardduration: number;
      };
    };
    drm: {
      certUrl: string;
    };
    watchLiveOverlay: boolean
    httpRequestRetriesOverride: {
      enabled: boolean;
      config: {
        reqLimit: number;
        reqTimeout: number;
        httpReqAttempts: number;
      };
    };
    limitMaxBitrateByPlayerResolution: boolean;
  };
  newRelic: {
    licenseKey: string;
    applicationId: string;
    accountId: string;
  };
  ENABLE_ASCENDON_PANIC_MODE: boolean;
  env: string;
  debugEnabled: boolean;
  appLanguage: string;
  betaPagePassCheckUrl: string;
  authLinks: {
    login: string;
    subscribe: string;
    manageAccount: string;
    subscription: string;
    verify: string;
  };
  drConfig: {
    endpoint: string;
    redirectUrl: string;
    delay: number;
  };
  supportedLanguages: string[];
  groupIdVip: number;
  requestTimeout: number;
  ga: {
    gtmId: string;
  };
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  showStats: boolean;
  browsers: {
    allow: Record<string, string>;
    crawlers: string[];
  };
  imgCDNResize: string;
  imgCDNFlags: string;
  enableMonitoringHeaders: boolean;
  pageCacheTimeoutInSeconds: number;
  configCacheTimeoutInSeconds: number;
  subPriorityMap: Record<string, string>;
  robots: {
    enabled: boolean;
    allowRules: {
      userAgent: string;
      routes: string;
    };
    disallowRules: {
      userAgent: string;
      routes: string;
    };
  };
  meta: {
    ogtitle: string;
    ogdescription: string;
    ogsitename: string;
    keywords: string;
  };
  cmp: {
    enabled: boolean;
    domain: string;
    vendorIds: {
      bitmovinId: number;
      newRelicId: number;
      firebaseId: number;
    };
    accountId: number;
    privacyManagerModalId: number;
    propertyId: number;
    propertyHref: string;
    baseEndpoint: string;
  };
  emailVerification: {
    enabled: boolean;
    fallbackTime: number;
  };
  hintOverlay: {
    enabled: boolean;
    fallbackTime: number;
  };
  search: {
    enabled: boolean;
    minLength: number;
    maxLength: number;
  };
  liveNow: {
    enabled: boolean;
    bannerTimeoutSeconds: number;
  };
  UPNEXT: {
    enabled: boolean;
    apiVersion: string;
    pathVariable: string;
    inPlayerRailEnabled: boolean;
    autoPlayEnabled: boolean;
    autoPlaySeconds: number;
    vodAutoPlaySeconds: number;
    vodSecondsFromEnd: number
    secondsFromCoverageStarted: number;
  };
  myList: {
    enabled: boolean;
  };
  albTimeoutInSecs: number;
  timeAfterLivePlaybackStartsToKickUserOutMs: number;
  authentication: {
    domain: string;
    apiKey: string;
    distributionChannel: string;
    systemID: string;
    deviceType: number;
    url: {
      rendezvousRegisterDevice: string;
    };
    imperva: {
      enabled: boolean;
      challengeUrl: string;
    };
  };
  pinPairing: {
    enabled: boolean;
  };
  locationDefaults: {
    groupId: number;
    entitlement: string;
    userCountry: string;
  };
  version: string;
};

export type ContentPlayResult = {
  entitlementToken: string;
  url: string;
  streamType: 'DASH' | 'DASHWV' | 'HLS';
  drmType?: 'widevine';
  laURL?: string;
  drmToken?: string;
  channelId: number;
  settings: {
    upnext: {
      jitter: number;
    };
  };
};

export type ContentVideoContainer = {
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
      driverFirstName?: string;
      driverLastName?: string;
      constructorName?: string;
      teamName: string;
      type: 'additional' | 'obc';
      playbackUrl: string;
      driverImg: string;
      teamImg: string;
      hex?: string;
      channelId: number;
      title: string;
      reportingName: string;
      default: boolean;
      identifier: 'PRES' | 'WIF' | 'TRACKER' | 'DATA' | 'OBC';
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
};

export type ContentVideoResult = {
  personalisation: {
    url: string;
    httpMethod: string;
    body: string;
  };
  total: number;
  containers: ContentVideoContainer[];
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
  ENGLISH = 'ENG',
  DUTCH = 'NLD',
  PORTUGUESE = 'POR',
  SPANISH = 'SPA',
  GERMAN = 'DEU',
  FRENCH = 'FRA',
};

export type LiveNowResult = {
  pollingEnabled: {
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
  pollingLower: number;
  pollingUpper: number;
  items: {
    id: string;
    layout: string;
    actions: {
      key: string;
      uri: string;
      targetType: string;
      href: string;
    }[];
    containers: {
      categories: {
        externalPathIds: string[];
        startDate: number;
        categoryId: number;
        endDate: number;
        categoryPathIds: number[];
        orderId: number;
      }[];
      bundles: {
        bundleId: number;
        bundleType: string;
        bundleSubtype: string;
        isParent: boolean;
        orderId: number;
      }[];
    };
    platformVariants: {
      subtitlesLanguages: any[];
      audioLanguages: {
        audioLanguageName: string;
        audioId: string;
        isPreferred: boolean;
      }[];
      technicalPackages: {
        packageId: number;
        packageName: string;
        packageType: string;
      }[];
    }[];
    properties: {
      meeting_Number: number;
      sessionEndTime: number;
      series: string;
      lastUpdatedDate: number;
      lastIndexedDate: number;
      season_Meeting_Ordinal: number;
      meeting_Start_Date: number;
      meeting_End_Date: number;
      season: number;
      session_index: number;
      meetingSessionKey: number;
    }[];
    metadata: {
      emfAttributes: {
        VideoType: string;
        MeetingKey: string;
        MeetingSessionKey: string;
        Meeting_Name: string;
        Meeting_Number: string;
        Circuit_Short_Name: string;
        Meeting_Code: string;
        MeetingCountryKey: string;
        CircuitKey: string;
        Meeting_Location: string;
        Series: string;
        OBC: boolean;
        state: string;
        TimetableKey: string;
        SessionKey: string;
        SessionPeriod: string;
        Circuit_Official_Name: string;
        ActivityDescription: string;
        SeriesMeetingSessionIdentifier: string;
        sessionEndTime: string;
        Meeting_Start_Date: string;
        Meeting_End_Date: string;
        Track_Length: string;
        Scheduled_Lap_Count: string;
        Scheduled_Distance: string;
        Circuit_Location: string;
        Meeting_Sponsor: string;
        IsTestEvent: string;
        Season_Meeting_Ordinal: number;
        Championship_Meeting_Ordinal: string;
        session_index: number;
        Meeting_Official_Name: string;
        Meeting_Display_Date: string;
        PageID: number | null;
        sessionEndDate: number;
        sessionStartDate: number;
        Meeting_Country_Name: string;
        Global_Title: string;
        Global_Meeting_Country_Name: string;
        Global_Meeting_Name: string;
        Diplay_In_Schedule: boolean;
        ContentCategory: string;
        HeroMainTitleOverride: string;
      };
      longDescription: string;
      shortDescription: string;
      country: string;
      year: string;
      contractStartDate: number;
      episodeNumber: number;
      contractEndDate: number;
      externalId: string;
      availableAlso: Platform[];
      title: string;
      titleBrief: string;
      objectType: string;
      duration: number;
      genres: string[];
      contentSubtype: string;
      pcLevel: number;
      contentId: number;
      starRating: number;
      pictureUrl: string;
      contentType: string;
      language: string;
      season: number;
    };
    coverageStartTimestamp: number;
  }[];
};

export type LocationResult = {
  userLocation: {
    detectedCountryIsoCode: string;
    registeredCountryIsoCode: string;
    detectedCountryIsoCodeAlpha3: string;
    registeredCountryIsoCodeAlpha3: string;
    groupId: number;
    entitlement: string; // ANONYMOUS | REG | PRO | (VIP?) | (OPS?)
  }[];
  countries: any[];
};

export enum Platform {
  BIG_SCREEN_DASH = 'BIG_SCREEN_DASH',
  BIG_SCREEN_HLS = 'BIG_SCREEN_HLS',
  MOBILE_DASH = 'MOBILE_DASH',
  MOBILE_HLS = 'MOBILE_HLS',
  TABLET_DASH = 'TABLET_DASH',
  TABLET_HLS = 'TABLET_HLS',
  WEB_DASH = 'WEB_DASH',
  WEB_HLS = 'WEB_HLS',
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
  sortOrder?: 'asc' | 'desc';
};

export type SearchVodResult = {
  total: number;
  collectionName: string;
  searchResultTotal: number;
  containers: {
    id: string;
    layout: string;
    actions: {
      key: string;
      uri: string;
      targetType: string;
      href: string;
    }[];
    containers: {
      bundles: {
        bundleId: number;
        bundleType: string;
        bundleSubtype: string;
        isParent: boolean;
        orderId: number;
      }[];
    };
    platformVariants: {
      subtitlesLanguages: any[];
      audioLanguages: {
        audioLanguageName: string;
        audioId: string;
        isPreferred: boolean;
      }[];
      technicalPackages: {
        packageId: number;
        packageName: string;
        packageType: string;
      }[];
    }[];
    properties: {
      meeting_Number: number;
      sessionEndDate: number;
      series: string;
      lastUpdatedDate: number;
      lastIndexedDate: number;
      season_Meeting_Ordinal: number;
      meeting_Start_Date: number;
      meeting_End_Date: number;
      season: number;
      session_index: number;
      meetingSessionKey: number;
    }[];
    metadata: {
      emfAttributes: {
        VideoType: string;
        MeetingKey: string;
        MeetingSessionKey: string;
        Meeting_Name: string;
        Meeting_Number: string;
        Circuit_Short_Name: string;
        Meeting_Code: string;
        MeetingCountryKey: string;
        CircuitKey: string;
        Meeting_Location: string;
        Series: string;
        OBC: boolean;
        state: string;
        TimetableKey: string;
        SessionKey: string;
        SessionPeriod: string;
        Circuit_Official_Name: string;
        ActivityDescription: string;
        SeriesMeetingSessionIdentifier: string;
        sessionEndTime: string;
        Meeting_Start_Date: string;
        Meeting_End_Date: string;
        Track_Length: string;
        Scheduled_Lap_Count: string;
        Scheduled_Distance: string;
        Circuit_Location: string;
        Meeting_Sponsor: string;
        IsTestEvent: string;
        Season_Meeting_Ordinal: number;
        Championship_Meeting_Ordinal: string;
        session_index: number;
        Meeting_Official_Name: string;
        Meeting_Display_Date: string;
        PageID: number | null;
        sessionEndDate: number;
        sessionStartDate: number;
        Meeting_Country_Name: string;
        Global_Title: string;
        Global_Meeting_Country_Name: string;
        Global_Meeting_Name: string;
        Diplay_In_Schedule: boolean;
        ContentCategory: string;
        HeroMainTitleOverride: string;
      };
      longDescription: string;
      shortDescription: string;
      year: string;
      contractStartDate: number;
      contractEndDate: number;
      externalId: string;
      availableAlso: Platform[];
      title: string;
      titleBrief: string;
      objectType: string;
      duration: number;
      genres: string[];
      contentSubtype: string;
      pcLevel: number;
      contentId: number;
      starRating: number;
      pictureUrl: string;
      contentType: string;
      language: string;
      season: number;
      uiSeries: string;
    };
    uiMetadata: {
      mainTitle: string;
      subTitle: string;
    };
  }[];
};
