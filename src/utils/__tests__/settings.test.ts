import type {
  SettingsItemAction,
  SettingsItemOption,
  SettingsItemRule,
} from 'src/types';

import { resetFeatureNudgesForCurrentProfile } from 'src/helpers/feature-nudges';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getBlockingSettingReasons,
  getBlockingSettings,
  getDateOptions,
  getRules,
  meetingTime,
  performActions,
  portNumberValidator,
} from '../settings';

// Mock error catcher
vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

vi.mock('src/helpers/feature-nudges', () => ({
  resetFeatureNudgesForCurrentProfile: vi.fn(),
}));

// Mock date utilities
vi.mock('src/utils/date', () => ({
  getDateDiff: vi.fn(),
  getSpecificWeekday: vi.fn(),
  isInPast: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Settings Utilities', () => {
  describe('portNumberValidator', () => {
    it('should validate valid port numbers', () => {
      expect(portNumberValidator('80')).toBe(true);
      expect(portNumberValidator('443')).toBe(true);
      expect(portNumberValidator('3000')).toBe(true);
      expect(portNumberValidator('65535')).toBe(true);
    });

    it('should reject invalid port numbers', () => {
      expect(portNumberValidator('0')).toBe(false);
      expect(portNumberValidator('65536')).toBe(false);
      expect(portNumberValidator('-1')).toBe(false);
      expect(portNumberValidator('abc')).toBe(false);
      expect(portNumberValidator('80.5')).toBe(false);
    });

    it('should reject empty or null values', () => {
      expect(portNumberValidator('')).toBe(false);
      expect(portNumberValidator(null as unknown as string)).toBe(false);
      expect(portNumberValidator(undefined as unknown as string)).toBe(false);
    });
  });

  describe('getDateOptions', () => {
    it('should return coTuesdays function for coTuesdays option', () => {
      const options: SettingsItemOption[] = ['coTuesdays'];
      const result = getDateOptions(options);
      expect(typeof result).toBe('function');
    });

    it('should return futureDate function for futureDate option', () => {
      const options: SettingsItemOption[] = ['futureDate'];
      const result = getDateOptions(options);
      expect(typeof result).toBe('function');
    });

    it('should return undefined for unknown options', () => {
      const options = ['unknownOption'];
      const result = getDateOptions(options as SettingsItemOption[]);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty options', () => {
      const result = getDateOptions([]);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined options', () => {
      const result = getDateOptions(undefined);
      expect(result).toBeUndefined();
    });

    it('should return first valid function when multiple options provided', () => {
      const options: SettingsItemOption[] = ['coTuesdays', 'futureDate'];
      const result = getDateOptions(options);
      expect(typeof result).toBe('function');
    });
  });

  describe('getRules', () => {
    it('should return required rule for notEmpty rule', () => {
      const rules: SettingsItemRule[] = ['notEmpty'];
      const result = getRules(rules, false);
      expect(Array.isArray(result)).toBe(true);
      expect(result?.length).toBe(1);
    });

    it('should return port number rule for portNumber rule', () => {
      const rules: SettingsItemRule[] = ['portNumber'];
      const result = getRules(rules, false);
      expect(Array.isArray(result)).toBe(true);
      expect(result?.length).toBe(1);
    });

    it('should return multiple rules when multiple rules provided', () => {
      const rules: SettingsItemRule[] = ['notEmpty', 'portNumber'];
      const result = getRules(rules, false);
      expect(Array.isArray(result)).toBe(true);
      expect(result?.length).toBe(2);
    });

    it('should return undefined for unknown rules', () => {
      const rules = ['unknownRule'];
      const result = getRules(rules as SettingsItemRule[], false);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty rules', () => {
      const result = getRules([], false);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined rules', () => {
      const result = getRules(undefined, false);
      expect(result).toBeUndefined();
    });

    it('should not return required rule when media fetching is disabled and regular rule is present', () => {
      const rules: SettingsItemRule[] = ['notEmpty', 'regular'];
      const result = getRules(rules, true);
      expect(result).toBeUndefined();
    });
  });

  describe('performActions', () => {
    it('should dispatch obsConnect event for obsConnect action', () => {
      const dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent');
      const actions: SettingsItemAction[] = ['obsConnect'];

      performActions(actions);

      expect(dispatchEventSpy).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          type: 'obsConnectFromSettings',
        }),
      );
    });

    it("resets the current profile's feature suggestions", () => {
      performActions(['resetFeatureNudges']);

      expect(resetFeatureNudgesForCurrentProfile).toHaveBeenCalledOnce();
    });

    it('should handle multiple actions', () => {
      const dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent');
      const actions: SettingsItemAction[] = ['obsConnect', 'obsConnect']; // Duplicate to test multiple calls

      performActions(actions);

      expect(dispatchEventSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle unknown actions gracefully', () => {
      const actions = ['unknownAction'];

      expect(() =>
        performActions(actions as SettingsItemAction[]),
      ).not.toThrow();
    });

    it('should handle empty actions array', () => {
      expect(() => performActions([])).not.toThrow();
    });

    it('should handle undefined actions', () => {
      expect(() => performActions(undefined)).not.toThrow();
    });
  });

  describe('getBlockingSettings', () => {
    it('names the other Zoom integration while it is on', () => {
      expect(
        getBlockingSettings({ zoomEnable: true }, 'zoomMeetingManagerEnable'),
      ).toEqual(['zoomEnable']);
      expect(
        getBlockingSettings(
          { zoomEnable: true },
          'zoomMeetingManagerSetupAssistant',
        ),
      ).toEqual(['zoomEnable']);
      expect(
        getBlockingSettings({ zoomMeetingManagerEnable: true }, 'zoomEnable'),
      ).toEqual(['zoomMeetingManagerEnable']);
    });

    it('blocks nothing while the other integration is off', () => {
      expect(
        getBlockingSettings({ zoomEnable: false }, 'zoomMeetingManagerEnable'),
      ).toEqual([]);
      expect(
        getBlockingSettings(
          { zoomMeetingManagerEnable: true },
          'obsMediaScene',
        ),
      ).toEqual([]);
      expect(getBlockingSettings(undefined, 'zoomEnable')).toEqual([]);
    });

    // Both would show the media in Zoom: OBS Studio by switching to its media
    // scene, Zoom by sharing the media window. Everything else (OBS Studio's
    // camera scene and recording, the Meeting Manager's launching, muting,
    // camera and raised hands) works together.
    const obsWithMediaScene = {
      obsEnable: true,
      obsMediaScene: 'Media',
      obsPassword: 'secret',
      obsPort: '4455',
    };

    it('keeps the OBS Studio media scene and Zoom media sharing apart', () => {
      expect(
        getBlockingSettings({ zoomEnable: true }, 'obsMediaScene'),
      ).toEqual(['zoomEnable']);
      expect(
        getBlockingSettings(
          {
            zoomMeetingManagerAutomateMediaSharing: true,
            zoomMeetingManagerEnable: true,
          },
          'obsMediaScene',
        ),
      ).toEqual(['zoomMeetingManagerAutomateMediaSharing']);
      expect(getBlockingSettings(obsWithMediaScene, 'zoomEnable')).toEqual([
        'obsMediaScene',
      ]);
      expect(
        getBlockingSettings(
          obsWithMediaScene,
          'zoomMeetingManagerAutomateMediaSharing',
        ),
      ).toEqual(['obsMediaScene']);
    });

    it('lets OBS Studio without a media scene work alongside Zoom sharing', () => {
      const obsWithoutMediaScene = {
        ...obsWithMediaScene,
        obsMediaScene: null,
      };
      expect(getBlockingSettings(obsWithoutMediaScene, 'zoomEnable')).toEqual(
        [],
      );
      expect(
        getBlockingSettings(
          obsWithoutMediaScene,
          'zoomMeetingManagerAutomateMediaSharing',
        ),
      ).toEqual([]);
      expect(getBlockingSettings({ zoomEnable: true }, 'obsEnable')).toEqual(
        [],
      );
      // A media scene left over while OBS Studio is off doesn't count
      expect(
        getBlockingSettings(
          { ...obsWithMediaScene, obsEnable: false },
          'zoomEnable',
        ),
      ).toEqual([]);
    });

    it("doesn't let OBS Studio block the rest of the Zoom Meeting Manager", () => {
      expect(
        getBlockingSettings(obsWithMediaScene, 'zoomMeetingManagerEnable'),
      ).toEqual([]);
      // Media sharing only counts while the Meeting Manager itself is on
      expect(
        getBlockingSettings(
          {
            zoomMeetingManagerAutomateMediaSharing: true,
            zoomMeetingManagerEnable: false,
          },
          'obsMediaScene',
        ),
      ).toEqual([]);
    });

    it('says to turn a blocking toggle off, and to clear a blocking scene', () => {
      expect(
        getBlockingSettingReasons(obsWithMediaScene, 'zoomEnable'),
      ).toEqual([
        {
          messageKey: 'setting-unavailable-while-set',
          setting: 'obsMediaScene',
        },
      ]);
      expect(
        getBlockingSettingReasons({ zoomEnable: true }, 'obsMediaScene'),
      ).toEqual([
        {
          messageKey: 'setting-unavailable-while-enabled',
          setting: 'zoomEnable',
        },
      ]);
    });

    it('never locks a scene that is set, so it can be cleared', () => {
      expect(
        getBlockingSettings(
          { ...obsWithMediaScene, zoomEnable: true },
          'obsMediaScene',
        ),
      ).toEqual([]);
    });

    it('never locks a toggle that is on, so it can be turned off', () => {
      expect(
        getBlockingSettings(
          { zoomEnable: true, zoomMeetingManagerEnable: true },
          'zoomEnable',
        ),
      ).toEqual([]);
    });
  });

  describe('meetingTime', () => {
    it('should validate valid meeting times', () => {
      expect(meetingTime(9, 30)).toBe(true);
      expect(meetingTime(19, 0)).toBe(true);
      expect(meetingTime(14, 15)).toBe(true);
    });

    it('should reject times outside valid range (8-22 hours)', () => {
      expect(meetingTime(7, 0)).toBe(false);
      expect(meetingTime(23, 0)).toBe(false);
      expect(meetingTime(6, 30)).toBe(false);
      expect(meetingTime(22, 45)).toBe(false);
    });

    it('should handle null minutes', () => {
      expect(meetingTime(9, null)).toBe(true);
      expect(meetingTime(7, null)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(meetingTime(8, 0)).toBe(true);
      expect(meetingTime(22, 0)).toBe(true);
      expect(meetingTime(8, 5)).toBe(true);
      expect(meetingTime(21, 55)).toBe(true);
    });
  });
});
