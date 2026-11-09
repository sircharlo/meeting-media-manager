import { describe, expect, it } from 'vitest';

import {
  createSettingsPinResetCode,
  hashSettingsPin,
  isValidSettingsPin,
  verifySettingsPin,
} from '../settings-pin';

describe('settings PIN', () => {
  it.each([
    ['1234', true],
    ['12345678', true],
    ['123', false],
    ['123456789', false],
    ['12a4', false],
    ['', false],
  ])('treats %j as valid: %s', (pin, valid) => {
    expect(isValidSettingsPin(pin)).toBe(valid);
  });

  it('accepts the PIN it hashed and refuses another', async () => {
    const stored = await hashSettingsPin('4321');

    await expect(verifySettingsPin('4321', stored)).resolves.toBe(true);
    await expect(verifySettingsPin('4322', stored)).resolves.toBe(false);
  });

  it('never stores the PIN, and salts each hash', async () => {
    const first = await hashSettingsPin('987654');
    const second = await hashSettingsPin('987654');

    expect(first).not.toContain('987654');
    expect(first).not.toBe(second);
  });

  it('refuses everything against a damaged stored value', async () => {
    await expect(verifySettingsPin('1234', 'not-a-hash')).resolves.toBe(false);
  });

  it('makes six-digit reset codes', () => {
    expect(createSettingsPinResetCode()).toMatch(/^\d{6}$/);
  });
});
