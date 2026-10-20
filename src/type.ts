import type { JWTPayload } from 'jose';

export namespace F1TV {
  export type ActionPlayAPIResult = {
    resultCode: string;
  };

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
    appBanner: {
      enabled: boolean;
      hideAfterDismissPeriodMinutes: number;
    };
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
      enableMediaKeySystemConfig: boolean;
    };
    player: {
      tm: {
        license: string;
        driver20ItemGridEnabled: boolean;
        chromecastEnabled: boolean;
      };
    };
    newRelic: {
      licenseKey: string;
      applicationID: string;
      accountID: string;
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
      cancelSubscription: string;
    };
    enableCancelSubscriptionFooterCTA: boolean;
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
      imageURLs: {
        unsupportedBrowser: string;
      };
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
        bitmovinId: string;
        newRelicId: string;
        firebaseId: string;
        abTastyId: string;
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
      groupId: string;
      entitlement: string;
      userCountry: string;
    };
    registeredCountryTargetedPopUp: {
      enabled: boolean;
      registeredCountries: string[];
      stateChangeDate: string;
      supportPage: string;
    };
    accessibilityStatement: {
      enabled: boolean;
    };
    abTasty: {
      accountID: string;
    };
    appLogLevel: string;
    syndications: {
      apple: ConfigSyndication;
      fancode: ConfigSyndication;
    };
    version: string;
  };

  export type ConfigSyndication = {
    enabled: boolean;
    syndicationJourneyURL: string;
    territories: string[];
  };

  export type ContentPlayAPIResult<P extends Player = Player> = APIResult<ContentPlayResult<P>>;

  /** Result shape for each player: `player_bm` (Bitmovin) or `player_tm` (Tiled Media). */
  export type ContentPlayResult<P extends Player = Player> = {
    player_bm: ContentPlayBitmovinResult;
    player_tm: ContentPlayTiledMediaResult;
  }[P];

  export type ContentPlayBaseResult = {
    entitlementToken: string;
    streamType: StreamType;
    /** Only set for DRM streams. */
    drmType?: 'widevine';
    /** Widevine license URL (POST with the ascendontoken and entitlementtoken headers). */
    laURL?: string;
    channelId: number;
    pipelineVersion: number;
    playApiVersion: string;
    cdnType: string;
    settings: {
      upnext: {
        jitter: number;
      };
    };
  };

  export type ContentPlayBitmovinResult = ContentPlayBaseResult & {
    url: string;
  };

  export type ContentPlayTiledMediaResult = ContentPlayBaseResult & {
    tme: {
      version: number;
      /** `MULTI` when the response carries every feed of the content. */
      channel?: string;
      metadata: {
        content_id: number;
      };
      advanced?: {
        tile_size: {
          width: number;
          height: number;
        };
      };
      feeds: {
        url: string;
        uuid?: string;
        encoder_id?: string;
        optionality?: string;
        metadata: {
          channel_id: number;
          racing_number?: number;
        };
        audio_track_names?: Record<string, string>;
        subtitle_track_names?: Record<string, string>;
      }[];
    };
  };

  /** Unlike other endpoints, this response has no `systemTime`. */
  export type ContentUserSelectionsAPIResult = Omit<APIResult<ContentUserSelectionsResult>, 'systemTime'>;

  /** Keyed by content ID. */
  export type ContentUserSelectionsResult = Record<string, {
    user: {
      selections: {
        myList: {
          selected: boolean;
        };
      };
      resume: {
        contentId: number;
        /** Seconds; 0 when there's nothing to resume. */
        playHeadPosition: number;
        /** Unix time in seconds, 0 when never played. */
        timestamp: number;
        deviceType: string;
      };
    };
  }>;

  export type ContentVideoAPIResult = APIResult<ContentVideoResult> & {
    source: string;
  };

  export type ContentVideoAudioLanguage = {
    audioLanguageName: string;
    audioId: number;
    isPreferred: boolean;
  };

  export type ContentVideoStreamIdentifier = 'PRES' | 'WIF' | 'TRACKER' | 'DATA' | 'OBC';

  export type ContentVideoContainer = {
    metadata: {
      longDescription: string;
      country: string;
      year: string;
      emfAttributes: {
        sessionEndTime: string;
        multipartEventIndex?: string;
        session_index: string;
        MeetingSessionKey: string;
        multipartEvent?: string;
        multipartEventNextHouseId?: string;
        sessionStartDate: string;
        VideoType?: string;
        OBC: boolean;
        multipartEventMainMSK?: string;
        MeetingCountryKey: string;
        Meeting_Country_Name: string;
        multipartEventTotal?: string;
        Diplay_In_Schedule?: string;
        Global_Title: string;
        state?: string;
        Circuit_Short_Name: string;
        Meeting_Name: string;
        Meeting_Number: string;
        multipartEventMainHouseId?: string;
        Global_Meeting_Name: string;
        CircuitKey: string;
        Global_Meeting_Country_Name: string;
        MeetingKey: string;
        Series: string;
        Meeting_Location: string;
        bug: string;
        ContentCategory: string;
        sessionEndDate?: string;
        Meeting_Code: string;
        Championship_Meeting_Ordinal?: string;
        Circuit_Location?: string;
        IsTestEvent?: string;
        Meeting_Display_Date?: string;
        Meeting_Official_Name?: string;
        Meeting_Sponsor?: string;
        Scheduled_Distance?: string;
        Scheduled_Lap_Count?: string;
        Track_Length?: string;
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
      isCopyProtected: boolean;
      copyProtections: {
        securityCode: string;
        securityOption: string;
      }[];
      objectSubtype: string;
      metadataLanguage: string;
      language: string;
      season: number;
      pcLevel: number;
      pcLevelVod: string;
      pcExtendedRatings: unknown[];
      isParent: boolean;
      contractStartDate: number;
      pictureUrl: string;
      availableLanguages: {
        languageCode: string;
        languageName: string;
      }[];
      contractEndDate: number;
      externalId: string;
      advTags: string;
      shortDescription: string;
      leavingSoon: boolean;
      recentlyAdded: boolean;
      availableAlso: string[];
      pcVodLabel: string;
      isGeoBlocked: boolean;
      filter: string;
      titleBrief: string;
      comingSoon: boolean;
      isPopularEpisode: boolean;
      uiDuration: string;
      meetingKey: string;
      entitlement: string;
      locked: boolean;
      videoType: string;
      parentalAdvisory: string;
      contentSubtype: string;
      contentType: string;
      starRating: number;
      actors: unknown[];
      anchors: unknown[];
      authors: unknown[];
      directors: unknown[];
      contentOptions: unknown[];
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
        identifier: ContentVideoStreamIdentifier;
        /** `<channelId>.<language>`, for example `1033.eng`. */
        audioDefault: string;
        audioTrackNames?: Record<string, string>;
        subtitleTrackNames?: Record<string, string>;
      }[];
    };
    assets: {
      assetId: number;
      assetName: string;
      assetType: string;
      videoType: string;
      audioLanguages: ContentVideoAudioLanguage[];
    }[];
    platformVariants: {
      audioLanguages: ContentVideoAudioLanguage[];
      subtitlesLanguages: unknown[];
      cpId: number;
      videoType: string;
      pictureUrl: string;
      technicalPackages: {
        packageId: number;
        packageName: string;
        packageType: string;
      }[];
      hasTrailer: boolean;
    }[];
    popularity: {
      shortPeriod: number;
      longPeriod: number;
      allTime: number;
    };
    contentId: number;
    containers: {
      bundles?: {
        bundleSubtype: string;
        isParent: boolean;
        orderId: number;
        bundleId: number;
        bundleType: string;
      }[];
    };
    parents?: {
      parentId: number;
      parentType: string;
      parentSubType: string;
    }[];
    /** Delays between feeds, for syncing streams. */
    playbackOffsets?: {
      channelToAdjust: ContentVideoStreamIdentifier;
      channels: ContentVideoStreamIdentifier[];
      delaySeconds: number;
    }[];
    playbackOffsetsVersion?: string;
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
      meetingSessionKey: number;
    }[];
    id: number;
    layout: string;
    uiMetadata: {
      contentSubtype: string;
    };
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
      uri: string;
      httpMethod: string;
      body: string;
    };
    steering: {
      uri: string;
      httpMethod: string;
    };
    total: number;
    containers: ContentVideoContainer[];
  };

  export type EntitlementAPIResult = APIResult<EntitlementResult>;

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

  export type LiveNowAPIResult = APIResult<LiveNowResult>;

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
        bundles: {
          bundleId: number;
          bundleType: string;
          bundleSubtype: string;
          isParent: boolean;
          orderId: number;
        }[];
      };
      platformVariants: {
        cpId: number;
        subtitlesLanguages: unknown[];
        pictureUrl: string;
        /** A placeholder (`dummyvideo.m3u8`); play through contentPlay(). */
        videoUrl: string;
        audioLanguages: ContentVideoAudioLanguage[];
        hasTrailer: boolean;
        videoType: string;
        technicalPackages: {
          packageId: number;
          packageName: string;
          packageType: string;
        }[];
      }[];
      parents: {
        parentId: number;
        parentType: string;
        parentSubType: string;
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
        availableAlso: `${Platform}`[];
        title: string;
        titleBrief: string;
        objectType: string;
        duration: number;
        genres: string[];
        contentSubtype: string;
        isCopyProtected: boolean;
        copyProtections: {
          securityCode: string;
          securityOption: string;
        }[];
        contentOptions: unknown[];
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

  export type LocationAPIResult = APIResult<LocationResult>;

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

  export type PictureVariant = 'landscape_web' | 'landscape_hero_web';

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

  export type Player = 'player_bm' | 'player_tm';

  export type StreamType =
    | 'HLS'
    | 'DASH'
    | 'SDR_HD_CMAF'
    | 'SDR_HD_DASHWV_SINGLE'
    | 'SDR_HD_DASH_SINGLE'
    | 'SDR_HD_CMAFWV'
    | 'SDR_HD_DASHWV_SINGLE_AD'
    | 'SDR_HD_DASH_SINGLE_AD'
    | 'SDR_HD_CMAFWV_AD'
    | 'SDR_HD_CMAF_AD'
    | 'SDR_HD_CMAFFP'
    | 'SDR_HD_CMAF_SINGLE'
    | 'SDR_HD_CMAFFP_SINGLE'
    | 'SDR_HD_CMAFFP_AD'
    | 'SDR_HD_CMAFFP_SINGLE_AD'
    | 'SDR_HD_CMAF_SINGLE_AD';

  export type SearchVodAPIResult = APIResult<SearchVodResult>;

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
};

export type DecodedAscendonToken = JWTPayload & {
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
