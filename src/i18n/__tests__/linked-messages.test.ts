import {
  compiles,
  fixLinkedMessageSyntax,
} from 'app/scripts/fix-i18n-locales.mjs';
import et from 'src/i18n/et.json';
import { describe, expect, it } from 'vitest';

// Crowdin's web editor re-introduces typographic quotes inside vue-i18n
// linked-message syntax (`@:{‚key‘}` instead of `@:{'key'}`), which the
// message compiler rejects and used to fail `yarn test:unit --check`,
// blocking the whole Build pipeline (Nov 2026: Estonian
// `media-decode-failed-explain` broke master and every dependabot PR).
// The dev/build/test scripts now self-heal by running the fixer without
// `--check` before anything else; this test guards the fixer itself.
describe('i18n linked-message syntax', () => {
  it('repairs typographic quotes around a linked key', () => {
    expect(fixLinkedMessageSyntax('@:{\u201afehler\u2018}')).toBe(
      "@:{'fehler'}",
    );
  });

  it('repairs stray whitespace after @:', () => {
    expect(fixLinkedMessageSyntax('@: settings')).toBe('@:settings');
  });

  it('leaves valid messages alone', () => {
    expect(fixLinkedMessageSyntax('@:settings')).toBe('@:settings');
    expect(fixLinkedMessageSyntax("@:{'settings'}")).toBe("@:{'settings'}");
  });

  it('repairs the Estonian regression string from Nov 2026', () => {
    const broken =
      'Seda videot ei olnud v\u00f5imalik sellel seadmel dekodeerida, seet\u00f5ttu j\u00e4eti see vahele. Kui see juhtub korduvalt, v\u00f5ib abiks olla seadete men\u00fc\u00fcs valiku \u201e@:{\u201adisableHardwareAcceleration\u2018}\u201c sissel\u00fclitamine.';
    expect(compiles(broken)).toBe(false);
    const fixed = fixLinkedMessageSyntax(broken);
    expect(compiles(fixed)).toBe(true);
    expect(fixed).toContain("@:{'disableHardwareAcceleration'}");
  });

  it('current Estonian media-decode-failed-explain compiles', () => {
    const message = et['media-decode-failed-explain'] as string;
    expect(compiles(message)).toBe(true);
  });
});
