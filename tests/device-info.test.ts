import { describe, expect, it } from 'vitest';

import * as api from '../src/index';
import { buildDeviceInfo, DEFAULT_DEVICE_INFO } from '../src/device-info';

describe('buildDeviceInfo', () => {
  it('fills in the web app’s defaults and lower-cases the OS and browser', () => {
    expect(buildDeviceInfo({ os: 'macOS', browser: 'Chrome', browserVersion: 155, osVersion: '27.0.1' })).toBe(
      `device=web;screen=browser;os=macos;browser=chrome;browserVersion=155;osVersion=27.0.1;appVersion=${DEFAULT_DEVICE_INFO.appVersion};playerVersion=${DEFAULT_DEVICE_INFO.playerVersion};p=false;tms=1`,
    );
  });

  it('uses every value given, with the model before the OS version', () => {
    expect(
      buildDeviceInfo({
        device: 'tv',
        screen: 'app',
        os: 'Windows',
        browser: 'Edge',
        browserVersion: '150',
        model: 'Surface',
        osVersion: '11',
        appVersion: '1.0',
        playerVersion: '2.0',
        multiView: true,
        tms: 5,
      }),
    ).toBe('device=tv;screen=app;os=windows;browser=edge;browserVersion=150;model=Surface;osVersion=11;appVersion=1.0;playerVersion=2.0;p=true;tms=5');
  });

  it('leaves out a model of none and a falsy tms, like the web app', () => {
    const info = buildDeviceInfo({ os: 'linux', browser: 'firefox', browserVersion: 140, osVersion: '6', model: 'none', tms: 0 });
    expect(info).not.toContain('model=');
    expect(info).not.toContain('tms=');
  });
});

describe('package entry', () => {
  it('exports the client, device info helpers and types', () => {
    expect(Object.keys(api).sort()).toEqual(['DEFAULT_DEVICE_INFO', 'F1TV', 'F1TVClient', 'buildDeviceInfo']);
    expect(api.F1TV.Language.ENGLISH).toBe('ENG');
  });
});
