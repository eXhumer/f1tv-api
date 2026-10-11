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

/**
 * Values for the `x-f1-device-info` header. Field order and names mirror the F1TV web app
 * (`device=web;screen=browser;os=…;…;p=…;tms=…`).
 */
export type F1TVDeviceInfo = {
  /** Default `web`. */
  device?: string;
  /** Default `browser`. */
  screen?: string;
  /** Lowercased OS name, e.g. `macos`, `windows`, `linux`. */
  os: string;
  /** Lowercased browser name, e.g. `chrome`, `edge`, `firefox`, `safari`. */
  browser: string;
  /** Major browser version, e.g. `155`. */
  browserVersion: string | number;
  /** Device model. Left out when unset or `none`, like the web app. */
  model?: string;
  /** OS version, e.g. `27.0.1` on macOS. */
  osVersion: string;
  /** F1TV web app version. */
  appVersion?: string;
  /** Bitmovin player version. */
  playerVersion?: string;
  /** `p`: Premium multiview. The web app only sends `true` for OPS, VIP or PREMIUM entitlements. */
  multiView?: boolean;
  /** `tms`. Left out when falsy, like the web app. */
  tms?: number;
};

/** Web app versions the defaults were taken from (F1TV web 54.2.1, 2026-10-11). */
export const DEFAULT_DEVICE_INFO = {
  device: 'web',
  screen: 'browser',
  appVersion: '54.2.1',
  playerVersion: '8.212.0',
  tms: 1,
} as const;

/** Builds an `x-f1-device-info` header value. */
export const buildDeviceInfo = (info: F1TVDeviceInfo): string => {
  const {
    device = DEFAULT_DEVICE_INFO.device,
    screen = DEFAULT_DEVICE_INFO.screen,
    os,
    browser,
    browserVersion,
    model,
    osVersion,
    appVersion = DEFAULT_DEVICE_INFO.appVersion,
    playerVersion = DEFAULT_DEVICE_INFO.playerVersion,
    multiView = false,
    tms = DEFAULT_DEVICE_INFO.tms,
  } = info;

  const parts = [
    `device=${device}`,
    `screen=${screen}`,
    `os=${os.toLowerCase()}`,
    `browser=${browser.toLowerCase()}`,
    `browserVersion=${browserVersion}`,
  ];

  if (model && model !== 'none')
    parts.push(`model=${model}`);

  parts.push(
    `osVersion=${osVersion}`,
    `appVersion=${appVersion}`,
    `playerVersion=${playerVersion}`,
    `p=${multiView}`,
  );

  if (tms)
    parts.push(`tms=${tms}`);

  return parts.join(';');
};
